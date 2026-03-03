/**
 * Backend On-Chain Signer Routes
 * Handles server-signed transactions for lessons, course finalization, and credentials
 * All routes require authentication middleware
 */

import express, { Request, Response } from 'express';
import { Connection, PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { BackendSignerService, createBackendSignerService } from '../anchor/onchain.service';

// Extend Express Request with auth info
interface AuthRequest extends Request {
  userId?: string;
  userAddress?: string;
}

let signerService: BackendSignerService;

function getXpMintAddress(): PublicKey {
  const xpMint = process.env.XP_TOKEN_MINT || process.env.XP_MINT_ADDRESS
  if (!xpMint) {
    throw new Error('XP_TOKEN_MINT is not configured')
  }
  return new PublicKey(xpMint)
}

/**
 * Initialize signer service (called once on backend startup)
 */
export function initializeSignerService() {
  const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
  const connection = new Connection(rpcUrl, 'confirmed');
  signerService = createBackendSignerService(connection);
  console.log(`Signer service initialized. Backend signer: ${signerService.getBackendSignerPublicKey().toString()}`);
}

/**
 * POST /api/onchain/complete-lesson
 * Backend signs a completeLesson transaction
 */
export async function completeLesson(req: AuthRequest, res: Response) {
  try {
    if (!req.userAddress) {
      return res.status(401).json({ error: 'User wallet address required' });
    }

    const { courseId, lessonIndex } = req.body;

    if (!courseId || lessonIndex === undefined) {
      return res.status(400).json({ error: 'Missing courseId or lessonIndex' });
    }

    const learnerAddress = new PublicKey(req.userAddress);
    const xpMintAddress = getXpMintAddress()

    // Backend signer completes the lesson
    const txId = await signerService.completeLesson(
      courseId,
      lessonIndex,
      learnerAddress,
      xpMintAddress
    );

    res.json({
      success: true,
      txId,
      courseId,
      lessonIndex,
      message: `Lesson ${lessonIndex} completed for course ${courseId}`,
    });
  } catch (error) {
    console.error('Error completing lesson:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to complete lesson',
    });
  }
}

/**
 * POST /api/onchain/finalize-course
 * Backend signs a finalizeCourse transaction
 */
export async function finalizeCourse(req: AuthRequest, res: Response) {
  try {
    if (!req.userAddress) {
      return res.status(401).json({ error: 'User wallet address required' });
    }

    const { courseId } = req.body;

    if (!courseId) {
      return res.status(400).json({ error: 'Missing courseId' });
    }

    const learnerAddress = new PublicKey(req.userAddress);
    const xpMintAddress = getXpMintAddress()

    // Backend signer finalizes the course
    const txId = await signerService.finalizeCourse(courseId, learnerAddress, xpMintAddress);

    res.json({
      success: true,
      txId,
      courseId,
      message: `Course ${courseId} finalized`,
    });
  } catch (error) {
    console.error('Error finalizing course:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to finalize course',
    });
  }
}

/**
 * POST /api/onchain/issue-credential
 * Backend signs an issueCredential transaction
 */
export async function issueCredential(req: AuthRequest, res: Response) {
  try {
    if (!req.userAddress) {
      return res.status(401).json({ error: 'User wallet address required' });
    }

    const {
      courseId,
      trackCollectionAddress,
      credentialName,
      metadataUri,
      coursesCompleted,
      totalXp,
    } = req.body;

    if (!courseId || !trackCollectionAddress || !credentialName || !metadataUri) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const learnerAddress = new PublicKey(req.userAddress);
    const trackCollection = new PublicKey(trackCollectionAddress);
    const xpBn = new BN(totalXp);

    // Backend signer issues credential
    const result = await signerService.issueCredential(
      courseId,
      learnerAddress,
      trackCollection,
      credentialName,
      metadataUri,
      coursesCompleted,
      xpBn
    );

    res.json({
      success: true,
      txId: result.txId,
      assetAddress: result.assetAddress.toString(),
      courseId,
      message: `Credential issued for course ${courseId}`,
    });
  } catch (error) {
    console.error('Error issuing credential:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to issue credential',
    });
  }
}

/**
 * POST /api/onchain/upgrade-credential
 * Backend signs an upgradeCredential transaction
 */
export async function upgradeCredential(req: AuthRequest, res: Response) {
  try {
    if (!req.userAddress) {
      return res.status(401).json({ error: 'User wallet address required' });
    }

    const {
      courseId,
      credentialAssetAddress,
      trackCollectionAddress,
      newName,
      newUri,
      coursesCompleted,
      totalXp,
    } = req.body;

    if (
      !courseId ||
      !credentialAssetAddress ||
      !trackCollectionAddress ||
      !newName ||
      !newUri
    ) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const learnerAddress = new PublicKey(req.userAddress);
    const credentialAsset = new PublicKey(credentialAssetAddress);
    const trackCollection = new PublicKey(trackCollectionAddress);
    const xpBn = new BN(totalXp);

    // Backend signer upgrades credential
    const txId = await signerService.upgradeCredential(
      courseId,
      learnerAddress,
      credentialAsset,
      trackCollection,
      newName,
      newUri,
      coursesCompleted,
      xpBn
    );

    res.json({
      success: true,
      txId,
      courseId,
      message: `Credential upgraded for course ${courseId}`,
    });
  } catch (error) {
    console.error('Error upgrading credential:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to upgrade credential',
    });
  }
}

// Create and export router
const router = express.Router();

router.post('/complete-lesson', completeLesson);
router.post('/finalize-course', finalizeCourse);
router.post('/issue-credential', issueCredential);
router.post('/upgrade-credential', upgradeCredential);

export default router;
