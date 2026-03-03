/**
 * NewThreadForm — collapsible form for creating new community threads.
 * Uses native card/input tokens, Lucide icons (no emojis), and 44px min-height inputs (UX principle #11).
 */
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
    FileText,
    HelpCircle,
    Rocket,
    Megaphone,
} from 'lucide-react';
import type { Category } from './CategoryFilter';

const FORM_CATEGORIES: { key: Exclude<Category, 'all'>; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: 'general', icon: FileText },
    { key: 'help', icon: HelpCircle },
    { key: 'showcase', icon: Rocket },
    { key: 'feedback', icon: Megaphone },
];

interface NewThreadFormProps {
    onSubmit: (data: { title: string; content: string; category: string }) => Promise<void>;
    onCancel: () => void;
}

export function NewThreadForm({ onSubmit, onCancel }: NewThreadFormProps) {
    const t = useTranslations('community');
    const tCat = useTranslations('community.categories');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [category, setCategory] = useState<Exclude<Category, 'all'>>('general');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !content.trim()) return;
        setSubmitting(true);
        try {
            await onSubmit({ title, content, category });
            setTitle('');
            setContent('');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="mb-6 p-5 rounded-2xl bg-card border border-border space-y-4"
        >
            {/* Title input */}
            <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('threadTitle')}
                maxLength={255}
                className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground placeholder-muted-foreground font-supreme text-sm focus:outline-none focus:ring-2 focus:ring-ring min-h-[44px]"
            />

            {/* Category chips — badge style like category filter */}
            <div className="flex items-center gap-1.5 flex-wrap">
                {FORM_CATEGORIES.map((c) => {
                    const Icon = c.icon;
                    const isActive = category === c.key;
                    return (
                        <button
                            key={c.key}
                            type="button"
                            onClick={() => setCategory(c.key)}
                            className={`inline-flex items-center gap-1.5 rounded-full text-xs font-medium font-supreme whitespace-nowrap transition-colors duration-150 px-3 py-1.5 border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[32px] ${isActive
                                    ? 'bg-accent text-accent-foreground border-transparent'
                                    : 'bg-transparent text-muted-foreground border-border/60 hover:border-border hover:text-foreground'
                                }`}
                        >
                            <Icon className="w-3.5 h-3.5" />
                            {tCat(c.key)}
                        </button>
                    );
                })}
            </div>

            {/* Content textarea */}
            <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={t('writePost')}
                rows={5}
                maxLength={10000}
                className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground placeholder-muted-foreground font-supreme text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none min-h-[44px]"
            />

            {/* Actions */}
            <div className="flex items-center gap-3">
                <button
                    type="submit"
                    disabled={submitting || !title.trim() || !content.trim()}
                    className="cta-primary px-6 py-2.5 text-sm font-supreme font-semibold disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                >
                    {submitting ? t('posting') : t('postThread')}
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2.5 rounded-full text-sm font-supreme text-muted-foreground hover:text-foreground transition-colors min-h-[44px]"
                >
                    {t('cancel')}
                </button>
            </div>
        </form>
    );
}
