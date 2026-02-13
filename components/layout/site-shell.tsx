import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';

export function SiteShell({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <div className="relative min-h-screen overflow-x-clip bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -left-28 top-14 h-72 w-72 rounded-full bg-primary/12 blur-3xl" />
        <div className="absolute -right-20 bottom-16 h-72 w-72 rounded-full bg-accent/12 blur-3xl" />
      </div>
      <SiteHeader />
      <main className="mx-auto w-full max-w-7xl px-4 pb-14 pt-8 md:pt-10">{children}</main>
      <SiteFooter />
    </div>
  );
}
