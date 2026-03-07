"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GlassCard, LuxuryBadge } from "@/components/luxury/primitives";
import { SessionList, type Session } from "@/components/mentors/SessionList";
import { RatingStars } from "@/components/mentors/RatingStars";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Clock, Star, Loader2 } from "lucide-react";
import { formatSessionDate } from "@/lib/feature-ui";

type ApiSession = {
  id: string;
  scheduledAt: string;
  duration: number;
  status: string;
  topic: string;
  rating?: number | null;
    mentor?: {
      user?: {
        id?: string | null;
        displayName?: string | null;
        username?: string | null;
        avatarUrl?: string | null;
      };
    };
};

function formatIdentity(value?: string | null): string | undefined {
  return value ? `${value.slice(0, 8)}...` : undefined;
}

function mapSession(session: ApiSession): Session {
  const statusMap: Record<string, Session["status"]> = {
    scheduled: "upcoming",
    in_progress: "upcoming",
    completed: "completed",
    cancelled: "cancelled",
  };

  return {
    id: session.id,
    mentorName:
      session.mentor?.user?.displayName ||
      session.mentor?.user?.username ||
      formatIdentity(session.mentor?.user?.id),
    mentorAvatar: session.mentor?.user?.avatarUrl || undefined,
    date: formatSessionDate(session.scheduledAt),
    duration: session.duration,
    status: statusMap[session.status] ?? "upcoming",
    topic: session.topic,
    hasRating: session.rating != null,
  };
}

export default function SessionsPage() {
  const t = useTranslations("common");
  const tMentors = useTranslations("mentors");

  const [upcomingSessions, setUpcomingSessions] = useState<Session[]>([]);
  const [pastSessions, setPastSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [ratingSession, setRatingSession] = useState<Session | null>(null);
  const [rating, setRating] = useState(0);
  const [ratingComment, setRatingComment] = useState("");
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  useEffect(() => {
    async function fetchSessions() {
      try {
        const res = await fetch("/api/sessions", { cache: "no-store" });
        if (!res.ok) {
          throw new Error(`Failed to load sessions (${res.status})`);
        }
        const data = (await res.json()) as { sessions?: ApiSession[] };
        const mapped = (data.sessions ?? []).map(mapSession);
        setUpcomingSessions(mapped.filter((item) => item.status === "upcoming"));
        setPastSessions(mapped.filter((item) => item.status !== "upcoming"));
      } catch (error) {
        console.error("Failed to fetch sessions:", error);
        setUpcomingSessions([]);
        setPastSessions([]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchSessions();
  }, []);

  const handleJoinCall = (sessionId: string) => {
    const session = upcomingSessions.find((s) => s.id === sessionId);
    if (session?.meetingUrl) {
      window.open(session.meetingUrl, "_blank");
    }
  };

  const handleRate = (sessionId: string) => {
    const session = pastSessions.find((s) => s.id === sessionId);
    if (session) {
      setRatingSession(session);
      setRating(0);
      setRatingComment("");
    }
  };

  const submitRating = async () => {
    if (!ratingSession || rating === 0) return;

    setIsSubmittingRating(true);
    try {
      const res = await fetch(`/api/sessions/${ratingSession.id}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, feedback: ratingComment || undefined }),
      });
      if (!res.ok) {
        throw new Error(`Failed to submit rating (${res.status})`);
      }
      setPastSessions((prev) =>
        prev.map((s) =>
          s.id === ratingSession.id ? { ...s, hasRating: true } : s
        )
      );
      setRatingSession(null);
    } catch (error) {
      console.error("Failed to submit rating:", error);
    } finally {
      setIsSubmittingRating(false);
    }
  };

  if (isLoading) {
    return (
      <AuthGuard>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="container py-8 md:py-10">
        {/* Header */}
        <div className="mb-8 rounded-3xl border border-border/60 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.14),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.02),rgba(255,255,255,0.01))] p-8 md:p-10 shadow-[0_20px_80px_rgba(0,0,0,0.12)]">
          <LuxuryBadge color="amber">My Sessions</LuxuryBadge>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Mentorship Sessions
          </h1>
          <p className="mt-2 text-muted-foreground">
            Manage your upcoming sessions and review past mentorship
          </p>
        </div>

        <Tabs defaultValue="upcoming" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="upcoming" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Upcoming
              {upcomingSessions.length > 0 && (
                <span className="ml-1 text-xs bg-primary text-primary-foreground rounded-full px-2 py-0.5">
                  {upcomingSessions.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="past" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Past Sessions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-4">
            <SessionList
              sessions={upcomingSessions}
              onJoinCall={handleJoinCall}
              emptyMessage="No upcoming sessions. Book a session with a mentor to get started!"
            />
          </TabsContent>

          <TabsContent value="past" className="space-y-4">
            <SessionList
              sessions={pastSessions}
              onRate={handleRate}
              emptyMessage="No past sessions yet."
            />
          </TabsContent>
        </Tabs>

        {/* Rating Dialog */}
        <Dialog open={!!ratingSession} onOpenChange={() => setRatingSession(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rate Your Session</DialogTitle>
              <DialogDescription>
                {ratingSession && `How was your session with ${ratingSession.mentorName}?`}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex justify-center">
                <RatingStars rating={rating} onRate={setRating} size="lg" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Additional Feedback (optional)</label>
                <Textarea
                  placeholder="Share your experience..."
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRatingSession(null)}>
                Cancel
              </Button>
              <Button
                onClick={submitRating}
                disabled={rating === 0 || isSubmittingRating}
              >
                {isSubmittingRating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Star className="h-4 w-4 mr-2" />
                    Submit Rating
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AuthGuard>
  );
}
