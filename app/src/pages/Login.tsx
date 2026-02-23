import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Code2, Github, Chrome, Wallet, ArrowRight, Shield, Zap } from 'lucide-react';

export default function Login() {
  const { user, isLoading, loginWithGoogle, loginWithGitHub, loginWithWallet } = useAuth();
  const navigate = useNavigate();
  const [walletConnecting, setWalletConnecting] = useState(false);

  if (user) {
    navigate('/dashboard');
    return null;
  }

  const handleWallet = async () => {
    setWalletConnecting(true);
    // Simulate wallet detection
    await new Promise(r => setTimeout(r, 500));
    // Generate mock address for demo
    const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let address = '';
    for (let i = 0; i < 44; i++) {
      address += chars[Math.floor(Math.random() * chars.length)];
    }
    await loginWithWallet(address);
    setWalletConnecting(false);
    navigate('/dashboard');
  };

  const handleGoogle = async () => {
    await loginWithGoogle();
    navigate('/dashboard');
  };

  const handleGitHub = async () => {
    await loginWithGitHub();
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel - decorative */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-background-secondary border-r border-card-border">
        <div className="absolute inset-0 grid-bg opacity-20" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-glow-purple opacity-50" />
        <div className="absolute bottom-1/4 right-1/4 w-60 h-60 bg-gradient-glow-green opacity-30" />

        <div className="relative z-10 flex flex-col justify-center px-16 py-12">
          <div className="flex items-center gap-3 mb-16">
            <div className="h-10 w-10 rounded-xl bg-gradient-solana flex items-center justify-center">
              <Code2 className="h-5 w-5 text-background" />
            </div>
            <span className="font-bold text-xl gradient-text">Superteam Academy</span>
          </div>

          <h2 className="text-4xl font-bold leading-tight mb-6">
            Join the next generation of{' '}
            <span className="gradient-text">Solana builders</span>
          </h2>

          <div className="space-y-4">
            {[
              { icon: Zap, text: 'Interactive coding challenges with real-time feedback' },
              { icon: Shield, text: 'On-chain credentials to prove your skills' },
              { icon: Code2, text: 'Project-based curriculum from Solana experts' },
            ].map(item => (
              <div key={item.text} className="flex items-start gap-3">
                <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center mt-0.5">
                  <item.icon className="h-4 w-4 text-primary" />
                </div>
                <p className="text-muted-foreground">{item.text}</p>
              </div>
            ))}
          </div>

          {/* Mock stats */}
          <div className="mt-12 grid grid-cols-3 gap-4">
            {[
              { value: '33K+', label: 'Learners' },
              { value: '4.9★', label: 'Rating' },
              { value: 'Free', label: 'to Start' },
            ].map(stat => (
              <div key={stat.label} className="glass-card rounded-xl p-4 text-center">
                <p className="font-bold gradient-text">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel - login form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 relative">
        <div className="absolute inset-0 grid-bg opacity-10" />
        <div className="relative w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 justify-center mb-10 lg:hidden">
            <div className="h-9 w-9 rounded-xl bg-gradient-solana flex items-center justify-center">
              <Code2 className="h-5 w-5 text-background" />
            </div>
            <span className="font-bold text-xl gradient-text">Superteam Academy</span>
          </div>

          <div className="glass-card rounded-2xl p-8">
            <div className="mb-8">
              <h1 className="text-2xl font-bold mb-2">Welcome back</h1>
              <p className="text-muted-foreground text-sm">Sign in to continue your learning journey</p>
            </div>

            <div className="space-y-3">
              {/* Wallet Connect */}
              <button
                onClick={handleWallet}
                disabled={isLoading || walletConnecting}
                className="w-full flex items-center justify-between px-5 py-4 rounded-xl border border-primary/40 bg-primary/5 hover:bg-primary/10 hover:border-primary/60 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-gradient-solana flex items-center justify-center">
                    <Wallet className="h-5 w-5 text-background" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-sm">Connect Wallet</p>
                    <p className="text-xs text-muted-foreground">Phantom, Solflare, Backpack</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-primary group-hover:translate-x-1 transition-transform" />
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-card-border" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-card px-3 text-muted-foreground">or continue with</span>
                </div>
              </div>

              {/* Google */}
              <button
                onClick={handleGoogle}
                disabled={isLoading}
                className="w-full flex items-center justify-between px-5 py-3.5 rounded-xl border border-card-border hover:border-muted hover:bg-muted/30 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-3">
                  <Chrome className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium text-sm">Continue with Google</span>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </button>

              {/* GitHub */}
              <button
                onClick={handleGitHub}
                disabled={isLoading}
                className="w-full flex items-center justify-between px-5 py-3.5 rounded-xl border border-card-border hover:border-muted hover:bg-muted/30 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-3">
                  <Github className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium text-sm">Continue with GitHub</span>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {(isLoading || walletConnecting) && (
              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <div className="h-4 w-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                Connecting...
              </div>
            )}

            <p className="mt-6 text-center text-xs text-muted-foreground">
              By signing in, you agree to our{' '}
              <span className="text-primary cursor-pointer hover:underline">Terms</span> and{' '}
              <span className="text-primary cursor-pointer hover:underline">Privacy Policy</span>
            </p>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Open source · MIT License · No email required for wallet login
          </p>
        </div>
      </div>
    </div>
  );
}
