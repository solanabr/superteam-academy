import { groq } from "next-sanity";

// All published courses for catalog
export const allCoursesQuery = groq`
  *[_type == "course" && published == true] | order(order asc) {
    _id,
    title,
    "slug": slug.current,
    description,
    track,
    difficulty,
    estimatedHours,
    xpReward,
    image,
    "lessonCount": count(modules[]->lessons[]),
    "instructor": instructor->{name, avatar, twitter},
    learningOutcomes,
    "prerequisites": prerequisites[]->{_id, title, "slug": slug.current},
  }
`;

// Single course with full module/lesson structure
export const courseBySlugQuery = groq`
  *[_type == "course" && slug.current == $slug][0] {
    _id,
    title,
    "slug": slug.current,
    description,
    longDescription,
    track,
    difficulty,
    estimatedHours,
    xpReward,
    image,
    learningOutcomes,
    "instructor": instructor->{name, bio, avatar, twitter, github},
    "prerequisites": prerequisites[]->{_id, title, "slug": slug.current, difficulty},
    "modules": modules[]->{
      _id,
      title,
      description,
      order,
      "lessons": lessons[]->{
        _id,
        title,
        "slug": slug.current,
        type,
        xpReward,
        estimatedMinutes,
        order,
      }
    } | order(order asc)
  }
`;

// Single lesson with full content
export const lessonBySlugQuery = groq`
  *[_type == "lesson" && slug.current == $lessonSlug][0] {
    _id,
    title,
    "slug": slug.current,
    type,
    content,
    markdownContent,
    challenge,
    xpReward,
    estimatedMinutes,
    order,
  }
`;
