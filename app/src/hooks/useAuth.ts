import { useState, useEffect, useCallback } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  provider: 'wallet' | 'google' | 'github' | null;
  walletAddress: string | null;
}

const AUTH_KEY = 'solana_academy_user';

function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem(AUTH_KEY);
    return stored ? JSON.parse(stored) : null;
  });
  const [isLoading, setIsLoading] = useState(false);

  const saveUser = useCallback((u: User) => {
    localStorage.setItem(AUTH_KEY, JSON.stringify(u));
    setUser(u);
  }, []);

  const loginWithGoogle = useCallback(async () => {
    setIsLoading(true);
    // Simulate Google OAuth
    await new Promise(r => setTimeout(r, 1200));
    const mockUser: User = {
      id: generateId(),
      name: 'Solana Developer',
      email: 'dev@example.com',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=solana${Date.now()}`,
      provider: 'google',
      walletAddress: null,
    };
    saveUser(mockUser);
    setIsLoading(false);
  }, [saveUser]);

  const loginWithGitHub = useCallback(async () => {
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    const mockUser: User = {
      id: generateId(),
      name: 'GitHub Dev',
      email: 'github@example.com',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=github${Date.now()}`,
      provider: 'github',
      walletAddress: null,
    };
    saveUser(mockUser);
    setIsLoading(false);
  }, [saveUser]);

  const loginWithWallet = useCallback(async (address: string) => {
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 800));
    const mockUser: User = {
      id: generateId(),
      name: `${address.slice(0, 4)}...${address.slice(-4)}`,
      email: '',
      avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${address}`,
      provider: 'wallet',
      walletAddress: address,
    };
    saveUser(mockUser);
    setIsLoading(false);
  }, [saveUser]);

  const connectWallet = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 800));
    // Generate a mock Solana address
    const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let address = '';
    for (let i = 0; i < 44; i++) {
      address += chars[Math.floor(Math.random() * chars.length)];
    }
    const updated = { ...user, walletAddress: address };
    saveUser(updated);
    setIsLoading(false);
    return address;
  }, [user, saveUser]);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_KEY);
    setUser(null);
  }, []);

  return { user, isLoading, loginWithGoogle, loginWithGitHub, loginWithWallet, connectWallet, logout };
}
