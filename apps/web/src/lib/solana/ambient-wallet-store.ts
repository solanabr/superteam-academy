"use client";

import { useSyncExternalStore } from "react";

/**
 * Bridge between the wallet provider stack and the components that render
 * OUTSIDE it (#1097 rework): since the stack mounts in (platform)/layout.tsx
 * — or scoped around the sign-in flow — while Header/UserMenu/AuthModal live
 * in [locale]/layout.tsx ABOVE it, React context can never reach them. A
 * module-level store can: `SolanaWalletProvider` publishes the live wallet
 * surface from an inner registrar, and outside components subscribe via
 * `useSyncExternalStore`.
 *
 * Deliberately SDK-free (same reasoning as `lib/dynamic/social-return-pending`):
 * Header imports this on every route, so no wallet-adapter or Dynamic bytes
 * may ride along.
 */

export interface AmbientWalletState {
  connected: boolean;
  /** Base58, or null while disconnected. */
  publicKey: string | null;
  disconnect: () => Promise<void>;
  /** Opens wallet-adapter's wallet-select modal (WalletModalProvider). */
  openWalletModal: () => void;
}

let state: AmbientWalletState | null = null;

/**
 * All live registrations, keyed by owner. Normally one entry; briefly two
 * while crossing route groups (scoped stack + platform stack), which
 * AuthModal watches via the count to disarm its own stack (review NEW-2).
 */
const registrations = new Map<object, AmbientWalletState>();

/**
 * True from the moment `DynamicReturnCatcher` decides to mount the scoped
 * provider stack (synchronously, before the lazy chunk resolves) until any
 * stack registers. AuthModal must not arm its own scoped stack inside this
 * window — two stacks would race autoConnect and SIWS.
 */
let returnCaptureActive = false;

const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((listener) => listener());
}

/** Notifies on any store change (registrations, state, capture flag). */
export function subscribeAmbientWallet(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const subscribe = subscribeAmbientWallet;

/**
 * Called by the registrar inside `SolanaWalletProvider` on mount and on every
 * wallet-state change. Returns an unregister that only clears its OWN
 * registration — a stale unmount (e.g. the modal's scoped stack unmounting
 * after a platform stack took over) never wipes the live stack.
 *
 * `owner` identifies the registrar across re-publishes: passing the same
 * owner replaces the registration IN PLACE, so subscribers never observe a
 * transient null between two states of one stack (review NEW-3). It defaults
 * to the state object itself, which keeps one-shot callers (tests) simple.
 */
export function publishAmbientWallet(
  next: AmbientWalletState,
  owner: object = next
): () => void {
  registrations.set(owner, next);
  state = next;
  // A live stack closes the catcher's capture window by definition.
  returnCaptureActive = false;
  emit();
  return () => {
    const owned = registrations.get(owner);
    if (owned !== next) return; // superseded by a newer publish for this owner
    registrations.delete(owner);
    if (state === next) {
      // Fall back to any remaining stack (brief route-group overlaps).
      state = [...registrations.values()][registrations.size - 1] ?? null;
    }
    emit();
  };
}

/** How many provider stacks are currently registered. */
export function getAmbientStackCount(): number {
  return registrations.size;
}

/**
 * Re-opens sign-in after a failed capture (review NEW-1): if the catcher's
 * scoped-stack chunk fails to load, no registration will ever arrive to
 * clear the flag — without this, every AuthTriggerButton stays disabled at
 * "Signing in…" for the rest of the page's life.
 */
export function clearWalletReturnCapture(): void {
  if (!returnCaptureActive) return;
  returnCaptureActive = false;
  emit();
}

export function getAmbientWallet(): AmbientWalletState | null {
  return state;
}

export function setWalletReturnCaptureActive(): void {
  returnCaptureActive = true;
  emit();
}

export function getWalletReturnCaptureActive(): boolean {
  return returnCaptureActive;
}

const serverNull = () => null;
const serverFalse = () => false;
const serverZero = () => 0;

/** The live wallet surface, or null when no provider stack is mounted. */
export function useAmbientWallet(): AmbientWalletState | null {
  return useSyncExternalStore(subscribe, getAmbientWallet, serverNull);
}

/** Whether a wallet provider stack is currently mounted anywhere. */
export function useAmbientWalletLive(): boolean {
  return useAmbientWallet() !== null;
}

/** Live registration count — see {@link getAmbientStackCount}. */
export function useAmbientStackCount(): number {
  return useSyncExternalStore(subscribe, getAmbientStackCount, serverZero);
}

/** See {@link setWalletReturnCaptureActive}. */
export function useWalletReturnCaptureActive(): boolean {
  return useSyncExternalStore(
    subscribe,
    getWalletReturnCaptureActive,
    serverFalse
  );
}
