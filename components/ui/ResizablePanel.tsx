'use client';

import React, { useState, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils/cn';

interface ResizablePanelProps {
  left: React.ReactNode;
  right: React.ReactNode;
  initialLeftWidth?: number;
  minLeftWidth?: number;
  minRightWidth?: number;
}

export function ResizablePanel({
  left,
  right,
  initialLeftWidth = 50,
  minLeftWidth = 30,
  minRightWidth = 30,
}: ResizablePanelProps) {
  const [leftWidth, setLeftWidth] = useState(initialLeftWidth);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  const handleMouseDown = useCallback(() => {
    isDraggingRef.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDraggingRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const newLeftWidth = ((e.clientX - rect.left) / rect.width) * 100;

    if (newLeftWidth >= minLeftWidth && newLeftWidth <= 100 - minRightWidth) {
      setLeftWidth(newLeftWidth);
    }
  }, [minLeftWidth, minRightWidth]);

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove]);

  return (
    <div
      ref={containerRef}
      className="flex h-full gap-0 cursor-col-resize"
      style={{ userSelect: isDraggingRef.current ? 'none' : 'auto' }}
    >
      {/* Left Panel */}
      <div style={{ width: `${leftWidth}%` }} className="overflow-auto">
        {left}
      </div>

      {/* Divider */}
      <div
        onMouseDown={handleMouseDown}
        className={cn(
          'w-1 bg-terminal-border hover:bg-neon-cyan/50 cursor-col-resize transition-colors',
          isDraggingRef.current && 'bg-neon-cyan'
        )}
      />

      {/* Right Panel */}
      <div style={{ width: `${100 - leftWidth}%` }} className="overflow-auto">
        {right}
      </div>
    </div>
  );
}
