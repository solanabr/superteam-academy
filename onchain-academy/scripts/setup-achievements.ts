/**
 * Create on-chain AchievementType PDAs + Metaplex Core collections.
 * Run: npx tsx scripts/setup-achievements.ts
 *
 * Prerequisites:
 *   - MinterRole for backend signer must already exist (register_minter)
 *   - Signer is config.authority
 */
import * as fs from "fs";
import * as path from "path";
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
} from "@solana/web3.js";
import {
  AnchorProvider,
  Program,
  Wallet,
  type Idl,
} from "@coral-xyz/anchor";

const RPC_URL = process.env.RPC_URL ?? "https://api.devnet.solana.com";
const PROGRAM_ID = new PublicKey(
  process.env.PROGRAM_ID ?? "64XGGSc32TUX7rxge5u4Qsv55RQN5ybSwS4B1eksWTxy"
);
const MPL_CORE_PROGRAM_ID = new PublicKey(
  "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d"
);

const secret = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../../wallets/signer.json"), "utf-8")
);
const signerKp = Keypair.fromSecretKey(Uint8Array.from(secret));

const [configPda] = PublicKey.findProgramAddressSync(
  [Buffer.from("config")],
  PROGRAM_ID
);

// ─── Achievement definitions ─────────────────────────────────────────────────

const ACHIEVEMENT_TYPES = [
  { id: "first-lesson",  name: "First Steps",      maxSupply: 0, xpReward: 25  },
  { id: "xp-100",        name: "XP Rookie",         maxSupply: 0, xpReward: 10  },
  { id: "xp-500",        name: "XP Warrior",        maxSupply: 0, xpReward: 50  },
  { id: "xp-1000",       name: "XP Master",         maxSupply: 0, xpReward: 100 },
  { id: "xp-2500",       name: "XP Legend",         maxSupply: 0, xpReward: 250 },
  { id: "streak-3",      name: "3-Day Streak",      maxSupply: 0, xpReward: 30  },
  { id: "streak-7",      name: "Week Warrior",      maxSupply: 0, xpReward: 70  },
  { id: "streak-14",     name: "Fortnight Focus",   maxSupply: 0, xpReward: 140 },
  { id: "first-course",  name: "Graduate",          maxSupply: 0, xpReward: 100 },
] as const;

function metadataUri(id: string): string {
  return `https://superteam-academy.vercel.app/achievements/${id}.json`;
}

function findAchievementTypePDA(id: string): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("achievement"), Buffer.from(id)],
    PROGRAM_ID
  );
}

async function main() {
  const connection = new Connection(RPC_URL, "confirmed");
  const wallet = new Wallet(signerKp);
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });

  const idlPath = path.join(
    __dirname,
    "../target/idl/onchain_academy.json"
  );
  const IDL = JSON.parse(fs.readFileSync(idlPath, "utf-8")) as Idl;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const program = new Program(IDL as any, provider);

  console.log("Program:   ", PROGRAM_ID.toBase58());
  console.log("Config PDA:", configPda.toBase58());
  console.log("Authority: ", signerKp.publicKey.toBase58());
  console.log();

  const collections: Record<string, string> = {};

  for (const def of ACHIEVEMENT_TYPES) {
    const [typePda] = findAchievementTypePDA(def.id);

    // Skip if already initialised
    const existing = await connection.getAccountInfo(typePda);
    if (existing) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = await (program as any).account.achievementType.fetch(typePda) as any;
      const col = (data.collection as PublicKey).toBase58();
      collections[def.id] = col;
      console.log(`✓ ${def.id} already exists  collection=${col}`);
      continue;
    }

    const collectionKp = Keypair.generate();
    console.log(`Creating ${def.id}…`);

    const sig = await (program.methods as unknown as {
      createAchievementType: (p: {
        achievementId: string;
        name: string;
        metadataUri: string;
        maxSupply: number;
        xpReward: number;
      }) => {
        accountsPartial: (a: Record<string, unknown>) => {
          signers: (s: Keypair[]) => { rpc: () => Promise<string> };
        };
      };
    })
      .createAchievementType({
        achievementId: def.id,
        name: def.name,
        metadataUri: metadataUri(def.id),
        maxSupply: def.maxSupply,
        xpReward: def.xpReward,
      })
      .accountsPartial({
        config: configPda,
        achievementType: typePda,
        collection: collectionKp.publicKey,
        authority: signerKp.publicKey,
        payer: signerKp.publicKey,
        mplCoreProgram: MPL_CORE_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([signerKp, collectionKp])
      .rpc();

    const col = collectionKp.publicKey.toBase58();
    collections[def.id] = col;
    console.log(`  ✓ collection=${col}`);
    console.log(`  ✓ sig=${sig.slice(0, 20)}…`);
    console.log();
  }

  console.log("\n=== Paste into backend/.env ===");
  const lines = ACHIEVEMENT_TYPES.map(
    (d) => `ACHIEVEMENT_${d.id.toUpperCase().replace(/-/g, "_")}=${collections[d.id]}`
  );
  lines.forEach((l) => console.log(l));

  console.log("\n=== Paste into app/.env.local ===");
  lines.map((l) => "NEXT_PUBLIC_" + l).forEach((l) => console.log(l));
}

main().catch((e) => { console.error(e); process.exit(1); });
