"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/routing";
import { useState, useRef, useEffect } from "react";
import { Button } from "../ui/button";
import { Languages, ChevronUp, ChevronDown } from "lucide-react";

const locales = [
  { code: "en", label: "English" },
  { code: "pt-BR", label: "Português (BR)" },
  { code: "es", label: "Español" },
] as const;

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function onSelectChange(nextLocale: string) {
    router.replace(pathname, { locale: nextLocale });
    setIsOpen(false);
  }

  const currentLabel = locales.find((l) => l.code === locale)?.label || "English";

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="ghost"
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-all text-sm font-medium text-text-muted hover:text-white h-auto"
      >
        <Languages size={18} />
        <span className="hidden sm:inline">{currentLabel}</span>
        {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 rounded-lg bg-void/95 backdrop-blur-md border border-white/10 shadow-xl overflow-hidden z-50">
          <div className="py-1">
            {locales.map((l) => (
              <Button
                key={l.code}
                onClick={() => onSelectChange(l.code)}
                variant="ghost"
                className={`w-full text-left justify-start px-4 py-2 text-sm transition-colors hover:bg-white/5 h-auto rounded-none ${locale === l.code ? "text-solana font-medium" : "text-text-secondary"
                  }`}
              >
                {l.label}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
