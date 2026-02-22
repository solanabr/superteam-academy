import { defineCliConfig } from "sanity/cli";

export default defineCliConfig({
  api: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID!,
    dataset: process.env.SANITY_STUDIO_DATASET || "production",
  },
  studioHost: "superteam-academy",
  deployment: {
    appId: "gwal4bll2wxxifh7c9rri349",
  },
});
