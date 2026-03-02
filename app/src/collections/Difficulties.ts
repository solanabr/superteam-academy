import type { CollectionConfig } from "payload";
import { allowPublicRead, isAdminOrEditor, isAdmin } from "./access";

export const Difficulties: CollectionConfig = {
  slug: "difficulties",
  admin: {
    useAsTitle: "label",
    defaultColumns: ["label", "value", "color", "order", "defaultXp"],
  },
  access: {
    read: allowPublicRead,
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdmin,
  },
  fields: [
    {
      type: "row",
      fields: [
        {
          name: "value",
          type: "text",
          required: true,
          unique: true,
          admin: {
            width: "50%",
            description: 'Slug identifier (e.g. "beginner")',
          },
        },
        {
          name: "label",
          type: "text",
          required: true,
          admin: {
            width: "50%",
            description: 'Display name (e.g. "Beginner")',
          },
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "color",
          type: "text",
          required: true,
          admin: {
            width: "33%",
            description: 'Hex color (e.g. "#2d9b6e")',
          },
        },
        {
          name: "order",
          type: "number",
          required: true,
          admin: {
            width: "33%",
            description: "Sort position (0, 1, 2, ...)",
          },
        },
        {
          name: "defaultXp",
          type: "number",
          required: true,
          admin: {
            width: "33%",
            description: "Default XP per lesson for this difficulty",
          },
        },
      ],
    },
  ],
};
