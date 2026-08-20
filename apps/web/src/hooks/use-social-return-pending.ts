"use client";

import { useSyncExternalStore } from "react";
import {
  getSocialReturnPending,
  subscribeSocialReturnPending,
} from "@/lib/dynamic/social-return-pending";

/**
 * Whether the Google-return handshake is running right now. Sign-in buttons
 * use it to show a loading state during the window where the page would
 * otherwise look signed-out for several seconds. Server snapshot is `false`:
 * the handshake only exists after hydration.
 */
export function useSocialReturnPending(): boolean {
  return useSyncExternalStore(
    subscribeSocialReturnPending,
    getSocialReturnPending,
    () => false
  );
}
