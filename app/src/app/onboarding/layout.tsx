import { ReactNode } from 'react';

export const metadata = {
  title: 'Onboarding | CapySolBuild',
  description: 'Complete your profile and get started with CapySolBuild',
};

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return <div className="bg-background min-h-screen">{children}</div>;
}
