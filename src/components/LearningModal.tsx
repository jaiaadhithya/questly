import { useEffect, useState } from "react";
import { X, Play, CheckCircle2, ArrowRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getVideosForTopic, pingGemini, generateMiniQuizForTopic } from "@/lib/gemini";
import { localStore } from "@/lib/localStore";

interface LearningModalProps {
  isOpen: boolean;
  onClose: () => void;
  checkpoint?: {
    id: number;
    title: string;
    progress: number;
    video_url?: string | null;
  };
  studyId?: string | null;
}

// Mini quiz items generated dynamically via Gemini

const LearningModal = ({ isOpen, onClose, checkpoint, studyId }: LearningModalProps) => {
  const [showQuiz, setShowQuiz] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [quizItems, setQuizItems] = useState<Array<{ question: string; options: string[]; correctIndex: number }>>([]);
  const [quizLoading, setQuizLoading] = useState(false);
  const [resolvedEmbedSrc, setResolvedEmbedSrc] = useState<string | null>(null);
  const cseEnabled = Boolean(import.meta.env.VITE_GOOGLE_CSE_API_KEY && import.meta.env.VITE_GOOGLE_CSE_CX);

  const handleVideoEnd = async () => {
    // User-driven: generate the mini quiz only after pressing the button
    setShowQuiz(true);
    if (!checkpoint?.title) return;
    try {
      setQuizLoading(true);
      setQuizItems([]);
      const items = await generateMiniQuizForTopic(checkpoint.title, 1);
      setQuizItems(items);
    } catch (e) {
      console.warn('[learning-modal] mini quiz generation failed', e);
    } finally {
      setQuizLoading(false);
    }
  };

  const handleQuizSubmit = () => {
    if (selectedAnswer === null) {
      toast.error("Please select an answer");
      return;
    }
    
    const item = quizItems[0];
    const correctIndex = item?.correctIndex ?? 0;
    if (selectedAnswer === correctIndex) {
      toast.success("Correct! Checkpoint completed! 🎉");
      setTimeout(() => {
        setShowQuiz(false);
        setSelectedAnswer(null);
        onClose();
      }, 1500);
    } else {
      toast.error("Not quite. Try watching the video again!");
    }
  };

  useEffect(() => {
    if (!isOpen || !checkpoint) {
      // Reset embed and quiz when closed or missing checkpoint
      setResolvedEmbedSrc(null);
      setShowQuiz(false);
      setSelectedAnswer(null);
      setQuizItems([]);
      setQuizLoading(false);
      return;
    }
    // Fresh modal open for a checkpoint: reset quiz state, keep video-first
    setShowQuiz(false);
    setSelectedAnswer(null);
    setQuizItems([]);
    setQuizLoading(false);
    // Connectivity check: ask Gemini to say hi (debug)
    pingGemini('hi').then((text) => {
      console.log('[learning-modal] gemini ping (raw):', text);
    });
    // Try to resolve embed src from provided video_url; if missing, ask Gemini for a link
    const toEmbed = (url?: string | null) => {
      if (!url) return null;
      try {
        const u = new URL(url);
        if (u.hostname.includes('youtu.be')) {
          const id = u.pathname.replace('/', '');
          return `https://www.youtube.com/embed/${id}`;
        }
        if (u.hostname.includes('youtube.com')) {
          const vid = u.searchParams.get('v');
          if (vid) return `https://www.youtube.com/embed/${vid}`;
          if (u.pathname.startsWith('/embed/')) return url;
          if (u.pathname.startsWith('/shorts/')) {
            const id = u.pathname.split('/shorts/')[1];
            if (id) return `https://www.youtube.com/embed/${id}`;
          }
        }
      } catch {}
      return null;
    };

    const existing = toEmbed(checkpoint.video_url);
    if (existing) {
      setResolvedEmbedSrc(existing);
      return;
    }

    // No valid embed yet — fetch via CSE/YouTube
    let cancelled = false;
    (async () => {
      try {
        console.log('[learning-modal] fetching video via search for topic', checkpoint.title);
        const urls = await getVideosForTopic(checkpoint.title, 3);
        console.log('[learning-modal] candidate URLs', urls);
        const embedCandidate = urls.map(u => toEmbed(u)).find(Boolean) || null;
        console.log('[learning-modal] chosen embed', embedCandidate);
        if (!cancelled) {
          setResolvedEmbedSrc(embedCandidate || null);
          // Persist into local store if studyId is available
          if (studyId && embedCandidate) {
            const topics = localStore.getTopics(studyId) || [];
            const idx = topics.findIndex(t => t.checkpoint_name === checkpoint.title);
            if (idx !== -1) {
              const rawUrl = urls.find(u => toEmbed(u) === embedCandidate) || urls[0];
              topics[idx] = { ...topics[idx], video_url: rawUrl };
              localStore.setTopics(studyId, topics);
              console.log('[learning-modal] saved video URL to local store');
            }
          }
        }
      } catch (err) {
        console.warn('[learning-modal] search-based video lookup failed', err);
        if (!cancelled) setResolvedEmbedSrc(null);
      }
    })();
    return () => { cancelled = true; };
  }, [isOpen, checkpoint?.title]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card/95 backdrop-blur-xl border-primary/30">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Play className="w-6 h-6 text-primary" />
            {checkpoint?.title || 'Learning'}
          </DialogTitle>
        </DialogHeader>

        {!showQuiz ? (
          <div className="space-y-6">
            {/* Video Player */}
            <div className="aspect-video bg-background rounded-xl overflow-hidden border border-border flex items-center justify-center">
              {resolvedEmbedSrc ? (
                <iframe
                  width="100%"
                  height="100%"
                  src={resolvedEmbedSrc}
                  title="Learning Video"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="text-center p-6 text-muted-foreground space-y-1">
                  <p>Finding the best learning video…</p>
                  <p className="text-xs">Powered by Google search</p>
                </div>
              )}
            </div>

            {/* Video Description */}
            <div className="bg-background/50 rounded-xl p-6 border border-border/50">
              <h3 className="text-lg font-semibold mb-2">Learning Objectives</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-secondary mt-0.5" />
                  <span>Understand the core concepts of {checkpoint?.title || 'this topic'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-secondary mt-0.5" />
                  <span>Apply practical examples in real projects</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-secondary mt-0.5" />
                  <span>Master common patterns and best practices</span>
                </li>
              </ul>
            </div>

            {/* Complete Video Button */}
            <Button
              onClick={handleVideoEnd}
              size="lg"
              className="w-full gradient-primary rounded-xl hover:scale-[1.02] transition-transform"
            >
              Complete Video & Take Quiz
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Mini Quiz */}
            <div className="bg-background/50 rounded-xl p-6 border border-border/50">
              <h3 className="text-xl font-semibold mb-4">
                {quizLoading || !quizItems.length ? 'Generating question…' : quizItems[0]?.question}
              </h3>
              {quizLoading || !quizItems.length ? (
                <div className="space-y-3">
                  {[0,1,2,3].map((idx) => (
                    <div key={idx} className="p-4 rounded-lg border-2 border-border/50 bg-muted/20 animate-pulse h-12" />
                  ))}
                </div>
              ) : (
                <RadioGroup value={selectedAnswer?.toString()} onValueChange={(val) => setSelectedAnswer(parseInt(val))}>
                  <div className="space-y-3">
                    {quizItems[0]?.options.map((option, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer ${
                          selectedAnswer === idx
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        }`}
                        onClick={() => setSelectedAnswer(idx)}
                      >
                        <RadioGroupItem value={idx.toString()} id={`quiz-option-${idx}`} />
                        <Label htmlFor={`quiz-option-${idx}`} className="flex-1 cursor-pointer">
                          {option}
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              )}
            </div>

            <Button
              onClick={handleQuizSubmit}
              size="lg"
              disabled={quizLoading || !quizItems.length}
              className="w-full gradient-accent rounded-xl hover:scale-[1.02] transition-transform"
            >
              Submit Answer
              <CheckCircle2 className="w-5 h-5 ml-2" />
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default LearningModal;
