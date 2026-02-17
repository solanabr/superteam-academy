'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ThreadCategory } from '@/services/community.service';

interface CreateThreadModalProps {
  onSubmit: (data: { title: string; content: string; category: ThreadCategory }) => void;
}

export function CreateThreadModal({ onSubmit }: CreateThreadModalProps) {
  const t = useTranslations('community');
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<ThreadCategory>('general');

  const handleSubmit = () => {
    if (!title.trim() || !content.trim()) return;
    onSubmit({ title: title.trim(), content: content.trim(), category });
    setTitle('');
    setContent('');
    setCategory('general');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          {t('createThread')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('createThread')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="thread-title">{t('threadTitle')}</Label>
            <Input
              id="thread-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('threadTitle')}
            />
          </div>
          <div>
            <Label htmlFor="thread-category">{t('threadCategory')}</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as ThreadCategory)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">{t('categories.general')}</SelectItem>
                <SelectItem value="help">{t('categories.help')}</SelectItem>
                <SelectItem value="show-and-tell">{t('categories.showAndTell')}</SelectItem>
                <SelectItem value="course-discussion">{t('categories.courseDiscussion')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="thread-content">{t('threadContent')}</Label>
            <Textarea
              id="thread-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t('threadContent')}
              rows={5}
            />
          </div>
          <Button onClick={handleSubmit} className="w-full" disabled={!title.trim() || !content.trim()}>
            {t('createThread')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
