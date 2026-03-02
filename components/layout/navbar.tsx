'use client';

import { usePathname, Link, useRouter } from '@/i18n/routing';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Languages, User, Settings, Award, LayoutDashboard, LogOut, BookOpen, Trophy, FolderOpen, ShieldCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletConnectModal } from '@/components/wallet/wallet-connect-modal';

const navigationKeys = [
  { name: 'courses', href: '/courses', icon: BookOpen },
  { name: 'dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'leaderboard', href: '/leaderboard', icon: Trophy },
];

export function Navbar() {
  const pathname = usePathname();
  const t = useTranslations('Common');
  const locale = useLocale();
  const router = useRouter();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [lastLinkedWallet, setLastLinkedWallet] = useState<string | null>(null);
  const supabase = createClient();
  const { publicKey, connected } = useWallet();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    const linkWallet = async () => {
      if (!connected || !publicKey || !user) return;

      const walletAddr = publicKey.toString();
      if (lastLinkedWallet === walletAddr) {
        return;
      }

      const response = await fetch('/api/wallet/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ walletAddress: walletAddr })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        console.warn('[v0] Failed to link wallet to profile:', payload?.error || response.statusText);
        return;
      }
      if (payload?.conflict) {
        console.warn('[v0] Wallet conflict:', payload?.error || 'Wallet already linked');
        setLastLinkedWallet(walletAddr);
        return;
      }
      setLastLinkedWallet(walletAddr);
    };

    linkWallet();
  }, [connected, publicKey, user, lastLinkedWallet]);

  const handleLocaleChange = (newLocale: string) => {
    const normalized = pathname.replace(/^\/(en|pt|es)(?=\/|$)/, '') || '/';
    router.replace(normalized, { locale: newLocale });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-14 items-center justify-between gap-2 overflow-hidden">
        <Link href="/" className="flex items-center space-x-2 group">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-black shadow-[0_0_16px_rgba(20,241,149,0.25)] group-hover:scale-110 transition-transform">
              S
            </div>
            <span className="hidden font-black sm:inline-block text-sm tracking-tight uppercase group-hover:text-primary transition-colors">
              Superteam Academy
            </span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {navigationKeys.map((item) => (
            <Link
              key={item.href}
              href={item.href as any}
              className={cn(
                'text-[10px] font-black uppercase tracking-[0.18em] transition-all hover:text-primary relative py-0.5',
                pathname === item.href
                  ? 'text-foreground after:absolute after:-bottom-2 after:left-0 after:right-0 after:h-0.5 after:bg-primary after:rounded-full'
                  : 'text-muted-foreground'
              )}
            >
              <span className="inline-flex items-center gap-2">
                <item.icon className="h-3.5 w-3.5" />
                {t(item.name)}
              </span>
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="hidden h-8 rounded-lg px-3 text-[10px] font-black uppercase tracking-widest hover:bg-white/5 sm:inline-flex">
                <Languages className="mr-2 h-3.5 w-3.5" />
                <span>Language</span>
                <span className="ml-1 text-muted-foreground">({locale.toUpperCase()})</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 bg-background/95 backdrop-blur-xl border-white/10 rounded-2xl">
              <DropdownMenuItem onClick={() => handleLocaleChange('en')} className={cn('rounded-xl font-bold uppercase text-[10px] tracking-widest mt-1', locale === 'en' && 'bg-primary/10 text-primary')}>
                English
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleLocaleChange('pt')} className={cn('rounded-xl font-bold uppercase text-[10px] tracking-widest mt-1', locale === 'pt' && 'bg-primary/10 text-primary')}>
                Portugues
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleLocaleChange('es')} className={cn('rounded-xl font-bold uppercase text-[10px] tracking-widest mb-1 mt-1', locale === 'es' && 'bg-primary/10 text-primary')}>
                Espanol
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-white/5 sm:hidden">
                <Languages className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 bg-background/95 backdrop-blur-xl border-white/10 rounded-2xl">
              <DropdownMenuItem onClick={() => handleLocaleChange('en')} className={cn('rounded-xl font-bold uppercase text-[10px] tracking-widest mt-1', locale === 'en' && 'bg-primary/10 text-primary')}>
                English
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleLocaleChange('pt')} className={cn('rounded-xl font-bold uppercase text-[10px] tracking-widest mt-1', locale === 'pt' && 'bg-primary/10 text-primary')}>
                Portugues
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleLocaleChange('es')} className={cn('rounded-xl font-bold uppercase text-[10px] tracking-widest mb-1 mt-1', locale === 'es' && 'bg-primary/10 text-primary')}>
                Espanol
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex items-center gap-2">
            <WalletConnectModal />
          </div>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-background/95 backdrop-blur-xl border-white/10 rounded-2xl p-2">
                <div className="flex items-center gap-3 p-3 mb-2">
                  <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center font-black text-primary">
                    {user.email?.[0].toUpperCase()}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-black uppercase tracking-widest truncate">{user.email?.split('@')[0]}</span>
                    <span className="text-[10px] text-muted-foreground truncate">{user.email}</span>
                  </div>
                </div>
                <DropdownMenuSeparator className="bg-white/5" />
                <DropdownMenuItem asChild className="rounded-xl font-bold uppercase text-[10px] tracking-widest p-3 mt-1 cursor-pointer">
                  <Link href="/dashboard" className="flex items-center">
                    <LayoutDashboard className="mr-3 h-4 w-4" />
                    {t('dashboard')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-xl font-bold uppercase text-[10px] tracking-widest p-3 mt-1 cursor-pointer">
                  <Link href="/profile" className="flex items-center">
                    <User className="mr-3 h-4 w-4" />
                    {t('profile')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-xl font-bold uppercase text-[10px] tracking-widest p-3 mt-1 cursor-pointer">
                  <Link href="/my-courses" className="flex items-center">
                    <FolderOpen className="mr-3 h-4 w-4" />
                    My Courses
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-xl font-bold uppercase text-[10px] tracking-widest p-3 mt-1 cursor-pointer">
                  <Link href="/certificates" className="flex items-center">
                    <Award className="mr-3 h-4 w-4" />
                    {t('certificates')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-xl font-bold uppercase text-[10px] tracking-widest p-3 mt-1 cursor-pointer">
                  <Link href="/credentials" className="flex items-center">
                    <ShieldCheck className="mr-3 h-4 w-4" />
                    Credentials
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-xl font-bold uppercase text-[10px] tracking-widest p-3 mt-1 cursor-pointer">
                  <Link href="/settings" className="flex items-center">
                    <Settings className="mr-3 h-4 w-4" />
                    {t('settings')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/5" />
                <DropdownMenuItem onClick={handleLogout} className="rounded-xl font-bold uppercase text-[10px] tracking-widest p-3 mb-1 mt-1 text-rose-500 hover:bg-rose-500/10 hover:text-rose-500 cursor-pointer">
                  <LogOut className="mr-3 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild variant="default" className="rounded-lg font-black uppercase tracking-widest h-8 px-4 shadow-lg shadow-primary/20">
              <Link href="/auth/login">Join Now</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
