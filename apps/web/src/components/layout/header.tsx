"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { List, X } from "@phosphor-icons/react";
import type { User } from "@supabase/supabase-js";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { AuthModal } from "@/components/auth/auth-modal";
import { UserMenu } from "@/components/auth/user-menu";
import { createClient } from "@/lib/supabase/client";

interface UserProfile {
  username: string;
  avatar_url: string | null;
  wallet_address: string | null;
}

export function Header() {
  const tA11y = useTranslations("a11y");
  const locale = useLocale();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function loadUser() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        const { data } = await supabase
          .from("profiles")
          .select("username, avatar_url, wallet_address")
          .eq("id", currentUser.id)
          .single();
        if (data) {
          setProfile(data);
        }
      }
      setAuthLoading(false);
    }

    loadUser();

    // IMPORTANT: This callback must NOT be async.
    // During initialization, GoTrue awaits all onAuthStateChange callbacks.
    // An async callback that calls supabase.from() would deadlock because the
    // Postgrest client internally calls getSession(), which awaits initializePromise.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const newUser = session?.user ?? null;
      setUser(newUser);

      if (newUser) {
        supabase
          .from("profiles")
          .select("username, avatar_url, wallet_address")
          .eq("id", newUser.id)
          .single()
          .then(({ data }) => {
            if (data) setProfile(data as UserProfile);
          });
      } else {
        setProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <header className="bg-card/95 supports-[backdrop-filter]:bg-card/60 sticky top-0 z-50 border-b-[2.5px] border-border backdrop-blur">
      <div className="flex h-16 items-center">
        <Link
          href={`/${locale}`}
          className="shrink-0 pl-4 transition-opacity hover:opacity-80 lg:flex lg:w-[240px] lg:items-center lg:pl-6"
        >
          <Image
            src="/logo-light.png"
            alt="Solarium"
            width={160}
            height={48}
            className="h-12 w-auto dark:hidden"
            priority
          />
          <Image
            src="/logo-dark.png"
            alt="Solarium"
            width={160}
            height={48}
            className="hidden h-12 w-auto dark:block"
            priority
          />
        </Link>

        <div className="flex flex-1 items-center justify-end gap-3 pr-4 lg:pr-8">
          <div className="hidden items-center gap-3 md:flex">
            {authLoading ? (
              <div className="h-9 w-20 animate-pulse rounded-md bg-subtle" />
            ) : user && profile ? (
              <UserMenu
                username={profile.username}
                avatarUrl={profile.avatar_url}
                walletAddress={profile.wallet_address}
                locale={locale}
              />
            ) : (
              <AuthModal />
            )}
            <LanguageSwitcher />
            <ThemeToggle />
          </div>

          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border-[2.5px] border-border transition-colors hover:bg-subtle md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? tA11y("closeMenu") : tA11y("openMenu")}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <X size={24} weight="bold" />
            ) : (
              <List size={24} weight="bold" />
            )}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-border bg-card md:hidden">
          <div className="container space-y-3 py-4">
            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              <ThemeToggle />
            </div>
            <div className="pt-2">
              {authLoading ? (
                <div className="h-9 w-20 animate-pulse rounded-md bg-subtle" />
              ) : user && profile ? (
                <UserMenu
                  username={profile.username}
                  avatarUrl={profile.avatar_url}
                  walletAddress={profile.wallet_address}
                  locale={locale}
                />
              ) : (
                <AuthModal />
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
