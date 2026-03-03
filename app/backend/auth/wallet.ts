import { PublicKey } from '@solana/web3.js';
import nacl from 'tweetnacl';
import bs58 from 'bs58';
import { randomBytes } from 'crypto';
import { prisma } from '@/backend/prisma';

const AUTH_MESSAGE = 'Sign this message to authenticate with Superteam Academy';

export function generateAuthMessage(walletAddress: string): string {
    const nonce = randomBytes(32).toString('hex');
    const timestamp = Date.now();
    return `${AUTH_MESSAGE}\n\nWallet: ${walletAddress}\nNonce: ${nonce}\nTimestamp: ${timestamp}`;
}

export function verifyWalletSignature(
    walletAddress: string,
    message: string,
    signature: string
): boolean {
    try {
        const publicKey = new PublicKey(walletAddress);
        const messageBytes = new TextEncoder().encode(message);
        const signatureBytes = bs58.decode(signature);

        return nacl.sign.detached.verify(
            messageBytes,
            signatureBytes,
            publicKey.toBytes()
        );
    } catch {
        return false;
    }
}

export async function findUserByWallet(walletAddress: string) {
    const link = await prisma.linked_accounts.findFirst({
        where: { provider: 'wallet', provider_id: walletAddress },
        select: { user_id: true },
    });

    if (!link) return null;

    const profile = await prisma.profiles.findUnique({
        where: { id: link.user_id },
    });

    return profile;
}

export async function createUserWithWallet(walletAddress: string) {
    const user = await prisma.profiles.create({
        data: {
            wallet_address: walletAddress,
            name: `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`,
        },
    });

    await prisma.linked_accounts.create({
        data: {
            user_id: user.id,
            provider: 'wallet',
            provider_id: walletAddress,
        },
    });

    return user;
}
