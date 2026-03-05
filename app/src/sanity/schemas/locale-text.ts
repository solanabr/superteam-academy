import { defineType } from "sanity";

export const localeTextType = defineType({
  name: "localeText",
  title: "Localized Text",
  type: "object",
  fields: [
    { name: "pt", type: "text", title: "Português (PT-BR)" },
    { name: "en", type: "text", title: "English" },
    { name: "es", type: "text", title: "Español" },
  ],
});
