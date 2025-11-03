import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { CheckCircle, Circle, ArrowRight, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { localStore } from "@/lib/localStore";

type QuizItem = { question: string; options: string[]; answer: string };

const Quiz = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const studyId = params.get('studyId');
  const [questions, setQuestions] = useState<QuizItem[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        if (!studyId) return;
        const cached = localStore.getQuiz(studyId);
        setQuestions(cached);
      } catch (err) {
        console.error('Failed to load quiz questions:', err);
        toast.error('Failed to load quiz.');
      }
    };
    fetchQuestions();
  }, [studyId]);

  const progress = questions.length > 0 ? ((currentQuestion + 1) / questions.length) * 100 : 0;

  const handleNext = () => {
    if (selectedAnswer === null) {
      toast.error("Please select an answer");
      return;
    }

    const newAnswers = [...answers, selectedAnswer];
    setAnswers(newAnswers);

    if (questions.length > 0 && currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
    } else {
      toast.success("Quiz completed! Generating your learning roadmap...");
      // Mark assessment as completed for this study
      if (studyId) {
        try {
          localStore.updateStudy(studyId, { assessment_completed: true });
        } catch (e) {
          console.warn('[quiz] failed to mark assessment completed', e);
        }
      }
      setTimeout(() => navigate(`/roadmap${studyId ? `?studyId=${studyId}` : ''}`), 1500);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-3xl w-full animate-slide-up">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <Brain className="w-8 h-8 text-primary animate-pulse-glow" />
            <h1 className="text-4xl font-bold">Knowledge Assessment</h1>
          </div>
          <p className="text-muted-foreground">
            Help us understand your current knowledge level
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">
              Question {currentQuestion + 1} of {questions.length || 0}
            </span>
            <span className="text-primary font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question Card */}
        <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-8 border border-border/50 card-shadow mb-8">
          <h2 className="text-2xl font-semibold mb-6">
            {questions[currentQuestion]?.question || 'Loading question...'}
          </h2>

          <RadioGroup value={selectedAnswer?.toString()} onValueChange={(val) => setSelectedAnswer(parseInt(val))}>
            <div className="space-y-4">
              {(questions[currentQuestion]?.options || []).map((option, idx) => (
                <div
                  key={idx}
                  className={`flex items-center space-x-3 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                    selectedAnswer === idx
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50 hover:bg-card"
                  }`}
                  onClick={() => setSelectedAnswer(idx)}
                >
                  <RadioGroupItem value={idx.toString()} id={`option-${idx}`} />
                  <Label htmlFor={`option-${idx}`} className="flex-1 cursor-pointer text-base">
                    {option}
                  </Label>
                  {selectedAnswer === idx && (
                    <CheckCircle className="w-5 h-5 text-primary" />
                  )}
                </div>
              ))}
            </div>
          </RadioGroup>
        </div>

        {/* Navigation */}
        <div className="flex justify-end">
          <Button
            onClick={handleNext}
            size="lg"
            className="gradient-primary px-8 rounded-xl hover:scale-105 transition-transform"
          >
            {questions.length > 0 && currentQuestion < questions.length - 1 ? "Next Question" : "Complete Quiz"}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Quiz;
