import { buildConfig } from "payload";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { s3Storage } from "@payloadcms/storage-s3";
import sharp from "sharp";
import { Courses } from "./src/collections/Courses";
import { Media } from "./src/collections/Media";
import { Users } from "./src/collections/Users";

const s3Enabled = !!(
  process.env.S3_BUCKET &&
  process.env.S3_REGION &&
  process.env.S3_ACCESS_KEY_ID &&
  process.env.S3_SECRET_ACCESS_KEY
);

export default buildConfig({
  admin: {
    user: "users",
    theme: "all",
    meta: {
      titleSuffix: " — Superteam Academy",
    },
    components: {
      actions: ["@/components/cms/theme-toggle#ThemeToggle"],
    },
    livePreview: {
      url: ({ data }) =>
        `/preview/courses/${(data as Record<string, unknown>).slug || ""}`,
      collections: ["courses"],
      breakpoints: [
        { label: "Mobile", name: "mobile", width: 375, height: 667 },
        { label: "Tablet", name: "tablet", width: 768, height: 1024 },
        { label: "Desktop", name: "desktop", width: 1440, height: 900 },
      ],
    },
  },
  routes: {
    admin: "/cms",
    api: "/cms-api",
  },
  collections: [Users, Courses, Media],
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL!,
    },
    schemaName: "payload",
  }),
  editor: lexicalEditor(),
  plugins: [
    s3Storage({
      enabled: s3Enabled,
      bucket: process.env.S3_BUCKET || "",
      config: {
        region: process.env.S3_REGION || "us-east-1",
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
        },
        ...(process.env.S3_ENDPOINT && { endpoint: process.env.S3_ENDPOINT, forcePathStyle: true }),
      },
      collections: {
        media: true,
      },
    }),
  ],
  sharp,
  secret: process.env.PAYLOAD_SECRET ?? "local-dev-secret-change-in-prod",
  typescript: { outputFile: "./src/types/payload.ts" },
});
