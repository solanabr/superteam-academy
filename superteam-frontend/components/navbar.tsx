"use client"

import Link from "next/link"
import { useState } from "react"
import {
  BookOpen,
  LayoutDashboard,
  Trophy,
  User,
  Settings,
  Menu,
  X,
  Flame,
  Zap,
  Search,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { currentUser } from "@/lib/mock-data"

const navLinks = [
  { href: "/courses", label: "Courses", icon: BookOpen },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
]

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Zap className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold text-foreground">
            Chain<span className="text-primary">Learn</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="hidden items-center gap-3 md:flex">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <Search className="h-4 w-4" />
          </Button>

          {/* Streak */}
          <div className="flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-1.5">
            <Flame className="h-4 w-4 text-[hsl(var(--gold))]" />
            <span className="text-sm font-semibold text-foreground">{currentUser.streak}</span>
          </div>

          {/* XP */}
          <div className="flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-1.5">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">{currentUser.xp.toLocaleString()}</span>
          </div>

          {/* Profile */}
          <Link href="/profile" className="flex items-center gap-2">
            <Avatar className="h-8 w-8 border border-primary/30">
              <AvatarFallback className="bg-primary/20 text-xs text-primary">
                {currentUser.avatar}
              </AvatarFallback>
            </Avatar>
          </Link>

          <Link href="/settings">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
              <Settings className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Mobile toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden text-muted-foreground"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="border-t border-border bg-background px-4 py-4 md:hidden">
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
            <Avatar className="h-10 w-10 border border-primary/30">
              <AvatarFallback className="bg-primary/20 text-sm text-primary">
                {currentUser.avatar}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold text-foreground">{currentUser.name}</p>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Flame className="h-3 w-3 text-[hsl(var(--gold))]" /> {currentUser.streak}
                </span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Zap className="h-3 w-3 text-primary" /> {currentUser.xp.toLocaleString()} XP
                </span>
              </div>
            </div>
            <Badge variant="outline" className="ml-auto border-primary/30 text-primary text-xs">
              Lvl {currentUser.level}
            </Badge>
          </div>
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                onClick={() => setMobileOpen(false)}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            ))}
            <Link
              href="/profile"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              onClick={() => setMobileOpen(false)}
            >
              <User className="h-4 w-4" />
              Profile
            </Link>
            <Link
              href="/settings"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              onClick={() => setMobileOpen(false)}
            >
              <Settings className="h-4 w-4" />
              Settings
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
