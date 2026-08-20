import { SolanaWalletProvider } from "@/lib/solana/wallet-provider";
import { DynamicWalletProvider } from "@/components/auth/dynamic-wallet-provider";
import { GamificationOverlays } from "@/components/gamification/gamification-overlays";
import { LowSolBanner } from "@/components/layout/low-sol-banner";

/**
 * (platform) routes carry the wallet/Dynamic provider stack and the
 * gamification overlays (#1097); marketing/admin routes do not, and reach
 * wallet features through AuthModal's lazily-mounted scoped stack instead.
 *
 * Order matters and mirrors what [locale]/layout.tsx had before the
 * demotion: SolanaWalletProvider outside DynamicWalletProvider, both inside
 * the global Auth/Analytics providers. Crossing marketing↔platform unmounts
 * the stack; wallet-adapter keeps `walletName` in localStorage and never
 * disconnects the adapter on unmount, so re-entry silently reconnects via
 * autoConnect, and WalletAuthHandler's existing-session check keeps the
 * reconnect from re-prompting SIWS.
 */
export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SolanaWalletProvider>
      {/* DynamicAuthHandler is mounted by the provider itself, not here:
          its hook throws outside a DynamicContextProvider, so it must never
          be a sibling. */}
      <DynamicWalletProvider>
        {/* Moved out of the Header (#1097): the banner needs useWallet /
            useConnection, which only resolve under this stack. Devnet-only,
            learner-facing — marketing routes never showed it anyway. */}
        <LowSolBanner />
        <div className="container px-4 pb-20 pt-6 sm:px-6 md:pt-8 lg:px-8 lg:pb-8">
          {children}
        </div>
        <GamificationOverlays />
      </DynamicWalletProvider>
    </SolanaWalletProvider>
  );
}
