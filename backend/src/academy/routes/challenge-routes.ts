import BN from "bn.js";
import type { Hono } from "hono";
import { getPrisma } from "@/lib/prisma.js";
import { getToday, isDayInRange } from "@/academy/challenge-time.js";
import { badRequest, withRouteErrorHandling } from "@/lib/errors.js";
import { readJsonObject, readOptionalNumber, readOptionalString, readRequiredString } from "@/lib/validation.js";
import { PublicKey } from "@solana/web3.js";
import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { getMinterRolePda } from "@/pdas.js";
import {
  ensureToken2022Ata,
  fetchConfig,
  requireBackendProgram,
  requireProviderPublicKey,
} from "@/academy/shared.js";
import { sanityClient } from "@/lib/sanity.js";
import {
  createAdminNotification,
  createNotification,
  createUserNotification,
} from "@/academy/notifications.js";

function parseJsonObject(value: unknown, field: string): Record<string, unknown> {
  if (value === undefined || value === null) {
    return {};
  }
  if (typeof value !== "object" || Array.isArray(value)) {
    throw badRequest(`${field} must be a JSON object`);
  }
  return value as Record<string, unknown>;
}

function parseIsoDateOrNull(value: unknown, field: string): Date | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") {
    throw badRequest(`${field} must be an ISO date string`);
  }
  const d = new Date(value);
  if (!Number.isFinite(d.getTime())) {
    throw badRequest(`${field} is not a valid date`);
  }
  return d;
}

type RewardXpMethods = {
  rewardXp: (amount: BN, memo: string) => {
    accountsPartial: (accounts: Record<string, PublicKey>) => {
      rpc: () => Promise<string>;
    };
  };
};

async function syncChallengeSlugToSanity(
  sanityId: string | null,
  newSlug: string | undefined
): Promise<void> {
  if (!sanityId || !newSlug) return;
  try {
    await sanityClient
      .patch(sanityId)
      .set({
        slug: { _type: "slug", current: newSlug },
      })
      .commit();
  } catch (err) {
    // Best-effort only; log and continue.
    console.error("failed to sync challenge slug to Sanity", {
      sanityId,
      newSlug,
      error: String(err),
    });
  }
}

export function registerChallengeRoutes(app: Hono): void {
  app.get(
    "/challenges",
    withRouteErrorHandling(async (c) => {
      const prisma = getPrisma();
      const all = c.req.query("all") === "true";
      const day = all ? null : (c.req.query("day") ?? getToday());
      if (day !== null && !/^\d{4}-\d{2}-\d{2}$/.test(day)) {
        throw badRequest("day must be YYYY-MM-DD");
      }
      const wallet = c.req.query("wallet") ?? null;

      if (all) {
        const challenges = await prisma.challenge.findMany({
          include: { season: true },
          orderBy: { id: "asc" },
        });
        const list = challenges.map((ch) => ({
          id: ch.id,
          slug: ch.slug,
          title: ch.title,
          description: ch.description,
          type: ch.type,
          config: ch.config,
          xpReward: ch.xpReward,
          seasonId: ch.seasonId,
          startsAt: ch.startsAt,
          endsAt: ch.endsAt,
          status: ch.status,
          fromSanity: ch.sanityId != null,
          sanityId: ch.sanityId ?? undefined,
          seasonName: ch.season?.name ?? null,
        }));
        return c.json({ challenges: list });
      }

      const activeDay = day as string;
      const [challenges, completions] = await Promise.all([
        prisma.challenge.findMany({
          where: { status: "active" },
          include: { season: true },
          orderBy: { id: "asc" },
        }),
        wallet
          ? prisma.userChallengeCompletion.findMany({
              where: { wallet, completionDay: activeDay },
              select: { challengeId: true },
            })
          : Promise.resolve([]),
      ]);

      const completedIds = new Set(completions.map((r) => r.challengeId));
      const dayDate = new Date(activeDay + "T12:00:00Z");

      const active = challenges.filter((ch) => {
        if (ch.type === "daily") {
          const start = ch.startsAt ?? dayDate;
          const end = ch.endsAt ?? dayDate;
          return isDayInRange(activeDay, start, end);
        }
        if (ch.type === "seasonal" && ch.season) {
          return isDayInRange(activeDay, ch.season.startAt, ch.season.endAt);
        }
        if (ch.type === "sponsored") {
          if (!ch.startsAt || !ch.endsAt) return false;
          return isDayInRange(activeDay, ch.startsAt, ch.endsAt);
        }
        return false;
      });

      const list = active.map((ch) => ({
        id: ch.id,
        slug: ch.slug,
        title: ch.title,
        description: ch.description,
        type: ch.type,
        xpReward: ch.xpReward,
        seasonId: ch.seasonId,
        fromSanity: ch.sanityId != null,
        completed: completedIds.has(ch.id),
      }));

      return c.json({ day: activeDay, challenges: list });
    })
  );

  app.get(
    "/challenges/by-slug/:slug",
    withRouteErrorHandling(async (c) => {
      const prisma = getPrisma();
      const slug = c.req.param("slug");
      if (!slug?.trim()) {
        throw badRequest("slug is required");
      }
      const challenge = await prisma.challenge.findUnique({
        where: { slug: slug.trim() },
        include: { season: true },
      });
      if (!challenge) {
        return c.json({ error: "Challenge not found" }, 404);
      }
      return c.json({
        id: challenge.id,
        slug: challenge.slug,
        title: challenge.title,
        description: challenge.description,
        type: challenge.type,
        config: challenge.config,
        xpReward: challenge.xpReward,
        seasonId: challenge.seasonId,
        startsAt: challenge.startsAt,
        endsAt: challenge.endsAt,
        seasonName: challenge.season?.name ?? null,
      });
    })
  );

  app.post(
    "/sync-sanity-challenges",
    withRouteErrorHandling(async (c) => {
      const prisma = getPrisma();

      // Write-only sync: use Prisma as source of truth for core fields and
      // create/update corresponding docs in Sanity. Sanity may add extra
      // fields (like rich content or code tests) which can be pulled back
      // into Challenge.config via a separate sync route.
      const seasons = await prisma.season.findMany();
      const challenges = await prisma.challenge.findMany();

      const seasonSanityIdById = new Map<number, string>();

      let seasonsCreated = 0;
      let seasonsUpdated = 0;

      for (const season of seasons) {
        const baseDoc: Record<string, unknown> = {
          _type: "season",
          slug: { _type: "slug", current: season.slug },
          name: season.name,
          description: season.description ?? undefined,
          startAt: season.startAt.toISOString(),
          endAt: season.endAt.toISOString(),
        };

        if (season.sanityId) {
          await sanityClient.createOrReplace({
            _id: season.sanityId,
            ...baseDoc,
          } as { _id: string; _type: string });
          seasonSanityIdById.set(season.id, season.sanityId);
          seasonsUpdated += 1;
        } else {
          const created = await sanityClient.create(baseDoc as { _type: string });
          const sanityId = (created as { _id: string })._id;
          await prisma.season.update({
            where: { id: season.id },
            data: { sanityId },
          });
          seasonSanityIdById.set(season.id, sanityId);
          seasonsCreated += 1;
        }
      }

      let challengesCreated = 0;
      let challengesUpdated = 0;

      for (const challenge of challenges) {
        const seasonSanityId =
          challenge.seasonId != null ? seasonSanityIdById.get(challenge.seasonId) ?? null : null;

        const baseDoc: Record<string, unknown> = {
          _type: "challenge",
          slug: { _type: "slug", current: challenge.slug },
          title: challenge.title,
          description: challenge.description ?? undefined,
          type: challenge.type,
          xpReward: challenge.xpReward,
          startsAt: challenge.startsAt ? challenge.startsAt.toISOString() : undefined,
          endsAt: challenge.endsAt ? challenge.endsAt.toISOString() : undefined,
        };

        if (seasonSanityId) {
          baseDoc.season = { _type: "reference", _ref: seasonSanityId };
        }

        if (challenge.sanityId) {
          // Only update core fields; keep any additional fields (like config)
          // that may have been authored directly in Sanity.
          await sanityClient
            .patch(challenge.sanityId)
            .set(baseDoc)
            .commit();
          challengesUpdated += 1;
        } else {
          const created = await sanityClient.create(baseDoc as { _type: string });
          const sanityId = (created as { _id: string })._id;
          await prisma.challenge.update({
            where: { id: challenge.id },
            data: { sanityId },
          });
          challengesCreated += 1;
        }
      }

      return c.json({
        seasonsCreated,
        seasonsUpdated,
        challengesCreated,
        challengesUpdated,
      });
    })
  );

  app.post(
    "/challenges/:id/complete",
    withRouteErrorHandling(async (c) => {
      const prisma = getPrisma();
      const idStr = c.req.param("id");
      const id = parseInt(idStr, 10);
      if (!Number.isInteger(id) || id < 1) {
        throw badRequest("Invalid challenge id");
      }
      const body = (await c.req.json().catch(() => ({}))) as { wallet?: string; submissionLink?: string };
      const wallet = body.wallet?.trim();
      if (!wallet) {
        throw badRequest("wallet is required");
      }
      const submissionLink = typeof body.submissionLink === "string" ? body.submissionLink.trim() || null : null;

      const day = getToday();
      const challenge = await prisma.challenge.findUnique({ where: { id } });
      if (!challenge) {
        throw badRequest("Challenge not found");
      }

      const dayDate = new Date(day + "T12:00:00Z");
      const isActive =
        challenge.type === "daily"
          ? isDayInRange(day, challenge.startsAt ?? dayDate, challenge.endsAt ?? dayDate)
          : challenge.seasonId
            ? (async () => {
                const season = await prisma.season.findUnique({
                  where: { id: challenge.seasonId! },
                });
                return season ? isDayInRange(day, season.startAt, season.endAt) : false;
              })()
            : false;

      const active = typeof isActive === "boolean" ? isActive : await isActive;
      if (!active) {
        throw badRequest("Challenge is not active for today");
      }

      const existing = await prisma.userChallengeCompletion.findUnique({
        where: {
          wallet_challengeId_completionDay: { wallet, challengeId: id, completionDay: day },
        },
      });
      if (existing) {
        return c.json({ ok: true, alreadyCompleted: true, completedAt: existing.completedAt });
      }

      const completion = await prisma.userChallengeCompletion.create({
        data: {
          wallet,
          challengeId: id,
          completionDay: day,
          submissionLink: submissionLink ?? undefined,
        },
      });

      // Notify admins that a new challenge submission is ready for review.
      await createAdminNotification("challenge_submission", {
        wallet,
        challengeId: id,
        completionDay: day,
        submissionLink,
      });

      // Best-effort XP mint using backend signer and challenge.xpReward.
      if (challenge.xpReward > 0) {
        try {
          const program = requireBackendProgram();
          const backendSigner = requireProviderPublicKey(program);
          const recipient = new PublicKey(wallet);
          const { configPda, config } = await fetchConfig(program);
          const recipientTokenAccount = await ensureToken2022Ata(
            program,
            config.xpMint,
            recipient
          );
          const minterRolePda = getMinterRolePda(backendSigner, program.programId);

          const methods = program.methods as unknown as RewardXpMethods;
          await methods
            .rewardXp(new BN(challenge.xpReward), `challenge:${challenge.slug}`)
            .accountsPartial({
              config: configPda,
              minterRole: minterRolePda,
              xpMint: config.xpMint,
              recipientTokenAccount,
              minter: backendSigner,
              tokenProgram: TOKEN_2022_PROGRAM_ID,
            })
            .rpc();
        } catch (err) {
          // Log and continue; completion is already recorded.
          console.error("challenge reward-xp failed", {
            challengeId: id,
            wallet,
            error: String(err),
          });
        }
      }

      return c.json({ ok: true, completedAt: completion.completedAt });
    })
  );

  app.get(
    "/challenges/completions",
    withRouteErrorHandling(async (c) => {
      const prisma = getPrisma();
      const challengeIdParam = c.req.query("challengeId");
      const challengeId = challengeIdParam != null ? parseInt(challengeIdParam, 10) : null;
      if (challengeId != null && (!Number.isInteger(challengeId) || challengeId < 1)) {
        throw badRequest("challengeId must be a positive integer");
      }
      const completions = await prisma.userChallengeCompletion.findMany({
        where: challengeId != null ? { challengeId } : undefined,
        include: { challenge: true },
        orderBy: [{ completedAt: "desc" }],
      });
      const list = completions.map((r) => ({
        wallet: r.wallet,
        challengeId: r.challengeId,
        completionDay: r.completionDay,
        completedAt: r.completedAt,
        submissionLink: r.submissionLink ?? null,
        challengeTitle: r.challenge.title,
        challengeSlug: r.challenge.slug,
      }));
      return c.json({ completions: list });
    })
  );

  app.post(
    "/challenges/remove-completion",
    withRouteErrorHandling(async (c) => {
      const prisma = getPrisma();
      const body = (await c.req.json().catch(() => ({}))) as {
        wallet?: string;
        challengeId?: number;
        completionDay?: string;
      };
      const wallet = body.wallet?.trim();
      const challengeId = body.challengeId != null ? Number(body.challengeId) : NaN;
      const completionDay = typeof body.completionDay === "string" ? body.completionDay.trim() : "";
      if (!wallet) throw badRequest("wallet is required");
      if (!Number.isInteger(challengeId) || challengeId < 1) throw badRequest("challengeId must be a positive integer");
      if (!/^\d{4}-\d{2}-\d{2}$/.test(completionDay)) throw badRequest("completionDay must be YYYY-MM-DD");
      const deleted = await prisma.userChallengeCompletion.deleteMany({
        where: { wallet, challengeId, completionDay },
      });
      if (deleted.count === 0) {
        return c.json({ error: "Completion not found" }, 404);
      }
      const challenge = await prisma.challenge.findUnique({ where: { id: challengeId } });
      if (challenge) {
        await createUserNotification({
          wallet,
          type: "invalid_submission",
          data: {
            challengeId,
            challengeSlug: challenge.slug,
            challengeTitle: challenge.title,
            completionDay,
          },
        });
      }
      return c.json({ ok: true, removed: true });
    })
  );

  app.post(
    "/create-challenge",
    withRouteErrorHandling(async (c) => {
      const prisma = getPrisma();
      const body = await readJsonObject(c);
      const slug = readRequiredString(body, "slug").trim().toLowerCase().replace(/\s+/g, "-");
      const title = readRequiredString(body, "title");
      const description = readOptionalString(body, "description") ?? null;
      const type = readRequiredString(body, "type");
      if (type !== "daily" && type !== "seasonal" && type !== "sponsored") {
        throw badRequest("type must be daily, seasonal, or sponsored");
      }
      const config = parseJsonObject(body.config, "config");
      const xpReward = readOptionalNumber(body, "xpReward", { defaultValue: 0, integer: true, min: 0 }) ?? 0;
      const seasonId = body.seasonId != null ? Number(body.seasonId) : null;
      if (seasonId != null && (!Number.isInteger(seasonId) || seasonId < 1)) {
        throw badRequest("seasonId must be a positive integer");
      }
      const startsAt = parseIsoDateOrNull(body.startsAt, "startsAt");
      const endsAt = parseIsoDateOrNull(body.endsAt, "endsAt");
      if (type === "sponsored") {
        if (!startsAt || !endsAt) {
          throw badRequest("startsAt and endsAt are required for sponsored challenges");
        }
        if (startsAt > endsAt) {
          throw badRequest("startsAt must be before endsAt for sponsored challenges");
        }
      }
      const challenge = await prisma.challenge.create({
        data: {
          slug,
          title,
          description,
          type,
          config: config as object,
          xpReward,
          seasonId,
          startsAt,
          endsAt,
        },
      });
      await createAdminNotification("new_challenge", {
        challengeId: challenge.id,
        slug: challenge.slug,
        title: challenge.title,
        xpReward: challenge.xpReward,
        type,
      });
      await createNotification({
        targetRole: "learner",
        type: "new_challenge",
        wallet: null,
        data: {
          challengeId: challenge.id,
          slug: challenge.slug,
          title: challenge.title,
          xpReward: challenge.xpReward,
          type,
        },
      });
      return c.json(challenge);
    })
  );

  app.post(
    "/update-challenge",
    withRouteErrorHandling(async (c) => {
      const prisma = getPrisma();
      const body = await readJsonObject(c);
      const id = Number(body.id);
      if (!Number.isInteger(id) || id < 1) {
        throw badRequest("id must be a positive integer");
      }
      const existing = await prisma.challenge.findUnique({ where: { id } });
      if (!existing) {
        throw badRequest("Challenge not found");
      }
      const updates: {
        slug?: string;
        title?: string;
        description?: string | null;
        type?: string;
        config?: object;
        xpReward?: number;
        seasonId?: number | null;
        startsAt?: Date | null;
        endsAt?: Date | null;
        sanityId?: string | null;
      } = {};

      let newSlug: string | undefined;

      if (body.slug !== undefined) {
        newSlug = readRequiredString(body, "slug").trim().toLowerCase().replace(/\s+/g, "-");
        updates.slug = newSlug;
        const conflict = await prisma.challenge.findFirst({
          where: { slug: updates.slug, id: { not: id } },
        });
        if (conflict) throw badRequest("Another challenge already uses this slug");
      }
      if (body.title !== undefined) updates.title = readRequiredString(body, "title");
      if (body.description !== undefined) updates.description = readOptionalString(body, "description") ?? null;
      if (body.type !== undefined) {
        updates.type = readRequiredString(body, "type");
        if (updates.type !== "daily" && updates.type !== "seasonal" && updates.type !== "sponsored") {
          throw badRequest("type must be daily, seasonal, or sponsored");
        }
      }
      if (body.config !== undefined) updates.config = parseJsonObject(body.config, "config") as object;
      if (body.xpReward !== undefined) updates.xpReward = readOptionalNumber(body, "xpReward", { integer: true, min: 0 }) ?? 0;
      if (body.seasonId !== undefined) updates.seasonId = body.seasonId == null ? null : Number(body.seasonId);
      if (body.startsAt !== undefined) updates.startsAt = parseIsoDateOrNull(body.startsAt, "startsAt");
      if (body.endsAt !== undefined) updates.endsAt = parseIsoDateOrNull(body.endsAt, "endsAt");
      if (body.sanityId !== undefined) updates.sanityId = readOptionalString(body, "sanityId") ?? null;

      // If slug changed and this challenge is linked to Sanity, keep the document slug in sync.
      if (newSlug && newSlug !== existing.slug) {
        await syncChallengeSlugToSanity(existing.sanityId, newSlug);
      }

      const challenge = await prisma.challenge.update({
        where: { id },
        data: updates,
      });
      return c.json(challenge);
    })
  );
}
