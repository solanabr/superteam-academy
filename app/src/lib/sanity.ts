import { createClient } from "@sanity/client"
import imageUrlBuilder from "@sanity/image-url"

export const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "replace-with-your-project-id",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: "2024-01-01",
  useCdn: process.env.NODE_ENV === "production",
  token: process.env.SANITY_API_TOKEN,
})

const builder = imageUrlBuilder(sanityClient)

export function urlFor(source: any) {
  return builder.image(source)
}

// Type helpers
export type SanityImage = {
  _type: "image"
  asset: {
    _ref: string
    _type: "reference"
  }
}

// GROQ query helpers
export const courseQuery = `*[_type == "course" && slug.current == $slug][0] {
  _id,
  title,
  slug,
  description,
  difficulty,
  track,
  durationHours,
  xpReward,
  thumbnail,
  instructorName,
  "modules": modules[]-> {
    _id,
    title,
    order,
    "lessons": lessons[]-> {
      _id,
      title,
      type,
      order,
      content,
      xpReward,
      hints,
      starterCode,
      solution,
    }
  }
}`

export const allCoursesQuery = `*[_type == "course"] {
  _id,
  title,
  "slug": slug.current,
  description,
  difficulty,
  track,
  durationHours,
  xpReward,
  thumbnail,
  instructorName,
} | order(title asc)`
