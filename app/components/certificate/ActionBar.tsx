"use client";

import {
	ArrowSquareOut,
	CaretDown,
	CaretUp,
	DownloadSimple,
	FileImage,
	FilePdf,
	LinkedinLogo,
	XLogo,
} from "@phosphor-icons/react";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface ActionBarProps {
	isOwner?: boolean;
	mintAddress?: string;
	courseName?: string;
}

export function ActionBar({
	isOwner = false,
	mintAddress,
	courseName = "Course",
}: ActionBarProps) {
	const [isGenerating, setIsGenerating] = useState<"png" | "pdf" | null>(null);
	const [showDropdown, setShowDropdown] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	// Close dropdown on outside click
	useEffect(() => {
		const handler = (e: MouseEvent) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(e.target as Node)
			) {
				setShowDropdown(false);
			}
		};
		document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, []);

	const handleDownload = async (format: "png" | "pdf") => {
		setShowDropdown(false);
		const element = document.getElementById("certificate-capture");
		if (!element) {
			toast.error("Certificate element not found");
			return;
		}

		try {
			setIsGenerating(format);
			toast.info(`Generating ${format.toUpperCase()}...`);

			// Clone the certificate into a fixed-width off-screen container
			// so the export always matches the desktop layout, regardless of viewport.
			const wrapper = document.createElement("div");
			wrapper.style.cssText =
				"position:fixed;left:-9999px;top:0;width:1200px;z-index:-1;";
			const clone = element.cloneNode(true) as HTMLElement;
			clone.removeAttribute("id");
			clone.style.width = "1200px";
			clone.style.minWidth = "1200px";
			wrapper.appendChild(clone);
			document.body.appendChild(wrapper);

			// Wait for the browser to reflow with the new width
			await new Promise((r) => setTimeout(r, 200));

			const dataUrl = await toPng(clone, {
				pixelRatio: 2,
				backgroundColor: "#ffffff",
			});

			// Clean up the off-screen clone
			document.body.removeChild(wrapper);

			const fileName = `certificate-${mintAddress?.slice(0, 8) || "export"}`;

			if (format === "png") {
				const link = document.createElement("a");
				link.download = `${fileName}.png`;
				link.href = dataUrl;
				link.click();
			} else {
				const img = new Image();
				img.src = dataUrl;
				await new Promise<void>((resolve) => {
					img.onload = () => resolve();
				});

				const pdf = new jsPDF({
					orientation: "landscape",
					unit: "px",
					format: [img.width, img.height],
				});
				pdf.addImage(dataUrl, "PNG", 0, 0, img.width, img.height);
				pdf.save(`${fileName}.pdf`);
			}
			toast.success(`Certificate downloaded as ${format.toUpperCase()}`);
		} catch (error) {
			console.error("Download failed:", error);
			toast.error("Failed to generate certificate");
		} finally {
			setIsGenerating(null);
		}
	};

	const handleShare = (platform: "x" | "linkedin") => {
		const url = window.location.href;
		const message = `I just earned my ${courseName} certificate from Superteam Academy! 🎓🚀\n\nCheck it out here: ${url}\n@SuperteamEarn`;

		if (platform === "x") {
			window.open(
				`https://x.com/intent/tweet?text=${encodeURIComponent(message)}`,
				"_blank",
			);
		} else {
			window.open(
				`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
				"_blank",
			);
		}
	};

	return (
		<div className="flex flex-wrap items-center gap-3 md:gap-4 w-full">
			{isOwner && (
				<div className="flex flex-wrap items-center gap-3 md:gap-4">
				{/* Unified Download Button with Dropdown */}
				<div className="relative" ref={dropdownRef}>
					<button
						onClick={() => setShowDropdown((p) => !p)}
						disabled={!!isGenerating}
						className="bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 border border-zinc-950 dark:border-white px-5 py-3 text-[11px] uppercase tracking-widest inline-flex items-center justify-center gap-2 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50 font-bold"
					>
						<DownloadSimple size={16} weight="bold" />
						<span>{isGenerating ? "Generating..." : "Download"}</span>
						{showDropdown ? (
							<CaretUp size={14} weight="bold" />
						) : (
							<CaretDown size={14} weight="bold" />
						)}
					</button>

					{showDropdown && (
						<div className="absolute bottom-full left-0 mb-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-xl z-50 min-w-[160px]">
							<button
								onClick={() => handleDownload("png")}
								className="w-full px-4 py-3 text-[11px] uppercase tracking-widest inline-flex items-center gap-3 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors text-zinc-900 dark:text-zinc-100 font-medium"
							>
								<FileImage size={16} weight="bold" />
								<span>As PNG</span>
							</button>
							<div className="h-px bg-zinc-100 dark:bg-zinc-800" />
							<button
								onClick={() => handleDownload("pdf")}
								className="w-full px-4 py-3 text-[11px] uppercase tracking-widest inline-flex items-center gap-3 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors text-zinc-900 dark:text-zinc-100 font-medium"
							>
								<FilePdf size={16} weight="bold" />
								<span>As PDF</span>
							</button>
						</div>
					)}
				</div>

				<div className="w-px h-6 bg-border/50 mx-1 hidden md:block" />

				<div className="flex flex-wrap items-center gap-2">
					<button
						onClick={() => handleShare("x")}
						className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 px-4 py-3 text-[11px] uppercase tracking-widest inline-flex items-center justify-center gap-2 hover:bg-zinc-950 dark:hover:bg-white hover:text-white dark:hover:text-zinc-950 transition-all font-bold"
						title="Share on X"
						aria-label="Share on X"
					>
						<XLogo size={16} weight="bold" />
						<span className="hidden sm:inline">Share on X</span>
					</button>
					<button
						onClick={() => handleShare("linkedin")}
						className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 px-4 py-3 text-[11px] uppercase tracking-widest inline-flex items-center justify-center gap-2 hover:bg-[#0077B5] hover:text-white hover:border-[#0077B5] transition-all font-bold"
						title="Share on LinkedIn"
						aria-label="Share on LinkedIn"
					>
						<LinkedinLogo size={16} weight="fill" />
						<span className="hidden sm:inline">LinkedIn</span>
					</button>
				</div>
			</div>
			)}
			<a
				href={`https://solscan.io/token/${mintAddress}?cluster=devnet`}
				target="_blank"
				rel="noopener noreferrer"
				className="bg-white dark:bg-zinc-950 border border-zinc-950 dark:border-zinc-800 text-zinc-950 dark:text-white px-5 py-3 text-[11px] uppercase tracking-widest inline-flex items-center justify-center gap-2 md:ml-auto hover:bg-zinc-950 hover:text-white transition-all font-black text-center"
			>
				<ArrowSquareOut size={16} weight="bold" />
				<span>Solana Explorer</span>
			</a>
		</div>
	);
}
