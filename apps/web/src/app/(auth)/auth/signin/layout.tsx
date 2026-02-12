import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in with Google, GitHub, or your Solana wallet to start learning.',
};

export default function SignInLayout({ children }: { children: React.ReactNode }) {
  return children;
}
