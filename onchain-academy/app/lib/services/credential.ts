// lib/services/credential.ts

/**
 * CREDENTIAL SERVICE
 * 
 * Manages on-chain credentials (NFTs) using Metaplex
 * Issues compressed NFTs for course completion
 */

import { Connection, PublicKey } from '@solana/web3.js';
import { Credential, CredentialAttribute } from '@/lib/types/domain';

/**
 * Interface for Credential Service
 */
export interface ICredentialService {
  /** Mint a completion credential NFT */
  mintCredential(
    userId: string,
    courseId: string,
    courseName: string,
    metadata: CredentialMetadata
  ): Promise<Credential>;
  
  /** Get all credentials for a user */
  getUserCredentials(userId: string): Promise<Credential[]>;
  
  /** Verify a credential exists on-chain */
  verifyCredential(mintAddress: string): Promise<boolean>;
  
  /** Get credential metadata from chain */
  getCredentialMetadata(mintAddress: string): Promise<CredentialMetadata | null>;
}

/**
 * Credential metadata structure
 */
export interface CredentialMetadata {
  name: string;
  symbol: string;
  description: string;
  image: string;
  attributes: CredentialAttribute[];
  externalUrl?: string;
}

/**
 * MOCK CREDENTIAL SERVICE
 * 
 * For development without Metaplex
 */
export class MockCredentialService implements ICredentialService {
  private credentials = new Map<string, Credential[]>();

  async mintCredential(
    userId: string,
    courseId: string,
    courseName: string,
    metadata: CredentialMetadata
  ): Promise<Credential> {
    // Simulate minting delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Generate mock mint address
    const mockMintAddress = `${userId.substring(0, 8)}-${courseId}-${Date.now()}`;
    
    const credential: Credential = {
      id: mockMintAddress,
      mintAddress: mockMintAddress,
      courseId,
      courseName,
      issuedAt: new Date().toISOString(),
      metadataUri: `https://arweave.net/mock-${mockMintAddress}`,
      imageUri: metadata.image,
      attributes: metadata.attributes,
    };
    
    // Store credential
    const userCredentials = this.credentials.get(userId) || [];
    userCredentials.push(credential);
    this.credentials.set(userId, userCredentials);
    
    console.log('🎓 Mock Credential Minted:', {
      user: userId.substring(0, 8),
      course: courseName,
      mint: mockMintAddress,
    });
    
    return credential;
  }

  async getUserCredentials(userId: string): Promise<Credential[]> {
    return this.credentials.get(userId) || [];
  }

  async verifyCredential(mintAddress: string): Promise<boolean> {
    // In mock, always return true if it exists in our map
    for (const credentials of this.credentials.values()) {
      if (credentials.some(c => c.mintAddress === mintAddress)) {
        return true;
      }
    }
    return false;
  }

  async getCredentialMetadata(mintAddress: string): Promise<CredentialMetadata | null> {
    // Find credential
    for (const credentials of this.credentials.values()) {
      const credential = credentials.find(c => c.mintAddress === mintAddress);
      if (credential) {
        return {
          name: credential.courseName,
          symbol: 'CERT',
          description: `Completion certificate for ${credential.courseName}`,
          image: credential.imageUri,
          attributes: credential.attributes,
        };
      }
    }
    return null;
  }
}

/**
 * ON-CHAIN CREDENTIAL SERVICE
 * 
 * Real Metaplex NFT minting
 * 
 * This would use @metaplex-foundation/js for actual minting
 * Structure shown for demonstration
 */
export class OnChainCredentialService implements ICredentialService {
  private connection: Connection;
  
  constructor(rpcUrl?: string) {
    this.connection = new Connection(
      rpcUrl || process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com',
      'confirmed'
    );
  }

  async mintCredential(
    userId: string,
    courseId: string,
    courseName: string,
    metadata: CredentialMetadata
  ): Promise<Credential> {
    /**
     * METAPLEX MINTING FLOW:
     * 
     * 1. Upload metadata to Arweave/IPFS
     * 2. Create mint account
     * 3. Mint compressed NFT using Bubblegum
     * 4. Transfer to user
     * 
     * Example with Metaplex SDK:
     * 
     * const { nft } = await metaplex
     *   .nfts()
     *   .create({
     *     uri: metadataUri,
     *     name: metadata.name,
     *     symbol: metadata.symbol,
     *     sellerFeeBasisPoints: 0,
     *     creators: [
     *       {
     *         address: programAuthority,
     *         share: 100,
     *       },
     *     ],
     *   });
     * 
     * For compressed NFTs (cheaper):
     * 
     * const { nft } = await metaplex
     *   .nfts()
     *   .createCompressedNft({
     *     uri: metadataUri,
     *     name: metadata.name,
     *     sellerFeeBasisPoints: 0,
     *   });
     */
    
    console.log('🔗 OnChain Credential Minting:', {
      user: userId.substring(0, 8),
      course: courseName,
      network: this.connection.rpcEndpoint,
    });
    
    // STUB: In production, this would actually mint
    throw new Error('OnChain credential minting requires Metaplex SDK integration');
  }

  async getUserCredentials(userId: string): Promise<Credential[]> {
    /**
     * FETCH USER NFTs:
     * 
     * const userPublicKey = new PublicKey(userId);
     * 
     * const nfts = await metaplex
     *   .nfts()
     *   .findAllByOwner({ owner: userPublicKey });
     * 
     * Filter for our program's NFTs and map to Credential type
     */
    
    console.log('🔍 Fetching credentials from chain for:', userId.substring(0, 8));
    
    // STUB
    return [];
  }

  async verifyCredential(mintAddress: string): Promise<boolean> {
    /**
     * VERIFY NFT EXISTS:
     * 
     * const mint = new PublicKey(mintAddress);
     * const nft = await metaplex.nfts().findByMint({ mintAddress: mint });
     * 
     * return nft !== null;
     */
    
    try {
      const mint = new PublicKey(mintAddress);
      const accountInfo = await this.connection.getAccountInfo(mint);
      return accountInfo !== null;
    } catch {
      return false;
    }
  }

  async getCredentialMetadata(mintAddress: string): Promise<CredentialMetadata | null> {
    /**
     * FETCH NFT METADATA:
     * 
     * const mint = new PublicKey(mintAddress);
     * const nft = await metaplex.nfts().findByMint({ mintAddress: mint });
     * 
     * if (!nft.uri) return null;
     * 
     * const response = await fetch(nft.uri);
     * const metadata = await response.json();
     * 
     * return metadata;
     */
    
    console.log('🔍 Fetching metadata for:', mintAddress);
    
    // STUB
    return null;
  }
}

/**
 * Helper to generate credential metadata
 */
export function generateCredentialMetadata(
  courseName: string,
  completionDate: string,
  xpEarned: number,
  userName?: string
): CredentialMetadata {
  const date = new Date(completionDate);
  const formattedDate = date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  return {
    name: `${courseName} - Completion Certificate`,
    symbol: 'CERT',
    description: `This certificate verifies completion of "${courseName}" on Superteam Academy. Issued on ${formattedDate}.`,
    image: `https://superteam.academy/certificates/${courseName.toLowerCase().replace(/\s+/g, '-')}.png`,
    attributes: [
      {
        trait_type: 'Course',
        value: courseName,
      },
      {
        trait_type: 'Completion Date',
        value: formattedDate,
      },
      {
        trait_type: 'XP Earned',
        value: xpEarned,
      },
      {
        trait_type: 'Platform',
        value: 'Superteam Academy',
      },
      ...(userName ? [{
        trait_type: 'Learner',
        value: userName,
      }] : []),
    ],
    externalUrl: 'https://superteam.academy',
  };
}
