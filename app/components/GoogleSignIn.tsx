'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

interface GoogleCredentialResponse {
  credential: string;
  select_by: string;
}

interface GoogleUser {
  email: string;
  name: string;
  picture: string;
  sub: string; // Google user ID
}

function parseJwt(token: string): GoogleUser | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );
    return JSON.parse(json) as GoogleUser;
  } catch {
    return null;
  }
}

interface GoogleSignInProps {
  onSuccess?: (user: GoogleUser) => void;
  onError?: (error: string) => void;
  theme?: 'outline' | 'filled_blue' | 'filled_black';
  size?: 'large' | 'medium' | 'small';
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  className?: string;
}

/**
 * GoogleSignIn — renders the official Google Identity Services sign-in button.
 *
 * Set NEXT_PUBLIC_GOOGLE_CLIENT_ID in Vercel env vars to enable.
 * Without it, the component renders nothing (graceful degradation).
 *
 * The button can be used alongside Solana wallet auth — users may choose
 * either method. Google auth stores an ID token in localStorage under
 * 'academy-google-user' for session persistence.
 */
export default function GoogleSignIn({
  onSuccess,
  onError,
  theme = 'filled_black',
  size = 'large',
  text = 'continue_with',
  className = '',
}: GoogleSignInProps) {
  const buttonRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);

  function handleCredentialResponse(response: GoogleCredentialResponse) {
    const user = parseJwt(response.credential);
    if (!user) {
      onError?.('Failed to parse Google credential');
      return;
    }
    // Persist for session continuity (no server-side session required)
    try {
      localStorage.setItem('academy-google-user', JSON.stringify(user));
    } catch {
      // storage unavailable — still call onSuccess
    }
    onSuccess?.(user);
  }

  function initGoogle() {
    if (!GOOGLE_CLIENT_ID || !window.google?.accounts?.id) return;
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleCredentialResponse,
      auto_select: false,
    });
    if (buttonRef.current) {
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme,
        size,
        text,
        shape: 'rectangular',
        width: 300,
      });
    }
    setLoaded(true);
  }

  useEffect(() => {
    if (loaded && buttonRef.current) initGoogle();
  }, [loaded]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!GOOGLE_CLIENT_ID) return null;

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setLoaded(true)}
      />
      <div ref={buttonRef} className={className} />
    </>
  );
}

// ---------------------------------------------------------------------------
// Hook for reading stored Google session
// ---------------------------------------------------------------------------

export function useGoogleUser(): GoogleUser | null {
  const [user, setUser] = useState<GoogleUser | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('academy-google-user');
      if (stored) setUser(JSON.parse(stored) as GoogleUser);
    } catch {
      // ignore
    }
  }, []);

  return user;
}

export function signOutGoogle() {
  try {
    localStorage.removeItem('academy-google-user');
    if (window.google?.accounts?.id) {
      window.google.accounts.id.disableAutoSelect();
    }
  } catch {
    // ignore
  }
}

// Extend window type for Google Identity Services
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: Record<string, unknown>) => void;
          renderButton: (element: HTMLElement, config: Record<string, unknown>) => void;
          disableAutoSelect: () => void;
          prompt: () => void;
        };
      };
    };
  }
}
