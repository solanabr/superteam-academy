import { Connection, Keypair, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getMint, getOrCreateAssociatedTokenAccount, mintTo } from '@solana/spl-token';

const RPC = 'https://devnet.helius-rpc.com/?api-key=b68b97dc-101d-4736-9368-2a9ffec93463';
const PRIVATE_KEY = [254,58,62,147,188,62,239,150,2,186,195,183,205,134,79,251,175,172,191,103,26,145,199,186,54,171,151,23,105,236,50,220,111,28,94,213,11,219,147,21,6,51,52,11,113,124,28,250,181,180,60,232,164,202,200,117,120,11,92,255,80,88,22,44];
const MINT_ADDRESS = 'GJumUBRPeu4mx7Cx11TtjcAA5b2gvdAteZzgpz5fwRHZ';

async function main() {
    const connection = new Connection(RPC, 'confirmed');
    const authority = Keypair.fromSecretKey(Uint8Array.from(PRIVATE_KEY));
    const mint = new PublicKey(MINT_ADDRESS);

    console.log('=== XP Mint Diagnostic ===');
    console.log(`Authority Wallet: ${authority.publicKey.toString()}`);

    // 1. Check SOL balance of authority
    const balance = await connection.getBalance(authority.publicKey);
    console.log(`Authority SOL Balance: ${balance / LAMPORTS_PER_SOL} SOL`);
    if (balance < 0.01 * LAMPORTS_PER_SOL) {
        console.error('❌ PROBLEM: Authority wallet has insufficient SOL for transaction fees!');
        console.log('   Fix: Run `solana airdrop 2 ' + authority.publicKey.toString() + ' --url devnet`');
        return;
    } else {
        console.log('✅ Authority has enough SOL for fees.');
    }

    // 2. Check mint info
    const mintInfo = await getMint(connection, mint);
    console.log(`Mint Authority: ${mintInfo.mintAuthority?.toString() || 'NONE (frozen!)'}`);
    console.log(`Mint Decimals: ${mintInfo.decimals}`);
    console.log(`Current Supply: ${mintInfo.supply.toString()}`);

    if (!mintInfo.mintAuthority) {
        console.error('❌ PROBLEM: Mint authority is null — the mint is frozen! No one can mint new tokens.');
        return;
    }

    if (mintInfo.mintAuthority.toString() !== authority.publicKey.toString()) {
        console.error(`❌ PROBLEM: Mint authority mismatch!`);
        console.error(`   On-chain authority: ${mintInfo.mintAuthority.toString()}`);
        console.error(`   Your .env key:     ${authority.publicKey.toString()}`);
        return;
    }
    console.log('✅ Mint authority matches your private key.');

    // 3. Try a test mint of 1 XP to the authority's own wallet
    console.log('\n--- Test Mint: 1 XP to authority wallet ---');
    try {
        const ata = await getOrCreateAssociatedTokenAccount(connection, authority, mint, authority.publicKey);
        console.log(`Authority ATA: ${ata.address.toString()} (balance: ${ata.amount.toString()})`);
        
        const tx = await mintTo(connection, authority, mint, ata.address, authority, 1);
        console.log(`✅ Test mint succeeded! TX: ${tx}`);
    } catch (err: any) {
        console.error(`❌ Test mint FAILED: ${err.message}`);
        if (err.logs) {
            console.error('Transaction logs:', err.logs);
        }
    }
}

main().catch(console.error);
