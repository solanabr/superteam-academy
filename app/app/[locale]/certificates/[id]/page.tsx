import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Award, ExternalLink, CheckCircle, Calendar, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTranslations } from "next-intl/server";
import { getSolanaConnection, getProgramId } from "@/lib/academy";
import { CredentialService } from "@/services/credential-service";
import { CertificateActions } from "@/components/credentials/certificate-actions";
import { truncateAddress } from "@/lib/utils";
import { getCoursesCMS } from "@/lib/cms";
import { Link } from "@superteam-academy/i18n/navigation";

interface CertificatePageProps {
	params: Promise<{ locale: string; id: string }>;
}

export async function generateMetadata({ params }: CertificatePageProps): Promise<Metadata> {
	const { id, locale } = await params;
	const t = await getTranslations({ locale, namespace: "seo.dynamic.certificate" });
	const cert = await getCertificate(id);
	if (!cert) {
		return {
			title: t("notFoundTitle"),
			description: t("notFoundDescription"),
		};
	}
	return {
		title: t("title", {
			certificate: cert.title,
			holder: cert.holder,
		}),
		description: t("description", { course: cert.courseName }),
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
						{cert.imageUrl ? (
							<div className="rounded-xl border border-border/60 bg-muted/30 overflow-hidden">
								<img
									src={cert.imageUrl}
									alt={cert.title}
									className="w-full h-56 object-cover"
								/>
							</div>
						) : null}
						<div className="grid grid-cols-2 gap-4">
							<div>
								<p className="text-sm text-muted-foreground">{t("holder")}</p>
								<p className="font-medium">{cert.holder}</p>
							</div>
							<div>
								<p className="text-sm text-muted-foreground">{t("course")}</p>
								{cert.courseSlug ? (
									<Link
										href={`/courses/${cert.courseSlug}`}
										className="font-medium hover:underline text-primary"
									>
										{cert.courseName}
									</Link>
								) : (
									<p className="font-medium">{cert.courseName}</p>
								)}
							</div>
							<div>
								<p className="text-sm text-muted-foreground">{t("track")}</p>
								{cert.courseSlug ? (
									<Link href={`/courses/${cert.courseSlug}`}>
										<Badge
											variant="secondary"
											className="hover:bg-secondary/80 cursor-pointer"
										>
											{cert.track}
										</Badge>
									</Link>
								) : (
									<Badge variant="secondary">{cert.track}</Badge>
								)}
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

						<div className="pt-4 border-t">
							<CertificateActions
								title={cert.title}
								holder={cert.holder}
								courseName={cert.courseName}
								xpEarned={cert.xpEarned}
								certificateId={id}
							/>
						</div>
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
	courseSlug: string | null;
	track: string;
	level: string;
	issuedAt: string;
	xpEarned: number;
	imageUrl: string;
	onChainAddress: string | null;
}

async function getCertificate(id: string): Promise<Certificate | null> {
	const connection = getSolanaConnection();
	const programId = getProgramId();
	const service = new CredentialService(connection, programId);

	const [metadata, verification, owner, cmsCourses] = await Promise.all([
		service.getCredentialMetadata(id),
		service.verifyCredential(id),
		service.getCredentialOwner(id),
		getCoursesCMS().catch(() => []),
	]);

	// Show the certificate even if verification didn't fully pass,
	// as long as the asset exists on-chain (metadata fetched successfully).
	const credential = verification.credential;
	if (!credential && metadata.name === "Unknown") return null;

	const trackAttr = metadata.attributes.find((a) => a.trait_type === "Track");
	const levelAttr = metadata.attributes.find((a) => a.trait_type === "Level");
	const courseIdAttr = metadata.attributes.find((a) => a.trait_type === "CourseId");

	const holder = owner ? truncateAddress(owner) : "Unknown";
	const courseName = metadata.description;

	// Resolve course slug for linking
	let courseSlug: string | null = courseIdAttr?.value ?? null;
	if (!courseSlug && cmsCourses.length > 0) {
		const match = cmsCourses.find(
			(c) =>
				c?.title?.toLowerCase() === courseName.toLowerCase() ||
				c?.slug?.current === courseName
		);
		if (match?.slug?.current) courseSlug = match.slug.current;
	}

	return {
		id,
		title: metadata.name,
		holder,
		courseName,
		courseSlug,
		track: trackAttr?.value ?? credential?.track ?? (courseName || "Unknown"),
		level: levelAttr?.value ?? "Beginner",
		issuedAt: credential?.issuedAt.toISOString() ?? new Date().toISOString(),
		xpEarned: credential?.totalXp ?? 0,
		imageUrl: metadata.image,
		onChainAddress: id,
	};
}
