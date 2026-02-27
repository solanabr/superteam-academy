
import { Loader2 } from "lucide-react";

export function EditorSkeleton() {
  return (
    <div className="h-full w-full flex items-center justify-center bg-[#1e1e1e] text-gray-500">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-[#9945FF]" />
        <span className="text-sm">Loading Editor...</span>
      </div>
    </div>
  );
}
