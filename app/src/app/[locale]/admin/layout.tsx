'use client';

import { useGamification } from '@/context/GamificationContext';
import { Link, useRouter } from '@/i18n/routing';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { ProgressService } from '@/services/progress';
import { useWallet } from '@solana/wallet-adapter-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { connected, publicKey } = useWallet();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function checkAdmin() {
      if (!connected || !publicKey) {
        // Wait a bit for wallet adapter to initialize
        setTimeout(() => {
            if (!window.solana?.isConnected) {
                router.push('/');
            }
        }, 1000);
        return;
      }

      try {
        const user = await ProgressService.login(publicKey.toString());
        if (user && user.role === 'admin') {
          setIsAdmin(true);
        } else {
          router.push('/dashboard');
        }
      } catch (error) {
        console.error('Admin check failed:', error);
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    }

    checkAdmin();
  }, [connected, publicKey, router]);

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#0A0A0F]">
        <Loader2 className="h-8 w-8 animate-spin text-[#9945FF]" />
        <span className="ml-2 text-gray-400">Verifying privileges...</span>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      <div className="border-b border-[#2E2E36] bg-[#13131a] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
              <h1 className="text-xl font-bold text-white">Superteam Academy Admin</h1>
              <nav className="flex items-center gap-4 text-sm">
                  <Link href="/admin" className="text-gray-400 hover:text-white transition-colors">Overview</Link>
                  <Link href="/admin/courses" className="text-gray-400 hover:text-white transition-colors">Courses</Link>
              </nav>
          </div>
          <div className="text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded border border-green-400/20">
              Admin Mode
          </div>
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}
