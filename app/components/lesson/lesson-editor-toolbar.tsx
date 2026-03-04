import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlayIcon, CodeIcon, SparklesIcon, Checkmark } from "@hugeicons/core-free-icons";

interface FileTab {
  name: string;
  language: string;
  content: string;
}

interface EditorToolbarProps {
  files: FileTab[];
  activeFile: number;
  setActiveFile: (idx: number) => void;
  isRunning: boolean;
  isCompleted: boolean;
  allPassed: boolean;
  aiSidebarOpen: boolean;
  runTests: () => void;
  handleMarkComplete: () => void;
  setAiSidebarOpen: (open: boolean) => void;
  t: (key: string) => string;
}

export function LessonEditorToolbar({
  files,
  activeFile,
  setActiveFile,
  isRunning,
  isCompleted,
  allPassed,
  aiSidebarOpen,
  runTests,
  handleMarkComplete,
  setAiSidebarOpen,
  t,
}: EditorToolbarProps) {
  return (
    <div className="h-12 border-b border-border/50 flex items-center justify-between px-4 flex-shrink-0 bg-background">
      <div className="flex items-center gap-1">
        {files.map((file, idx) => (
          <button
            key={idx}
            onClick={() => setActiveFile(idx)}
            className={`px-4 py-2 text-sm rounded-t-md flex items-center gap-2 mt-2 transition-colors ${
              activeFile === idx 
                ? "bg-card text-foreground border border-b-0 border-border/50 shadow-[0_-2px_10px_rgba(0,0,0,0.02)]" 
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            <HugeiconsIcon icon={CodeIcon} size={14} />
            {file.name}
          </button>
        ))}
      </div>
      
      <div className="flex items-center gap-2">
        {allPassed && !isCompleted && (
          <Button size="sm" className="gap-1.5 bg-green-500 hover:bg-green-600" onClick={handleMarkComplete}>
            <HugeiconsIcon icon={Checkmark} size={14} />
            {t("markComplete")}
          </Button>
        )}
        {isCompleted && (
          <Badge variant="default" className="bg-green-500 gap-1">
            <HugeiconsIcon icon={Checkmark} size={12} />
            {t("completed")}
          </Badge>
        )}
        <Button size="sm" onClick={runTests} disabled={isRunning} className="gap-1.5">
          <HugeiconsIcon icon={PlayIcon} size={14} />
          {isRunning ? t("running") : t("runCode")}
        </Button>
        <Button 
          size="sm" 
          variant={aiSidebarOpen ? "default" : "outline"}
          onClick={() => setAiSidebarOpen(!aiSidebarOpen)}
          className="gap-1.5"
          title="Toggle AI Mentor"
        >
          <HugeiconsIcon icon={SparklesIcon} size={14} />
        </Button>
      </div>
    </div>
  );
}
