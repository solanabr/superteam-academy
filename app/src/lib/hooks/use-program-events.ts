'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Connection } from '@solana/web3.js';
import type { ProgramEvent } from '@/lib/solana/events';
import { parseEventsFromLogs } from '@/lib/solana/events';
import { PROGRAM_ID } from '@/lib/solana/constants';

const MAX_EVENTS = 50;

/**
 * Mock events for when the connection fails or is unavailable.
 * Provides a realistic preview of what real-time events look like.
 */
function generateMockEvents(): ProgramEvent[] {
  const now = Date.now();

  return [
    {
      type: 'EnrollmentCreated',
      timestamp: now - 120_000,
      signature: '5uN3x...mock1',
      slot: 312_000_001,
      learner: '7xKXt...4mPn',
      courseId: 'solana-101',
    },
    {
      type: 'LessonCompleted',
      timestamp: now - 90_000,
      signature: '3kJm2...mock2',
      slot: 312_000_042,
      learner: '7xKXt...4mPn',
      courseId: 'solana-101',
      lessonIndex: 0,
      xpAwarded: 50,
    },
    {
      type: 'LessonCompleted',
      timestamp: now - 60_000,
      signature: '8pQw7...mock3',
      slot: 312_000_089,
      learner: 'Bq9Rf...8vJk',
      courseId: 'anchor-deep-dive',
      lessonIndex: 2,
      xpAwarded: 75,
    },
    {
      type: 'AchievementAwarded',
      timestamp: now - 45_000,
      signature: '2rFv9...mock4',
      slot: 312_000_115,
      recipient: '7xKXt...4mPn',
      achievementId: 'first-enrollment',
      xpAwarded: 100,
    },
    {
      type: 'CourseFinalized',
      timestamp: now - 30_000,
      signature: '6hNw4...mock5',
      slot: 312_000_200,
      learner: '3nPwQ...6aLm',
      courseId: 'solana-101',
      totalXp: 500,
    },
    {
      type: 'CredentialIssued',
      timestamp: now - 15_000,
      signature: '9bTx1...mock6',
      slot: 312_000_245,
      recipient: '3nPwQ...6aLm',
      courseId: 'solana-101',
      assetId: 'CrEd1...nft1',
    },
  ];
}

interface UseProgramEventsReturn {
  events: ProgramEvent[];
  isListening: boolean;
  error: string | null;
  clear: () => void;
}

/**
 * Hook for subscribing to real-time program events via `connection.onLogs`.
 * Falls back to mock events when the Solana connection is unavailable.
 *
 * The hook attempts a live websocket subscription to the program ID.
 * If the connection fails (network error, devnet down, etc.), it
 * populates the events array with deterministic mock data so downstream
 * components always have something to render.
 */
export function useProgramEvents(): UseProgramEventsReturn {
  const [events, setEvents] = useState<ProgramEvent[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const subscriptionRef = useRef<number | null>(null);
  const connectionRef = useRef<Connection | null>(null);

  const clear = useCallback(() => {
    setEvents([]);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function subscribe() {
      try {
        // Dynamically import to avoid SSR issues with @solana/web3.js
        const { getConnection } = await import('@/lib/solana/program');
        const connection = getConnection();
        connectionRef.current = connection;

        const subId = connection.onLogs(
          PROGRAM_ID,
          (logInfo) => {
            if (cancelled) return;

            if (logInfo.err) return;

            const parsed = parseEventsFromLogs(
              logInfo.logs,
              logInfo.signature,
              0, // slot not available from onLogs callback
            );

            if (parsed.length > 0) {
              setEvents((prev) => {
                const next = [...parsed, ...prev];
                return next.slice(0, MAX_EVENTS);
              });
            }
          },
          'confirmed',
        );

        subscriptionRef.current = subId;
        if (!cancelled) {
          setIsListening(true);
          setError(null);
        }
      } catch (err) {
        if (cancelled) return;

        const message = err instanceof Error ? err.message : 'Failed to connect';
        setError(message);
        setIsListening(false);

        // Fallback: populate with mock events
        setEvents(generateMockEvents());
      }
    }

    void subscribe();

    return () => {
      cancelled = true;
      if (subscriptionRef.current !== null && connectionRef.current) {
        connectionRef.current
          .removeOnLogsListener(subscriptionRef.current)
          .catch(() => {
            // Cleanup failure is non-critical
          });
        subscriptionRef.current = null;
      }
    };
  }, []);

  return { events, isListening, error, clear };
}
