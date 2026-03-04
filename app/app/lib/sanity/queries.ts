import { groq } from "next-sanity";

export const allCoursesQuery = groq`
  *[_type == "course"] {
    _id,
    "slug": slug.current,
    title,
    description,
    shortDescription,
    "thumbnail": thumbnail.asset->url,
    tags,
    difficulty,
    topic,
    duration,
    totalXP,
    enrollmentCount,
    track -> {
      title,
      description,
      color,
      icon
    },
    milestones[]-> {
      _id,
      title,
      description,
      xpReward,
      lessons[]-> {
        _id,
        title,
        type,
        duration,
        videoUrl,
        content,
        challenge {
          instructions,
          initialCode,
          solution
        }
      }
    },
    author -> {
      name,
      "avatar": avatar.asset->url,
      title
    },
    createdAt
  }
`;

export const courseBySlugQuery = groq`
  *[_type == "course" && slug.current == $slug][0] {
    _id,
    "slug": slug.current,
    title,
    description,
    shortDescription,
    "thumbnail": thumbnail.asset->url,
    tags,
    difficulty,
    topic,
    duration,
    totalXP,
    enrollmentCount,
    track -> {
      title,
      description,
      color,
      icon
    },
    milestones[]-> {
      _id,
      title,
      description,
      xpReward,
      lessons[]-> {
        _id,
        title,
        type,
        duration,
        videoUrl,
        content,
        challenge {
          instructions,
          initialCode,
          solution
        }
      }
    },
    author -> {
      name,
      "avatar": avatar.asset->url,
      title
    },
    createdAt
  }
`;
