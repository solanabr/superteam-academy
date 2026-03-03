import type { CollectionConfig } from "payload";
import { allowPublicRead, isAdminOrEditor, isAdmin } from "./access";

export const Media: CollectionConfig = {
  slug: "media",
  upload: {
    staticDir: "./public/cms-media",
    mimeTypes: [
      "image/png",
      "image/jpeg",
      "image/webp",
      "image/svg+xml",
      "image/gif",
    ],
    imageSizes: [
      { name: "thumbnail", width: 400, height: 300, position: "centre" },
      { name: "card", width: 768, height: 432, position: "centre" },
      { name: "hero", width: 1920, height: undefined, position: "centre" },
    ],
  },
  access: {
    read: allowPublicRead,
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdmin,
  },
  folders: true,
  fields: [
    {
      name: "alt",
      type: "text",
      required: true,
      admin: {
        description:
          "Describe the image for accessibility (screen readers, SEO)",
      },
    },
  ],
};
