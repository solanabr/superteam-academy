import { createClient } from "@sanity/client";
import dotenv from "dotenv";

dotenv.config();

export const sanityClient = createClient({
    projectId: process.env.SANITY_PROJECT_ID || "",
    dataset: process.env.SANITY_DATASET || "production",
    apiVersion: "2024-03-01",
    useCdn: false,
    token: process.env.SANITY_API_TOKEN || "",
});

/**
 * GROQ query that fetches a complete course with all references expanded:
 * milestones → lessons, quizzes, code challenges, author.
 */
export const FULL_COURSE_QUERY = `
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
    status,
    totalXP,
    duration,
    milestones[]-> {
      _id,
      title,
      description,
      order,
      xpReward,
      lessons[]-> {
        _id,
        title,
        type,
        order,
        duration,
        url,
        content
      },
      tests[]-> {
        _id,
        _type,
        title,
        passThreshold,
        points,
        // Quiz fields
        questions[] {
          _key,
          question,
          explanation,
          options[] {
            label,
            isCorrect
          }
        },
        // Code challenge fields
        prompt,
        "starterCode": starterCode.code,
        language,
        testCases[] {
          input,
          expectedOutput,
          description
        }
      }
    },
    author-> {
      name,
      "avatar": avatar.asset->url,
      title
    }
  }
`;

/**
 * Fetch a single course by Sanity _id (for individual sync).
 */
export const SINGLE_COURSE_QUERY = `
  *[_type == "course" && _id == $id][0] {
    _id,
    "slug": slug.current,
    title,
    description,
    shortDescription,
    "thumbnail": thumbnail.asset->url,
    tags,
    difficulty,
    topic,
    status,
    totalXP,
    duration,
    milestones[]-> {
      _id,
      title,
      description,
      order,
      xpReward,
      lessons[]-> {
        _id,
        title,
        type,
        order,
        duration,
        url,
        content
      },
      tests[]-> {
        _id,
        _type,
        title,
        passThreshold,
        points,
        questions[] {
          _key,
          question,
          explanation,
          options[] {
            label,
            isCorrect
          }
        },
        prompt,
        "starterCode": starterCode.code,
        language,
        testCases[] {
          input,
          expectedOutput,
          description
        }
      }
    },
    author-> {
      name,
      "avatar": avatar.asset->url,
      title
    }
  }
`;

export async function fetchAllCoursesFromSanity() {
    return sanityClient.fetch(FULL_COURSE_QUERY);
}

export async function fetchCourseFromSanity(sanityId: string) {
    return sanityClient.fetch(SINGLE_COURSE_QUERY, { id: sanityId });
}
