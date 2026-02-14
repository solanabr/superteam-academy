export const lessonSchema = {
  name: "lesson",
  title: "Lesson",
  type: "document",
  fields: [
    { name: "title", title: "Title", type: "string" },
    { name: "order", title: "Order", type: "number" },
    { name: "content", title: "Content", type: "text" },
    { name: "challengePrompt", title: "Challenge Prompt", type: "text" }
  ]
};
