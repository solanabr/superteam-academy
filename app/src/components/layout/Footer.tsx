import { Github, ExternalLink } from "lucide-react";
import { Link } from "@/i18n/navigation";

export function Footer() {
  return (
    <footer className="border-t border-[#1F1F1F] mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <p className="text-xs text-[#666666] font-mono">
          © 2026 Superteam Academy.{" "}
          <span className="text-[#14F195]">Built on Solana.</span>
        </p>
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/solanabr/superteam-academy"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-[#666666] hover:text-[#EDEDED] transition-colors font-mono"
          >
            <Github className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">GitHub</span>
          </a>
          <a
            href="https://superteam.fun"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-[#666666] hover:text-[#EDEDED] transition-colors font-mono"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Superteam</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
