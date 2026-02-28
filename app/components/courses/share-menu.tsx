"use client";

import { Share2, Copy, Check, Mail } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ShareMenuProps {
	title: string;
	description: string;
	size?: "default" | "lg" | "sm";
}

function XIcon({ className }: { className?: string }) {
	return (
		<svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
			<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
		</svg>
	);
}

export function ShareMenu({ title, description, size = "lg" }: ShareMenuProps) {
	const t = useTranslations("courses");
	const { copied, copy } = useCopyToClipboard();

	const url = typeof window !== "undefined" ? window.location.href : "";

	const shareOnX = () => {
		const text = encodeURIComponent(`${title}\n${description}`);
		const shareUrl = encodeURIComponent(url);
		window.open(
			`https://x.com/intent/tweet?text=${text}&url=${shareUrl}`,
			"_blank",
			"noopener,noreferrer,width=550,height=420"
		);
	};

	const shareOnLinkedIn = () => {
		const shareUrl = encodeURIComponent(url);
		window.open(
			`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`,
			"_blank",
			"noopener,noreferrer,width=550,height=420"
		);
	};

	const shareViaEmail = () => {
		const subject = encodeURIComponent(title);
		const body = encodeURIComponent(`${description}\n\n${url}`);
		window.location.href = `mailto:?subject=${subject}&body=${body}`;
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="outline" size={size} className="gap-2">
					<Share2 className="h-4 w-4" />
					{t("hero.share")}
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" className="w-48">
				<DropdownMenuItem onClick={() => copy(url)} className="gap-2">
					{copied ? (
						<Check className="h-4 w-4 text-green-500" />
					) : (
						<Copy className="h-4 w-4" />
					)}
					{copied ? t("share.copied") : t("share.copyLink")}
				</DropdownMenuItem>
				<DropdownMenuItem onClick={shareOnX} className="gap-2">
					<XIcon className="h-4 w-4" />
					{t("share.x")}
				</DropdownMenuItem>
				<DropdownMenuItem onClick={shareOnLinkedIn} className="gap-2">
					<svg
						viewBox="0 0 24 24"
						className="h-4 w-4"
						fill="currentColor"
						aria-hidden="true"
					>
						<path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
					</svg>
					{t("share.linkedin")}
				</DropdownMenuItem>
				<DropdownMenuItem onClick={shareViaEmail} className="gap-2">
					<Mail className="h-4 w-4" />
					{t("share.email")}
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
