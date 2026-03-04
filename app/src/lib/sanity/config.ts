const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
if (!projectId && process.env.NODE_ENV === "production") {
  throw new Error("NEXT_PUBLIC_SANITY_PROJECT_ID is required");
}

export const sanityConfig = {
  projectId: projectId ?? "placeholder",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: "2024-01-01",
  useCdn: process.env.NODE_ENV === "production",
};
