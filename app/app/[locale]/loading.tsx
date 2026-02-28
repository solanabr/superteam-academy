import { GraduationCap } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-12 w-12 animate-pulse items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600">
          <GraduationCap className="h-7 w-7 text-white" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 animate-bounce rounded-full bg-purple-500 [animation-delay:0ms]" />
          <div className="h-2 w-2 animate-bounce rounded-full bg-purple-500 [animation-delay:150ms]" />
          <div className="h-2 w-2 animate-bounce rounded-full bg-purple-500 [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}
