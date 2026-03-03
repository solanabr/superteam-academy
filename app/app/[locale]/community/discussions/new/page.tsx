"use client";

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
import { useTranslations } from "next-intl";
import { useTagInput } from "@/hooks/use-tag-input";
import { useFormSubmit } from "@/hooks/use-form-submit";

const CATEGORIES = [
	{ value: "announcements" },
	{ value: "technicalQA" },
	{ value: "projectShowcase" },
	{ value: "featureRequests" },
	{ value: "studyGroups" },
	{ value: "offTopic" },
];

export default function NewDiscussionPage() {
	const t = useTranslations("community.createDiscussion");
	const { tags, tagInput, setTagInput, removeTag, handleKeyDown } = useTagInput();
	const { isSubmitting, submit } = useFormSubmit({
		endpoint: "/api/community/discussions",
		successToast: {
			title: t("toast.createdTitle"),
			description: t("toast.createdDescription"),
		},
		errorToast: {
			title: t("toast.errorTitle"),
			fallbackDescription: t("errors.createFailedRetry"),
		},
		redirectTo: (data) => `/community/discussions/${data.slug}`,
	});

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);

		await submit({
			title: formData.get("title") as string,
			content: formData.get("content") as string,
			category: formData.get("category") as string,
			tags,
		});
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
					<h1 className="text-2xl font-bold">{t("title")}</h1>
					<p className="text-sm text-muted-foreground">{t("description")}</p>
				</div>
			</div>

			<form onSubmit={handleSubmit} className="space-y-6">
				<div className="rounded-2xl border border-border/60 bg-card p-6 space-y-5">
					<div className="space-y-2">
						<label htmlFor="title" className="text-sm font-medium">
							{t("fields.title")}
						</label>
						<Input
							id="title"
							name="title"
							placeholder={t("placeholders.title")}
							className="h-11"
							required
							maxLength={200}
						/>
					</div>

					<div className="space-y-2">
						<label htmlFor="category" className="text-sm font-medium">
							{t("fields.category")}
						</label>
						<Select name="category" defaultValue="technicalQA" required>
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
						<label htmlFor="content" className="text-sm font-medium">
							{t("fields.details")}
						</label>
						<Textarea
							id="content"
							name="content"
							placeholder={t("placeholders.details")}
							className="min-h-50 resize-y"
							required
						/>
						<p className="text-xs text-muted-foreground">{t("markdownSupported")}</p>
					</div>

					<div className="space-y-2">
						<label htmlFor="tags" className="text-sm font-medium">
							{t("fields.tags")}
						</label>
						<Input
							id="tags"
							value={tagInput}
							onChange={(e) => setTagInput(e.target.value)}
							onKeyDown={handleKeyDown}
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
										onClick={() => removeTag(tag)}
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
						<Link href="/community">{t("actions.cancel")}</Link>
					</Button>
					<Button type="submit" disabled={isSubmitting}>
						{isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
						{t("actions.postDiscussion")}
					</Button>
				</div>
			</form>
		</div>
	);
}
