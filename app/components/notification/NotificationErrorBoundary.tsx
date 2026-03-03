'use client';

import React, { Component, type ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

/**
 * Error boundary for notification components.
 *
 * Catches rendering errors in notification toasts, dropdowns, etc.
 * and prevents them from crashing the rest of the application.
 */
export class NotificationErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo): void {
        console.error('[NotificationErrorBoundary] Caught error:', error, info.componentStack);
    }

    render(): ReactNode {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }
            return (
                <div
                    style={{
                        padding: '0.5rem 1rem',
                        background: 'rgba(255,59,48,0.1)',
                        border: '1px solid rgba(255,59,48,0.2)',
                        borderRadius: '0.5rem',
                        color: 'rgba(255,255,255,0.6)',
                        fontSize: '0.75rem',
                    }}
                >
                    Notifications unavailable
                </div>
            );
        }

        return this.props.children;
    }
}
