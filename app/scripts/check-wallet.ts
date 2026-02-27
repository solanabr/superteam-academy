
import { Connection, PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

const RPC = 'https://devnet.helius-rpc.com/?api-key=b68b97dc-101d-4736-9368-2a9ffec93463';
const WALLET = '8UjM2xpwa4d1Sa9dZK4D8b59xFnRQ4WM4SCoAtnMf3BH'; // Defaulting to the authority itself for testing, but ideally need user wallet.
// Actually, I don't have the user's wallet address.
// BUT, I can check the AUTHORITY'S wallet to see if it has the token (it should have 1 million supply).

async function main() {
    const connection = new Connection(RPC);
    const wallet = new PublicKey(WALLET);
    
    console.log(`Checking Token Accounts for: ${WALLET}`);
    
    const accounts = await connection.getParsedTokenAccountsByOwner(wallet, {
        programId: TOKEN_PROGRAM_ID
    });

    console.log(`Found ${accounts.value.length} token accounts.`);
    
    accounts.value.forEach((account) => {
        const info = account.account.data.parsed.info;
        const mint = info.mint;
        const amount = info.tokenAmount.uiAmount;
        const decimals = info.tokenAmount.decimals;
        
        console.log(`Mint: ${mint} | Balance: ${amount} (Decimals: ${decimals})`);
    });
}

main().catch(console.error);
