'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { CheckCircle, Clock, Scroll, Eye, Code2 } from 'lucide-react';
import { Progress } from './progress';

interface LessonProgressTrackerProps {
  lessonType: 'content' | 'challenge' | 'video' | 'reading' | 'quiz';
  videoDurationSeconds?: number;
  isCompleted: boolean;
  onCompletionReady: () => void;
  contentRef?: React.RefObject<HTMLElement | null>;
  challengeCompleted?: boolean; // For tracking challenge completion from CodeChallenge
  children?: React.ReactNode;
}

export function LessonProgressTracker({
  lessonType,
  videoDurationSeconds = 0,
  isCompleted,
  onCompletionReady,
  contentRef,
  challengeCompleted = false,
  children,
}: LessonProgressTrackerProps) {
  // Reading progress (scroll-based)
  const [scrollProgress, setScrollProgress] = useState(0);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);

  // Video/time-based progress
  const [timeSpent, setTimeSpent] = useState(0);
  const [hasSpentRequiredTime, setHasSpentRequiredTime] = useState(false);

  // Track if completion has been triggered
  const completionTriggeredRef = useRef(false);

  // Internal ref for content if none provided
  const internalContentRef = useRef<HTMLDivElement>(null);
  const activeContentRef = contentRef || internalContentRef;

  // Check if this is a video lesson with time tracking
  const isVideoLesson = lessonType === 'video';
  const hasVideoDuration = videoDurationSeconds > 0;
  const isReadingLesson = lessonType === 'reading' || lessonType === 'content';
  const isChallengeLesson = lessonType === 'challenge';

  // Track scroll progress for reading content
  useEffect(() => {
    if (!isReadingLesson || isCompleted) return;

    const handleScroll = () => {
      const element = activeContentRef.current;
      if (!element) {
        // Fallback to window scroll
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;

        if (docHeight > 0) {
          const progress = Math.min((scrollTop / docHeight) * 100, 100);
          setScrollProgress(progress);

          // Consider 95% as "reached bottom" to account for slight variations
          if (progress >= 95 && !hasScrolledToBottom) {
            setHasScrolledToBottom(true);
          }
        }
        return;
      }

      const scrollTop = element.scrollTop;
      const scrollHeight = element.scrollHeight - element.clientHeight;

      if (scrollHeight > 0) {
        const progress = Math.min((scrollTop / scrollHeight) * 100, 100);
        setScrollProgress(progress);

        if (progress >= 95 && !hasScrolledToBottom) {
          setHasScrolledToBottom(true);
        }
      }
    };

    // Add scroll listener to both element and window
    const element = activeContentRef.current;
    if (element) {
      element.addEventListener('scroll', handleScroll);
    }
    window.addEventListener('scroll', handleScroll);

    // Initial check
    handleScroll();

    return () => {
      if (element) {
        element.removeEventListener('scroll', handleScroll);
      }
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isReadingLesson, isCompleted, hasScrolledToBottom, activeContentRef]);

  // Track time spent for video lessons
  useEffect(() => {
    if (!isVideoLesson || !hasVideoDuration || isCompleted) return;

    const interval = setInterval(() => {
      setTimeSpent((prev) => {
        const newTime = prev + 1;
        // Check if required time has been met (allow 90% of video duration)
        const requiredTime = Math.floor(videoDurationSeconds * 0.9);
        if (newTime >= requiredTime && !hasSpentRequiredTime) {
          setHasSpentRequiredTime(true);
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isVideoLesson, hasVideoDuration, videoDurationSeconds, isCompleted, hasSpentRequiredTime]);

  // Trigger completion when conditions are met
  useEffect(() => {
    if (isCompleted || completionTriggeredRef.current) return;

    let shouldComplete = false;

    if (isReadingLesson && hasScrolledToBottom) {
      shouldComplete = true;
    } else if (isVideoLesson && hasVideoDuration && hasSpentRequiredTime) {
      shouldComplete = true;
    } else if (isChallengeLesson && challengeCompleted) {
      shouldComplete = true;
    }

    if (shouldComplete) {
      completionTriggeredRef.current = true;
      onCompletionReady();
    }
  }, [
    isCompleted,
    isReadingLesson,
    isVideoLesson,
    isChallengeLesson,
    hasVideoDuration,
    hasScrolledToBottom,
    hasSpentRequiredTime,
    challengeCompleted,
    onCompletionReady,
  ]);

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate video progress percentage
  const videoProgress = hasVideoDuration
    ? Math.min((timeSpent / videoDurationSeconds) * 100, 100)
    : 0;

  // Don't show tracker if already completed
  if (isCompleted) {
    return (
      <>
        {children}
        <div className="fixed right-4 bottom-4 z-50 flex items-center gap-2 rounded-lg bg-green-500/90 px-4 py-2 text-white shadow-lg">
          <CheckCircle className="h-5 w-5" />
          <span className="text-sm font-medium">Lesson Completed</span>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Wrap content in trackable div if no external ref */}
      {!contentRef ? <div ref={internalContentRef}>{children}</div> : children}

      {/* Progress indicator */}
      <div className="bg-background/95 fixed right-4 bottom-4 z-50 min-w-[200px] rounded-lg border p-3 shadow-lg backdrop-blur">
        {isReadingLesson && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="text-muted-foreground flex items-center gap-2">
                <Scroll className="h-4 w-4" />
                <span>Reading Progress</span>
              </div>
              <span className="font-medium">{Math.round(scrollProgress)}%</span>
            </div>
            <Progress value={scrollProgress} className="h-2" />
            {hasScrolledToBottom ? (
              <p className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                <CheckCircle className="h-3 w-3" />
                Content read - marking complete...
              </p>
            ) : (
              <p className="text-muted-foreground text-xs">Scroll to the bottom to complete</p>
            )}
          </div>
        )}

        {isVideoLesson && hasVideoDuration && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="text-muted-foreground flex items-center gap-2">
                <Eye className="h-4 w-4" />
                <span>Watch Progress</span>
              </div>
              <span className="font-medium">
                {formatTime(timeSpent)} / {formatTime(videoDurationSeconds)}
              </span>
            </div>
            <Progress value={videoProgress} className="h-2" />
            {hasSpentRequiredTime ? (
              <p className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                <CheckCircle className="h-3 w-3" />
                Video watched - marking complete...
              </p>
            ) : (
              <p className="text-muted-foreground flex items-center gap-1 text-xs">
                <Clock className="h-3 w-3" />
                {formatTime(Math.max(0, Math.floor(videoDurationSeconds * 0.9) - timeSpent))}{' '}
                remaining
              </p>
            )}
          </div>
        )}

        {isVideoLesson && !hasVideoDuration && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="text-muted-foreground flex items-center gap-2">
                <Eye className="h-4 w-4" />
                <span>Video Lesson</span>
              </div>
            </div>
            <p className="text-muted-foreground text-xs">
              Watch the video and mark complete manually
            </p>
          </div>
        )}

        {isChallengeLesson && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="text-muted-foreground flex items-center gap-2">
                <Code2 className="h-4 w-4" />
                <span>Code Challenge</span>
              </div>
            </div>
            {challengeCompleted ? (
              <p className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                <CheckCircle className="h-3 w-3" />
                All tests passed - marking complete...
              </p>
            ) : (
              <p className="text-muted-foreground text-xs">
                Complete the challenge by passing all tests
              </p>
            )}
          </div>
        )}
      </div>
    </>
  );
}
