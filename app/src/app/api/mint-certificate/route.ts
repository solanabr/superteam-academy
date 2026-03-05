import { NextRequest, NextResponse } from "next/server";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  createTree,
  mintV1,
  findTreeConfigPda,
  fetchTreeConfig,
  mplBubblegum,
} from "@metaplex-foundation/mpl-bubblegum";
import {
  createSignerFromKeypair,
  generateSigner,
  keypairIdentity,
  publicKey,
  type Umi,
} from "@metaplex-foundation/umi";
import bs58 from "bs58";

const RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC ?? "https://api.devnet.solana.com";

// Tree address stored after first creation
let TREE_ADDRESS: string | null = process.env.CNFT_TREE_ADDRESS ?? null;

function getMintAuthority(): Uint8Array {
  const secret = process.env.MINT_AUTHORITY_SECRET;
  if (!secret) throw new Error("MINT_AUTHORITY_SECRET not configured");
  return Uint8Array.from(Buffer.from(secret, "base64"));
}

function createConfiguredUmi() {
  const umi = createUmi(RPC_URL).use(mplBubblegum());
  const secretKey = getMintAuthority();
  const keypair = umi.eddsa.createKeypairFromSecretKey(secretKey);
  const signer = createSignerFromKeypair(umi, keypair);
  umi.use(keypairIdentity(signer));
  return { umi, signer };
}

async function ensureTree(umi: Umi): Promise<string> {
  if (TREE_ADDRESS) {
    // Verify tree exists
    try {
      const treeConfig = findTreeConfigPda(umi, {
        merkleTree: publicKey(TREE_ADDRESS),
      });
      await fetchTreeConfig(umi, treeConfig);
      return TREE_ADDRESS;
    } catch {
      // Tree doesn't exist or is invalid, create new one
      console.log("[mint-api] Stored tree invalid, creating new one...");
    }
  }

  // Create a new Merkle tree (depth=14, bufferSize=64 → 16384 leaves)
  // Small enough to be affordable on devnet
  console.log("[mint-api] Creating Merkle tree...");
  const merkleTree = generateSigner(umi);

  const builder = await createTree(umi, {
    merkleTree,
    maxDepth: 14,
    maxBufferSize: 64,
  });

  await builder.sendAndConfirm(umi, { confirm: { commitment: "confirmed" } });

  TREE_ADDRESS = merkleTree.publicKey.toString();
  console.log("[mint-api] Tree created:", TREE_ADDRESS);
  return TREE_ADDRESS;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { wallet, courseSlug, courseTitle, track } = body;

    if (!wallet || !courseSlug || !courseTitle) {
      return NextResponse.json(
        { error: "Missing required fields: wallet, courseSlug, courseTitle" },
        { status: 400 },
      );
    }

    const { umi } = createConfiguredUmi();
    const treeAddress = await ensureTree(umi);

    // Mint cNFT
    const leafOwner = publicKey(wallet);
    const merkleTree = publicKey(treeAddress);

    const { signature } = await mintV1(umi, {
      leafOwner,
      merkleTree,
      metadata: {
        name: `Superteam Academy: ${courseTitle}`,
        uri: "",
        sellerFeeBasisPoints: 0,
        collection: null,
        creators: [
          {
            address: umi.identity.publicKey,
            verified: true,
            share: 100,
          },
        ],
      },
    }).sendAndConfirm(umi, { confirm: { commitment: "confirmed" } });

    // Convert signature bytes to base58
    const bs58Sig = bs58.encode(signature);

    return NextResponse.json({
      success: true,
      txSig: bs58Sig,
      treeAddress,
      courseSlug,
      courseTitle,
      track,
    });
  } catch (err) {
    console.error("[mint-api] Error:", err);
    return NextResponse.json(
      { error: String(err instanceof Error ? err.message : err) },
      { status: 500 },
    );
  }
}
