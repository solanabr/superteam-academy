"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { useState } from "react"
import dynamic from "next/dynamic"
import {
  LayoutDashboard,
  BookOpen,
  Trophy,
  User,
  Settings,
  Menu,
  X,
  LogOut,
  ChevronRight,
  Flame,
  Star,
  Shield,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/ThemeToggle"
import { LanguageSwitcher } from "@/components/LanguageSwitcher"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

// Dynamically imported — wallet adapter is client-only (no SSR)
const WalletButton = dynamic(
  () => import("@/components/WalletButton").then((m) => m.WalletButton),
  { ssr: false, loading: () => null }
)

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/courses", label: "Courses", icon: BookOpen },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/settings", label: "Settings", icon: Settings },
]

function getXpLevel(xp: number) {
  return Math.floor(Math.sqrt(xp / 100))
}

function getLevelProgress(xp: number) {
  const level = getXpLevel(xp)
  const currentLevelXp = level * level * 100
  const nextLevelXp = (level + 1) * (level + 1) * 100
  return ((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100
}

interface DashboardSidebarProps {
  isAdmin?: boolean
  userXp?: number
  userStreak?: number
}

export function DashboardSidebar({ isAdmin, userXp = 0, userStreak = 0 }: DashboardSidebarProps) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [mobileOpen, setMobileOpen] = useState(false)
  const user = session?.user
  const level = getXpLevel(userXp)
  const progress = getLevelProgress(userXp)

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 border-b border-sidebar-border">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary/10 ring-1 ring-sidebar-border">
            <Image
              src="/imgs/logo.png"
              alt="Superteam Academy logo"
              width={36}
              height={36}
              className="h-full w-full object-contain"
            />
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-sidebar-foreground leading-none">Superteam</p>
            <p className="text-xs text-primary font-semibold">Academy</p>
          </div>
        </Link>
      </div>

      {/* User XP Card */}
      {user && (
        <div className="p-3 mx-3 mt-3 rounded-lg bg-sidebar-accent/50 border border-sidebar-border">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-semibold text-sidebar-foreground">Level {level}</span>
            </div>
            <span className="text-xs text-muted-foreground">{userXp.toLocaleString()} XP</span>
          </div>
          <div className="h-1.5 bg-sidebar-border rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          {userStreak > 0 && (
            <div className="flex items-center gap-1 mt-2">
              <Flame className="w-3 h-3 text-orange-400" />
              <span className="text-xs text-muted-foreground">{userStreak} day streak</span>
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                isActive
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              <item.icon className={cn("w-4 h-4", isActive ? "text-primary" : "")} />
              {item.label}
              {isActive && <ChevronRight className="w-3 h-3 ml-auto text-primary" />}
            </Link>
          )
        })}

        {isAdmin && (
          <>
            <div className="pt-3 pb-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase px-3">Admin</p>
            </div>
            <Link
              href="/admin"
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                pathname.startsWith("/admin")
                  ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                  : "text-sidebar-foreground hover:bg-sidebar-accent"
              )}
            >
              <Shield className="w-4 h-4" />
              Admin Panel
              <Badge className="ml-auto bg-orange-500/20 text-orange-400 border-orange-500/30 text-xs">
                Admin
              </Badge>
            </Link>
          </>
        )}
      </nav>

      {/* Wallet Connect */}
      {user && (
        <div className="px-3 pb-3 space-y-2">
          <div className="flex items-center gap-2">
            <LanguageSwitcher compact />
            <ThemeToggle size="sm" />
          </div>
          <WalletButton variant="sidebar" />
        </div>
      )}

      {/* User Footer */}
      {user && (
        <div className="p-3 border-t border-sidebar-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 w-full px-2 py-2 rounded-lg hover:bg-sidebar-accent transition-colors text-left">
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarImage src={user.image ?? ""} alt={user.name ?? ""} />
                  <AvatarFallback className="bg-primary/20 text-primary text-xs">
                    {user.name?.charAt(0).toUpperCase() ?? "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-sidebar-foreground truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link href="/profile">Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-60 flex-col fixed left-0 top-0 bottom-0 bg-sidebar border-r border-sidebar-border z-40">
        <SidebarContent />
      </aside>

      {/* Mobile Toggle Button */}
      <button
        aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
        className="lg:hidden fixed top-4 left-4 z-50 w-9 h-9 rounded-lg bg-sidebar border border-sidebar-border flex items-center justify-center shadow-lg"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
      </button>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          "lg:hidden fixed left-0 top-0 bottom-0 w-72 bg-sidebar border-r border-sidebar-border z-50 transition-transform duration-300",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarContent />
      </aside>
    </>
  )
}
