import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { connectToDatabase } from '@/lib/mongodb';
import { IndexerSettingsModel } from '@/models/IndexerSettings';
import { MPL_CORE_PROGRAM_ID } from '@/lib/solana/program-config';
import type {
  CertificateVerification,
  CertificateExplorerLinks,
  CertificateAttributes,
} from '@/types/certificate';

// Solana network configuration
const NETWORK = (process.env.NEXT_PUBLIC_SOLANA_NETWORK as 'devnet' | 'mainnet-beta') || 'devnet';
const RPC_URL =
  process.env.SOLANA_RPC_URL || process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl(NETWORK);

type VerificationProvider = 'custom' | 'helius' | 'alchemy';

interface VerifierConfig {
  provider: VerificationProvider;
  network: 'devnet' | 'mainnet-beta';
  rpcUrl: string;
  apiKey: string;
}

interface DasRpcAsset {
  id?: string;
  ownership?: {
    owner?: string;
    frozen?: boolean;
  };
}

/**
 * Service for on-chain certificate/credential verification
 */
export class CredentialVerificationService {
  private connectionCache = new Map<string, Connection>();

  private getConnection(rpcUrl: string): Connection {
    const existing = this.connectionCache.get(rpcUrl);
    if (existing) {
      return existing;
    }

    const connection = new Connection(rpcUrl, 'confirmed');
    this.connectionCache.set(rpcUrl, connection);
    return connection;
  }

  private async getVerifierConfig(): Promise<VerifierConfig> {
    const network =
      (process.env.NEXT_PUBLIC_SOLANA_NETWORK as 'devnet' | 'mainnet-beta') || 'devnet';

    const envProvider = process.env.NEXT_PUBLIC_INDEXER_PROVIDER as VerificationProvider | undefined;
    const fallbackProvider: VerificationProvider =
      envProvider === 'helius' || envProvider === 'alchemy' || envProvider === 'custom'
        ? envProvider
        : 'custom';

    const fallbackConfig: VerifierConfig = {
      provider: fallbackProvider,
      network,
      rpcUrl: RPC_URL,
      apiKey: '',
    };

    try {
      await connectToDatabase();
      const settings = await IndexerSettingsModel.findOne({ key: 'indexer' }).lean();

      if (!settings) {
        return fallbackConfig;
      }

      const provider = settings.activeProvider as VerificationProvider;

      if (provider === 'helius') {
        const apiKey = settings.heliusApiKey || process.env.NEXT_PUBLIC_HELIUS_API_KEY || '';
        const rpcUrl =
          settings.heliusRpcUrl ||
          (apiKey ? `https://${network}.helius-rpc.com/?api-key=${apiKey}` : fallbackConfig.rpcUrl);

        return {
          provider,
          network,
          rpcUrl,
          apiKey,
        };
      }

      if (provider === 'alchemy') {
        const apiKey = settings.alchemyApiKey || process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || '';
        const rpcUrl =
          settings.alchemyRpcUrl ||
          (apiKey
            ? `https://solana-${network}.g.alchemy.com/v2/${apiKey}`
            : fallbackConfig.rpcUrl);

        return {
          provider,
          network,
          rpcUrl,
          apiKey,
        };
      }

      return {
        provider: 'custom',
        network,
        rpcUrl: settings.customRpcUrl || fallbackConfig.rpcUrl,
        apiKey: '',
      };
    } catch {
      return fallbackConfig;
    }
  }

  private async callRpc<T>(rpcUrl: string, method: string, params: unknown): Promise<T | null> {
    try {
      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: `verify-${method}`,
          method,
          params,
        }),
      });

      if (!response.ok) {
        return null;
      }

      const payload = (await response.json()) as {
        result?: T;
        error?: { message?: string };
      };

      if (payload.error) {
        return null;
      }

      return payload.result ?? null;
    } catch {
      return null;
    }
  }

  private async fetchAssetViaIndexer(rpcUrl: string, assetId: string): Promise<DasRpcAsset | null> {
    return this.callRpc<DasRpcAsset>(rpcUrl, 'getAsset', { id: assetId });
  }

  private async checkOwnershipViaIndexer(
    rpcUrl: string,
    assetId: string,
    walletAddress: string
  ): Promise<boolean> {
    const result = await this.callRpc<{ items?: Array<{ id?: string }> }>(rpcUrl, 'searchAssets', {
      ownerAddress: walletAddress,
      page: 1,
      limit: 1000,
      tokenType: 'all',
    });

    if (!result?.items?.length) {
      return false;
    }

    return result.items.some((item) => item.id === assetId);
  }

  /**
   * Verify a certificate NFT on-chain
   */
  async verifyCertificate(mintAddress: string): Promise<CertificateVerification> {
    try {
      const mintPubkey = new PublicKey(mintAddress);
      const config = await this.getVerifierConfig();

      const asset = await this.fetchAssetViaIndexer(config.rpcUrl, mintAddress);
      if (asset) {
        return {
          isValid: true,
          isOnChain: true,
          mintAddress,
          owner: asset.ownership?.owner,
          explorerUrl: this.getExplorerUrl(mintAddress),
          verifiedAt: new Date(),
        };
      }

      const connection = this.getConnection(config.rpcUrl);

      // Get account info to verify it exists
      const accountInfo = await connection.getAccountInfo(mintPubkey);

      if (!accountInfo) {
        return {
          isValid: false,
          isOnChain: false,
          verifiedAt: new Date(),
          errors: ['Certificate NFT not found on-chain'],
        };
      }

      const isMetaplexCoreAsset = accountInfo.owner.equals(MPL_CORE_PROGRAM_ID);

      return {
        isValid: isMetaplexCoreAsset,
        isOnChain: true,
        mintAddress,
        explorerUrl: this.getExplorerUrl(mintAddress),
        verifiedAt: new Date(),
        errors: isMetaplexCoreAsset
          ? undefined
          : ['Asset exists on-chain but is not owned by Metaplex Core program'],
      };
    } catch (error) {
      console.error('Certificate verification error:', error);
      return {
        isValid: false,
        isOnChain: false,
        verifiedAt: new Date(),
        errors: [(error as Error).message || 'Verification failed'],
      };
    }
  }

  /**
   * Verify certificate ownership
   */
  async verifyOwnership(mintAddress: string, walletAddress: string): Promise<boolean> {
    try {
      const verification = await this.verifyCertificate(mintAddress);
      if (!verification.isValid) {
        return false;
      }

      if (verification.owner) {
        return verification.owner.toLowerCase() === walletAddress.toLowerCase();
      }

      const config = await this.getVerifierConfig();
      return await this.checkOwnershipViaIndexer(config.rpcUrl, mintAddress, walletAddress);
    } catch {
      return false;
    }
  }

  /**
   * Fetch certificate metadata from on-chain or URI
   */
  async fetchCertificateMetadata(metadataUri: string): Promise<CertificateAttributes | null> {
    try {
      // Handle IPFS URIs
      let fetchUrl = metadataUri;
      if (metadataUri.startsWith('ipfs://')) {
        const ipfsHash = metadataUri.replace('ipfs://', '');
        fetchUrl = `https://ipfs.io/ipfs/${ipfsHash}`;
      }

      const response = await fetch(fetchUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch metadata');
      }

      const metadata = await response.json();

      // Parse standard NFT metadata to certificate attributes
      return {
        courseName: metadata.name || '',
        courseSlug:
          metadata.attributes?.find(
            (a: { trait_type: string; value: string }) => a.trait_type === 'course_slug'
          )?.value || '',
        recipientName:
          metadata.attributes?.find(
            (a: { trait_type: string; value: string }) => a.trait_type === 'recipient_name'
          )?.value || '',
        recipientAddress:
          metadata.attributes?.find(
            (a: { trait_type: string; value: string }) => a.trait_type === 'recipient_address'
          )?.value || '',
        issuedDate:
          metadata.attributes?.find(
            (a: { trait_type: string; value: string }) => a.trait_type === 'issued_date'
          )?.value || '',
        credentialId:
          metadata.attributes?.find(
            (a: { trait_type: string; value: string }) => a.trait_type === 'credential_id'
          )?.value || '',
        grade:
          metadata.attributes?.find(
            (a: { trait_type: string; value: string }) => a.trait_type === 'grade'
          )?.value || '',
        xpEarned: parseInt(
          metadata.attributes?.find(
            (a: { trait_type: string; value: string }) => a.trait_type === 'xp_earned'
          )?.value || '0'
        ),
        lessonsCompleted: parseInt(
          metadata.attributes?.find(
            (a: { trait_type: string; value: string }) => a.trait_type === 'lessons_completed'
          )?.value || '0'
        ),
        challengesSolved: parseInt(
          metadata.attributes?.find(
            (a: { trait_type: string; value: string }) => a.trait_type === 'challenges_solved'
          )?.value || '0'
        ),
        skills:
          metadata.attributes
            ?.find((a: { trait_type: string; value: string }) => a.trait_type === 'skills')
            ?.value?.split(',') || [],
        completionTime:
          metadata.attributes?.find(
            (a: { trait_type: string; value: string }) => a.trait_type === 'completion_time'
          )?.value || '',
      };
    } catch (error) {
      console.error('Failed to fetch metadata:', error);
      return null;
    }
  }

  /**
   * Get Solana Explorer URL for a mint address
   */
  getExplorerUrl(mintAddress: string): string {
    const cluster = NETWORK === 'mainnet-beta' ? '' : `?cluster=${NETWORK}`;
    return `https://explorer.solana.com/address/${mintAddress}${cluster}`;
  }

  /**
   * Get all explorer links for verification
   */
  getExplorerLinks(mintAddress: string): CertificateExplorerLinks {
    const cluster = NETWORK === 'mainnet-beta' ? '' : `?cluster=${NETWORK}`;
    const solscanCluster = NETWORK === 'mainnet-beta' ? '' : `?cluster=${NETWORK}`;

    return {
      solanaExplorer: `https://explorer.solana.com/address/${mintAddress}${cluster}`,
      solscan: `https://solscan.io/token/${mintAddress}${solscanCluster}`,
      solanaFm: `https://solana.fm/address/${mintAddress}${cluster}`,
      xray: `https://xray.helius.xyz/token/${mintAddress}${cluster}`,
    };
  }

  /**
   * Get transaction explorer URL
   */
  getTransactionUrl(signature: string): string {
    const cluster = NETWORK === 'mainnet-beta' ? '' : `?cluster=${NETWORK}`;
    return `https://explorer.solana.com/tx/${signature}${cluster}`;
  }
}

// Singleton instance
export const credentialVerificationService = new CredentialVerificationService();
