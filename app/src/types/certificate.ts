/**
 * Certificate and Credential Types
 */

// Certificate status
export type CertificateStatus = 'pending' | 'minted' | 'verified' | 'revoked';

// Certificate metadata stored on-chain
export interface OnChainCertificateMetadata {
  name: string;
  symbol: string;
  uri: string;
  sellerFeeBasisPoints: number;
  creators: Array<{
    address: string;
    verified: boolean;
    share: number;
  }>;
}

// Certificate attributes in metadata JSON
export interface CertificateAttributes {
  courseName: string;
  courseSlug: string;
  recipientName: string;
  recipientAddress: string;
  issuedDate: string;
  credentialId: string;
  grade: string;
  xpEarned: number;
  lessonsCompleted: number;
  challengesSolved: number;
  skills: string[];
  completionTime: string;
}

// Full certificate data
export interface Certificate {
  id: string;
  courseName: string;
  courseSlug: string;
  courseDescription: string;
  issuedDate: string;
  expirationDate: string | null;
  credentialId: string;
  recipientName: string;
  recipientAddress: string;
  issuerName: string;
  issuerLogo: string;
  verified: boolean;
  onChain: boolean;
  status: CertificateStatus;
  mintAddress?: string;
  transactionSignature?: string;
  metadataUri?: string;
  skills: string[];
  grade: string;
  completionTime: string;
  lessonsCompleted: number;
  challengesSolved: number;
  xpEarned: number;
}

// Certificate verification result
export interface CertificateVerification {
  isValid: boolean;
  isOnChain: boolean;
  mintAddress?: string;
  owner?: string;
  metadata?: CertificateAttributes;
  explorerUrl?: string;
  verifiedAt: Date;
  errors?: string[];
}

// Certificate minting request
export interface MintCertificateRequest {
  userId: string;
  courseId: string;
  courseSlug: string;
  recipientWallet: string;
  attributes: Omit<CertificateAttributes, 'recipientAddress'>;
}

// Certificate minting result
export interface MintCertificateResult {
  success: boolean;
  mintAddress?: string;
  transactionSignature?: string;
  metadataUri?: string;
  error?: string;
}

// Explorer links for verification
export interface CertificateExplorerLinks {
  solanaExplorer: string;
  solscan: string;
  solanaFm: string;
  xray: string;
}
