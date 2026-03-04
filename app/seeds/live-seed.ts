/**
 * Live seed — runs alongside dev server, adding incremental data every ~15s.
 *
 * Weighted actions:
 *   30% — Add comment
 *   20% — Add XP event
 *   15% — Add notification
 *   10% — Complete daily challenge
 *   20% — Vote on thread/comment
 *    5% — Create new thread
 */

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const INTERVAL_MS = 15_000;

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickWeighted<T>(items: { weight: number; value: T }[]): T {
  const total = items.reduce((s, i) => s + i.weight, 0);
  let r = Math.random() * total;
  for (const item of items) {
    r -= item.weight;
    if (r <= 0) return item.value;
  }
  return items[items.length - 1].value;
}

async function getRandomUser() {
  const users = await prisma.user.findMany({
    select: { id: true, displayName: true },
  });
  return users[Math.floor(Math.random() * users.length)];
}

async function getRandomThread() {
  const threads = await prisma.thread.findMany({
    select: { id: true, title: true, authorId: true },
  });
  return threads.length > 0
    ? threads[Math.floor(Math.random() * threads.length)]
    : null;
}

// ── Actions ──────────────────────────────────────────────────────────────────

async function addComment() {
  const user = await getRandomUser();
  const thread = await getRandomThread();
  if (!user || !thread) return "skip (no data)";

  const bodies = [
    "Great explanation, thanks for sharing!",
    "I had the same question. This helped a lot.",
    "Has anyone tried this with the latest Anchor version?",
    "Interesting approach. I'd add error handling around the CPI call though.",
    "This is exactly what I was looking for!",
    "Could you elaborate on the PDA derivation part?",
    "Nice work! The token integration looks clean.",
    "I ran into a similar issue. Check your bump seed.",
    "Following this thread — really useful discussion.",
    "+1, would love to see a tutorial on this.",
  ];

  await prisma.comment.create({
    data: {
      threadId: thread.id,
      authorId: user.id,
      body: bodies[Math.floor(Math.random() * bodies.length)],
      depth: 0,
      path: `live_${Date.now()}`,
    },
  });
  await prisma.thread.update({
    where: { id: thread.id },
    data: { commentCount: { increment: 1 } },
  });
  return `comment by ${user.displayName} on "${thread.title}"`;
}

async function addXpEvent() {
  const user = await getRandomUser();
  if (!user) return "skip";

  const sources = ["lesson", "challenge", "streak", "daily_challenge", "bonus"];
  const source = sources[Math.floor(Math.random() * sources.length)];
  const amount = randomBetween(10, 80);

  await prisma.xPEvent.create({
    data: { userId: user.id, amount, source },
  });
  return `+${amount} XP (${source}) for ${user.displayName}`;
}

async function addNotification() {
  const user = await getRandomUser();
  if (!user) return "skip";

  const types = [
    {
      type: "xp_milestone",
      title: "XP Milestone!",
      body: "You've hit a new XP milestone.",
    },
    {
      type: "achievement",
      title: "Achievement Unlocked!",
      body: "You earned a new achievement.",
    },
    {
      type: "course_announcement",
      title: "New Content Available",
      body: "A course has been updated with new material.",
    },
    {
      type: "reply",
      title: "New Reply",
      body: "Someone replied to your discussion comment.",
    },
  ];
  const n = types[Math.floor(Math.random() * types.length)];

  await prisma.notification.create({
    data: {
      userId: user.id,
      type: n.type,
      title: n.title,
      body: n.body,
      data: { source: "live-seed" },
    },
  });
  return `${n.type} notification for ${user.displayName}`;
}

async function completeDailyChallenge() {
  const user = await getRandomUser();
  if (!user) return "skip";

  const today = new Date().toISOString().slice(0, 10);
  const existing = await prisma.dailyChallengeCompletion.findUnique({
    where: { userId_date: { userId: user.id, date: today } },
  });
  if (existing) return "skip (already completed today)";

  await prisma.dailyChallengeCompletion.create({
    data: {
      userId: user.id,
      challengeId: `daily_${today}`,
      date: today,
      xpEarned: randomBetween(15, 50),
      testsPassed: randomBetween(3, 5),
      totalTests: 5,
    },
  });
  return `daily challenge by ${user.displayName}`;
}

async function addVote() {
  const user = await getRandomUser();
  if (!user) return "skip";

  // 50/50 thread vs comment vote
  if (Math.random() > 0.5) {
    const thread = await getRandomThread();
    if (!thread || thread.authorId === user.id) return "skip";

    const existing = await prisma.threadVote.findUnique({
      where: { threadId_userId: { threadId: thread.id, userId: user.id } },
    });
    if (existing) return "skip (already voted)";

    const value = Math.random() > 0.2 ? 1 : -1;
    await prisma.threadVote.create({
      data: { threadId: thread.id, userId: user.id, value },
    });
    await prisma.thread.update({
      where: { id: thread.id },
      data: { voteScore: { increment: value } },
    });
    return `thread vote (${value > 0 ? "+" : ""}${value}) by ${user.displayName}`;
  } else {
    const comments = await prisma.comment.findMany({
      where: { authorId: { not: user.id } },
      select: { id: true },
      take: 20,
    });
    if (comments.length === 0) return "skip";

    const comment = comments[Math.floor(Math.random() * comments.length)];
    const existing = await prisma.commentVote.findUnique({
      where: { commentId_userId: { commentId: comment.id, userId: user.id } },
    });
    if (existing) return "skip (already voted)";

    const value = Math.random() > 0.2 ? 1 : -1;
    await prisma.commentVote.create({
      data: { commentId: comment.id, userId: user.id, value },
    });
    await prisma.comment.update({
      where: { id: comment.id },
      data: { voteScore: { increment: value } },
    });
    return `comment vote (${value > 0 ? "+" : ""}${value}) by ${user.displayName}`;
  }
}

async function createThread() {
  const user = await getRandomUser();
  if (!user) return "skip";

  const threads = [
    {
      title: "Tips for debugging Anchor programs?",
      tags: ["anchor", "debugging"],
    },
    { title: "What IDEs do you use for Solana dev?", tags: ["tooling", "ide"] },
    {
      title: "Favorite Solana DeFi protocols to study?",
      tags: ["defi", "learning"],
    },
    {
      title: "How to optimize CU usage in programs?",
      tags: ["optimization", "compute-units"],
    },
    {
      title: "Best practices for error handling in Anchor?",
      tags: ["anchor", "errors"],
    },
  ];
  const t = threads[Math.floor(Math.random() * threads.length)];

  await prisma.thread.create({
    data: {
      title: t.title,
      body: `Discussion: ${t.title}`,
      preview: t.title,
      scope: "community",
      category: ["Help", "General", "Ideas"][Math.floor(Math.random() * 3)],
      tags: t.tags,
      authorId: user.id,
    },
  });
  return `new thread "${t.title}" by ${user.displayName}`;
}

// ── Main loop ────────────────────────────────────────────────────────────────

const actions = [
  { weight: 30, value: addComment },
  { weight: 20, value: addXpEvent },
  { weight: 15, value: addNotification },
  { weight: 10, value: completeDailyChallenge },
  { weight: 20, value: addVote },
  { weight: 5, value: createThread },
];

let tick = 0;

async function runTick() {
  tick++;
  const action = pickWeighted(actions);
  try {
    const result = await action();
    const timestamp = new Date().toLocaleTimeString();
    console.log(`  [${timestamp}] #${tick}: ${result}`);
  } catch (err) {
    console.error(
      `  [tick ${tick}] Error:`,
      err instanceof Error ? err.message : err,
    );
  }
}

console.log("🌱 Live seed running — adding data every ~15s (Ctrl+C to stop)\n");

// Run immediately, then on interval
runTick();
const interval = setInterval(runTick, INTERVAL_MS);

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n\n🛑 Live seed stopped.");
  clearInterval(interval);
  await pool.end();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  clearInterval(interval);
  await pool.end();
  process.exit(0);
});
