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

		// Background gradient
		const grad = ctx.createLinearGradient(0, 0, 1200, 630);
		grad.addColorStop(0, "#041a10");
		grad.addColorStop(0.5, "#0a2a1b");
		grad.addColorStop(1, "#0d3520");
		ctx.fillStyle = grad;
		ctx.fillRect(0, 0, 1200, 630);

		// Subtle diagonal pattern
		ctx.strokeStyle = "rgba(0, 180, 100, 0.04)";
		ctx.lineWidth = 1;
		for (let i = -630; i < 1200; i += 40) {
			ctx.beginPath();
			ctx.moveTo(i, 0);
			ctx.lineTo(i + 630, 630);
			ctx.stroke();
		}

		// Outer border
		ctx.strokeStyle = "#00b464";
		ctx.lineWidth = 3;
		ctx.strokeRect(30, 30, 1140, 570);

		// Inner border
		ctx.strokeStyle = "rgba(0, 180, 100, 0.2)";
		ctx.lineWidth = 1;
		ctx.strokeRect(38, 38, 1124, 554);

		// Corner accents
		const cornerSize = 20;
		ctx.strokeStyle = "#00b464";
		ctx.lineWidth = 2;
		for (const [cx, cy, dx, dy] of [
			[30, 30, 1, 1],
			[1170, 30, -1, 1],
			[30, 600, 1, -1],
			[1170, 600, -1, -1],
		] as [number, number, number, number][]) {
			ctx.beginPath();
			ctx.moveTo(cx + cornerSize * dx, cy);
			ctx.lineTo(cx, cy);
			ctx.lineTo(cx, cy + cornerSize * dy);
			ctx.stroke();
		}

		// Top brand bar
		ctx.fillStyle = "rgba(0, 180, 100, 0.08)";
		ctx.fillRect(30, 30, 1140, 60);

		// Brand name
		ctx.fillStyle = "#00b464";
		ctx.font = "bold 14px sans-serif";
		ctx.textAlign = "left";
		ctx.letterSpacing = "3px";
		ctx.fillText("SUPERTEAM ACADEMY", 60, 67);
		ctx.letterSpacing = "0px";

		// Brand accent — right side
		ctx.textAlign = "right";
		ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
		ctx.font = "12px sans-serif";
		ctx.fillText("Verified on Solana", 1140, 67);

		// Certificate of Completion label
		ctx.textAlign = "center";
		ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
		ctx.font = "12px sans-serif";
		ctx.letterSpacing = "4px";
		ctx.fillText("CERTIFICATE OF COMPLETION", 600, 130);
		ctx.letterSpacing = "0px";

		// Decorative line under label
		const lineGrad = ctx.createLinearGradient(400, 0, 800, 0);
		lineGrad.addColorStop(0, "rgba(0, 180, 100, 0)");
		lineGrad.addColorStop(0.5, "rgba(0, 180, 100, 0.6)");
		lineGrad.addColorStop(1, "rgba(0, 180, 100, 0)");
		ctx.strokeStyle = lineGrad;
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.moveTo(400, 142);
		ctx.lineTo(800, 142);
		ctx.stroke();

		// Certificate title
		ctx.fillStyle = "#ffffff";
		ctx.font = "bold 32px sans-serif";
		const titleLines = wrapText(ctx, title, 900);
		let y = 190;
		for (const line of titleLines) {
			ctx.fillText(line, 600, y);
			y += 40;
		}

		// "Awarded to" label
		ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
		ctx.font = "13px sans-serif";
		ctx.fillText("Awarded to", 600, y + 20);

		// Holder name
		ctx.fillStyle = "#ffffff";
		ctx.font = "bold 26px sans-serif";
		ctx.fillText(holder || "Learner", 600, y + 55);

		// Course name — prominent
		ctx.fillStyle = "#00b464";
		ctx.font = "bold 20px sans-serif";
		ctx.fillText(courseName, 600, y + 100);

		// XP badge
		const xpText = `${xpEarned.toLocaleString()} XP`;
		ctx.font = "bold 16px sans-serif";
		const xpWidth = ctx.measureText(xpText).width;
		const badgeX = 600 - (xpWidth + 20) / 2;
		const badgeY = y + 120;
		ctx.fillStyle = "rgba(0, 180, 100, 0.15)";
		ctx.beginPath();
		ctx.roundRect(badgeX, badgeY, xpWidth + 20, 28, 14);
		ctx.fill();
		ctx.fillStyle = "#00b464";
		ctx.font = "bold 14px sans-serif";
		ctx.fillText(xpText, 600, badgeY + 19);

		// Bottom bar
		ctx.fillStyle = "rgba(0, 180, 100, 0.08)";
		ctx.fillRect(30, 570, 1140, 30);

		ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
		ctx.font = "11px sans-serif";
		ctx.textAlign = "center";
		ctx.fillText("superteam.com.br  •  Powered by Solana", 600, 590);

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
