"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
import { Link } from "@/i18n/navigation";
import type { FooterContent } from "@/lib/types/landing";
import { useEffect, useState } from "react";

interface FooterProps {
  content: FooterContent;
}

export function Footer({ content }: FooterProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(id);
  }, []);
  const isDark = mounted && theme === "dark";
  const logoSrc = isDark ? "/dark-logo.jpg" : "/light-logo.jpg";
  const currentYear = new Date().getFullYear();
  const copyrightText = content.copyright.replace(/\b20\d{2}\b/, String(currentYear));

  return (
    <footer className="bg-(--color-near-black) dark:bg-(--color-surface-dark) border-t-2 border-border pt-16 pb-8 px-4 md:px-8">
      <div className="max-w-[1200px] mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          <div className="lg:col-span-2">
            <Link
              href="/"
              className="flex items-center gap-2.5 font-extrabold text-(--color-cream) no-underline [font-family:var(--font-archivo)] text-lg mb-4"
            >
              <span className="relative w-32 h-10 shrink-0 overflow-hidden rounded-md border-2 border-border">
                <Image src={logoSrc} alt="" fill className="object-cover" loading="eager" />
              </span>
            </Link>
            <p className="text-sm text-(--color-code-muted) leading-relaxed max-w-[240px]">
              {content.brandDesc}
            </p>
          </div>
          {content.sections.map((section, i) => (
            <div key={i}>
              <h4 className="[font-family:var(--font-archivo)] font-bold text-xs text-(--color-yellow) uppercase tracking-widest mb-4">
                {section.title}
              </h4>
              <ul className="list-none flex flex-col gap-2">
                {section.links.map((link, j) => (
                  <li key={j}>
                    <Link
                      href={link.href ?? "#"}
                      className="text-(--color-code-muted) text-sm no-underline hover:text-(--color-cream) transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-border pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="font-mono text-[0.7rem] text-muted-foreground">{copyrightText}</p>
          <p className="font-mono text-[0.7rem] text-muted-foreground">{content.builtOn} ◆</p>
        </div>
      </div>
    </footer>
  );
}
