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
  track,
  onchainStatus,
  arweaveTxId,
  coursePda,
  createSignature,
  lastSyncError
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

// ── Academy User queries ────────────────────────────────────────────

export const userFields = /* groq */ `
  _id,
  _type,
  _createdAt,
  _updatedAt,
  authId,
  name,
  email,
  walletAddress,
  image,
  role,
  xpBalance,
  enrolledCourses,
  completedCourses,
  lastActiveAt
`;

export const userByAuthIdQuery = /* groq */ `
  *[_type == "academyUser" && authId == $authId][0] {
    ${userFields}
  }
`;

export const userByEmailQuery = /* groq */ `
  *[_type == "academyUser" && email == $email][0] {
    ${userFields}
  }
`;

export const userByWalletQuery = /* groq */ `
  *[_type == "academyUser" && walletAddress == $walletAddress][0] {
    ${userFields}
  }
`;

export const allUsersQuery = /* groq */ `
  *[_type == "academyUser"] | order(_createdAt desc) {
    ${userFields}
  }
`;

export const adminUsersQuery = /* groq */ `
  *[_type == "academyUser" && role in ["admin", "superadmin"]] | order(_createdAt desc) {
    ${userFields}
  }
`;

export const userCountQuery = /* groq */ `
  count(*[_type == "academyUser"])
`;

export const userStatsQuery = /* groq */ `
  {
    "totalUsers": count(*[_type == "academyUser"]),
    "activeUsers": count(*[_type == "academyUser" && lastActiveAt > $since]),
    "adminCount": count(*[_type == "academyUser" && role in ["admin", "superadmin"]]),
    "totalEnrollments": count(*[_type == "academyUser" && count(enrolledCourses) > 0])
  }
`;
