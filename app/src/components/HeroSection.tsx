'use client';

import { useTranslations } from 'next-intl';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { ArrowRight, Play, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function HeroSection() {
  const t = useTranslations('home');
  const { connected } = useWallet();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'pt';

  return (
    <div className="relative bg-gradient-to-br from-primary-600 to-primary-800 overflow-hidden">
      <div className="absolute inset-0 bg-black opacity-10"></div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="text-white">
            <h1 className="text-4xl lg:text-6xl font-bold leading-tight mb-6">
              {t('title')}
            </h1>
            <p className="text-xl lg:text-2xl mb-4 text-primary-100">
              {t('subtitle')}
            </p>
            <p className="text-lg mb-8 text-primary-200 max-w-2xl">
              {t('description')}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              {connected ? (
                <Link
                  href={`/${locale}/dashboard`}
                  className="inline-flex items-center px-8 py-3 rounded-lg bg-white text-primary-600 font-semibold hover:bg-primary-50 transition-colors"
                >
                  {t('getStarted')}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              ) : (
                <WalletMultiButton className="!bg-white !text-primary-600 !font-semibold !hover:bg-primary-50 !px-8 !py-3 !rounded-lg" />
              )}
              
              <Link
                href={`/${locale}/courses`}
                className="inline-flex items-center px-8 py-3 rounded-lg border-2 border-white text-white font-semibold hover:bg-white hover:text-primary-600 transition-colors"
              >
                {t('exploreCourses')}
                <BookOpen className="ml-2 w-5 h-5" />
              </Link>
            </div>

            <div className="mt-12 grid grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-2xl lg:text-3xl font-bold">1000+</div>
                <div className="text-primary-200">Students</div>
              </div>
              <div>
                <div className="text-2xl lg:text-3xl font-bold">25+</div>
                <div className="text-primary-200">Courses</div>
              </div>
              <div>
                <div className="text-2xl lg:text-3xl font-bold">500+</div>
                <div className="text-primary-200">NFT Certificates</div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="relative z-10 bg-white rounded-2xl shadow-2xl p-8 transform rotate-2 hover:rotate-0 transition-transform duration-300">
              <div className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-xl p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-white text-lg font-semibold">Solana Development</div>
                  <div className="bg-white bg-opacity-20 rounded-full px-3 py-1 text-white text-sm">
                    Beginner
                  </div>
                </div>
                <div className="text-white text-3xl font-bold">85% Complete</div>
                <div className="w-full bg-white bg-opacity-20 rounded-full h-2 mt-2">
                  <div className="bg-white rounded-full h-2" style={{ width: '85%' }}></div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <Play className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Introduction to Solana</div>
                    <div className="text-gray-500 text-sm">Completed</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <Play className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Smart Contracts</div>
                    <div className="text-gray-500 text-sm">Completed</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                    <Play className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">DeFi Protocols</div>
                    <div className="text-primary-500 text-sm">In Progress</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}