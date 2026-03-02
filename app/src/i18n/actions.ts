"use server";

import { cookies } from "next/headers";
import { type Locale, locales, defaultLocale } from "./config";

export async function setLocale(locale: string) {
  if (!locales.includes(locale as Locale)) {
    locale = defaultLocale;
  }
  const cookieStore = await cookies();
  cookieStore.set("locale", locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}
