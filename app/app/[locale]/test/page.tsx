'use client';

import { Progress } from '@/components/ui/progress';
import { useEffect, useState } from 'react';

export default function TestPage() {
  const [animatedProgress, setAnimatedProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setAnimatedProgress((prev) => (prev >= 100 ? 0 : prev + 10));
    }, 800);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-bg-base p-10 lg:p-20">
      <h1 className="font-display text-4xl mb-10">COMPONENT FLIGHT CHECK: PROGRESS BAR</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
        {/* Static Tests */}
        <div className="space-y-12">
          <h2 className="text-xl font-mono text-ink-secondary/50 uppercase tracking-widest border-b border-ink-secondary/20 pb-4">Static States</h2>
          
          <div>
            <div className="flex justify-between text-sm mb-2 font-mono">
              <span>INITIALIZING</span>
              <span>0%</span>
            </div>
            <Progress value={0} />
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2 font-mono">
              <span>LOADING RESOURCES</span>
              <span>33%</span>
            </div>
            <Progress value={33} />
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-2 font-mono">
              <span>OPTIMIZING ASSETS</span>
              <span>72%</span>
            </div>
            <Progress value={72} />
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-2 font-mono">
              <span>SYSTEM READY</span>
              <span>100%</span>
            </div>
            <Progress value={100} />
          </div>
        </div>

        {/* Animated Tests */}
        <div className="space-y-12">
           <h2 className="text-xl font-mono text-ink-secondary/50 uppercase tracking-widest border-b border-ink-secondary/20 pb-4">Live Simulation</h2>
           
           <div>
            <div className="flex justify-between text-sm mb-2 font-mono">
              <span>SIMULATION RUNNING...</span>
              <span>{animatedProgress}%</span>
            </div>
            <Progress value={animatedProgress} />
            <p className="text-xs text-ink-secondary mt-4 font-mono">
              {"//"} Testing transition smoothness and marker tracking
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}