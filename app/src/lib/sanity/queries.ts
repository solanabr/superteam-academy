import { groq } from 'next-sanity';

// GROQ queries for fetching content from Sanity

// Get all courses with basic info for catalog
export const coursesQuery = groq`
  *[_type == "course"] | order(featured desc, order asc) {
    _id,
    slug,
    title,
    description,
    level,
    duration,
    lessonsCount,
    studentsCount,
    rating,
    xpReward,
    tags,
    image,
    instructor,
    featured,
    "lessons": lessons[]->{ _id, slug, title }
  }
`;

// Get single course with full details
export const courseBySlugQuery = groq`
  *[_type == "course" && slug.current == $slug][0] {
    _id,
    slug,
    title,
    description,
    level,
    duration,
    lessonsCount,
    studentsCount,
    rating,
    xpReward,
    tags,
    image,
    instructor,
    featured,
    overview,
    prerequisites,
    whatYouWillLearn,
    "lessons": lessons[]-> {
      _id,
      slug,
      title,
      description,
      xpReward,
      duration,
      order
    }
  }
`;

// Get single lesson with full content
export const lessonByIdQuery = groq`
  *[_type == "lesson" && _id == $lessonId][0] {
    _id,
    slug,
    title,
    description,
    content,
    codeTemplate,
    solution,
    testCases,
    xpReward,
    duration,
    hints,
    "course": *[_type == "course" && references(^._id)][0] {
      _id,
      slug,
      title,
      "lessons": lessons[]-> { _id, slug, title, order }
    }
  }
`;

// Get leaderboard data (mock - would connect to on-chain data)
export const leaderboardQuery = groq`
  *[_type == "student"] | order(xp desc) [0...50] {
    _id,
    walletAddress,
    displayName,
    avatar,
    xp,
    level,
    streak,
    coursesCompleted,
    rank
  }
`;

// Get tracks (learning paths)
export const tracksQuery = groq`
  *[_type == "track"] | order(order asc) {
    _id,
    slug,
    title,
    description,
    icon,
    color,
    "courses": courses[]-> { _id, slug, title, level }
  }
`;
