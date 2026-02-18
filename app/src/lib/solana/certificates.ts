/**
 * Certificate minting via Metaplex Bubblegum (compressed NFTs).
 * 
 * Uses compressed NFTs for cost-efficient on-chain certificates.
 * A single Merkle tree can hold millions of certificates for ~$0.001 each.
 */

import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { 
  createTree, 
  mintV1, 
  mplBubblegum 
} from '@metaplex-foundation/mpl-bubblegum'
import { 
  generateSigner, 
  keypairIdentity, 
  publicKey,
  type Umi 
} from '@metaplex-foundation/umi'

const SOLANA_RPC = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com'

export interface CertificateMetadata {
  name: string
  symbol: string
  uri: string // Off-chain metadata JSON URL
  courseName: string
  studentWallet: string
  completionDate: string
  grade?: string
}

/**
 * Initialize UMI client with Bubblegum plugin.
 */
export function createUmiClient(secretKey?: Uint8Array): Umi {
  const umi = createUmi(SOLANA_RPC).use(mplBubblegum())
  
  if (secretKey) {
    const keypair = umi.eddsa.createKeypairFromSecretKey(secretKey)
    umi.use(keypairIdentity(keypair))
  }
  
  return umi
}

/**
 * Create a Merkle tree for storing compressed NFT certificates.
 * Only needs to be done once per deployment.
 * 
 * maxDepth=14, maxBufferSize=64 → supports ~16,384 certificates
 */
export async function createCertificateTree(umi: Umi) {
  const merkleTree = generateSigner(umi)
  
  const builder = await createTree(umi, {
    merkleTree,
    maxDepth: 14,
    maxBufferSize: 64,
    public: false, // Only authority can mint
  })
  
  await builder.sendAndConfirm(umi)
  
  return {
    merkleTree: merkleTree.publicKey,
    signature: 'pending' as string,
  }
}

/**
 * Mint a certificate as a compressed NFT.
 */
export async function mintCertificate(
  umi: Umi,
  merkleTreeAddress: string,
  metadata: CertificateMetadata
) {
  const { signature } = await mintV1(umi, {
    leafOwner: publicKey(metadata.studentWallet),
    merkleTree: publicKey(merkleTreeAddress),
    metadata: {
      name: metadata.name,
      symbol: metadata.symbol || 'STCERT',
      uri: metadata.uri,
      sellerFeeBasisPoints: 0,
      collection: null,
      creators: [
        {
          address: umi.identity.publicKey,
          verified: true,
          share: 100,
        },
      ],
    },
  }).sendAndConfirm(umi)

  return {
    signature: signature.toString(),
    leafOwner: metadata.studentWallet,
    merkleTree: merkleTreeAddress,
  }
}

/**
 * Generate off-chain metadata JSON for a certificate.
 * This would be uploaded to Arweave/IPFS in production.
 */
export function generateCertificateMetadata(
  courseName: string,
  studentName: string,
  completionDate: string,
  grade?: string
): object {
  return {
    name: `Superteam Academy - ${courseName}`,
    symbol: 'STCERT',
    description: `Certificate of completion for "${courseName}" from Superteam Academy Brazil.`,
    image: 'https://superteam-academy.vercel.app/certificate-template.png',
    external_url: 'https://superteam-academy.vercel.app',
    attributes: [
      { trait_type: 'Course', value: courseName },
      { trait_type: 'Student', value: studentName },
      { trait_type: 'Completion Date', value: completionDate },
      { trait_type: 'Issuer', value: 'Superteam Brazil' },
      { trait_type: 'Platform', value: 'Superteam Academy' },
      ...(grade ? [{ trait_type: 'Grade', value: grade }] : []),
    ],
    properties: {
      category: 'certificate',
      files: [],
    },
  }
}
