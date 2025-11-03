import { useState } from "react";
import { Play, CheckCircle2, Lock } from "lucide-react";
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
          <h1 className="text-5xl font-bold mb-4 text-primary">
            Introduction to React
          </h1>
          <p className="text-xl text-muted-foreground">
            Follow the skill tree to mastery
          </p>
        </div>

        {/* Skill Tree Roadmap */}
        <div className="relative max-w-2xl mx-auto">
          {/* Vertical Connection Line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-1 -translate-x-1/2 bg-gradient-to-b from-primary via-secondary to-accent opacity-30" />

          {/* Checkpoints */}
          <div className="space-y-8 relative z-10">
            {checkpoints.map((checkpoint, idx) => (
              <div key={checkpoint.id} className="animate-slide-up" style={{ animationDelay: `${idx * 0.1}s` }}>
                <div className="flex items-center gap-6">
                  {/* Connecting Line to Node */}
                  <div className="flex-1 h-0.5 bg-gradient-to-r from-transparent to-primary/50" />
                  
                  {/* Node */}
                  <div className="relative flex-shrink-0">
                    <div
                      className={`w-20 h-20 rounded-full flex items-center justify-center border-4 transition-all ${
                        checkpoint.progress === 100
                          ? "bg-secondary border-secondary shadow-lg shadow-secondary/50 animate-glow"
                          : checkpoint.unlocked
                          ? "bg-primary border-primary shadow-lg shadow-primary/50 animate-pulse-glow"
                          : "bg-muted border-muted-foreground/30"
                      }`}
                    >
                      {checkpoint.progress === 100 ? (
                        <CheckCircle2 className="w-10 h-10 text-secondary-foreground" />
                      ) : checkpoint.unlocked ? (
                        <Play className="w-10 h-10 text-primary-foreground" />
                      ) : (
                        <Lock className="w-10 h-10 text-muted-foreground" />
                      )}
                    </div>
                    {checkpoint.progress > 0 && checkpoint.progress < 100 && (
                      <div className="absolute inset-0 rounded-full border-4 border-accent/50 animate-ping" />
                    )}
                  </div>

                  {/* Connecting Line from Node */}
                  <div className="flex-1 h-0.5 bg-gradient-to-l from-transparent to-primary/50" />
                </div>

                {/* Content Card */}
                <div className="mt-4">
                  <div
                    className={`relative group bg-card/50 backdrop-blur-sm rounded-2xl p-6 border-2 transition-all card-shadow ${
                      checkpoint.progress === 100
                        ? "border-secondary glow-accent"
                        : checkpoint.unlocked
                        ? "border-primary/50 hover:border-primary hover:scale-[1.02] cursor-pointer"
                        : "border-border/30 opacity-60 cursor-not-allowed"
                    }`}
                    onClick={() => checkpoint.unlocked && !checkpoint.isFinal && setSelectedCheckpoint(checkpoint.id)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-xl font-semibold">{checkpoint.title}</h3>
                      <div className="flex items-center gap-2">
                        {checkpoint.progress === 100 && (
                          <CheckCircle2 className="w-6 h-6 text-secondary" />
                        )}
                        {checkpoint.unlocked && checkpoint.progress < 100 && (
                          <Play className="w-6 h-6 text-primary" />
                        )}
                      </div>
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
