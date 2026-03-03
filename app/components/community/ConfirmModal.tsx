/**
 * ConfirmModal — in-app confirmation dialog replacing browser confirm().
 * Renders a centered backdrop + card with title, message, and two CTA buttons.
 * Uses brand design tokens and 44px hit targets.
 */
'use client';

import { useEffect, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
    open: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export function ConfirmModal({
    open,
    title,
    message,
    confirmLabel = 'Delete',
    cancelLabel = 'Cancel',
    onConfirm,
    onCancel,
}: ConfirmModalProps) {
    const confirmRef = useRef<HTMLButtonElement>(null);

    // Focus the cancel button on open, trap keyboard
    useEffect(() => {
        if (open) {
            confirmRef.current?.focus();
            const handler = (e: KeyboardEvent) => {
                if (e.key === 'Escape') onCancel();
            };
            window.addEventListener('keydown', handler);
            return () => window.removeEventListener('keydown', handler);
        }
    }, [open, onCancel]);

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={onCancel}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

            {/* Card */}
            <div
                className="relative w-full max-w-sm rounded-2xl bg-card border border-border shadow-2xl p-6 space-y-4"
                onClick={(e) => e.stopPropagation()}
                role="alertdialog"
                aria-modal
                aria-labelledby="confirm-title"
                aria-describedby="confirm-desc"
            >
                {/* Icon + Title */}
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                    </div>
                    <h3
                        id="confirm-title"
                        className="text-base font-bold text-foreground font-display"
                    >
                        {title}
                    </h3>
                </div>

                {/* Message */}
                <p
                    id="confirm-desc"
                    className="text-sm text-muted-foreground font-supreme leading-relaxed"
                >
                    {message}
                </p>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2.5 rounded-full text-sm font-supreme font-medium text-muted-foreground hover:text-foreground transition-colors min-h-[44px]"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        ref={confirmRef}
                        onClick={onConfirm}
                        className="px-5 py-2.5 rounded-full text-sm font-supreme font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
