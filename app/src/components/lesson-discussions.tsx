"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/hooks/useUser";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { Loader2, MessageSquare } from "lucide-react";
import { toast } from "sonner";

interface LessonDiscussionsProps {
    courseId: string;
    lessonIndex: number;
}

export function LessonDiscussions({ courseId, lessonIndex }: LessonDiscussionsProps) {
    const { userDb } = useUser();
    const [comments, setComments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [newComment, setNewComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchComments = async () => {
        try {
            const res = await fetch(`/api/discussions?courseId=${courseId}&lessonIndex=${lessonIndex}`);
            const data = await res.json();
            setComments(data);
        } catch (e) {
            console.error("Failed to load comments", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComments();
    }, [courseId, lessonIndex]);

    const handleSubmit = async () => {
        if (!userDb) {
            toast.error("Please sign in to comment");
            return;
        }
        if (!newComment.trim()) return;

        setIsSubmitting(true);
        try {
            const res = await fetch('/api/discussions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    courseId,
                    lessonIndex,
                    content: newComment,
                    walletAddress: userDb.walletAddress
                })
            });

            if (res.ok) {
                setNewComment("");
                fetchComments(); // Перезагружаем список
                toast.success("Comment posted!");
            } else {
                throw new Error("Failed to post");
            }
        } catch (e) {
            toast.error("Error posting comment");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Input Area */}
            <div className="p-4 border-b bg-muted/10">
                <Textarea 
                    placeholder="Ask a question or share a tip about this lesson..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="min-h-[80px] mb-3 resize-none bg-background"
                />
                <div className="flex justify-end">
                    <Button size="sm" onClick={handleSubmit} disabled={isSubmitting || !newComment.trim()}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Post Comment
                    </Button>
                </div>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-auto p-4 space-y-6">
                {loading ? (
                    <div className="flex justify-center p-4"><Loader2 className="animate-spin text-muted-foreground" /></div>
                ) : comments.length === 0 ? (
                    <div className="text-center text-muted-foreground pt-10 flex flex-col items-center">
                        <MessageSquare className="h-10 w-10 mb-2 opacity-20" />
                        <p>No discussions yet. Be the first to start!</p>
                    </div>
                ) : (
                    comments.map(comment => {
                        const displayName = comment.user.username || comment.user.githubHandle || `${comment.user.walletAddress?.slice(0,4)}...`;
                        const isAdmin = comment.user.role === "ADMIN";

                        return (
                            <div key={comment.id} className="flex gap-4">
                                <Avatar className="h-10 w-10 border shadow-sm">
                                    <AvatarImage src={comment.user.image || `https://api.dicebear.com/7.x/identicon/svg?seed=${comment.user.walletAddress}`} />
                                    <AvatarFallback>U</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 space-y-1.5">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-sm">{displayName}</span>
                                        {isAdmin && <Badge variant="default" className="text-[10px] h-4 px-1 bg-purple-500 hover:bg-purple-600">Core Team</Badge>}
                                        <span className="text-xs text-muted-foreground ml-auto">
                                            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                                        </span>
                                    </div>
                                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                                        {comment.content}
                                    </p>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    );
}