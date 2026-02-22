import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Award, ExternalLink, CheckCircle, Calendar, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTranslations } from "next-intl/server";

interface CertificatePageProps {
	params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: CertificatePageProps): Promise<Metadata> {
	const { id } = await params;
	const cert = await getCertificate(id);
	if (!cert) return { title: "Certificate Not Found | Superteam Academy" };
	return {
		title: `${cert.title} — ${cert.holder} | Superteam Academy`,
		description: `Verifiable on-chain credential for completing ${cert.courseName}.`,
	};
}

export default async function CertificatePage({ params }: CertificatePageProps) {
	const { id } = await params;
	const cert = await getCertificate(id);
	if (!cert) notFound();
	const t = await getTranslations("certificates");

	return (
		<div className="min-h-screen py-12">
			<div className="max-w-2xl mx-auto px-4 space-y-8">
				<div className="text-center space-y-2">
					<div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
						<Award className="h-8 w-8 text-primary" />
					</div>
					<h1 className="text-2xl font-bold tracking-tight">{cert.title}</h1>
					<p className="text-muted-foreground">
						{t("issuedBy")}{" "}
						<span className="font-medium text-foreground">{t("issuer")}</span>
					</p>
				</div>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-lg">
							<Shield className="h-5 w-5 text-primary" />
							{t("title")}
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-2 gap-4">
							<div>
								<p className="text-sm text-muted-foreground">{t("holder")}</p>
								<p className="font-medium">{cert.holder}</p>
							</div>
							<div>
								<p className="text-sm text-muted-foreground">{t("course")}</p>
								<p className="font-medium">{cert.courseName}</p>
							</div>
							<div>
								<p className="text-sm text-muted-foreground">{t("track")}</p>
								<Badge variant="secondary">{cert.track}</Badge>
							</div>
							<div>
								<p className="text-sm text-muted-foreground">{t("level")}</p>
								<Badge variant="outline">{cert.level}</Badge>
							</div>
							<div className="flex items-center gap-1">
								<Calendar className="h-4 w-4 text-muted-foreground" />
								<div>
									<p className="text-sm text-muted-foreground">{t("issued")}</p>
									<p className="font-medium">
										{new Date(cert.issuedAt).toLocaleDateString()}
									</p>
								</div>
							</div>
							<div className="flex items-center gap-1">
								<CheckCircle className="h-4 w-4 text-green-500" />
								<div>
									<p className="text-sm text-muted-foreground">{t("status")}</p>
									<p className="font-medium text-green-600">{t("verified")}</p>
								</div>
							</div>
						</div>

						<div className="pt-4 border-t space-y-2">
							<p className="text-sm text-muted-foreground">{t("xpEarned")}</p>
							<p className="text-2xl font-bold">
								{cert.xpEarned.toLocaleString()} XP
							</p>
						</div>

						{cert.onChainAddress && (
							<div className="pt-4 border-t">
								<p className="text-sm text-muted-foreground mb-2">
									{t("onChainProof")}
								</p>
								<code className="block p-3 bg-muted rounded-lg text-xs break-all">
									{cert.onChainAddress}
								</code>
								<Button variant="outline" size="sm" className="mt-2 gap-1" asChild>
									<a
										href={`https://explorer.solana.com/address/${cert.onChainAddress}?cluster=devnet`}
										target="_blank"
										rel="noopener noreferrer"
									>
										{t("viewOnExplorer")}
										<ExternalLink className="h-3 w-3" />
									</a>
								</Button>
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

interface Certificate {
	id: string;
	title: string;
	holder: string;
	courseName: string;
	track: string;
	level: string;
	issuedAt: string;
	xpEarned: number;
	onChainAddress: string | null;
}

async function getCertificate(id: string): Promise<Certificate | null> {
	// Seed data for demonstration — replaced by on-chain lookup when program is deployed
	const certificates: Record<string, Certificate> = {
		"cert-solana-fundamentals": {
			id: "cert-solana-fundamentals",
			title: "Solana Fundamentals Certificate",
			holder: "João Silva",
			courseName: "Introduction to Solana",
			track: "Solana Core",
			level: "Beginner",
			issuedAt: "2024-02-10T00:00:00Z",
			xpEarned: 500,
			onChainAddress: null,
		},
		"cert-anchor-masterclass": {
			id: "cert-anchor-masterclass",
			title: "Anchor Masterclass Certificate",
			holder: "Maria Santos",
			courseName: "Anchor Framework Deep Dive",
			track: "Anchor",
			level: "Intermediate",
			issuedAt: "2024-02-15T00:00:00Z",
			xpEarned: 1200,
			onChainAddress: null,
		},
	};

	return certificates[id] ?? null;
}
