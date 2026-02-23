"use client";

import { Button } from "@/components/ui/button";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-xl rounded-xl border border-red-400/30 bg-red-500/10 p-6 text-center">
      <h2 className="text-xl font-semibold text-red-200">Something went wrong</h2>
      <p className="mt-2 text-sm text-red-100/80">Try reloading this view.</p>
      <Button className="mt-4" onClick={reset}>
        Retry
      </Button>
    </div>
  );
}
