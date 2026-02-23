"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";

interface WalletGuardProps {
    children: ReactNode;
}

export function WalletGuard({ children }: WalletGuardProps) {
    const { connected } = useWallet();
    const { setVisible } = useWalletModal();

    if (!connected) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <div className="mx-auto flex max-w-md flex-col items-center gap-6 px-6 text-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
                        <Wallet className="h-10 w-10 text-primary" />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-2xl font-bold tracking-tight">
                            Connect your wallet
                        </h1>
                        <p className="text-muted-foreground">
                            You need a Solana wallet to access the academy. Connect to start
                            learning, earning XP, and collecting credentials.
                        </p>
                    </div>
                    <Button
                        size="lg"
                        className="w-full"
                        onClick={() => setVisible(true)}
                    >
                        <Wallet className="mr-2 h-4 w-4" />
                        Connect Wallet
                    </Button>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
