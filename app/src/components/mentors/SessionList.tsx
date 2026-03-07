"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Video, Star, Calendar, Clock } from "lucide-react";

export interface Session {
  id: string;
  mentorName?: string;
  mentorAvatar?: string;
  date: string;
  duration: number;
  status: "upcoming" | "completed" | "cancelled";
  topic?: string;
  meetingUrl?: string;
  hasRating?: boolean;
}

interface SessionListProps {
  sessions: Session[];
  onJoinCall?: (sessionId: string) => void;
  onRate?: (sessionId: string) => void;
  emptyMessage?: string;
}

const statusConfig = {
  upcoming: { label: "Upcoming", color: "bg-blue-500/10 text-blue-600" },
  completed: { label: "Completed", color: "bg-green-500/10 text-green-600" },
  cancelled: { label: "Cancelled", color: "bg-red-500/10 text-red-600" },
};

export function SessionList({
  sessions,
  onJoinCall,
  onRate,
  emptyMessage = "No sessions found",
}: SessionListProps) {
  const t = useTranslations("common");

  if (sessions.length === 0) {
    return (
      <Card className="transition-all hover:border-primary/50 hover:shadow-md">
        <CardContent className="p-8 text-center">
          <Calendar className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">{emptyMessage}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {sessions.map((session) => (
        <Card key={session.id} className="group transition-all hover:border-primary/50 hover:shadow-md">
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-primary/10">
                    {(session.mentorName || session.topic || session.id)
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    {session.mentorName ? (
                      <h4 className="font-medium text-base group-hover:text-primary transition-colors">
                        {session.mentorName}
                      </h4>
                    ) : null}
                    {session.topic && (
                      <p className="text-sm text-muted-foreground">{session.topic}</p>
                    )}
                  </div>
                  <Badge className={statusConfig[session.status].color}>
                    {statusConfig[session.status].label}
                  </Badge>
                </div>

                <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {session.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {session.duration} min
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-3">
                  {session.status === "upcoming" && session.meetingUrl && (
                    <Button
                      size="sm"
                      variant="solana"
                      onClick={() => onJoinCall?.(session.id)}
                    >
                      <Video className="h-4 w-4 mr-2" />
                      Join Call
                    </Button>
                  )}
                  {session.status === "completed" && !session.hasRating && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onRate?.(session.id)}
                    >
                      <Star className="h-4 w-4 mr-2" />
                      Rate Session
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
