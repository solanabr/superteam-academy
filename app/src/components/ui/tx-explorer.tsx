"use client";

import { motion } from "framer-motion";
import { ExternalLink, CheckCircle2, Clock, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface TxExplorerProps {
    txHash: string;
    label?: string;
    status?: "confirmed" | "pending" | "simulated";
    network?: "devnet" | "mainnet";
}

export function TxExplorer({
    txHash,
    label = "On-Chain Transaction",
    status = "confirmed",
    network = "devnet",
}: TxExplorerProps) {
    const explorerUrl = `https://explorer.solana.com/address/${txHash}?cluster=${network}`;
    const shortened = `${txHash.slice(0, 8)}...${txHash.slice(-8)}`;

    const statusConfig = {
        confirmed: {
            icon: CheckCircle2,
            label: "Confirmed",
            color: "text-green-400",
            bg: "bg-green-400/10",
            dot: "bg-green-400",
        },
        pending: {
            icon: Clock,
            label: "Pending",
            color: "text-yellow-400",
            bg: "bg-yellow-400/10",
            dot: "bg-yellow-400",
        },
        simulated: {
            icon: Zap,
            label: "Simulated",
            color: "text-primary",
            bg: "bg-primary/10",
            dot: "bg-primary",
        },
    };

    const cfg = statusConfig[status];

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
        >
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
                <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-primary" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
                            </svg>
                            {label}
                        </div>
                        <Badge variant="outline" className={`text-[10px] gap-1 ${cfg.color} border-current/30 ${cfg.bg}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot} animate-pulse`} />
                            {cfg.label}
                        </Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                    <div className="flex items-center justify-between rounded-lg border border-border/50 bg-black/20 px-3 py-2">
                        <div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
                                {network === "devnet" ? "Solana Devnet" : "Solana Mainnet"}
                            </p>
                            <p className="font-mono text-xs text-primary">{shortened}</p>
                        </div>
                        <a
                            href={explorerUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 rounded-md border border-primary/20 bg-primary/10 px-2.5 py-1.5 text-[11px] font-medium text-primary transition-colors hover:bg-primary/20"
                        >
                            Explorer
                            <ExternalLink className="h-3 w-3" />
                        </a>
                    </div>
                    <p className="mt-2 text-[10px] text-muted-foreground">
                        Verified on Solana blockchain — immutable, transparent, trustless.
                    </p>
                </CardContent>
            </Card>
        </motion.div>
    );
}
