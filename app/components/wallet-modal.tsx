"use client";

import {
  useConnector,
  type WalletConnectorId,
  type WalletConnectorMetadata,
} from "@solana/connector/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { WalletIcon } from "@phosphor-icons/react";
import { useState, useEffect } from "react";

export function WalletModal({
  open,
  onOpenChange,
  walletConnectUri,
  onClearWalletConnectUri,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  walletConnectUri?: string | null;
  onClearWalletConnectUri?: () => void;
}) {
  const {
    walletStatus,
    isConnecting,
    connectorId,
    connectors,
    connectWallet,
    disconnectWallet,
  } = useConnector();
  const status = walletStatus.status;
  const [connectingConnectorId, setConnectingConnectorId] =
    useState<WalletConnectorId | null>(null);
  const [recentlyConnectedConnectorId, setRecentlyConnectedConnectorId] =
    useState<WalletConnectorId | null>(null);

  useEffect(() => {
    const recent = localStorage.getItem("recentlyConnectedConnectorId");
    if (recent) setRecentlyConnectedConnectorId(recent as WalletConnectorId);
  }, []);

  useEffect(() => {
    if (status !== "connected") return;
    if (!connectorId) return;
    localStorage.setItem("recentlyConnectedConnectorId", connectorId);
    setRecentlyConnectedConnectorId(connectorId);
  }, [status, connectorId]);

  function cancelConnection() {
    onClearWalletConnectUri?.();
    setConnectingConnectorId(null);
    disconnectWallet().catch(() => {});
  }

  const handleSelectWallet = async (connector: WalletConnectorMetadata) => {
    setConnectingConnectorId(connector.id);
    try {
      if (connector.name === "WalletConnect") {
        onClearWalletConnectUri?.();
      }
      await connectWallet(connector.id);
      localStorage.setItem("recentlyConnectedConnectorId", connector.id);
      setRecentlyConnectedConnectorId(connector.id);
      if (connector.name !== "WalletConnect") onOpenChange(false);
    } catch (error) {
      console.error("Failed to connect:", error);
    } finally {
      setConnectingConnectorId(null);
    }
  };

  const readyConnectors = connectors.filter((c) => c.ready);
  const primaryWallets = readyConnectors.slice(0, 3);
  const otherWallets = readyConnectors.slice(3);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-[24px]">
        <DialogHeader>
          <DialogTitle>Connect your wallet</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {primaryWallets.map((connector) => (
            <Button
              key={connector.id}
              variant="outline"
              className="w-full justify-between p-4 rounded-[16px]"
              onClick={() => handleSelectWallet(connector)}
              disabled={isConnecting}
            >
              <span>{connector.name}</span>
              <Avatar className="h-10 w-10">
                <AvatarImage src={connector.icon} />
                <AvatarFallback>
                  <WalletIcon />
                </AvatarFallback>
              </Avatar>
            </Button>
          ))}
          {otherWallets.length > 0 && (
            <Accordion type="single" collapsible>
              <AccordionItem value="more">
                <AccordionTrigger>Other Wallets</AccordionTrigger>
                <AccordionContent>
                  {otherWallets.map((connector) => (
                    <Button
                      key={connector.id}
                      variant="outline"
                      className="w-full mb-2"
                      onClick={() => handleSelectWallet(connector)}
                    >
                      {connector.name}
                    </Button>
                  ))}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
