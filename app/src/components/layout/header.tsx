'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/components/providers';
import { useThemeContext } from '@/components/providers/theme-provider';
import { useTranslation } from '@/hooks/use-translation';
import { Menu, Sun, Moon, Globe, BookOpen, LayoutDashboard } from 'lucide-react';
import { NotificationBell } from './notification-bell';
import { PushNotificationToggle } from './push-notification-toggle';

const navigation = [{ name: 'Courses', href: '/explore', icon: BookOpen }];

export function Header() {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const { resolvedTheme, toggleTheme } = useThemeContext();
  const { locale, setLocale } = useTranslation();

  return (
    <header className="border-border/40 bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur">
      <div className="container flex h-16 items-center">
        {/* Mobile menu */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="mr-2 md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px]">
            <nav className="flex flex-col gap-4">
              <Link href="/" className="flex items-center gap-2 font-bold">
                <Image src="/logo.png" alt="CapySolBuild Academy" width={24} height={24} />
                <span>CapySolBuild Academy</span>
              </Link>
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`hover:text-primary flex items-center gap-2 text-sm font-medium transition-colors ${
                    pathname === item.href ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>

        {/* Logo */}
        <Link href="/" className="mr-6 flex items-center gap-2 font-bold">
          <Image src="/logo.png" alt="CapySolBuild Academy" width={24} height={24} />
          <span className="hidden sm:inline-block">CapySolBuild Academy</span>
        </Link>

        {/* Desktop navigation */}
        <nav className="hidden flex-1 items-center gap-6 md:flex">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`hover:text-primary text-sm font-medium transition-colors ${
                pathname === item.href ? 'text-foreground' : 'text-muted-foreground'
              }`}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Right side actions */}
        <div className="flex flex-1 items-center justify-end gap-2">
          {/* Notification Bell - only show when authenticated */}
          {isAuthenticated && <NotificationBell />}

          {/* Language switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Globe className="h-4 w-4" />
                <span className="sr-only">Switch language</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => setLocale('en')}
                className={locale === 'en' ? 'bg-accent' : ''}
              >
                🇺🇸 English
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setLocale('pt-br')}
                className={locale === 'pt-br' ? 'bg-accent' : ''}
              >
                🇧🇷 Português
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setLocale('es')}
                className={locale === 'es' ? 'bg-accent' : ''}
              >
                🇪🇸 Español
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme toggle */}
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            <span className="sr-only">Toggle theme</span>
          </Button>

          {/* Auth */}
          {isAuthenticated ? (
            <>
              <PushNotificationToggle />
              <Button asChild size="sm">
                <Link href="/dashboard">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Dashboard
                </Link>
              </Button>
            </>
          ) : (
            <Button asChild size="sm">
              <Link href="/auth/signin">Login</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
