/**
 * CommunityEmptyState — shown when no threads exist.
 * Clean single CTA — no tours, no coach marks (UX principle #2).
 */

import { MessageSquare } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function CommunityEmptyState({ onNewThread }: { onNewThread?: () => void }) {
    const t = useTranslations('community');

    return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                style={{ backgroundColor: 'var(--muted)' }}
            >
                <MessageSquare className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium text-foreground font-supreme mb-1">
                {t('noThreads')}
            </p>
            <p className="text-sm text-muted-foreground font-supreme mb-6">
                {t('startDiscussion')}
            </p>
            {onNewThread && (
                <button
                    onClick={onNewThread}
                    className="cta-primary px-6 py-3 text-sm font-supreme font-semibold"
                >
                    {t('newThread')}
                </button>
            )}
        </div>
    );
}
