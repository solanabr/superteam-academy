import { getPayloadClient } from '@/libs/payload'
import { LessonContent } from '@/payload-types'

export async function getContentByLesson(lessonId: string) {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'lesson-contents',
    where: { lesson: { equals: lessonId } },
    limit: 1,
    depth: 0,
  })
  return docs[0] ?? null
}

export async function createLessonContent(data: LessonContent) {
  const payload = await getPayloadClient()
  return payload.create({
    collection: 'lesson-contents',
    data,
    draft: false,
  })
}

export async function updateLessonContent(
  id: string,
  data: Record<string, unknown>,
) {
  const payload = await getPayloadClient()
  return payload.update({ collection: 'lesson-contents', id, data })
}
