'use client';

import { usePathname, Link, useRouter } from '@/i18n/routing';
import { useLocale, useTranslations } from 'next-intl';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Languages, User, Settings, Award, LayoutDashboard, LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { useWallet } from '@solana/wallet-adapter-react';

const navigationKeys = [
  { name: 'home', href: '/' },
  { name: 'courses', href: '/courses' },
  { name: 'leaderboard', href: '/leaderboard' },
];

export function Navbar() {
  const pathname = usePathname();
  const t = useTranslations('Common');
  const locale = useLocale();
  const router = useRouter();
  const [user, setUser] = useState<SupabaseUser | null>(null);
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

  // Link wallet to profile when connected
  useEffect(() => {
    const linkWallet = async () => {
      if (connected && publicKey && user) {
        const walletAddr = publicKey.toString();
        
        // Check if profile already has this wallet or needs update
        const { data: profile } = await supabase
          .from('profiles')
          .select('wallet_address')
          .eq('id', user.id)
          .single();
        
        if (profile && profile.wallet_address !== walletAddr) {
          console.log('[v0] Linking wallet to profile:', walletAddr);
          await supabase
            .from('profiles')
            .update({ 
              wallet_address: walletAddr,
              updated_at: new Date().toISOString()
            })
            .eq('id', user.id);
        }
      }
    };

    linkWallet();
  }, [connected, publicKey, user, supabase]);

  const handleLocaleChange = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-20 items-center justify-between">
        <Link href="/" className="flex items-center space-x-2 group">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-black shadow-[0_0_20px_rgba(20,241,149,0.3)] group-hover:scale-110 transition-transform">
              SA
            </div>
            <span className="hidden font-black sm:inline-block text-xl tracking-tighter uppercase group-hover:text-primary transition-colors">
              Superteam Academy
            </span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {navigationKeys.map((item) => (
            <Link
              key={item.href}
              href={item.href as any}
              className={cn(
                'text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:text-primary relative py-1',
                pathname === item.href || (pathname === '' && item.href === '/')
                  ? 'text-foreground after:absolute after:-bottom-2 after:left-0 after:right-0 after:h-0.5 after:bg-primary after:rounded-full'
                  : 'text-muted-foreground'
              )}
            >
              {t(item.name)}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-white/5">
                <Languages className="h-5 w-5" />
                <span className="sr-only">Switch language</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 bg-background/95 backdrop-blur-xl border-white/10 rounded-2xl">
              <DropdownMenuItem 
                onClick={() => handleLocaleChange('en')}
                className={cn("rounded-xl font-bold uppercase text-[10px] tracking-widest mt-1", locale === 'en' && "bg-primary/10 text-primary")}
              >
                English
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleLocaleChange('pt')}
                className={cn("rounded-xl font-bold uppercase text-[10px] tracking-widest mt-1", locale === 'pt' && "bg-primary/10 text-primary")}
              >
                Português
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleLocaleChange('es')}
                className={cn("rounded-xl font-bold uppercase text-[10px] tracking-widest mb-1 mt-1", locale === 'es' && "bg-primary/10 text-primary")}
              >
                Español
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="hidden sm:block">
            <WalletMultiButton className="!bg-white/5 !border !border-white/10 !rounded-xl !h-10 !text-[10px] !font-black !uppercase !tracking-widest hover:!bg-white/10 !transition-all" />
          </div>
          
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-background/95 backdrop-blur-xl border-white/10 rounded-2xl p-2">
                <div className="flex items-center gap-3 p-3 mb-2">
                  <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center font-black text-primary">
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
                  <Link href="/certificates" className="flex items-center">
                    <Award className="mr-3 h-4 w-4" />
                    {t('certificates')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-xl font-bold uppercase text-[10px] tracking-widest p-3 mt-1 cursor-pointer">
                  <Link href="/settings" className="flex items-center">
                    <Settings className="mr-3 h-4 w-4" />
                    {t('settings')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/5" />
                <DropdownMenuItem 
                  onClick={handleLogout}
                  className="rounded-xl font-bold uppercase text-[10px] tracking-widest p-3 mb-1 mt-1 text-rose-500 hover:bg-rose-500/10 hover:text-rose-500 cursor-pointer"
                >
                  <LogOut className="mr-3 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild variant="default" className="rounded-xl font-black uppercase tracking-widest h-10 px-6 shadow-lg shadow-primary/20">
              <Link href="/auth/login">Join Now</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
