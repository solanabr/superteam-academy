import { getPayloadClient } from '@/libs/payload'
import { User } from '@/payload-types'

export async function getUserByWallet(walletAddress: string) {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'users',
    where: { walletAddress: { equals: walletAddress } },
    limit: 1,
  })
  return docs[0] ?? null
}

export async function getUserByEmail(email: string) {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'users',
    where: { email: { equals: email } },
    limit: 1,
  })
  return docs[0] ?? null
}

export async function getUserById(id: string) {
  const payload = await getPayloadClient()
  return payload.findByID({ collection: 'users', id })
}

export async function createUser(data: User) {
  const payload = await getPayloadClient()
  return payload.create({
    collection: 'users',
    data,
    draft: false,
  })
}

export async function updateUser(id: string, data: Record<string, unknown>) {
  const payload = await getPayloadClient()
  return payload.update({ collection: 'users', id, data })
}
