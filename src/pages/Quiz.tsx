import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, Circle, ArrowRight, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

const quizQuestions = [
  {
    question: "What is the primary purpose of React hooks?",
    options: [
      "To style components",
      "To manage state and side effects in functional components",
      "To create class components",
      "To handle routing"
    ],
    correct: 1
  },
  {
    question: "Which data structure uses LIFO principle?",
    options: ["Queue", "Stack", "Tree", "Graph"],
    correct: 1
  },
  {
    question: "What does API stand for?",
    options: [
      "Application Programming Interface",
      "Advanced Program Integration",
      "Automated Process Interaction",
      "Application Process Interface"
    ],
    correct: 0
  }
];

const Quiz = () => {
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  const progress = ((currentQuestion + 1) / quizQuestions.length) * 100;

  const handleNext = () => {
    if (selectedAnswer === null) {
      toast.error("Please select an answer");
      return;
    }

    const newAnswers = [...answers, selectedAnswer];
    setAnswers(newAnswers);

    if (currentQuestion < quizQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
    } else {
      toast.success("Quiz completed! Generating your learning roadmap...");
      setTimeout(() => navigate("/roadmap"), 1500);
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
              Question {currentQuestion + 1} of {quizQuestions.length}
            </span>
            <span className="text-primary font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question Card */}
        <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-8 border border-border/50 card-shadow mb-8">
          <h2 className="text-2xl font-semibold mb-6">
            {quizQuestions[currentQuestion].question}
          </h2>

          <RadioGroup value={selectedAnswer?.toString()} onValueChange={(val) => setSelectedAnswer(parseInt(val))}>
            <div className="space-y-4">
              {quizQuestions[currentQuestion].options.map((option, idx) => (
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
            {currentQuestion < quizQuestions.length - 1 ? "Next Question" : "Complete Quiz"}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Quiz;
