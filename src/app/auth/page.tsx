import { redirect } from "next/navigation";

export default async function AuthRootPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolved = await searchParams;
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(resolved)) {
    if (typeof value === "string") {
      query.set(key, value);
      continue;
    }
    if (Array.isArray(value) && value.length > 0) {
      query.set(key, value[0]);
    }
  }

  const suffix = query.toString();
  redirect(`/en/auth${suffix ? `?${suffix}` : ""}`);
}

