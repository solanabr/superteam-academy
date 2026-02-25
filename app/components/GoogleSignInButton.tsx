'use client';

import { signIn, signOut, useSession } from 'next-auth/react';
import { Mail, LogOut, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface GoogleSignInButtonProps {
  compact?: boolean;
}

// Check if Google OAuth is configured (NEXT_PUBLIC_ prefix makes it available client-side)
const GOOGLE_ENABLED =
  typeof process !== 'undefined' &&
  !!process.env.NEXT_PUBLIC_GOOGLE_ENABLED;

export default function GoogleSignInButton({ compact = false }: GoogleSignInButtonProps) {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);

  // Don't render if Google OAuth is not configured
  if (!GOOGLE_ENABLED) return null;

  if (status === 'loading') {
    return (
      <div
        className={cn(
          'rounded-lg bg-gray-800 animate-pulse',
          compact ? 'h-8 w-8' : 'h-9 w-32'
        )}
      />
    );
  }

  if (!session) {
    return (
      <button
        onClick={() => signIn('google')}
        className={cn(
          'flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-900 px-3 py-1.5',
          'text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white',
          'transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500',
          compact && 'px-2 py-1 text-xs'
        )}
        aria-label="Sign in with Google"
      >
        {/* Google icon */}
        <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        {!compact && <span>Sign in</span>}
      </button>
    );
  }

  // Signed in — show avatar dropdown
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-lg border border-gray-700 bg-gray-900 px-2 py-1.5 transition-colors hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
        aria-label="User menu"
        aria-expanded={open}
      >
        {session.user?.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={session.user.image}
            alt={session.user.name ?? 'User'}
            className="h-6 w-6 rounded-full"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-700">
            <Mail className="h-3.5 w-3.5 text-white" />
          </div>
        )}
        {!compact && (
          <span className="max-w-[100px] truncate text-xs font-medium text-gray-300">
            {session.user?.name ?? session.user?.email}
          </span>
        )}
        <ChevronDown className="h-3 w-3 text-gray-500" />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute right-0 z-20 mt-1 w-52 rounded-xl border border-gray-700 bg-gray-900 py-1 shadow-xl">
            <div className="border-b border-gray-800 px-4 py-2.5">
              <p className="truncate text-sm font-medium text-white">
                {session.user?.name}
              </p>
              <p className="truncate text-xs text-gray-500">
                {session.user?.email}
              </p>
            </div>
            <button
              onClick={() => {
                setOpen(false);
                signOut();
              }}
              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
}
