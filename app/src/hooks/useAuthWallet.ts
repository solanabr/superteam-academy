import { useWallet } from "@solana/wallet-adapter-react";
import { signIn, signOut, useSession } from "next-auth/react";
import { useCallback } from "react";
import bs58 from "bs58";
import { toast } from "sonner";

export function useAuthWallet() {
  const { publicKey, signMessage, disconnect, connected } = useWallet();
  const { status } = useSession();

  const login = useCallback(async () => {
    if (!publicKey) {
        toast.error("Please connect wallet first");
        return;
    }
    
    if (!signMessage) {
        toast.error("Wallet does not support message signing");
        return;
    }

    try {
      const messageContent = `Sign in to Superteam Academy: ${new Date().getTime()}`;
      const message = new TextEncoder().encode(messageContent);
      
      const signature = await signMessage(message);
      
      const result = await signIn("credentials", {
        message: messageContent,
        signature: bs58.encode(signature),
        publicKey: publicKey.toString(),
        redirect: false,
      });

      if (result?.error) {
          console.error("Login failed:", result.error);
          toast.error("Login failed");
          disconnect();
      } else {
          toast.success("Signed in successfully!");
      }
    } catch (error) {
      console.error("Sign message failed", error);
      toast.error("Signature rejected");
      disconnect();
    }
  }, [publicKey, signMessage, disconnect]);

  return { login };
}