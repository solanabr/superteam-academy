'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Home, ArrowLeft, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        {/* 404 with gradient */}
        <div className="mb-6">
          <span className="text-8xl font-bold bg-gradient-to-r from-[#9945FF] to-[#14F195] bg-clip-text text-transparent">
            404
          </span>
        </div>

        <h1 className="text-2xl font-bold mb-3">Quest Not Found</h1>
        <p className="text-muted-foreground mb-8">
          The path you seek doesn&apos;t exist in this realm. Perhaps you took a wrong
          turn in the dungeon?
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/">
            <Button className="gap-2 bg-gradient-to-r from-[#9945FF] to-[#14F195] text-white hover:opacity-90 border-0">
              <Home className="h-4 w-4" />
              Return Home
            </Button>
          </Link>
          <Link href="/courses">
            <Button variant="outline" className="gap-2">
              <Compass className="h-4 w-4" />
              Browse Quests
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
