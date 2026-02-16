import { cookies } from "next/headers";

export type User = {
  name: string;
};

const COOKIE_NAME = "st_academy_user";

export async function getUser(): Promise<User | null> {
  const jar = await cookies();
  const raw = jar.get(COOKIE_NAME)?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as User;
    if (!parsed?.name) return null;
    return parsed;
  } catch {
    return null;
  }
}

export { COOKIE_NAME };
