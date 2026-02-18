"use client";

import { useCallback, useState } from "react";
import {
  useWallet,
  useConnectWallet,
  useDisconnectWallet,
  WalletListElement,
  useAccount,
  type WalletConnectorId,
} from "@solana/connector/react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

function ConnectButton() {
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
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={copy}
          className={cn(
            "rounded-lg border border-transparent px-2.5 py-1.5 text-sm font-medium",
            "hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 outline-none",
          )}
        >
          {copied ? "Copied!" : formatted}
        </button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => disconnect()}
          disabled={isDisconnecting}
        >
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={isConnecting}>
          {isConnecting ? "Connecting…" : "Connect wallet"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Connect your wallet</DialogTitle>
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
