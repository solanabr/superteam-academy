"use client";

import { useState, useEffect, useCallback } from "react";
import { Users, Search, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

interface UserRow {
	_id: string;
	authId: string;
	name: string;
	email: string;
	walletAddress?: string;
	role: string;
	xpBalance: number;
	enrolledCourses: string[];
	completedCourses: string[];
	lastActiveAt?: string;
	_createdAt: string;
}

export default function AdminUsersPage() {
	const [users, setUsers] = useState<UserRow[]>([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState("");
	const [offset, setOffset] = useState(0);
	const limit = 50;

	const fetchUsers = useCallback(async () => {
		setLoading(true);
		try {
			const res = await fetch(`/api/admin/users?limit=${limit}&offset=${offset}`);
			if (res.ok) {
				const data = (await res.json()) as { users: UserRow[] };
				setUsers(data.users);
			}
		} finally {
			setLoading(false);
		}
	}, [offset]);

	useEffect(() => {
		fetchUsers();
	}, [fetchUsers]);

	const filtered = search
		? users.filter(
				(u) =>
					u.name.toLowerCase().includes(search.toLowerCase()) ||
					u.email.toLowerCase().includes(search.toLowerCase()) ||
					(u.walletAddress?.toLowerCase().includes(search.toLowerCase()) ?? false)
			)
		: users;

	const formatDate = (dateStr?: string) => {
		if (!dateStr) return "Never";
		return new Date(dateStr).toLocaleDateString();
	};

	return (
		<div className="p-6 space-y-6">
			<div>
				<h1 className="text-3xl font-bold">User Management</h1>
				<p className="text-muted-foreground">
					{users.length} user{users.length !== 1 ? "s" : ""} loaded
				</p>
			</div>

			<div className="flex items-center gap-4">
				<div className="relative flex-1 max-w-sm">
					<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						className="pl-9"
						placeholder="Search by name, email, or wallet..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
					/>
				</div>
			</div>

			{loading ? (
				<div className="flex items-center justify-center py-20">
					<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
				</div>
			) : filtered.length === 0 ? (
				<Card>
					<CardContent className="py-16 text-center">
						<Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
						<h3 className="text-lg font-medium mb-2">No users found</h3>
						<p className="text-muted-foreground">
							{search
								? "Try a different search term."
								: "No users have registered yet."}
						</p>
					</CardContent>
				</Card>
			) : (
				<Card>
					<CardHeader>
						<CardTitle>All Users</CardTitle>
					</CardHeader>
					<CardContent>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Name</TableHead>
									<TableHead>Email</TableHead>
									<TableHead>Wallet</TableHead>
									<TableHead>Role</TableHead>
									<TableHead className="text-right">XP</TableHead>
									<TableHead className="text-right">Enrolled</TableHead>
									<TableHead>Last Active</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{filtered.map((user) => (
									<TableRow key={user._id}>
										<TableCell className="font-medium">
											{user.name || "—"}
										</TableCell>
										<TableCell className="text-sm">
											{user.email.endsWith("@wallet.superteam.local")
												? "Wallet user"
												: user.email}
										</TableCell>
										<TableCell className="text-sm font-mono">
											{user.walletAddress
												? `${user.walletAddress.slice(0, 4)}...${user.walletAddress.slice(-4)}`
												: "—"}
										</TableCell>
										<TableCell>
											<Badge
												variant={
													user.role === "superadmin"
														? "default"
														: user.role === "admin"
															? "secondary"
															: "outline"
												}
												className="capitalize"
											>
												{user.role}
											</Badge>
										</TableCell>
										<TableCell className="text-right">
											{user.xpBalance.toLocaleString()}
										</TableCell>
										<TableCell className="text-right">
											{user.enrolledCourses?.length ?? 0}
										</TableCell>
										<TableCell className="text-sm text-muted-foreground">
											{formatDate(user.lastActiveAt)}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>

						<div className="flex items-center justify-between mt-4">
							<Button
								variant="outline"
								size="sm"
								disabled={offset === 0}
								onClick={() => setOffset((o) => Math.max(0, o - limit))}
							>
								Previous
							</Button>
							<span className="text-sm text-muted-foreground">
								Showing {offset + 1}–{offset + filtered.length}
							</span>
							<Button
								variant="outline"
								size="sm"
								disabled={users.length < limit}
								onClick={() => setOffset((o) => o + limit)}
							>
								Next
							</Button>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
