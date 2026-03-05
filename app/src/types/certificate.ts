export interface CertificateData {
  courseSlug: string;
  courseTitle: string;
  mintedAt: string; // ISO
  txSig?: string;
  isOnChain: boolean;
  assetId?: string; // Helius DAS
  track?: string;
}
