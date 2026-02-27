'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useLocale } from 'next-intl';
import { Link2, CheckCircle2, AlertCircle, Wallet, Mail } from 'lucide-react';
import GoogleSignInButton from './GoogleSignInButton';
import { useGoogleUser } from './GoogleSignIn';
import { cn } from '@/lib/utils';

const LABELS: Record<string, Record<string, string>> = {
  title: {
    'pt-BR': 'Vincular Contas',
    en: 'Link Accounts',
    es: 'Vincular Cuentas',
  },
  subtitle: {
    'pt-BR': 'Conecte sua carteira Solana e conta Google para sincronizar seu progresso em todos os dispositivos.',
    en: 'Connect your Solana wallet and Google account to sync progress across all devices.',
    es: 'Conecta tu billetera Solana y cuenta Google para sincronizar progreso en todos los dispositivos.',
  },
  wallet_label: {
    'pt-BR': 'Carteira Solana',
    en: 'Solana Wallet',
    es: 'Billetera Solana',
  },
  google_label: {
    'pt-BR': 'Conta Google',
    en: 'Google Account',
    es: 'Cuenta Google',
  },
  connected: {
    'pt-BR': 'Conectado',
    en: 'Connected',
    es: 'Conectado',
  },
  not_connected: {
    'pt-BR': 'Nao conectado',
    en: 'Not connected',
    es: 'No conectado',
  },
  linked: {
    'pt-BR': 'Contas vinculadas com sucesso',
    en: 'Accounts linked successfully',
    es: 'Cuentas vinculadas exitosamente',
  },
  link_info: {
    'pt-BR': 'Conecte ambas para vincular automaticamente.',
    en: 'Connect both to link automatically.',
    es: 'Conecta ambas para vincular automaticamente.',
  },
};

const L = (obj: Record<string, string>, locale: string) => obj[locale] ?? obj['pt-BR'];

export default function AccountLinking() {
  const locale = useLocale();
  const { connected, publicKey } = useWallet();
  const googleUser = useGoogleUser();
  const bothConnected = connected && Boolean(googleUser);

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Link2 className="h-5 w-5 text-purple-400" />
        <h3 className="text-lg font-bold text-white">{L(LABELS.title, locale)}</h3>
      </div>
      <p className="text-sm text-gray-400 mb-6">{L(LABELS.subtitle, locale)}</p>

      <div className="space-y-4">
        {/* Solana Wallet */}
        <div className={cn(
          'flex items-center justify-between rounded-xl border p-4',
          connected ? 'border-green-700/50 bg-green-900/10' : 'border-gray-700 bg-gray-800/30'
        )}>
          <div className="flex items-center gap-3">
            <div className={cn(
              'flex h-10 w-10 items-center justify-center rounded-lg',
              connected ? 'bg-green-900/50' : 'bg-gray-700'
            )}>
              <Wallet className={cn('h-5 w-5', connected ? 'text-green-400' : 'text-gray-400')} />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">{L(LABELS.wallet_label, locale)}</div>
              {connected && publicKey ? (
                <div className="text-xs text-green-400 font-mono">
                  {publicKey.toBase58().slice(0, 4)}...{publicKey.toBase58().slice(-4)}
                </div>
              ) : (
                <div className="text-xs text-gray-400">{L(LABELS.not_connected, locale)}</div>
              )}
            </div>
          </div>
          {connected ? (
            <CheckCircle2 className="h-5 w-5 text-green-400" />
          ) : (
            <WalletMultiButton
              style={{
                background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                borderRadius: '0.5rem',
                fontSize: '0.75rem',
                padding: '0.5rem 1rem',
                height: '2rem',
              }}
            />
          )}
        </div>

        {/* Google Account */}
        <div className={cn(
          'flex items-center justify-between rounded-xl border p-4',
          googleUser ? 'border-green-700/50 bg-green-900/10' : 'border-gray-700 bg-gray-800/30'
        )}>
          <div className="flex items-center gap-3">
            <div className={cn(
              'flex h-10 w-10 items-center justify-center rounded-lg',
              googleUser ? 'bg-green-900/50' : 'bg-gray-700'
            )}>
              <Mail className={cn('h-5 w-5', googleUser ? 'text-green-400' : 'text-gray-400')} />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">{L(LABELS.google_label, locale)}</div>
              {googleUser ? (
                <div className="text-xs text-green-400">{googleUser.name}</div>
              ) : (
                <div className="text-xs text-gray-400">{L(LABELS.not_connected, locale)}</div>
              )}
            </div>
          </div>
          {googleUser ? (
            <CheckCircle2 className="h-5 w-5 text-green-400" />
          ) : (
            <GoogleSignInButton compact />
          )}
        </div>
      </div>

      {/* Link status */}
      <div className="mt-4 flex items-center gap-2">
        {bothConnected ? (
          <>
            <CheckCircle2 className="h-4 w-4 text-green-400" />
            <span className="text-sm text-green-400">{L(LABELS.linked, locale)}</span>
          </>
        ) : (
          <>
            <AlertCircle className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-400">{L(LABELS.link_info, locale)}</span>
          </>
        )}
      </div>
    </div>
  );
}
