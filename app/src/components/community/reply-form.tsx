'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useWallet } from '@solana/wallet-adapter-react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

const MAX_CHARS = 2000;

interface ReplyFormProps {
  onSubmit: (body: string) => Promise<void>;
}

export function ReplyForm({ onSubmit }: ReplyFormProps) {
  const t = useTranslations('community');
  const { connected } = useWallet();
  const [body, setBody] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const charCount = body.length;
  const isOverLimit = charCount > MAX_CHARS;
  const canSubmit = connected && body.trim().length > 0 && !isOverLimit && !isSubmitting;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);
    try {
      await onSubmit(body.trim());
      setBody('');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!connected) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-center">
        <p className="text-muted-foreground text-sm">{t('connect_to_reply')}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <Textarea
        placeholder={t('reply_placeholder')}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={4}
        className="resize-y"
        disabled={isSubmitting}
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`text-xs tabular-nums ${
              isOverLimit
                ? 'text-red-600 dark:text-red-400'
                : 'text-muted-foreground'
            }`}
          >
            {charCount}/{MAX_CHARS}
          </span>
          <span className="text-muted-foreground text-xs">{t('markdown_hint')}</span>
        </div>

        <Button type="submit" size="sm" disabled={!canSubmit}>
          {isSubmitting ? (
            t('posting')
          ) : (
            <>
              <Send className="mr-1.5 size-4" />
              {t('post_reply')}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
