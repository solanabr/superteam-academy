"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardContent, CardFooter } from "@/components/ui/card";
import { MarketplaceCard } from "@/components/ui/marketplace-card";
import { CountdownTimer } from "./CountdownTimer";
import { Calendar, MapPin, Trophy, Users } from "lucide-react";

export interface Hackathon {
  id: string;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  location: "virtual" | string;
  prizes?: string;
  prizePool?: number;
  currency?: string;
  registeredCount?: number;
  maxParticipants?: number;
  image?: string;
  tags: string[];
  status: "upcoming" | "live" | "ended";
}

interface HackathonCardProps {
  hackathon: Hackathon;
  onRegister?: (hackathonId: string) => void;
}

export function HackathonCard({ hackathon, onRegister }: HackathonCardProps) {
  const tHackathons = useTranslations("hackathons");
  const isVirtual = hackathon.location === "virtual";
  const hasParticipants = typeof hackathon.registeredCount === "number";
  const statusLabel =
    hackathon.status === "live"
      ? tHackathons("live")
      : hackathon.status === "upcoming"
        ? tHackathons("upcoming")
        : tHackathons("past");

  return (
    <MarketplaceCard interactive className="marketplace-card-shell h-full overflow-hidden group">
      <div className="course-cover-surface flex min-h-[8.5rem] items-center justify-center border-b border-border/70 px-5 py-4">
        <div className="space-y-2 text-center">
          <h3 className="line-clamp-2 text-xl font-semibold text-foreground">{hackathon.name}</h3>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Badge variant="outline" className="marketplace-pill">
              {statusLabel}
            </Badge>
            <Badge variant="outline" className="marketplace-pill">
              {isVirtual ? tHackathons("virtual") : tHackathons("inPerson")}
            </Badge>
          </div>
        </div>
      </div>
      <CardContent className="space-y-4 p-5">
        {(hackathon.status === "upcoming" || hackathon.status === "live") ? (
          <div className="rounded-2xl border border-border/70 bg-muted/25 px-4 py-3">
            <p className="mb-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
              {hackathon.status === "live" ? tHackathons("endsIn") : tHackathons("startsIn")}
            </p>
            <CountdownTimer targetDate={hackathon.status === "live" ? hackathon.endDate : hackathon.startDate} />
          </div>
        ) : null}

        <div className="marketplace-meta-row">
          {hackathon.prizes ? (
            <Badge variant="outline" className="marketplace-pill">
              <Trophy className="h-3.5 w-3.5" />
              {hackathon.prizes}
            </Badge>
          ) : null}
          {hasParticipants ? (
            <Badge variant="outline" className="marketplace-pill">
              <Users className="h-3.5 w-3.5" />
              {hackathon.registeredCount}
            </Badge>
          ) : null}
          <Badge variant="outline" className="marketplace-pill">
            <MapPin className="h-3.5 w-3.5" />
            {isVirtual ? tHackathons("virtual") : hackathon.location}
          </Badge>
        </div>

        <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">{hackathon.description}</p>

        <div className="marketplace-meta-row">
          <Badge variant="outline" className="marketplace-pill">
            <Calendar className="h-3.5 w-3.5" />
            {hackathon.startDate.toLocaleDateString()}
          </Badge>
          {hackathon.tags.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="outline" className="marketplace-pill">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between gap-3 px-5 pb-5 pt-0">
        <div className="text-xs text-muted-foreground">
          {hasParticipants ? (
            <>
              {tHackathons("participants")}
              {hackathon.maxParticipants
                ? ` ${hackathon.registeredCount}/${hackathon.maxParticipants}`
                : ` ${hackathon.registeredCount}`}
            </>
          ) : (
            <>{statusLabel}</>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onRegister && hackathon.status !== "ended" ? (
            <Button size="sm" className="rounded-xl" onClick={() => onRegister?.(hackathon.id)}>
              {tHackathons("register")}
            </Button>
          ) : (
            <Badge variant="outline" className="marketplace-pill">
              {statusLabel}
            </Badge>
          )}
        </div>
      </CardFooter>
    </MarketplaceCard>
  );
}
