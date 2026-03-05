"use client";

import { Component, type ReactNode } from "react";
import * as Sentry from "@sentry/nextjs";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
    children: ReactNode;
    /** Optional fallback UI. If not provided, a default error card is rendered. */
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

/**
 * Sentry-integrated error boundary for client components.
 * Captures exceptions and reports them to Sentry automatically.
 * Use this around page-level client components or sections that might throw.
 *
 * Usage:
 *   <ErrorBoundary>
 *     <SomeClientComponent />
 *   </ErrorBoundary>
 */
export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        Sentry.captureException(error, {
            contexts: {
                react: {
                    componentStack: errorInfo.componentStack ?? undefined,
                },
            },
        });
    }

    handleReset = () => {
        this.setState({ hasError: false, error: undefined });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback;

            return (
                <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 rounded-2xl border border-border/60 bg-card/80 p-8 text-center backdrop-blur-sm">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10">
                        <AlertTriangle className="h-7 w-7 text-destructive" />
                    </div>
                    <div>
                        <h3 className="font-display text-lg font-bold">
                            Something went wrong
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground max-w-sm">
                            An unexpected error occurred. The error has been
                            reported and our team will look into it.
                        </p>
                    </div>
                    {process.env.NODE_ENV === "development" && this.state.error && (
                        <pre className="mt-2 max-w-lg overflow-auto rounded-lg bg-destructive/5 p-3 text-left text-xs text-destructive">
                            {this.state.error.message}
                        </pre>
                    )}
                    <Button
                        onClick={this.handleReset}
                        variant="outline"
                        className="mt-2 gap-2 rounded-full"
                    >
                        <RefreshCcw className="h-3.5 w-3.5" />
                        Try Again
                    </Button>
                </div>
            );
        }

        return this.props.children;
    }
}
