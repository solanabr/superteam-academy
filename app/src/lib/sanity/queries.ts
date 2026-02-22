// Shared on-chain fields projection
const COURSE_ONCHAIN_FIELDS = `
  "courseId": courseId.current,
  xpPerLesson,
  lessonCount,
  trackId,
  trackLevel,
  creator,
  creatorRewardXp,
  minCompletionsForReward,
  prerequisiteCourseId
`;

export const COURSES_QUERY = `*[_type == "course" && published == true] | order(_createdAt desc) {
  _id,
  title,
  "slug": courseId.current,
  description,
  longDescription,
  "thumbnailUrl": thumbnail.asset->url,
  "thumbnailHotspot": thumbnail.hotspot,
  difficulty,
  track->{name, "slug": slug.current, icon, color, trackId, collectionAddress},
  instructor->{name, avatar, bio},
  "totalLessons": count(modules[]->lessons[]),
  "totalDuration": math::sum(modules[]->lessons[]->duration),
  tags,
  ${COURSE_ONCHAIN_FIELDS}
}`;

export const COURSE_BY_SLUG_QUERY = `*[_type == "course" && courseId.current == $slug][0] {
  _id,
  title,
  "slug": courseId.current,
  description,
  longDescription,
  "thumbnailUrl": thumbnail.asset->url,
  "thumbnailHotspot": thumbnail.hotspot,
  difficulty,
  track->{name, "slug": slug.current, icon, color, trackId, collectionAddress},
  instructor->{name, avatar, bio, twitter, github},
  "totalLessons": count(modules[]->lessons[]),
  "totalDuration": math::sum(modules[]->lessons[]->duration),
  modules[]->{
    _id,
    title,
    description,
    order,
    lessons[]->{
      _id,
      title,
      "slug": slug.current,
      type,
      duration,
      order,
      videoUrl,
      markdownContent,
      content,
      challenge
    }
  },
  "prerequisite": *[_type == "course" && courseId.current == ^.prerequisiteCourseId][0]{"id": courseId.current, title},
  tags,
  ${COURSE_ONCHAIN_FIELDS}
}`;

export const COURSE_BY_COURSE_ID_QUERY = `*[_type == "course" && courseId.current == $courseId][0] {
  _id,
  title,
  "slug": courseId.current,
  description,
  "thumbnailUrl": thumbnail.asset->url,
  "thumbnailHotspot": thumbnail.hotspot,
  difficulty,
  track->{name, "slug": slug.current, icon, color, trackId},
  "totalLessons": count(modules[]->lessons[]),
  "totalDuration": math::sum(modules[]->lessons[]->duration),
  ${COURSE_ONCHAIN_FIELDS}
}`;

export const COURSES_BY_IDS_QUERY = `*[_type == "course" && published == true && courseId.current in $courseIds] | order(_createdAt desc) {
  _id,
  title,
  "slug": courseId.current,
  description,
  longDescription,
  "thumbnailUrl": thumbnail.asset->url,
  "thumbnailHotspot": thumbnail.hotspot,
  difficulty,
  track->{name, "slug": slug.current, icon, color, trackId, collectionAddress},
  instructor->{name, avatar, bio},
  "totalLessons": count(modules[]->lessons[]),
  "totalDuration": math::sum(modules[]->lessons[]->duration),
  tags,
  ${COURSE_ONCHAIN_FIELDS}
}`;

// Fetches only the fields needed to compute skill scores from course tags.
export const COURSE_TAGS_QUERY = `*[_type == "course" && courseId.current in $courseIds] {
  "courseId": courseId.current,
  tags,
  xpPerLesson,
  lessonCount
}`;

export const TRACKS_QUERY = `*[_type == "track"] | order(name asc) {
  _id,
  name,
  "slug": slug.current,
  description,
  icon,
  color,
  trackId,
  collectionAddress
}`;

export const INSTRUCTORS_QUERY = `*[_type == "instructor"] {
  _id,
  name,
  avatar,
  bio,
  twitter,
  github
}`;
