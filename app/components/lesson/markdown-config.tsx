"use client";

import type { Components } from "react-markdown";

/**
 * Shared markdown components for consistent high-fidelity rendering.
 * Extracted to a separate file to prevent circular dependencies in Turbopack.
 */
export const markdownComponents: Components = {
	h1: ({ children }) => (
		<h1 className="text-2xl lg:text-3xl font-display font-bold uppercase tracking-tight mb-6 text-ink-primary">
			{children}
		</h1>
	),
	h2: ({ children }) => (
		<h2 className="text-xl lg:text-2xl font-display font-bold uppercase tracking-tight mt-10 mb-4 text-ink-primary">
			{children}
		</h2>
	),
	h3: ({ children }) => (
		<h3 className="text-lg lg:text-xl font-display font-bold uppercase tracking-tight mt-8 mb-3 text-ink-primary">
			{children}
		</h3>
	),
	p: ({ children }) => (
		<p className="text-sm lg:text-base leading-relaxed text-ink-secondary mb-6 last:mb-0">
			{children}
		</p>
	),
	ul: ({ children }) => (
		<ul className="list-none space-y-3 mb-8 pl-0">{children}</ul>
	),
	ol: ({ children }) => (
		<ol className="list-none space-y-3 mb-8 pl-0 counter-reset-item">
			{children}
		</ol>
	),
	li: ({ children }) => (
		<li className="flex items-start gap-3 text-sm lg:text-base text-ink-secondary">
			<span className="shrink-0 w-1.5 h-1.5 rounded-full bg-ink-primary mt-2 opacity-30" />
			<div className="flex-1">{children}</div>
		</li>
	),
	code: ({ children, className }) => {
		const isInline = !className?.includes("language-");
		if (isInline) {
			return (
				<code className="bg-ink-secondary/15 px-1.5 py-0.5 rounded text-[0.9em] font-mono text-ink-primary border border-ink-secondary/10 mx-0.5">
					{children}
				</code>
			);
		}
		return (
			<div className="relative group my-8">
				<div className="absolute -inset-2 bg-gradient-to-r from-ink-primary/5 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" />
				<pre className="relative bg-[#1e1e1e] p-6 rounded-none border border-border overflow-x-auto custom-scrollbar shadow-2xl">
					<code className="font-mono text-[13px] leading-relaxed text-[#d4d4d4]">
						{children}
					</code>
				</pre>
			</div>
		);
	},
	strong: ({ children }) => (
		<strong className="font-bold text-ink-primary">{children}</strong>
	),
	blockquote: ({ children }) => (
		<blockquote className="border-l-4 border-ink-primary/20 pl-6 italic my-8 text-ink-secondary/80 bg-ink-primary/5 py-4 pr-4">
			{children}
		</blockquote>
	),
};
