import { sha256 } from '@noble/hashes/sha256'

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- IDL normalization requires dynamic JSON traversal
type AnyRecord = Record<string, any>

function discriminator(namespace: string, name: string): number[] {
  const preimage = new TextEncoder().encode(`${namespace}:${name}`)
  return Array.from(sha256(preimage).slice(0, 8))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- recursive JSON tree walk
function normalizeTypeNode(value: any): any {
  if (value === 'publicKey') {
    return 'pubkey'
  }

  if (Array.isArray(value)) {
    return value.map(normalizeTypeNode)
  }

  if (value && typeof value === 'object') {
    const out: AnyRecord = {}
    for (const [key, raw] of Object.entries(value)) {
      if (key === 'defined' && typeof raw === 'string') {
        out[key] = { name: raw }
        continue
      }
      out[key] = normalizeTypeNode(raw)
    }
    return out
  }

  return value
}

function normalizeInstructionAccount(item: AnyRecord): AnyRecord {
  if (Array.isArray(item.accounts)) {
    return {
      name: item.name,
      accounts: item.accounts.map(normalizeInstructionAccount),
    }
  }

  const normalized: AnyRecord = {
    name: item.name,
    writable: item.writable ?? item.isMut ?? false,
    signer: item.signer ?? item.isSigner ?? false,
    optional: item.optional ?? false,
  }

  if (item.docs !== undefined) normalized.docs = item.docs
  if (item.address !== undefined) normalized.address = item.address
  if (item.pda !== undefined) normalized.pda = normalizeTypeNode(item.pda)
  if (item.relations !== undefined) normalized.relations = item.relations

  return normalized
}

/**
 * Normalize legacy Anchor IDLs (0.29-style) so they can be loaded by modern Anchor JS (0.30+).
 */
export function normalizeAnchorIdl(idl: AnyRecord): AnyRecord {
  const base = normalizeTypeNode(idl) as AnyRecord
  const rawAccounts = Array.isArray(base.accounts) ? base.accounts : []
  const rawEvents = Array.isArray(base.events) ? base.events : []
  const rawTypes = Array.isArray(base.types) ? base.types : []
  const hasLegacyAccounts = rawAccounts.some((acc) => acc && typeof acc === 'object' && 'type' in acc)
  const hasLegacyEvents = rawEvents.some((event) => event && typeof event === 'object' && 'fields' in event)

  const accountTypeDefs = hasLegacyAccounts
    ? rawAccounts.map((acc) => ({
        name: acc.name,
        docs: acc.docs,
        type: acc.type,
      }))
    : []
  const eventTypeDefs = hasLegacyEvents
    ? rawEvents.map((event) => ({
        name: event.name,
        type: {
          kind: 'struct',
          fields: (event.fields || []).map((field: AnyRecord) => ({
            ...field,
            type: normalizeTypeNode(field.type),
          })),
        },
      }))
    : []

  const typesByName = new Map<string, AnyRecord>()
  for (const t of [...rawTypes, ...accountTypeDefs, ...eventTypeDefs]) {
    if (t?.name && !typesByName.has(t.name)) {
      typesByName.set(t.name, t)
    }
  }

  const normalizedInstructions = (base.instructions || []).map((ix: AnyRecord) => ({
    ...ix,
    accounts: (ix.accounts || []).map(normalizeInstructionAccount),
    args: (ix.args || []).map((arg: AnyRecord) => ({
      ...arg,
      type: normalizeTypeNode(arg.type),
    })),
    discriminator: ix.discriminator || discriminator('global', ix.name),
  }))

  const normalizedAccounts = rawAccounts.map((acc: AnyRecord) => ({
    name: acc.name,
    discriminator: acc.discriminator || discriminator('account', acc.name),
  }))

  const normalizedEvents = Array.isArray(base.events)
    ? base.events.map((event: AnyRecord) => ({
        name: event.name,
        discriminator: event.discriminator || discriminator('event', event.name),
      }))
    : base.events

  return {
    ...base,
    metadata: {
      ...(base.metadata || {}),
      name: base.metadata?.name || base.name || 'onchain_academy',
      version: base.metadata?.version || base.version || '0.1.0',
      spec: base.metadata?.spec || '0.1.0',
    },
    instructions: normalizedInstructions,
    accounts: normalizedAccounts,
    types: Array.from(typesByName.values()),
    events: normalizedEvents,
  }
}
