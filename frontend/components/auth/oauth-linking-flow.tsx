"use client";

import { useState } from "react";
import { Github, Mail, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useTranslations } from "next-intl";

interface OAuthAccount {
	provider: "google" | "github";
	email: string;
	connected: boolean;
	lastUsed?: string;
}

interface OAuthLinkingFlowProps {
	onSuccess?: (provider: string, email: string) => void;
	onError?: (error: string) => void;
}

export function OAuthLinkingFlow({ onSuccess, onError }: OAuthLinkingFlowProps) {
	const t = useTranslations("oauth");
	const { toast } = useToast();
	const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
	const [accounts, setAccounts] = useState<OAuthAccount[]>([
		{
			provider: "github",
			email: "user@github.com",
			connected: true,
			lastUsed: "2024-02-15T14:30:00Z",
		},
	]);

	const handleConnect = async (provider: "google" | "github") => {
		try {
			setIsLoading((prev) => ({ ...prev, [provider]: true }));

			// Simulate OAuth flow
			await new Promise((resolve) => setTimeout(resolve, 2000));

			const mockEmail = provider === "github" ? "user@github.com" : "user@gmail.com";

			// Check if account already exists
			const existingAccount = accounts.find((acc) => acc.provider === provider);
			if (existingAccount) {
				toast({
					title: t("alreadyConnected"),
					description: t("alreadyConnectedDesc", { provider }),
				});
				return;
			}

			const newAccount: OAuthAccount = {
				provider,
				email: mockEmail,
				connected: true,
				lastUsed: new Date().toISOString(),
			};

			setAccounts((prev) => [...prev, newAccount]);

			toast({
				title: t("connected"),
				description: t("connectedDesc", { provider }),
			});

			onSuccess?.(provider, mockEmail);
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : t("connectionFailed");
			toast({
				title: t("connectionFailed"),
				description: errorMessage,
				variant: "destructive",
			});
			onError?.(errorMessage);
		} finally {
			setIsLoading((prev) => ({ ...prev, [provider]: false }));
		}
	};

	const handleDisconnect = async (provider: "google" | "github") => {
		try {
			setIsLoading((prev) => ({ ...prev, [provider]: true }));

			// Simulate disconnect
			await new Promise((resolve) => setTimeout(resolve, 1000));

			setAccounts((prev) => prev.filter((acc) => acc.provider !== provider));

			toast({
				title: t("disconnected"),
				description: t("disconnectedDesc", { provider }),
			});
		} catch (_error) {
			toast({
				title: t("disconnectFailed"),
				description: t("disconnectFailedDesc"),
				variant: "destructive",
			});
		} finally {
			setIsLoading((prev) => ({ ...prev, [provider]: false }));
		}
	};

	const getProviderIcon = (provider: string) => {
		switch (provider) {
			case "github":
				return <Github className="h-5 w-5" />;
			case "google":
				return <Mail className="h-5 w-5" />;
			default:
				return <Mail className="h-5 w-5" />;
		}
	};

	const getProviderColor = (provider: string) => {
		switch (provider) {
			case "github":
				return "text-gray-900 dark:text-white";
			case "google":
				return "text-blue-600";
			default:
				return "text-muted-foreground";
		}
	};

	return (
		<Card className="w-full max-w-md">
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Mail className="h-5 w-5" />
					{t("linkAccounts")}
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-6">
				<div className="text-center">
					<p className="text-muted-foreground">{t("linkDescription")}</p>
				</div>

				{accounts.length > 0 && (
					<div className="space-y-3">
						<h4 className="text-sm font-medium">{t("connectedAccounts")}</h4>
						{accounts.map((account) => (
							<div
								key={account.provider}
								className="flex items-center justify-between p-3 border rounded-lg"
							>
								<div className="flex items-center gap-3">
									<div className={getProviderColor(account.provider)}>
										{getProviderIcon(account.provider)}
									</div>
									<div>
										<p className="font-medium capitalize">{account.provider}</p>
										<p className="text-sm text-muted-foreground">
											{account.email}
										</p>
										{account.lastUsed && (
											<p className="text-xs text-muted-foreground">
												{t("lastUsed")}:{" "}
												{new Date(account.lastUsed).toLocaleDateString()}
											</p>
										)}
									</div>
								</div>
								<div className="flex items-center gap-2">
									<Badge variant="secondary" className="text-green-600">
										<Check className="h-3 w-3 mr-1" />
										{t("connected")}
									</Badge>
									<Button
										variant="outline"
										size="sm"
										onClick={() => handleDisconnect(account.provider)}
										disabled={isLoading[account.provider]}
									>
										{t("disconnect")}
									</Button>
								</div>
							</div>
						))}
					</div>
				)}

				<Separator />

				<div className="space-y-3">
					<h4 className="text-sm font-medium">{t("availableProviders")}</h4>

					{!accounts.find((acc) => acc.provider === "github") && (
						<Button
							variant="outline"
							className="w-full justify-start"
							onClick={() => handleConnect("github")}
							disabled={isLoading.github}
						>
							<Github className="h-4 w-4 mr-3" />
							{isLoading.github ? t("connecting") : t("connectGithub")}
						</Button>
					)}

					{!accounts.find((acc) => acc.provider === "google") && (
						<Button
							variant="outline"
							className="w-full justify-start"
							onClick={() => handleConnect("google")}
							disabled={isLoading.google}
						>
							<Mail className="h-4 w-4 mr-3 text-blue-600" />
							{isLoading.google ? t("connecting") : t("connectGoogle")}
						</Button>
					)}
				</div>

				<div className="space-y-2">
					<h4 className="text-sm font-medium">{t("benefits")}</h4>
					<ul className="text-sm text-muted-foreground space-y-1">
						<li>• {t("benefit1")}</li>
						<li>• {t("benefit2")}</li>
						<li>• {t("benefit3")}</li>
					</ul>
				</div>

				<div className="text-xs text-muted-foreground text-center">
					<p>
						{t("help")}{" "}
						<a
							href="/support"
							className="text-primary hover:underline"
							target="_blank"
							rel="noopener noreferrer"
						>
							{t("support")}
						</a>
					</p>
				</div>
			</CardContent>
		</Card>
	);
}
