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

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Called by the registrar inside `SolanaWalletProvider` on mount and on every
 * wallet-state change. Returns an unregister that only clears its OWN
 * registration — a stale unmount (e.g. the modal's scoped stack unmounting
 * after a platform stack took over) never wipes the live stack.
 */
export function publishAmbientWallet(next: AmbientWalletState): () => void {
  state = next;
  // A live stack closes the catcher's capture window by definition.
  returnCaptureActive = false;
  emit();
  return () => {
    if (state === next) {
      state = null;
      emit();
    }
  };
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

/** The live wallet surface, or null when no provider stack is mounted. */
export function useAmbientWallet(): AmbientWalletState | null {
  return useSyncExternalStore(subscribe, getAmbientWallet, serverNull);
}

/** Whether a wallet provider stack is currently mounted anywhere. */
export function useAmbientWalletLive(): boolean {
  return useAmbientWallet() !== null;
}

/** See {@link setWalletReturnCaptureActive}. */
export function useWalletReturnCaptureActive(): boolean {
  return useSyncExternalStore(
    subscribe,
    getWalletReturnCaptureActive,
    serverFalse
  );
}
