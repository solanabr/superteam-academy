import { Award, Download, Share2, ExternalLink } from "lucide-react";

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
	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Award className="h-5 w-5" />
					Certificate of Completion
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="text-center space-y-4">
					<div className="relative mx-auto w-48 h-32 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg border-2 border-dashed border-primary/30 flex items-center justify-center">
						<div className="text-center space-y-2">
							<Award className="h-12 w-12 text-primary mx-auto" />
							<div className="text-xs text-muted-foreground">Certificate Preview</div>
						</div>
					</div>

					<div>
						<h3 className="font-semibold text-lg">{certificate.title}</h3>
						<p className="text-muted-foreground">Issued by {certificate.issuer}</p>
					</div>

					<div className="flex items-center justify-center gap-2">
						<Badge variant="secondary">{certificate.type}</Badge>
						{certificate.verifiable && (
							<Badge variant="outline" className="gap-1">
								<ExternalLink className="h-3 w-3" />
								Verifiable
							</Badge>
						)}
					</div>
				</div>

				<div className="space-y-3">
					<div className="text-sm space-y-2">
						<div className="flex items-center justify-between">
							<span className="text-muted-foreground">Certificate Type:</span>
							<span className="font-medium capitalize">{certificate.type}</span>
						</div>
						<div className="flex items-center justify-between">
							<span className="text-muted-foreground">Issuer:</span>
							<span className="font-medium">{certificate.issuer}</span>
						</div>
						<div className="flex items-center justify-between">
							<span className="text-muted-foreground">Blockchain:</span>
							<span className="font-medium">Solana</span>
						</div>
						{certificate.verifiable && (
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground">Verification:</span>
								<span className="font-medium text-green-600">On-chain</span>
							</div>
						)}
					</div>

					<div className="pt-4 border-t space-y-3">
						<h4 className="font-medium">What you'll get:</h4>
						<ul className="text-sm text-muted-foreground space-y-1">
							<li>• Digital certificate with unique verification ID</li>
							<li>• Shareable certificate link for your portfolio</li>
							<li>• On-chain verification using Solana blockchain</li>
							<li>• Recognition of your achievement in the Web3 ecosystem</li>
							<li>• Automatic inclusion in your learner profile</li>
						</ul>
					</div>

					<div className="flex gap-2">
						<Button className="flex-1 gap-2">
							<Download className="h-4 w-4" />
							Download Certificate
						</Button>
						<Button variant="outline" className="gap-2">
							<Share2 className="h-4 w-4" />
							Share
						</Button>
					</div>

					{certificate.verifiable && (
						<div className="p-3 bg-muted/50 rounded-lg">
							<div className="flex items-start gap-3">
								<ExternalLink className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
								<div className="text-sm">
									<div className="font-medium">Verifiable Credential</div>
									<p className="text-muted-foreground">
										This certificate is stored on the Solana blockchain and can
										be verified by anyone using the certificate ID.
									</p>
								</div>
							</div>
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
