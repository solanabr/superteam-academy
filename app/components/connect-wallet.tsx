"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import {
  useWallet,
  useConnectWallet,
  useDisconnectWallet,
  WalletListElement,
  useAccount,
  type WalletConnectorId,
} from "@solana/connector/react";
import {
  WalletIcon,
  CopyIcon,
  SignOutIcon,
  CaretDownIcon,
  ArrowUpRightIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { cn } from "@/lib/utils";

type ConnectButtonProps = {
  className?: string;
};

const walletTriggerBaseClass =
  "group/connect relative isolate min-w-0 overflow-hidden rounded-full border px-3.5 font-heading text-[0.82rem] font-semibold tracking-[0.03em] transition-all duration-200 focus-visible:ring-3 focus-visible:ring-ring/55 before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_0%_0%,rgba(255,255,255,0.28),transparent_56%)] dark:before:bg-[radial-gradient(circle_at_0%_0%,rgba(255,255,255,0.14),transparent_56%)]";

const disconnectedWalletTriggerClass =
  "border-primary/70 bg-primary text-primary-foreground shadow-[0_1px_0_0_rgba(255,255,255,0.2)_inset,0_14px_20px_-18px_rgba(0,0,0,0.95)] hover:-translate-y-0.5 hover:bg-primary/90 active:translate-y-0";

const connectedWalletTriggerClass =
  "border-border bg-card/95 text-foreground shadow-[0_1px_0_0_var(--color-border),0_14px_20px_-18px_rgba(0,0,0,0.7)] hover:-translate-y-0.5 hover:border-primary/45 hover:bg-accent/65 active:translate-y-0 aria-expanded:border-primary/55 aria-expanded:bg-accent/70";

const walletOptionButtonClass =
  "group/wallet flex w-full items-center gap-3 rounded-xl border border-border/70 bg-background/70 px-3 py-2.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/45 hover:bg-accent/60 hover:shadow-[0_16px_18px_-20px_rgba(0,0,0,0.95)] focus-visible:ring-3 focus-visible:ring-ring/50 outline-none disabled:opacity-50";

function ConnectButton({ className }: ConnectButtonProps) {
  const t = useTranslations("wallet");
  const [open, setOpen] = useState(false);
  const { isConnected } = useWallet();
  const { connect, isConnecting } = useConnectWallet();
  const { disconnect, isDisconnecting } = useDisconnectWallet();
  const { formatted, copy, copied } = useAccount();

  const handleConnect = useCallback(
    async (connectorId: WalletConnectorId) => {
      await connect(connectorId);
      setOpen(false);
    },
    [connect],
  );

  if (isConnected) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="default"
            className={cn(
              "cursor-pointer",
              walletTriggerBaseClass,
              connectedWalletTriggerClass,
              className,
            )}
          >
            <span className="relative inline-flex size-5 items-center justify-center rounded-full border border-foreground/15 bg-background/70">
              <WalletIcon className="size-3.5 shrink-0" weight="fill" />
              <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full border border-card bg-primary" />
            </span>
            <span className="truncate">{copied ? t("copied") : formatted}</span>
            <CaretDownIcon className="size-3.5 shrink-0 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="min-w-[220px] rounded-xl border border-border/70 bg-card/95 p-1.5 shadow-lg backdrop-blur-xs"
        >
          <DropdownMenuItem
            onClick={() => copy()}
            className="cursor-pointer gap-2 rounded-lg px-2.5 py-2 font-medium"
          >
            <CopyIcon className="size-4" />
            {copied ? t("copied") : formatted}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => disconnect()}
            disabled={isDisconnecting}
            className="cursor-pointer gap-2 rounded-lg px-2.5 py-2 font-medium"
          >
            <SignOutIcon className="size-4" />
            {t("disconnect")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="default"
          disabled={isConnecting}
          className={cn(
            "cursor-pointer gap-2",
            walletTriggerBaseClass,
            disconnectedWalletTriggerClass,
            className,
          )}
        >
          <span className="inline-flex size-5 items-center justify-center rounded-full bg-secondary text-secondary-foreground shadow-[0_1px_0_0_rgba(255,255,255,0.45)_inset]">
            <WalletIcon className="size-3.5 shrink-0" weight="fill" />
          </span>
          {isConnecting ? t("connecting") : t("connect")}
          <ArrowUpRightIcon className="size-3.5 shrink-0 opacity-85" />
        </Button>
      </DialogTrigger>
      <DialogContent className="overflow-hidden border border-border/70 bg-card/95 shadow-xl backdrop-blur-xs">
        <DialogHeader>
          <DialogTitle>{t("connectPrompt")}</DialogTitle>
        </DialogHeader>
        <WalletListElement
          installedOnly
          variant="list"
          onConnect={handleConnect}
          renderWallet={({ wallet, connect, connecting }) => (
            <button
              type="button"
              onClick={() => connect()}
              disabled={connecting}
              className={walletOptionButtonClass}
            >
              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-card shadow-sm">
                {wallet.icon && (
                  <img
                    src={wallet.icon}
                    alt=""
                    className="size-7 shrink-0 rounded-md"
                  />
                )}
              </span>
              <span className="truncate font-semibold">{wallet.name}</span>
              <ArrowUpRightIcon className="ml-auto size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover/wallet:-translate-y-0.5 group-hover/wallet:translate-x-0.5" />
            </button>
          )}
        />
      </DialogContent>
    </Dialog>
  );
}

export { ConnectButton };
