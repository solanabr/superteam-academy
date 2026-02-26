"use client";

import { Award, Download, Share2, ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface CourseCertificateProps {
	certificate: {
		title: string;
		issuer: string;
		type: string;
		verifiable: boolean;
	};
}

export function CourseCertificate({ certificate }: CourseCertificateProps) {
	const t = useTranslations("courses");

	const handleDownloadCertificate = async () => {
		const content = [
			`Certificate: ${certificate.title}`,
			`Issuer: ${certificate.issuer}`,
			`Type: ${certificate.type}`,
			"Blockchain: Solana",
		].join("\n");

		const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = `${certificate.title.replace(/\s+/g, "-").toLowerCase()}-certificate.txt`;
		link.click();
		URL.revokeObjectURL(url);
	};

	const handleShareCertificate = async () => {
		try {
			if (navigator.share) {
				await navigator.share({
					title: certificate.title,
					text: certificate.issuer,
					url: window.location.href,
				});
			} else {
				await navigator.clipboard.writeText(window.location.href);
			}
		} catch (error) {
			console.error("Error sharing certificate:", error);
		}
	};

	const handleVerifyCertificate = () => {
		if (certificate.verifiable) {
			window.open("/certificates", "_blank");
		}
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Award className="h-5 w-5" />
					{t("certificate.title")}
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="text-center space-y-4">
					<div className="relative mx-auto w-48 h-32 bg-linear-to-br from-primary/20 to-secondary/20 rounded-lg border-2 border-dashed border-primary/30 flex items-center justify-center">
						<div className="text-center space-y-2">
							<Award className="h-12 w-12 text-primary mx-auto" />
							<div className="text-xs text-muted-foreground">
								{t("certificate.preview")}
							</div>
						</div>
					</div>

					<div>
						<h3 className="font-semibold text-lg">{certificate.title}</h3>
						<p className="text-muted-foreground">
							{t("certificate.issuedBy", { issuer: certificate.issuer })}
						</p>
					</div>

					<div className="flex items-center justify-center gap-2">
						<Badge variant="secondary">{certificate.type}</Badge>
						{certificate.verifiable && (
							<Badge
								variant="outline"
								className="gap-1 cursor-pointer hover:bg-primary/10"
								onClick={handleVerifyCertificate}
							>
								<ExternalLink className="h-3 w-3" />
								{t("certificate.verifiable")}
							</Badge>
						)}
					</div>
				</div>

				<div className="space-y-3">
					<div className="text-sm space-y-2">
						<div className="flex items-center justify-between">
							<span className="text-muted-foreground">
								{t("certificate.certificateType")}
							</span>
							<span className="font-medium capitalize">{certificate.type}</span>
						</div>
						<div className="flex items-center justify-between">
							<span className="text-muted-foreground">{t("certificate.issuer")}</span>
							<span className="font-medium">{certificate.issuer}</span>
						</div>
						<div className="flex items-center justify-between">
							<span className="text-muted-foreground">
								{t("certificate.blockchain")}
							</span>
							<span className="font-medium">Solana</span>
						</div>
						{certificate.verifiable && (
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground">
									{t("certificate.verification")}
								</span>
								<span className="font-medium text-green-600">
									{t("certificate.onChain")}
								</span>
							</div>
						)}
					</div>

					<div className="pt-4 border-t space-y-3">
						<h4 className="font-medium">{t("certificate.whatYouGet")}</h4>
						<ul className="text-sm text-muted-foreground space-y-1">
							<li>• {t("certificate.benefit1")}</li>
							<li>• {t("certificate.benefit2")}</li>
							<li>• {t("certificate.benefit3")}</li>
							<li>• {t("certificate.benefit4")}</li>
							<li>• {t("certificate.benefit5")}</li>
						</ul>
					</div>

					<div className="flex gap-2">
						<Button className="flex-1 gap-2" onClick={handleDownloadCertificate}>
							<Download className="h-4 w-4" />
							{t("certificate.download")}
						</Button>
						<Button
							variant="outline"
							className="gap-2"
							onClick={handleShareCertificate}
						>
							<Share2 className="h-4 w-4" />
							{t("certificate.share")}
						</Button>
					</div>

					{certificate.verifiable && (
						<button
							type="button"
							className="p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted/70 transition-colors text-left w-full border-none"
							onClick={handleVerifyCertificate}
						>
							<div className="flex items-start gap-3">
								<ExternalLink className="h-4 w-4 text-primary shrink-0 mt-0.5" />
								<div className="text-sm">
									<div className="font-medium">
										{t("certificate.verifiableCredential")}
									</div>
									<p className="text-muted-foreground">
										{t("certificate.verifiableDescription")}
									</p>
								</div>
							</div>
						</button>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
