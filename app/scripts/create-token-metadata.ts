import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { createV1, mplTokenMetadata, TokenStandard } from '@metaplex-foundation/mpl-token-metadata';
import { keypairIdentity, publicKey as umiPublicKey, percentAmount } from '@metaplex-foundation/umi';

const RPC = 'https://devnet.helius-rpc.com/?api-key=b68b97dc-101d-4736-9368-2a9ffec93463';
const PRIVATE_KEY = [254,58,62,147,188,62,239,150,2,186,195,183,205,134,79,251,175,172,191,103,26,145,199,186,54,171,151,23,105,236,50,220,111,28,94,213,11,219,147,21,6,51,52,11,113,124,28,250,181,180,60,232,164,202,200,117,120,11,92,255,80,88,22,44];
const MINT_ADDRESS = 'GJumUBRPeu4mx7Cx11TtjcAA5b2gvdAteZzgpz5fwRHZ';

// Off-chain metadata JSON (hosted on a public URL)
// We'll use a raw GitHub gist or arweave link. For now, let's use a data URI approach.
const TOKEN_METADATA = {
    name: "Superteam Academy XP",
    symbol: "STXP",
    // This URI should point to a JSON file with the token's off-chain metadata (image, description, etc.)
    // We'll create and host it below
    uri: "https://raw.githubusercontent.com/Nihal-Pandey-2302/superteam-brazil-academy/main/app/public/token-metadata.json",
};

async function main() {
    console.log('=== Creating Token Metadata ===');
    console.log(`Name: ${TOKEN_METADATA.name}`);
    console.log(`Symbol: ${TOKEN_METADATA.symbol}`);
    console.log(`Mint: ${MINT_ADDRESS}`);

    const umi = createUmi(RPC).use(mplTokenMetadata());

    // Create keypair from secret
    const secretKey = Uint8Array.from(PRIVATE_KEY);
    const keypair = umi.eddsa.createKeypairFromSecretKey(secretKey);
    umi.use(keypairIdentity(keypair));

    console.log(`Authority: ${keypair.publicKey}`);

    try {
        const tx = await createV1(umi, {
            mint: umiPublicKey(MINT_ADDRESS),
            authority: keypair,
            name: TOKEN_METADATA.name,
            symbol: TOKEN_METADATA.symbol,
            uri: TOKEN_METADATA.uri,
            sellerFeeBasisPoints: percentAmount(0),
            tokenStandard: TokenStandard.Fungible,
        }).sendAndConfirm(umi);

        console.log('\n✅ Token metadata created successfully!');
        console.log('Your token will now show as:');
        console.log(`  Name:   ${TOKEN_METADATA.name}`);
        console.log(`  Symbol: ${TOKEN_METADATA.symbol}`);
        console.log('\nIt may take a few minutes for wallets to refresh the metadata.');
    } catch (err: any) {
        console.error('\n❌ Failed to create metadata:', err.message);
        if (err.message?.includes('already in use')) {
            console.log('\nMetadata already exists! Trying to update instead...');
            // If metadata already exists, we need updateV1 instead
            const { updateV1 } = await import('@metaplex-foundation/mpl-token-metadata');
            try {
                await updateV1(umi, {
                    mint: umiPublicKey(MINT_ADDRESS),
                    authority: keypair,
                    data: {
                        name: TOKEN_METADATA.name,
                        symbol: TOKEN_METADATA.symbol,
                        uri: TOKEN_METADATA.uri,
                        sellerFeeBasisPoints: 0,
                        creators: null,
                    },
                }).sendAndConfirm(umi);
                console.log('✅ Token metadata updated successfully!');
            } catch (updateErr: any) {
                console.error('❌ Update also failed:', updateErr.message);
            }
        }
    }
}

main().catch(console.error);
