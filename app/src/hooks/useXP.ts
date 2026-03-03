"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react";
import { getXPBalance, calculateLevel, levelProgress, getLevelTitle } from "@/lib/xp";

export interface XPState {
    balance: number;
    level: number;
    levelTitle: string;
    progress: number; // 0-100 % to next level
    loading: boolean;
}

export function useXP(): XPState {
    const { connection } = useConnection();
    const { publicKey } = useWallet();
    const [state, setState] = useState<XPState>({
        balance: 0,
        level: 0,
        levelTitle: "Explorer",
        progress: 0,
        loading: false,
    });

    useEffect(() => {
        if (!publicKey) {
            setState({ balance: 0, level: 0, levelTitle: "Explorer", progress: 0, loading: false });
            return;
        }

        setState((s) => ({ ...s, loading: true }));

        getXPBalance(connection, publicKey)
            .then((balance) => {
                const level = calculateLevel(balance);
                setState({
                    balance,
                    level,
                    levelTitle: getLevelTitle(level),
                    progress: levelProgress(balance),
                    loading: false,
                });
            })
            .catch(() => setState((s) => ({ ...s, loading: false })));
    }, [connection, publicKey]);

    return state;
}
