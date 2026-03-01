import Fastify from 'fastify';
import cors from '@fastify/cors';
import { Connection, Keypair, PublicKey, SystemProgram, Transaction, sendAndConfirmTransaction } from '@solana/web3.js';
import { getAssociatedTokenAddressSync, createAssociatedTokenAccountInstruction } from '@solana/spl-token';
import BN from 'bn.js';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

dotenv.config();

const PROGRAM_ID = new PublicKey(process.env.PROGRAM_ID || 'ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf');
const TOKEN_2022_PROGRAM_ID = new PublicKey('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb');
const MPL_CORE_PROGRAM_ID = new PublicKey('CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d');

// --- PDA Helpers ---

function getConfigPda(): PublicKey {
  return PublicKey.findProgramAddressSync([Buffer.from('config')], PROGRAM_ID)[0];
}

function getCoursePda(courseId: string): PublicKey {
  return PublicKey.findProgramAddressSync([Buffer.from('course'), Buffer.from(courseId)], PROGRAM_ID)[0];
}

function getEnrollmentPda(courseId: string, learner: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('enrollment'), Buffer.from(courseId), learner.toBuffer()],
    PROGRAM_ID
  )[0];
}

// --- Anchor Instruction Discriminators (sha256("global:<method>")[0..8]) ---
// Pre-computed for the three backend-signed instructions

const DISCRIMINATORS: Record<string, Buffer> = {
  complete_lesson: Buffer.from([88, 23, 232, 77, 29, 173, 18, 179]),
  finalize_course: Buffer.from([186, 39, 148, 14, 81, 234, 74, 202]),
  issue_credential: Buffer.from([136, 119, 49, 170, 198, 75, 211, 3]),
};

// --- Setup ---

const connection = new Connection(process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com', 'confirmed');

function loadSigner(): Keypair {
  const path = process.env.BACKEND_SIGNER_KEYPAIR || './keypair.json';
  if (fs.existsSync(path)) {
    const raw = JSON.parse(fs.readFileSync(path, 'utf-8'));
    return Keypair.fromSecretKey(Uint8Array.from(raw));
  }
  console.warn('No signer keypair found, generating ephemeral one for development');
  return Keypair.generate();
}

const backendSigner = loadSigner();
console.log('Backend signer:', backendSigner.publicKey.toBase58());

// --- Streak Storage (in-memory, replace with DB in production) ---

const streaks: Map<string, { streak: number; longest: number; lastDate: string }> = new Map();

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function yesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

// --- Config cache ---

let configCache: { xpMint: PublicKey; authority: PublicKey } | null = null;

async function getConfig() {
  if (configCache) return configCache;
  const info = await connection.getAccountInfo(getConfigPda());
  if (!info) throw new Error('Config not initialized');
  const data = info.data;
  configCache = {
    authority: new PublicKey(data.subarray(8, 40)),
    xpMint: new PublicKey(data.subarray(72, 104)),
  };
  return configCache;
}

// --- Server ---

const app = Fastify({ logger: true });

app.register(cors, { origin: true });

// Health
app.get('/health', async () => ({ ok: true }));

// Complete Lesson
app.post<{ Body: { courseId: string; lessonIndex: number; learner: string } }>(
  '/api/complete-lesson',
  async (req) => {
    const { courseId, lessonIndex, learner: learnerStr } = req.body;
    const learner = new PublicKey(learnerStr);
    const config = await getConfig();

    const configPda = getConfigPda();
    const coursePda = getCoursePda(courseId);
    const enrollmentPda = getEnrollmentPda(courseId, learner);
    const learnerXpAta = getAssociatedTokenAddressSync(config.xpMint, learner, false, TOKEN_2022_PROGRAM_ID);

    // Build instruction
    const data = Buffer.concat([
      DISCRIMINATORS.complete_lesson,
      Buffer.from([lessonIndex]),
    ]);

    const ix = {
      programId: PROGRAM_ID,
      keys: [
        { pubkey: configPda, isWritable: false, isSigner: false },
        { pubkey: coursePda, isWritable: false, isSigner: false },
        { pubkey: enrollmentPda, isWritable: true, isSigner: false },
        { pubkey: learner, isWritable: false, isSigner: false },
        { pubkey: learnerXpAta, isWritable: true, isSigner: false },
        { pubkey: config.xpMint, isWritable: true, isSigner: false },
        { pubkey: backendSigner.publicKey, isWritable: true, isSigner: true },
        { pubkey: TOKEN_2022_PROGRAM_ID, isWritable: false, isSigner: false },
      ],
      data,
    };

    // Ensure ATA exists
    const ataInfo = await connection.getAccountInfo(learnerXpAta);
    const tx = new Transaction();
    if (!ataInfo) {
      tx.add(
        createAssociatedTokenAccountInstruction(
          backendSigner.publicKey,
          learnerXpAta,
          learner,
          config.xpMint,
          TOKEN_2022_PROGRAM_ID
        )
      );
    }
    tx.add(ix);

    const sig = await sendAndConfirmTransaction(connection, tx, [backendSigner]);
    return { signature: sig };
  }
);

// Finalize Course
app.post<{ Body: { courseId: string; learner: string } }>(
  '/api/finalize-course',
  async (req) => {
    const { courseId, learner: learnerStr } = req.body;
    const learner = new PublicKey(learnerStr);
    const config = await getConfig();

    const configPda = getConfigPda();
    const coursePda = getCoursePda(courseId);
    const enrollmentPda = getEnrollmentPda(courseId, learner);
    const learnerXpAta = getAssociatedTokenAddressSync(config.xpMint, learner, false, TOKEN_2022_PROGRAM_ID);

    // Read course to get creator
    const courseInfo = await connection.getAccountInfo(coursePda);
    if (!courseInfo) throw new Error('Course not found');
    // Creator is at offset 8 + 4 + 32 = 44 (after discriminator + string)
    const creator = new PublicKey(courseInfo.data.subarray(44, 76));
    const creatorXpAta = getAssociatedTokenAddressSync(config.xpMint, creator, false, TOKEN_2022_PROGRAM_ID);

    const ix = {
      programId: PROGRAM_ID,
      keys: [
        { pubkey: configPda, isWritable: false, isSigner: false },
        { pubkey: coursePda, isWritable: true, isSigner: false },
        { pubkey: enrollmentPda, isWritable: true, isSigner: false },
        { pubkey: learner, isWritable: false, isSigner: false },
        { pubkey: learnerXpAta, isWritable: true, isSigner: false },
        { pubkey: creatorXpAta, isWritable: true, isSigner: false },
        { pubkey: creator, isWritable: false, isSigner: false },
        { pubkey: config.xpMint, isWritable: true, isSigner: false },
        { pubkey: backendSigner.publicKey, isWritable: true, isSigner: true },
        { pubkey: TOKEN_2022_PROGRAM_ID, isWritable: false, isSigner: false },
      ],
      data: DISCRIMINATORS.finalize_course,
    };

    // Ensure creator ATA exists
    const tx = new Transaction();
    const creatorAtaInfo = await connection.getAccountInfo(creatorXpAta);
    if (!creatorAtaInfo) {
      tx.add(
        createAssociatedTokenAccountInstruction(
          backendSigner.publicKey,
          creatorXpAta,
          creator,
          config.xpMint,
          TOKEN_2022_PROGRAM_ID
        )
      );
    }
    tx.add(ix);

    const sig = await sendAndConfirmTransaction(connection, tx, [backendSigner]);
    return { signature: sig };
  }
);

// Issue Credential
app.post<{
  Body: {
    courseId: string;
    learner: string;
    credentialName: string;
    metadataUri: string;
    coursesCompleted: number;
    totalXp: number;
  };
}>('/api/issue-credential', async (req) => {
  const { courseId, learner: learnerStr, credentialName, metadataUri, coursesCompleted, totalXp } = req.body;
  const learner = new PublicKey(learnerStr);

  const configPda = getConfigPda();
  const coursePda = getCoursePda(courseId);
  const enrollmentPda = getEnrollmentPda(courseId, learner);

  // Read course for track collection (would need to be stored/configured)
  // For now, create a new credential asset keypair
  const credentialAsset = Keypair.generate();

  // Encode params
  const nameBuf = Buffer.from(credentialName);
  const nameLenBuf = Buffer.alloc(4);
  nameLenBuf.writeUInt32LE(nameBuf.length);

  const uriBuf = Buffer.from(metadataUri);
  const uriLenBuf = Buffer.alloc(4);
  uriLenBuf.writeUInt32LE(uriBuf.length);

  const ccBuf = Buffer.alloc(4);
  ccBuf.writeUInt32LE(coursesCompleted);

  const xpBuf = Buffer.alloc(8);
  new BN(totalXp).toBuffer('le', 8).copy(xpBuf);

  const data = Buffer.concat([
    DISCRIMINATORS.issue_credential,
    nameLenBuf,
    nameBuf,
    uriLenBuf,
    uriBuf,
    ccBuf,
    xpBuf,
  ]);

  // Note: track collection pubkey would come from course config in production
  // Using a placeholder — in real deployment this would be fetched from course.trackId mapping
  const trackCollection = Keypair.generate().publicKey; // placeholder

  const ix = {
    programId: PROGRAM_ID,
    keys: [
      { pubkey: configPda, isWritable: false, isSigner: false },
      { pubkey: coursePda, isWritable: false, isSigner: false },
      { pubkey: enrollmentPda, isWritable: true, isSigner: false },
      { pubkey: learner, isWritable: false, isSigner: false },
      { pubkey: credentialAsset.publicKey, isWritable: true, isSigner: true },
      { pubkey: trackCollection, isWritable: true, isSigner: false },
      { pubkey: backendSigner.publicKey, isWritable: true, isSigner: true },
      { pubkey: backendSigner.publicKey, isWritable: true, isSigner: true }, // payer
      { pubkey: MPL_CORE_PROGRAM_ID, isWritable: false, isSigner: false },
      { pubkey: SystemProgram.programId, isWritable: false, isSigner: false },
    ],
    data,
  };

  const tx = new Transaction().add(ix);
  const sig = await sendAndConfirmTransaction(connection, tx, [backendSigner, credentialAsset]);

  return { signature: sig, credentialAsset: credentialAsset.publicKey.toBase58() };
});

// Leaderboard (Helius DAS)
app.get('/api/leaderboard', async () => {
  const heliusUrl = process.env.HELIUS_RPC_URL;
  if (!heliusUrl) {
    // Fallback: return empty
    return { entries: [] };
  }

  try {
    const config = await getConfig();
    const res = await fetch(heliusUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: '1',
        method: 'getTokenAccounts',
        params: { mint: config.xpMint.toBase58(), limit: 100 },
      }),
    });
    const data = await res.json();
    const entries = (data.result?.token_accounts || []).map((a: any) => ({
      wallet: a.owner,
      xpBalance: Number(a.amount || 0),
    }));
    return { entries };
  } catch {
    return { entries: [] };
  }
});

// Credentials (Helius DAS)
app.get<{ Params: { wallet: string } }>('/api/credentials/:wallet', async (req) => {
  const heliusUrl = process.env.HELIUS_RPC_URL;
  if (!heliusUrl) return { credentials: [] };

  try {
    const res = await fetch(heliusUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: '1',
        method: 'getAssetsByOwner',
        params: { ownerAddress: req.params.wallet, page: 1, limit: 100 },
      }),
    });
    const data = await res.json();
    const credentials = (data.result?.items || [])
      .filter((item: any) => item.interface === 'MplCoreAsset')
      .map((item: any) => ({
        id: item.id,
        name: item.content?.metadata?.name || 'Credential',
        uri: item.content?.json_uri || '',
        image: item.content?.links?.image || '',
        attributes: Object.fromEntries(
          (item.content?.metadata?.attributes || []).map((a: any) => [a.trait_type, a.value])
        ),
        collection: item.grouping?.find((g: any) => g.group_key === 'collection')?.group_value,
      }));
    return { credentials };
  } catch {
    return { credentials: [] };
  }
});

// Streak
app.post<{ Body: { wallet: string } }>('/api/streak', async (req) => {
  const { wallet } = req.body;
  const today = todayStr();
  const yesterday = yesterdayStr();
  const existing = streaks.get(wallet) || { streak: 0, longest: 0, lastDate: '' };

  if (existing.lastDate === today) {
    return { streak: existing.streak, longest: existing.longest };
  }

  if (existing.lastDate === yesterday) {
    existing.streak += 1;
  } else {
    existing.streak = 1;
  }
  existing.longest = Math.max(existing.longest, existing.streak);
  existing.lastDate = today;
  streaks.set(wallet, existing);

  return { streak: existing.streak, longest: existing.longest };
});

app.get<{ Params: { wallet: string } }>('/api/streak/:wallet', async (req) => {
  const data = streaks.get(req.params.wallet);
  if (!data) return { streak: 0, longest: 0, lastDate: null };

  // Check if streak is still valid
  const today = todayStr();
  const yesterday = yesterdayStr();
  if (data.lastDate !== today && data.lastDate !== yesterday) {
    return { streak: 0, longest: data.longest, lastDate: data.lastDate };
  }
  return data;
});

// Content proxy (Arweave)
app.get<{ Params: { txId: string } }>('/api/content/:txId', async (req) => {
  const res = await fetch(`https://arweave.net/${req.params.txId}`);
  const content = await res.json();
  return { content };
});

// Start
const port = parseInt(process.env.PORT || '3001');
const host = process.env.HOST || '0.0.0.0';

app.listen({ port, host }, (err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Backend running on ${host}:${port}`);
});
