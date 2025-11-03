import { BookOpen, Calendar, TrendingUp } from "lucide-react";

interface StudyCardProps {
  id: string;
  title: string;
  progress: number;
  lastAccessed: string;
  checkpointsCompleted: number;
  totalCheckpoints: number;
}

const StudyCard = ({ title, progress, lastAccessed, checkpointsCompleted, totalCheckpoints }: StudyCardProps) => {

  return (
    <div
      className="group cursor-pointer bg-card/50 backdrop-blur-sm rounded-2xl p-6 border-2 border-border/50 hover:border-primary/50 transition-all hover:scale-[1.02] card-shadow hover:glow-primary"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h3 className="text-xl font-semibold group-hover:text-primary transition-colors">{title}</h3>
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
              <Calendar className="w-3 h-3" />
              {lastAccessed}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-secondary">
          <TrendingUp className="w-4 h-4" />
          <span className="text-sm font-medium">{progress}%</span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium">{checkpointsCompleted}/{totalCheckpoints} Checkpoints</span>
        </div>
        <div className="h-2 bg-background/50 rounded-full overflow-hidden">
          <div
            className="h-full gradient-secondary transition-all duration-1000"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default StudyCard;
