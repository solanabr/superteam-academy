/**
 * POST /api/credentials/issue
 *
 * Backend-signed credential issuance endpoint.
 *
 * Flow:
 * 1. Authenticate the learner via session
 * 2. Verify the course is finalized
 * 3. Issue or upgrade credential NFT
 * 4. Return the credential asset address and tx signature
 *
 * Request body: {
 *   courseId: string,
 *   credentialName: string,
 *   metadataUri?: string, (auto-generated if not provided)
 *   coursesCompleted: number,
 *   totalXp: number,
 *   trackCollection: string,
 * }
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { Connection, PublicKey } from '@solana/web3.js';
import { getRpcUrl, safeErrorDetails } from '@/context/env';
import { loadBackendSigner } from '@/context/solana/backend-signer';
import {
    issueCredential,
    upgradeCredential,
    checkCredentialStatus,
} from '@/context/solana/credential-service';
import { getMetadataUri } from '@/backend/certificate/certificate-metadata';

export async function POST(request: NextRequest) {
    try {
        // 1. Authenticate
        const session = await getServerSession();
        if (!session?.user) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        // 2. Parse and validate body
        const body = await request.json();
        const {
            courseId,
            credentialName,
            metadataUri,
            coursesCompleted,
            totalXp,
            trackCollection,
        } = body;

        if (!courseId || typeof courseId !== 'string') {
            return NextResponse.json(
                { error: 'Missing or invalid courseId' },
                { status: 400 }
            );
        }

        if (!credentialName || !trackCollection) {
            return NextResponse.json(
                { error: 'Missing required fields: credentialName, trackCollection' },
                { status: 400 }
            );
        }


        // 3. Get learner wallet from linked accounts
        const userEmail = session.user.email;
        if (!userEmail) {
            return NextResponse.json(
                { error: 'No email in session' },
                { status: 400 }
            );
        }

        // Lookup wallet from session — the learner's linked wallet address
        // should be in the session via next-auth callbacks
        const walletAddress = (session.user as { walletAddress?: string }).walletAddress;
        if (!walletAddress) {
            return NextResponse.json(
                { error: 'No linked wallet found. Link a wallet first.' },
                { status: 400 }
            );
        }

        const learner = new PublicKey(walletAddress);
        const connection = new Connection(getRpcUrl(), 'confirmed');
        const backendSigner = loadBackendSigner();
        const trackCollectionPubkey = new PublicKey(trackCollection);

        // Auto-generate metadataUri if not provided by frontend
        const resolvedMetadataUri = metadataUri || getMetadataUri(courseId, walletAddress);

        // 4. Check if credential already exists (issue vs upgrade)
        const status = await checkCredentialStatus(connection, courseId, learner);

        if (!status.finalized) {
            return NextResponse.json(
                { error: 'Course not finalized. Complete all lessons first.' },
                { status: 400 }
            );
        }

        if (status.hasCredential && status.credentialAsset) {
            // Upgrade existing credential
            const result = await upgradeCredential(
                connection,
                backendSigner,
                backendSigner, // payer = backend signer
                {
                    learner,
                    courseId,
                    credentialAsset: new PublicKey(status.credentialAsset),
                    newName: credentialName,
                    newMetadataUri: resolvedMetadataUri,
                    coursesCompleted: coursesCompleted ?? 1,
                    totalXp: totalXp ?? 0,
                    trackCollection: trackCollectionPubkey,
                }
            );

            return NextResponse.json({
                action: 'upgraded',
                credentialAsset: status.credentialAsset,
                signature: result.signature,
            });
        }

        // Issue new credential
        const result = await issueCredential(
            connection,
            backendSigner,
            backendSigner, // payer = backend signer
            {
                learner,
                courseId,
                credentialName,
                metadataUri: resolvedMetadataUri,
                coursesCompleted: coursesCompleted ?? 1,
                totalXp: totalXp ?? 0,
                trackCollection: trackCollectionPubkey,
            }
        );

        return NextResponse.json({
            action: 'issued',
            credentialAsset: result.credentialAsset.toBase58(),
            signature: result.signature,
        });
    } catch (error) {
        console.error('Credential issuance failed:', error);
        return NextResponse.json(
            { error: 'Credential operation failed', details: safeErrorDetails(error) },
            { status: 500 }
        );
    }
}
