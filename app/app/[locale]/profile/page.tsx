'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useLocale, useTranslations } from 'next-intl';
import { User, Shield, Award, BookOpen } from 'lucide-react';
import { localePath } from '@/lib/paths';

export default function ProfilePage() {
  const locale = useLocale();
  const router = useRouter();
  const { connected, publicKey } = useWallet();
  const t = useTranslations('profile');

  useEffect(() => {
    if (connected && publicKey) {
      router.replace(`/${locale}/perfil/${publicKey.toBase58()}`);
    }
  }, [connected, publicKey, locale, router]);

  if (connected && publicKey) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-pulse text-gray-400 text-sm">{t('redirecting')}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 shadow-lg shadow-purple-900/30">
          <User className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white">{t('connect_to_view')}</h1>
        <p className="text-gray-400 text-sm leading-relaxed">{t('connect_description')}</p>

        <div className="flex justify-center">
          <WalletMultiButton
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
              borderRadius: '1rem',
              fontSize: '0.875rem',
              padding: '0.75rem 1.5rem',
              height: 'auto',
              fontWeight: 600,
            }}
          />
        </div>

        <div className="grid grid-cols-3 gap-3 pt-4">
          {[
            { icon: Shield, label: t('feature_achievements') },
            { icon: Award, label: t('feature_credentials') },
            { icon: BookOpen, label: t('feature_progress') },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="rounded-xl border border-gray-800 bg-gray-900/40 p-3 text-center">
              <Icon className="mx-auto h-5 w-5 text-purple-400 mb-1.5" />
              <span className="text-xs text-gray-500">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
