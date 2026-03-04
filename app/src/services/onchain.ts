import { Connection, PublicKey } from "@solana/web3.js"
import { db } from "@/drizzle/db"
import { UserTable } from "@/drizzle/schema"
import { and, inArray, isNotNull } from "drizzle-orm"
import {
  deriveToken2022Ata,
  getConfigPda,
  getCoursePda,
  getEnrollmentPda,
  getMplCoreProgramId,
  getProgramId,
} from "@/lib/onchain/shared"

export const ONCHAIN_PROGRAM_ID = getProgramId()
export const MPL_CORE_PROGRAM_ID = getMplCoreProgramId()

function getLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100))
}

function rpcEndpoint() {
  return process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? "https://api.devnet.solana.com"
}

function heliusEndpoint() {
  return process.env.NEXT_PUBLIC_HELIUS_RPC_URL ?? process.env.HELIUS_RPC_URL ?? ""
}

export function getConnection() {
  return new Connection(rpcEndpoint(), "confirmed")
}

export { getConfigPda, getCoursePda, getEnrollmentPda, deriveToken2022Ata }

export async function readXpBalanceFromChain(params: {
  walletAddress: string
  xpMintAddress: string
}) {
  const connection = getConnection()
  const owner = new PublicKey(params.walletAddress)
  const mint = new PublicKey(params.xpMintAddress)
  const ata = deriveToken2022Ata(mint, owner)

  const info = await connection.getTokenAccountBalance(ata).catch(() => null)
  return Math.round(info?.value?.uiAmount ?? Number(info?.value?.amount ?? 0))
}

export type OnchainCredential = {
  id: string
  name: string
  uri: string | null
  collection: string | null
  attributes: Record<string, string | number>
  explorerUrl: string
}

export async function getCredentialsByOwner(walletAddress: string): Promise<OnchainCredential[]> {
  const helius = heliusEndpoint()
  if (!helius) return []

  const response = await fetch(helius, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "credentials",
      method: "getAssetsByOwner",
      params: { ownerAddress: walletAddress, page: 1, limit: 100 },
    }),
    cache: "no-store",
  }).catch(() => null)

  if (!response?.ok) return []
  const json = await response.json().catch(() => null)
  const items = (json?.result?.items ?? []) as Array<Record<string, unknown>>

  return items
    .map((item) => {
      const id = String(item.id ?? "")
      const content = (item.content ?? {}) as Record<string, unknown>
      const metadata = (content.metadata ?? {}) as Record<string, unknown>
      const attrs = (metadata.attributes ?? []) as Array<Record<string, unknown>>
      const grouping = (item.grouping ?? []) as Array<Record<string, unknown>>
      const collection = grouping.find((g) => g.group_key === "collection")
      const attributes = Object.fromEntries(
        attrs
          .map((a) => [String(a.trait_type ?? ""), a.value as string | number] as const)
          .filter(([k]) => k.length > 0)
      )

      return {
        id,
        name: String(metadata.name ?? "Credential"),
        uri: typeof metadata.uri === "string" ? metadata.uri : null,
        collection: collection ? String(collection.group_value ?? "") : null,
        attributes,
        explorerUrl: `https://explorer.solana.com/address/${id}?cluster=devnet`,
      } satisfies OnchainCredential
    })
    .filter((c) => c.id.length > 0)
}

export type OnchainLeaderboardEntry = {
  walletAddress: string
  xp: number
  level: number
  name: string | null
  username: string | null
  image: string | null
  streak: number
  rank: number
}

export async function getOnchainLeaderboard(params: {
  xpMintAddress: string
  limit?: number
}): Promise<OnchainLeaderboardEntry[]> {
  const connection = getConnection()
  const mint = new PublicKey(params.xpMintAddress)
  const largest = await connection.getTokenLargestAccounts(mint).catch(() => null)
  if (!largest) return []

  const accounts = largest.value.slice(0, params.limit ?? 20)
  const owners = await Promise.all(
    accounts.map(async (entry) => {
      const parsed = await connection.getParsedAccountInfo(entry.address).catch(() => null)
      const data = (parsed?.value?.data ?? null) as
        | { parsed?: { info?: { owner?: string } } }
        | null
      return {
        tokenAccount: entry.address.toBase58(),
        owner: data?.parsed?.info?.owner ?? null,
        amount: Math.round(entry.uiAmount ?? Number(entry.amount)),
      }
    })
  )

  const ownerAddresses = owners.map((o) => o.owner).filter((o): o is string => Boolean(o))
  const knownUsers = ownerAddresses.length
    ? await db.query.UserTable.findMany({
        where: and(
          isNotNull(UserTable.walletAddress),
          inArray(UserTable.walletAddress, ownerAddresses)
        ),
        columns: {
          walletAddress: true,
          name: true,
          username: true,
          image: true,
          streak: true,
        },
      })
    : []

  const byWallet = new Map(
    knownUsers.map((u) => [u.walletAddress!.trim().toLowerCase(), u])
  )
  return owners
    .filter((o) => o.owner && o.amount > 0)
    .map((o, idx) => {
      const profile = byWallet.get(o.owner!.trim().toLowerCase())
      return {
        walletAddress: o.owner!,
        xp: o.amount,
        level: getLevel(o.amount),
        name: profile?.name ?? null,
        username: profile?.username ?? null,
        image: profile?.image ?? null,
        streak: profile?.streak ?? 0,
        rank: idx + 1,
      }
    })
}
