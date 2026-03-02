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
import { WalletIcon, CopyIcon, SignOutIcon } from "@phosphor-icons/react";
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
            variant="secondary"
            size="default"
            className={cn("cursor-pointer min-w-0 font-medium", className)}
          >
            <WalletIcon className="size-4 shrink-0" weight="fill" />
            <span className="truncate">{copied ? t("copied") : formatted}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[200px]">
          <DropdownMenuItem
            onClick={() => copy()}
            className="cursor-pointer gap-2"
          >
            <CopyIcon className="size-4" />
            {copied ? t("copied") : formatted}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => disconnect()}
            disabled={isDisconnecting}
            className="cursor-pointer gap-2"
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
          variant="secondary"
          size="default"
          disabled={isConnecting}
          className={cn("cursor-pointer gap-2 font-medium", className)}
        >
          <WalletIcon className="size-4 shrink-0" weight="fill" />
          {isConnecting ? t("connecting") : t("connect")}
        </Button>
      </DialogTrigger>
      <DialogContent>
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
              className={cn(
                "flex w-full items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 text-left",
                "hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 outline-none",
                "disabled:opacity-50",
              )}
            >
              {wallet.icon && (
                <img
                  src={wallet.icon}
                  alt=""
                  className="size-8 shrink-0 rounded"
                />
              )}
              <span className="font-medium">{wallet.name}</span>
            </button>
          )}
        />
      </DialogContent>
    </Dialog>
  );
}

export { ConnectButton };
