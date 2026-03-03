import imageUrlBuilder from '@sanity/image-url'

type SanityImageSource = Parameters<ReturnType<typeof imageUrlBuilder>['image']>[0]

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-02-13'
const token = process.env.SANITY_API_TOKEN

const imageBuilder = imageUrlBuilder({ projectId: projectId || '', dataset: dataset || '' })

export function isSanityConfigured(): boolean {
  return Boolean(projectId && dataset)
}

export function urlFor(source: SanityImageSource) {
  return imageBuilder.image(source)
}

async function sanityFetch<T>(query: string, params?: Record<string, unknown>): Promise<T> {
  if (!projectId || !dataset) {
    throw new Error('Sanity is not configured')
  }

  // Use server-side API route to avoid CORS issues when called from the browser
  const isClient = typeof window !== 'undefined'

  if (isClient) {
    // Client-side: proxy through our API route
    const response = await fetch('/api/sanity/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, params }),
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new Error(`Sanity request failed: ${response.status} ${response.statusText}`)
    }

    const payload = await response.json()
    if (payload?.error) {
      throw new Error(payload.error.description || payload.error.message || 'Sanity query error')
    }

    return payload.result as T
  } else {
    // Server-side: call Sanity API directly using GET with query params
    const sanityUrl = new URL(
      `https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}`
    )
    sanityUrl.searchParams.set('query', query)
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        sanityUrl.searchParams.set(`$${key}`, JSON.stringify(value ?? null))
      }
    }

    const response = await fetch(sanityUrl.toString(), {
      method: 'GET',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new Error(`Sanity request failed: ${response.status} ${response.statusText}`)
    }

    const payload = await response.json()
    if (payload?.error) {
      throw new Error(payload.error.description || payload.error.message || 'Sanity query error')
    }

    return payload.result as T
  }
}

// Types for queries
export interface SanityCourse {
  _id: string
  title: string
  slug: { current: string }
  description: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  track: string
  duration: number
  xpReward: number
  enrollmentCount?: number
  thumbnail?: SanityImageSource
  instructor?: {
    name: string
    avatar?: SanityImageSource
  }
  tags?: string[]
  modules?: SanityModule[]
  status?: string
}

export interface SanityModule {
  _id: string
  title: string
  description?: string
  order: number
  lessons?: SanityLesson[]
}

export interface SanityLesson {
  _id: string
  title: string
  slug: { current: string }
  description?: string
  contentText?: string
  type: 'content' | 'challenge'
  challenge?: {
    prompt?: string
    starterCode?: string
    testCases?: Array<{ input: string; expectedOutput: string; description?: string }>
    solutionCode?: string
    hints?: string[]
  }
  xpReward?: number
  order: number
}

// Helper functions
export async function getCourses(filters?: {
  difficulty?: string
  track?: string
}): Promise<SanityCourse[]> {
  const query = `*[_type == "course" && (!defined($difficulty) || difficulty == $difficulty) && (!defined($track) || track == $track)] | order(title asc) {
    _id, title, slug, description, difficulty, track, duration, xpReward, thumbnail, instructor, tags, status
  }`

  return sanityFetch<SanityCourse[]>(query, {
    difficulty: filters?.difficulty ?? null,
    track: filters?.track ?? null,
  })
}

export async function getCourse(slug: string): Promise<SanityCourse | null> {
  const query = `*[_type == "course" && slug.current == $slug][0] {
    _id,
    title,
    slug,
    description,
    difficulty,
    track,
    duration,
    xpReward,
    thumbnail,
    instructor,
    tags,
    "modules": modules[]-> {
      _id,
      title,
      description,
      order,
      "lessons": lessons[]-> {
        _id,
        title,
        slug,
        description,
        "contentText": pt::text(content),
        type,
        challenge,
        xpReward,
        order
      } | sort(order asc)
    } | sort(order asc),
    prerequisites,
    status
  }`

  return sanityFetch<SanityCourse | null>(query, { slug })
}

export async function getLesson(courseSlug: string, lessonId: string): Promise<SanityLesson | null> {
  const query = `*[_type == "lesson" && (_id == $lessonId || slug.current == $lessonId)][0] {
    _id,
    title,
    slug,
    description,
    "contentText": pt::text(content),
    type,
    challenge,
    xpReward,
    order
  }`

  return sanityFetch<SanityLesson | null>(query, { lessonId, courseSlug })
}

export async function searchCourses(query: string): Promise<SanityCourse[]> {
  const searchTerm = `${query}*`
  const searchQuery = `*[_type == "course" && (
    title match $search ||
    description match $search ||
    tags[] match $search
  )] | order(title asc) {
    _id, title, slug, description, difficulty, track, duration, xpReward, thumbnail, instructor, tags
  }`

  return sanityFetch<SanityCourse[]>(searchQuery, { search: searchTerm })
}
