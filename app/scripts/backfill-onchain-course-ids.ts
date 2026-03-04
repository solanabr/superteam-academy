import { eq } from "drizzle-orm"
import { db } from "@/drizzle/db"
import { CourseTable } from "@/drizzle/schema"

const MAX_ONCHAIN_ID_LENGTH = 32

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, MAX_ONCHAIN_ID_LENGTH)
}

function nextUnique(base: string, used: Set<string>) {
  let candidate = base
  let i = 2
  while (used.has(candidate)) {
    candidate = `${base}-${i}`
    i += 1
  }
  return candidate
}

async function main() {
  const apply = process.argv.includes("--apply")

  const courses = await db
    .select({
      id: CourseTable.id,
      name: CourseTable.name,
      slug: CourseTable.slug,
      onchainCourseId: CourseTable.onchainCourseId,
    })
    .from(CourseTable)

  const used = new Set(
    courses
      .map((c) => c.onchainCourseId?.trim())
      .filter((v): v is string => Boolean(v))
  )

  const updates: Array<{ id: string; name: string; from: string | null; to: string }> = []

  for (const course of courses) {
    const existing = course.onchainCourseId?.trim()
    // Skip if already set and within length limit
    if (existing && existing.length <= MAX_ONCHAIN_ID_LENGTH) continue

    // If already set but too long, truncate it
    const base = existing
      ? existing.slice(0, MAX_ONCHAIN_ID_LENGTH)
      :
      slugify(course.slug?.trim() || "") ||
      slugify(course.name) ||
      `course-${course.id.slice(0, 8)}`
    const generated = nextUnique(base, used)
    used.add(generated)

    updates.push({
      id: course.id,
      name: course.name,
      from: course.onchainCourseId,
      to: generated,
    })
  }

  if (updates.length === 0) {
    console.log("No courses with missing onchainCourseId.")
    return
  }

  console.log(
    `${apply ? "Applying" : "Dry run"}: ${updates.length} course on-chain ID backfill(s)`
  )
  for (const row of updates) {
    console.log(`- ${row.name}: ${row.from ?? "null"} -> ${row.to}`)
  }

  if (!apply) {
    console.log("")
    console.log("Run with --apply to persist changes:")
    console.log("npm run courses:backfill-onchain-ids -- --apply")
    return
  }

  for (const row of updates) {
    await db
      .update(CourseTable)
      .set({ onchainCourseId: row.to })
      .where(eq(CourseTable.id, row.id))
  }

  console.log("Done.")
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`Failed to backfill on-chain IDs: ${message}`)
  process.exit(1)
})
