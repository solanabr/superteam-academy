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
	{ value: "announcements", label: "Announcements" },
	{ value: "technicalQA", label: "Technical Q&A" },
	{ value: "projectShowcase", label: "Project Showcase" },
	{ value: "featureRequests", label: "Feature Requests" },
	{ value: "studyGroups", label: "Study Groups" },
	{ value: "offTopic", label: "Off Topic" },
];

export default function NewDiscussionPage() {
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
			// TODO: Implement Sanity mutation to create discussion
			// const formData = new FormData(e.currentTarget);
			// Extract: title, content, category, tags
			await new Promise((resolve) => setTimeout(resolve, 1000));

			toast({
				title: "Discussion created!",
				description: "Your discussion has been posted to the community.",
			});

			router.push("/community");
		} catch {
			toast({
				title: "Error",
				description: "Failed to create discussion. Please try again.",
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
					<Link href="/community">
						<ArrowLeft className="h-4 w-4" />
					</Link>
				</Button>
				<div>
					<h1 className="text-2xl font-bold">Start a Discussion</h1>
					<p className="text-sm text-muted-foreground">
						Ask questions, share ideas, or showcase your work
					</p>
				</div>
			</div>

			<form onSubmit={handleSubmit} className="space-y-6">
				<div className="rounded-2xl border border-border/60 bg-card p-6 space-y-5">
					<div className="space-y-2">
						<label htmlFor="title" className="text-sm font-medium">
							Title *
						</label>
						<Input
							id="title"
							name="title"
							placeholder="What's on your mind?"
							className="h-11"
							required
							maxLength={200}
						/>
					</div>

					<div className="space-y-2">
						<label htmlFor="category" className="text-sm font-medium">
							Category *
						</label>
						<Select name="category" defaultValue="technicalQA" required>
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
						<label htmlFor="content" className="text-sm font-medium">
							Details *
						</label>
						<Textarea
							id="content"
							name="content"
							placeholder="Provide more context, code snippets, or background information..."
							className="min-h-50 resize-y"
							required
						/>
						<p className="text-xs text-muted-foreground">Markdown supported</p>
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
						<Link href="/community">Cancel</Link>
					</Button>
					<Button type="submit" disabled={isSubmitting}>
						{isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
						Post Discussion
					</Button>
				</div>
			</form>
		</div>
	);
}
