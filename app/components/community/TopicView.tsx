"use client";

import { NavRail } from "@/components/layout/NavRail";
import { TopBar } from "@/components/layout/TopBar";
import { DotGrid } from "@/components/shared/DotGrid";
import { Button } from "@/components/ui/button";
import {
	ArrowLeftIcon,
	ArrowBendDownRightIcon,
	ChatCircleTextIcon,
	ThumbsUpIcon,
	PaperPlaneRightIcon,
} from "@phosphor-icons/react";
import { Link } from "@/i18n/routing";
import { CommunitySidebar } from "@/components/community/CommunitySidebar";
import {
	getThreadBySlug,
	createComment,
	likeThread,
	likeComment,
} from "@/lib/actions/community";
import { useState, useTransition } from "react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

type ThreadType = NonNullable<Awaited<ReturnType<typeof getThreadBySlug>>>;

export function TopicView({ topic }: { topic: ThreadType }) {
	const [replyBody, setReplyBody] = useState("");
	const [isPending, startTransition] = useTransition();
	const [isLiking, setIsLiking] = useState(false);
	const [optimisticThreadLikes, setOptimisticThreadLikes] = useState(
		topic.likes,
	);
	const [optimisticCommentLikes, setOptimisticCommentLikes] = useState<
		Record<string, number>
	>(topic.comments.reduce((acc, c) => ({ ...acc, [c.id]: c.likes }), {}));

	const handleUpvoteThread = async () => {
		if (isLiking) return;
		setIsLiking(true);
		setOptimisticThreadLikes((prev) => prev + 1);
		try {
			await likeThread(topic.id);
		} catch {
			toast.error("Failed to transmit upvote");
			setOptimisticThreadLikes((prev) => prev - 1);
		} finally {
			setIsLiking(false);
		}
	};

	const handleUpvoteComment = async (commentId: string) => {
		if (isLiking) return;
		setIsLiking(true);
		setOptimisticCommentLikes((prev) => ({
			...prev,
			[commentId]: (prev[commentId] || 0) + 1,
		}));
		try {
			await likeComment(commentId);
		} catch {
			toast.error("Failed to transmit upvote");
			setOptimisticCommentLikes((prev) => ({
				...prev,
				[commentId]: (prev[commentId] || 1) - 1,
			}));
		} finally {
			setIsLiking(false);
		}
	};

	const handleReply = () => {
		if (!replyBody.trim()) {
			toast.error("Reply cannot be empty");
			return;
		}

		startTransition(async () => {
			try {
				await createComment(topic.id, replyBody);
				toast.success("Response transmitted successfully");
				setReplyBody("");
			} catch {
				toast.error("Failed to transmit response");
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
					{/* Header Actions */}
					<div>
						<Link
							href="/community"
							className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-ink-secondary hover:text-ink-primary transition-colors mb-6"
						>
							<ArrowLeftIcon /> RETURN TO HUB
						</Link>

						<div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-ink-secondary/20 dark:border-border pb-6">
							<div>
								<span className="bg-ink-primary text-bg-base px-2 py-1 text-[10px] uppercase tracking-widest inline-block mb-2 font-bold">
									[{topic.category}]
								</span>
								<h1 className="font-display text-4xl lg:text-5xl leading-none -tracking-wider">
									{topic.title}
								</h1>
								<div className="text-[11px] uppercase tracking-widest text-ink-secondary mt-4 flex items-center gap-2">
									<i className={topic.authorAvatar || "bi bi-person-badge"}></i>{" "}
									INIT BY {topic.authorName || "Unknown"}{" "}
									<span className="text-ink-tertiary">|</span>{" "}
									{formatDistanceToNow(new Date(topic.createdAt), {
										addSuffix: true,
									})}
								</div>
							</div>
							<Button className="bg-ink-primary hover:bg-ink-primary/90 text-bg-base rounded-none uppercase text-[11px] font-bold px-6 tracking-widest flex items-center gap-2 shrink-0">
								<ArrowBendDownRightIcon weight="bold" />
								REPLY
							</Button>
						</div>
					</div>

					<div className="flex flex-col gap-8">
						{/* Original Post */}
						<div className="border border-ink-primary/30 bg-surface/50 p-6 md:p-8 relative">
							{/* Corner Accents */}
							<div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-ink-primary"></div>
							<div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-ink-primary"></div>
							<div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-ink-primary"></div>
							<div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-ink-primary"></div>

							<p className="text-sm leading-relaxed whitespace-pre-wrap font-mono relative z-10 text-ink-primary">
								{topic.content}
							</p>

							<div className="flex items-center gap-4 mt-8 pt-4 border-t border-ink-secondary/20 relative z-10">
								<button
									onClick={handleUpvoteThread}
									disabled={isLiking}
									className="text-[10px] uppercase tracking-widest font-bold text-ink-secondary hover:text-ink-primary transition-colors flex items-center gap-1.5 disabled:opacity-50"
								>
									<ThumbsUpIcon size={14} /> UPVOTE ({optimisticThreadLikes})
								</button>
								<button className="text-[10px] uppercase tracking-widest font-bold text-ink-secondary hover:text-ink-primary transition-colors flex items-center gap-1.5">
									<ArrowBendDownRightIcon size={14} /> REPLY
								</button>
							</div>
						</div>

						{/* Comments Section */}
						<div>
							<div className="flex items-center gap-2 mb-6">
								<ChatCircleTextIcon
									weight="duotone"
									className="w-5 h-5 text-ink-primary"
								/>
								<h2 className="font-bold uppercase tracking-widest text-[13px]">
									RESPONSES ({topic.comments.length})
								</h2>
							</div>

							<div className="flex flex-col gap-4">
								{topic.comments && topic.comments.length > 0 ? (
									topic.comments.map((comment) => (
										<div
											key={comment.id}
											className="border border-ink-secondary/20 bg-surface/30 p-5 relative group hover:border-ink-primary/50 transition-colors"
										>
											<div className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-ink-primary opacity-0 group-hover:opacity-100 transition-opacity"></div>
											<div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-ink-primary opacity-0 group-hover:opacity-100 transition-opacity"></div>

											<div className="flex items-center justify-between mb-3 border-b border-dashed border-ink-secondary/20 pb-2">
												<div className="text-[10px] uppercase tracking-widest font-bold flex items-center gap-1.5 border border-ink-secondary/30 px-1.5 py-0.5 bg-bg-surface">
													<i
														className={
															comment.authorAvatar || "bi bi-person-badge"
														}
													></i>{" "}
													{comment.authorName || "Unknown"}
												</div>
												<div className="text-[10px] text-ink-tertiary font-mono">
													{formatDistanceToNow(new Date(comment.createdAt), {
														addSuffix: true,
													})}
												</div>
											</div>

											<p className="text-sm font-mono text-ink-secondary group-hover:text-ink-primary transition-colors whitespace-pre-wrap">
												{comment.content}
											</p>

											<div className="flex items-center gap-4 mt-4 text-[10px] uppercase tracking-widest font-bold pointer-events-auto">
												<button
													onClick={() => handleUpvoteComment(comment.id)}
													disabled={isLiking}
													className="text-ink-secondary hover:text-ink-primary flex items-center gap-1 transition-colors disabled:opacity-50"
												>
													<ThumbsUpIcon size={14} />{" "}
													{optimisticCommentLikes[comment.id]}
												</button>
												<button className="text-ink-secondary hover:text-ink-primary flex items-center gap-1 transition-colors">
													<ArrowBendDownRightIcon size={14} /> RE
												</button>
											</div>
										</div>
									))
								) : (
									<div className="border border-dashed border-ink-secondary/30 p-8 text-center text-ink-secondary uppercase tracking-widest text-[10px]">
										NO RESPONSES YET. BE THE FIRST TO INITIATE PROTOCOL.
									</div>
								)}
							</div>
						</div>

						{/* Quick Reply Box */}
						<div className="mt-4 border border-ink-primary bg-bg-base relative p-1 pb-1">
							<div className="bg-ink-primary text-bg-base px-2 py-1 text-[10px] uppercase tracking-widest font-bold absolute -top-3 left-4">
								QUICK_REPLY
							</div>
							<textarea
								placeholder="// Enter response sequence..."
								value={replyBody}
								onChange={(e) => setReplyBody(e.target.value)}
								className="w-full bg-transparent p-4 min-h-[120px] resize-none outline-none font-mono text-xs mt-2 text-ink-primary placeholder:text-ink-tertiary focus:bg-ink-primary/5 transition-colors"
							></textarea>
							<div className="flex justify-end p-2 border-t border-ink-primary/20 bg-bg-surface">
								<Button
									onClick={handleReply}
									disabled={isPending}
									className="rounded-none bg-ink-primary text-bg-base uppercase text-[10px] tracking-widest font-bold hover:bg-ink-primary/90 px-6 flex items-center gap-2"
								>
									{isPending ? "TRANSMITTING..." : "TRANSMIT"}{" "}
									<PaperPlaneRightIcon weight="bold" />
								</Button>
							</div>
						</div>
					</div>
				</main>

				<CommunitySidebar />
			</div>
		</div>
	);
}
