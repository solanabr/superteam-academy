'use client';

import { LogoLoader } from './logo-loader';

interface LoadingSpinnerProps {
  size?: number;
  message?: string;
}

export function LoadingSpinner({ size = 24, message = 'Loading...' }: LoadingSpinnerProps) {
  // Map numeric size to logo size categories
  const logoSize = size <= 24 ? 'sm' : size <= 48 ? 'md' : size <= 64 ? 'lg' : 'xl';

  return <LogoLoader size={logoSize} message={message} />;
}
