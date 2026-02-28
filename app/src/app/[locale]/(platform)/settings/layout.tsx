import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Settings',
  description:
    'Manage your Superteam Academy account preferences, notification settings, and connected wallets.',
};

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
