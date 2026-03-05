import { createClient } from '@sanity/client'
import { createImageUrlBuilder, type SanityImageSource } from '@sanity/image-url'

export const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
})

const builder = createImageUrlBuilder(sanityClient)

export function urlFor(source: SanityImageSource) {
  return builder.image(source)
}

export async function getCourses() {
  const query = `*[_type == "course"] | order(order) {
    _id,
    title,
    slug,
    description,
    "lessonCount": count(lessons[]),
    totalXp,
    level,
    "imageUrl": image.asset->url,
    creator
  }`
  return sanityClient.fetch(query)
}

export async function getCourse(slug: string) {
  const query = `*[_type == "course" && slug.current == $slug][0] {
    _id,
    title,
    slug,
    description,
    "lessons": lessons[]->{
      _id,
      title,
      order,
      xpReward,
      type,
      starterCode,
      testCases
    },
    totalXp,
    level,
    "imageUrl": image.asset->url,
    creator
  }`
  return sanityClient.fetch(query, { slug })
}

export async function getLesson(courseSlug: string, lessonId: string) {
  const course = await getCourse(courseSlug)
  if (!course) return null
  return course.lessons?.find((l: { _id: string }) => l._id === lessonId) || null
}

export async function getLessonsByCourse(courseSlug: string) {
  const course = await getCourse(courseSlug)
  return course?.lessons || []
}
