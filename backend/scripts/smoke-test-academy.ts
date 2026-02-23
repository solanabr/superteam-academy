#!/usr/bin/env -S npx tsx
/// <reference types="node" />
import "dotenv/config";

const BASE_URL = (process.env.BACKEND_URL ?? "http://localhost:3001").replace(/\/$/, "");
const API_TOKEN = process.env.BACKEND_API_TOKEN;

if (!API_TOKEN) {
  console.error("BACKEND_API_TOKEN is required");
  process.exit(1);
}

const headers = {
  "Content-Type": "application/json",
  "X-API-Key": API_TOKEN,
};

const COURSE_ID = `smoke-${Date.now()}`;
const LEARNER_PUBKEY = process.env.SMOKE_LEARNER_PUBKEY ?? "11111111111111111111111111111111";

async function post(path: string, body: object): Promise<{ status: number; json: unknown }> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

async function main() {
  console.log("Smoke test: create-course, complete-lesson, finalize-course, issue-credential");
  console.log(`Base URL: ${BASE_URL}`);

  const healthRes = await fetch(`${BASE_URL}/v1/health`);
  if (healthRes.status !== 200) {
    const text = await healthRes.text();
    console.error("Health check failed:", healthRes.status, text);
    process.exit(1);
  }
  console.log("  /v1/health OK");

  const createRes = await post("/v1/academy/create-course", {
    courseId: COURSE_ID,
    lessonCount: 2,
    xpPerLesson: 50,
  });
  if (createRes.status !== 200) {
    console.error("create-course failed:", createRes.status, createRes.json);
    process.exit(1);
  }
  const lastTx = (createRes.json as { tx?: string }).tx;
  console.log("  create-course OK, tx:", lastTx?.slice(0, 16) + "...");

  const completeRes = await post("/v1/academy/complete-lesson", {
    courseId: COURSE_ID,
    learner: LEARNER_PUBKEY,
    lessonIndex: 0,
  });
  if (completeRes.status !== 200) {
    console.error("complete-lesson failed:", completeRes.status, completeRes.json);
    process.exit(1);
  }
  console.log("  complete-lesson(0) OK");

  const completeRes1 = await post("/v1/academy/complete-lesson", {
    courseId: COURSE_ID,
    learner: LEARNER_PUBKEY,
    lessonIndex: 1,
  });
  if (completeRes1.status !== 200) {
    console.error("complete-lesson(1) failed:", completeRes1.status, completeRes1.json);
    process.exit(1);
  }
  console.log("  complete-lesson(1) OK");

  const finalizeRes = await post("/v1/academy/finalize-course", {
    courseId: COURSE_ID,
    learner: LEARNER_PUBKEY,
  });
  if (finalizeRes.status !== 200) {
    console.error("finalize-course failed:", finalizeRes.status, finalizeRes.json);
    process.exit(1);
  }
  console.log("  finalize-course OK");

  const trackCollection = process.env.SMOKE_TRACK_COLLECTION;
  if (!trackCollection) {
    console.log("  Skipping issue-credential (SMOKE_TRACK_COLLECTION not set)");
  } else {
    const issueRes = await post("/v1/academy/issue-credential", {
      courseId: COURSE_ID,
      learner: LEARNER_PUBKEY,
      credentialName: "Smoke Test Credential",
      metadataUri: "https://example.com/smoke",
      coursesCompleted: 1,
      totalXp: 100,
      trackCollection,
    });
    if (issueRes.status !== 200) {
      console.error("issue-credential failed:", issueRes.status, issueRes.json);
      process.exit(1);
    }
    const asset = (issueRes.json as { credentialAsset?: string }).credentialAsset;
    console.log("  issue-credential OK, asset:", asset?.slice(0, 16) + "...");
  }

  console.log("Smoke test passed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
