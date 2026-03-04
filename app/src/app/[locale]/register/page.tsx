"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { Link, useRouter } from "@/i18n/navigation";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getData, postData } from "@/lib/api/config";
import { useAuthStore, type AuthState } from "@/store/auth-store";
import { AuthSocialButtons } from "@/components/auth/auth-social-buttons";
import { z } from "zod";

const register_schema = z
  .object({
    email: z.string().email(),
    name: z.string().min(1).max(256),
    password: z.string().min(8),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "passwordsDoNotMatch",
    path: ["confirmPassword"],
  });

export default function RegisterPage(): React.ReactElement {
  const t = useTranslations("auth");
  const t_common = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const set_session = useAuthStore((s: AuthState) => s.set_session);

  const [email, set_email] = useState("");
  const [name, set_name] = useState("");
  const [password, set_password] = useState("");
  const [confirm_password, set_confirm_password] = useState("");
  const [show_password, set_show_password] = useState(false);
  const [show_confirm_password, set_show_confirm_password] = useState(false);
  const [inline_error, set_inline_error] = useState<string | null>(null);
  const [is_loading, set_is_loading] = useState(false);

  const { theme } = useTheme();
  const [is_mounted, set_is_mounted] = useState(false);

  useEffect(() => {
    set_is_mounted(true);
  }, []);

  const is_dark = is_mounted && theme === "dark";
  const logo_src = is_dark ? "/dark-logo.jpg" : "/light-logo.jpg";

  const handle_submit = async (e: React.FormEvent) => {
    e.preventDefault();
    set_inline_error(null);
    const parsed = register_schema.safeParse({
      email,
      name,
      password,
      confirmPassword: confirm_password,
    });
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message;
      set_inline_error(msg === "passwordsDoNotMatch" ? t("passwordsDoNotMatch") : t("validationError"));
      return;
    }
    set_is_loading(true);
    try {
      await postData<{ ok: boolean }>("/api/auth/register", {
        email: parsed.data.email,
        name: parsed.data.name,
      });
      const session_data = await getData<{ user_id: string; email: string; role: string }>("/api/auth/session");
      set_session(session_data);
      router.push("/dashboard");
    } catch (err) {
      set_inline_error(err instanceof Error ? err.message : t_common("error"));
    } finally {
      set_is_loading(false);
    }
  };

  return (
    <div className="container mx-auto flex min-h-screen flex-col items-center justify-center p-4">
      <div className="mb-6 flex w-full max-w-md items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2.5 font-archivo text-lg font-semibold text-foreground no-underline"
        >
          <span className="relative flex h-10 w-32 items-center justify-center overflow-hidden border-2 border-border bg-card shadow-(--shadow-flat) dark:shadow-(--shadow-flat-yellow)">
            <Image src={logo_src} alt="Superteam Academy" fill className="object-cover" priority />
          </span>
        </Link>
        <LocaleSwitcher />
      </div>
      <div className="w-full max-w-md rounded-none border-2 border-border bg-card p-6 shadow-(--shadow-flat) dark:shadow-(--shadow-flat-yellow)">
        <div className="flex items-baseline justify-between border-b-2 border-dashed border-border pb-4">
          <h1 className="font-archivo text-xl font-bold uppercase tracking-wide text-foreground">
            {t("registerTitle")}
          </h1>
        </div>
        <form onSubmit={handle_submit} className="mt-6 space-y-4">
          {inline_error && (
            <p className="rounded-none border-2 border-destructive bg-destructive/10 px-3 py-2 text-xs font-mono text-destructive">
              {inline_error}
            </p>
          )}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs font-mono uppercase tracking-wide">
              {t("email")}
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => set_email(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              disabled={is_loading}
              className="rounded-none border-2 border-border bg-background px-3 py-2 text-sm shadow-(--shadow-flat) focus-visible:ring-0"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name" className="text-xs font-mono uppercase tracking-wide">
              {t("name")}
            </Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => set_name(e.target.value)}
              autoComplete="name"
              disabled={is_loading}
              className="rounded-none border-2 border-border bg-background px-3 py-2 text-sm shadow-(--shadow-flat) focus-visible:ring-0"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-xs font-mono uppercase tracking-wide">
              {t("password")}
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={show_password ? "text" : "password"}
                value={password}
                onChange={(e) => set_password(e.target.value)}
                autoComplete="new-password"
                disabled={is_loading}
                className="rounded-none border-2 border-border bg-background px-3 py-2 pr-24 text-sm shadow-(--shadow-flat) focus-visible:ring-0"
              />
              <button
                type="button"
                onClick={() => set_show_password((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent p-0 text-[10px] font-mono uppercase tracking-wide text-muted-foreground hover:text-foreground"
              >
                {show_password ? "Hide" : "Show"}
              </button>
            </div>
            {password.length > 0 && password.length < 8 && (
              <p className="text-xs font-mono text-muted-foreground">{t("passwordMinLength")}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-xs font-mono uppercase tracking-wide">
              {t("confirmPassword")}
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={show_confirm_password ? "text" : "password"}
                value={confirm_password}
                onChange={(e) => set_confirm_password(e.target.value)}
                autoComplete="new-password"
                disabled={is_loading}
                className="rounded-none border-2 border-border bg-background px-3 py-2 pr-24 text-sm shadow-(--shadow-flat) focus-visible:ring-0"
              />
              <button
                type="button"
                onClick={() => set_show_confirm_password((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent p-0 text-[10px] font-mono uppercase tracking-wide text-muted-foreground hover:text-foreground"
              >
                {show_confirm_password ? "Hide" : "Show"}
              </button>
            </div>
          </div>
          <Button
            type="submit"
            className="mt-2 w-full rounded-none border-2 border-border bg-primary font-mono text-xs uppercase tracking-wide shadow-(--shadow-flat) hover:translate-x-px hover:translate-y-px hover:shadow-none"
            disabled={is_loading}
          >
            {is_loading ? t_common("loading") : t("register")}
          </Button>
        </form>
        <div className="mt-6 border-t-2 border-dashed border-border pt-4">
          <AuthSocialButtons callback_url={`/${locale}/dashboard`} />
        </div>
        <p className="mt-4 text-center text-xs font-mono text-muted-foreground">
          <Link href="/login" className="text-primary underline-offset-4 hover:text-accent hover:underline">
            {t("login")}
          </Link>
        </p>
      </div>
    </div>
  );
}
