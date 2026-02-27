
import { 
    createTree, 
    mplBubblegum, 
    createTree as createTreeInstruction 
} from '@metaplex-foundation/mpl-bubblegum';
import { 
    createNft, 
    mplTokenMetadata 
} from '@metaplex-foundation/mpl-token-metadata';
import { 
    createUmi 
} from '@metaplex-foundation/umi-bundle-defaults';
import { 
    generateSigner, 
    keypairIdentity, 
    percentAmount, 
    none 
} from '@metaplex-foundation/umi';
import dotenv from 'dotenv';
import { clusterApiUrl } from '@solana/web3.js';

dotenv.config({ path: '.env.local' });

async function main() {
    console.log("🚀 Starting cNFT Infrastructure Setup...");

    if (!process.env.SOLANA_PRIVATE_KEY) {
        throw new Error("SOLANA_PRIVATE_KEY not found in .env.local");
    }

    // 1. Setup Umi
    let rpc = process.env.NEXT_PUBLIC_HELIUS_RPC;
    if (!rpc || rpc.includes('your-api-key') || rpc.includes('mock')) {
        console.log("⚠️ meaningful Helius RPC not found, falling back to public Devnet RPC...");
        rpc = clusterApiUrl('devnet');
    }
    
    const umi = createUmi(rpc)
        .use(mplBubblegum())
        .use(mplTokenMetadata());

    // 2. Load Authority Keypair
    const secretKey = Uint8Array.from(JSON.parse(process.env.SOLANA_PRIVATE_KEY));
    const keypair = umi.eddsa.createKeypairFromSecretKey(secretKey);
    umi.use(keypairIdentity(keypair));

    console.log(`🔑 Authority: ${keypair.publicKey}`);

    // 3. Create Merkle Tree
    console.log("\n🌳 Creating Merkle Tree...");
    const merkleTree = generateSigner(umi);
    
    // 14 depth, 64 buffer size = 16,384 leaves (credentials)
    // Cost: ~0.05 SOL
    const builder = await createTree(umi, {
        merkleTree,
        maxDepth: 14,
        maxBufferSize: 64,
        public: false, // Only authority can mint
    });
    
    await builder.sendAndConfirm(umi);
    console.log(`✅ Merkle Tree Created: ${merkleTree.publicKey}`);

    // 4. Create Collection NFT
    console.log("\n🎨 Creating Collection NFT...");
    const collectionMint = generateSigner(umi);
    
    await createNft(umi, {
        mint: collectionMint,
        name: "Superteam Academy Credentials",
        symbol: "STAC",
        uri: "https://superteam.fun/academy-metadata.json", // Placeholder
        sellerFeeBasisPoints: percentAmount(0),
        isCollection: true,
    }).sendAndConfirm(umi);

    console.log(`✅ Collection NFT Created: ${collectionMint.publicKey}`);

    // 5. Output
    console.log("\n\n--------------------------------------------------");
    console.log("📝 ADD THIS TO YOUR .env.local FILE:");
    console.log("--------------------------------------------------");
    console.log(`NEXT_PUBLIC_CREDENTIAL_TREE_ADDRESS=${merkleTree.publicKey}`);
    console.log(`NEXT_PUBLIC_COLLECTION_MINT=${collectionMint.publicKey}`);
    console.log("--------------------------------------------------");
}

main().catch(err => {
    console.error(err);
});
