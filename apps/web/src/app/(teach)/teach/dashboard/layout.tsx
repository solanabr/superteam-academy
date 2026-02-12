import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Teacher Dashboard',
  description: 'Manage your courses, track student progress, and view teaching analytics.',
};

export default function TeachDashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
