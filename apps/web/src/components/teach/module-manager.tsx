'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Module } from '@/lib/mock-data';
import { LessonEditor } from './lesson-editor';

interface ModuleManagerProps {
  modules: Module[];
}

export function ModuleManager({ modules: initialModules }: ModuleManagerProps) {
  const t = useTranslations('teach');
  const [modules, setModules] = useState(initialModules);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);

  function moveModule(index: number, direction: 'up' | 'down') {
    const newModules = [...modules];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newModules.length) return;
    const temp = newModules[swapIndex]!;
    newModules[swapIndex] = newModules[index]!;
    newModules[index] = temp;
    setModules(newModules);
  }

  function addModule() {
    const newId = `new-mod-${Date.now()}`;
    setModules([...modules, { id: newId, title: '', description: '', lessons: [] }]);
    setExpandedModule(newId);
  }

  function removeModule(id: string) {
    setModules(modules.filter((m) => m.id !== id));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{t('modules')}</h3>
        <Button variant="outline" size="sm" onClick={addModule}>
          + {t('addModule')}
        </Button>
      </div>
      {modules.map((mod, i) => (
        <div key={mod.id} className="rounded-xl border bg-card">
          <div className="flex items-center gap-2 border-b p-4">
            <div className="flex flex-col gap-1">
              <button
                onClick={() => moveModule(i, 'up')}
                disabled={i === 0}
                className="text-xs disabled:opacity-30"
              >
                ▲
              </button>
              <button
                onClick={() => moveModule(i, 'down')}
                disabled={i === modules.length - 1}
                className="text-xs disabled:opacity-30"
              >
                ▼
              </button>
            </div>
            <span className="text-sm font-medium text-muted-foreground">#{i + 1}</span>
            <Input
              value={mod.title}
              onChange={(e) => {
                const newModules = [...modules];
                const target = newModules[i];
                if (target) {
                  target.title = e.target.value;
                  setModules(newModules);
                }
              }}
              placeholder={t('moduleTitle')}
              className="flex-1"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpandedModule(expandedModule === mod.id ? null : mod.id)}
            >
              {expandedModule === mod.id ? '−' : '+'}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => removeModule(mod.id)} className="text-red-400">
              ×
            </Button>
          </div>
          {expandedModule === mod.id && (
            <div className="p-4">
              <p className="mb-2 text-sm text-muted-foreground">
                {mod.lessons.length} {t('lessonsCount')}
              </p>
              {mod.lessons.map((lesson) => (
                <LessonEditor key={lesson.id} lesson={lesson} />
              ))}
              <Button variant="outline" size="sm" className="mt-2">
                + {t('addLesson')}
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
