import { getPayloadClient } from '@/libs/payload'
import { Module } from '@/payload-types'

export async function getModulesByCourse(courseId: string) {
  const payload = await getPayloadClient()
  return payload.find({
    collection: 'modules',
    where: { course: { equals: courseId } },
    sort: 'sortOrder',
    limit: 100,
  })
}

export async function getModuleById(id: string) {
  const payload = await getPayloadClient()
  return payload.findByID({ collection: 'modules', id })
}

export async function createModule(data: Module) {
  const payload = await getPayloadClient()
  return payload.create({
    collection: 'modules',
    data,
    draft: false,
  })
}

export async function updateModule(id: string, data: Record<string, unknown>) {
  const payload = await getPayloadClient()
  return payload.update({ collection: 'modules', id, data })
}
