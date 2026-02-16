'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Scroll,
  Trophy,
  LayoutDashboard,
  Menu,
  X,
  Zap,
  Flame,
  User,
  Settings,
  LogOut,
  LogIn,
  Sun,
  Moon,
  Globe,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useUserStore } from '@/stores/user-store';
import { XP_CONFIG, getLevelTitle, SUPPORTED_LANGUAGES } from '@/config/constants';
import { AuthModal } from '@/components/auth/auth-modal';

const NAV_ITEMS = [
  { label: 'Quests', href: '/courses', icon: Scroll },
  { label: 'Leaderboard', href: '/leaderboard', icon: Trophy },
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
];

export function Header() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const { user, isAuthenticated, xp, level, profile, signOut, initDemoUser } =
    useUserStore();

  const levelProgress = XP_CONFIG.levelProgress(xp);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="relative">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#9945FF] to-[#14F195] text-white font-bold text-lg">
              Q
            </div>
            <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-[#9945FF] to-[#14F195] opacity-0 blur-md group-hover:opacity-50 transition-opacity" />
          </div>
          <span className="text-lg font-bold hidden sm:block">
            <span className="text-foreground">Solana</span>
            <span className="bg-gradient-to-r from-[#9945FF] to-[#14F195] bg-clip-text text-transparent">
              Quest
            </span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  size="sm"
                  className={cn(
                    'gap-2 transition-all',
                    isActive && 'bg-primary/10 text-primary hover:bg-primary/15'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* XP Display (when authenticated) */}
          {isAuthenticated && (
            <Link href="/dashboard" className="hidden sm:flex items-center gap-3">
              {/* Streak */}
              {profile && profile.streak.currentStreak > 0 && (
                <div className="flex items-center gap-1 text-sm">
                  <Flame className="h-4 w-4 text-orange-500 animate-fire" />
                  <span className="font-medium text-orange-500">
                    {profile.streak.currentStreak}
                  </span>
                </div>
              )}

              {/* XP & Level */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <Zap className="h-4 w-4 text-quest-gold" />
                  <span className="text-sm font-bold text-quest-gold">
                    {xp.toLocaleString()}
                  </span>
                </div>
                <div className="relative h-2 w-16 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#9945FF] to-[#14F195]"
                    initial={{ width: 0 }}
                    animate={{ width: `${levelProgress}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                </div>
                <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                  Lv.{level}
                </Badge>
              </div>
            </Link>
          )}

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          {/* Language Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Globe className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {SUPPORTED_LANGUAGES.map((lang) => (
                <DropdownMenuItem key={lang.code} className="gap-2">
                  <span>{lang.flag}</span>
                  <span>{lang.label}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu / Auth */}
          {/* Auth Modal */}
          <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />

          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
                  <Avatar className="h-8 w-8 border-2 border-primary/30">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                      {user?.displayName?.charAt(0) || 'Q'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-2">
                  <p className="text-sm font-medium">{user?.displayName}</p>
                  <p className="text-xs text-muted-foreground">
                    {getLevelTitle(level)} &bull; Level {level}
                  </p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="gap-2">
                    <User className="h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="gap-2">
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="gap-2">
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="gap-2 text-destructive">
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={initDemoUser}
                className="hidden sm:flex"
              >
                Demo Mode
              </Button>
              <Button
                size="sm"
                className="gap-2 bg-gradient-to-r from-[#9945FF] to-[#14F195] text-white hover:opacity-90 border-0"
                onClick={() => setAuthModalOpen(true)}
              >
                <LogIn className="h-4 w-4" />
                <span className="hidden sm:inline">Start Quest</span>
                <span className="sm:hidden">Join</span>
              </Button>
            </div>
          )}

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-border/40 md:hidden"
          >
            <div className="px-4 py-3 space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button
                      variant={isActive ? 'secondary' : 'ghost'}
                      className={cn(
                        'w-full justify-start gap-3',
                        isActive && 'bg-primary/10 text-primary'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}

              {/* Mobile XP display */}
              {isAuthenticated && (
                <div className="flex items-center gap-3 px-4 py-2 mt-2 rounded-lg bg-muted/50">
                  <Zap className="h-4 w-4 text-quest-gold" />
                  <span className="text-sm font-bold">{xp.toLocaleString()} XP</span>
                  <Badge variant="outline" className="text-xs">
                    Level {level}
                  </Badge>
                  {profile && profile.streak.currentStreak > 0 && (
                    <div className="flex items-center gap-1 ml-auto">
                      <Flame className="h-4 w-4 text-orange-500" />
                      <span className="text-sm font-medium">
                        {profile.streak.currentStreak}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
