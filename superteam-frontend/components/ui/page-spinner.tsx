import { Loader2 } from "lucide-react";

export function PageSpinner() {
  return (
    <div className="flex flex-1 items-center justify-center py-32">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
