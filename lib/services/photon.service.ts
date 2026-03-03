/**
 * Photon ZK Compression Service
 *
 * Queries Photon indexer for:
 * - Compressed account state (credentials)
 * - ZK validity proofs
 *
 * Used by: Certificate pages, issue_credential instruction
 *
 * Docs: https://docs.helius.xyz/guides/photon-compression
 */

import { PublicKey } from '@solana/web3.js'

const PHOTON_API_BASE = process.env.NEXT_PUBLIC_PHOTON_API_URL || 'https://api.helius.xyz/photon'

export interface CompressedAccount {
  address: PublicKey
  owner: PublicKey
  lamports: number
  data: Buffer
  executable: boolean
  rentEpoch: number
}

export interface ValidityProof {
  proof: Buffer
  root: Buffer
  leafIndex: bigint
  proof_length: number
}

export class PhotonService {
  private apiKey: string

  constructor(apiKey = process.env.NEXT_PUBLIC_HELIUS_API_KEY || '') {
    this.apiKey = apiKey
  }

  /**
   * Get compressed account data from Photon indexer
   *
   * @param address - Derived address of credential account
   * @returns Account data or null if not found
   */
  async getCompressedAccount(address: PublicKey): Promise<CompressedAccount | null> {
    // TODO: Implement Photon query
    // POST https://api.helius.xyz/photon/getCompressedAccount
    // Body: { jsonrpc: "2.0", method: "getCompressedAccount", params: [address], id: 1 }

    try {
      const response = await fetch(`${PHOTON_API_BASE}/getCompressedAccount`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'getCompressedAccount',
          params: [address.toBase58()],
          id: 1,
        }),
      })

      if (!response.ok) {
        console.error('Photon error:', response.status)
        return null
      }

      const data = await response.json()
      return data.result || null
    } catch (error) {
      console.error('Failed to fetch compressed account:', error)
      return null
    }
  }

  /**
   * Get ZK validity proof for an account
   *
   * Used in: issue_credential instruction to prove account state
   *
   * @param address - Account to prove
   * @returns Proof for inclusion in TX
   */
  async getValidityProof(address: PublicKey): Promise<ValidityProof | null> {
    // TODO: Implement Photon validity proof query
    // POST https://api.helius.xyz/photon/getValidityProof

    try {
      const response = await fetch(`${PHOTON_API_BASE}/getValidityProof`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'getValidityProof',
          params: [address.toBase58()],
          id: 1,
        }),
      })

      if (!response.ok) {
        console.error('Photon proof error:', response.status)
        return null
      }

      const data = await response.json()
      return data.result || null
    } catch (error) {
      console.error('Failed to fetch validity proof:', error)
      return null
    }
  }

  /**
   * Query multiple credentials by user + filter by track
   * Used for: Profile page, certificate list
   *
   * @param learnerAddress - User wallet
   * @param trackId - Optional: filter by track
   * @returns Array of credential accounts
   */
  async getCredentials(learnerAddress: PublicKey, trackId?: number): Promise<CompressedAccount[]> {
    // TODO: Implement Photon search by owner
    // POST https://api.helius.xyz/photon/getCompressedAccountsByOwner

    try {
      const response = await fetch(`${PHOTON_API_BASE}/getCompressedAccountsByOwner`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'getCompressedAccountsByOwner',
          params: [learnerAddress.toBase58()],
          id: 1,
        }),
      })

      if (!response.ok) {
        console.error('Photon query error:', response.status)
        return []
      }

      const data = await response.json()
      return data.result?.value || []
    } catch (error) {
      console.error('Failed to fetch credentials:', error)
      return []
    }
  }
}

// Singleton instance
export const photonService = new PhotonService()
