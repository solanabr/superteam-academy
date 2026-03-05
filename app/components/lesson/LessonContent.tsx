/**
 * @fileoverview LessonContent component for rendering lesson instructions and hints.
 * Uses react-markdown for rich text and prism for code highlighting.
 */

"use client";

import { CaretDownIcon } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import ReactMarkdown, { Components } from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

/**
 * Props for the LessonContent component.
 */
interface LessonContentProps {
	reference: string;
	title: string;
	content: string;
	hints?: string[];
	variant?: "default" | "sidebar";
}

/**
 * Custom markdown component overrides.
 */
export const markdownComponents: Components = {
	h1: ({ children }) => (
		<h2 className="font-display text-[32px] font-bold mb-4 mt-6">{children}</h2>
	),
	h2: ({ children }) => (
		<h3 className="font-bold text-[18px] uppercase mb-3 mt-6 border-b border-ink-primary pb-1">
			{children}
		</h3>
	),
	h3: ({ children }) => (
		<h4 className="font-bold text-[14px] uppercase mb-2 mt-4">{children}</h4>
	),
	p: ({ children }) => (
		<p className="mb-4 text-[14px] leading-relaxed text-ink-primary">
			{children}
		</p>
	),
	code: ({ className, children, ...props }) => {
		const match = /language-(\w+)/.exec(className || "");

		return match ? (
			<SyntaxHighlighter
				style={vscDarkPlus as { [key: string]: React.CSSProperties }}
				language={match[1]}
				PreTag="div"
				className="rounded-none my-4"
			>
				{String(children).replace(/\n$/, "")}
			</SyntaxHighlighter>
		) : (
			<code
				className="bg-ink-secondary/10 px-1 py-0.5 text-[12px] font-mono"
				{...props}
			>
				{children}
			</code>
		);
	},
	ul: ({ children }) => (
		<ul className="list-disc list-inside mb-4 space-y-1">{children}</ul>
	),
	ol: ({ children }) => (
		<ol className="list-decimal list-inside mb-4 space-y-1">{children}</ol>
	),
	li: ({ children }) => (
		<li className="text-[14px] text-ink-primary">{children}</li>
	),
};

/**
 * Renders lesson content with support for markdown, syntax highlighting,
 * and an expandable hints section.
 */
export function LessonContent({
	reference,
	title,
	content,
	hints,
	variant = "default",
}: LessonContentProps) {
	const t = useTranslations("Lesson");
	const [showHints, setShowHints] = useState(false);

	const isSidebar = variant === "sidebar";

	return (
		<div
			className={`${isSidebar ? "px-0 pt-0" : "px-4 lg:px-12 pt-12"} text-ink-primary`}
		>
			{/* Header */}
			{!isSidebar && (
				<div className="mb-2 text-[10px] uppercase tracking-widest text-ink-secondary">
					{t("reference")}: {reference}
				</div>
			)}
			<h1
				className={`font-display font-bold ${
					isSidebar
						? "text-[20px] leading-tight mb-4 mt-2"
						: "text-[48px] leading-[0.9] -tracking-[0.02em] mb-6"
				}`}
			>
				{title}
			</h1>

			{/* Markdown Content */}
			<div className="prose prose-sm max-w-none">
				<ReactMarkdown components={markdownComponents}>{content}</ReactMarkdown>
			</div>

			{/* Hints Section - Only show if not in sidebar or explicitly needed */}
			{!isSidebar && hints && hints.length > 0 && (
				<div className="mt-10 border border-dashed border-ink-secondary/50 p-4">
					<button
						onClick={() => setShowHints(!showHints)}
						className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest cursor-pointer w-full"
					>
						<CaretDownIcon
							size={12}
							className={`transition-transform ${showHints ? "rotate-0" : "-rotate-90"}`}
						/>
						{t("needHint")}
					</button>
					{showHints && (
						<div className="mt-3 space-y-2">
							{hints.map((hint, index) => (
								<div
									key={index}
									className="flex flex-row items-baseline gap-2 text-[12px] text-ink-secondary leading-relaxed"
								>
									<span className="font-mono min-w-[12px]">{index + 1}.</span>
									<div className="flex-1">
										<ReactMarkdown
											components={{
												p: ({ children }) => (
													<span className="m-0">{children}</span>
												),
												code: ({ children }) => (
													<span className="bg-ink-secondary/15 px-1 py-0.5 rounded text-[11px] font-mono text-ink-primary mx-0.5">
														{children}
													</span>
												),
											}}
										>
											{hint}
										</ReactMarkdown>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			)}
		</div>
	);
}
