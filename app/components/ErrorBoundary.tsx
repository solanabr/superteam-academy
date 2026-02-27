'use client';

import React from 'react';
import Link from 'next/link';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught:', error, errorInfo);
    }
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="mx-auto max-w-md rounded-xl border border-border/50 bg-surface p-8 text-center">
          <p className="text-body font-semibold text-[rgb(var(--text))]">Something went wrong</p>
          <p className="text-caption mt-2 text-[rgb(var(--text-muted))]">
            We encountered an error. Try refreshing the page or going back.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => this.setState({ hasError: false })}
              className="rounded-lg bg-accent px-4 py-2 text-caption font-medium text-[rgb(3_7_18)] transition hover:bg-accent-hover"
            >
              Try again
            </button>
            <Link
              href="/"
              className="rounded-lg border border-border bg-surface px-4 py-2 text-caption font-medium text-[rgb(var(--text))] transition hover:bg-surface-elevated"
            >
              Go home
            </Link>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
