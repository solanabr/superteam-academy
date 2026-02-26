import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { OnchainAcademy } from "../target/types/onchain_academy";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";

const provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);
const program = anchor.workspace.onchainAcademy as Program<OnchainAcademy>;

const MPL_CORE_PROGRAM_ID = new PublicKey(
  "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d"
);

const [configPda] = PublicKey.findProgramAddressSync(
  [Buffer.from("config")],
  program.programId
);

interface AchievementDef {
  id: string;
  name: string;
  metadataUri: string;
  maxSupply: number; // 0 = unlimited
  xpReward: number;
}

const ACHIEVEMENTS: AchievementDef[] = [
  // ─── Progress ─────────────────────────────────────────
  {
    id: "first-steps",
    name: "First Steps",
    metadataUri: "https://i.ibb.co/ccHMmzD5/first-steps.jpg",
    maxSupply: 0,
    xpReward: 10,
  },
  {
    id: "course-completer",
    name: "Course Completer",
    metadataUri: "https://i.ibb.co/tRymDvf/coursecompleter.jpg",
    maxSupply: 0,
    xpReward: 50,
  },
  {
    id: "speed-runner",
    name: "Speed Runner",
    metadataUri: "https://i.ibb.co/4RhqCCGV/speedrunner.jpg",
    maxSupply: 0,
    xpReward: 75,
  },

  // ─── Streaks ──────────────────────────────────────────
  {
    id: "week-warrior",
    name: "Week Warrior",
    metadataUri: "https://i.ibb.co/kV8GrtN9/weekwarrior.jpg",
    maxSupply: 0,
    xpReward: 30,
  },
  {
    id: "monthly-master",
    name: "Monthly Master",
    metadataUri: "https://i.ibb.co/cKk15smD/montlymaster.jpg",
    maxSupply: 0,
    xpReward: 100,
  },
  {
    id: "consistency-king",
    name: "Consistency King",
    metadataUri: "https://i.ibb.co/8gTyjgtS/Consistencyking.jpg",
    maxSupply: 0,
    xpReward: 250,
  },

  // ─── Skills ───────────────────────────────────────────
  {
    id: "rust-rookie",
    name: "Rust Rookie",
    metadataUri: "https://i.ibb.co/608V57hq/rustrookie.jpg",
    maxSupply: 0,
    xpReward: 50,
  },
  {
    id: "anchor-expert",
    name: "Anchor Expert",
    metadataUri: "https://i.ibb.co/v6KYQ0Ws/anchorexpert.jpg",
    maxSupply: 0,
    xpReward: 150,
  },
  {
    id: "full-stack-solana",
    name: "Full Stack Solana",
    metadataUri: "https://i.ibb.co/1tz81kmr/fullstack.jpg",
    maxSupply: 0,
    xpReward: 300,
  },

  // ─── Community ────────────────────────────────────────
  {
    id: "helper",
    name: "Helper",
    metadataUri: "https://i.ibb.co/GvtspMdN/Communityhelper.jpg",
    maxSupply: 0,
    xpReward: 25,
  },
  {
    id: "first-comment",
    name: "First Comment",
    metadataUri: "https://i.ibb.co/j9zXC4jk/communityfirst.jpg",
    maxSupply: 0,
    xpReward: 10,
  },
  {
    id: "top-contributor",
    name: "Top Contributor",
    metadataUri: "https://i.ibb.co/zHBTV4XC/communitytop.jpg",
    maxSupply: 0,
    xpReward: 200,
  },

  // ─── Special ──────────────────────────────────────────
  {
    id: "early-adopter",
    name: "Early Adopter",
    metadataUri: "https://i.ibb.co/7xNkX9tB/earlyadopter.jpg",
    maxSupply: 1000,
    xpReward: 100,
  },
  {
    id: "bug-hunter",
    name: "Bug Hunter",
    metadataUri: "https://i.ibb.co/Xm8MZwN/bughunter.jpg",
    maxSupply: 500,
    xpReward: 150,
  },
  {
    id: "perfect-score",
    name: "Perfect Score",
    metadataUri: "https://i.ibb.co/4wwFv83N/perfectscore.jpg",
    maxSupply: 0,
    xpReward: 200,
  },
];

async function main() {
  console.log("=== Setting up 15 Achievement Types on Devnet ===\n");
  console.log("Program:", program.programId.toBase58());
  console.log("Config PDA:", configPda.toBase58());
  console.log("Authority/Payer:", provider.wallet.publicKey.toBase58());
  console.log();

  const results: { id: string; collection: string; pda: string; tx: string }[] = [];
  const skipped: string[] = [];

  for (const achievement of ACHIEVEMENTS) {
    const [achievementPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("achievement"), Buffer.from(achievement.id)],
      program.programId
    );

    // Check if already exists
    const existing = await provider.connection.getAccountInfo(achievementPda);
    if (existing) {
      console.log(`⏭ "${achievement.id}" already exists at ${achievementPda.toBase58()}`);
      skipped.push(achievement.id);
      continue;
    }

    const collectionKeypair = Keypair.generate();

    console.log(`Creating "${achievement.name}" (${achievement.id})...`);
    console.log(`  PDA: ${achievementPda.toBase58()}`);
    console.log(`  Collection: ${collectionKeypair.publicKey.toBase58()}`);

    try {
      const tx = await program.methods
        .createAchievementType({
          achievementId: achievement.id,
          name: achievement.name,
          metadataUri: achievement.metadataUri,
          maxSupply: achievement.maxSupply,
          xpReward: achievement.xpReward,
        })
        .accountsPartial({
          config: configPda,
          achievementType: achievementPda,
          collection: collectionKeypair.publicKey,
          authority: provider.wallet.publicKey,
          payer: provider.wallet.publicKey,
          mplCoreProgram: MPL_CORE_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([collectionKeypair])
        .rpc();

      results.push({
        id: achievement.id,
        collection: collectionKeypair.publicKey.toBase58(),
        pda: achievementPda.toBase58(),
        tx,
      });

      console.log(`  ✅ Tx: ${tx}\n`);

      // Small delay to avoid rate limiting
      await new Promise((r) => setTimeout(r, 500));
    } catch (err: any) {
      console.error(`  ❌ Failed: ${err.message}\n`);
    }
  }

  console.log("\n=== Summary ===");
  console.log(`Created: ${results.length}`);
  console.log(`Skipped (existing): ${skipped.length}`);
  console.log(`Failed: ${ACHIEVEMENTS.length - results.length - skipped.length}`);

  if (results.length > 0) {
    console.log("\n--- Created Achievement Types ---");
    for (const r of results) {
      console.log(`  ${r.id}`);
      console.log(`    PDA: ${r.pda}`);
      console.log(`    Collection: ${r.collection}`);
      console.log(`    Tx: ${r.tx}`);
    }
  }

  // Output JSON mapping for frontend .env
  if (results.length > 0) {
    console.log("\n--- Achievement Collection Map (for frontend) ---");
    const map: Record<string, string> = {};
    for (const r of results) {
      map[r.id] = r.collection;
    }
    console.log(JSON.stringify(map, null, 2));
  }
}

main().catch(console.error);
