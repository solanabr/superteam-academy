'use client';

import type { CredentialNFT } from '@/types';

interface Props {
  credentials: CredentialNFT[];
}

export default function CredentialGrid({ credentials }: Props) {
  if (credentials.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-surface-800 p-12 text-center">
        <div className="text-4xl mb-3">🎓</div>
        <p className="text-surface-200">Complete courses to earn credentials</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {credentials.map((cred) => (
        <div key={cred.id} className="card-hover group">
          {cred.image && (
            <div className="mb-4 aspect-square overflow-hidden rounded-xl bg-surface-800">
              <img src={cred.image} alt={cred.name} className="h-full w-full object-cover" />
            </div>
          )}
          <h4 className="font-semibold text-surface-50">{cred.name}</h4>
          {cred.attributes && (
            <div className="mt-2 flex flex-wrap gap-2">
              {cred.attributes.coursesCompleted !== undefined && (
                <span className="rounded-full bg-brand-600/10 px-2 py-0.5 text-xs text-brand-400">
                  {cred.attributes.coursesCompleted} courses
                </span>
              )}
              {cred.attributes.totalXp !== undefined && (
                <span className="rounded-full bg-accent-600/10 px-2 py-0.5 text-xs text-accent-400">
                  {cred.attributes.totalXp} XP
                </span>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
