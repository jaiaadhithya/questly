import { useNavigate } from "react-router-dom";
import { Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import StudyCard from "@/components/StudyCard";

const studies = [
  {
    id: "1",
    title: "Introduction to React",
    progress: 65,
    lastAccessed: "2 days ago",
    checkpointsCompleted: 5,
    totalCheckpoints: 8
  },
  {
    id: "2",
    title: "Machine Learning Basics",
    progress: 30,
    lastAccessed: "1 week ago",
    checkpointsCompleted: 2,
    totalCheckpoints: 7
  },
  {
    id: "3",
    title: "Data Structures",
    progress: 100,
    lastAccessed: "3 weeks ago",
    checkpointsCompleted: 6,
    totalCheckpoints: 6
  }
];

const Upload = () => {
  const navigate = useNavigate();

  const handleCreateNew = () => {
    toast.success("Creating new study...");
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
        <div className="mb-12">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Sparkles className="w-8 h-8 text-primary animate-pulse-glow" />
                <h1 className="text-5xl font-bold bg-clip-text text-transparent gradient-primary">
                  Questly
                </h1>
              </div>
              <p className="text-xl text-muted-foreground">
                Your personalized learning adventures
              </p>
            </div>
          </div>
        </div>

        {/* Studies Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {studies.map((study) => (
            <StudyCard key={study.id} {...study} />
          ))}
          
          {/* Create New Study Card */}
          <div
            onClick={handleCreateNew}
            className="group cursor-pointer bg-card/30 backdrop-blur-sm rounded-2xl p-6 border-2 border-dashed border-border hover:border-primary transition-all hover:scale-[1.02] flex flex-col items-center justify-center min-h-[200px] card-shadow hover:glow-primary"
          >
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
              <Plus className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Create New Study</h3>
            <p className="text-sm text-muted-foreground text-center">
              Start a new learning journey
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Upload;
