'use client';

import { useTranslations } from 'next-intl';
import { Link, usePathname, useRouter } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe, Menu, X, Settings, Sparkles } from 'lucide-react';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { useGamification } from '@/context/GamificationContext';
import { useWallet } from '@solana/wallet-adapter-react';

const WalletMultiButton = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then((mod) => mod.WalletMultiButton),
  { ssr: false }
);

export function Navbar() {
  const t = useTranslations('Navigation');
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const { xp, onChainXP } = useGamification();
  const { connected } = useWallet();

  const handleLanguageChange = (locale: string) => {
    router.replace(pathname, { locale });
  };

  const displayXP = onChainXP;

  return (
    <nav className="fixed top-0 w-full z-50 border-b border-[#2E2E36] bg-[#0A0A0F]/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#9945FF] to-[#14F195]" />
          <span className="font-bold text-xl tracking-tight text-white">
            Superteam <span className="text-[#9945FF]">Academy</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="/courses" className={`text-sm font-medium transition-colors hover:text-white ${pathname.includes('/courses') ? 'text-[#9945FF] font-bold' : 'text-gray-300'}`}>
            {t('courses')}
            {pathname.includes('/courses') && <motion.div layoutId="navbar-indicator" className="absolute -bottom-[21px] left-0 right-0 h-[2px] bg-[#9945FF]" />}
          </Link>
          <Link href="/dashboard" className={`text-sm font-medium transition-colors hover:text-white ${pathname.includes('/dashboard') ? 'text-[#9945FF] font-bold' : 'text-gray-300'}`}>
            {t('dashboard')}
          </Link>
          <Link href="/leaderboard" className={`text-sm font-medium transition-colors hover:text-white ${pathname.includes('/leaderboard') ? 'text-[#9945FF] font-bold' : 'text-gray-300'}`}>
            {t('leaderboard')}
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-4">
          {/* XP Counter */}
          {connected && (
            <div className="flex items-center gap-2 bg-[#1E1E24] border border-[#2E2E36] rounded-full px-3 py-1.5">
              <div className="text-xs font-medium text-gray-400">XP</div>
              <div className="text-sm font-bold text-[#14F195]">{displayXP.toLocaleString()}</div>
            </div>
          )}

          <DropdownMenu onOpenChange={setIsLanguageDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-gray-300 hover:text-white" aria-label="Select language">
                {isLanguageDropdownOpen ? <X className="h-5 w-5" /> : <Globe className="h-5 w-5" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleLanguageChange('pt-BR')}>
                Português (BR)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleLanguageChange('es')}>
                Español
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleLanguageChange('en')}>
                English
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="icon" className="text-gray-300 hover:text-white" asChild aria-label="Settings">
            <Link href="/settings">
              <Settings className="h-5 w-5" />
            </Link>
          </Button>

          <WalletMultiButton className="!bg-[#9945FF] hover:!bg-[#7b35cc] !h-9 !px-4 !rounded-md !text-sm !font-medium transition-colors" />
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden text-gray-300"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Nav */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-[#2E2E36] bg-[#0A0A0F]">
          <div className="container mx-auto px-4 py-4 flex flex-col gap-4">
            <Link href="/courses" className="text-sm font-medium text-gray-300">
              {t('courses')}
            </Link>
            <Link href="/dashboard" className="text-sm font-medium text-gray-300">
              {t('dashboard')}
            </Link>
            <Link href="/leaderboard" className="text-sm font-medium text-gray-300">
              {t('leaderboard')}
            </Link>
            <div className="flex items-center justify-between pt-4 border-t border-[#2E2E36]">
              <span className="text-sm text-gray-400">Language</span>
              <div className="flex gap-2">
                <button onClick={() => handleLanguageChange('pt-BR')} className="text-xs text-gray-300">PT</button>
                <button onClick={() => handleLanguageChange('es')} className="text-xs text-gray-300">ES</button>
                <button onClick={() => handleLanguageChange('en')} className="text-xs text-gray-300">EN</button>
              </div>
            </div>
             <Button variant="cyber" className="w-full mt-4">
              Connect Wallet
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}
