/**
 * SP3-C Task 6 harness (UNCOMMITTED). READ-ONLY devnet inventory: for every
 * course in the committed bundle, fetch its on-chain Course account and report
 * (a) creator vs the bundle instructor wallet (#400 legacy-row inventory),
 * (b) content_tx_id vs the bundle SHA (per-course chain drift), (c) is_active.
 * getAccountInfo only — no writes, no signer.
 */
import { readFileSync } from "fs";
import { describe, it, vi } from "vitest";
import { Connection } from "@solana/web3.js";

vi.mock("server-only", () => ({}));

function envVal(name: string): string {
  const line = readFileSync("./.env.local", "utf8")
    .split("\n")
    .find((l) => l.startsWith(`${name}=`));
  if (!line) throw new Error(`${name} not in .env.local`);
  return line.slice(name.length + 1).trim();
}

interface BundleCourse {
  _id: string;
  title: string;
  instructor?: { _ref?: string } | string | null;
}
interface Instructor {
  _id: string;
  wallet?: string | null;
}

describe("devnet per-course inventory (read-only)", () => {
  it("creator + content_tx_id vs bundle, per course", async () => {
    const { fetchCourse } = await import("@/lib/solana/academy-reads");
    const { getProgramId } = await import("@/lib/solana/pda");
    const { contentTxIdMatchesHead } =
      await import("@/lib/github/content-commit");
    const { SYNCED_SHA } = await import("@/lib/content/meta");

    const courses = JSON.parse(
      readFileSync("./src/content/generated/courses.json", "utf8")
    ) as BundleCourse[];
    const instructors = JSON.parse(
      readFileSync("./src/content/generated/instructors.json", "utf8")
    ) as Instructor[];
    const walletByInstructor = new Map(
      instructors.map((i) => [i._id, i.wallet ?? null])
    );

    const connection = new Connection(envVal("SOLANA_RPC_URL"), "confirmed");
    const programId = getProgramId();
    console.log(`BUNDLE_SHA=${SYNCED_SHA} PROGRAM=${programId.toBase58()}`);

    for (const course of courses) {
      const ref =
        typeof course.instructor === "object" && course.instructor
          ? course.instructor._ref
          : undefined;
      const bundleWallet = ref ? (walletByInstructor.get(ref) ?? null) : null;
      const onChain = (await fetchCourse(
        course._id,
        connection,
        programId
      )) as {
        creator?: { toBase58?: () => string };
        content_tx_id?: number[] | Uint8Array;
        is_active?: boolean;
        xp_per_lesson?: number;
        lesson_count?: number;
      } | null;
      if (!onChain) {
        console.log(
          `${course._id}: NOT_DEPLOYED (bundleWallet=${bundleWallet})`
        );
        continue;
      }
      const creator = onChain.creator?.toBase58?.() ?? String(onChain.creator);
      const creatorMatch = bundleWallet !== null && creator === bundleWallet;
      const txCurrent = onChain.content_tx_id
        ? contentTxIdMatchesHead(onChain.content_tx_id, SYNCED_SHA)
        : false;
      console.log(
        `${course._id}: creator=${creator} bundleWallet=${bundleWallet} ` +
          `creatorMatch=${creatorMatch} contentTxCurrent=${txCurrent} ` +
          `active=${onChain.is_active} lessons=${onChain.lesson_count} xp=${onChain.xp_per_lesson}`
      );
    }
  }, 60000);
});
