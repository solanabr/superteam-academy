'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Check, Link2, Wallet, Loader2, AlertCircle, Chrome, Github } from 'lucide-react';
import { LoadingOverlay, LogoLoader } from '@/components/ui/logo-loader';
import { useAuth, useWalletContext } from '@/components/providers';
import { signIn } from 'next-auth/react';
import { useWallet } from '@solana/wallet-adapter-react';
import { toast } from 'sonner';

interface LinkedAccounts {
  wallet: boolean;
  google: boolean;
  github: boolean;
}

export function LinkedAccountsSection() {
  const { user } = useAuth();
  const { connected } = useWalletContext();
  const wallet = useWallet();
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccounts>({
    wallet: false,
    google: false,
    github: false,
  });
  const [loading, setLoading] = useState(true);
  const [linkingWallet, setLinkingWallet] = useState(false);
  const [linkingOAuth, setLinkingOAuth] = useState<'google' | 'github' | null>(null);
  const [unlinking, setUnlinking] = useState<string | null>(null);

  useEffect(() => {
    fetchLinkedAccounts();

    // Check if we just returned from OAuth linking
    const urlParams = new URLSearchParams(window.location.search);
    const linkedProvider = urlParams.get('linked');
    if (linkedProvider) {
      toast.success(`${linkedProvider} account linked successfully!`);
      // Clean up the URL
      window.history.replaceState({}, '', '/settings');
    }
  }, []);

  const fetchLinkedAccounts = async () => {
    try {
      const response = await fetch('/api/users/linked-accounts');
      if (response.ok) {
        const data = await response.json();
        setLinkedAccounts(data.linked_accounts);
      }
    } catch (error) {
      console.error('Error fetching linked accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLinkWallet = async () => {
    if (!connected || !wallet.publicKey || !wallet.signMessage) {
      toast.error('Please connect your wallet first');
      return;
    }

    setLinkingWallet(true);
    try {
      // Create message to sign
      const message = `Link wallet to CapySolBuild Academy account\nTimestamp: ${Date.now()}`;
      const messageBytes = new TextEncoder().encode(message);

      // Request signature
      const signature = await wallet.signMessage(messageBytes);
      const signatureBase64 = Buffer.from(signature).toString('base64');

      // Send to API
      const response = await fetch('/api/users/link-wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: wallet.publicKey.toString(),
          signature: signatureBase64,
          message,
        }),
      });

      if (response.ok) {
        toast.success('Wallet linked successfully!');
        await fetchLinkedAccounts();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to link wallet');
      }
    } catch (error: unknown) {
      console.error('Error linking wallet:', error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to link wallet');
      }
    } finally {
      setLinkingWallet(false);
    }
  };

  const handleLinkGoogle = async () => {
    setLinkingOAuth('google');
    try {
      // Set linking cookies before OAuth redirect
      const response = await fetch('/api/auth/start-linking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'google' }),
      });

      if (!response.ok) {
        throw new Error('Failed to start linking process');
      }

      // Store linking intent in sessionStorage (backup)
      sessionStorage.setItem('linking_provider', 'google');

      // Trigger NextAuth Google sign-in
      await signIn('google', { callbackUrl: '/settings?linked=google' });
    } catch (error) {
      console.error('Error linking Google:', error);
      toast.error('Failed to link Google account');
      setLinkingOAuth(null);
    }
  };

  const handleLinkGitHub = async () => {
    setLinkingOAuth('github');
    try {
      // Set linking cookies before OAuth redirect
      const response = await fetch('/api/auth/start-linking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'github' }),
      });

      if (!response.ok) {
        throw new Error('Failed to start linking process');
      }

      // Store linking intent in sessionStorage (backup)
      sessionStorage.setItem('linking_provider', 'github');

      // Trigger NextAuth GitHub sign-in
      await signIn('github', { callbackUrl: '/settings?linked=github' });
    } catch (error) {
      console.error('Error linking GitHub:', error);
      toast.error('Failed to link GitHub account');
      setLinkingOAuth(null);
    }
  };

  const handleUnlink = async (provider: 'wallet' | 'google' | 'github') => {
    const linkedCount = Object.values(linkedAccounts).filter(Boolean).length;
    if (linkedCount <= 1) {
      toast.error('Cannot unlink the last authentication method');
      return;
    }

    setUnlinking(provider);
    try {
      const response = await fetch('/api/users/unlink', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      });

      if (response.ok) {
        toast.success(`${provider} unlinked successfully`);
        await fetchLinkedAccounts();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to unlink account');
      }
    } catch (error) {
      console.error('Error unlinking:', error);
      toast.error('Failed to unlink account');
    } finally {
      setUnlinking(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="font-semibold">Linked Accounts</h3>
        <div className="flex items-center justify-center py-8">
          <LogoLoader size="sm" message="Loading accounts..." />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {linkingOAuth && (
        <LoadingOverlay
          size="2xl"
          message={
            linkingOAuth === 'google' ? 'Redirecting to Google...' : 'Redirecting to GitHub...'
          }
        />
      )}

      <h3 className="font-semibold">Linked Accounts</h3>
      <p className="text-muted-foreground text-sm">
        Connect multiple sign-in methods to your account. You can use any linked method to sign in.
      </p>

      <div className="space-y-3">
        {/* Wallet */}
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div
              className={`rounded-full p-2 ${linkedAccounts.wallet ? 'bg-primary/10' : 'bg-muted'}`}
            >
              <Wallet
                className={`h-5 w-5 ${linkedAccounts.wallet ? 'text-primary' : 'text-muted-foreground'}`}
              />
            </div>
            <div>
              <p className="font-medium">Solana Wallet</p>
              <p className="text-muted-foreground text-xs">
                {linkedAccounts.wallet ? 'Connected' : 'Not connected'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {linkedAccounts.wallet ? (
              <>
                <Badge variant="secondary" className="gap-1">
                  <Check className="h-3 w-3" />
                  Linked
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUnlink('wallet')}
                  disabled={unlinking === 'wallet'}
                >
                  {unlinking === 'wallet' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Unlink'}
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handleLinkWallet}
                disabled={linkingWallet || !connected}
                className="gap-2"
              >
                {linkingWallet ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Link2 className="h-4 w-4" />
                    Link
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Google */}
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div
              className={`rounded-full p-2 ${linkedAccounts.google ? 'bg-primary/10' : 'bg-muted'}`}
            >
              <Chrome
                className={`h-5 w-5 ${linkedAccounts.google ? 'text-primary' : 'text-muted-foreground'}`}
              />
            </div>
            <div>
              <p className="font-medium">Google Account</p>
              <p className="text-muted-foreground text-xs">
                {linkedAccounts.google ? 'Connected' : 'Not connected'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {linkedAccounts.google ? (
              <>
                <Badge variant="secondary" className="gap-1">
                  <Check className="h-3 w-3" />
                  Linked
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUnlink('google')}
                  disabled={unlinking === 'google'}
                >
                  {unlinking === 'google' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Unlink'}
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handleLinkGoogle}
                className="gap-2"
                disabled={linkingOAuth !== null}
              >
                {linkingOAuth === 'google' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Link2 className="h-4 w-4" />
                )}
                {linkingOAuth === 'google' ? 'Linking...' : 'Link'}
              </Button>
            )}
          </div>
        </div>

        {/* GitHub */}
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div
              className={`rounded-full p-2 ${linkedAccounts.github ? 'bg-primary/10' : 'bg-muted'}`}
            >
              <Github
                className={`h-5 w-5 ${linkedAccounts.github ? 'text-primary' : 'text-muted-foreground'}`}
              />
            </div>
            <div>
              <p className="font-medium">GitHub Account</p>
              <p className="text-muted-foreground text-xs">
                {linkedAccounts.github ? 'Connected' : 'Not connected'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {linkedAccounts.github ? (
              <>
                <Badge variant="secondary" className="gap-1">
                  <Check className="h-3 w-3" />
                  Linked
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUnlink('github')}
                  disabled={unlinking === 'github'}
                >
                  {unlinking === 'github' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Unlink'}
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handleLinkGitHub}
                className="gap-2"
                disabled={linkingOAuth !== null}
              >
                {linkingOAuth === 'github' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Link2 className="h-4 w-4" />
                )}
                {linkingOAuth === 'github' ? 'Linking...' : 'Link'}
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-muted/50 flex items-start gap-2 rounded-lg p-3">
        <AlertCircle className="text-muted-foreground mt-0.5 h-4 w-4" />
        <p className="text-muted-foreground text-xs">
          You must keep at least one authentication method linked to your account.
        </p>
      </div>
    </div>
  );
}
