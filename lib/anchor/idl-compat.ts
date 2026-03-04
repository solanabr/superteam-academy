import { sha256 } from '@noble/hashes/sha256'

type AnyRecord = Record<string, unknown>

function discriminator(namespace: string, name: string): number[] {
  const preimage = new TextEncoder().encode(`${namespace}:${name}`)
  return Array.from(sha256(preimage).slice(0, 8))
}

function normalizeTypeNode(value: unknown): unknown {
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
  const nestedAccounts = item.accounts

  if (Array.isArray(nestedAccounts)) {
    return {
      name: item.name,
      accounts: nestedAccounts.map((account) =>
        normalizeInstructionAccount(account as AnyRecord)
      ),
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
  const hasLegacyAccounts = rawAccounts.some(
    (acc) => acc && typeof acc === 'object' && 'type' in (acc as AnyRecord)
  )
  const hasLegacyEvents = rawEvents.some(
    (event) =>
      event && typeof event === 'object' && 'fields' in (event as AnyRecord)
  )

  const accountTypeDefs = hasLegacyAccounts
    ? rawAccounts.map((acc) => {
        const typedAccount = acc as AnyRecord
        return {
          name: typedAccount.name,
          docs: typedAccount.docs,
          type: typedAccount.type,
        }
      })
    : []
  const eventTypeDefs = hasLegacyEvents
    ? rawEvents.map((event) => {
        const typedEvent = event as AnyRecord
        const fields = Array.isArray(typedEvent.fields)
          ? typedEvent.fields
          : []

        return {
          name: typedEvent.name,
          type: {
            kind: 'struct',
            fields: fields.map((field) => {
              const typedField = field as AnyRecord
              return {
                ...typedField,
                type: normalizeTypeNode(typedField.type),
              }
            }),
          },
        }
      })
    : []

  const typesByName = new Map<string, AnyRecord>()
  for (const t of [...rawTypes, ...accountTypeDefs, ...eventTypeDefs]) {
    const typedType = t as AnyRecord
    const typeName = typedType.name
    if (typeof typeName === 'string' && !typesByName.has(typeName)) {
      typesByName.set(typeName, typedType)
    }
  }

  const instructionNodes = Array.isArray(base.instructions)
    ? base.instructions
    : []
  const normalizedInstructions = instructionNodes.map((ix) => {
    const typedInstruction = ix as AnyRecord
    const accounts = Array.isArray(typedInstruction.accounts)
      ? typedInstruction.accounts
      : []
    const args = Array.isArray(typedInstruction.args) ? typedInstruction.args : []
    const name =
      typeof typedInstruction.name === 'string' ? typedInstruction.name : 'unknown'

    return {
      ...typedInstruction,
      accounts: accounts.map((account) =>
        normalizeInstructionAccount(account as AnyRecord)
      ),
      args: args.map((arg) => {
        const typedArg = arg as AnyRecord
        return {
          ...typedArg,
          type: normalizeTypeNode(typedArg.type),
        }
      }),
      discriminator:
        typedInstruction.discriminator || discriminator('global', name),
    }
  })

  const normalizedAccounts = rawAccounts.map((acc) => {
    const typedAccount = acc as AnyRecord
    const name = typeof typedAccount.name === 'string' ? typedAccount.name : 'unknown'

    return {
      name,
      discriminator:
        typedAccount.discriminator || discriminator('account', name),
    }
  })

  const normalizedEvents = Array.isArray(base.events)
    ? base.events.map((event) => {
        const typedEvent = event as AnyRecord
        const name = typeof typedEvent.name === 'string' ? typedEvent.name : 'unknown'
        return {
          name,
          discriminator: typedEvent.discriminator || discriminator('event', name),
        }
      })
    : base.events

  const metadata =
    base.metadata && typeof base.metadata === 'object'
      ? (base.metadata as AnyRecord)
      : {}
  const idlName = typeof base.name === 'string' ? base.name : 'onchain_academy'
  const idlVersion = typeof base.version === 'string' ? base.version : '0.1.0'
  const metadataName =
    typeof metadata.name === 'string' ? metadata.name : idlName
  const metadataVersion =
    typeof metadata.version === 'string' ? metadata.version : idlVersion
  const metadataSpec =
    typeof metadata.spec === 'string' ? metadata.spec : '0.1.0'

  return {
    ...base,
    metadata: {
      ...metadata,
      name: metadataName,
      version: metadataVersion,
      spec: metadataSpec,
    },
    instructions: normalizedInstructions,
    accounts: normalizedAccounts,
    types: Array.from(typesByName.values()),
    events: normalizedEvents,
  }
}
