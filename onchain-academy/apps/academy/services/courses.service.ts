import { getPayloadClient } from '@/libs/payload'
import { Course } from '@/payload-types'

export async function getPublishedCourses(limit = 50) {
  const payload = await getPayloadClient()
  return payload.find({
    collection: 'courses',
    where: { status: { equals: 'published' } },
    sort: '-createdAt',
    limit,
  })
}

export async function getCourseBySlug(slug: string) {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'courses',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 1,
  })
  return docs[0] ?? null
}

export async function getCoursesByTopic(topic: string, limit = 20) {
  const payload = await getPayloadClient()
  return payload.find({
    collection: 'courses',
    where: {
      and: [{ status: { equals: 'published' } }, { topic: { equals: topic } }],
    },
    limit,
  })
}

export async function getCourseById(id: string) {
  const payload = await getPayloadClient()
  return payload.findByID({ collection: 'courses', id, depth: 1 })
}

export async function createCourse(data: Course) {
  const payload = await getPayloadClient()
  return payload.create({
    collection: 'courses',
    data,
    draft: false,
  })
}

export async function updateCourse(id: string, data: Record<string, unknown>) {
  const payload = await getPayloadClient()
  return payload.update({ collection: 'courses', id, data })
}
