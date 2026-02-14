export const courseSchema = {
  name: "course",
  title: "Course",
  type: "document",
  fields: [
    { name: "title", title: "Title", type: "string", validation: (rule: { required: () => unknown }) => rule.required() },
    { name: "slug", title: "Slug", type: "slug", options: { source: "title" } },
    { name: "description", title: "Description", type: "text" },
    { name: "topic", title: "Topic", type: "string" },
    {
      name: "difficulty",
      title: "Difficulty",
      type: "string",
      options: { list: ["beginner", "intermediate", "advanced"] }
    },
    { name: "durationHours", title: "Duration (hours)", type: "number" },
    { name: "xpReward", title: "XP reward", type: "number" },
    {
      name: "modules",
      title: "Modules",
      type: "array",
      of: [{ type: "reference", to: [{ type: "module" }] }]
    }
  ]
};
