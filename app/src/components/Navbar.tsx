'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Menu, X, BookOpen, User, Home, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LanguageSwitcher } from './LanguageSwitcher';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { connected } = useWallet();
  const pathname = usePathname();
  const t = useTranslations('nav');
  
  const locale = pathname.split('/')[1] || 'pt';

  const navigation = [
    { name: t('home'), href: `/${locale}`, icon: Home },
    { name: t('courses'), href: `/${locale}/courses`, icon: BookOpen },
    ...(connected ? [{ name: t('dashboard'), href: `/${locale}/dashboard`, icon: BarChart3 }] : []),
    ...(connected ? [{ name: t('profile'), href: `/${locale}/profile`, icon: User }] : []),
  ];

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href={`/${locale}`} className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Superteam LMS</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${ 
                  pathname === item.href
                    ? 'text-primary-600 bg-primary-50'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.name}</span>
              </Link>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <LanguageSwitcher />
            <WalletMultiButton className="!bg-primary-600 !hover:bg-primary-700" />
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            <LanguageSwitcher />
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    pathname === item.href
                      ? 'text-primary-600 bg-primary-50'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              ))}
              <div className="px-3 py-2">
                <WalletMultiButton className="!bg-primary-600 !hover:bg-primary-700 !w-full" />
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}