import { useNavigate } from "react-router-dom";
import { Trophy, Star, Award, Download, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import Confetti from "react-confetti";
import { useEffect, useState } from "react";

const Mastery = () => {
  const navigate = useNavigate();
  const [showConfetti, setShowConfetti] = useState(true);
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener("resize", handleResize);
    
    const timer = setTimeout(() => setShowConfetti(false), 5000);
    
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timer);
    };
  }, []);

  const stats = [
    { label: "Topics Mastered", value: "7", icon: <Star className="w-6 h-6" /> },
    { label: "Videos Watched", value: "12", icon: <Award className="w-6 h-6" /> },
    { label: "Quizzes Passed", value: "15", icon: <Trophy className="w-6 h-6" /> }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-8 relative overflow-hidden">
      {showConfetti && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={500}
        />
      )}

      {/* Background glow */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/20 rounded-full blur-3xl animate-pulse-glow" />
      </div>

      <div className="max-w-4xl w-full relative z-10 animate-slide-up">
        {/* Main Achievement Card */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-32 h-32 rounded-full gradient-accent mb-6 animate-float glow-accent">
            <Trophy className="w-16 h-16" />
          </div>
          
          <h1 className="text-6xl font-bold mb-4 bg-clip-text text-transparent gradient-accent">
            Mastery Achieved!
          </h1>
          
          <p className="text-2xl text-muted-foreground mb-2">
            Congratulations on completing your learning journey
          </p>
          
          <div className="flex items-center justify-center gap-2 text-primary">
            <Star className="w-5 h-5 fill-current" />
            <Star className="w-5 h-5 fill-current" />
            <Star className="w-5 h-5 fill-current" />
            <Star className="w-5 h-5 fill-current" />
            <Star className="w-5 h-5 fill-current" />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className="bg-card/50 backdrop-blur-sm rounded-2xl p-6 border border-border/50 card-shadow text-center hover:scale-105 transition-transform"
              style={{ animationDelay: `${idx * 0.1}s` }}
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4">
                {stat.icon}
              </div>
              <div className="text-4xl font-bold mb-2 bg-clip-text text-transparent gradient-primary">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Achievements */}
        <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-8 border border-border/50 card-shadow mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Award className="w-6 h-6 text-accent" />
            Badges Earned
          </h2>
          
          <div className="grid grid-cols-4 gap-4">
            {["🎯", "🚀", "💎", "⚡", "🎓", "🏆", "🌟", "🔥"].map((emoji, idx) => (
              <div
                key={idx}
                className="aspect-square bg-gradient-to-br from-primary/20 to-secondary/20 rounded-xl flex items-center justify-center text-4xl hover:scale-110 transition-transform cursor-pointer"
              >
                {emoji}
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={() => navigate("/")}
            size="lg"
            variant="outline"
            className="rounded-xl border-primary/30 hover:bg-primary/10"
          >
            <Home className="w-5 h-5 mr-2" />
            Start New Journey
          </Button>
          
          <Button
            size="lg"
            className="gradient-accent rounded-xl hover:scale-105 transition-transform glow-accent"
          >
            <Download className="w-5 h-5 mr-2" />
            Download Certificate
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Mastery;
