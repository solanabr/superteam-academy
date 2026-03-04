"use client"

import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

interface ThemeToggleProps {
  size?: "sm" | "icon"
}

export function ThemeToggle({ size = "icon" }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button aria-label="Toggle theme" variant="outline" size={size}>
        <Sun className="h-4 w-4" />
      </Button>
    )
  }

  const isDark = theme === "dark"

  return (
    <Button
      aria-label="Toggle theme"
      variant="outline"
      size={size}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="gap-2"
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      {size === "sm" && <span>{isDark ? "Light" : "Dark"}</span>}
    </Button>
  )
}
