import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Dashboard',
  description: 'Platform administration — users, courses, analytics, and system settings.',
};

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
