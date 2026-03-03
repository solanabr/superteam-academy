import { Copy, Linkedin, LucideIcon, Twitter } from 'lucide-react'

export interface CertificateData {
  id: string
  courseName: string
  recipientName: string
  issueDate: string
  xpEarned: number
  skills: string[]
  mintAddress: string
  ownerAddress: string
  metadataUri: string
  imageUrl: string
}

export const MOCK_CERTIFICATE: CertificateData = {
  id: 'cert_123abc',
  courseName: 'Solana Fundamentals',
  recipientName: 'Alex Rivera',
  issueDate: 'October 15, 2024',
  xpEarned: 2500,
  skills: ['Rust', 'Anchor', 'PDAs', 'CPIs'],
  mintAddress: '8xKX2a...9mNp',
  ownerAddress: '7xKX...4mNp',
  metadataUri: 'https://arweave.net/metadata_hash',
  imageUrl: '/certificates/solana-fundamentals.png', // Fallback or base image
}

export const SHARE_OPTIONS: { id: string; name: string; icon: LucideIcon }[] = [
  { id: 'twitter', name: 'Share on X', icon: Twitter },
  { id: 'linkedin', name: 'Share on LinkedIn', icon: Linkedin },
  { id: 'copy', name: 'Copy Link', icon: Copy },
]
