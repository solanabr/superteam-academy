/**
 * @fileoverview User account menu component.
 * Provides access to dashboard, theme settings, language selection, and logout.
 */
"use client";

import { CopyIcon, SignOutIcon } from "@phosphor-icons/react";
import Image from "next/image";
import { useState } from "react";
import { CustomAvatar } from "@/components/shared/CustomAvatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "@/lib/auth/client";

interface UserMenuProps {
	session: {
		user: {
			id: string;
			name?: string | null;
			email?: string | null;
			image?: string | null;
			avatarSeed?: string | null;
			walletAddress?: string | null;
			[key: string]: unknown;
		};
	};
}

export function UserMenu({ session }: UserMenuProps) {
	const user = session.user;
	const [copied, setCopied] = useState(false);

	const avatarSeed =
		(user as { avatarSeed?: string | null }).avatarSeed || user.id;

	const handleCopy = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		if (user.walletAddress) {
			navigator.clipboard.writeText(user.walletAddress);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		}
	};

	return (
		<DropdownMenu modal={false}>
			<DropdownMenuTrigger asChild>
				<button className="flex items-center gap-3 bg-ink-secondary/10 px-3 py-1.5 border border-ink-secondary/20 hover:bg-ink-secondary/20 transition-colors focus:outline-none">
					<div className="w-6 h-6 shrink-0 overflow-hidden relative border border-ink-primary/20">
						{user.image ? (
							<Image
								src={user.image}
								alt="Avatar"
								fill
								className="object-cover"
							/>
						) : (
							<CustomAvatar
								seed={avatarSeed}
								size={24}
								className="border-none"
							/>
						)}
					</div>
					<span className="text-xs font-bold leading-none hidden sm:block">
						{user.name || "Operator"}
					</span>
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align="end"
				className="w-56 p-2 rounded-none border border-border bg-bg-surface shadow-[4px_4px_0_rgba(0,0,0,0.1)]"
			>
				{user.walletAddress && (
					<div className="px-3 py-2 mb-2 border-b border-border bg-ink-primary/5">
						<div className="flex items-center justify-between mb-1">
							<span className="text-[10px] font-bold uppercase tracking-widest text-ink-secondary">
								WALLET_ID
							</span>
							<button
								onClick={handleCopy}
								className="text-ink-secondary hover:text-ink-primary transition-colors flex items-center gap-1"
							>
								<CopyIcon size={12} weight={copied ? "fill" : "bold"} />
								<span className="text-[9px] uppercase font-bold">
									{copied ? "COPIED" : "COPY"}
								</span>
							</button>
						</div>
						<div className="font-mono text-[10px] break-all text-ink-primary opacity-60">
							{user.walletAddress}
						</div>
					</div>
				)}
				<DropdownMenuItem
					className="gap-2 cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-500/10 rounded-none h-10 px-3 uppercase text-[10px] font-bold tracking-widest"
					onClick={() =>
						signOut({
							fetchOptions: { onSuccess: () => window.location.reload() },
						})
					}
				>
					<SignOutIcon size={16} weight="bold" />
					<span>Sign Out</span>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
