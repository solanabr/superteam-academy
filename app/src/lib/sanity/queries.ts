export const COURSES_QUERY = `*[_type == "course" && published == true] | order(_createdAt desc) {
  _id,
  title,
  "slug": slug.current,
  description,
  longDescription,
  thumbnail,
  difficulty,
  track->{name, "slug": slug.current, icon, color},
  instructor->{name, avatar, bio},
  "totalLessons": count(modules[]->lessons[]),
  totalXP,
  prerequisites,
  tags
}`;

export const COURSE_BY_SLUG_QUERY = `*[_type == "course" && slug.current == $slug][0] {
  _id,
  title,
  "slug": slug.current,
  description,
  longDescription,
  thumbnail,
  difficulty,
  track->{name, "slug": slug.current, icon, color},
  instructor->{name, avatar, bio, twitter, github},
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
      xpReward,
      order,
      content,
      challenge
    }
  },
  totalXP,
  prerequisites,
  tags
}`;

export const TRACKS_QUERY = `*[_type == "track"] | order(name asc) {
  _id,
  name,
  "slug": slug.current,
  description,
  icon,
  color
}`;

export const INSTRUCTORS_QUERY = `*[_type == "instructor"] {
  _id,
  name,
  avatar,
  bio,
  twitter,
  github
}`;
