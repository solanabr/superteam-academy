"use client";

import { Edit, MapPin, Calendar, Github, Linkedin, Wallet, Zap, Flame, Award } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { truncateAddress } from "@/lib/utils";

interface User {
	id: string;
	name: string;
	email: string;
	avatar?: string;
	bio?: string;
	joinDate: string;
	location?: string;
	github?: string;
	linkedin?: string;
	username?: string | undefined;
	walletAddress: string;
}

interface UserStats {
	level: number;
	xp: number;
	totalXP: number;
	streak: {
		current: number;
		longest: number;
	};
	courses: {
		completed: number;
		enrolled: number;
	};
	achievements: {
		unlocked: number;
	};
}

interface ProfileHeaderProps {
	user: User;
	stats: UserStats;
}

export function ProfileHeader({ user, stats }: ProfileHeaderProps) {
	const { isAuthenticated, user: authUser, wallet } = useAuth();
	const pathname = usePathname();
	const walletAddress = wallet.publicKey?.toBase58();
	const isSelfProfileRoute = pathname === "/profile";
	const identifiersMatch =
		(authUser?.id !== undefined && authUser.id === user.id) ||
		(walletAddress !== undefined && walletAddress === user.walletAddress);
	const isOwner = isAuthenticated && (identifiersMatch || isSelfProfileRoute);

	const shortWallet = truncateAddress(user.walletAddress);

	return (
		<div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
			<div className="h-24 bg-linear-to-r from-forest via-green to-forest relative">
				<div className="absolute inset-0 pattern-dots opacity-20" />
			</div>

			<div className="px-5 pb-5 -mt-8 relative z-10">
				<div className="flex flex-col sm:flex-row gap-4 sm:items-end">
					<Avatar className="h-20 w-20 ring-4 ring-card mt-2">
						<AvatarImage src={user.avatar} alt={user.name} />
					</Avatar>

					<div className="flex-1 min-w-0 sm:pb-1">
						<h1 className="text-xl font-bold truncate">{user.name}</h1>
						{user.bio && (
							<p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
								{user.bio}
							</p>
						)}
						<div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-muted-foreground">
							<span className="inline-flex items-center gap-1">
								<Calendar className="h-3 w-3" />
								Joined{" "}
								{new Date(user.joinDate).toLocaleDateString("en", {
									month: "short",
									year: "numeric",
								})}
							</span>
							{user.location && (
								<span className="inline-flex items-center gap-1">
									<MapPin className="h-3 w-3" />
									{user.location}
								</span>
							)}
							{user.walletAddress && (
								<span className="inline-flex items-center gap-1">
									<Wallet className="h-3 w-3" />
									{shortWallet}
								</span>
							)}
						</div>
					</div>

					<div className="flex items-center gap-2 sm:pb-1">
						{user.github && (
							<Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
								<a href={user.github} target="_blank" rel="noopener noreferrer">
									<Github className="h-4 w-4" />
								</a>
							</Button>
						)}
						{user.linkedin && (
							<Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
								<a href={user.linkedin} target="_blank" rel="noopener noreferrer">
									<Linkedin className="h-4 w-4" />
								</a>
							</Button>
						)}
						{isOwner ? (
							<Button variant="outline" size="sm" className="h-8 gap-1.5" asChild>
								<Link href="/settings">
									<Edit className="h-3.5 w-3.5" />
									Edit
								</Link>
							</Button>
						) : null}
					</div>
				</div>

				<div className="grid grid-cols-4 gap-3 mt-5 pt-5 border-t border-border/40">
					<div className="text-center">
						<div className="text-lg font-bold text-primary">{stats.level}</div>
						<div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
							Level
						</div>
					</div>
					<div className="text-center">
						<div className="inline-flex items-center gap-1 text-lg font-bold text-gold">
							<Zap className="h-4 w-4" />
							{stats.totalXP.toLocaleString()}
						</div>
						<div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
							Total XP
						</div>
					</div>
					<div className="text-center">
						<div className="inline-flex items-center gap-1 text-lg font-bold text-destructive">
							<Flame className="h-4 w-4" />
							{stats.streak.current}
						</div>
						<div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
							Streak
						</div>
					</div>
					<div className="text-center">
						<div className="inline-flex items-center gap-1 text-lg font-bold text-green">
							<Award className="h-4 w-4" />
							{stats.achievements.unlocked}
						</div>
						<div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
							Badges
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
