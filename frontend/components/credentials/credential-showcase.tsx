"use client";

import { useState } from "react";
import {
	Award,
	Share2,
	Download,
	ExternalLink,
	CheckCircle,
	Calendar,
	Trophy,
	Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useTranslations } from "next-intl";

interface Credential {
	id: string;
	title: string;
	description: string;
	issuer: string;
	issueDate: Date;
	expiryDate?: Date;
	skills: string[];
	grade?: string;
	verificationUrl: string;
	imageUrl?: string;
	blockchainTx?: string;
	metadata: {
		courseId: string;
		completionDate: Date;
		totalXP: number;
		rank?: number;
	};
}

interface CredentialShowcaseProps {
	credentials: Credential[];
	onShare?: (credential: Credential) => void;
	onDownload?: (credential: Credential) => void;
}

export function CredentialShowcase({ credentials, onShare, onDownload }: CredentialShowcaseProps) {
	const t = useTranslations("credentials");
	const { toast } = useToast();
	const [_selectedCredential, setSelectedCredential] = useState<Credential | null>(null);

	const handleShare = async (credential: Credential) => {
		try {
			if (navigator.share) {
				await navigator.share({
					title: credential.title,
					text: t("shareText", { title: credential.title, issuer: credential.issuer }),
					url: credential.verificationUrl,
				});
			} else {
				// Fallback: copy to clipboard
				await navigator.clipboard.writeText(credential.verificationUrl);
				toast({
					title: t("linkCopied"),
					description: t("linkCopiedDesc"),
				});
			}
			onShare?.(credential);
		} catch (_error) {
			toast({
				title: t("shareFailed"),
				description: t("shareFailedDesc"),
				variant: "destructive",
			});
		}
	};

	const handleDownload = (credential: Credential) => {
		// Simulate download
		toast({
			title: t("downloadStarted"),
			description: t("downloadStartedDesc", { title: credential.title }),
		});
		onDownload?.(credential);
	};

	const getGradeColor = (grade?: string) => {
		if (!grade) return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
		switch (grade.toLowerCase()) {
			case "a":
			case "a+":
				return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
			case "b":
			case "b+":
				return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
			case "c":
			case "c+":
				return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
			default:
				return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
		}
	};

	const formatDate = (date: Date) => {
		return new Intl.DateTimeFormat("en-US", {
			year: "numeric",
			month: "long",
			day: "numeric",
		}).format(date);
	};

	const CredentialCard = ({ credential }: { credential: Credential }) => (
		<Card className="group hover:shadow-lg transition-shadow cursor-pointer">
			<CardHeader className="pb-3">
				<div className="flex items-start justify-between">
					<div className="space-y-1">
						<CardTitle className="text-lg flex items-center gap-2">
							<Award className="h-5 w-5 text-yellow-600" />
							{credential.title}
						</CardTitle>
						<p className="text-sm text-muted-foreground">
							{t("issuedBy")} {credential.issuer}
						</p>
					</div>
					{credential.grade && (
						<Badge className={getGradeColor(credential.grade)}>
							{credential.grade}
						</Badge>
					)}
				</div>
			</CardHeader>
			<CardContent className="space-y-4">
				<p className="text-sm">{credential.description}</p>

				<div className="flex items-center gap-4 text-sm text-muted-foreground">
					<div className="flex items-center gap-1">
						<Calendar className="h-4 w-4" />
						{formatDate(credential.issueDate)}
					</div>
					{credential.expiryDate && (
						<div className="flex items-center gap-1">
							<Calendar className="h-4 w-4" />
							{t("expires")} {formatDate(credential.expiryDate)}
						</div>
					)}
				</div>

				<div className="flex flex-wrap gap-1">
					{credential.skills.slice(0, 3).map((skill) => (
						<Badge key={skill} variant="secondary" className="text-xs">
							{skill}
						</Badge>
					))}
					{credential.skills.length > 3 && (
						<Badge variant="secondary" className="text-xs">
							+{credential.skills.length - 3} {t("more")}
						</Badge>
					)}
				</div>

				<div className="flex gap-2">
					<Dialog>
						<DialogTrigger asChild={true}>
							<Button
								variant="outline"
								size="sm"
								onClick={() => setSelectedCredential(credential)}
							>
								<ExternalLink className="h-4 w-4 mr-2" />
								{t("view")}
							</Button>
						</DialogTrigger>
						<DialogContent className="max-w-2xl">
							<CredentialDetail credential={credential} />
						</DialogContent>
					</Dialog>

					<Button variant="outline" size="sm" onClick={() => handleShare(credential)}>
						<Share2 className="h-4 w-4 mr-2" />
						{t("share")}
					</Button>

					<Button variant="outline" size="sm" onClick={() => handleDownload(credential)}>
						<Download className="h-4 w-4 mr-2" />
						{t("download")}
					</Button>
				</div>
			</CardContent>
		</Card>
	);

	const CredentialDetail = ({ credential }: { credential: Credential }) => (
		<div className="space-y-6">
			<DialogHeader>
				<DialogTitle className="flex items-center gap-2">
					<Award className="h-6 w-6 text-yellow-600" />
					{credential.title}
				</DialogTitle>
			</DialogHeader>

			<Tabs defaultValue="overview" className="w-full">
				<TabsList className="grid w-full grid-cols-3">
					<TabsTrigger value="overview">{t("overview")}</TabsTrigger>
					<TabsTrigger value="verification">{t("verification")}</TabsTrigger>
					<TabsTrigger value="metadata">{t("metadata")}</TabsTrigger>
				</TabsList>

				<TabsContent value="overview" className="space-y-4">
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<label className="text-sm font-medium">{t("issuer")}</label>
							<p className="text-sm">{credential.issuer}</p>
						</div>
						<div className="space-y-2">
							<label className="text-sm font-medium">{t("issueDate")}</label>
							<p className="text-sm">{formatDate(credential.issueDate)}</p>
						</div>
						{credential.expiryDate && (
							<div className="space-y-2">
								<label className="text-sm font-medium">{t("expiryDate")}</label>
								<p className="text-sm">{formatDate(credential.expiryDate)}</p>
							</div>
						)}
						{credential.grade && (
							<div className="space-y-2">
								<label className="text-sm font-medium">{t("grade")}</label>
								<Badge className={getGradeColor(credential.grade)}>
									{credential.grade}
								</Badge>
							</div>
						)}
					</div>

					<div className="space-y-2">
						<label className="text-sm font-medium">{t("description")}</label>
						<p className="text-sm">{credential.description}</p>
					</div>

					<div className="space-y-2">
						<label className="text-sm font-medium">{t("skills")}</label>
						<div className="flex flex-wrap gap-2">
							{credential.skills.map((skill) => (
								<Badge key={skill} variant="secondary">
									{skill}
								</Badge>
							))}
						</div>
					</div>
				</TabsContent>

				<TabsContent value="verification" className="space-y-4">
					<div className="space-y-4">
						<div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-950 rounded-lg">
							<CheckCircle className="h-5 w-5 text-green-600" />
							<div>
								<p className="font-medium text-green-800 dark:text-green-200">
									{t("verified")}
								</p>
								<p className="text-sm text-green-600 dark:text-green-400">
									{t("verifiedDesc")}
								</p>
							</div>
						</div>

						<div className="space-y-3">
							<div className="space-y-2">
								<label className="text-sm font-medium">
									{t("verificationUrl")}
								</label>
								<div className="flex items-center gap-2">
									<code className="flex-1 p-2 bg-muted rounded text-sm break-all">
										{credential.verificationUrl}
									</code>
									<Button
										variant="outline"
										size="sm"
										onClick={() =>
											window.open(credential.verificationUrl, "_blank")
										}
									>
										<ExternalLink className="h-4 w-4" />
									</Button>
								</div>
							</div>

							{credential.blockchainTx && (
								<div className="space-y-2">
									<label className="text-sm font-medium">
										{t("blockchainTx")}
									</label>
									<code className="block p-2 bg-muted rounded text-sm break-all">
										{credential.blockchainTx}
									</code>
								</div>
							)}
						</div>
					</div>
				</TabsContent>

				<TabsContent value="metadata" className="space-y-4">
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<label className="text-sm font-medium">{t("courseId")}</label>
							<p className="text-sm font-mono">{credential.metadata.courseId}</p>
						</div>
						<div className="space-y-2">
							<label className="text-sm font-medium">{t("completionDate")}</label>
							<p className="text-sm">
								{formatDate(credential.metadata.completionDate)}
							</p>
						</div>
						<div className="space-y-2">
							<label className="text-sm font-medium">{t("totalXP")}</label>
							<div className="flex items-center gap-1">
								<Star className="h-4 w-4 text-yellow-600" />
								<span className="text-sm font-medium">
									{credential.metadata.totalXP}
								</span>
							</div>
						</div>
						{credential.metadata.rank && (
							<div className="space-y-2">
								<label className="text-sm font-medium">{t("rank")}</label>
								<div className="flex items-center gap-1">
									<Trophy className="h-4 w-4 text-yellow-600" />
									<span className="text-sm font-medium">
										#{credential.metadata.rank}
									</span>
								</div>
							</div>
						)}
					</div>
				</TabsContent>
			</Tabs>

			<div className="flex gap-3 pt-4 border-t">
				<Button onClick={() => handleShare(credential)}>
					<Share2 className="h-4 w-4 mr-2" />
					{t("share")}
				</Button>
				<Button variant="outline" onClick={() => handleDownload(credential)}>
					<Download className="h-4 w-4 mr-2" />
					{t("download")}
				</Button>
			</div>
		</div>
	);

	if (credentials.length === 0) {
		return (
			<div className="text-center py-12">
				<Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
				<h3 className="text-lg font-medium mb-2">{t("noCredentials")}</h3>
				<p className="text-muted-foreground">{t("noCredentialsDesc")}</p>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="text-center space-y-2">
				<h2 className="text-2xl font-bold">{t("myCredentials")}</h2>
				<p className="text-muted-foreground">
					{t("credentialsDesc", { count: credentials.length })}
				</p>
			</div>

			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
				{credentials.map((credential) => (
					<CredentialCard key={credential.id} credential={credential} />
				))}
			</div>
		</div>
	);
}
