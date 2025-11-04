import { useNavigate } from "react-router-dom";
import { Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import StudyCard from "@/components/StudyCard";
import { useEffect, useState } from "react";
import { localStore, LocalStudy } from "@/lib/localStore";

interface StudyDisplay {
  id: string;
  title: string;
  progress: number;
  lastAccessed: string;
  checkpointsCompleted: number;
  totalCheckpoints: number;
}

// Function to convert local Study to StudyDisplay format
const convertToStudyDisplay = (study: LocalStudy): StudyDisplay => {
  // Calculate days since last access
  const daysSince = Math.floor((Date.now() - new Date(study.created_at).getTime()) / (1000 * 60 * 60 * 24));
  let lastAccessed = "";
  
  if (daysSince === 0) {
    lastAccessed = "Today";
  } else if (daysSince === 1) {
    lastAccessed = "Yesterday";
  } else if (daysSince < 7) {
    lastAccessed = `${daysSince} days ago`;
  } else if (daysSince < 30) {
    lastAccessed = `${Math.floor(daysSince / 7)} week${Math.floor(daysSince / 7) > 1 ? 's' : ''} ago`;
  } else {
    lastAccessed = `${Math.floor(daysSince / 30)} month${Math.floor(daysSince / 30) > 1 ? 's' : ''} ago`;
  }
  
  // Estimate checkpoints based on progress
  const totalCheckpoints = 8; // Default value
  const checkpointsCompleted = Math.round((study.progress / 100) * totalCheckpoints);
  
  return {
    id: study.id,
    title: study.name,
    progress: study.progress,
    lastAccessed,
    checkpointsCompleted,
    totalCheckpoints
  };
};

const Upload = () => {
  const navigate = useNavigate();
  const [studies, setStudies] = useState<StudyDisplay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudies();
  }, []);

  const fetchStudies = async () => {
    try {
      setLoading(true);
      const studiesData = localStore.getStudies();
      const displayStudies = studiesData.map(convertToStudyDisplay);
      setStudies(displayStudies);
    } catch (error) {
      console.error("Error fetching studies:", error);
      // If database is not set up yet, use mock data
      setStudies([
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
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = async () => {
    try {
      // Create a new study with a default name
      const studyName = `Study ${new Date().toLocaleDateString()}`;
      const study = localStore.createStudy(studyName);
      
      // Navigate to upload materials with the study ID
      navigate(`/upload-materials?studyId=${study.id}`);
    } catch (error) {
      console.error("Error creating study:", error);
      // If database is not set up yet, just navigate
      navigate("/upload-materials");
      toast.error("Failed to create study locally.");
    }
  };

  const handleStudyClick = (studyId: string) => {
    // If topics already exist for this study, resume on roadmap; otherwise go to upload
    const topics = localStore.getTopics(studyId);
    if (topics && topics.length > 0) {
      navigate(`/roadmap?studyId=${studyId}`);
    } else {
      navigate(`/upload-materials?studyId=${studyId}`);
    }
  };

  const handleDeleteStudy = (studyId: string) => {
    try {
      localStore.deleteStudy(studyId);
      setStudies(prev => prev.filter(s => s.id !== studyId));
      toast.success("Study deleted");
    } catch (err) {
      console.error("Failed to delete study:", err);
      toast.error("Failed to delete study");
    }
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
                <h1 className="text-5xl font-bold text-primary">
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
          {loading ? (
            <div className="col-span-3 text-center py-12">
              <p>Loading your studies...</p>
            </div>
          ) : (
            <>
              {studies.map((study) => (
                <div key={study.id} onClick={() => handleStudyClick(study.id)}>
                  <StudyCard {...study} onDelete={() => handleDeleteStudy(study.id)} />
                </div>
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
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Upload;
