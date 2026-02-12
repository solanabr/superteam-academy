'use client';

import { WalletMultiButton } from '@/components/providers/wallet-provider';

/**
 * Wrapper so the wallet adapter button inherits our theme and is clickable.
 * The actual button is rendered by WalletMultiButton; we ensure it's not hidden by overflow or z-index.
 */
export function WalletButton() {
  return (
    <div className="wallet-button-wrapper relative flex overflow-visible">
      <WalletMultiButton className="!flex !h-10 !cursor-pointer !items-center !justify-center !gap-2 !rounded-xl !border-0 !bg-primary !px-5 !py-2 !font-medium !text-primary-foreground !shadow-none !transition-colors hover:!bg-primary/90 focus:!outline-none focus-visible:!ring-2 focus-visible:!ring-ring focus-visible:!ring-offset-2 focus-visible:!ring-offset-background [&.wallet-adapter-button]:!min-w-0" />
    </div>
  );
}
