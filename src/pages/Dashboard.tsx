import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { db, Study } from "@/lib/supabase";
import { Trash2, Play } from "lucide-react";
import { toast } from "sonner";

export default function Dashboard() {
  const [studies, setStudies] = useState<Study[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStudies();
  }, []);

  const fetchStudies = async () => {
    try {
      setLoading(true);
      const studiesData = await db.studies.getAll();
      setStudies(studiesData);
    } catch (error) {
      console.error("Error fetching studies:", error);
      toast.error("Failed to load your studies");
    } finally {
      setLoading(false);
    }
  };

  const handleStartNewStudy = () => {
    navigate("/");
  };

  const handleResumeStudy = (studyId: string) => {
    navigate(`/upload-materials?studyId=${studyId}`);
  };

  const handleDeleteStudy = async (studyId: string) => {
    try {
      await db.studies.delete(studyId);
      toast.success("Study deleted successfully");
      fetchStudies();
    } catch (error) {
      console.error("Error deleting study:", error);
      toast.error("Failed to delete study");
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Studies</h1>
        <Button onClick={handleStartNewStudy}>Start New Study</Button>
      </div>

      {loading ? (
        <div className="flex justify-center">
          <p>Loading your studies...</p>
        </div>
      ) : studies.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-4">No studies found</h2>
          <p className="text-gray-500 mb-6">Start a new study to begin your learning journey</p>
          <Button onClick={handleStartNewStudy}>Start New Study</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {studies.map((study) => (
            <Card key={study.id} className="overflow-hidden">
              <CardHeader>
                <CardTitle>{study.name}</CardTitle>
                <CardDescription>
                  Created on {new Date(study.created_at).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Progress</span>
                      <span>{study.progress}%</span>
                    </div>
                    <Progress value={study.progress} className="h-2" />
                  </div>
                  <div className="flex items-center">
                    <span className={`text-sm font-medium ${
                      study.status === "completed" ? "text-green-500" : "text-blue-500"
                    }`}>
                      {study.status === "completed" ? "Completed" : "In Progress"}
                    </span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => handleDeleteStudy(study.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button onClick={() => handleResumeStudy(study.id)}>
                  <Play className="h-4 w-4 mr-2" />
                  Resume
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}