"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type HeaderNavProps = {
  href: string;
  label: string;
};

export function HeaderNav({ href, label }: HeaderNavProps) {
  const pathname = usePathname();
  const isActive =
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={cn(
        "relative rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200",
        "text-muted-foreground hover:text-foreground",
        "after:absolute after:bottom-0 after:left-2 after:right-2 after:h-0.5 after:rounded-full after:transition-colors after:duration-200",
        isActive
          ? "text-foreground after:bg-secondary"
          : "after:bg-transparent hover:after:bg-secondary/60",
      )}
    >
      {label}
    </Link>
  );
}
