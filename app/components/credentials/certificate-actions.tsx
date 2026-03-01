"use client";

import { Share2, Twitter, Link2, Download, Check } from "lucide-react";
import { useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";

interface CertificateActionsProps {
	title: string;
	holder: string;
	courseName: string;
	xpEarned: number;
	certificateId: string;
}

export function CertificateActions({
	title,
	holder,
	courseName,
	xpEarned,
	certificateId,
}: CertificateActionsProps) {
	const { copied, copy: copyLink } = useCopyToClipboard();
	const canvasRef = useRef<HTMLCanvasElement>(null);

	const pageUrl =
		typeof window !== "undefined"
			? window.location.href
			: `https://superteam.com.br/certificates/${certificateId}`;

	const tweetText = encodeURIComponent(
		`I just earned "${title}" on @SuperteamAcademy! 🎓\n\n` +
			`Course: ${courseName}\nXP: ${xpEarned.toLocaleString()}\n\n` +
			`Verify on-chain: ${pageUrl}`
	);
	const twitterUrl = `https://twitter.com/intent/tweet?text=${tweetText}`;

	const downloadCertificate = useCallback(() => {
		const canvas = canvasRef.current ?? document.createElement("canvas");
		canvas.width = 1200;
		canvas.height = 630;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const grad = ctx.createLinearGradient(0, 0, 1200, 630);
		grad.addColorStop(0, "#0a2a1b");
		grad.addColorStop(1, "#1a4a2e");
		ctx.fillStyle = grad;
		ctx.fillRect(0, 0, 1200, 630);

		ctx.strokeStyle = "#008c4c";
		ctx.lineWidth = 4;
		ctx.strokeRect(40, 40, 1120, 550);

		ctx.strokeStyle = "rgba(0, 140, 76, 0.3)";
		ctx.lineWidth = 1;
		ctx.strokeRect(50, 50, 1100, 530);

		ctx.fillStyle = "#ffffff";
		ctx.font = "bold 20px sans-serif";
		ctx.textAlign = "center";
		ctx.fillText("SUPERTEAM ACADEMY", 600, 100);

		ctx.fillStyle = "#008c4c";
		ctx.beginPath();
		ctx.arc(600, 170, 30, 0, Math.PI * 2);
		ctx.fill();
		ctx.fillStyle = "#ffffff";
		ctx.font = "bold 24px sans-serif";
		ctx.fillText("✓", 600, 178);

		ctx.fillStyle = "#f0f0f0";
		ctx.font = "bold 36px sans-serif";
		const titleLines = wrapText(ctx, title, 900);
		let y = 240;
		for (const line of titleLines) {
			ctx.fillText(line, 600, y);
			y += 44;
		}

		ctx.fillStyle = "#8fa89a";
		ctx.font = "16px sans-serif";
		ctx.fillText("Awarded to", 600, y + 20);

		ctx.fillStyle = "#ffffff";
		ctx.font = "bold 24px sans-serif";
		ctx.fillText(holder || "Learner", 600, y + 55);

		ctx.fillStyle = "#8fa89a";
		ctx.font = "16px sans-serif";
		ctx.fillText(`Course: ${courseName}`, 600, y + 90);

		ctx.fillStyle = "#008c4c";
		ctx.font = "bold 18px sans-serif";
		ctx.fillText(`${xpEarned.toLocaleString()} XP`, 600, y + 125);

		ctx.fillStyle = "#4a6a55";
		ctx.font = "12px sans-serif";
		ctx.fillText("Verified on Solana · superteam.com.br", 600, 560);

		const link = document.createElement("a");
		link.download = `superteam-certificate-${certificateId.slice(0, 8)}.png`;
		link.href = canvas.toDataURL("image/png");
		link.click();
	}, [title, holder, courseName, xpEarned, certificateId]);

	return (
		<div className="space-y-3">
			<p className="text-sm font-medium flex items-center gap-2">
				<Share2 className="h-4 w-4" />
				Share & Download
			</p>
			<div className="flex flex-wrap gap-2">
				<Button variant="outline" size="sm" className="gap-1.5" asChild>
					<a href={twitterUrl} target="_blank" rel="noopener noreferrer">
						<Twitter className="h-3.5 w-3.5" />
						Share on X
					</a>
				</Button>
				<Button
					variant="outline"
					size="sm"
					className="gap-1.5"
					onClick={() => copyLink(pageUrl)}
				>
					{copied ? <Check className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
					{copied ? "Copied!" : "Copy link"}
				</Button>
				<Button
					variant="outline"
					size="sm"
					className="gap-1.5"
					onClick={downloadCertificate}
				>
					<Download className="h-3.5 w-3.5" />
					Download
				</Button>
			</div>
			<canvas ref={canvasRef} className="hidden" />
		</div>
	);
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
	const words = text.split(" ");
	const lines: string[] = [];
	let currentLine = "";

	for (const word of words) {
		const test = currentLine ? `${currentLine} ${word}` : word;
		if (ctx.measureText(test).width > maxWidth) {
			if (currentLine) lines.push(currentLine);
			currentLine = word;
		} else {
			currentLine = test;
		}
	}
	if (currentLine) lines.push(currentLine);
	return lines;
}
