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
            <div className="flex min-h-screen items-center justify-center">
                <div className="mx-auto flex max-w-md flex-col items-center gap-6 px-6 text-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-zinc-800">
                        <Wallet className="h-10 w-10 text-yellow-400" />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-3xl font-game">
                            Connect your wallet
                        </h1>
                        <p className="font-game text-xl text-gray-400">
                            You need a Solana wallet to access the academy. Connect to start
                            learning, earning XP, and collecting credentials.
                        </p>
                    </div>
                    <Button
                        variant="pixel"
                        size="lg"
                        className="w-full font-game text-2xl"
                        onClick={() => setVisible(true)}
                    >
                        <Wallet className="mr-2 h-5 w-5" />
                        Connect Wallet
                    </Button>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
