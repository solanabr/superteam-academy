import { defineField, defineType } from "sanity";

const LESSON_TYPE_TITLES: Record<string, string> = {
  content: "Content",
  code_challenge: "Code Challenge",
  quiz: "Quiz",
};

export const lesson = defineType({
  name: "lesson",
  title: "Lesson",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (rule) =>
        rule.required().min(1).max(120).error("Title is required"),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      description: "URL-safe identifier generated from the title",
      options: {
        source: "title",
        maxLength: 96,
      },
      validation: (rule) => rule.required().error("Slug is required"),
    }),
    defineField({
      name: "order",
      title: "Order",
      type: "number",
      description:
        "Zero-based index of this lesson within its course. Must match the on-chain lesson index.",
      validation: (rule) =>
        rule
          .required()
          .integer()
          .min(0)
          .error("Order is required and must be a non-negative integer"),
    }),
    defineField({
      name: "type",
      title: "Lesson Type",
      type: "string",
      options: {
        list: [
          { title: "Content", value: "content" },
          { title: "Code Challenge", value: "code_challenge" },
          { title: "Quiz", value: "quiz" },
        ],
        layout: "radio",
      },
      initialValue: "content",
      validation: (rule) => rule.required().error("Lesson type is required"),
    }),
    defineField({
      name: "content",
      title: "Content",
      type: "array",
      description: "Rich-text lesson body (Portable Text)",
      of: [
        {
          type: "block",
          styles: [
            { title: "Normal", value: "normal" },
            { title: "Heading 2", value: "h2" },
            { title: "Heading 3", value: "h3" },
            { title: "Heading 4", value: "h4" },
            { title: "Quote", value: "blockquote" },
          ],
          lists: [
            { title: "Bullet", value: "bullet" },
            { title: "Numbered", value: "number" },
          ],
          marks: {
            decorators: [
              { title: "Bold", value: "strong" },
              { title: "Italic", value: "em" },
              { title: "Underline", value: "underline" },
              { title: "Code", value: "code" },
            ],
            annotations: [
              {
                name: "link",
                type: "object",
                title: "Link",
                fields: [
                  defineField({
                    name: "href",
                    title: "URL",
                    type: "url",
                    validation: (rule) =>
                      rule.uri({
                        allowRelative: false,
                        scheme: ["http", "https"],
                      }),
                  }),
                  defineField({
                    name: "blank",
                    title: "Open in new tab",
                    type: "boolean",
                    initialValue: true,
                  }),
                ],
              },
            ],
          },
        },
        {
          type: "image",
          options: { hotspot: true },
          fields: [
            defineField({
              name: "alt",
              title: "Alt Text",
              type: "string",
              description: "Describe the image for screen readers",
            }),
            defineField({
              name: "caption",
              title: "Caption",
              type: "string",
            }),
          ],
        },
        {
          name: "codeBlock",
          title: "Code Block",
          type: "object",
          fields: [
            defineField({
              name: "code",
              title: "Code",
              type: "text",
              rows: 10,
            }),
            defineField({
              name: "language",
              title: "Language",
              type: "string",
              options: {
                list: [
                  { title: "TypeScript", value: "typescript" },
                  { title: "JavaScript", value: "javascript" },
                  { title: "Rust", value: "rust" },
                  { title: "Bash / Shell", value: "bash" },
                  { title: "JSON", value: "json" },
                  { title: "TOML", value: "toml" },
                  { title: "Plain Text", value: "text" },
                ],
              },
              initialValue: "typescript",
            }),
            defineField({
              name: "filename",
              title: "Filename",
              type: "string",
              description: "Optional filename shown above the code block",
            }),
            defineField({
              name: "highlightLines",
              title: "Highlight Lines",
              type: "string",
              description:
                "Comma-separated line numbers or ranges to highlight (e.g. '1,3-5')",
            }),
          ],
          preview: {
            select: {
              language: "language",
              filename: "filename",
              code: "code",
            },
            prepare({ language, filename, code }) {
              const preview = (code ?? "").split("\n")[0]?.slice(0, 60) ?? "";
              return {
                title: filename ?? `Code Block (${language ?? "unknown"})`,
                subtitle: preview,
              };
            },
          },
        },
        {
          name: "callout",
          title: "Callout",
          type: "object",
          fields: [
            defineField({
              name: "tone",
              title: "Tone",
              type: "string",
              options: {
                list: [
                  { title: "Info", value: "info" },
                  { title: "Warning", value: "warning" },
                  { title: "Tip", value: "tip" },
                  { title: "Danger", value: "danger" },
                ],
                layout: "radio",
              },
              initialValue: "info",
            }),
            defineField({
              name: "text",
              title: "Text",
              type: "text",
              rows: 3,
            }),
          ],
          preview: {
            select: { tone: "tone", text: "text" },
            prepare({ tone, text }) {
              return {
                title: `Callout — ${tone ?? "info"}`,
                subtitle: (text ?? "").slice(0, 80),
              };
            },
          },
        },
      ],
    }),
    defineField({
      name: "estimatedMinutes",
      title: "Estimated Minutes",
      type: "number",
      description: "Approximate reading/completion time in minutes",
      validation: (rule) => rule.integer().min(1),
    }),
    defineField({
      name: "codeChallenge",
      title: "Code Challenge",
      type: "reference",
      description: "Required when lesson type is 'code_challenge'",
      to: [{ type: "codeChallenge" }],
    }),
  ],
  orderings: [
    {
      title: "Order (Ascending)",
      name: "orderAsc",
      by: [{ field: "order", direction: "asc" }],
    },
  ],
  preview: {
    select: {
      title: "title",
      order: "order",
      type: "type",
      estimatedMinutes: "estimatedMinutes",
    },
    prepare({ title, order, type, estimatedMinutes }) {
      const typeLabel =
        type !== undefined ? LESSON_TYPE_TITLES[type] ?? type : "Content";
      const parts = [
        `#${order}`,
        typeLabel,
        estimatedMinutes !== undefined ? `${estimatedMinutes} min` : undefined,
      ].filter(Boolean);

      return {
        title,
        subtitle: parts.join(" · "),
      };
    },
  },
});
