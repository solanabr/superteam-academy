'use client';

import { SessionProvider } from 'next-auth/react';
import { type Session } from 'next-auth';

interface AuthProviderWrapperProps {
  children: React.ReactNode;
  session?: Session | null;
}

export default function AuthProviderWrapper({
  children,
  session,
}: AuthProviderWrapperProps) {
  return <SessionProvider session={session}>{children}</SessionProvider>;
}
