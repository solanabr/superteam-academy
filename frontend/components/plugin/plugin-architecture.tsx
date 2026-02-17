/**
 * Plugin Architecture Component
 * Provides extensible plugin system and marketplace
 */

"use client";

import { useState } from "react";
import { usePluginSystem } from "@/hooks/use-plugin-system";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
	Puzzle,
	Download,
	Upload,
	Settings,
	Star,
	Users,
	Code,
	Shield,
	Zap,
	Package,
	AlertTriangle,
	XCircle,
	RefreshCw,
	ExternalLink,
	Palette,
	BarChart,
	Trophy,
} from "lucide-react";
import { useTranslations } from "next-intl";

interface PluginArchitectureProps {
	userId: string;
	className?: string;
}

export function PluginArchitecture({ userId, className = "" }: PluginArchitectureProps) {
	const t = useTranslations("plugins");
	const {
		installedPlugins,
		availablePlugins,
		loading,
		error,
		installPlugin,
		uninstallPlugin,
		updatePlugin,
		configurePlugin,
	} = usePluginSystem(userId);

	const [activeTab, setActiveTab] = useState("installed");
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedCategory, setSelectedCategory] = useState("all");

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

	const categories = [
		"all",
		"editor",
		"theme",
		"integration",
		"analytics",
		"gamification",
		"utility",
	];
	const filteredPlugins = availablePlugins.filter((plugin) => {
		const matchesSearch =
			plugin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			plugin.description.toLowerCase().includes(searchTerm.toLowerCase());
		const matchesCategory = selectedCategory === "all" || plugin.category === selectedCategory;
		return matchesSearch && matchesCategory;
	});

	const getPluginIcon = (category: string) => {
		switch (category) {
			case "editor":
				return <Code className="h-4 w-4" />;
			case "theme":
				return <Palette className="h-4 w-4" />;
			case "integration":
				return <Zap className="h-4 w-4" />;
			case "analytics":
				return <BarChart className="h-4 w-4" />;
			case "gamification":
				return <Trophy className="h-4 w-4" />;
			case "utility":
				return <Settings className="h-4 w-4" />;
			default:
				return <Package className="h-4 w-4" />;
		}
	};

	return (
		<div className={`space-y-6 ${className}`}>
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-bold flex items-center gap-2">
						<Puzzle className="h-6 w-6" />
						{t("title")}
					</h2>
					<p className="text-muted-foreground mt-1">{t("subtitle")}</p>
				</div>
				<Badge variant="secondary" className="flex items-center gap-1">
					<Package className="h-3 w-3" />
					{t("installedCount", { count: installedPlugins.length })}
				</Badge>
			</div>

			<Tabs value={activeTab} onValueChange={setActiveTab}>
				<TabsList className="grid w-full grid-cols-3">
					<TabsTrigger value="installed">{t("tabs.installed")}</TabsTrigger>
					<TabsTrigger value="marketplace">{t("tabs.marketplace")}</TabsTrigger>
					<TabsTrigger value="development">{t("tabs.development")}</TabsTrigger>
				</TabsList>

				<TabsContent value="installed" className="space-y-4">
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{installedPlugins.map((plugin) => (
							<Card key={plugin.id}>
								<CardHeader className="pb-3">
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											{getPluginIcon(plugin.category)}
											<CardTitle className="text-lg">{plugin.name}</CardTitle>
										</div>
										<Badge variant="outline">v{plugin.version}</Badge>
									</div>
									<CardDescription className="text-sm">
										{plugin.description}
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-3">
									<div className="flex items-center justify-between text-sm">
										<span className="flex items-center gap-1">
											<Star className="h-3 w-3" />
											{plugin.rating}
										</span>
										<span className="flex items-center gap-1">
											<Users className="h-3 w-3" />
											{plugin.installs}
										</span>
									</div>

									<div className="flex items-center gap-2">
										<Switch
											checked={plugin.enabled}
											onCheckedChange={(enabled) =>
												configurePlugin(plugin.id, { enabled })
											}
										/>
										<span className="text-sm">
											{plugin.enabled ? t("enabled") : t("disabled")}
										</span>
									</div>

									<div className="flex gap-2">
										<Button
											onClick={() => updatePlugin(plugin.id)}
											variant="outline"
											size="sm"
											className="flex-1"
										>
											<RefreshCw className="h-3 w-3 mr-1" />
											{t("update")}
										</Button>
										<Button
											onClick={() => uninstallPlugin(plugin.id)}
											variant="destructive"
											size="sm"
											className="flex-1"
										>
											<XCircle className="h-3 w-3 mr-1" />
											{t("uninstall")}
										</Button>
									</div>

									{plugin.settings && (
										<Button
											onClick={() => {
												/* Open settings modal */
											}}
											variant="ghost"
											size="sm"
											className="w-full"
										>
											<Settings className="h-3 w-3 mr-1" />
											{t("settings")}
										</Button>
									)}
								</CardContent>
							</Card>
						))}
					</div>

					{installedPlugins.length === 0 && (
						<Card>
							<CardContent className="text-center py-8">
								<Puzzle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
								<h3 className="text-lg font-semibold mb-2">
									{t("noPlugins.title")}
								</h3>
								<p className="text-muted-foreground mb-4">
									{t("noPlugins.description")}
								</p>
								<Button onClick={() => setActiveTab("marketplace")}>
									{t("browseMarketplace")}
								</Button>
							</CardContent>
						</Card>
					)}
				</TabsContent>

				<TabsContent value="marketplace" className="space-y-4">
					<div className="flex flex-col sm:flex-row gap-4">
						<Input
							placeholder={t("searchPlugins")}
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="flex-1"
						/>
						<select
							value={selectedCategory}
							onChange={(e) => setSelectedCategory(e.target.value)}
							className="px-3 py-2 border rounded-md bg-background"
						>
							{categories.map((category) => (
								<option key={category} value={category}>
									{t(`categories.${category}`)}
								</option>
							))}
						</select>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{filteredPlugins.map((plugin) => {
							const isInstalled = installedPlugins.some((p) => p.id === plugin.id);
							return (
								<Card key={plugin.id} className="hover:shadow-md transition-shadow">
									<CardHeader className="pb-3">
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-2">
												{getPluginIcon(plugin.category)}
												<CardTitle className="text-lg">
													{plugin.name}
												</CardTitle>
											</div>
											<Badge variant="outline">v{plugin.version}</Badge>
										</div>
										<CardDescription className="text-sm">
											{plugin.description}
										</CardDescription>
									</CardHeader>
									<CardContent className="space-y-3">
										<div className="flex items-center justify-between text-sm">
											<span className="flex items-center gap-1">
												<Star className="h-3 w-3" />
												{plugin.rating}
											</span>
											<span className="flex items-center gap-1">
												<Users className="h-3 w-3" />
												{plugin.installs}
											</span>
											<Badge variant="secondary">
												{t(`categories.${plugin.category}`)}
											</Badge>
										</div>

										<div className="flex items-center gap-2 text-sm text-muted-foreground">
											<Shield className="h-3 w-3" />
											{t("byAuthor", { author: plugin.author })}
										</div>

										<div className="flex gap-2">
											{isInstalled ? (
												<Button
													onClick={() => uninstallPlugin(plugin.id)}
													variant="destructive"
													size="sm"
													className="flex-1"
												>
													<XCircle className="h-3 w-3 mr-1" />
													{t("uninstall")}
												</Button>
											) : (
												<Button
													onClick={() => installPlugin(plugin.id)}
													size="sm"
													className="flex-1"
												>
													<Download className="h-3 w-3 mr-1" />
													{t("install")}
												</Button>
											)}
											<Button variant="outline" size="sm">
												<ExternalLink className="h-3 w-3" />
											</Button>
										</div>
									</CardContent>
								</Card>
							);
						})}
					</div>

					{filteredPlugins.length === 0 && (
						<Card>
							<CardContent className="text-center py-8">
								<Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
								<h3 className="text-lg font-semibold mb-2">
									{t("noResults.title")}
								</h3>
								<p className="text-muted-foreground">
									{t("noResults.description")}
								</p>
							</CardContent>
						</Card>
					)}
				</TabsContent>

				<TabsContent value="development" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>{t("createPlugin")}</CardTitle>
							<CardDescription>{t("createPluginDescription")}</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<label className="text-sm font-medium">{t("pluginName")}</label>
									<Input placeholder={t("pluginNamePlaceholder")} />
								</div>
								<div>
									<label className="text-sm font-medium">
										{t("pluginCategory")}
									</label>
									<select className="w-full px-3 py-2 border rounded-md bg-background">
										{categories.slice(1).map((category) => (
											<option key={category} value={category}>
												{t(`categories.${category}`)}
											</option>
										))}
									</select>
								</div>
							</div>
							<div>
								<label className="text-sm font-medium">
									{t("pluginDescription")}
								</label>
								<Textarea
									placeholder={t("pluginDescriptionPlaceholder")}
									rows={3}
								/>
							</div>
							<div>
								<label className="text-sm font-medium">{t("pluginCode")}</label>
								<Textarea
									placeholder={t("pluginCodePlaceholder")}
									rows={10}
									className="font-mono text-sm"
								/>
							</div>
							<Button className="w-full">
								<Upload className="h-4 w-4 mr-2" />
								{t("publishPlugin")}
							</Button>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>{t("developmentResources")}</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="p-4 border rounded-lg">
									<Code className="h-6 w-6 mb-2" />
									<h4 className="font-semibold mb-1">{t("apiReference")}</h4>
									<p className="text-sm text-muted-foreground mb-3">
										{t("apiReferenceDesc")}
									</p>
									<Button variant="outline" size="sm">
										{t("viewDocs")}
									</Button>
								</div>
								<div className="p-4 border rounded-lg">
									<Settings className="h-6 w-6 mb-2" />
									<h4 className="font-semibold mb-1">{t("pluginHooks")}</h4>
									<p className="text-sm text-muted-foreground mb-3">
										{t("pluginHooksDesc")}
									</p>
									<Button variant="outline" size="sm">
										{t("learnMore")}
									</Button>
								</div>
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}
