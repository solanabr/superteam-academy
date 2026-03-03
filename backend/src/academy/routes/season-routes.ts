import type { Hono } from "hono";
import { getPrisma } from "@/lib/prisma.js";
import { withRouteErrorHandling, badRequest } from "@/lib/errors.js";
import { sanityClient } from "@/lib/sanity.js";
import { readJsonObject, readOptionalString, readRequiredString } from "@/lib/validation.js";

function parseIsoDate(value: unknown, field: string): Date {
  if (typeof value !== "string") {
    throw badRequest(`${field} must be an ISO date string`);
  }
  const d = new Date(value);
  if (!Number.isFinite(d.getTime())) {
    throw badRequest(`${field} is not a valid date`);
  }
  return d;
}

export function registerSeasonRoutes(app: Hono): void {
  app.get(
    "/seasons",
    withRouteErrorHandling(async (c) => {
      const prisma = getPrisma();
      const now = new Date();
      const seasons = await prisma.season.findMany({
        orderBy: { startAt: "asc" },
        include: { _count: { select: { challenges: true } } },
      });
      const list = seasons.map((s) => ({
        id: s.id,
        slug: s.slug,
        name: s.name,
        description: s.description,
        imageUrl: s.imageUrl,
        startAt: s.startAt,
        endAt: s.endAt,
        challengeCount: (s as { _count: { challenges: number } })._count.challenges,
        fromSanity: s.sanityId != null,
        sanityId: s.sanityId ?? undefined,
        status:
          now < s.startAt ? "upcoming" : now > s.endAt ? "past" : "active",
      }));
      return c.json({ seasons: list });
    })
  );

  app.post(
    "/create-season",
    withRouteErrorHandling(async (c) => {
      const prisma = getPrisma();
      const body = await readJsonObject(c);
      const slug = readRequiredString(body, "slug").trim().toLowerCase().replace(/\s+/g, "-");
      const name = readRequiredString(body, "name");
      const description = readOptionalString(body, "description") ?? null;
      const imageUrl = readOptionalString(body, "imageUrl") ?? null;
      const startAt = parseIsoDate(body.startAt, "startAt");
      const endAt = parseIsoDate(body.endAt, "endAt");
      if (endAt <= startAt) {
        throw badRequest("endAt must be after startAt");
      }
      const season = await prisma.season.create({
        data: { slug, name, description, imageUrl, startAt, endAt },
      });
      return c.json(season);
    })
  );

  app.post(
    "/update-season",
    withRouteErrorHandling(async (c) => {
      const prisma = getPrisma();
      const body = await readJsonObject(c);
      const id = Number(body.id);
      if (!Number.isInteger(id) || id < 1) {
        throw badRequest("id must be a positive integer");
      }
      const existing = await prisma.season.findUnique({ where: { id } });
      if (!existing) {
        throw badRequest("Season not found");
      }
      const updates: {
        slug?: string;
        name?: string;
        description?: string | null;
        imageUrl?: string | null;
        startAt?: Date;
        endAt?: Date;
        sanityId?: string | null;
      } = {};
      let newSlug: string | undefined;

      if (body.slug !== undefined) {
        newSlug = readRequiredString(body, "slug").trim().toLowerCase().replace(/\s+/g, "-");
        updates.slug = newSlug;
        const conflict = await prisma.season.findFirst({
          where: { slug: updates.slug, id: { not: id } },
        });
        if (conflict) throw badRequest("Another season already uses this slug");
      }
      if (body.name !== undefined) updates.name = readRequiredString(body, "name");
      if (body.description !== undefined) updates.description = readOptionalString(body, "description") ?? null;
      if (body.imageUrl !== undefined) updates.imageUrl = readOptionalString(body, "imageUrl") ?? null;
      if (body.startAt !== undefined) updates.startAt = parseIsoDate(body.startAt, "startAt");
      if (body.endAt !== undefined) updates.endAt = parseIsoDate(body.endAt, "endAt");
      if (body.sanityId !== undefined) updates.sanityId = readOptionalString(body, "sanityId") ?? null;

      if (newSlug && newSlug !== existing.slug && existing.sanityId) {
        try {
          await sanityClient
            .patch(existing.sanityId)
            .set({ slug: { _type: "slug", current: newSlug } })
            .commit();
        } catch (err) {
          console.error("failed to sync season slug to Sanity", {
            sanityId: existing.sanityId,
            newSlug,
            error: String(err),
          });
        }
      }
      const season = await prisma.season.update({
        where: { id },
        data: updates,
      });
      return c.json(season);
    })
  );
}
