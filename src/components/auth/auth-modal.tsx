'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet,
  Chrome,
  Github,
  ArrowRight,
  Sparkles,
  Zap,
  Shield,
  X,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useUserStore } from '@/stores/user-store';
import toast from 'react-hot-toast';

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthModal({ open, onOpenChange }: AuthModalProps) {
  const { select, wallets, publicKey, connected, connect, connecting } = useWallet();
  const { setVisible } = useWalletModal();
  const { setUser, initDemoUser } = useUserStore();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleWalletConnect = async () => {
    setIsLoading('wallet');
    try {
      setVisible(true);
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to connect wallet');
    } finally {
      setIsLoading(null);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading('google');
    // Stub: In production, redirect to Supabase Google OAuth
    await new Promise((resolve) => setTimeout(resolve, 1000));
    initDemoUser();
    toast.success('Signed in with Google (Demo)');
    onOpenChange(false);
    setIsLoading(null);
  };

  const handleGithubSignIn = async () => {
    setIsLoading('github');
    // Stub: In production, redirect to Supabase GitHub OAuth
    await new Promise((resolve) => setTimeout(resolve, 1000));
    initDemoUser();
    toast.success('Signed in with GitHub (Demo)');
    onOpenChange(false);
    setIsLoading(null);
  };

  const handleDemoMode = () => {
    initDemoUser();
    toast.success('Welcome to Demo Mode!');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        {/* Header with gradient */}
        <div className="bg-gradient-to-br from-[#9945FF]/10 via-transparent to-[#14F195]/10 p-6 pb-4">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#9945FF] to-[#14F195] text-white font-bold text-lg">
                Q
              </div>
              <div>
                <DialogTitle className="text-xl">Begin Your Quest</DialogTitle>
                <DialogDescription className="text-sm">
                  Choose how you want to sign in
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="p-6 pt-2 space-y-4">
          {/* Wallet Connect - Primary */}
          <Button
            variant="outline"
            className="w-full h-14 justify-between text-left gap-3 border-primary/20 hover:border-primary/40 hover:bg-primary/5"
            onClick={handleWalletConnect}
            disabled={isLoading !== null}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#9945FF] to-[#14F195] flex items-center justify-center">
                <Wallet className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="font-medium text-sm">Connect Wallet</p>
                <p className="text-xs text-muted-foreground">Phantom, Solflare, & more</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </Button>

          <div className="relative">
            <Separator />
            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-3 text-xs text-muted-foreground">
              or continue with
            </span>
          </div>

          {/* Social Sign-In */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="h-11 gap-2"
              onClick={handleGoogleSignIn}
              disabled={isLoading !== null}
            >
              <Chrome className="h-4 w-4" />
              Google
            </Button>
            <Button
              variant="outline"
              className="h-11 gap-2"
              onClick={handleGithubSignIn}
              disabled={isLoading !== null}
            >
              <Github className="h-4 w-4" />
              GitHub
            </Button>
          </div>

          <Separator />

          {/* Demo Mode */}
          <Button
            variant="ghost"
            className="w-full h-11 gap-2 text-muted-foreground hover:text-foreground"
            onClick={handleDemoMode}
          >
            <Sparkles className="h-4 w-4" />
            Try Demo Mode (No sign-in required)
          </Button>

          {/* Features list */}
          <div className="rounded-lg bg-muted/30 p-3 space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Zap className="h-3 w-3 text-quest-gold" />
              Earn XP and level up by completing quests
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Shield className="h-3 w-3 text-quest-health" />
              Collect on-chain credentials as compressed NFTs
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
