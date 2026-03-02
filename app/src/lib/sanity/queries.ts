import { sanityClient } from "./client";

const courseFields = `
  _id,
  courseId,
  title,
  slug,
  description,
  shortDescription,
  image,
  trackId,
  difficulty,
  lessonCount,
  xpPerLesson,
  language,
  estimatedHours,
  "author": author->{name, avatar, bio, twitter, github},
  "lessons": lessons[]->{_id, title, slug, order, type, estimatedMinutes},
  tags,
  publishedAt
`;

export async function getCourses() {
  return sanityClient.fetch(
    `*[_type == "course" && !(_id in path("drafts.**"))] | order(publishedAt desc) {
      ${courseFields}
    }`
  );
}

export async function getCourseBySlug(slug: string) {
  return sanityClient.fetch(
    `*[_type == "course" && slug.current == $slug && !(_id in path("drafts.**"))][0] {
      ${courseFields}
    }`,
    { slug }
  );
}

export async function getCoursesByTrack(trackId: number) {
  return sanityClient.fetch(
    `*[_type == "course" && trackId == $trackId && !(_id in path("drafts.**"))] | order(publishedAt desc) {
      ${courseFields}
    }`,
    { trackId }
  );
}

export async function getLesson(slug: string) {
  return sanityClient.fetch(
    `*[_type == "lesson" && slug.current == $slug && !(_id in path("drafts.**"))][0] {
      _id,
      title,
      slug,
      order,
      type,
      content,
      estimatedMinutes,
      "codeChallenge": codeChallenge->{
        _id,
        title,
        description,
        starterCode,
        solutionCode,
        testCases,
        language,
        hints
      },
      "course": *[_type == "course" && references(^._id)][0]{
        _id,
        courseId,
        title,
        slug,
        "lessons": lessons[]->{_id, title, slug, order}
      }
    }`,
    { slug }
  );
}

export async function getTracks() {
  return sanityClient.fetch(
    `*[_type == "track" && !(_id in path("drafts.**"))] | order(order asc) {
      _id,
      trackId,
      name,
      description,
      icon,
      color,
      "courseCount": count(*[_type == "course" && trackId == ^.trackId])
    }`
  );
}

export async function getAchievements() {
  return sanityClient.fetch(
    `*[_type == "achievement" && !(_id in path("drafts.**"))] | order(name asc) {
      _id,
      achievementId,
      name,
      description,
      image,
      rarity,
      xpReward,
      maxSupply,
      category
    }`
  );
}
