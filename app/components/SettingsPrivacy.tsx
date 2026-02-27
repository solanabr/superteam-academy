'use client';

import { useState } from 'react';

export function SettingsPrivacy() {
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [exportRequested, setExportRequested] = useState(false);

  return (
    <div className="mt-4 space-y-4">
      <div>
        <p className="text-caption font-medium text-[rgb(var(--text-muted))]">Profile visibility</p>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => setVisibility('public')}
            className={`rounded-lg px-4 py-2 text-caption font-medium transition ${
              visibility === 'public' ? 'bg-accent text-[rgb(3_7_18)]' : 'border border-border bg-surface text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text))]'
            }`}
          >
            Public
          </button>
          <button
            type="button"
            onClick={() => setVisibility('private')}
            className={`rounded-lg px-4 py-2 text-caption font-medium transition ${
              visibility === 'private' ? 'bg-accent text-[rgb(3_7_18)]' : 'border border-border bg-surface text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text))]'
            }`}
          >
            Private
          </button>
        </div>
        <p className="mt-1 text-caption text-[rgb(var(--text-subtle))]">
          Stub: preference not persisted. Production: save to backend.
        </p>
      </div>
      <div>
        <p className="text-caption font-medium text-[rgb(var(--text-muted))]">Data export</p>
        <button
          type="button"
          onClick={() => setExportRequested(true)}
          className="mt-2 rounded-lg border border-border bg-surface px-4 py-2 text-caption font-medium text-[rgb(var(--text))] transition hover:bg-surface-elevated"
        >
          Export my data
        </button>
        {exportRequested && (
          <p className="mt-2 text-caption text-[rgb(var(--text-muted))]">
            Export requested. In production, you would receive a link to download your progress and profile data.
          </p>
        )}
      </div>
    </div>
  );
}
