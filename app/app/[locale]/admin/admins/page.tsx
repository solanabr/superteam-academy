"use client";

import { useState } from "react";
import { Shield, UserPlus, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/auth-context";
import { WALLET_EMAIL_DOMAIN } from "@/packages/auth/src/wallet-utils";
import { formatDate, truncateAddress } from "@/lib/utils";
import { useAsyncData } from "@/hooks/use-async-data";
import { fetchJson } from "@/lib/fetch-utils";

interface AdminRow {
	_id: string;
	authId: string;
	name: string;
	email: string;
	walletAddress?: string;
	role: string;
	lastActiveAt?: string;
	_createdAt: string;
}

export default function AdminTeamPage() {
	const { isSuperAdmin } = useAuth();
	const [dialogOpen, setDialogOpen] = useState(false);
	const [promoteEmail, setPromoteEmail] = useState("");
	const [promoteRole, setPromoteRole] = useState<string>("admin");
	const [promoting, setPromoting] = useState(false);

	const {
		data: adminsData,
		loading,
		refetch: fetchAdmins,
	} = useAsyncData(async () => {
		const { data } = await fetchJson<{ admins: AdminRow[] }>("/api/admin/admins");
		return data?.admins ?? [];
	}, []);

	const admins = adminsData ?? [];

	const handlePromote = async () => {
		if (!promoteEmail.trim()) return;
		setPromoting(true);

		const res = await fetch("/api/admin/users?limit=200&offset=0");
		if (!res.ok) {
			setPromoting(false);
			return;
		}

		const data = (await res.json()) as { users: AdminRow[] };
		const match = data.users.find(
			(u) =>
				u.email.toLowerCase() === promoteEmail.trim().toLowerCase() ||
				u.walletAddress?.toLowerCase() === promoteEmail.trim().toLowerCase()
		);

		if (!match) {
			setPromoting(false);
			return;
		}

		const roleRes = await fetch("/api/admin/admins", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ userId: match._id, role: promoteRole }),
		});

		if (roleRes.ok) {
			setDialogOpen(false);
			setPromoteEmail("");
			fetchAdmins();
		}
		setPromoting(false);
	};

	const handleDemote = async (userId: string) => {
		const res = await fetch("/api/admin/admins", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ userId, role: "learner" }),
		});
		if (res.ok) {
			fetchAdmins();
		}
	};

	if (loading) {
		return (
			<div className="p-6 space-y-6">
				<div className="flex items-center justify-between">
					<div className="space-y-2">
						<div className="h-8 w-36 bg-muted animate-pulse rounded-lg" />
						<div className="h-4 w-48 bg-muted animate-pulse rounded-lg" />
					</div>
					<div className="h-10 w-28 bg-muted animate-pulse rounded-lg" />
				</div>
				<div className="space-y-3">
					<div className="h-10 bg-muted animate-pulse rounded-lg" />
					{Array.from({ length: 4 }).map((_, i) => (
						<div key={i} className="h-14 bg-muted animate-pulse rounded-lg" />
					))}
				</div>
			</div>
		);
	}

	return (
		<div className="p-6 space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold">Admin Team</h1>
					<p className="text-muted-foreground">
						{admins.length} administrator{admins.length !== 1 ? "s" : ""}
					</p>
				</div>
				{isSuperAdmin && (
					<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
						<DialogTrigger asChild>
							<Button>
								<UserPlus className="h-4 w-4 mr-2" />
								Add Admin
							</Button>
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>Add Administrator</DialogTitle>
								<DialogDescription>
									Enter the email or wallet address of a registered user to
									promote.
								</DialogDescription>
							</DialogHeader>
							<div className="space-y-4 py-4">
								<div className="space-y-2">
									<Label htmlFor="email">Email or Wallet Address</Label>
									<Input
										id="email"
										value={promoteEmail}
										onChange={(e) => setPromoteEmail(e.target.value)}
										placeholder="user@example.com or wallet address"
									/>
								</div>
								<div className="space-y-2">
									<Label>Role</Label>
									<Select value={promoteRole} onValueChange={setPromoteRole}>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="admin">Admin</SelectItem>
											<SelectItem value="superadmin">Super Admin</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>
							<DialogFooter>
								<Button
									onClick={handlePromote}
									disabled={promoting || !promoteEmail.trim()}
								>
									{promoting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
									Promote
								</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
				)}
			</div>

			{admins.length === 0 ? (
				<Card>
					<CardContent className="py-16 text-center">
						<Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
						<h3 className="text-lg font-medium mb-2">No admins configured</h3>
						<p className="text-muted-foreground">
							Set the SUPER_ADMIN_IDENTIFIER environment variable to bootstrap.
						</p>
					</CardContent>
				</Card>
			) : (
				<Card>
					<CardHeader>
						<CardTitle>Administrators</CardTitle>
					</CardHeader>
					<CardContent>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Name</TableHead>
									<TableHead>Email</TableHead>
									<TableHead>Role</TableHead>
									<TableHead>Last Active</TableHead>
									<TableHead>Joined</TableHead>
									{isSuperAdmin && (
										<TableHead className="text-right">Actions</TableHead>
									)}
								</TableRow>
							</TableHeader>
							<TableBody>
								{admins.map((admin) => (
									<TableRow key={admin._id}>
										<TableCell className="font-medium">
											{admin.name || "—"}
										</TableCell>
										<TableCell className="text-sm">
											{admin.email.endsWith(WALLET_EMAIL_DOMAIN)
												? admin.walletAddress
													? truncateAddress(admin.walletAddress)
													: "Wallet user"
												: admin.email}
										</TableCell>
										<TableCell>
											<Badge
												variant={
													admin.role === "superadmin"
														? "default"
														: "secondary"
												}
												className="capitalize"
											>
												{admin.role}
											</Badge>
										</TableCell>
										<TableCell className="text-sm text-muted-foreground">
											{formatDate(admin.lastActiveAt)}
										</TableCell>
										<TableCell className="text-sm text-muted-foreground">
											{formatDate(admin._createdAt)}
										</TableCell>
										{isSuperAdmin && (
											<TableCell className="text-right">
												<AlertDialog>
													<AlertDialogTrigger asChild>
														<Button variant="ghost" size="sm">
															Remove
														</Button>
													</AlertDialogTrigger>
													<AlertDialogContent>
														<AlertDialogHeader>
															<AlertDialogTitle>
																Remove {admin.name || "this admin"}?
															</AlertDialogTitle>
															<AlertDialogDescription>
																They will be demoted to a regular
																learner and lose admin access.
															</AlertDialogDescription>
														</AlertDialogHeader>
														<AlertDialogFooter>
															<AlertDialogCancel>
																Cancel
															</AlertDialogCancel>
															<AlertDialogAction
																onClick={() =>
																	handleDemote(admin._id)
																}
															>
																Remove
															</AlertDialogAction>
														</AlertDialogFooter>
													</AlertDialogContent>
												</AlertDialog>
											</TableCell>
										)}
									</TableRow>
								))}
							</TableBody>
						</Table>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
