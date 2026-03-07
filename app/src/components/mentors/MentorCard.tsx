"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardContent, CardFooter } from "@/components/ui/card";
import { MarketplaceCard } from "@/components/ui/marketplace-card";
import { DollarSign, Star, Users } from "lucide-react";

export interface Mentor {
  id: string;
  name: string;
  avatar?: string;
  bio: string;
  expertise: string[];
  hourlyRate?: number | null;
  currency: string;
  rating: number;
  totalSessions: number;
  availability: "available" | "limited" | "unavailable";
  nextAvailable?: string;
}

interface MentorCardProps {
  mentor: Mentor;
}

export function MentorCard({ mentor }: MentorCardProps) {
  const tMentors = useTranslations("mentors");

  const availabilityLabel =
    mentor.availability === "available"
      ? tMentors("available")
      : mentor.availability === "limited"
        ? tMentors("limited")
        : tMentors("unavailable");
  const hasRate = mentor.hourlyRate != null;

  return (
    <MarketplaceCard interactive className="marketplace-card-shell h-full">
      <CardContent className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <Avatar className="h-12 w-12 border border-border/70">
              <AvatarFallback className="bg-muted/35 text-sm font-semibold text-foreground">
                {mentor.name
                  .split(" ")
                  .map((name) => name[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 space-y-2">
              <h3 className="line-clamp-1 text-lg font-semibold text-foreground">{mentor.name}</h3>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Star className="h-4 w-4" />
                  {mentor.rating.toFixed(1)}
                </span>
              </div>
            </div>
          </div>
          <Badge variant="outline" className="marketplace-pill shrink-0">
            {availabilityLabel}
          </Badge>
        </div>

        <div className="marketplace-meta-row">
          {hasRate ? (
            <Badge variant="outline" className="marketplace-pill">
              <DollarSign className="h-3.5 w-3.5" />
              {mentor.hourlyRate} {mentor.currency}
            </Badge>
          ) : (
            <Badge variant="outline" className="marketplace-pill">
              <DollarSign className="h-3.5 w-3.5" />
              {tMentors("unavailable")}
            </Badge>
          )}
          <Badge variant="outline" className="marketplace-pill">
            <Users className="h-3.5 w-3.5" />
            {mentor.totalSessions} sessions
          </Badge>
        </div>

        <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">{mentor.bio}</p>

        <div className="marketplace-meta-row">
          {mentor.expertise.slice(0, 4).map((skill) => (
            <Badge key={skill} variant="outline" className="marketplace-pill">
              {skill}
            </Badge>
          ))}
          {mentor.expertise.length > 4 ? (
            <Badge variant="outline" className="marketplace-pill">
              +{mentor.expertise.length - 4}
            </Badge>
          ) : null}
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between gap-3 px-5 pb-5 pt-0">
        <div className="text-xs text-muted-foreground">{tMentors("expertise")}</div>
        {mentor.availability === "unavailable" ? (
          <Button size="sm" variant="outline" className="rounded-xl" disabled>
            {tMentors("unavailable")}
          </Button>
        ) : (
          <Button asChild size="sm" className="rounded-xl">
            <Link href={`/mentors/${mentor.id}`}>{tMentors("bookSession")}</Link>
          </Button>
        )}
      </CardFooter>
    </MarketplaceCard>
  );
}
