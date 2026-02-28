'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { LanguageSwitcher } from '@/components/layout/language-switcher';
import { SignInMenu } from '@/components/auth/sign-in-menu';
import { WalletConnectButton } from '@/components/layout/wallet-connect-button';
import {
  Menu,
  BookOpen,
  Trophy,
  Users,
  GraduationCap,
} from 'lucide-react';

interface NavLink {
  href: string;
  labelKey: 'courses' | 'leaderboard' | 'community';
  icon: React.ComponentType<{ className?: string }>;
}

const navLinks: NavLink[] = [
  { href: '/courses', labelKey: 'courses', icon: BookOpen },
  { href: '/leaderboard', labelKey: 'leaderboard', icon: Trophy },
  { href: '/community', labelKey: 'community', icon: Users },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const t = useTranslations('nav');

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[300px] sm:w-[350px]">
        <SheetHeader>
          <SheetTitle>
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2"
            >
              <GraduationCap className="h-5 w-5 text-primary" />
              <span className="font-bold text-lg">
                Superteam Academy
              </span>
            </Link>
          </SheetTitle>
        </SheetHeader>

        <nav
          className="flex flex-col gap-1 px-4"
          aria-label="Mobile navigation"
        >
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-foreground/80 transition-colors hover:bg-accent/50 hover:text-foreground"
              >
                <Icon className="h-4 w-4 text-muted-foreground" />
                {t(link.labelKey)}
              </Link>
            );
          })}
        </nav>

        <Separator className="mx-4" />

        <div className="flex items-center gap-2 px-4">
          <ThemeToggle />
          <LanguageSwitcher />
        </div>

        <div className="px-4">
          <SignInMenu />
        </div>

        <div className="mt-auto px-4 pb-4">
          <WalletConnectButton fullWidth />
        </div>
      </SheetContent>
    </Sheet>
  );
}
