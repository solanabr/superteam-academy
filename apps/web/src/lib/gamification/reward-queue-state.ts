"use client";

import { useSyncExternalStore } from "react";

/**
 * How many rewards the popup queue still has to play.
 *
 * The certificate popup is the loudest moment on the platform (gradient card +
 * full confetti) and it arrives on its own Realtime insert, which routinely
 * lands while the reward queue is mid-run — so it used to play UNDER a stack of
 * reward cards. It now waits for this counter to reach zero.
 *
 * A module store rather than context: the queue and the certificate popup are
 * siblings, and this is one number with no provider to hang off. Same pattern as
 * lib/solana/ambient-wallet-store.ts.
 */

let pending = 0;
const listeners = new Set<() => void>();

export function subscribeRewardQueue(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Published by RewardPopupQueue on every queue-length change. */
export function setRewardQueueLength(length: number): void {
  if (length === pending) return;
  pending = length;
  listeners.forEach((listener) => listener());
}

export function getRewardQueueLength(): number {
  return pending;
}

function isBusy(): boolean {
  return pending > 0;
}

const serverFalse = () => false;

/** True while any reward is queued or on screen. */
export function useRewardQueueBusy(): boolean {
  return useSyncExternalStore(subscribeRewardQueue, isBusy, serverFalse);
}

/** Test-only: drop back to an empty queue. */
export function __resetRewardQueueStateForTests(): void {
  setRewardQueueLength(0);
}
