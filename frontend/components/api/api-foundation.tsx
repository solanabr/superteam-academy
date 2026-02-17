/**
 * Public API Foundation Component
 * Provides RESTful API endpoints and authentication management
 */

"use client";

import { useState } from "react";
import { useApiManagement } from "@/hooks/use-api-management";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
    Key,
    Globe,
    Shield,
    Activity,
    Code,
    Copy,
    RefreshCw,
    Trash2,
    Plus,
    Eye,
    EyeOff,
    AlertTriangle,
    CheckCircle,
    Clock,
    Zap,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { format } from "date-fns";

interface PublicApiFoundationProps {
	userId: string;
	className?: string;
}

export function PublicApiFoundation({ userId, className = "" }: PublicApiFoundationProps) {
	const t = useTranslations("api");
	const {
		apiKeys,
		endpoints,
		usage,
		loading,
		error,
		createApiKey,
		revokeApiKey,
		regenerateApiKey,
		updateEndpointAccess,
	} = useApiManagement(userId);

	const [activeTab, setActiveTab] = useState("keys");
	const [newKeyName, setNewKeyName] = useState("");
	const [showSecret, setShowSecret] = useState<{ [key: string]: boolean }>({});

	if (loading) {
		return (
			<div className="space-y-4">
				<div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
				<div className="h-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
			</div>
		);
	}

	if (error) {
		return (
			<Alert variant="destructive">
				<AlertTriangle className="h-4 w-4" />
				<AlertDescription>{error}</AlertDescription>
			</Alert>
		);
	}

	const copyToClipboard = (text: string) => {
		navigator.clipboard.writeText(text);
	};

	const toggleSecretVisibility = (keyId: string) => {
		setShowSecret((prev) => ({
			...prev,
			[keyId]: !prev[keyId],
		}));
	};

	return (
		<div className={`space-y-6 ${className}`}>
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-bold flex items-center gap-2">
						<Globe className="h-6 w-6" />
						{t("title")}
					</h2>
					<p className="text-muted-foreground mt-1">{t("subtitle")}</p>
				</div>
				<Badge variant="secondary" className="flex items-center gap-1">
					<Activity className="h-3 w-3" />
					{t("activeKeys", { count: apiKeys.length })}
				</Badge>
			</div>

			<Tabs value={activeTab} onValueChange={setActiveTab}>
				<TabsList className="grid w-full grid-cols-4">
					<TabsTrigger value="keys">{t("tabs.keys")}</TabsTrigger>
					<TabsTrigger value="endpoints">{t("tabs.endpoints")}</TabsTrigger>
					<TabsTrigger value="usage">{t("tabs.usage")}</TabsTrigger>
					<TabsTrigger value="docs">{t("tabs.docs")}</TabsTrigger>
				</TabsList>

				<TabsContent value="keys" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>{t("createApiKey")}</CardTitle>
							<CardDescription>{t("createKeyDescription")}</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div>
								<label className="text-sm font-medium">{t("keyName")}</label>
								<Input
									value={newKeyName}
									onChange={(e) => setNewKeyName(e.target.value)}
									placeholder={t("keyNamePlaceholder")}
								/>
							</div>
							<Button
								onClick={() => {
									createApiKey(newKeyName);
									setNewKeyName("");
								}}
								disabled={!newKeyName.trim()}
							>
								<Plus className="h-4 w-4 mr-2" />
								{t("createKey")}
							</Button>
						</CardContent>
					</Card>

					<div className="space-y-4">
						{apiKeys.map((key) => (
							<Card key={key.id}>
								<CardHeader>
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-3">
											<Key className="h-5 w-5" />
											<div>
												<CardTitle className="text-lg">
													{key.name}
												</CardTitle>
												<CardDescription className="flex items-center gap-2">
													<Clock className="h-3 w-3" />
													{t("created")} {format(key.createdAt, "PPp")}
												</CardDescription>
											</div>
										</div>
										<div className="flex items-center gap-2">
											<Badge
												variant={
													key.status === "active"
														? "default"
														: "secondary"
												}
											>
												{t(`status.${key.status}`)}
											</Badge>
											<Button
												onClick={() => toggleSecretVisibility(key.id)}
												variant="outline"
												size="sm"
											>
												{showSecret[key.id] ? (
													<EyeOff className="h-3 w-3" />
												) : (
													<Eye className="h-3 w-3" />
												)}
											</Button>
										</div>
									</div>
								</CardHeader>
								<CardContent className="space-y-4">
									<div>
										<label className="text-sm font-medium">{t("apiKey")}</label>
										<div className="flex gap-2 mt-1">
											<Input
												value={
													showSecret[key.id]
														? key.secret
														: "••••••••••••••••••••••••••••••••"
												}
												readOnly={true}
												className="font-mono text-sm"
											/>
											<Button
												onClick={() => copyToClipboard(key.secret)}
												variant="outline"
												size="sm"
											>
												<Copy className="h-3 w-3" />
											</Button>
										</div>
									</div>

									<div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
										<div>
											<div className="text-muted-foreground">
												{t("requestsToday")}
											</div>
											<div className="font-semibold">{key.usage.today}</div>
										</div>
										<div>
											<div className="text-muted-foreground">
												{t("requestsMonth")}
											</div>
											<div className="font-semibold">{key.usage.month}</div>
										</div>
										<div>
											<div className="text-muted-foreground">
												{t("rateLimit")}
											</div>
											<div className="font-semibold">
												{key.rateLimit}/hour
											</div>
										</div>
										<div>
											<div className="text-muted-foreground">
												{t("lastUsed")}
											</div>
											<div className="font-semibold">
												{key.lastUsed
													? format(key.lastUsed, "PP")
													: t("never")}
											</div>
										</div>
									</div>

									<div className="flex gap-2">
										<Button
											onClick={() => regenerateApiKey(key.id)}
											variant="outline"
											size="sm"
										>
											<RefreshCw className="h-3 w-3 mr-1" />
											{t("regenerate")}
										</Button>
										<Button
											onClick={() => revokeApiKey(key.id)}
											variant="destructive"
											size="sm"
										>
											<Trash2 className="h-3 w-3 mr-1" />
											{t("revoke")}
										</Button>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</TabsContent>

				<TabsContent value="endpoints" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>{t("availableEndpoints")}</CardTitle>
							<CardDescription>{t("endpointsDescription")}</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{endpoints.map((endpoint) => (
									<div
										key={endpoint.id}
										className="flex items-center justify-between p-4 border rounded-lg"
									>
										<div className="flex-1">
											<div className="flex items-center gap-2 mb-1">
												<Code className="h-4 w-4" />
												<span className="font-mono text-sm font-medium">
													{endpoint.method}
												</span>
												<span className="font-mono text-sm">
													{endpoint.path}
												</span>
											</div>
											<p className="text-sm text-muted-foreground">
												{endpoint.description}
											</p>
											<div className="flex items-center gap-2 mt-2">
												<Badge variant="outline">{endpoint.category}</Badge>
												{endpoint.authRequired && (
													<Badge variant="secondary">
														<Shield className="h-3 w-3 mr-1" />
														{t("authRequired")}
													</Badge>
												)}
											</div>
										</div>
										<div className="flex items-center gap-2">
											<span className="text-sm text-muted-foreground">
												{endpoint.requests} {t("requests")}
											</span>
											<Switch
												checked={endpoint.enabled}
												onCheckedChange={(enabled) =>
													updateEndpointAccess(endpoint.id, enabled)
												}
											/>
										</div>
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="usage" className="space-y-4">
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<Card>
							<CardContent className="p-4 text-center">
								<Activity className="h-8 w-8 mx-auto mb-2 text-blue-500" />
								<div className="text-2xl font-bold">{usage.totalRequests}</div>
								<div className="text-sm text-muted-foreground">
									{t("totalRequests")}
								</div>
							</CardContent>
						</Card>
						<Card>
							<CardContent className="p-4 text-center">
								<Zap className="h-8 w-8 mx-auto mb-2 text-green-500" />
								<div className="text-2xl font-bold">{usage.avgResponseTime}ms</div>
								<div className="text-sm text-muted-foreground">
									{t("avgResponseTime")}
								</div>
							</CardContent>
						</Card>
						<Card>
							<CardContent className="p-4 text-center">
								<CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
								<div className="text-2xl font-bold">{usage.successRate}%</div>
								<div className="text-sm text-muted-foreground">
									{t("successRate")}
								</div>
							</CardContent>
						</Card>
					</div>

					<Card>
						<CardHeader>
							<CardTitle>{t("usageByEndpoint")}</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-3">
								{usage.byEndpoint.map((endpoint) => (
									<div
										key={endpoint.path}
										className="flex items-center justify-between"
									>
										<div className="flex-1">
											<div className="font-mono text-sm">{endpoint.path}</div>
											<div className="text-xs text-muted-foreground">
												{endpoint.method}
											</div>
										</div>
										<div className="text-right">
											<div className="font-semibold">{endpoint.requests}</div>
											<div className="text-xs text-muted-foreground">
												{endpoint.errors} {t("errors")}
											</div>
										</div>
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="docs" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>{t("apiDocumentation")}</CardTitle>
							<CardDescription>{t("docsDescription")}</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<a
									href="/api/docs"
									target="_blank"
									rel="noopener noreferrer"
									className="p-4 border rounded-lg hover:bg-muted transition-colors"
								>
									<div className="flex items-center gap-3">
										<Code className="h-6 w-6" />
										<div>
											<div className="font-semibold">
												{t("interactiveDocs")}
											</div>
											<div className="text-sm text-muted-foreground">
												{t("interactiveDocsDesc")}
											</div>
										</div>
									</div>
								</a>
								<a
									href="/api/docs/openapi.json"
									target="_blank"
									rel="noopener noreferrer"
									className="p-4 border rounded-lg hover:bg-muted transition-colors"
								>
									<div className="flex items-center gap-3">
										<Globe className="h-6 w-6" />
										<div>
											<div className="font-semibold">{t("openapiSpec")}</div>
											<div className="text-sm text-muted-foreground">
												{t("openapiSpecDesc")}
											</div>
										</div>
									</div>
								</a>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>{t("authentication")}</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div>
								<h4 className="font-semibold mb-2">{t("apiKeyAuth")}</h4>
								<div className="bg-muted p-3 rounded font-mono text-sm">
									Authorization: Bearer YOUR_API_KEY
								</div>
							</div>
							<div>
								<h4 className="font-semibold mb-2">{t("rateLimits")}</h4>
								<ul className="text-sm space-y-1">
									<li>• 1000 requests per hour per API key</li>
									<li>• 100 requests per minute per IP</li>
									<li>• Burst limit: 50 requests per second</li>
								</ul>
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}
