import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
      <div className="relative">
        <span className="text-[10rem] font-black leading-none text-muted-foreground/10 select-none">
          404
        </span>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-6xl">🌑</div>
        </div>
      </div>
      <h1 className="text-3xl font-bold">Lost in the Solana-verse</h1>
      <p className="max-w-md text-muted-foreground">
        This page doesn&apos;t exist — maybe the transaction was dropped, or the block was skipped.
        Let&apos;s get you back on track.
      </p>
      <div className="flex gap-4">
        <Link href="/">
          <Button variant="solana">Back to Home</Button>
        </Link>
        <Link href="/courses">
          <Button variant="outline">Browse Courses</Button>
        </Link>
      </div>
    </div>
  );
}
