export const codeBlockSchema = {
  name: "codeBlock",
  title: "Code Block",
  type: "object",
  fields: [
    { name: "language", title: "Language", type: "string", options: { list: ["typescript", "rust", "javascript", "bash", "json"] } },
    { name: "code", title: "Code", type: "text" },
  ],
};

export const calloutSchema = {
  name: "callout",
  title: "Callout",
  type: "object",
  fields: [
    { name: "type", title: "Type", type: "string", options: { list: ["info", "warning", "error", "tip"] } },
    { name: "text", title: "Text", type: "text" },
  ],
};
