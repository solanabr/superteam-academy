"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Link } from "@superteam-academy/i18n/navigation";
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
import { useTranslations } from "next-intl";

const CATEGORIES = [
	{ value: "defi" },
	{ value: "nft" },
	{ value: "tooling" },
	{ value: "gaming" },
	{ value: "social" },
	{ value: "infra" },
];

export default function NewProjectPage() {
	const t = useTranslations("community.createProject");
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
			const formData = new FormData(e.currentTarget);
			const title = formData.get("title") as string;
			const description = formData.get("description") as string;
			const category = formData.get("category") as string;
			const githubUrl = (formData.get("githubUrl") as string) || undefined;
			const liveUrl = (formData.get("liveUrl") as string) || undefined;
			const xpRewardRaw = formData.get("xpReward") as string;
			const xpReward = xpRewardRaw ? Number(xpRewardRaw) : undefined;

			const res = await fetch("/api/community/projects", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					title,
					description,
					category,
					githubUrl,
					liveUrl,
					xpReward,
					tags,
				}),
			});

			const data = await res.json();

			if (!res.ok) {
				throw new Error(data.error || t("errors.submitFailed"));
			}

			toast({
				title: t("toast.submittedTitle"),
				description: t("toast.submittedDescription"),
			});

			router.push(`/community/projects/${data.slug}`);
		} catch (err) {
			toast({
				title: t("toast.errorTitle"),
				description: err instanceof Error ? err.message : t("errors.submitFailedRetry"),
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
					<h1 className="text-2xl font-bold">{t("title")}</h1>
					<p className="text-sm text-muted-foreground">{t("description")}</p>
				</div>
			</div>

			<form onSubmit={handleSubmit} className="space-y-6">
				<div className="rounded-2xl border border-border/60 bg-card p-6 space-y-5">
					<div className="space-y-2">
						<label htmlFor="title" className="text-sm font-medium">
							{t("fields.projectName")}
						</label>
						<Input
							id="title"
							name="title"
							placeholder={t("placeholders.projectName")}
							className="h-11"
							required
							maxLength={100}
						/>
					</div>

					<div className="space-y-2">
						<label htmlFor="category" className="text-sm font-medium">
							{t("fields.category")}
						</label>
						<Select name="category" defaultValue="tooling" required>
							<SelectTrigger className="h-11">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{CATEGORIES.map((cat) => (
									<SelectItem key={cat.value} value={cat.value}>
										{t(`categories.${cat.value}`)}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<label htmlFor="description" className="text-sm font-medium">
							{t("fields.description")}
						</label>
						<Textarea
							id="description"
							name="description"
							placeholder={t("placeholders.description")}
							className="min-h-37.5 resize-y"
							required
						/>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<label htmlFor="githubUrl" className="text-sm font-medium">
								{t("fields.githubUrl")}
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
								{t("fields.liveUrl")}
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
							{t("fields.xpReward")}
						</label>
						<Input
							id="xpReward"
							name="xpReward"
							type="number"
							placeholder="1000"
							className="h-11"
							min="0"
						/>
						<p className="text-xs text-muted-foreground">{t("xpRewardHelp")}</p>
					</div>

					<div className="space-y-2">
						<label htmlFor="tags" className="text-sm font-medium">
							{t("fields.tags")}
						</label>
						<Input
							id="tags"
							value={tagInput}
							onChange={(e) => setTagInput(e.target.value)}
							onKeyDown={handleAddTag}
							placeholder={t("placeholders.tags")}
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
						<Link href="/community/projects">{t("actions.cancel")}</Link>
					</Button>
					<Button type="submit" disabled={isSubmitting}>
						{isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
						{t("actions.submit")}
					</Button>
				</div>
			</form>
		</div>
	);
}
