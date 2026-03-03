# Fold Backend into Next.js API Routes

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove the Express backend as a required deploy target by moving all Anchor signing logic directly into Next.js API route handlers, enabling full deployment on Vercel (no Railway/Render needed).

**Architecture:** Create `app/src/lib/anchor-server.ts` as a server-only module that loads the Anchor `Program` instance using `BACKEND_KEYPAIR` from env vars. Rewrite 3 existing proxy route handlers to call Anchor directly. The `backend/` directory stays in repo untouched as an optional alternative.

**Tech Stack:** Next.js 16 App Router, `@coral-xyz/anchor` 0.32, `@solana/web3.js`, `@solana/spl-token`, TypeScript strict

---

## Already in place (don't recreate)

- `app/src/lib/onchain_academy.json` — Anchor IDL
- `app/src/lib/idl.ts` — exports IDL
- `app/src/lib/pda.ts` — all PDA helpers (findConfigPDA, findCoursePDA, findEnrollmentPDA, findAchievementTypePDA, findAchievementReceiptPDA, findMinterRolePDA)
- `app/src/lib/solana.ts` — PROGRAM_ID, TOKEN_2022_PROGRAM_ID, MPL_CORE_PROGRAM_ID, getConnectionEndpoint()

---

## Task 1: Create `anchor-server.ts` — server-side Anchor program factory

**Files:**
- Create: `app/src/lib/anchor-server.ts`

This file is the equivalent of `backend/src/program.ts`. It must only ever run server-side (API routes). It reads env vars without `NEXT_PUBLIC_` prefix for secrets.

**Step 1: Create the file**

```typescript
// app/src/lib/anchor-server.ts
import { Program, AnchorProvider, Wallet } from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey, Transaction } from "@solana/web3.js";
import {
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";
import { IDL } from "./idl";
import {
  PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  MPL_CORE_PROGRAM_ID,
  getConnectionEndpoint,
} from "./solana";

export { PROGRAM_ID, TOKEN_2022_PROGRAM_ID, MPL_CORE_PROGRAM_ID };

// ─── Keypair ──────────────────────────────────────────────────────────────────

export function loadBackendKeypair(): Keypair {
  const raw = process.env.BACKEND_KEYPAIR;
  if (!raw) throw new Error("BACKEND_KEYPAIR env var not set");
  return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(raw) as number[]));
}

// ─── XP Mint ─────────────────────────────────────────────────────────────────

export function getXpMintPubkey(): PublicKey {
  const raw = process.env.NEXT_PUBLIC_XP_MINT;
  if (!raw) throw new Error("NEXT_PUBLIC_XP_MINT env var not set");
  return new PublicKey(raw);
}

// ─── Track collections ────────────────────────────────────────────────────────

export function getTrackCollection(trackId: number): PublicKey | null {
  const raw = process.env.NEXT_PUBLIC_TRACK_COLLECTIONS ?? "";
  const addrs = raw.split(",").map((s) => s.trim()).filter(Boolean);
  const addr = addrs[trackId - 1];
  if (!addr) return null;
  try {
    return new PublicKey(addr);
  } catch {
    return null;
  }
}

// ─── Achievement collections ──────────────────────────────────────────────────

export function getAchievementCollection(achievementId: string): PublicKey | null {
  const envKey = `ACHIEVEMENT_${achievementId.toUpperCase().replace(/-/g, "_")}`;
  const addr = process.env[envKey];
  if (!addr) return null;
  try {
    return new PublicKey(addr);
  } catch {
    return null;
  }
}

// ─── Credential metadata ──────────────────────────────────────────────────────

const TRACK_NAMES = [
  "Solana Basics Developer",
  "Anchor Framework Developer",
  "DeFi & AMMs Developer",
  "NFTs & Digital Assets Developer",
  "Full-Stack Solana Developer",
];

export function getCredentialMeta(
  trackId: number,
  coursesCompleted: number,
  totalXp: number,
): { name: string; uri: string; coursesCompleted: number; totalXp: number } {
  const uri =
    process.env[`TRACK_URI_${trackId}`] ??
    `https://arweave.net/placeholder-track-${trackId}`;
  return {
    name: TRACK_NAMES[trackId - 1] ?? `Track ${trackId} Developer`,
    uri,
    coursesCompleted,
    totalXp,
  };
}

// ─── Program factory ──────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AcademyProgram = Program<any>;

export function getAnchorProgram(): {
  program: AcademyProgram;
  backendKeypair: Keypair;
  connection: Connection;
} {
  const backendKeypair = loadBackendKeypair();
  const connection = new Connection(getConnectionEndpoint(), "confirmed");
  const wallet = new Wallet(backendKeypair);
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
    skipPreflight: false,
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const program = new Program(IDL as any, provider) as AcademyProgram;
  return { program, backendKeypair, connection };
}

// ─── ATA helper ───────────────────────────────────────────────────────────────

/** Ensure a Token-2022 ATA exists, creating it on-chain if necessary. */
export async function ensureXpAta(
  connection: Connection,
  payer: Keypair,
  owner: PublicKey,
  mint: PublicKey,
): Promise<PublicKey> {
  const ata = getAssociatedTokenAddressSync(mint, owner, false, TOKEN_2022_PROGRAM_ID);
  const info = await connection.getAccountInfo(ata);
  if (info) return ata;

  const ix = createAssociatedTokenAccountInstruction(
    payer.publicKey,
    ata,
    owner,
    mint,
    TOKEN_2022_PROGRAM_ID,
  );
  const tx = new Transaction().add(ix);
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
  tx.recentBlockhash = blockhash;
  tx.feePayer = payer.publicKey;
  tx.sign(payer);
  const sig = await connection.sendRawTransaction(tx.serialize());
  await connection.confirmTransaction(
    { signature: sig, blockhash, lastValidBlockHeight },
    "confirmed",
  );
  return ata;
}

// ─── Error serializer ─────────────────────────────────────────────────────────

export function serializeAnchorError(err: unknown): string {
  if (err instanceof Error) {
    const logs = (err as unknown as { logs?: string[] }).logs;
    if (logs?.length) return `${err.message}\n${logs.join("\n")}`;
    return err.message;
  }
  return String(err);
}
```

**Step 2: Verify TypeScript compiles**

```bash
cd app && npx tsc --noEmit
```

Expected: 0 errors.

**Step 3: Commit**

```bash
git add app/src/lib/anchor-server.ts
git commit -m "feat: add anchor-server.ts — server-side Anchor program factory"
```

---

## Task 2: Rewrite `/api/lessons/complete/route.ts`

**Files:**
- Modify: `app/src/app/api/lessons/complete/route.ts`

Replace proxy fetch with direct Anchor call. Logic matches `backend/src/routes/lessons.ts` POST `/complete` handler exactly.

**Step 1: Rewrite the route**

```typescript
// app/src/app/api/lessons/complete/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import {
  getAnchorProgram,
  getXpMintPubkey,
  getAchievementCollection,
  ensureXpAta,
  serializeAnchorError,
  TOKEN_2022_PROGRAM_ID,
  MPL_CORE_PROGRAM_ID,
} from "@/lib/anchor-server";
import {
  findConfigPDA,
  findCoursePDA,
  findEnrollmentPDA,
  findAchievementTypePDA,
  findAchievementReceiptPDA,
  findMinterRolePDA,
} from "@/lib/pda";

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    courseId?: string;
    lessonIndex?: number;
    learnerWallet?: string;
  };
  const { courseId, lessonIndex, learnerWallet } = body;

  if (!courseId || lessonIndex === undefined || !learnerWallet) {
    return NextResponse.json(
      { error: "Missing courseId, lessonIndex, or learnerWallet" },
      { status: 400 },
    );
  }

  let learner: PublicKey;
  try {
    learner = new PublicKey(learnerWallet);
  } catch {
    return NextResponse.json({ error: "Invalid learnerWallet pubkey" }, { status: 400 });
  }

  try {
    const { program, backendKeypair, connection } = getAnchorProgram();
    const xpMint = getXpMintPubkey();

    const [configPda] = findConfigPDA();
    const [coursePda] = findCoursePDA(courseId);
    const [enrollmentPda] = findEnrollmentPDA(courseId, learner);

    const learnerXpAta = await ensureXpAta(connection, backendKeypair, learner, xpMint);

    const signature = await program.methods
      .completeLesson(lessonIndex)
      .accountsPartial({
        config: configPda,
        course: coursePda,
        enrollment: enrollmentPda,
        learner,
        learnerTokenAccount: learnerXpAta,
        xpMint,
        backendSigner: backendKeypair.publicKey,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
      })
      .signers([backendKeypair])
      .rpc();

    // Best-effort achievement auto-award
    const awarded: Array<{ id: string; asset: string }> = [];
    try {
      const xpBalance = await connection.getTokenAccountBalance(learnerXpAta);
      const currentXp = xpBalance.value.uiAmount ?? 0;
      const toAward = ["first-lesson"];
      if (currentXp >= 100) toAward.push("xp-100");
      if (currentXp >= 500) toAward.push("xp-500");
      if (currentXp >= 1000) toAward.push("xp-1000");
      if (currentXp >= 2500) toAward.push("xp-2500");

      const results = await Promise.all(
        toAward.map(async (id) => {
          const result = await tryAwardAchievement(id, learnerWallet, program, backendKeypair, connection, xpMint);
          return result.awarded && result.asset ? { id, asset: result.asset } : null;
        }),
      );
      awarded.push(...results.filter((r): r is { id: string; asset: string } => r !== null));
    } catch {
      // best-effort — don't fail the lesson completion
    }

    return NextResponse.json({ success: true, signature, achievements: awarded });
  } catch (err) {
    const msg = serializeAnchorError(err);
    console.error("[api/lessons/complete]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ─── Shared achievement helper (inline — avoids circular imports) ──────────────

async function tryAwardAchievement(
  achievementId: string,
  recipientWallet: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  program: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  backendKeypair: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  connection: any,
  xpMint: PublicKey,
): Promise<{ awarded: boolean; signature?: string; asset?: string }> {
  let recipient: PublicKey;
  try {
    recipient = new PublicKey(recipientWallet);
  } catch {
    return { awarded: false };
  }

  const collection = getAchievementCollection(achievementId);
  if (!collection) return { awarded: false };

  try {
    const [configPda] = findConfigPDA();
    const [achievementTypePda] = findAchievementTypePDA(achievementId);
    const [achievementReceiptPda] = findAchievementReceiptPDA(achievementId, recipient);
    const [minterRolePda] = findMinterRolePDA(backendKeypair.publicKey);

    const receiptInfo = await connection.getAccountInfo(achievementReceiptPda);
    if (receiptInfo) return { awarded: false };

    const recipientTokenAccount = await ensureXpAta(connection, backendKeypair, recipient, xpMint);
    const { Keypair } = await import("@solana/web3.js");
    const assetKp = Keypair.generate();

    const signature = await program.methods
      .awardAchievement()
      .accountsPartial({
        config: configPda,
        achievementType: achievementTypePda,
        achievementReceipt: achievementReceiptPda,
        minterRole: minterRolePda,
        asset: assetKp.publicKey,
        collection,
        recipient,
        recipientTokenAccount,
        xpMint,
        payer: backendKeypair.publicKey,
        minter: backendKeypair.publicKey,
        mplCoreProgram: MPL_CORE_PROGRAM_ID,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([backendKeypair, assetKp])
      .rpc();

    return { awarded: true, signature, asset: assetKp.publicKey.toBase58() };
  } catch {
    return { awarded: false };
  }
}
```

**Step 2: Verify TypeScript**

```bash
cd app && npx tsc --noEmit
```

Expected: 0 errors.

**Step 3: Commit**

```bash
git add app/src/app/api/lessons/complete/route.ts
git commit -m "feat: inline complete_lesson Anchor call in Next.js API route"
```

---

## Task 3: Rewrite `/api/lessons/finalize/route.ts`

**Files:**
- Modify: `app/src/app/api/lessons/finalize/route.ts`

**Step 1: Rewrite the route**

```typescript
// app/src/app/api/lessons/finalize/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import {
  getAnchorProgram,
  getXpMintPubkey,
  getTrackCollection,
  getCredentialMeta,
  getAchievementCollection,
  ensureXpAta,
  serializeAnchorError,
  TOKEN_2022_PROGRAM_ID,
  MPL_CORE_PROGRAM_ID,
} from "@/lib/anchor-server";
import {
  findConfigPDA,
  findCoursePDA,
  findEnrollmentPDA,
  findAchievementTypePDA,
  findAchievementReceiptPDA,
  findMinterRolePDA,
} from "@/lib/pda";

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    courseId?: string;
    learnerWallet?: string;
  };
  const { courseId, learnerWallet } = body;

  if (!courseId || !learnerWallet) {
    return NextResponse.json(
      { error: "Missing courseId or learnerWallet" },
      { status: 400 },
    );
  }

  let learner: PublicKey;
  try {
    learner = new PublicKey(learnerWallet);
  } catch {
    return NextResponse.json({ error: "Invalid learnerWallet pubkey" }, { status: 400 });
  }

  try {
    const { program, backendKeypair, connection } = getAnchorProgram();
    const xpMint = getXpMintPubkey();

    const [configPda] = findConfigPDA();
    const [coursePda] = findCoursePDA(courseId);
    const [enrollmentPda] = findEnrollmentPDA(courseId, learner);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const course = await (program as any).account.course.fetch(coursePda) as any;
    const creator: PublicKey = course.creator as PublicKey;

    const [learnerXpAta, creatorXpAta] = await Promise.all([
      ensureXpAta(connection, backendKeypair, learner, xpMint),
      ensureXpAta(connection, backendKeypair, creator, xpMint),
    ]);

    const finalizeSignature: string = await program.methods
      .finalizeCourse()
      .accountsPartial({
        config: configPda,
        course: coursePda,
        enrollment: enrollmentPda,
        learner,
        learnerTokenAccount: learnerXpAta,
        creatorTokenAccount: creatorXpAta,
        creator,
        xpMint,
        backendSigner: backendKeypair.publicKey,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
      })
      .signers([backendKeypair])
      .rpc();

    // ── Issue or upgrade credential (best-effort) ─────────────────────────────
    let credentialSignature: string | undefined;
    let credentialAsset: string | undefined;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const enrollment = await (program as any).account.enrollment.fetch(enrollmentPda) as any;
      const trackId: number = course.trackId as number;
      const trackCollection = getTrackCollection(trackId);

      if (trackCollection) {
        const meta = getCredentialMeta(trackId, 1, 0);

        if (!enrollment.credentialAsset) {
          const credentialAssetKp = Keypair.generate();
          credentialSignature = await program.methods
            .issueCredential(meta.name, meta.uri, meta.coursesCompleted, new BN(meta.totalXp))
            .accountsPartial({
              config: configPda,
              course: coursePda,
              enrollment: enrollmentPda,
              learner,
              credentialAsset: credentialAssetKp.publicKey,
              trackCollection,
              payer: backendKeypair.publicKey,
              backendSigner: backendKeypair.publicKey,
              mplCoreProgram: MPL_CORE_PROGRAM_ID,
              systemProgram: SystemProgram.programId,
            })
            .signers([backendKeypair, credentialAssetKp])
            .rpc();
          credentialAsset = credentialAssetKp.publicKey.toBase58();
        } else {
          const existingAsset = new PublicKey(enrollment.credentialAsset as PublicKey);
          credentialSignature = await program.methods
            .upgradeCredential(meta.name, meta.uri, meta.coursesCompleted, new BN(meta.totalXp))
            .accountsPartial({
              config: configPda,
              course: coursePda,
              enrollment: enrollmentPda,
              learner,
              credentialAsset: existingAsset,
              trackCollection,
              payer: backendKeypair.publicKey,
              backendSigner: backendKeypair.publicKey,
              mplCoreProgram: MPL_CORE_PROGRAM_ID,
              systemProgram: SystemProgram.programId,
            })
            .signers([backendKeypair])
            .rpc();
          credentialAsset = existingAsset.toBase58();
        }
      }
    } catch {
      // best-effort credential issuance
    }

    // ── Best-effort first-course achievement ──────────────────────────────────
    const achievements: Array<{ id: string; asset: string }> = [];
    try {
      const collection = getAchievementCollection("first-course");
      if (collection) {
        const recipient = learner;
        const [configPda2] = findConfigPDA();
        const [achievementTypePda] = findAchievementTypePDA("first-course");
        const [achievementReceiptPda] = findAchievementReceiptPDA("first-course", recipient);
        const [minterRolePda] = findMinterRolePDA(backendKeypair.publicKey);

        const receiptInfo = await connection.getAccountInfo(achievementReceiptPda);
        if (!receiptInfo) {
          const recipientTokenAccount = await ensureXpAta(connection, backendKeypair, recipient, xpMint);
          const assetKp = Keypair.generate();
          const sig = await program.methods
            .awardAchievement()
            .accountsPartial({
              config: configPda2,
              achievementType: achievementTypePda,
              achievementReceipt: achievementReceiptPda,
              minterRole: minterRolePda,
              asset: assetKp.publicKey,
              collection,
              recipient,
              recipientTokenAccount,
              xpMint,
              payer: backendKeypair.publicKey,
              minter: backendKeypair.publicKey,
              mplCoreProgram: MPL_CORE_PROGRAM_ID,
              tokenProgram: TOKEN_2022_PROGRAM_ID,
              systemProgram: SystemProgram.programId,
            })
            .signers([backendKeypair, assetKp])
            .rpc();
          achievements.push({ id: "first-course", asset: assetKp.publicKey.toBase58() });
          void sig;
        }
      }
    } catch {
      // best-effort
    }

    return NextResponse.json({
      success: true,
      finalized: true,
      finalizeSignature,
      credentialSignature,
      credentialAsset,
      achievements,
    });
  } catch (err) {
    const msg = serializeAnchorError(err);
    console.error("[api/lessons/finalize]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
```

**Step 2: Verify TypeScript**

```bash
cd app && npx tsc --noEmit
```

Expected: 0 errors.

**Step 3: Commit**

```bash
git add app/src/app/api/lessons/finalize/route.ts
git commit -m "feat: inline finalize_course + issue_credential Anchor calls in Next.js API route"
```

---

## Task 4: Rewrite `/api/achievements/award/route.ts`

**Files:**
- Modify: `app/src/app/api/achievements/award/route.ts`

**Step 1: Rewrite the route**

```typescript
// app/src/app/api/achievements/award/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import {
  getAnchorProgram,
  getXpMintPubkey,
  getAchievementCollection,
  ensureXpAta,
  serializeAnchorError,
  TOKEN_2022_PROGRAM_ID,
  MPL_CORE_PROGRAM_ID,
} from "@/lib/anchor-server";
import {
  findConfigPDA,
  findAchievementTypePDA,
  findAchievementReceiptPDA,
  findMinterRolePDA,
} from "@/lib/pda";

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    achievementId?: string;
    walletAddress?: string;
    recipientWallet?: string;
  };
  // Support both field names used across the codebase
  const achievementId = body.achievementId;
  const recipientWallet = body.walletAddress ?? body.recipientWallet;

  if (!achievementId || !recipientWallet) {
    return NextResponse.json(
      { error: "Missing achievementId or walletAddress" },
      { status: 400 },
    );
  }

  let recipient: PublicKey;
  try {
    recipient = new PublicKey(recipientWallet);
  } catch {
    return NextResponse.json({ error: "Invalid wallet pubkey" }, { status: 400 });
  }

  const collection = getAchievementCollection(achievementId);
  if (!collection) {
    // Collection not configured — silently succeed (not an error, just not set up yet)
    return NextResponse.json({ success: true, awarded: false });
  }

  try {
    const { program, backendKeypair, connection } = getAnchorProgram();
    const xpMint = getXpMintPubkey();

    const [configPda] = findConfigPDA();
    const [achievementTypePda] = findAchievementTypePDA(achievementId);
    const [achievementReceiptPda] = findAchievementReceiptPDA(achievementId, recipient);
    const [minterRolePda] = findMinterRolePDA(backendKeypair.publicKey);

    // Skip if already awarded — prevents duplicate TX fees
    const receiptInfo = await connection.getAccountInfo(achievementReceiptPda);
    if (receiptInfo) {
      return NextResponse.json({ success: true, awarded: false });
    }

    const recipientTokenAccount = await ensureXpAta(connection, backendKeypair, recipient, xpMint);
    const assetKp = Keypair.generate();

    const signature = await program.methods
      .awardAchievement()
      .accountsPartial({
        config: configPda,
        achievementType: achievementTypePda,
        achievementReceipt: achievementReceiptPda,
        minterRole: minterRolePda,
        asset: assetKp.publicKey,
        collection,
        recipient,
        recipientTokenAccount,
        xpMint,
        payer: backendKeypair.publicKey,
        minter: backendKeypair.publicKey,
        mplCoreProgram: MPL_CORE_PROGRAM_ID,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([backendKeypair, assetKp])
      .rpc();

    return NextResponse.json({
      success: true,
      awarded: true,
      signature,
      asset: assetKp.publicKey.toBase58(),
    });
  } catch (err) {
    const msg = serializeAnchorError(err);
    console.error("[api/achievements/award]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
```

**Step 2: Verify TypeScript**

```bash
cd app && npx tsc --noEmit
```

Expected: 0 errors.

**Step 3: Commit**

```bash
git add app/src/app/api/achievements/award/route.ts
git commit -m "feat: inline award_achievement Anchor call in Next.js API route"
```

---

## Task 5: Update `.env.local.example`

**Files:**
- Modify: `app/.env.local.example`

**Step 1: Replace the backend section**

Find this block:
```
# ─── Backend Signing Service ──────────────────────────────────────────────────
# URL of the deployed backend (backend/ directory). For local dev: http://localhost:3001
# For production: https://your-backend.railway.app (deploy backend/ to Railway/Render/Fly.io)
BACKEND_URL=http://localhost:3001
```

Replace with:
```
# ─── Backend Signing Service (server-side only — NOT exposed to client) ────────
# JSON byte array from: solana-keygen new --outfile keypair.json && cat keypair.json
# This keypair must be the registered backend_signer in the on-chain Config account.
BACKEND_KEYPAIR=[1,2,3,...]
```

**Step 2: Verify TypeScript still passes**

```bash
cd app && npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add app/.env.local.example
git commit -m "docs: replace BACKEND_URL with BACKEND_KEYPAIR in env example"
```

---

## Task 6: Final verification — build must pass

**Step 1: Full production build**

```bash
cd app && npm run build
```

Expected output: Build completes with 0 errors. Routes `/api/lessons/complete`, `/api/lessons/finalize`, `/api/achievements/award` appear in the build output.

**Step 2: Check no references to BACKEND_URL remain in app/**

```bash
grep -r "BACKEND_URL" app/src/
```

Expected: no output (0 matches).

**Step 3: Commit if anything was missed**

```bash
git add -p
git commit -m "chore: remove remaining BACKEND_URL references"
```

---

## Vercel deploy checklist (after merging)

Add these env vars in Vercel dashboard (Settings → Environment Variables):

| Key | Value | Visibility |
|---|---|---|
| `BACKEND_KEYPAIR` | `[1,2,3,...]` (from keypair JSON) | **Server only** |
| `NEXT_PUBLIC_XP_MINT` | XP mint address | All |
| `NEXT_PUBLIC_TRACK_COLLECTIONS` | comma-separated collection addresses | All |
| `ACHIEVEMENT_FIRST_LESSON` | achievement collection address | Server only |
| `ACHIEVEMENT_XP_100` | ... | Server only |
| `NEXT_PUBLIC_RPC_URL` | Helius RPC URL | All |

`BACKEND_URL` — **remove** if it was previously set.
