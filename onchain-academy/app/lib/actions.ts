"use server";

import { cookies } from "next/headers";
import { type Locale, locales } from "@/i18n/request";

export async function setLocale(locale: string) {
  if (!locales.includes(locale as Locale)) return;
  const cookieStore = await cookies();
  cookieStore.set("locale", locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}
