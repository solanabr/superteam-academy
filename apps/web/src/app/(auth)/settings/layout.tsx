import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Settings',
  description: 'Manage your account, wallet connections, preferences, and privacy settings.',
};

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
