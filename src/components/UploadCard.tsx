import { useRef } from "react";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UploadCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  accept: string;
  files: File[];
  onFilesChange: (files: File[]) => void;
}

const UploadCard = ({ title, description, icon, accept, files, onFilesChange }: UploadCardProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    onFilesChange([...files, ...droppedFiles]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      onFilesChange([...files, ...selectedFiles]);
    }
  };

  const removeFile = (index: number) => {
    onFilesChange(files.filter((_, i) => i !== index));
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className="relative group"
    >
      <div className="absolute inset-0 gradient-primary opacity-0 group-hover:opacity-20 rounded-2xl blur-xl transition-opacity" />
      <div className="relative bg-card/50 backdrop-blur-sm border-2 border-dashed border-border hover:border-primary/50 rounded-2xl p-8 transition-all card-shadow hover:scale-[1.02]">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            {icon}
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="w-full border-primary/30 hover:bg-primary/10"
          >
            <Upload className="w-4 h-4 mr-2" />
            Choose Files
          </Button>
          
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          
          {files.length > 0 && (
            <div className="w-full mt-4 space-y-2">
              {files.map((file, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 bg-background/50 rounded-lg text-sm"
                >
                  <span className="truncate flex-1">{file.name}</span>
                  <button
                    onClick={() => removeFile(idx)}
                    className="ml-2 text-destructive hover:text-destructive/80"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadCard;
