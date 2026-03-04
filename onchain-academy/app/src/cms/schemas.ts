export const courseSchema = {
  name: "course",
  title: "Course",
  fields: [
    { name: "title", type: "string" },
    { name: "slug", type: "slug" },
    { name: "description", type: "text" },
    { name: "difficulty", type: "string" },
    { name: "durationHours", type: "number" },
    { name: "xpReward", type: "number" },
    { name: "track", type: "string" },
  ],
};

export const moduleSchema = {
  name: "module",
  title: "Module",
  fields: [
    { name: "title", type: "string" },
    { name: "courseRef", type: "reference" },
    { name: "order", type: "number" },
  ],
};

export const lessonSchema = {
  name: "lesson",
  title: "Lesson",
  fields: [
    { name: "title", type: "string" },
    { name: "moduleRef", type: "reference" },
    { name: "type", type: "string" },
    { name: "content", type: "markdown" },
    { name: "starterCode", type: "text" },
  ],
};
