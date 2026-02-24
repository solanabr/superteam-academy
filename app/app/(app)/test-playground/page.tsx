"use client";

import { SolanaPlayground } from "@/components/app";

export default function TestPlaygroundPage() {
  return (
    <div className="h-screen flex flex-col">
      <div className="border-b border-border bg-muted/30 px-4 py-2">
        <h1 className="text-lg font-semibold">Solana Playground Test</h1>
        <p className="text-sm text-muted-foreground">
          This is a test page to verify the iframe is working
        </p>
      </div>
      <div className="flex-1 overflow-hidden">
        <SolanaPlayground 
          starterCode="// Test starter code\nconsole.log('Hello Solana!');"
        />
      </div>
    </div>
  );
}
