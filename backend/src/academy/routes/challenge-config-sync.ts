import type { Hono } from "hono";
import { getPrisma } from "@/lib/prisma.js";
import { sanityClient } from "@/lib/sanity.js";
import { withRouteErrorHandling } from "@/lib/errors.js";

type SanityCodeTest = {
  _key?: string;
  label?: string;
  inputJson?: string;
  expectedJson?: string;
  hidden?: boolean;
};

type SanityChallengeDoc = {
  _id: string;
  _type: string;
  slug?: { current?: string };
  config?: {
    codeEnabled?: boolean;
    codeLanguage?: string;
    starterCode?: string;
    codeTests?: SanityCodeTest[];
    requireSubmissionLink?: boolean;
  };
};

function parseJsonOrNull(raw: string | undefined): unknown {
  if (!raw?.trim()) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function registerChallengeConfigSyncRoutes(app: Hono): void {
  app.post(
    "/sync-challenge-config-from-sanity",
    withRouteErrorHandling(async (c) => {
      const prisma = getPrisma();

      const docs = (await sanityClient.fetch(
        `*[_type == "challenge"]{_id, _type, slug, config}`
      )) as SanityChallengeDoc[];

      let updated = 0;

      for (const doc of docs) {
        const slug = doc.slug?.current?.trim();
        const cfg = doc.config;
        if (!slug || !cfg?.codeEnabled) continue;

        const tests =
          cfg.codeTests?.map((t, idx) => {
            const input = parseJsonOrNull(t.inputJson);
            const expected = parseJsonOrNull(t.expectedJson);
            if (input === null || expected === null || !t.label) {
              return null;
            }
            return {
              id: t._key ?? String(idx),
              label: t.label,
              input,
              expectedOutput: expected,
              hidden: Boolean(t.hidden),
            };
          }).filter((t): t is NonNullable<typeof t> => t !== null) ?? [];

        const config = {
          kind: "code",
          language: cfg.codeLanguage ?? "typescript",
          starterCode: cfg.starterCode ?? "",
          tests,
          requireSubmissionLink: cfg.requireSubmissionLink ?? false,
        };

        const challenge = await prisma.challenge.findFirst({
          where: { OR: [{ slug }, { sanityId: doc._id }] },
        });
        if (!challenge) continue;

        await prisma.challenge.update({
          where: { id: challenge.id },
          data: { config },
        });
        updated += 1;
      }

      return c.json({ updated });
    })
  );
}

