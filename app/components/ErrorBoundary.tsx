/**
 * ErrorBoundary — reusable React error boundary for catching render crashes.
 * Class component required: React error boundaries must use componentDidCatch.
 */
'use client';

import React from 'react';

interface ErrorBoundaryProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
        console.error('[ErrorBoundary] Caught render error:', error, errorInfo);
    }

    handleReset = (): void => {
        this.setState({ hasError: false, error: null });
    };

    render(): React.ReactNode {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="error-boundary">
                    <div className="error-boundary__card">
                        <span className="error-boundary__icon">⚠️</span>
                        <h3 className="error-boundary__title">Something went wrong</h3>
                        <p className="error-boundary__message">
                            {this.state.error?.message || 'An unexpected error occurred.'}
                        </p>
                        <button
                            className="error-boundary__btn"
                            onClick={this.handleReset}
                        >
                            Try again
                        </button>
                    </div>

                    <style jsx>{`
                        .error-boundary {
                            display: flex;
                            justify-content: center;
                            padding: 2rem 1rem;
                        }
                        .error-boundary__card {
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            gap: 0.75rem;
                            background: #1e293b;
                            border: 1px solid #334155;
                            border-radius: 1rem;
                            padding: 2rem;
                            max-width: 400px;
                            width: 100%;
                            text-align: center;
                        }
                        .error-boundary__icon {
                            font-size: 2.5rem;
                        }
                        .error-boundary__title {
                            font-size: 1.1rem;
                            font-weight: 700;
                            color: #e2e8f0;
                            margin: 0;
                        }
                        .error-boundary__message {
                            font-size: 0.85rem;
                            color: #94a3b8;
                            margin: 0;
                            line-height: 1.5;
                        }
                        .error-boundary__btn {
                            margin-top: 0.5rem;
                            padding: 0.5rem 1.5rem;
                            border-radius: 9999px;
                            border: 1px solid #7c3aed;
                            background: transparent;
                            color: #a78bfa;
                            font-size: 0.85rem;
                            font-weight: 600;
                            cursor: pointer;
                            transition: all 0.2s ease;
                        }
                        .error-boundary__btn:hover {
                            background: #7c3aed;
                            color: #fff;
                        }
                    `}</style>
                </div>
            );
        }

        return this.props.children;
    }
}
