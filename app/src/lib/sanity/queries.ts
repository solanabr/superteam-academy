/**
 * GROQ Queries for Sanity CMS
 * These queries fetch content from Sanity with proper projections
 */

// ==================== Course Queries ====================

// Get all published courses for catalog
export const allCoursesQuery = `
  *[_type == "course" && published == true] | order(order asc) {
    _id,
    title,
    "slug": slug.current,
    description,
    thumbnail,
    difficulty,
    duration,
    xpReward,
    "track": track->{ _id, title, "slug": slug.current, color },
    tags,
    featured,
    "lessonsCount": count(modules[].lessons[]),
    "modulesCount": count(modules)
  }
`;

// Get featured courses
export const featuredCoursesQuery = `
  *[_type == "course" && published == true && featured == true] | order(order asc) [0...6] {
    _id,
    title,
    "slug": slug.current,
    description,
    thumbnail,
    difficulty,
    duration,
    xpReward,
    "track": track->{ _id, title, "slug": slug.current, color }
  }
`;

// Get course by slug with full content
export const courseBySlugQuery = `
  *[_type == "course" && slug.current == $slug][0] {
    _id,
    title,
    "slug": slug.current,
    description,
    thumbnail,
    difficulty,
    duration,
    xpReward,
    "track": track->{ _id, title, "slug": slug.current, color, icon },
    "prerequisites": prerequisites[]->{ _id, title, "slug": slug.current },
    learningObjectives,
    tags,
    modules[] {
      _key,
      title,
      description,
      order,
      "lessons": lessons[]->{ 
        _id, 
        title, 
        "slug": slug.current, 
        type, 
        duration, 
        xpReward,
        order
      }
    },
    "instructor": *[_type == "instructor" && references(^._id)][0] {
      name,
      "slug": slug.current,
      avatar,
      title,
      company
    }
  }
`;

// Get courses by track
export const coursesByTrackQuery = `
  *[_type == "course" && published == true && track->slug.current == $trackSlug] | order(order asc) {
    _id,
    title,
    "slug": slug.current,
    description,
    thumbnail,
    difficulty,
    duration,
    xpReward,
    "track": track->{ _id, title, "slug": slug.current, color },
    tags,
    "lessonsCount": count(modules[].lessons[])
  }
`;

// ==================== Lesson Queries ====================

// Get lesson by slug with full content
export const lessonBySlugQuery = `
  *[_type == "lesson" && slug.current == $lessonSlug && course->slug.current == $courseSlug][0] {
    _id,
    title,
    "slug": slug.current,
    type,
    duration,
    xpReward,
    order,
    content,
    hints,
    challenge,
    quiz,
    "course": course->{
      _id,
      title,
      "slug": slug.current,
      modules[] {
        _key,
        title,
        "lessons": lessons[]->{ 
          _id, 
          title, 
          "slug": slug.current, 
          type,
          order 
        }
      }
    },
    module
  }
`;

// Get all lessons for a course
export const courseLessonsQuery = `
  *[_type == "lesson" && course->slug.current == $courseSlug] | order(order asc) {
    _id,
    title,
    "slug": slug.current,
    type,
    duration,
    xpReward,
    order,
    module
  }
`;

// Get adjacent lessons (prev/next)
export const adjacentLessonsQuery = `
  {
    "previous": *[_type == "lesson" && course->slug.current == $courseSlug && order < $currentOrder] | order(order desc) [0] {
      _id,
      title,
      "slug": slug.current
    },
    "next": *[_type == "lesson" && course->slug.current == $courseSlug && order > $currentOrder] | order(order asc) [0] {
      _id,
      title,
      "slug": slug.current
    }
  }
`;

// ==================== Track Queries ====================

// Get all tracks
export const allTracksQuery = `
  *[_type == "track"] | order(order asc) {
    _id,
    title,
    "slug": slug.current,
    description,
    icon,
    color,
    order,
    "coursesCount": count(*[_type == "course" && references(^._id) && published == true])
  }
`;

// Get track by slug with courses
export const trackBySlugQuery = `
  *[_type == "track" && slug.current == $slug][0] {
    _id,
    title,
    "slug": slug.current,
    description,
    icon,
    color,
    "courses": *[_type == "course" && references(^._id) && published == true] | order(order asc) {
      _id,
      title,
      "slug": slug.current,
      description,
      thumbnail,
      difficulty,
      duration,
      xpReward
    }
  }
`;

// ==================== Instructor Queries ====================

// Get instructor by slug
export const instructorBySlugQuery = `
  *[_type == "instructor" && slug.current == $slug][0] {
    _id,
    name,
    "slug": slug.current,
    bio,
    avatar,
    title,
    company,
    socialLinks,
    "courses": *[_type == "course" && references(^._id) && published == true] {
      _id,
      title,
      "slug": slug.current,
      thumbnail,
      difficulty
    }
  }
`;

// ==================== Achievement Queries ====================

// Get all achievements
export const allAchievementsQuery = `
  *[_type == "achievement"] | order(category asc, xpReward desc) {
    _id,
    title,
    "slug": slug.current,
    description,
    icon,
    xpReward,
    rarity,
    category,
    condition
  }
`;

// ==================== Search Query ====================

export const searchQuery = `
  *[
    _type in ["course", "lesson"] && 
    published != false &&
    (
      title match $searchTerm + "*" ||
      description match $searchTerm + "*" ||
      tags[] match $searchTerm + "*"
    )
  ] [0...20] {
    _id,
    _type,
    title,
    "slug": slug.current,
    description,
    _type == "course" => {
      thumbnail,
      difficulty,
      "track": track->{ title, "slug": slug.current }
    },
    _type == "lesson" => {
      type,
      "course": course->{ title, "slug": slug.current }
    }
  }
`;
