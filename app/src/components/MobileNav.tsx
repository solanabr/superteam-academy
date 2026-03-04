"use client"

import { useState } from "react"
import { Menu, X } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface MobileNavProps {
  isSignedIn: boolean
  showAdminLink: boolean
}

export function MobileNav({ isSignedIn, showAdminLink }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false)

  const closeMenu = () => setIsOpen(false)

  return (
    <div className="md:hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-muted-foreground hover:bg-muted rounded-md"
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {isOpen && (
        <div className="fixed top-14 right-0 h-auto w-full bg-background shadow-lg z-50 border-t border-border">
          <nav className="flex flex-col p-4 space-y-2">
            {isSignedIn ? (
              <>
                {showAdminLink && (
                  <Link
                    href="/admin"
                    className="px-4 py-3 hover:bg-muted rounded-md"
                    onClick={closeMenu}
                  >
                    Admin
                  </Link>
                )}
                <Link
                  href="/courses"
                  className="px-4 py-3 hover:bg-muted rounded-md"
                  onClick={closeMenu}
                >
                  Courses
                </Link>
                <Link
                  href="/dashboard"
                  className="px-4 py-3 hover:bg-muted rounded-md"
                  onClick={closeMenu}
                >
                  Dashboard
                </Link>
              </>
            ) : (
              <div className="px-4 py-3">
                <Button className="w-full bg-primary border-0 text-white" asChild>
                  <Link href="/sign-in" onClick={closeMenu}>Sign In</Link>
                </Button>
              </div>
            )}
          </nav>
        </div>
      )}
    </div>
  )
}
