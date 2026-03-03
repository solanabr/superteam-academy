import type { Challenge, Season } from "@/generated/prisma/index.js";

export type ChallengeStatus = "pending" | "active" | "ended";

interface ChallengeLike {
  type: string;
  startsAt: Date | null;
  endsAt: Date | null;
  createdAt: Date;
  status: string;
}

interface SeasonLike {
  startAt: Date;
  endAt: Date;
}

export function computeChallengeStatus(
  challenge: ChallengeLike,
  season: SeasonLike | null,
  now: Date
): ChallengeStatus {
  const type = challenge.type;
  const startsAt = challenge.startsAt ?? (season ? season.startAt : challenge.createdAt);

  if (!startsAt) {
    return "pending";
  }

  if (now < startsAt) {
    return "pending";
  }

  if (type === "seasonal" && season) {
    if (now > season.endAt) return "ended";
    return "active";
  }

  if (type === "sponsored" && challenge.endsAt) {
    if (now > challenge.endsAt) return "ended";
    return "active";
  }

  // Daily (and any other types): active once started, never auto-end
  return "active";
}

