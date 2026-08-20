"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

/**
 * Catches a failed lazy chunk load (e.g. a stale chunk 404 right after a
 * deploy) so it never bubbles to the root error page (#1097 review F3/NEW-1).
 * Renders nothing when failed — the owner decides what recovery looks like
 * via `onError` (AuthModal shows an in-modal retry; DynamicReturnCatcher
 * clears its capture flag and stays silent). A rejected `React.lazy` caches
 * its rejection, so retrying means remounting via `key` AND recreating the
 * lazy components.
 */
export class ChunkErrorBoundary extends Component<
  { onError: (error: Error) => void; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, _info: ErrorInfo) {
    this.props.onError(error);
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}
