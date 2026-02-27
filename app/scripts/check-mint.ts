
import { Connection, PublicKey } from '@solana/web3.js';
import { getMint } from '@solana/spl-token';

const RPC = 'https://devnet.helius-rpc.com/?api-key=b68b97dc-101d-4736-9368-2a9ffec93463';
const MINT = new PublicKey('GJumUBRPeu4mx7Cx11TtjcAA5b2gvdAteZzgpz5fwRHZ');

async function main() {
    const connection = new Connection(RPC);
    const mintInfo = await getMint(connection, MINT);
    console.log(`Mint Decimals: ${mintInfo.decimals}`);
    console.log(`Supply: ${mintInfo.supply}`);
}

main().catch(console.error);
