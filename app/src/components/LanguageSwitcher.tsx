"use client"

import { Check, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AppLocale, LOCALES } from "@/lib/locale"
import { useI18n } from "@/components/providers/LocaleProvider"
import { useRouter } from "next/navigation"

const LABELS: Record<AppLocale, string> = {
  en: "English",
  "pt-BR": "Português (Brasil)",
  es: "Español",
}

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale } = useI18n()
  const router = useRouter()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size={compact ? "icon" : "sm"} className="gap-2" aria-label={compact ? "Change language" : undefined}>
          <Globe className="h-4 w-4" />
          {!compact ? LABELS[locale] : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {LOCALES.map((candidate) => (
          <DropdownMenuItem
            key={candidate}
            onClick={() => {
              setLocale(candidate)
              router.refresh()
              if (typeof window !== "undefined") {
                window.location.reload()
              }
            }}
            className="flex items-center justify-between gap-3"
          >
            <span>{LABELS[candidate]}</span>
            {candidate === locale ? <Check className="h-4 w-4" /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
