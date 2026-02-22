"use client";

import { useEffect, useRef } from "react";
import type {
  ProgramEvents,
  ProgramEventName,
  EventCallback,
} from "@/lib/solana/events";
import {
  subscribeToEvent,
  unsubscribeFromEvent,
} from "@/lib/solana/events";

export type { ProgramEvents, ProgramEventName };

/**
 * Subscribe to a single on-chain program event via Anchor addEventListener.
 * Automatically cleans up on unmount.
 */
export function useProgramEvent<E extends ProgramEventName>(
  eventName: E,
  callback: EventCallback<E>,
  enabled = true,
) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!enabled) return;

    const listenerId = subscribeToEvent(eventName, (event, slot, signature) => {
      callbackRef.current(event, slot, signature);
    });

    return () => {
      if (listenerId !== null) {
        unsubscribeFromEvent(listenerId);
      }
    };
  }, [eventName, enabled]);
}

/**
 * Subscribe to multiple events at once. Manages its own cleanup.
 */
export function useProgramEvents(
  handlers: Partial<{
    [E in ProgramEventName]: EventCallback<E>;
  }>,
  enabled = true,
) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!enabled) return;

    const listenerIds: number[] = [];

    for (const eventName of Object.keys(handlersRef.current) as ProgramEventName[]) {
      const handler = handlersRef.current[eventName];
      if (!handler) continue;

      const listenerId = subscribeToEvent(
        eventName,
        (event: ProgramEvents[typeof eventName], slot: number, signature: string) => {
          const currentHandler = handlersRef.current[eventName] as
            | EventCallback<typeof eventName>
            | undefined;
          currentHandler?.(event, slot, signature);
        },
      );
      if (listenerId !== null) {
        listenerIds.push(listenerId);
      }
    }

    return () => {
      for (const id of listenerIds) {
        unsubscribeFromEvent(id);
      }
    };
  }, [enabled]);
}
