import { groq } from "next-sanity";

export const adminAllCoursesQuery = groq`
  *[_type == "course"] | order(_updatedAt desc) {
    _id, title, "slug": slug.current, description, track, difficulty,
    published, _createdAt, _updatedAt, xpReward,
    "lessonCount": count(modules[]->lessons[]),
    "moduleCount": count(modules[])
  }
`;

export const adminCourseDetailQuery = groq`
  *[_type == "course" && _id == $id][0] {
    _id, title, "slug": slug.current, description, longDescription,
    track, difficulty, estimatedHours, xpReward, published,
    learningOutcomes, image,
    "modules": modules[]->{
      _id, title, description, order,
      "lessons": lessons[]->{
        _id, title, "slug": slug.current, type, xpReward,
        estimatedMinutes, order, markdownContent,
        challenge { instructions, starterCode, solution, language }
      }
    } | order(order asc)
  }
`;
