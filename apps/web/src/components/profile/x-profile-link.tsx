"use client";

import { useTranslations } from "next-intl";
import { XLogo } from "@phosphor-icons/react";
import { xProfileUrl } from "@/lib/profiles/x-account";
import { cn } from "@/lib/utils";

interface XProfileLinkProps {
  /** The author's X handle, without the `@`. */
  username: string;
  className?: string;
}

/**
 * The X mark beside a verified author's name, linking to the X handle an admin
 * set for them. Sized and aligned to sit next to `VerifiedBadge`.
 */
export function XProfileLink({ username, className }: XProfileLinkProps) {
  const t = useTranslations("profile");
  const label = t("onX", { handle: username });

  return (
    <a
      href={xProfileUrl(username)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex shrink-0 align-middle text-text-2 transition-colors hover:text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        className
      )}
    >
      <XLogo size={15} weight="bold" aria-hidden="true" />
    </a>
  );
}
