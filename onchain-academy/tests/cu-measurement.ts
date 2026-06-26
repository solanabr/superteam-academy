/**
 * Per-instruction compute-unit (CU) measurement (#121 / P1-5).
 *
 * Runs the program in an in-process LiteSVM (no validator) and records the
 * compute units each instruction consumes. LiteSVM reports `computeUnitsConsumed`
 * directly, so the numbers are deterministic and CI-friendly. Writes a baseline
 * table to `CU_BASELINE.md`.
 *
 * Run: `pnpm exec ts-mocha -p ./tsconfig.json -t 1000000 tests/cu-measurement.ts`
 * (in-process — does NOT need `anchor test` / a local validator).
 */

import { LiteSVM, FailedTransactionMetadata } from "litesvm";
import { LiteSVMProvider } from "anchor-litesvm";
import * as anchor from "@coral-xyz/anchor";
import {
  Keypair,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import BN from "bn.js";
import { readFileSync, writeFileSync } from "fs";
import * as path from "path";

// ts-mocha runs from the onchain-academy package root.
const ROOT = process.cwd();
const idl = JSON.parse(
  readFileSync(path.join(ROOT, "target/idl/onchain_academy.json"), "utf8")
);
const PROGRAM_ID = new PublicKey(idl.address);
const MPL_CORE = new PublicKey("CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d");

interface Row {
  name: string;
  cu: number | null;
  note?: string;
}

describe("CU measurement (#121)", () => {
  const svm = new LiteSVM();
  svm.addProgramFromFile(
    PROGRAM_ID,
    path.join(ROOT, "target/deploy/onchain_academy.so")
  );
  svm.addProgramFromFile(
    MPL_CORE,
    path.join(ROOT, "tests/fixtures/mpl_core.so")
  );

  const authority = Keypair.generate();
  svm.airdrop(authority.publicKey, BigInt(1000 * LAMPORTS_PER_SOL));

  const wallet = new anchor.Wallet(authority);
  const provider = new LiteSVMProvider(svm as never, wallet);
  const program = new anchor.Program(idl, provider as never);

  const rows: Row[] = [];

  function record(
    name: string,
    ix: anchor.web3.TransactionInstruction,
    signers: Keypair[]
  ) {
    const tx = new Transaction().add(ix);
    tx.recentBlockhash = svm.latestBlockhash();
    tx.feePayer = authority.publicKey;
    tx.sign(authority, ...signers);
    const res = svm.sendTransaction(tx);
    if (res instanceof FailedTransactionMetadata) {
      rows.push({ name, cu: null, note: res.err().toString().slice(0, 80) });
      // eslint-disable-next-line no-console
      console.log(
        `  ${name.padEnd(28)} FAILED: ${res.err().toString().slice(0, 80)}`
      );
    } else {
      const cu = Number(res.computeUnitsConsumed());
      rows.push({ name, cu });
      // eslint-disable-next-line no-console
      console.log(`  ${name.padEnd(28)} ${cu} CU`);
    }
  }

  async function measure(
    name: string,
    builder: { instruction: () => Promise<anchor.web3.TransactionInstruction> },
    signers: Keypair[] = []
  ) {
    try {
      record(name, await builder.instruction(), signers);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      rows.push({ name, cu: null, note: msg.slice(0, 80) });
      // eslint-disable-next-line no-console
      console.log(`  ${name.padEnd(28)} ERROR: ${msg.slice(0, 80)}`);
    }
  }

  // PDAs
  const [configPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    PROGRAM_ID
  );
  const [backendMinterRole] = PublicKey.findProgramAddressSync(
    [Buffer.from("minter"), authority.publicKey.toBuffer()],
    PROGRAM_ID
  );
  const courseId = "cu-course";
  const [coursePda] = PublicKey.findProgramAddressSync(
    [Buffer.from("course"), Buffer.from(courseId)],
    PROGRAM_ID
  );

  it("measures per-instruction CU and writes the baseline", async () => {
    const xpMint = Keypair.generate();
    await measure(
      "initialize",
      program.methods.initialize().accountsPartial({
        config: configPda,
        xpMint: xpMint.publicKey,
        authority: authority.publicKey,
        backendMinterRole,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
      }),
      [xpMint]
    );

    await measure(
      "update_config (pause)",
      program.methods
        .updateConfig({ newBackendSigner: null, paused: true })
        .accountsPartial({ config: configPda, authority: authority.publicKey })
    );
    await measure(
      "update_config (resume)",
      program.methods
        .updateConfig({ newBackendSigner: null, paused: false })
        .accountsPartial({ config: configPda, authority: authority.publicKey })
    );

    await measure(
      "create_course",
      program.methods
        .createCourse({
          courseId,
          creator: authority.publicKey,
          contentTxId: new Array(32).fill(1),
          lessonCount: 3,
          difficulty: 2,
          xpPerLesson: 100,
          trackId: 1,
          trackLevel: 1,
          prerequisite: null,
          creatorRewardXp: 50,
          minCompletionsForReward: 1,
          collection: null,
        })
        .accountsPartial({
          course: coursePda,
          config: configPda,
          authority: authority.publicKey,
          systemProgram: SystemProgram.programId,
        })
    );

    // --- course lifecycle ---
    await measure(
      "update_course",
      program.methods
        .updateCourse({
          newContentTxId: new Array(32).fill(2),
          newIsActive: null,
          newXpPerLesson: null,
          newCreatorRewardXp: null,
          newMinCompletionsForReward: null,
          newCollection: null,
        })
        .accountsPartial({
          course: coursePda,
          config: configPda,
          authority: authority.publicKey,
        })
    );

    // --- minter lifecycle ---
    const minter1 = Keypair.generate();
    const [minter1Role] = PublicKey.findProgramAddressSync(
      [Buffer.from("minter"), minter1.publicKey.toBuffer()],
      PROGRAM_ID
    );
    await measure(
      "register_minter",
      program.methods
        .registerMinter({
          minter: minter1.publicKey,
          label: "cu-test",
          maxXpPerCall: new BN(0),
          maxTotalXp: new BN(0),
        })
        .accountsPartial({
          config: configPda,
          minterRole: minter1Role,
          authority: authority.publicKey,
          payer: authority.publicKey,
          systemProgram: SystemProgram.programId,
        })
    );
    await measure(
      "update_minter",
      program.methods
        .updateMinter({
          maxXpPerCall: new BN(10),
          maxTotalXp: new BN(100),
        })
        .accountsPartial({
          config: configPda,
          minterRole: minter1Role,
          authority: authority.publicKey,
        })
    );
    await measure(
      "revoke_minter",
      program.methods.revokeMinter().accountsPartial({
        config: configPda,
        minterRole: minter1Role,
        authority: authority.publicKey,
      })
    );

    // --- enrollment lifecycle ---
    const learner1 = Keypair.generate();
    svm.airdrop(learner1.publicKey, BigInt(10 * LAMPORTS_PER_SOL));
    const [enroll1] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("enrollment"),
        Buffer.from(courseId),
        learner1.publicKey.toBuffer(),
      ],
      PROGRAM_ID
    );
    await measure(
      "enroll",
      program.methods.enroll(courseId).accountsPartial({
        course: coursePda,
        enrollment: enroll1,
        learner: learner1.publicKey,
        systemProgram: SystemProgram.programId,
      }),
      [learner1]
    );
    // (close_enrollment is deferred — it requires a finalized enrollment,
    // which depends on the Token-2022 mint flow; see the deferred list below.)

    // close_course last.
    await measure(
      "close_course",
      program.methods.closeCourse(courseId).accountsPartial({
        config: configPda,
        course: coursePda,
        authority: authority.publicKey,
      })
    );

    // Write the baseline table.
    const measured = rows.filter((r) => r.cu !== null);
    const lines = [
      "# Per-instruction Compute-Unit (CU) Baseline (#121 / P1-5)",
      "",
      "Captured with an in-process **LiteSVM** harness (`tests/cu-measurement.ts`)",
      "against a release SBF build. Deterministic; no validator required.",
      "",
      "| Instruction | CU |",
      "| --- | ---: |",
      ...rows.map(
        (r) =>
          `| ${r.name} | ${r.cu !== null ? r.cu : "n/a — " + (r.note ?? "")} |`
      ),
      "",
      `**Measured ${measured.length}/${rows.length}** of the no-CPI instructions.`,
      "",
      "## Deferred — need Token-2022 mint / Metaplex-Core setup",
      "",
      "These mint XP or CPI into mpl_core; add them with the same harness pattern",
      "plus the extra setup noted:",
      "",
      "- `reward_xp`, `complete_lesson`, `finalize_course` — mint Token-2022 XP (need an XP mint + recipient ATA)",
      "- `create_achievement_type`, `deactivate_achievement_type`, `award_achievement` — mpl_core collection (CPI)",
      "- `issue_credential`, `upgrade_credential` — mpl_core asset (CPI)",
      "- `close_enrollment` — needs a finalized enrollment (depends on the mint flow)",
      "",
    ];
    writeFileSync(path.join(ROOT, "tests/CU_BASELINE.md"), lines.join("\n"));
    // eslint-disable-next-line no-console
    console.log(
      `\nWrote tests/CU_BASELINE.md (${measured.length}/${rows.length} measured)`
    );
  });
});
