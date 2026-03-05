import { defineType } from "sanity";

export const localeStringType = defineType({
  name: "localeString",
  title: "Localized String",
  type: "object",
  fields: [
    { name: "pt", type: "string", title: "Português (PT-BR)" },
    { name: "en", type: "string", title: "English" },
    { name: "es", type: "string", title: "Español" },
  ],
});
