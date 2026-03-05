"use client";

import {
	ArrowLeftIcon,
	CodeIcon,
	PaperPlaneRightIcon,
	WarningIcon,
} from "@phosphor-icons/react";
import posthog from "posthog-js";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { CommunitySidebar } from "@/components/community/CommunitySidebar";
import { NavRail } from "@/components/layout/NavRail";
import { TopBar } from "@/components/layout/TopBar";
import { DotGrid } from "@/components/shared/DotGrid";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Link, useRouter } from "@/i18n/routing";
import { createThread } from "@/lib/actions/community";

export function NewTopicView() {
	const [title, setTitle] = useState("");
	const [category, setCategory] = useState("architecture");
	const [body, setBody] = useState("");
	const [isPending, startTransition] = useTransition();
	const router = useRouter();

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!title.trim() || !body.trim()) {
			toast.error("Title and body are required");
			return;
		}

		startTransition(async () => {
			try {
				const newThread = await createThread({
					title,
					category,
					content: body,
				});
				posthog.capture("community_post_submitted", {
					category,
					title_length: title.length,
					body_length: body.length,
				});
				toast.success("Transmission deployed successfully");
				router.push(`/community/${newThread.slug}`);
			} catch (error) {
				console.error(error);
				toast.error("Failed to deploy transmission");
			}
		});
	};

	return (
		<div className="min-h-screen bg-bg-base relative">
			<DotGrid />

			<div className="grid grid-cols-1 lg:grid-cols-[60px_1fr_350px] lg:grid-rows-[48px_1fr] min-h-screen lg:h-screen lg:overflow-hidden max-w-full relative z-10">
				<div className="col-span-1 lg:col-span-3">
					<TopBar />
				</div>

				<NavRail />

				<main className="p-4 lg:p-8 flex flex-col gap-10 overflow-visible lg:overflow-y-auto w-full">
					{/* Header */}
					<div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-ink-secondary/20 dark:border-border pb-6">
						<div>
							<Link
								href="/community"
								className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-ink-secondary hover:text-ink-primary transition-colors mb-4"
							>
								<ArrowLeftIcon /> ABORT TRANSMISSION
							</Link>
							<h1 className="font-display text-4xl lg:text-5xl leading-none -tracking-wider text-ink-primary">
								NEW TRANSMISSION
							</h1>
							<p className="text-ink-secondary mt-2 max-w-xl text-sm font-mono">
								Initiate a new global protocol. All active operatives will
								receive broadcast.
							</p>
						</div>
					</div>

					<div className="max-w-4xl mx-auto w-full flex flex-col gap-6">
						{/* Form Section */}
						<div className="p-2 md:p-4">
							<form className="space-y-10" onSubmit={handleSubmit}>
								{/* Title Input */}
								<div>
									<label className="block text-[10px] uppercase tracking-widest font-bold text-ink-primary mb-3">
										Subject Header
									</label>
									<div className="relative">
										<span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-secondary font-mono">
											$&gt;
										</span>
										<input
											type="text"
											placeholder="e.g. Protocol analysis requested..."
											value={title}
											onChange={(e) => setTitle(e.target.value)}
											className="w-full bg-transparent border border-ink-secondary/30 p-3 pl-10 font-mono text-sm text-ink-primary focus:border-ink-primary outline-none transition-colors placeholder:text-ink-secondary/50"
										/>
									</div>
								</div>

								{/* Category Select */}
								<div>
									<label className="block text-[10px] uppercase tracking-widest font-bold text-ink-primary mb-3">
										Transmission Category
									</label>
									<Select value={category} onValueChange={setCategory}>
										<SelectTrigger className="w-full bg-transparent border border-ink-secondary/30 p-3 h-auto font-mono text-sm text-ink-primary rounded-none focus:ring-0 focus:border-ink-primary cursor-pointer uppercase hover:bg-transparent">
											<SelectValue placeholder="Select Category" />
										</SelectTrigger>
										<SelectContent className="bg-bg-base border-ink-secondary/30 rounded-none font-mono">
											<SelectItem value="architecture">ARCHITECTURE</SelectItem>
											<SelectItem value="discussion">DISCUSSION</SelectItem>
											<SelectItem value="networking">NETWORKING</SelectItem>
											<SelectItem value="support">SYSTEM_SUPPORT</SelectItem>
										</SelectContent>
									</Select>
								</div>

								{/* Markdown Body */}
								<div>
									<div className="flex justify-between items-end mb-3">
										<label className="block text-[10px] uppercase tracking-widest font-bold text-ink-primary">
											Payload Buffer
										</label>
										<span className="text-[10px] uppercase tracking-widest text-ink-secondary flex items-center gap-1.5">
											<CodeIcon weight="bold" /> MARKDOWN SUPPORTED
										</span>
									</div>
									<textarea
										rows={10}
										placeholder="// Enter execution sequences or raw thoughts here..."
										value={body}
										onChange={(e) => setBody(e.target.value)}
										className="w-full bg-transparent border border-ink-secondary/30 p-3 font-mono text-sm text-ink-primary focus:border-ink-primary outline-none transition-colors placeholder:text-ink-secondary/50 resize-y"
									/>
								</div>

								{/* Actions */}
								<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-6 mt-8 gap-6">
									<div className="flex items-center gap-2 text-ink-secondary text-[10px] uppercase tracking-widest font-bold">
										<WarningIcon weight="fill" className="text-[#FFB020]" />
										<span className="text-[#FFB020]">Public Broadcast</span>
									</div>

									<div className="flex items-center gap-4 w-full sm:w-auto">
										<Button
											variant="ghost"
											className="rounded-none text-ink-secondary hover:text-ink-primary hover:bg-transparent uppercase text-xs tracking-widest font-bold px-6 border border-transparent hover:border-ink-secondary/50 transition-colors"
											asChild
										>
											<Link href="/community">Cancel</Link>
										</Button>
										<Button
											type="submit"
											disabled={isPending}
											className="bg-bg-base text-ink-primary border border-ink-secondary/50 hover:bg-ink-primary hover:text-bg-base rounded-none uppercase text-xs font-bold px-8 tracking-widest flex items-center gap-2 transition-colors"
										>
											<PaperPlaneRightIcon weight="fill" />
											{isPending ? "Deploying..." : "Deploy Post"}
										</Button>
									</div>
								</div>
							</form>
						</div>
					</div>
				</main>

				<CommunitySidebar />
			</div>
		</div>
	);
}
