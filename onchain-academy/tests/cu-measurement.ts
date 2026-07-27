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
import {
  TOKEN_2022_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { createCollectionV2, mplCore } from "@metaplex-foundation/mpl-core";
import {
  createNoopSigner,
  publicKey as umiPublicKey,
} from "@metaplex-foundation/umi";
import {
  fromWeb3JsPublicKey,
  toWeb3JsInstruction,
} from "@metaplex-foundation/umi-web3js-adapters";
import BN from "bn.js";
import { expect } from "chai";
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

  // Unmeasured setup transaction (ATA creation, mpl_core collection bootstrap,
  // state preconditions). Throws on failure so a broken precondition surfaces
  // immediately rather than nulling the dependent instruction's CU row.
  function setup(
    ixs: anchor.web3.TransactionInstruction[],
    signers: Keypair[]
  ) {
    const tx = new Transaction().add(...ixs);
    tx.recentBlockhash = svm.latestBlockhash();
    tx.feePayer = authority.publicKey;
    tx.sign(authority, ...signers);
    const res = svm.sendTransaction(tx);
    if (res instanceof FailedTransactionMetadata) {
      throw new Error(res.err().toString().slice(0, 120));
    }
  }

  // Execute an Anchor instruction as unmeasured setup (e.g. extra lesson
  // completions, prerequisite courses/enrollments for the CPI flows).
  async function exec(
    builder: { instruction: () => Promise<anchor.web3.TransactionInstruction> },
    signers: Keypair[] = []
  ) {
    setup([await builder.instruction()], signers);
  }

  // Warp the LiteSVM wall clock forward by `seconds` so time-gated instructions
  // (e.g. close_enrollment's 24h unenroll cooldown) can be exercised.
  function warpClock(seconds: number) {
    const clock = svm.getClock();
    clock.unixTimestamp = clock.unixTimestamp + BigInt(seconds);
    svm.setClock(clock);
  }

  // Recipient ATA for the Token-2022 XP mint. The program mints with the Config
  // PDA as authority, so the ATA only needs to exist (no pre-funded balance).
  function createXpAta(mint: PublicKey, owner: PublicKey): PublicKey {
    const ata = getAssociatedTokenAddressSync(
      mint,
      owner,
      true,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
    setup(
      [
        createAssociatedTokenAccountInstruction(
          authority.publicKey,
          ata,
          owner,
          mint,
          TOKEN_2022_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        ),
      ],
      []
    );
    return ata;
  }

  // Bootstrap a Metaplex Core collection (update_authority = Config PDA) inside
  // LiteSVM. issue_credential needs a pre-existing collection it does NOT create
  // itself; the umi builder yields the CreateCollectionV2 ix which we sign with
  // the collection keypair + authority and submit through LiteSVM (no RPC).
  function createCredentialCollection(updateAuthority: PublicKey): Keypair {
    const collection = Keypair.generate();
    const umi = createUmi("http://localhost:8899").use(mplCore());
    const ixs = createCollectionV2(umi, {
      collection: createNoopSigner(fromWeb3JsPublicKey(collection.publicKey)),
      payer: createNoopSigner(fromWeb3JsPublicKey(authority.publicKey)),
      updateAuthority: umiPublicKey(updateAuthority.toBase58()),
      name: "CU Track Credentials",
      uri: "https://arweave.net/cu-collection",
    })
      .getInstructions()
      .map((i) => toWeb3JsInstruction(i));
    setup(ixs, [collection]);
    return collection;
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
    // Course creator — must match course.creator for finalize_course's creator
    // reward path. Reused across the measured course and the credential course.
    const creator = Keypair.generate();
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

    // newAuthority was added to UpdateConfigParams in the #303 audit sprint
    // (after the original baseline); the coder needs every field present.
    await measure(
      "update_config (pause)",
      program.methods
        .updateConfig({
          newBackendSigner: null,
          paused: true,
          newAuthority: null,
        })
        .accountsPartial({ config: configPda, authority: authority.publicKey })
    );
    await measure(
      "update_config (resume)",
      program.methods
        .updateConfig({
          newBackendSigner: null,
          paused: false,
          newAuthority: null,
        })
        .accountsPartial({ config: configPda, authority: authority.publicKey })
    );

    await measure(
      "create_course",
      program.methods
        .createCourse({
          courseId,
          creator: creator.publicKey,
          contentTxId: new Array(32).fill(1),
          lessonCount: 3,
          difficulty: 2,
          xpPerLesson: 100,
          trackId: 1,
          trackLevel: 1,
          prerequisite: null,
          creatorRewardXp: 50,
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
          newCollection: null,
          newActiveLessons: null,
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

    // --- Token-2022 XP mint group ---
    // "cu-course" has 3 lessons / 100 XP each / creator reward 50. learner1 is
    // enrolled above; the XP mint exists from initialize(); the Config PDA is the
    // mint authority, so recipient ATAs only need to exist (no pre-funded balance).
    const learner1Ata = createXpAta(xpMint.publicKey, learner1.publicKey);
    const creatorAta = createXpAta(xpMint.publicKey, creator.publicKey);

    const completeLessonAccounts = {
      config: configPda,
      course: coursePda,
      enrollment: enroll1,
      learner: learner1.publicKey,
      learnerTokenAccount: learner1Ata,
      xpMint: xpMint.publicKey,
      backendSigner: authority.publicKey,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
    };
    await measure(
      "complete_lesson",
      program.methods.completeLesson(0).accountsPartial(completeLessonAccounts)
    );
    // Complete the remaining lessons (unmeasured) so finalize_course can run.
    for (const lesson of [1, 2]) {
      await exec(
        program.methods
          .completeLesson(lesson)
          .accountsPartial(completeLessonAccounts)
      );
    }

    await measure(
      "finalize_course",
      program.methods.finalizeCourse().accountsPartial({
        config: configPda,
        course: coursePda,
        enrollment: enroll1,
        learner: learner1.publicKey,
        learnerTokenAccount: learner1Ata,
        creatorTokenAccount: creatorAta,
        creator: creator.publicKey,
        xpMint: xpMint.publicKey,
        backendSigner: authority.publicKey,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
      })
    );

    // reward_xp — direct mint via the auto-registered backend MinterRole.
    await measure(
      "reward_xp",
      program.methods.rewardXp(new BN(500), "cu reward").accountsPartial({
        config: configPda,
        minterRole: backendMinterRole,
        xpMint: xpMint.publicKey,
        recipientTokenAccount: learner1Ata,
        minter: authority.publicKey,
        backendSigner: authority.publicKey,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
      })
    );

    // --- close_enrollment (incomplete + past 24h unenroll cooldown) ---
    // Finalized/credentialed enrollments are permanent replay guards and are
    // REJECTED by close_enrollment; the only closable path is an incomplete
    // enrollment whose 24h cooldown has elapsed. LiteSVM lets us warp the clock.
    const closeCourseId = "cu-close-course";
    const [closeCoursePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("course"), Buffer.from(closeCourseId)],
      PROGRAM_ID
    );
    await exec(
      program.methods
        .createCourse({
          courseId: closeCourseId,
          creator: authority.publicKey,
          contentTxId: new Array(32).fill(1),
          lessonCount: 3,
          difficulty: 1,
          xpPerLesson: 10,
          trackId: 2,
          trackLevel: 1,
          prerequisite: null,
          creatorRewardXp: 0,
          collection: null,
        })
        .accountsPartial({
          course: closeCoursePda,
          config: configPda,
          authority: authority.publicKey,
          systemProgram: SystemProgram.programId,
        })
    );
    const closeLearner = Keypair.generate();
    svm.airdrop(closeLearner.publicKey, BigInt(10 * LAMPORTS_PER_SOL));
    const [closeEnroll] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("enrollment"),
        Buffer.from(closeCourseId),
        closeLearner.publicKey.toBuffer(),
      ],
      PROGRAM_ID
    );
    await exec(
      program.methods.enroll(closeCourseId).accountsPartial({
        course: closeCoursePda,
        enrollment: closeEnroll,
        learner: closeLearner.publicKey,
        systemProgram: SystemProgram.programId,
      }),
      [closeLearner]
    );
    warpClock(86400 + 60); // advance past the 24h unenroll cooldown
    await measure(
      "close_enrollment",
      program.methods.closeEnrollment().accountsPartial({
        course: closeCoursePda,
        enrollment: closeEnroll,
        learner: closeLearner.publicKey,
      }),
      [closeLearner]
    );

    // --- mpl_core collection group (CPI) ---
    // create_achievement_type itself creates the mpl_core collection via CPI.
    const achievementId = "cu-achievement";
    const [achievementTypePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("achievement"), Buffer.from(achievementId)],
      PROGRAM_ID
    );
    const achievementCollection = Keypair.generate();
    await measure(
      "create_achievement_type",
      program.methods
        .createAchievementType({
          achievementId,
          name: "CU Achievement",
          metadataUri: "https://arweave.net/cu-achievement",
          maxSupply: 100,
          xpReward: 200,
        })
        .accountsPartial({
          config: configPda,
          achievementType: achievementTypePda,
          collection: achievementCollection.publicKey,
          authority: authority.publicKey,
          payer: authority.publicKey,
          mplCoreProgram: MPL_CORE,
          systemProgram: SystemProgram.programId,
        }),
      [achievementCollection]
    );

    const achievementRecipient = Keypair.generate();
    const achievementRecipientAta = createXpAta(
      xpMint.publicKey,
      achievementRecipient.publicKey
    );
    const [achievementReceiptPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("achievement_receipt"),
        Buffer.from(achievementId),
        achievementRecipient.publicKey.toBuffer(),
      ],
      PROGRAM_ID
    );
    const achievementAsset = Keypair.generate();
    await measure(
      "award_achievement",
      program.methods.awardAchievement().accountsPartial({
        config: configPda,
        achievementType: achievementTypePda,
        achievementReceipt: achievementReceiptPda,
        minterRole: backendMinterRole,
        asset: achievementAsset.publicKey,
        collection: achievementCollection.publicKey,
        recipient: achievementRecipient.publicKey,
        recipientTokenAccount: achievementRecipientAta,
        xpMint: xpMint.publicKey,
        payer: authority.publicKey,
        minter: authority.publicKey,
        backendSigner: authority.publicKey,
        mplCoreProgram: MPL_CORE,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      }),
      [achievementAsset]
    );

    await measure(
      "deactivate_achievement_type",
      program.methods.deactivateAchievementType().accountsPartial({
        config: configPda,
        achievementType: achievementTypePda,
        authority: authority.publicKey,
      })
    );

    // --- mpl_core asset group: issue / upgrade credential (CPI) ---
    // issue_credential needs a pre-existing collection (update_authority = Config
    // PDA) referenced by course.collection, plus a finalized enrollment.
    const credCollection = createCredentialCollection(configPda);
    const credCourseId = "cu-cred-course";
    const [credCoursePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("course"), Buffer.from(credCourseId)],
      PROGRAM_ID
    );
    await exec(
      program.methods
        .createCourse({
          courseId: credCourseId,
          creator: creator.publicKey,
          contentTxId: new Array(32).fill(1),
          lessonCount: 2,
          difficulty: 1,
          xpPerLesson: 50,
          trackId: 1,
          trackLevel: 1,
          prerequisite: null,
          creatorRewardXp: 0,
          collection: credCollection.publicKey,
        })
        .accountsPartial({
          course: credCoursePda,
          config: configPda,
          authority: authority.publicKey,
          systemProgram: SystemProgram.programId,
        })
    );
    const credLearner = Keypair.generate();
    svm.airdrop(credLearner.publicKey, BigInt(10 * LAMPORTS_PER_SOL));
    const credLearnerAta = createXpAta(xpMint.publicKey, credLearner.publicKey);
    const [credEnroll] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("enrollment"),
        Buffer.from(credCourseId),
        credLearner.publicKey.toBuffer(),
      ],
      PROGRAM_ID
    );
    await exec(
      program.methods.enroll(credCourseId).accountsPartial({
        course: credCoursePda,
        enrollment: credEnroll,
        learner: credLearner.publicKey,
        systemProgram: SystemProgram.programId,
      }),
      [credLearner]
    );
    const credCompleteAccounts = {
      config: configPda,
      course: credCoursePda,
      enrollment: credEnroll,
      learner: credLearner.publicKey,
      learnerTokenAccount: credLearnerAta,
      xpMint: xpMint.publicKey,
      backendSigner: authority.publicKey,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
    };
    for (const lesson of [0, 1]) {
      await exec(
        program.methods
          .completeLesson(lesson)
          .accountsPartial(credCompleteAccounts)
      );
    }
    await exec(
      program.methods.finalizeCourse().accountsPartial({
        config: configPda,
        course: credCoursePda,
        enrollment: credEnroll,
        learner: credLearner.publicKey,
        learnerTokenAccount: credLearnerAta,
        creatorTokenAccount: creatorAta,
        creator: creator.publicKey,
        xpMint: xpMint.publicKey,
        backendSigner: authority.publicKey,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
      })
    );

    const credentialAsset = Keypair.generate();
    await measure(
      "issue_credential",
      program.methods
        .issueCredential(
          "CU Credential",
          "https://arweave.net/cred-v1",
          1,
          new BN(500)
        )
        .accountsPartial({
          config: configPda,
          course: credCoursePda,
          enrollment: credEnroll,
          learner: credLearner.publicKey,
          credentialAsset: credentialAsset.publicKey,
          trackCollection: credCollection.publicKey,
          payer: authority.publicKey,
          backendSigner: authority.publicKey,
          mplCoreProgram: MPL_CORE,
          systemProgram: SystemProgram.programId,
        }),
      [credentialAsset]
    );

    await measure(
      "upgrade_credential",
      program.methods
        .upgradeCredential(
          "CU Credential v2",
          "https://arweave.net/cred-v2",
          2,
          new BN(1000)
        )
        .accountsPartial({
          config: configPda,
          course: credCoursePda,
          enrollment: credEnroll,
          learner: credLearner.publicKey,
          credentialAsset: credentialAsset.publicKey,
          trackCollection: credCollection.publicKey,
          payer: authority.publicKey,
          backendSigner: authority.publicKey,
          mplCoreProgram: MPL_CORE,
          systemProgram: SystemProgram.programId,
        })
    );

    // close_course last (closes the "cu-course" PDA).
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
    // Emit a GFM table pre-aligned the way Prettier formats it, so the file the
    // harness writes is byte-identical to the committed (Prettier-formatted) one
    // — the optional `git diff --exit-code CU_BASELINE.md` CI check stays green.
    const cuText = (r: Row) =>
      r.cu !== null ? String(r.cu) : "n/a — " + (r.note ?? "");
    const nameWidth = Math.max(
      "Instruction".length,
      ...rows.map((r) => r.name.length)
    );
    const cuWidth = Math.max("CU".length, ...rows.map((r) => cuText(r).length));
    const tableRow = (name: string, cu: string) =>
      `| ${name.padEnd(nameWidth)} | ${cu.padStart(cuWidth)} |`;
    const lines = [
      "# Per-instruction Compute-Unit (CU) Baseline (#121 / P1-5)",
      "",
      "Captured with an in-process **LiteSVM** harness (`tests/cu-measurement.ts`)",
      "against a release SBF build. Deterministic; no validator required.",
      "",
      tableRow("Instruction", "CU"),
      `| ${"-".repeat(nameWidth)} | ${"-".repeat(cuWidth - 1)}: |`,
      ...rows.map((r) => tableRow(r.name, cuText(r))),
      "",
      `**Measured ${measured.length} transactions across all 18 instructions.**`,
      "`update_config` is measured for both pause and resume; every other",
      "instruction contributes one row.",
      "",
      "## Coverage",
      "",
      "- **No-CPI** — `initialize`, `update_config`, `create_course`, `update_course`,",
      "  `register_minter`, `update_minter`, `revoke_minter`, `enroll`, `close_course`.",
      "- **Token-2022 XP mint** — `complete_lesson`, `finalize_course`, `reward_xp`",
      "  (XP mint + recipient ATAs; Config PDA is the mint authority).",
      "- **close_enrollment** — incomplete enrollment closed after warping the LiteSVM",
      "  clock past the 24h unenroll cooldown (finalized enrollments are replay-guarded).",
      "- **mpl_core collection (CPI)** — `create_achievement_type` (creates the",
      "  collection via CPI), `award_achievement`, `deactivate_achievement_type`.",
      "- **mpl_core asset (CPI)** — `issue_credential`, `upgrade_credential` against a",
      "  pre-bootstrapped collection whose update authority is the Config PDA.",
      "",
    ];
    // CU_BASELINE_OUT lets the pinocchio runtime write its own table without
    // clobbering the committed Anchor baseline (see package.json cu:pinocchio).
    const outFile = process.env.CU_BASELINE_OUT ?? "tests/CU_BASELINE.md";
    writeFileSync(path.join(ROOT, outFile), lines.join("\n"));
    // eslint-disable-next-line no-console
    console.log(
      `\nWrote ${outFile} (${measured.length}/${rows.length} measured)`
    );

    // Gate: every attempted instruction must have executed, and each CU must be
    // positive and within a sane ceiling — so the test FAILS (rather than
    // silently recording nulls) if an instruction breaks or CU regresses hard.
    const failed = rows.filter((r) => r.cu === null);
    expect(
      failed,
      `instructions failed to execute: ${failed
        .map((f) => `${f.name} (${f.note})`)
        .join("; ")}`
    ).to.have.length(0);
    for (const r of rows) {
      expect(r.cu, `${r.name} CU should be positive`).to.be.greaterThan(0);
      expect(
        r.cu as number,
        `${r.name} CU=${r.cu} exceeds the 100k ceiling — investigate a regression`
      ).to.be.lessThan(100_000);
    }
  });
});
