import { NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { connection } from "@/lib/solana/connection";
import { XP_MINT_ADDRESS } from "@/lib/constants";

interface ActivityEvent {
  type:
    | "lesson_complete"
    | "course_finalize"
    | "credential_issued"
    | "xp_earned";
  user: string;
  detail: string;
  xp: number;
  timestamp: number;
  signature: string;
}

function shortenWallet(address: string): string {
  if (address.length <= 10) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

function parseLogForEventType(
  logs: string[],
): ActivityEvent["type"] {
  for (const log of logs) {
    if (log.includes("finalize_course") || log.includes("FinalizeCourse")) {
      return "course_finalize";
    }
    if (log.includes("issue_credential") || log.includes("IssueCredential")) {
      return "credential_issued";
    }
    if (log.includes("complete_lesson") || log.includes("CompleteLesson")) {
      return "lesson_complete";
    }
  }
  return "xp_earned";
}

function detailForType(type: ActivityEvent["type"]): string {
  switch (type) {
    case "lesson_complete":
      return "Completed a lesson";
    case "course_finalize":
      return "Finalized a course";
    case "credential_issued":
      return "Earned a credential";
    case "xp_earned":
      return "Earned XP";
  }
}

function xpForType(type: ActivityEvent["type"]): number {
  switch (type) {
    case "lesson_complete":
      return 40;
    case "course_finalize":
      return 500;
    case "credential_issued":
      return 0;
    case "xp_earned":
      return 25;
  }
}

let cache: { data: ActivityEvent[]; ts: number } | null = null;
const CACHE_TTL = 30_000;

export async function GET() {
  try {
    if (!XP_MINT_ADDRESS) {
      return NextResponse.json([], {
        headers: { "Cache-Control": "public, max-age=30" },
      });
    }

    if (cache && Date.now() - cache.ts < CACHE_TTL) {
      return NextResponse.json(cache.data, {
        headers: { "Cache-Control": "public, max-age=30" },
      });
    }

    const mint = new PublicKey(XP_MINT_ADDRESS);
    const signatures = await connection.getSignaturesForAddress(mint, {
      limit: 20,
    });

    const events: ActivityEvent[] = [];

    for (const sig of signatures) {
      try {
        const tx = await connection.getTransaction(sig.signature, {
          maxSupportedTransactionVersion: 0,
        });

        if (!tx?.meta) continue;

        const logs = tx.meta.logMessages ?? [];
        const type = parseLogForEventType(logs);

        // Extract the first signer as the user
        let user = "unknown";
        try {
          const msg = tx.transaction.message;
          const keys = msg.getAccountKeys
            ? msg.getAccountKeys()
            : null;
          const signerKey = keys
            ? keys.get(0)
            : (msg as unknown as { staticAccountKeys: PublicKey[] })
                .staticAccountKeys?.[0];
          if (signerKey) {
            user = shortenWallet(signerKey.toBase58());
          }
        } catch (error) {
          console.error("[activity-feed] Failed to extract signer:", error);
        }

        events.push({
          type,
          user,
          detail: detailForType(type),
          xp: xpForType(type),
          timestamp: (sig.blockTime ?? 0) * 1000,
          signature: sig.signature,
        });
      } catch (error) {
        console.error("[activity-feed] Failed to parse transaction:", error);
      }
    }

    cache = { data: events, ts: Date.now() };

    return NextResponse.json(events, {
      headers: { "Cache-Control": "public, max-age=30" },
    });
  } catch (err: unknown) {
    console.error("Activity feed error:", err);
    return NextResponse.json([], {
      headers: { "Cache-Control": "public, max-age=30" },
    });
  }
}
