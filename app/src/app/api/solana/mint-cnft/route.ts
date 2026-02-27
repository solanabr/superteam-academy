
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { 
    createUmi as createUmiDirect,
    keypairIdentity, 
    publicKey,
    none
} from '@metaplex-foundation/umi';
import { 
    mplBubblegum, 
    mintToCollectionV1 
} from '@metaplex-foundation/mpl-bubblegum';
import { NextResponse } from 'next/server';
import { clusterApiUrl } from '@solana/web3.js';

export async function POST(req: Request) {
    try {
        const { walletAddress, courseTitle, courseSlug } = await req.json();

        console.log(`[cNFT] Request: wallet=${walletAddress}, course=${courseTitle}`);

        if (!process.env.SOLANA_PRIVATE_KEY || 
            !process.env.NEXT_PUBLIC_CREDENTIAL_TREE_ADDRESS || 
            !process.env.NEXT_PUBLIC_COLLECTION_MINT) {
            console.error('[cNFT] Missing env vars');
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        // Setup Umi
        let rpc = process.env.NEXT_PUBLIC_HELIUS_RPC;
        if (!rpc || rpc.includes('your-api-key') || rpc.includes('mock')) {
             rpc = clusterApiUrl('devnet');
        }
        const umi = createUmi(rpc).use(mplBubblegum());

        // Load Authority
        const secretKey = Uint8Array.from(JSON.parse(process.env.SOLANA_PRIVATE_KEY));
        const keypair = umi.eddsa.createKeypairFromSecretKey(secretKey);
        umi.use(keypairIdentity(keypair));

        // Mint cNFT
        const treeAddress = publicKey(process.env.NEXT_PUBLIC_CREDENTIAL_TREE_ADDRESS);
        const collectionMint = publicKey(process.env.NEXT_PUBLIC_COLLECTION_MINT);
        
        // Use hosted metadata JSON with full description
        const metadataUri = `https://raw.githubusercontent.com/Nihal-Pandey-2302/superteam-brazil-academy/main/app/public/credential-metadata.json`;

        console.log(`[cNFT] Minting to ${walletAddress} for "${courseTitle}"`);

        const { signature } = await mintToCollectionV1(umi, {
            leafOwner: publicKey(walletAddress),
            merkleTree: treeAddress,
            collectionMint: collectionMint,
            metadata: {
                name: `${courseTitle} — Certificate`,
                symbol: "STCRED",
                uri: metadataUri,
                sellerFeeBasisPoints: 0,
                collection: { key: collectionMint, verified: false },
                creators: [
                    { address: keypair.publicKey, verified: true, share: 100 }
                ],
            },
        }).sendAndConfirm(umi);

        const sigString = Buffer.from(signature).toString('hex');
        console.log(`[cNFT] ✅ Minted! Sig: ${sigString.slice(0, 40)}...`);
        
        return NextResponse.json({ success: true, signature: sigString });

    } catch (error: any) {
        console.error("[cNFT] ❌ Minting Error:", error.message);
        if (error.logs) console.error("[cNFT] TX Logs:", error.logs);
        return NextResponse.json({ error: 'Failed to mint credential', details: error.message }, { status: 500 });
    }
}
