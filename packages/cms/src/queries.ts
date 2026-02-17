/** Reusable GROQ queries for the academy CMS */

export const courseFields = /* groq */ `
  _id,
  _type,
  _createdAt,
  _updatedAt,
  title,
  slug,
  description,
  level,
  duration,
  image,
  published,
  xpReward,
  track
`;

export const moduleFields = /* groq */ `
  _id,
  _type,
  title,
  slug,
  description,
  order,
  "lessonCount": count(lessons)
`;

export const lessonFields = /* groq */ `
  _id,
  _type,
  title,
  slug,
  content,
  order,
  xpReward,
  duration
`;

export const allCoursesQuery = /* groq */ `
  *[_type == "course" && published == true] | order(_createdAt desc) {
    ${courseFields}
  }
`;

export const courseBySlugQuery = /* groq */ `
  *[_type == "course" && slug.current == $slug][0] {
    ${courseFields},
    "modules": *[_type == "module" && references(^._id)] | order(order asc) {
      ${moduleFields},
      "lessons": *[_type == "lesson" && references(^._id)] | order(order asc) {
        ${lessonFields}
      }
    }
  }
`;

export const coursesByTrackQuery = /* groq */ `
  *[_type == "course" && published == true && track == $track] | order(_createdAt desc) {
    ${courseFields}
  }
`;

export const lessonBySlugQuery = /* groq */ `
  *[_type == "lesson" && slug.current == $slug][0] {
    ${lessonFields},
    "module": *[_type == "module" && references(^._id)][0] {
      ${moduleFields},
      "course": *[_type == "course" && references(^._id)][0] {
        ${courseFields}
      }
    }
  }
`;

export const allTracksQuery = /* groq */ `
  *[_type == "track"] | order(title asc) {
    _id,
    title,
    slug,
    description,
    image,
    "courseCount": count(*[_type == "course" && track == ^.slug.current && published == true])
  }
`;

export const authorBySlugQuery = /* groq */ `
  *[_type == "author" && slug.current == $slug][0] {
    _id,
    name,
    slug,
    image,
    bio,
    walletAddress,
    "courses": *[_type == "course" && author._ref == ^._id && published == true] {
      ${courseFields}
    }
  }
`;
