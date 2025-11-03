import { useState } from "react";
import { X, Play, CheckCircle2, ArrowRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface LearningModalProps {
  isOpen: boolean;
  onClose: () => void;
  checkpoint?: {
    id: number;
    title: string;
    progress: number;
  };
}

const miniQuiz = [
  {
    question: "What did you learn about React hooks?",
    options: [
      "They replace class components",
      "They allow state in functional components",
      "They are only for styling",
      "They handle routing"
    ],
    correct: 1
  }
];

const LearningModal = ({ isOpen, onClose, checkpoint }: LearningModalProps) => {
  const [showQuiz, setShowQuiz] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  const handleVideoEnd = () => {
    setShowQuiz(true);
  };

  const handleQuizSubmit = () => {
    if (selectedAnswer === null) {
      toast.error("Please select an answer");
      return;
    }
    
    if (selectedAnswer === miniQuiz[0].correct) {
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

  if (!checkpoint) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card/95 backdrop-blur-xl border-primary/30">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Play className="w-6 h-6 text-primary" />
            {checkpoint.title}
          </DialogTitle>
        </DialogHeader>

        {!showQuiz ? (
          <div className="space-y-6">
            {/* Video Player */}
            <div className="aspect-video bg-background rounded-xl overflow-hidden border border-border">
              <iframe
                width="100%"
                height="100%"
                src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                title="Learning Video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            {/* Video Description */}
            <div className="bg-background/50 rounded-xl p-6 border border-border/50">
              <h3 className="text-lg font-semibold mb-2">Learning Objectives</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-secondary mt-0.5" />
                  <span>Understand the core concepts of {checkpoint.title}</span>
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
              <h3 className="text-xl font-semibold mb-4">{miniQuiz[0].question}</h3>

              <RadioGroup value={selectedAnswer?.toString()} onValueChange={(val) => setSelectedAnswer(parseInt(val))}>
                <div className="space-y-3">
                  {miniQuiz[0].options.map((option, idx) => (
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
            </div>

            <Button
              onClick={handleQuizSubmit}
              size="lg"
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
