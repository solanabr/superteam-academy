import { groq } from 'next-sanity';

/** Fetch all courses with their track reference expanded. */
export const allCoursesQuery = groq`
  *[_type == "course"] | order(title.en asc) {
    _id,
    courseId,
    title,
    description,
    thumbnail,
    difficulty,
    xpPerLesson,
    lessonCount,
    skills,
    prerequisites,
    track->{
      _id,
      trackId,
      name,
      icon,
      color
    }
  }
`;

/** Fetch a single course by courseId with full module/lesson tree. */
export const courseByIdQuery = groq`
  *[_type == "course" && courseId == $courseId][0] {
    _id,
    courseId,
    title,
    description,
    thumbnail,
    difficulty,
    xpPerLesson,
    lessonCount,
    skills,
    prerequisites,
    credentialImage,
    track->{
      _id,
      trackId,
      name,
      icon,
      color
    },
    modules[]->{
      _id,
      title,
      description,
      order,
      lessons[]->{
        _id,
        title,
        lessonIndex,
        xpReward,
        hasCodeEditor,
        isChallenge,
        language
      }
    } | order(order asc)
  }
`;

/** Fetch all courses belonging to a specific track. */
export const coursesByTrackQuery = groq`
  *[_type == "course" && track->trackId == $trackId] | order(title.en asc) {
    _id,
    courseId,
    title,
    description,
    thumbnail,
    difficulty,
    xpPerLesson,
    lessonCount,
    skills,
    track->{
      _id,
      trackId,
      name,
      icon,
      color
    }
  }
`;

/** Fetch all tracks. */
export const allTracksQuery = groq`
  *[_type == "track"] | order(name asc) {
    _id,
    trackId,
    name,
    description,
    icon,
    color
  }
`;

/**
 * Fetch a single lesson by courseId and lessonIndex.
 * Joins through course -> modules -> lessons to find the right one.
 * Excludes the solution field for security.
 */
export const lessonByCourseAndIndexQuery = groq`
  *[_type == "lesson" && lessonIndex == $lessonIndex
    && _id in *[_type == "module"
      && _id in *[_type == "course" && courseId == $courseId].modules[]._ref
    ].lessons[]._ref
  ][0] {
    _id,
    title,
    lessonIndex,
    content,
    xpReward,
    hasCodeEditor,
    starterCode,
    language,
    isChallenge,
    testCases[] {
      description,
      input,
      expectedOutput,
      points,
      hidden
    }
  }
`;

/** Fetch all achievements. */
export const allAchievementsQuery = groq`
  *[_type == "achievement"] | order(category asc, name.en asc) {
    _id,
    achievementId,
    name,
    description,
    icon,
    category,
    xpReward,
    condition
  }
`;

/** Fetch the daily challenge for a specific date (YYYY-MM-DD). */
export const dailyChallengeByDateQuery = groq`
  *[_type == "dailyChallenge" && date == $date][0] {
    _id,
    date,
    title,
    description,
    difficulty,
    xpReward,
    starterCode,
    language,
    testCases[] {
      description,
      input,
      expectedOutput,
      points,
      hidden
    }
  }
`;

/** Fetch featured courses (limit 4, ordered by creation date). */
export const featuredCoursesQuery = groq`
  *[_type == "course"] | order(_createdAt desc) [0...4] {
    _id,
    courseId,
    title,
    description,
    thumbnail,
    difficulty,
    xpPerLesson,
    lessonCount,
    skills,
    track->{
      _id,
      trackId,
      name,
      icon,
      color
    }
  }
`;
