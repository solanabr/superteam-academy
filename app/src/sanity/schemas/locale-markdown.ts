import { defineType } from "sanity";

export const localeMarkdownType = defineType({
  name: "localeMarkdown",
  title: "Localized Markdown",
  type: "object",
  fields: [
    { name: "pt", type: "markdown", title: "Português (PT-BR)" },
    { name: "en", type: "markdown", title: "English" },
    { name: "es", type: "markdown", title: "Español" },
  ],
});
