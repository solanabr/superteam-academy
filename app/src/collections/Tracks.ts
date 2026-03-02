import type { CollectionConfig } from "payload";
import { allowPublicRead, isAdminOrEditor, isAdmin } from "./access";

export const Tracks: CollectionConfig = {
  slug: "tracks",
  admin: {
    useAsTitle: "display",
    defaultColumns: ["trackId", "name", "display", "color"],
  },
  access: {
    read: allowPublicRead,
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdmin,
  },
  fields: [
    {
      name: "trackId",
      type: "number",
      required: true,
      unique: true,
      admin: { description: "Numeric ID matching the on-chain track spec" },
    },
    {
      type: "row",
      fields: [
        {
          name: "name",
          type: "text",
          required: true,
          admin: {
            width: "33%",
            description: "Internal name (e.g. 'anchor')",
          },
        },
        {
          name: "display",
          type: "text",
          required: true,
          admin: {
            width: "33%",
            description: "Display name (e.g. 'Anchor Framework')",
          },
        },
        {
          name: "short",
          type: "text",
          required: true,
          admin: { width: "33%", description: "Short label (e.g. 'Anchor')" },
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
          admin: { width: "50%", description: "Hex color (e.g. '#4a8c5c')" },
        },
        {
          name: "icon",
          type: "text",
          required: true,
          admin: {
            width: "50%",
            description: "Lucide icon name (e.g. 'Anchor')",
          },
        },
      ],
    },
    {
      name: "collectionAddress",
      type: "text",
      admin: {
        description:
          "Metaplex Core collection pubkey for on-chain credentials. Overrides TRACK_COLLECTION_N env var.",
      },
    },
  ],
};
