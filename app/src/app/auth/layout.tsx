import Image from 'next/image';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* Left Panel - Branding */}
      <div className="from-primary/20 via-primary/10 relative hidden w-1/2 flex-col justify-between bg-gradient-to-br to-transparent p-12 lg:flex">
        {/* Background Pattern */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239945FF' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        {/* Logo - Centered and Large with Animation */}
        <div className="flex flex-1 flex-col items-center justify-center">
          <div className="animate-float relative mb-8">
            <div className="absolute inset-0 scale-150 rounded-full bg-gradient-to-r from-purple-500/30 to-pink-500/30 blur-3xl" />
            <div className="from-primary/10 to-primary/5 border-primary/20 relative rounded-3xl border bg-gradient-to-br p-6 backdrop-blur-sm">
              <Image
                src="/logo.png"
                alt="CapySolBuild Academy"
                width={160}
                height={160}
                className="drop-shadow-2xl"
                priority
              />
            </div>
          </div>
          <div className="animate-slide-up flex flex-col items-center">
            <span className="text-3xl font-bold tracking-tight">CapySolBuild</span>
            <span className="text-muted-foreground text-sm font-medium tracking-widest uppercase">
              Academy
            </span>
          </div>
        </div>

        {/* Main Content */}
        <div className="animate-slide-up animation-delay-100 relative z-10">
          <h1 className="text-4xl leading-tight font-bold tracking-tight">
            Master Solana
            <br />
            <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
              Development
            </span>
          </h1>
          <p className="text-muted-foreground mt-4 max-w-md text-lg">
            Join thousands of developers learning to build production-ready dApps on Solana.
          </p>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex h-screen flex-1 items-center justify-center overflow-y-auto p-8">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
