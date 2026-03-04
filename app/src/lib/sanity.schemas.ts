export const courseSchema = {
  name: "course",
  title: "Course",
  type: "document",
  fields: [
    { name: "slug", type: "slug" },
    { name: "title", type: "string" },
    { name: "description", type: "text" },
    { name: "level", type: "string" },
    { name: "tags", type: "array", of: [{ type: "string" }] },
  ],
};

export const lessonSchema = {
  name: "lesson",
  title: "Lesson",
  type: "document",
  fields: [
    { name: "slug", type: "slug" },
    { name: "title", type: "string" },
    { name: "minutes", type: "number" },
    { name: "course", type: "reference", to: [{ type: "course" }] },
  ],
};

export const challengeSchema = {
  name: "challenge",
  title: "Challenge",
  type: "document",
  fields: [
    { name: "title", type: "string" },
    { name: "description", type: "text" },
    { name: "lesson", type: "reference", to: [{ type: "lesson" }] },
  ],
};

export const achievementSchema = {
  name: "achievement",
  title: "Achievement",
  type: "document",
  fields: [
    { name: "slug", type: "slug" },
    { name: "title", type: "string" },
    { name: "description", type: "text" },
    { name: "xpReward", type: "number" },
  ],
};
