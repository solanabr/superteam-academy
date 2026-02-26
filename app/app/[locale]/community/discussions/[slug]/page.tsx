import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowLeft, MessageSquare, Eye, ThumbsUp, CheckCircle } from "lucide-react";
import { Link } from "@superteam-academy/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getDiscussionBySlug } from "@/lib/community-cms";

interface DiscussionPageProps {
	params: Promise<{ slug: string }>;
}

export default async function DiscussionPage({ params }: DiscussionPageProps) {
	const { slug } = await params;
	const discussion = await getDiscussionBySlug(slug);

	if (!discussion) notFound();

	const t = await getTranslations("community.discussions");
	const authorName = discussion.author?.name ?? "Unknown";

	return (
		<div className="mx-auto space-y-6">
			<Button variant="ghost" size="sm" asChild>
				<Link href="/community">
					<ArrowLeft className="h-4 w-4 mr-1" />
					{t("backToDiscussions")}
				</Link>
			</Button>

			<div className="space-y-4">
				<div className="flex items-start gap-3">
					<div className="flex-1 space-y-2">
						<div className="flex items-center gap-2 flex-wrap">
							<Badge variant="secondary">{discussion.category}</Badge>
							{discussion.pinned && <Badge variant="outline">{t("pinned")}</Badge>}
							{discussion.solved && (
								<Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
									<CheckCircle className="h-3 w-3 mr-1" />
									{t("solved")}
								</Badge>
							)}
						</div>
						<h1 className="text-2xl font-bold">{discussion.title}</h1>
						<div className="flex items-center gap-4 text-sm text-muted-foreground">
							<span>{authorName}</span>
							<span>{new Date(discussion.publishedAt).toLocaleDateString()}</span>
							<span className="flex items-center gap-1">
								<Eye className="h-3.5 w-3.5" />
								{discussion.views}
							</span>
							<span className="flex items-center gap-1">
								<MessageSquare className="h-3.5 w-3.5" />
								{discussion.commentCount}
							</span>
							<span className="flex items-center gap-1">
								<ThumbsUp className="h-3.5 w-3.5" />
								{discussion.points}
							</span>
						</div>
					</div>
				</div>

				<Card>
					<CardContent className="pt-6 prose prose-sm dark:prose-invert max-w-none">
						<p>{discussion.excerpt}</p>
					</CardContent>
				</Card>

				{discussion.tags.length > 0 && (
					<div className="flex gap-2 flex-wrap">
						{discussion.tags.map((tag) => (
							<Badge key={tag} variant="outline">
								{tag}
							</Badge>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
