"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface DiscussionCommentFormProps {
	discussionId: string;
	onCommentPosted?: () => void;
}

export function DiscussionCommentForm({
	discussionId,
	onCommentPosted,
}: DiscussionCommentFormProps) {
	const t = useTranslations("community.discussions");
	const [content, setContent] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = async () => {
		const trimmed = content.trim();
		if (!trimmed) return;

		setSubmitting(true);
		setError(null);

		try {
			const response = await fetch("/api/community/discussions/comments", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ discussionId, content: trimmed }),
			});

			if (!response.ok) {
				const data = await response.json();
				setError(data.error || "Failed to post comment");
				return;
			}

			setContent("");
			onCommentPosted?.();
		} catch {
			setError("Network error. Please try again.");
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div className="space-y-3">
			<Textarea
				placeholder={t("replyPlaceholder")}
				value={content}
				onChange={(e) => setContent(e.target.value)}
				rows={4}
				maxLength={5000}
			/>
			{error && <p className="text-sm text-destructive">{error}</p>}
			<div className="flex justify-end">
				<Button onClick={handleSubmit} disabled={submitting || !content.trim()} size="sm">
					<Send className="h-4 w-4 mr-2" />
					{submitting ? t("posting") : t("postReply")}
				</Button>
			</div>
		</div>
	);
}
