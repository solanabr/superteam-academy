import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[var(--c-bg)]">
      <div className="max-w-lg w-full">
        <div className="border border-[var(--c-border-subtle)] rounded-[2px] bg-[var(--c-bg-card)] overflow-hidden">
          {/* Terminal title bar */}
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[var(--c-border-subtle)] bg-[var(--c-bg)]">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-[1px] bg-[#EF4444]/60" />
              <div className="w-2.5 h-2.5 rounded-[1px] bg-[#FFC526]/60" />
              <div className="w-2.5 h-2.5 rounded-[1px] bg-[#00FFA3]/60" />
            </div>
            <span className="flex-1 text-center text-[11px] font-mono text-[var(--c-text-2)]">
              terminal — superteam-academy
            </span>
          </div>

          {/* Terminal content */}
          <div className="p-6 font-mono text-sm space-y-3">
            <p className="text-[var(--c-text-2)]">
              <span className="text-[#00FFA3]">$</span> curl -s
              superteam.academy/this-page
            </p>
            <div className="space-y-1">
              <p className="text-[#EF4444]">Error 404: Page not found</p>
              <p className="text-[var(--c-text-2)]">
                The requested resource could not be located.
              </p>
            </div>
            <div className="h-px bg-[var(--c-border-subtle)] my-4" />
            <div className="space-y-1">
              <p className="text-[var(--c-text-2)]">
                <span className="text-[#00FFA3]">$</span> ls available-routes/
              </p>
              <p className="text-[#6693F7]">
                {" "}
                /courses &nbsp;&nbsp; /dashboard &nbsp;&nbsp; /leaderboard
                &nbsp;&nbsp; /profile
              </p>
            </div>
            <div className="h-px bg-[var(--c-border-subtle)] my-4" />
            <p className="text-[var(--c-text-2)]">
              <span className="text-[#00FFA3]">$</span> cd /home
              <span className="inline-block w-2 h-4 bg-[#00FFA3] ml-0.5 animate-pulse" />
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <Link href="/">
            <Button variant="outline" className="gap-2 font-mono">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
