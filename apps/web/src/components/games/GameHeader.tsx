import Link from "next/link";
import { ArrowLeft, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface GameHeaderProps {
  title: string;
  description: string;
  rules: React.ReactNode;
}

export function GameHeader({ title, description, rules }: GameHeaderProps) {
  return (
    <div className="mb-8 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          asChild
          className="border-border/50 h-10 w-10 shrink-0 bg-black/20 hover:bg-black/40"
        >
          <Link href="/games">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="hidden text-sm text-muted-foreground sm:block">
            {description}
          </p>
        </div>
      </div>

      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="border-border/50 gap-2 bg-black/20 hover:bg-black/40"
          >
            <Info className="h-4 w-4" />
            <span className="hidden sm:inline">Como Jogar</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="border-border/50 bg-black/80 backdrop-blur-xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Como jogar {title}</DialogTitle>
            <DialogDescription className="text-foreground/80 space-y-4 pt-4 text-sm leading-relaxed">
              {rules}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}
