import { useState } from "react";
import { MapPin, Play, CheckCircle2, Lock } from "lucide-react";
import LearningModal from "@/components/LearningModal";
import ChatPanel from "@/components/ChatPanel";

const checkpoints = [
  { id: 1, title: "Introduction to React", progress: 100, unlocked: true },
  { id: 2, title: "State Management", progress: 100, unlocked: true },
  { id: 3, title: "Component Lifecycle", progress: 50, unlocked: true },
  { id: 4, title: "React Hooks Deep Dive", progress: 0, unlocked: true },
  { id: 5, title: "Advanced Patterns", progress: 0, unlocked: false },
  { id: 6, title: "Performance Optimization", progress: 0, unlocked: false },
  { id: 7, title: "Testing & Debugging", progress: 0, unlocked: false },
  { id: 8, title: "Mastery", progress: 0, unlocked: false, isFinal: true }
];

const Roadmap = () => {
  const [selectedCheckpoint, setSelectedCheckpoint] = useState<number | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <div className="min-h-screen p-8 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-16 animate-slide-up">
          <h1 className="text-5xl font-bold mb-4 bg-clip-text text-transparent gradient-primary">
            Your Learning Journey
          </h1>
          <p className="text-xl text-muted-foreground">
            Follow the path to mastery, one checkpoint at a time
          </p>
        </div>

        {/* Roadmap */}
        <div className="relative max-w-4xl mx-auto">
          {/* Connecting Path Line */}
          <svg
            className="absolute left-1/2 top-0 -translate-x-1/2 w-1 h-full"
            style={{ zIndex: 0 }}
          >
            <line
              x1="50%"
              y1="0"
              x2="50%"
              y2="100%"
              stroke="url(#lineGradient)"
              strokeWidth="3"
              strokeDasharray="8 4"
              className="path-line"
            />
            <defs>
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="hsl(189 94% 43%)" />
                <stop offset="50%" stopColor="hsl(174 72% 56%)" />
                <stop offset="100%" stopColor="hsl(38 92% 50%)" />
              </linearGradient>
            </defs>
          </svg>

          {/* Checkpoints */}
          <div className="space-y-12 relative z-10">
            {checkpoints.map((checkpoint, idx) => (
              <div
                key={checkpoint.id}
                className={`flex items-center gap-6 ${
                  idx % 2 === 0 ? "flex-row" : "flex-row-reverse"
                }`}
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                {/* Card */}
                <div
                  className={`flex-1 animate-slide-up ${
                    checkpoint.unlocked ? "cursor-pointer" : "cursor-not-allowed"
                  }`}
                  onClick={() => checkpoint.unlocked && !checkpoint.isFinal && setSelectedCheckpoint(checkpoint.id)}
                >
                  <div
                    className={`relative group bg-card/50 backdrop-blur-sm rounded-2xl p-6 border-2 transition-all card-shadow ${
                      checkpoint.progress === 100
                        ? "border-secondary glow-accent"
                        : checkpoint.unlocked
                        ? "border-primary/50 hover:border-primary hover:scale-[1.02]"
                        : "border-border/30 opacity-60"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-xl font-semibold">{checkpoint.title}</h3>
                      {checkpoint.progress === 100 ? (
                        <CheckCircle2 className="w-6 h-6 text-secondary" />
                      ) : checkpoint.unlocked ? (
                        <Play className="w-6 h-6 text-primary" />
                      ) : (
                        <Lock className="w-6 h-6 text-muted-foreground" />
                      )}
                    </div>
                    
                    {!checkpoint.isFinal && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="text-primary font-medium">{checkpoint.progress}%</span>
                        </div>
                        <div className="h-2 bg-background/50 rounded-full overflow-hidden">
                          <div
                            className="h-full gradient-secondary transition-all duration-1000"
                            style={{ width: `${checkpoint.progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {checkpoint.isFinal && (
                      <div className="flex items-center gap-2 text-accent">
                        <span className="text-2xl">🎓</span>
                        <span className="font-medium">Final Achievement</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Node */}
                <div className="relative">
                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center border-4 ${
                      checkpoint.progress === 100
                        ? "bg-secondary border-secondary animate-glow"
                        : checkpoint.unlocked
                        ? "bg-primary border-primary animate-pulse-glow"
                        : "bg-muted border-muted-foreground/30"
                    }`}
                  >
                    <MapPin className="w-8 h-8" />
                  </div>
                  {checkpoint.progress > 0 && checkpoint.progress < 100 && (
                    <div className="absolute inset-0 rounded-full border-4 border-accent/50 animate-ping" />
                  )}
                </div>

                {/* Spacer for alternating layout */}
                <div className="flex-1" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Learning Modal */}
      <LearningModal
        isOpen={selectedCheckpoint !== null}
        onClose={() => setSelectedCheckpoint(null)}
        checkpoint={checkpoints.find(cp => cp.id === selectedCheckpoint)}
      />

      {/* Chat Panel */}
      <ChatPanel isOpen={isChatOpen} onToggle={() => setIsChatOpen(!isChatOpen)} />
    </div>
  );
};

export default Roadmap;
