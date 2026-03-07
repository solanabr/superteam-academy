"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { Link } from "@/lib/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GlassCard, LuxuryBadge } from "@/components/luxury/primitives";
import { BookingCalendar } from "@/components/mentors/BookingCalendar";
import type { TimeSlot } from "@/components/mentors/BookingCalendar";
import { RatingStars } from "@/components/mentors/RatingStars";
import {
  Star,
  DollarSign,
  Clock,
  Users,
  ArrowLeft,
  Calendar,
  Loader2,
  CheckCircle,
} from "lucide-react";
import type { Mentor } from "@/components/mentors/MentorCard";
type PageMentor = Mentor & {
  fullBio: string;
};

type ApiMentor = {
  id: string;
  bio: string;
  expertise: string[];
  hourlyRate?: number | null;
  rating: number;
  totalSessions: number;
  isVerified?: boolean;
  user?: {
    id?: string | null;
    displayName?: string | null;
    username?: string | null;
  };
};

function formatIdentity(value?: string | null): string | undefined {
  return value ? `${value.slice(0, 8)}...` : undefined;
}

function mapMentor(mentor: ApiMentor): PageMentor {
  const displayName =
    mentor.user?.displayName ||
    mentor.user?.username ||
    formatIdentity(mentor.user?.id ?? mentor.id) ||
    mentor.id;

  return {
    id: mentor.id,
    name: displayName,
    bio: mentor.bio,
    fullBio: mentor.bio,
    expertise: mentor.expertise,
    hourlyRate: mentor.hourlyRate ?? undefined,
    currency: "USDC",
    rating: mentor.rating || 0,
    totalSessions: mentor.totalSessions,
    availability: mentor.hourlyRate == null ? "unavailable" : mentor.isVerified ? "available" : "limited",
  };
}

export default function MentorDetailPage() {
  const t = useTranslations("common");
  const tMentors = useTranslations("mentors");
  const { id } = useParams();
  const [mentor, setMentor] = useState<PageMentor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [isBooking, setIsBooking] = useState(false);
  const [isBooked, setIsBooked] = useState(false);
  const [availability, setAvailability] = useState<TimeSlot[]>([]);

  useEffect(() => {
    async function fetchMentor() {
      try {
        const res = await fetch(`/api/mentors/${id}`, { cache: "no-store" });
        if (!res.ok) {
          throw new Error(`Failed to load mentor (${res.status})`);
        }
        const data = (await res.json()) as { mentor?: ApiMentor };
        setMentor(data.mentor ? mapMentor(data.mentor) : null);
        const availabilityRes = await fetch(`/api/mentors/${id}/availability`, { cache: "no-store" });
        if (availabilityRes.ok) {
          const availabilityData = (await availabilityRes.json()) as {
            slots?: Array<{ id: string; startTime: string; endTime: string; isBooked: boolean }>;
          };
          setAvailability(
            (availabilityData.slots ?? []).map((slot) => ({
              id: slot.id,
              startTime: new Date(slot.startTime),
              endTime: new Date(slot.endTime),
              isBooked: slot.isBooked,
            }))
          );
        } else {
          setAvailability([]);
        }
      } catch (error) {
        console.error("Failed to fetch mentor:", error);
        setMentor(null);
        setAvailability([]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchMentor();
  }, [id]);

  const handleBookSession = async () => {
    if (!selectedSlot) return;
    setIsBooking(true);
    try {
      await fetch(`/api/mentors/${id}/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduledAt: selectedSlot.startTime.toISOString(),
          duration: Math.round((selectedSlot.endTime.getTime() - selectedSlot.startTime.getTime()) / 60000),
          topic: tMentors("bookSession"),
        }),
      });
      setIsBooked(true);
      setTimeout(() => {
        setIsBooked(false);
        setSelectedSlot(null);
      }, 3000);
    } catch (error) {
      console.error("Failed to book session:", error);
    } finally {
      setIsBooking(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!mentor) {
    return (
      <div className="container py-8">
        <GlassCard className="py-16 text-center">
          <p className="text-lg text-muted-foreground">Mentor not found</p>
          <Link href="/mentors">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Mentors
            </Button>
          </Link>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="container py-8 md:py-10">
      {/* Back button */}
      <Link href="/mentors">
        <Button variant="ghost" className="mb-6 -ml-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t("back")}
        </Button>
      </Link>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <GlassCard glowColor="amber">
            <div className="p-6 md:p-8">
              <div className="mb-5 flex flex-wrap items-center gap-2">
                <LuxuryBadge color="amber">Mentor Console</LuxuryBadge>
                <Badge variant="outline" className="border-primary/30 bg-primary/10">
                  Live profile
                </Badge>
              </div>
              <div className="flex flex-col md:flex-row md:items-start gap-6">
                <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold">
                  {mentor.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()}
                </div>
                <div className="flex-1">
                  <h1 className="text-3xl font-bold tracking-tight">{mentor.name}</h1>
                  <div className="flex items-center gap-2 mt-2">
                    <RatingStars rating={Math.round(mentor.rating)} readonly />
                    <span className="font-medium">{mentor.rating.toFixed(1)}</span>
                    <span className="text-muted-foreground">({mentor.totalSessions} sessions)</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-4">
                    {mentor.expertise.map((skill) => (
                      <Badge key={skill} variant="outline">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Bio */}
          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose dark:prose-invert max-w-none">
                {mentor.fullBio.split("\n").map((paragraph, i) =>
                  paragraph.trim() ? (
                    <p key={i} className="text-muted-foreground">
                      {paragraph}
                    </p>
                  ) : null
                )}
              </div>
            </CardContent>
          </Card>

          {/* Booking Calendar */}
          {mentor.availability !== "unavailable" && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Book a Session</h2>
              <BookingCalendar
                availability={availability}
                onSelectSlot={setSelectedSlot}
                selectedSlot={selectedSlot}
              />
            </div>
          )}

        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Booking Card */}
          <GlassCard glowColor="amber">
            <div className="p-6">
              <div className="text-center mb-6">
                {mentor.hourlyRate != null ? (
                  <>
                    <div className="flex items-center justify-center gap-1 text-3xl font-bold">
                      <DollarSign className="h-8 w-8" />
                      {mentor.hourlyRate}
                    </div>
                    <span className="text-muted-foreground">{mentor.currency}/hour</span>
                  </>
                ) : (
                  <>
                    <div className="text-2xl font-bold">{tMentors("unavailable")}</div>
                    <span className="text-muted-foreground">{tMentors("hourlyRate")}</span>
                  </>
                )}
              </div>

              {isBooked ? (
                <div className="text-center py-4">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                  <p className="font-semibold">{tMentors("bookingSuccess")}</p>
                </div>
              ) : (
                <Button
                  className="w-full"
                  size="lg"
                  variant="solana"
                  disabled={!selectedSlot || mentor.availability === "unavailable" || isBooking}
                  onClick={handleBookSession}
                >
                  {isBooking ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Booking...
                    </>
                  ) : selectedSlot ? (
                    <>
                      <Calendar className="h-4 w-4 mr-2" />
                      Book Selected Slot
                    </>
                  ) : (
                    <>
                      <Clock className="h-4 w-4 mr-2" />
                      Select a Time Slot
                    </>
                  )}
                </Button>
              )}

              {selectedSlot && (
                <div className="mt-4 p-3 bg-muted rounded-lg text-sm">
                  <p className="font-medium">Selected:</p>
                  <p className="text-muted-foreground">
                    {selectedSlot.startTime.toLocaleDateString()} at{" "}
                    {selectedSlot.startTime.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              )}
            </div>
          </GlassCard>

          {/* Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Sessions Completed
                </span>
                <span className="font-medium">{mentor.totalSessions}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Rating
                </span>
                <span className="font-medium">{mentor.rating.toFixed(1)}/5</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
