'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import type { Course, Difficulty } from '@/lib/mock-data';

interface CourseEditorProps {
  course?: Course;
}

export function CourseEditor({ course }: CourseEditorProps) {
  const t = useTranslations('teach');
  const [title, setTitle] = useState(course?.title ?? '');
  const [slug, setSlug] = useState(course?.slug ?? '');
  const [description, setDescription] = useState(course?.description ?? '');
  const [longDescription, setLongDescription] = useState(course?.longDescription ?? '');
  const [difficulty, setDifficulty] = useState<Difficulty>(course?.difficulty ?? 'beginner');
  const [duration, setDuration] = useState(String(course?.duration ?? ''));
  const [xp, setXp] = useState(String(course?.xp ?? ''));
  const [tags, setTags] = useState(course?.tags.join(', ') ?? '');
  const [prerequisites, setPrerequisites] = useState(course?.prerequisites.join(', ') ?? '');

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>{t('courseTitle')}</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>{t('courseSlug')}</Label>
          <Input value={slug} onChange={(e) => setSlug(e.target.value)} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>{t('courseDescription')}</Label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
      </div>

      <div className="space-y-2">
        <Label>{t('courseLongDescription')}</Label>
        <Textarea value={longDescription} onChange={(e) => setLongDescription(e.target.value)} rows={6} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label>{t('courseDifficulty')}</Label>
          <Select value={difficulty} onValueChange={(v) => setDifficulty(v as Difficulty)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="beginner">{t('beginner')}</SelectItem>
              <SelectItem value="intermediate">{t('intermediate')}</SelectItem>
              <SelectItem value="advanced">{t('advanced')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>{t('courseDuration')}</Label>
          <Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>XP</Label>
          <Input type="number" value={xp} onChange={(e) => setXp(e.target.value)} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>{t('courseTags')}</Label>
          <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="solana, rust, anchor" />
          <div className="flex flex-wrap gap-1">
            {tags.split(',').filter(Boolean).map((tag) => (
              <Badge key={tag.trim()} variant="secondary">{tag.trim()}</Badge>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <Label>{t('coursePrerequisites')}</Label>
          <Input value={prerequisites} onChange={(e) => setPrerequisites(e.target.value)} />
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline">{t('saveDraft')}</Button>
        <Button>{t('publishCourse')}</Button>
        <Button variant="secondary">{t('preview')}</Button>
      </div>
    </div>
  );
}
