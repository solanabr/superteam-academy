/* eslint-disable import/order -- vi.mock('server-only') must be hoisted above
   the store and route imports. */
import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

import { achievementsById, coursesById } from "@/lib/content/store";
import { GET as getAchievement } from "@/app/api/achievements/metadata/[id]/route";
import { GET as getCollection } from "@/app/api/certificates/metadata/[courseId]/route";
import {
  achievementMetadataUri,
  courseCollectionMetadataUri,
} from "../pinned-uri";

// The program caps an achievement type's URI at 128 bytes
// (MAX_ACHIEVEMENT_URI_LEN); the collection URI is held to the same bound.
const MAX_URI_BYTES = 128;
const PROD = "https://www.st.academy";

const achievementIds = [...achievementsById.keys()];
const courseIds = [...coursesById.keys()];

describe("every achievement and course in the bundle has metadata", () => {
  it("the bundle isn't empty", () => {
    expect(achievementIds.length).toBeGreaterThan(0);
    expect(courseIds.length).toBeGreaterThan(0);
  });

  it.each(achievementIds)("achievement %s resolves to 200", async (id) => {
    const uri = new URL(achievementMetadataUri(id, PROD));
    expect(new TextEncoder().encode(uri.href).length).toBeLessThanOrEqual(
      MAX_URI_BYTES
    );
    const res = await getAchievement(new NextRequest(uri), {
      params: Promise.resolve({
        id: decodeURIComponent(uri.pathname.split("/").pop() ?? ""),
      }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { name?: unknown; image?: unknown };
    expect(typeof body.name).toBe("string");
    expect(String(body.image)).toMatch(/^https?:\/\//);
  });

  it.each(courseIds)("course %s resolves to 200", async (id) => {
    const uri = new URL(courseCollectionMetadataUri(id, PROD));
    expect(new TextEncoder().encode(uri.href).length).toBeLessThanOrEqual(
      MAX_URI_BYTES
    );
    const res = await getCollection(new NextRequest(uri), {
      params: Promise.resolve({
        courseId: decodeURIComponent(uri.pathname.split("/").pop() ?? ""),
      }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { name?: unknown; image?: unknown };
    expect(typeof body.name).toBe("string");
    expect(String(body.image)).toMatch(/^https:\/\//);
  });
});
