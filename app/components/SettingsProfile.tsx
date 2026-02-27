'use client';

import { useState } from 'react';

export function SettingsProfile() {
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');

  return (
    <div className="mt-4 space-y-4">
      <div>
        <label htmlFor="settings-name" className="block text-caption font-medium text-[rgb(var(--text-muted))]">
          Display name
        </label>
        <input
          id="settings-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="mt-1 w-full rounded-lg border border-border/50 bg-[rgb(var(--bg))] px-3 py-2 text-body text-[rgb(var(--text))] placeholder:text-[rgb(var(--text-subtle))] focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>
      <div>
        <label htmlFor="settings-bio" className="block text-caption font-medium text-[rgb(var(--text-muted))]">
          Bio
        </label>
        <textarea
          id="settings-bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Short bio (shown on profile)"
          rows={3}
          className="mt-1 w-full rounded-lg border border-border/50 bg-[rgb(var(--bg))] px-3 py-2 text-body text-[rgb(var(--text))] placeholder:text-[rgb(var(--text-subtle))] focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>
      <p className="text-caption text-[rgb(var(--text-subtle))]">
        Avatar and social links: coming soon. Saved to local storage for now; production: backend or on-chain.
      </p>
    </div>
  );
}
