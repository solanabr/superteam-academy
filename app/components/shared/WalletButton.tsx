'use client';

import { FC, useMemo, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Link } from '@/i18n/routing';
import { WalletIcon, SignOutIcon, CopyIcon, UserIcon } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { WalletModal } from './WalletModal';

export const WalletButton: FC = () => {
    const { publicKey, wallet, disconnect, connecting } = useWallet();
    const [open, setOpen] = useState(false);

    const base58 = useMemo(() => publicKey?.toBase58(), [publicKey]);
    
    // Shorten address: 4 chars ... 4 chars
    const content = useMemo(() => {
        if (!base58) return null;
        return base58.slice(0, 4) + '..' + base58.slice(-4);
    }, [base58]);

    const copyAddress = async () => {
        if (base58) {
            await navigator.clipboard.writeText(base58);
            toast.success('Copied to clipboard'); 
        }
    };

    if (!wallet || !base58) {
        return (
            <>
                <Button 
                    variant="landingPrimary" 
                    onClick={() => setOpen(true)}
                    disabled={connecting}
                >
                    {connecting ? 'Connecting...' : 'Connect Wallet'}
                </Button>
                <WalletModal open={open} onOpenChange={setOpen} />
            </>
        );
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="font-mono gap-2 rounded-none border-ink-primary hover:bg-ink-primary hover:text-bg-base transition-colors">
                        <WalletIcon size={16} />
                        {content}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem onClick={copyAddress} className="gap-2 font-mono text-xs">
                        <CopyIcon size={14} />
                        Copy Address
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="gap-2 font-mono text-xs">
                        <Link href="/profile">
                            <UserIcon size={14} />
                            Profile
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={disconnect} className="gap-2 font-mono text-xs text-red-500 hover:text-red-600">
                        <SignOutIcon size={14} />
                        Disconnect
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            <WalletModal open={open} onOpenChange={setOpen} />
        </>
    );
};
