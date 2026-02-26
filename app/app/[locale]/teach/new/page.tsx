'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Plus, Trash2, GripVertical, Save, Eye, BookOpen, Clock, Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { localePath } from '@/lib/paths';

type LessonDraft = {
  id: string;
  title: string;
  duration: string;
  xp: number;
  free: boolean;
};

const TRACKS = ['Solana', 'Anchor', 'DeFi', 'NFTs', 'Web3', 'Security', 'Tokens', 'Mobile'] as const;
const LEVELS = ['beginner', 'intermediate', 'advanced'] as const;

const GRADIENT_OPTIONS = [
  'from-purple-600 to-indigo-600',
  'from-green-600 to-teal-600',
  'from-orange-600 to-red-600',
  'from-pink-600 to-purple-600',
  'from-blue-600 to-cyan-600',
  'from-red-600 to-orange-600',
  'from-cyan-600 to-blue-600',
  'from-indigo-600 to-purple-600',
];

let nextId = 1;

export default function NewCoursePage() {
  const locale = useLocale();
  const t = useTranslations('teach');
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [level, setLevel] = useState<(typeof LEVELS)[number]>('beginner');
  const [track, setTrack] = useState<(typeof TRACKS)[number]>('Solana');
  const [xpReward, setXpReward] = useState(500);
  const [duration, setDuration] = useState('4h');
  const [gradient, setGradient] = useState(GRADIENT_OPTIONS[0]);
  const [tags, setTags] = useState('');
  const [objectives, setObjectives] = useState('');
  const [prerequisites, setPrerequisites] = useState('');
  const [lessons, setLessons] = useState<LessonDraft[]>([]);
  const [saving, setSaving] = useState(false);

  const addLesson = () => {
    setLessons((prev) => [
      ...prev,
      { id: `lesson-${nextId++}`, title: '', duration: '30min', xp: 100, free: false },
    ]);
  };

  const updateLesson = (id: string, field: keyof LessonDraft, value: string | number | boolean) => {
    setLessons((prev) => prev.map((l) => (l.id === id ? { ...l, [field]: value } : l)));
  };

  const removeLesson = (id: string) => {
    setLessons((prev) => prev.filter((l) => l.id !== id));
  };

  const handleSave = async (publish: boolean) => {
    setSaving(true);
    // In production: POST to /api/teach/courses with Sanity mutation
    // For now, simulate save
    await new Promise((r) => setTimeout(r, 1000));
    setSaving(false);
    router.push(localePath(locale, '/teach'));
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/60 py-6 px-4">
        <div className="mx-auto max-w-4xl flex items-center justify-between">
          <button
            onClick={() => router.push(localePath(locale, '/teach'))}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('back_to_teach')}
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSave(false)}
              disabled={saving || !title.trim()}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 disabled:opacity-40 transition-colors"
            >
              <Save className="h-4 w-4" />
              {t('save_draft')}
            </button>
            <button
              onClick={() => handleSave(true)}
              disabled={saving || !title.trim() || lessons.length === 0}
              className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm text-white hover:bg-purple-500 disabled:opacity-40 transition-colors"
            >
              <Eye className="h-4 w-4" />
              {t('publish')}
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-2xl font-bold text-white mb-6">{t('create_course')}</h1>

        {/* Preview card */}
        <div className="mb-8 rounded-2xl border border-gray-800 overflow-hidden">
          <div className={cn('h-32 bg-gradient-to-br relative', gradient)}>
            <div className="absolute inset-0 bg-black/20" />
            <div className="absolute bottom-3 left-4 flex items-center gap-2">
              <span className="rounded-full bg-black/40 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
                {track}
              </span>
              <span className="rounded-full bg-black/40 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
                {t(`level_${level}`)}
              </span>
            </div>
          </div>
          <div className="bg-gray-900 p-4">
            <h3 className="text-lg font-semibold text-white">{title || t('untitled')}</h3>
            <p className="text-sm text-gray-400 mt-1 line-clamp-2">{description || t('no_description')}</p>
            <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
              <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" /> {lessons.length} {t('lessons')}</span>
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {duration}</span>
              <span className="flex items-center gap-1"><Zap className="h-3 w-3 text-yellow-500" /> +{xpReward} XP</span>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">{t('field_title')}</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('field_title_placeholder')}
              className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">{t('field_description')}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('field_description_placeholder')}
              rows={3}
              className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 resize-none"
            />
          </div>

          {/* Level + Track row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">{t('field_level')}</label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as typeof level)}
                className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-purple-500 cursor-pointer"
              >
                {LEVELS.map((l) => (
                  <option key={l} value={l}>{t(`level_${l}`)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">{t('field_track')}</label>
              <select
                value={track}
                onChange={(e) => setTrack(e.target.value as typeof track)}
                className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-purple-500 cursor-pointer"
              >
                {TRACKS.map((tr) => (
                  <option key={tr} value={tr}>{tr}</option>
                ))}
              </select>
            </div>
          </div>

          {/* XP + Duration row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">{t('field_xp')}</label>
              <input
                type="number"
                value={xpReward}
                onChange={(e) => setXpReward(Number(e.target.value))}
                min={0}
                step={100}
                className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-gray-100 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">{t('field_duration')}</label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="4h"
                className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30"
              />
            </div>
          </div>

          {/* Gradient picker */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">{t('field_color')}</label>
            <div className="flex flex-wrap gap-2">
              {GRADIENT_OPTIONS.map((g) => (
                <button
                  key={g}
                  onClick={() => setGradient(g)}
                  className={cn(
                    'h-8 w-14 rounded-lg bg-gradient-to-br transition-all',
                    g,
                    gradient === g ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-950 scale-110' : 'opacity-60 hover:opacity-100',
                  )}
                />
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">{t('field_tags')}</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder={t('field_tags_placeholder')}
              className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30"
            />
          </div>

          {/* Objectives */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">{t('field_objectives')}</label>
            <textarea
              value={objectives}
              onChange={(e) => setObjectives(e.target.value)}
              placeholder={t('field_objectives_placeholder')}
              rows={3}
              className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 resize-none"
            />
          </div>

          {/* Prerequisites */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">{t('field_prerequisites')}</label>
            <textarea
              value={prerequisites}
              onChange={(e) => setPrerequisites(e.target.value)}
              placeholder={t('field_prerequisites_placeholder')}
              rows={2}
              className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 resize-none"
            />
          </div>

          {/* Curriculum Builder */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-300">{t('curriculum')}</label>
              <button
                onClick={addLesson}
                className="inline-flex items-center gap-1 rounded-lg bg-gray-800 border border-gray-700 px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-700 transition-colors"
              >
                <Plus className="h-3 w-3" /> {t('add_lesson')}
              </button>
            </div>

            {lessons.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-gray-800 rounded-xl">
                <BookOpen className="mx-auto h-8 w-8 text-gray-700 mb-2" />
                <p className="text-xs text-gray-500">{t('no_lessons')}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {lessons.map((lesson, i) => (
                  <div
                    key={lesson.id}
                    className="flex items-center gap-3 rounded-xl border border-gray-800 bg-gray-900/50 p-3"
                  >
                    <GripVertical className="h-4 w-4 text-gray-600 flex-shrink-0 cursor-grab" />
                    <span className="text-xs text-gray-500 w-6 flex-shrink-0">{i + 1}.</span>
                    <input
                      type="text"
                      value={lesson.title}
                      onChange={(e) => updateLesson(lesson.id, 'title', e.target.value)}
                      placeholder={t('lesson_title_placeholder')}
                      className="flex-1 bg-transparent text-sm text-gray-200 placeholder-gray-600 focus:outline-none"
                    />
                    <input
                      type="text"
                      value={lesson.duration}
                      onChange={(e) => updateLesson(lesson.id, 'duration', e.target.value)}
                      className="w-16 bg-gray-800 rounded-lg px-2 py-1 text-xs text-gray-300 text-center border border-gray-700"
                    />
                    <div className="flex items-center gap-1">
                      <Zap className="h-3 w-3 text-yellow-500" />
                      <input
                        type="number"
                        value={lesson.xp}
                        onChange={(e) => updateLesson(lesson.id, 'xp', Number(e.target.value))}
                        min={0}
                        step={50}
                        className="w-16 bg-gray-800 rounded-lg px-2 py-1 text-xs text-gray-300 text-center border border-gray-700"
                      />
                    </div>
                    <label className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={lesson.free}
                        onChange={(e) => updateLesson(lesson.id, 'free', e.target.checked)}
                        className="rounded border-gray-600"
                      />
                      {t('free')}
                    </label>
                    <button
                      onClick={() => removeLesson(lesson.id)}
                      className="p-1 text-gray-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
