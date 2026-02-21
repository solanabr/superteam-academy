"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const CATEGORIES = [
	{ value: "defi", label: "DeFi" },
	{ value: "nft", label: "NFT" },
	{ value: "tooling", label: "Tooling" },
	{ value: "gaming", label: "Gaming" },
	{ value: "social", label: "Social" },
	{ value: "infra", label: "Infrastructure" },
];

export default function NewProjectPage() {
	const router = useRouter();
	const { toast } = useToast();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [tags, setTags] = useState<string[]>([]);
	const [tagInput, setTagInput] = useState("");

	const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter" && tagInput.trim()) {
			e.preventDefault();
			if (!tags.includes(tagInput.trim()) && tags.length < 5) {
				setTags([...tags, tagInput.trim()]);
				setTagInput("");
			}
		}
	};

	const handleRemoveTag = (tagToRemove: string) => {
		setTags(tags.filter((tag) => tag !== tagToRemove));
	};

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setIsSubmitting(true);

		try {
			// TODO: Implement Sanity mutation to create project
			// const formData = new FormData(e.currentTarget);
			// Extract: title, description, category, githubUrl, liveUrl, xpReward, tags
			await new Promise((resolve) => setTimeout(resolve, 1000));

			toast({
				title: "Project submitted!",
				description: "Your project has been shared with the community.",
			});

			router.push("/community/projects");
		} catch {
			toast({
				title: "Error",
				description: "Failed to submit project. Please try again.",
				variant: "destructive",
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="max-w-3xl mx-auto space-y-6">
			<div className="flex items-center gap-3">
				<Button variant="ghost" size="sm" asChild>
					<Link href="/community/projects">
						<ArrowLeft className="h-4 w-4" />
					</Link>
				</Button>
				<div>
					<h1 className="text-2xl font-bold">Submit Project</h1>
					<p className="text-sm text-muted-foreground">
						Showcase what you've built with Solana
					</p>
				</div>
			</div>

			<form onSubmit={handleSubmit} className="space-y-6">
				<div className="rounded-2xl border border-border/60 bg-card p-6 space-y-5">
					<div className="space-y-2">
						<label htmlFor="title" className="text-sm font-medium">
							Project Name *
						</label>
						<Input
							id="title"
							name="title"
							placeholder="My Awesome Solana Project"
							className="h-11"
							required
							maxLength={100}
						/>
					</div>

					<div className="space-y-2">
						<label htmlFor="category" className="text-sm font-medium">
							Category *
						</label>
						<Select name="category" defaultValue="tooling" required>
							<SelectTrigger className="h-11">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{CATEGORIES.map((cat) => (
									<SelectItem key={cat.value} value={cat.value}>
										{cat.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<label htmlFor="description" className="text-sm font-medium">
							Description *
						</label>
						<Textarea
							id="description"
							name="description"
							placeholder="What does your project do? What problem does it solve? What makes it unique?"
							className="min-h-37.5 resize-y"
							required
						/>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<label htmlFor="githubUrl" className="text-sm font-medium">
								GitHub URL
							</label>
							<Input
								id="githubUrl"
								name="githubUrl"
								type="url"
								placeholder="https://github.com/..."
								className="h-11"
							/>
						</div>

						<div className="space-y-2">
							<label htmlFor="liveUrl" className="text-sm font-medium">
								Demo/Live URL
							</label>
							<Input
								id="liveUrl"
								name="liveUrl"
								type="url"
								placeholder="https://..."
								className="h-11"
							/>
						</div>
					</div>

					<div className="space-y-2">
						<label htmlFor="xpReward" className="text-sm font-medium">
							XP Reward (optional)
						</label>
						<Input
							id="xpReward"
							name="xpReward"
							type="number"
							placeholder="1000"
							className="h-11"
							min="0"
						/>
						<p className="text-xs text-muted-foreground">
							XP to award contributors for helping with this project
						</p>
					</div>

					<div className="space-y-2">
						<label htmlFor="tags" className="text-sm font-medium">
							Tags (optional)
						</label>
						<Input
							id="tags"
							value={tagInput}
							onChange={(e) => setTagInput(e.target.value)}
							onKeyDown={handleAddTag}
							placeholder="Press Enter to add tags (max 5)"
							disabled={tags.length >= 5}
						/>
						{tags.length > 0 && (
							<div className="flex flex-wrap gap-2 mt-2">
								{tags.map((tag) => (
									<Badge
										key={tag}
										variant="secondary"
										className="gap-1 cursor-pointer"
										onClick={() => handleRemoveTag(tag)}
									>
										{tag}
										<span className="text-muted-foreground">×</span>
									</Badge>
								))}
							</div>
						)}
					</div>
				</div>

				<div className="flex items-center justify-between">
					<Button type="button" variant="ghost" asChild>
						<Link href="/community/projects">Cancel</Link>
					</Button>
					<Button type="submit" disabled={isSubmitting}>
						{isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
						Submit Project
					</Button>
				</div>
			</form>
		</div>
	);
}
