"use client";

import type { ReactNode } from "react";
import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { getData, postData } from "@/lib/api/config";
import { useAuthStore, type AuthState } from "@/store/auth-store";

const LOGIN_MESSAGE = "Login to Superteam Academy";

type AuthSocialButtonsProps = {
  callback_url?: string;
};

export function AuthSocialButtons({ callback_url = "/dashboard" }: AuthSocialButtonsProps): ReactNode {
  const t = useTranslations("auth");
  const t_common = useTranslations("common");
  const router = useRouter();
  const set_session = useAuthStore((s: AuthState) => s.set_session);
  const { publicKey, signMessage, connected } = useWallet();
  const [wallet_error, set_wallet_error] = useState<string | null>(null);
  const [wallet_loading, set_wallet_loading] = useState(false);

  const handle_wallet_sign_in = useCallback(async (): Promise<void> => {
    if (!publicKey || !signMessage) {
      set_wallet_error("Wallet not ready");
      return;
    }
    set_wallet_error(null);
    set_wallet_loading(true);
    try {
      const message = LOGIN_MESSAGE;
      const encoded = new TextEncoder().encode(message);
      const signature = await signMessage(encoded);
      const signature_base64 =
        typeof btoa !== "undefined"
          ? btoa(String.fromCharCode(...signature))
          : "";
      await postData<{ ok: boolean }>("/api/auth/login-wallet", {
        public_key: publicKey.toBase58(),
        message,
        signature: signature_base64,
      });
      const session_data = await getData<{ user_id: string; email: string; role: string }>("/api/auth/session");
      set_session(session_data);
      router.push(callback_url);
    } catch (err) {
      set_wallet_error(err instanceof Error ? err.message : t_common("error"));
    } finally {
      set_wallet_loading(false);
    }
  }, [publicKey, signMessage, callback_url, set_session, router, t_common]);

  const button_class =
    "flex h-9 w-full items-center text-center justify-center rounded-none border-2 border-border bg-background px-4 py-2 font-mono text-sm uppercase tracking-wide text-foreground shadow-(--shadow-flat) hover:translate-x-px hover:translate-y-px hover:shadow-none";
  const oauth_redirect = `redirect_to=${encodeURIComponent(callback_url)}`;
  const wallet_button_wrapper =
    "[&_.wallet-adapter-button]:!h-9 [&_.wallet-adapter-button]:!w-full [&_.wallet-adapter-button]:!rounded-none [&_.wallet-adapter-button]:!border-2 [&_.wallet-adapter-button]:!border-border [&_.wallet-adapter-button]:!bg-background [&_.wallet-adapter-button]:!text-foreground [&_.wallet-adapter-button]:!font-mono [&_.wallet-adapter-button]:!text-xs [&_.wallet-adapter-button]:!uppercase [&_.wallet-adapter-button]:!tracking-wide [&_.wallet-adapter-button]:!shadow-[var(--shadow-flat)] [&_.wallet-adapter-button]:!px-4 [&_.wallet-adapter-button]:!py-2 [&_.wallet-adapter-button]:hover:!translate-x-px [&_.wallet-adapter-button]:hover:!translate-y-px [&_.wallet-adapter-button]:hover:!shadow-none [&_.wallet-adapter-button]:!transition-transform";

  return (
    <div className="flex flex-col gap-2">
      <a
        href={`/api/auth/oauth/google?${oauth_redirect}`}
        className={button_class}
      >
        {t("loginWithGoogle")}
      </a>
      <a
        href={`/api/auth/oauth/github?${oauth_redirect}`}
        className={button_class}
      >
        {t("loginWithGitHub")}
      </a>
      <div className={`flex flex-col gap-1 ${wallet_button_wrapper}`}>
        {!connected ? (
          <WalletMultiButton />
        ) : (
          <Button
            type="button"
            variant="outline"
            className={button_class}
            onClick={() => void handle_wallet_sign_in()}
            disabled={wallet_loading}
          >
            {wallet_loading ? t_common("loading") : t("connectWallet")}
          </Button>
        )}
        {wallet_error && (
          <p className="text-[10px] font-mono text-destructive" role="alert">
            {wallet_error}
          </p>
        )}
      </div>
    </div>
  );
}
