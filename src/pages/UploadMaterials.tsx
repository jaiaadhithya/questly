import { useState, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { Upload as UploadIcon, FileText, BookOpen, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import UploadCard from "@/components/UploadCard";
// Supabase disabled: use local store only
import { localStore } from "@/lib/localStore";
import { parseFiles } from "@/lib/fileParser";
import { generateQuizQuestions, pingOllama, reformatQuizWithOllama } from "@/lib/ollama";
import { getVideosForTopic, generateQuizQuestionsWithGemini, generateCheckpointsWithGemini } from "@/lib/gemini";
import { notifyN8N } from "@/lib/n8n";

const UploadMaterials = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const [slides, setSlides] = useState<File[]>([]);
  const [questions, setQuestions] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [studyId, setStudyId] = useState<string | null>(null);

  // Extract studyId from URL parameters or query parameters
  useEffect(() => {
    // First check URL params (from route)
    const urlParamId = params.studyId;
    
    // Then check query params
    const queryParams = new URLSearchParams(location.search);
    const queryParamId = queryParams.get('studyId');
    
    const id = urlParamId || queryParamId;
    setStudyId(id);
    
    // If no studyId is provided, create a new study
    if (!id) {
      createNewStudy();
    }
  }, [location, params]);
  
  const createNewStudy = async () => {
    const study = localStore.createStudy();
    notifyN8N('study_created', { studyId: study.id });
    navigate(`/upload-materials?studyId=${study.id}`);
  };

  const handleFileUpload = async (file: File, fileType: 'slide' | 'pqp') => {
    try {
      if (!studyId) {
        toast.error("No study ID found. Please try again.");
        return false;
      }
      // Local-only: create a blob URL for preview purposes
      const url = URL.createObjectURL(file);
      localStore.addUpload(studyId, {
        file_name: file.name,
        file_type: fileType,
        file_url: url,
        upload_date: new Date().toISOString(),
      });
      
      toast.success(`${file.name} uploaded successfully!`);
      return true;
    } catch (error) {
      console.error(`Error uploading ${file.name}:`, error);
      toast.error(`Failed to upload ${file.name}`);
      return false;
    }
  };

  const handleProceed = async () => {
    if (slides.length === 0 && questions.length === 0) {
      toast.error("Please upload at least one file to proceed");
      return;
    }

    setUploading(true);
    const controller = new AbortController();
    setAbortController(controller);
    try {
      // Pin Ollama model to gemma3:4b and parse files
      try { localStorage.setItem('ollama:model', 'gemma3:4b'); } catch {}
      console.log('[upload] using ollama model gemma3:4b');
      // Parse all uploaded files
      const allFiles = [...slides, ...questions];
      const parsedContents = await parseFiles(allFiles, studyId || '');
      console.log('[upload] parsed files', { filesCount: allFiles.length, parsedContentsCount: parsedContents.length });
      notifyN8N('upload_processed', { studyId, files: allFiles.map(f => f.name) });
      
      // Combine all parsed text
      const combinedText = parsedContents.map(content => content.text).join("\n\n");
      console.log('[upload] combined text length', { len: combinedText.length });
      if (!combinedText || combinedText.trim().length === 0) {
        toast.error('Parsed content is empty. Please upload readable files.');
        return;
      }
      
      // Check Ollama connectivity before quiz generation
      const ping = await pingOllama();
      if (ping.ok) {
        console.log('[upload] ollama connected', { model: ping.model });
      } else {
        console.error('[upload] ollama not reachable', ping.error);
        toast.error("Ollama is not reachable. Please ensure it's running with gemma3:4b.");
        return;
      }

      // Generate a small, fast quiz (3 questions) via Gemini first, then Ollama echo
      let quizQuestions;
      try {
        const geminiItems = await generateQuizQuestionsWithGemini(combinedText, 3);
        quizQuestions = await reformatQuizWithOllama(geminiItems, { signal: controller.signal });
        console.log('[upload] quiz generated (gemini-first, echoed locally)', { count: quizQuestions.length });
      } catch (err: any) {
        console.warn('[upload] gemini-first generation failed; attempting local generation instead', err);
        try {
          quizQuestions = await generateQuizQuestions(combinedText, 3, { signal: controller.signal });
          console.log('[upload] quiz generated (local)', { count: quizQuestions.length });
        } catch (err2) {
          console.error('[upload] local quiz generation failed', err2);
          throw err2;
        }
      }
      if (!quizQuestions || quizQuestions.length === 0) {
        toast.error('Failed to generate quiz questions. Please try again.');
        return;
      }

      // Local fallback: cache generated questions in localStorage for Quiz page
      try {
        localStorage.setItem(`quiz:${studyId}`, JSON.stringify(quizQuestions));
        console.log('[upload] cached quiz to localStorage');
      } catch (e) {
        console.warn('[upload] failed to cache quiz locally', e);
      }
      
      // Store quiz questions in database
      // Local-only: persist quiz in local storage
      localStore.setQuiz(studyId!, quizQuestions);
      
      // Generate checkpoints/topics with Gemini (intelligent titles)
      const checkpoints = await generateCheckpointsWithGemini(combinedText, 6);
      console.log('[upload] checkpoints (gemini) generated', { count: checkpoints.length });

      // For each checkpoint, find top video via Gemini+YouTube
      const topicsWithVideos = await Promise.all(checkpoints.map(async (c) => {
        let videoUrl: string | null = null;
        try {
          const videos = await getVideosForTopic(c.checkpoint, 1);
          videoUrl = videos[0] || null;
        } catch (e) {
          console.error('Video retrieval failed for topic', c.checkpoint, e);
        }
        return {
          checkpoint_name: c.checkpoint,
          order: c.order,
          video_url: videoUrl,
        };
      }));

      // Persist topics with videos in local storage
      localStore.setTopics(studyId!, topicsWithVideos);
      
      // Update study status
      localStore.updateStudy(studyId!, { status: 'in_progress', progress: 25 });

      notifyN8N('study_generated', {
        studyId,
        quizCount: quizQuestions.length,
        topicCount: checkpoints.length,
      });
      
      // Log topics with videos for verification
      console.log('[upload] topics with videos', topicsWithVideos);
      toast.success("Files processed successfully! Let's take your quiz first.");
      
      // Navigate to quiz page (do not skip quiz)
      navigate(`/quiz?studyId=${studyId}`);
    } catch (error) {
      console.error("Error processing files:", error);
      toast.error("Error processing files. Please try again.");
    } finally {
      setUploading(false);
      setAbortController(null);
    }
  };

  const handleCancel = () => {
    try {
      abortController?.abort();
      toast.warning('Generation cancelled');
    } catch {}
    setUploading(false);
    setAbortController(null);
  };

  return (
    <div className="container max-w-6xl mx-auto py-8">
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Upload Materials</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Lecture Slides Upload */}
          <UploadCard
            title="Lecture Slides"
            description="Upload your lecture slides (PDF, PPT)"
            icon={<BookOpen className="w-6 h-6" />}
            accept=".pdf,.ppt,.pptx"
            files={slides}
            onFilesChange={(files) => setSlides(files)}
          />

          {/* Past Questions Upload */}
          <UploadCard
            title="Past Questions"
            description="Upload past question papers (PDF)"
            icon={<FileText className="w-6 h-6" />}
            accept=".pdf,.doc,.docx"
            files={questions}
            onFilesChange={(files) => setQuestions(files)}
          />
        </div>

        {/* My Uploads */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">My Uploads</h2>
          <div className="bg-card rounded-lg p-4 space-y-2">
            {slides.length === 0 && questions.length === 0 ? (
              <p className="text-muted-foreground">No files uploaded yet</p>
            ) : (
              <>
                {slides.map((file, index) => (
                  <div key={`slide-${index}`} className="flex items-center gap-2 p-2 bg-background rounded">
                    <BookOpen className="w-4 h-4 text-primary" />
                    <span>{file.name}</span>
                  </div>
                ))}
                {questions.map((file, index) => (
                  <div key={`question-${index}`} className="flex items-center gap-2 p-2 bg-background rounded">
                    <FileText className="w-4 h-4 text-primary" />
                    <span>{file.name}</span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Proceed Button */}
        <div className="flex justify-center gap-4">
          <Button
            onClick={handleProceed}
            size="lg"
            className="gradient-primary text-lg px-8 py-6 rounded-xl hover:scale-105 transition-transform glow-primary"
            disabled={slides.length === 0 && questions.length === 0 || uploading}
          >
            <Sparkles className="w-5 h-5 mr-2" />
            {uploading ? "Processing..." : "Generate My Learning Path"}
          </Button>
          {uploading && (
            <Button
              onClick={handleCancel}
              variant="destructive"
              className="text-lg px-6 py-6 rounded-xl"
            >
              Cancel
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadMaterials;
