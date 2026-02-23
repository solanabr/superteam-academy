"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { signIn, getSession, useSession } from "next-auth/react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import bs58 from "bs58";
import { toast } from "sonner";

/**
 * Reusable hook that performs the full wallet linking flow:
 * connect wallet → sign message → set link-intent cookie → signIn("solana-wallet")
 * This is the same flow as the Settings page "Link Wallet" button.
 *
 * If the wallet is already linked to a *different* account, the session silently
 * switches to that account and a notification is shown:
 * "You are now signed in as X because this wallet was linked to that profile."
 *
 * @param onLinked - optional callback invoked after linking (or profile switch)
 */
export function useWalletLink(onLinked?: () => void) {
  const wallet = useWallet();
  const { setVisible } = useWalletModal();
  const { update } = useSession();
  const [linking, setLinking] = useState(false);
  const pendingLink = useRef(false);
  const signingRef = useRef(false);

  const performSign = useCallback(async () => {
    if (!wallet.publicKey || !wallet.signMessage) return;
    // Prevent concurrent sign requests — the useEffect can re-fire when
    // performSign changes reference mid-flight.
    if (signingRef.current) return;
    signingRef.current = true;

    setLinking(true);
    try {
      const message = `Link wallet to Superteam Academy\nTimestamp: ${Date.now()}\nAddress: ${wallet.publicKey.toBase58()}`;
      const signature = await wallet.signMessage(new TextEncoder().encode(message));

      // Set link-intent cookie so JWT callback links to existing profile instead of creating new account
      await fetch("/api/auth/link-intent", { method: "POST" });

      const result = await signIn("solana-wallet", {
        publicKey: wallet.publicKey.toBase58(),
        signature: bs58.encode(signature),
        message,
        redirect: false,
      });

      if (result?.ok) {
        // Read the fresh session to detect a profile switch.
        // switchedProfileName is set when the wallet belonged to a different account.
        const freshSession = (await getSession()) as Record<string, unknown> | null;
        if (freshSession?.switchedProfileName) {
          toast.info(
            `You are now signed in as "${freshSession.switchedProfileName}" because this wallet was already linked to that profile.`,
          );
        } else {
          toast.success("Wallet connected!");
        }
        // Clear the one-shot notification from the JWT.
        await update({});
        onLinked?.();
      } else {
        toast.error("Failed to link wallet. Please try again.");
      }
    } catch {
      // User rejected signing in wallet extension
    } finally {
      setLinking(false);
      pendingLink.current = false;
      signingRef.current = false;
    }
  }, [wallet, onLinked, update]);

  // After wallet connects (triggered by opening modal), auto-sign if a link is pending
  useEffect(() => {
    if (pendingLink.current && !signingRef.current && wallet.connected && wallet.publicKey && wallet.signMessage) {
      performSign();
    }
  }, [wallet.connected, wallet.publicKey, performSign]);

  const linkWallet = useCallback(() => {
    if (wallet.connected && wallet.publicKey && wallet.signMessage) {
      // Wallet already connected — go straight to signing
      performSign();
    } else {
      // Open wallet selection modal; performSign fires automatically once connected
      pendingLink.current = true;
      setVisible(true);
    }
  }, [wallet, performSign, setVisible]);

  return { linkWallet, linking };
}
