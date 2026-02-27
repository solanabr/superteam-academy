import { Award, ExternalLink, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";

interface CredentialItem {
	id: string;
	title: string;
	description: string;
	imageUrl: string;
	track: string;
	issuedAt: Date;
	totalXp: number;
	metadataUri: string;
	isActive: boolean;
}

interface CredentialListProps {
	credentials: CredentialItem[];
}

export function CredentialList({ credentials }: CredentialListProps) {
	const t = useTranslations("credentials");
	if (credentials.length === 0) return null;

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Award className="h-5 w-5 text-yellow-600" />
					{t("listTitle", { count: credentials.length })}
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="grid gap-4 sm:grid-cols-2">
					{credentials.map((cred) => (
						<Card key={cred.id} className="border-border/60">
							<CardContent className="pt-4 space-y-2">
								<div className="flex items-start justify-between">
									<h3 className="font-medium text-sm">{cred.title}</h3>
									<Badge
										variant={cred.isActive ? "default" : "secondary"}
										className="text-xs"
									>
										{cred.isActive ? t("verified") : t("unverified")}
									</Badge>
								</div>
								{cred.description && (
									<p className="text-xs text-muted-foreground">
										{cred.description}
									</p>
								)}
								<div className="flex items-center justify-between text-xs text-muted-foreground">
									{cred.totalXp > 0 && (
										<span className="flex items-center gap-1">
											<Star className="h-3 w-3 text-yellow-600" />
											{cred.totalXp} XP
										</span>
									)}
									<a
										href={`https://explorer.solana.com/address/${cred.id}?cluster=devnet`}
										target="_blank"
										rel="noopener noreferrer"
										className="flex items-center gap-1 hover:text-foreground transition-colors"
									>
										<ExternalLink className="h-3 w-3" />
										{t("explorer")}
									</a>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			</CardContent>
		</Card>
	);
}
