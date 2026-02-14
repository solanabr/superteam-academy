import { client } from "./client";

export async function getCourses() {
  return client.fetch(`*[_type == "course"] | order(order asc) {
    _id,
    title,
    slug,
    description,
    thumbnail,
    difficulty,
    duration,
    xpTotal,
    track,
    "lessonCount": count(modules[].lessons[]),
    "challengeCount": count(modules[].lessons[type == "challenge"]),
    totalCompletions,
    totalEnrollments,
    isActive,
    creator->{name, avatar},
    _createdAt
  }`);
}

export async function getCourseBySlug(slug: string) {
  return client.fetch(
    `*[_type == "course" && slug.current == $slug][0] {
      _id,
      title,
      slug,
      description,
      thumbnail,
      difficulty,
      duration,
      xpTotal,
      track,
      isActive,
      totalCompletions,
      totalEnrollments,
      creator->{name, avatar, bio},
      modules[] | order(order asc) {
        _key,
        title,
        description,
        order,
        lessons[] | order(order asc) {
          _key,
          title,
          description,
          order,
          type,
          xpReward,
          duration,
          content,
          challenge {
            language,
            prompt,
            starterCode,
            solution,
            testCases[] {
              _key,
              name,
              input,
              expectedOutput
            },
            hints
          }
        }
      },
      _createdAt
    }`,
    { slug }
  );
}

export async function getAuthors() {
  return client.fetch(`*[_type == "author"] | order(name asc) {
    _id,
    name,
    avatar,
    bio,
    wallet
  }`);
}
