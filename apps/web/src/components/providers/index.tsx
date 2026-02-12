'use client';

import type { ReactNode } from 'react';
import { ThemeProvider } from './theme-provider';
import { SessionProvider } from './session-provider';
import { AnalyticsProvider } from './analytics-provider';

interface Props {
  children: ReactNode;
}

export function Providers({ children }: Props) {
  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange
      >
        <AnalyticsProvider>{children}</AnalyticsProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
