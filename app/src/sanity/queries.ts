import { groq } from "next-sanity";

/**
 * GROQ queries for Sanity CMS.
 *
 * All queries resolve locale-aware fields using coalesce(field.{locale}, field.pt)
 * so that Portuguese (PT-BR) is always the fallback.
 */

// ---------------------------------------------------------------------------
// Courses
// ---------------------------------------------------------------------------

export function allCoursesQuery(locale: string) {
  return groq`
    *[_type == "course" && published == true] | order(courseId asc) {
      "id": courseId,
      "slug": slug.current,
      "title": coalesce(title.${locale}, title.pt),
      "description": coalesce(description.${locale}, description.pt),
      "longDescription": coalesce(longDescription.${locale}, longDescription.pt),
      difficulty,
      duration,
      totalDurationMinutes,
      xpTotal,
      "thumbnail": thumbnail.asset->url,
      "instructor": instructor->{
        name,
        "avatar": avatar.asset->url,
        "role": coalesce(role.${locale}, role.pt)
      },
      "instructorSlug": instructor->slug.current,
      track,
      modules[] {
        "id": moduleId,
        "title": coalesce(title.${locale}, title.pt),
        lessons[] {
          "id": lessonId,
          "title": coalesce(title.${locale}, title.pt),
          slug,
          "type": lessonType,
          durationMinutes,
          xpReward,
          "content": coalesce(content.${locale}, content.pt),
          exercise {
            "question": coalesce(question.${locale}, question.pt),
            "options": options[]{
              "value": coalesce(@.${locale}, @.pt)
            }[].value,
            correctIndex
          },
          challenge {
            "prompt": coalesce(prompt.${locale}, prompt.pt),
            starterCode,
            language,
            testCases[] { input, expected }
          }
        }
      }
    }
  `;
}

export function courseBySlugQuery(locale: string) {
  return groq`
    *[_type == "course" && slug.current == $slug && published == true][0] {
      "id": courseId,
      "slug": slug.current,
      "title": coalesce(title.${locale}, title.pt),
      "description": coalesce(description.${locale}, description.pt),
      "longDescription": coalesce(longDescription.${locale}, longDescription.pt),
      difficulty,
      duration,
      totalDurationMinutes,
      xpTotal,
      "thumbnail": thumbnail.asset->url,
      "instructor": instructor->{
        name,
        "avatar": avatar.asset->url,
        "role": coalesce(role.${locale}, role.pt)
      },
      "instructorSlug": instructor->slug.current,
      track,
      modules[] {
        "id": moduleId,
        "title": coalesce(title.${locale}, title.pt),
        lessons[] {
          "id": lessonId,
          "title": coalesce(title.${locale}, title.pt),
          slug,
          "type": lessonType,
          durationMinutes,
          xpReward,
          "content": coalesce(content.${locale}, content.pt),
          exercise {
            "question": coalesce(question.${locale}, question.pt),
            "options": options[]{
              "value": coalesce(@.${locale}, @.pt)
            }[].value,
            correctIndex
          },
          challenge {
            "prompt": coalesce(prompt.${locale}, prompt.pt),
            starterCode,
            language,
            testCases[] { input, expected }
          }
        }
      }
    }
  `;
}

// ---------------------------------------------------------------------------
// Challenges
// ---------------------------------------------------------------------------

export function allChallengesQuery(locale: string) {
  return groq`
    *[_type == "challengeDoc"] | order(challengeId asc) {
      "id": challengeId,
      "slug": slug.current,
      "title": coalesce(title.${locale}, title.pt),
      "description": coalesce(description.${locale}, description.pt),
      "image": image.asset->url,
      track,
      difficulty,
      tags,
      reward,
      status
    }
  `;
}

// ---------------------------------------------------------------------------
// Instructors
// ---------------------------------------------------------------------------

export function allInstructorsQuery(locale: string) {
  return groq`
    *[_type == "instructor"] {
      "slug": slug.current,
      name,
      "role": coalesce(role.${locale}, role.pt),
      specialties,
      "avatar": avatar.asset->url,
      "bio": coalesce(bio.${locale}, bio.pt),
      profileUrl,
      links[] { label, url }
    }
  `;
}
