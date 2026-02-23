// app/src/components/landing/footer.tsx
import { FaGithub, FaTwitter, FaDiscord } from "react-icons/fa";

export function Footer() {
  return (
    <footer className="border-t py-12 bg-background">
        <div className="container px-4 md:px-6 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-center md:text-left">
                <span className="font-bold text-lg">Superteam Academy</span>
                <p className="text-sm text-muted-foreground mt-1">
                    © 2024 Superteam Brazil. Open Source.
                </p>
            </div>
            
            <div className="flex gap-6">
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors"><FaTwitter className="h-5 w-5" /></a>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors"><FaGithub className="h-5 w-5" /></a>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors"><FaDiscord className="h-5 w-5" /></a>
            </div>
        </div>
    </footer>
  );
}