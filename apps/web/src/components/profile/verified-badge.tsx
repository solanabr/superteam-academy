"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import * as Tooltip from "@radix-ui/react-tooltip";
import { SealCheck } from "@phosphor-icons/react";
import type { VerifiedKind } from "@/lib/profiles/public-profile";
import { cn } from "@/lib/utils";

interface VerifiedBadgeProps {
  /**
   * Which badge to wear (#1234). `null`/absent is a verified author nobody has
   * classified yet: they keep the pre-#1234 generic teacher badge rather than
   * losing their badge while waiting on an admin.
   */
  kind?: VerifiedKind | null;
  /** Tailwind size classes; defaults to the inline-with-text size. */
  className?: string;
}

/**
 * Verified-author mark (#997, kinds added #1234).
 *
 * The badge is admin-granted (`profiles.verified` + `profiles.verified_kind`,
 * service_role writes only) — a self-service badge would mean nothing.
 *
 * Colour carries the kind and the label names it:
 *
 *   superteam → `--primary`, the brand green, in both themes
 *   partner   → `--text`, which IS the theme's ink: near-black on light,
 *               near-white on dark, so the mark reads as "not Superteam"
 *               without inventing a third colour
 *
 * Colour alone is never the message (a colour-blind reader, a greyscale
 * screenshot): the tooltip names the kind on hover AND on keyboard focus, and
 * the same string is the accessible name. `role="img"` keeps it one labelled
 * object rather than letting the SVG leak through.
 */
export function VerifiedBadge({ kind, className }: VerifiedBadgeProps) {
  const t = useTranslations("profile");
  // Radix opens on hover and on focus already; this extra state makes the
  // badge tappable on touch, where there is no hover at all.
  const [open, setOpen] = useState(false);

  const label = kind
    ? t(kind === "superteam" ? "superteamMember" : "verifiedPartner")
    : t("verifiedTeacher");

  return (
    <Tooltip.Provider delayDuration={0} skipDelayDuration={150}>
      <Tooltip.Root open={open} onOpenChange={setOpen}>
        <Tooltip.Trigger asChild>
          <span
            role="img"
            aria-label={label}
            tabIndex={0}
            onClick={() => setOpen((prev) => !prev)}
            className={cn(
              "inline-flex shrink-0 cursor-default align-middle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
              kind === "partner" ? "text-text" : "text-primary"
            )}
          >
            <SealCheck
              size={16}
              weight="fill"
              className={className}
              aria-hidden="true"
            />
          </span>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            className="heatmap-tooltip"
            sideOffset={6}
            side="top"
            collisionPadding={12}
          >
            <span className="ach-tip">{label}</span>
            <Tooltip.Arrow className="fill-[var(--card)]" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
