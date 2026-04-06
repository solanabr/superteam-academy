import Link from 'next/link';
import { ArrowLeft, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild className="h-10 w-10 shrink-0 border-border/50 bg-black/20 hover:bg-black/40">
          <Link href="/games">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground hidden sm:block">{description}</p>
        </div>
      </div>
      
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2 border-border/50 bg-black/20 hover:bg-black/40">
            <Info className="h-4 w-4" />
            <span className="hidden sm:inline">Como Jogar</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md border-border/50 bg-black/80 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle>Como jogar {title}</DialogTitle>
            <DialogDescription className="pt-4 space-y-4 text-sm text-foreground/80 leading-relaxed">
              {rules}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}
