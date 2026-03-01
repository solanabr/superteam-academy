'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useWallet } from '@solana/wallet-adapter-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ThreadCategory, CreateThreadInput } from '@/lib/supabase/forum';

interface NewThreadDialogProps {
  onSubmit: (input: CreateThreadInput) => Promise<void>;
  children: React.ReactNode;
}

const CATEGORIES: { value: ThreadCategory; label: string }[] = [
  { value: 'general', label: 'General' },
  { value: 'help', label: 'Help' },
  { value: 'show-and-tell', label: 'Show & Tell' },
  { value: 'ideas', label: 'Ideas' },
];

export function NewThreadDialog({ onSubmit, children }: NewThreadDialogProps) {
  const t = useTranslations('community');
  const { publicKey } = useWallet();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState<ThreadCategory>('general');
  const [tagsInput, setTagsInput] = useState('');

  const canSubmit =
    publicKey &&
    title.trim().length > 0 &&
    body.trim().length > 0 &&
    !isSubmitting;

  function resetForm() {
    setTitle('');
    setBody('');
    setCategory('general');
    setTagsInput('');
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) return;

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    setIsSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        body: body.trim(),
        category,
        tags,
        authorWallet: publicKey.toBase58(),
      });
      resetForm();
      setOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t('new_thread')}</DialogTitle>
            <DialogDescription>{t('new_thread_description')}</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            {/* Title */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="thread-title">{t('thread_title')}</Label>
              <Input
                id="thread-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('thread_title_placeholder')}
                maxLength={200}
                disabled={isSubmitting}
              />
            </div>

            {/* Category */}
            <div className="flex flex-col gap-2">
              <Label>{t('category')}</Label>
              <Select
                value={category}
                onValueChange={(v) => setCategory(v as ThreadCategory)}
                disabled={isSubmitting}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Body */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="thread-body">{t('thread_body')}</Label>
              <Textarea
                id="thread-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={t('thread_body_placeholder')}
                rows={6}
                className="resize-y"
                disabled={isSubmitting}
              />
            </div>

            {/* Tags */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="thread-tags">{t('tags')}</Label>
              <Input
                id="thread-tags"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder={t('tags_placeholder')}
                disabled={isSubmitting}
              />
              <p className="text-muted-foreground text-xs">{t('tags_hint')}</p>
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={!canSubmit}>
              {isSubmitting ? t('posting') : t('post_thread')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
