import type { Metadata } from "next";
import Link from "next/link";
import { Award, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTranslations } from "next-intl/server";
import { getSolanaConnection, getProgramId } from "@/lib/academy";
import { getLinkedWallet } from "@/lib/auth";
import { CredentialService } from "@/services/credential-service";
import { PublicKey } from "@solana/web3.js";

export const metadata: Metadata = {
	title: "My Certificates | Superteam Academy",
	description: "View your earned on-chain credentials and course certificates.",
};

export default async function CertificatesPage() {
	const t = await getTranslations("certificates");
	const wallet = await getLinkedWallet();

	if (!wallet) {
		return (
			<div className="min-h-screen py-12">
				<div className="max-w-4xl mx-auto px-4 text-center space-y-4">
					<Award className="h-16 w-16 text-muted-foreground mx-auto" />
					<h1 className="text-2xl font-bold">{t("title")}</h1>
					<p className="text-muted-foreground">{t("connectWallet")}</p>
				</div>
			</div>
		);
	}

	const connection = getSolanaConnection();
	const programId = getProgramId();
	const service = new CredentialService(connection, programId);
	const credentials = await service.getCredentialsByOwner(new PublicKey(wallet));

	if (credentials.length === 0) {
		return (
			<div className="min-h-screen py-12">
				<div className="max-w-4xl mx-auto px-4 text-center space-y-4">
					<Award className="h-16 w-16 text-muted-foreground mx-auto" />
					<h1 className="text-2xl font-bold">{t("title")}</h1>
					<p className="text-muted-foreground">{t("noCertificates")}</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen py-12">
			<div className="max-w-4xl mx-auto px-4 space-y-8">
				<div className="text-center space-y-2">
					<h1 className="text-2xl font-bold">{t("title")}</h1>
					<p className="text-muted-foreground">
						{credentials.length} {t("certificatesEarned")}
					</p>
				</div>

				<div className="grid gap-4 sm:grid-cols-2">
					{credentials.map((cred) => (
						<Link key={cred.id} href={`/certificates/${cred.id}`}>
							<Card className="hover:border-primary/50 transition-colors h-full">
								<CardHeader className="flex flex-row items-center gap-3 pb-2">
									<div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
										<Award className="h-5 w-5 text-primary" />
									</div>
									<CardTitle className="text-base leading-tight">
										{cred.track}
									</CardTitle>
								</CardHeader>
								<CardContent className="space-y-3">
									<div className="flex items-center gap-2 flex-wrap">
										<Badge variant="secondary">
											{cred.coursesCompleted}{" "}
											{cred.coursesCompleted === 1 ? "course" : "courses"}
										</Badge>
										<Badge variant="outline">
											{cred.totalXp.toLocaleString()} XP
										</Badge>
									</div>
									<div className="flex items-center justify-between text-sm text-muted-foreground">
										<span>{cred.issuedAt.toLocaleDateString()}</span>
										<ExternalLink className="h-3 w-3" />
									</div>
								</CardContent>
							</Card>
						</Link>
					))}
				</div>
			</div>
		</div>
	);
}
