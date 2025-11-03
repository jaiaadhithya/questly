import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload as UploadIcon, FileText, BookOpen, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import UploadCard from "@/components/UploadCard";

const Upload = () => {
  const navigate = useNavigate();
  const [slides, setSlides] = useState<File[]>([]);
  const [questions, setQuestions] = useState<File[]>([]);

  const handleProceed = () => {
    if (slides.length === 0 && questions.length === 0) {
      toast.error("Please upload at least one file to continue");
      return;
    }
    toast.success("Files uploaded! Generating your personalized quiz...");
    setTimeout(() => navigate("/quiz"), 1000);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "1s" }} />
      </div>

      <div className="max-w-6xl w-full z-10 animate-slide-up">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-4">
            <Sparkles className="w-8 h-8 text-primary animate-pulse-glow" />
            <h1 className="text-5xl font-bold bg-clip-text text-transparent gradient-primary">
              EduPath AI
            </h1>
          </div>
          <p className="text-xl text-muted-foreground">
            Upload your materials and start your personalized learning journey
          </p>
        </div>

        {/* Upload Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <UploadCard
            title="Lecture Slides"
            description="Upload your presentation files (PDF, PPTX)"
            icon={<FileText className="w-6 h-6" />}
            accept=".pdf,.pptx,.ppt"
            files={slides}
            onFilesChange={setSlides}
          />
          <UploadCard
            title="Past Questions"
            description="Upload previous exam papers (PDF, DOCX)"
            icon={<BookOpen className="w-6 h-6" />}
            accept=".pdf,.docx,.doc"
            files={questions}
            onFilesChange={setQuestions}
          />
        </div>

        {/* Uploaded Files List */}
        {(slides.length > 0 || questions.length > 0) && (
          <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-border/50 card-shadow">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <UploadIcon className="w-5 h-5 text-primary" />
              My Uploads
            </h3>
            <div className="space-y-2">
              {slides.map((file, idx) => (
                <div key={`slide-${idx}`} className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-primary" />
                    <span className="text-sm">{file.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">Slide</span>
                </div>
              ))}
              {questions.map((file, idx) => (
                <div key={`question-${idx}`} className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-4 h-4 text-secondary" />
                    <span className="text-sm">{file.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">Past Paper</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Proceed Button */}
        <div className="flex justify-center">
          <Button
            onClick={handleProceed}
            size="lg"
            className="gradient-primary text-lg px-8 py-6 rounded-xl hover:scale-105 transition-transform glow-primary"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Generate My Learning Path
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Upload;
