'use client';

import { useState, useCallback, useRef, useEffect, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { GripVertical, Maximize2, Minimize2, ChevronLeft, ChevronRight } from 'lucide-react';

interface SplitLayoutProps {
  /** Content for the left panel (e.g., markdown content) */
  leftPanel: ReactNode;
  /** Content for the right panel (e.g., code editor) */
  rightPanel: ReactNode;
  /** Initial split ratio (0-1, 0.5 = 50/50) */
  initialRatio?: number;
  /** Minimum width for left panel in pixels */
  minLeftWidth?: number;
  /** Minimum width for right panel in pixels */
  minRightWidth?: number;
  /** Allow collapsing panels */
  collapsible?: boolean;
  /** Store preference in localStorage key */
  storageKey?: string;
  /** Additional className */
  className?: string;
}

export function SplitLayout({
  leftPanel,
  rightPanel,
  initialRatio = 0.5,
  minLeftWidth = 300,
  minRightWidth = 400,
  collapsible = true,
  storageKey,
  className,
}: SplitLayoutProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ratio, setRatio] = useState(() => {
    if (storageKey && typeof window !== 'undefined') {
      const saved = localStorage.getItem(`split-layout-${storageKey}`);
      if (saved) return parseFloat(saved);
    }
    return initialRatio;
  });
  const [isDragging, setIsDragging] = useState(false);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);

  // Save ratio to localStorage
  useEffect(() => {
    if (storageKey) {
      localStorage.setItem(`split-layout-${storageKey}`, ratio.toString());
    }
  }, [ratio, storageKey]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;

      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const containerWidth = rect.width;

      // Calculate new ratio
      let newRatio = x / containerWidth;

      // Apply minimum widths
      const minLeftRatio = minLeftWidth / containerWidth;
      const maxLeftRatio = 1 - minRightWidth / containerWidth;

      newRatio = Math.max(minLeftRatio, Math.min(maxLeftRatio, newRatio));

      setRatio(newRatio);
    },
    [isDragging, minLeftWidth, minRightWidth]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Add mouse event listeners when dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleReset = useCallback(() => {
    setRatio(initialRatio);
    setLeftCollapsed(false);
    setRightCollapsed(false);
  }, [initialRatio]);

  const toggleLeftCollapsed = useCallback(() => {
    setLeftCollapsed((prev) => !prev);
    if (rightCollapsed) setRightCollapsed(false);
  }, [rightCollapsed]);

  const toggleRightCollapsed = useCallback(() => {
    setRightCollapsed((prev) => !prev);
    if (leftCollapsed) setLeftCollapsed(false);
  }, [leftCollapsed]);

  // Calculate widths
  const leftWidth = leftCollapsed ? 0 : rightCollapsed ? 100 : ratio * 100;
  const rightWidth = rightCollapsed ? 0 : leftCollapsed ? 100 : (1 - ratio) * 100;

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative flex h-full w-full overflow-hidden',
        isDragging && 'select-none',
        className
      )}
    >
      {/* Left Panel */}
      <div
        className={cn(
          'h-full overflow-auto transition-all duration-200',
          leftCollapsed && 'w-0 opacity-0'
        )}
        style={{
          width: leftCollapsed ? 0 : `${leftWidth}%`,
          flexShrink: 0,
        }}
      >
        <div className="h-full min-w-0">{leftPanel}</div>
      </div>

      {/* Resizer */}
      <div
        className={cn(
          'group relative flex flex-shrink-0 cursor-col-resize items-center justify-center px-0.5 transition-colors',
          'hover:bg-primary/10',
          isDragging && 'bg-primary/20'
        )}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleReset}
      >
        {/* Resizer bar */}
        <div
          className={cn(
            'bg-border h-full w-1 rounded-full transition-colors',
            'group-hover:bg-primary',
            isDragging && 'bg-primary'
          )}
        />

        {/* Drag handle */}
        <div
          className={cn(
            'absolute flex h-10 w-6 items-center justify-center rounded-md',
            'bg-background border shadow-sm transition-opacity',
            'opacity-0 group-hover:opacity-100',
            isDragging && 'opacity-100'
          )}
        >
          <GripVertical className="text-muted-foreground h-4 w-4" />
        </div>

        {/* Collapse buttons */}
        {collapsible && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'absolute top-1/2 -left-3 h-6 w-6 -translate-y-1/2 rounded-full opacity-0 transition-opacity group-hover:opacity-100',
                !leftCollapsed && 'bg-background border'
              )}
              onClick={toggleLeftCollapsed}
            >
              {leftCollapsed ? (
                <ChevronRight className="h-3 w-3" />
              ) : (
                <ChevronLeft className="h-3 w-3" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'absolute top-1/2 -right-3 h-6 w-6 -translate-y-1/2 rounded-full opacity-0 transition-opacity group-hover:opacity-100',
                !rightCollapsed && 'bg-background border'
              )}
              onClick={toggleRightCollapsed}
            >
              {rightCollapsed ? (
                <ChevronLeft className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </Button>
          </>
        )}
      </div>

      {/* Right Panel */}
      <div
        className={cn(
          'h-full flex-1 overflow-auto transition-all duration-200',
          rightCollapsed && 'w-0 opacity-0'
        )}
        style={{
          width: rightCollapsed ? 0 : `${rightWidth}%`,
        }}
      >
        <div className="h-full min-w-0">{rightPanel}</div>
      </div>
    </div>
  );
}

interface LessonLayoutProps {
  /** Lesson content (markdown/MDX) */
  content: ReactNode;
  /** Code editor or challenge component */
  editor?: ReactNode;
  /** Whether to show split layout (false = content only) */
  showEditor?: boolean;
  /** Navigation component */
  navigation?: ReactNode;
  /** Aside/sidebar content */
  aside?: ReactNode;
  /** Additional className */
  className?: string;
}

export function LessonLayout({
  content,
  editor,
  showEditor = true,
  navigation,
  aside,
  className,
}: LessonLayoutProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  return (
    <div className={cn('flex h-full flex-col', className)}>
      {/* Top navigation bar */}
      {navigation && (
        <div className="bg-background/95 supports-[backdrop-filter]:bg-background/60 border-b px-4 py-2 backdrop-blur">
          <div className="flex items-center justify-between">
            {navigation}
            <Button variant="ghost" size="sm" onClick={handleFullscreen}>
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      )}

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Main split view */}
        <div className="flex-1">
          {showEditor && editor ? (
            <SplitLayout
              leftPanel={
                <div className="h-full overflow-auto p-6">
                  <div className="prose prose-sm dark:prose-invert lg:prose-base mx-auto max-w-none">
                    {content}
                  </div>
                </div>
              }
              rightPanel={<div className="h-full p-4">{editor}</div>}
              initialRatio={0.45}
              minLeftWidth={320}
              minRightWidth={450}
              storageKey="lesson-split"
            />
          ) : (
            <div className="h-full overflow-auto p-6">
              <div className="prose prose-sm dark:prose-invert lg:prose-base mx-auto max-w-3xl">
                {content}
              </div>
            </div>
          )}
        </div>

        {/* Optional aside/sidebar */}
        {aside && <aside className="hidden w-64 border-l p-4 lg:block">{aside}</aside>}
      </div>
    </div>
  );
}
