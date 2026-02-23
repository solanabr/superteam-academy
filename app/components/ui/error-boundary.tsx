"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

function isWalletError(error: Error | null): boolean {
  if (!error) return false;
  const msg = error.message.toLowerCase();
  return (
    msg.includes("wallet") ||
    msg.includes("disconnect") ||
    msg.includes("not connected") ||
    error.name.includes("Wallet")
  );
}

function WalletReconnectFallback({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 p-8">
      <div className="rounded-xl border border-yellow-400/30 bg-yellow-400/5 p-6 text-center max-w-md">
        <svg className="mx-auto mb-3 h-10 w-10 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.75 6.75m3.128 3.128L3 3m18 18l-6.75-6.75" />
        </svg>
        <p className="text-lg font-semibold text-yellow-400 mb-2">
          Wallet Disconnected
        </p>
        <p className="text-sm text-content-secondary mb-4">
          Your wallet was disconnected. Reconnect to continue.
        </p>
        <div className="flex items-center justify-center gap-3">
          <WalletMultiButton />
          <button
            onClick={onRetry}
            className="rounded-lg border border-edge px-4 py-2 text-sm text-content-secondary hover:text-content"
          >
            Retry
          </button>
        </div>
      </div>
    </div>
  );
}

function GenericErrorFallback({
  error,
  onRetry,
}: {
  error: Error | null;
  onRetry: () => void;
}) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 p-8">
      <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-6 text-center max-w-md">
        <p className="text-lg font-semibold text-red-400 mb-2">
          Something went wrong
        </p>
        <p className="text-sm text-content-secondary mb-4">
          {error?.message || "An unexpected error occurred"}
        </p>
        <button
          onClick={onRetry}
          className="rounded-lg bg-solana-gradient px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      if (isWalletError(this.state.error)) {
        return <WalletReconnectFallback onRetry={this.handleRetry} />;
      }
      return (
        <GenericErrorFallback
          error={this.state.error}
          onRetry={this.handleRetry}
        />
      );
    }
    return this.props.children;
  }
}
