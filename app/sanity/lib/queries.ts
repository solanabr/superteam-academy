import { defineQuery } from "next-sanity";

// ============================================
// Course Queries (GROQ)
// ============================================

/**
 * All courses with dereferenced instructor, modules, and lessons.
 * Returns data shaped to match the Course TypeScript type.
 */
export const COURSES_QUERY = defineQuery(`
  *[_type == "course"] | order(_createdAt desc) {
    "id": id.current,
    "slug": slug.current,
    title,
    description,
    shortDescription,
    difficulty,
    track,
    duration,
    lessonCount,
    xpReward,
    tags,
    outcomes,
    prerequisites,
    instructor->{
      name,
      "avatar": avatar,
      title,
      bio
    },
    "modules": modules[]->{
      "id": id.current,
      title,
      description,
      "lessons": lessons[]->{
        "id": id.current,
        title,
        "type": type,
        duration,
        xp,
        content,
        language,
        initialCode,
        solutionCode,
        testCases,
        hints,
        quiz {
          isRequired,
          timerSeconds,
          xpReward,
          questions[] {
            question,
            options,
            correctOptionIndex,
            explanation
          }
        }
      }
    }
  }
`);

/**
 * Single course by slug with full nested data.
 */
export const COURSE_BY_SLUG_QUERY = defineQuery(`
  *[_type == "course" && slug.current == $slug][0] {
    "id": id.current,
    "slug": slug.current,
    title,
    description,
    shortDescription,
    difficulty,
    track,
    duration,
    lessonCount,
    xpReward,
    tags,
    outcomes,
    prerequisites,
    instructor->{
      name,
      "avatar": avatar,
      title,
      bio
    },
    "modules": modules[]->{
      "id": id.current,
      title,
      description,
      "lessons": lessons[]->{
        "id": id.current,
        title,
        "type": type,
        duration,
        xp,
        content,
        language,
        initialCode,
        solutionCode,
        testCases,
        hints,
        quiz {
          isRequired,
          timerSeconds,
          xpReward,
          questions[] {
            question,
            options,
            correctOptionIndex,
            explanation
          }
        }
      }
    }
  }
`);

/**
 * Single lesson by ID.
 */
export const LESSON_BY_ID_QUERY = defineQuery(`
  *[_type == "lesson" && id.current == $id][0] {
    "id": id.current,
    title,
    "type": type,
    duration,
    xp,
    content,
    language,
    initialCode,
    solutionCode,
    testCases,
    hints,
    quiz {
      isRequired,
      timerSeconds,
      xpReward,
      questions[] {
        question,
        options,
        correctOptionIndex,
        explanation
      }
    }
  }
`);
