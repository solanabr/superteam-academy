"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  userDocsNav,
  adminDocsNav,
  type NavSection,
} from "./nav-config";
import Image from "next/image";
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  Shield,
  X,
  Menu,
} from "lucide-react";

function SidebarSection({
  section,
  currentPath,
}: {
  section: NavSection;
  currentPath: string;
}) {
  const hasActive = section.items.some((item) => item.href === currentPath);
  const [open, setOpen] = useState<boolean>(true);

  return (
    <div className="mb-1">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-1.5 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
      >
        {open ? (
          <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronRight className="h-3 w-3" />
        )}
        {section.title}
      </button>
      {open && (
        <ul className="space-y-0.5 ml-2">
          {section.items.map((item) => {
            const isActive = currentPath === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`block rounded-md px-3 py-1.5 text-sm transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary font-medium border-l-2 border-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  {item.title}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function DocsSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isAdmin = pathname.startsWith("/docs/admin");

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-border">
        <Link href="/docs" className="flex items-center gap-2">
          <Image
            src="/superteam-logo.jpg"
            alt="Superteam"
            width={28}
            height={28}
            className="rounded-lg"
          />
          <span className="font-semibold text-sm">Superteam Academy</span>
        </Link>
      </div>

      {/* Tab switcher */}
      <div className="px-3 pt-3 pb-1 flex gap-1">
        <Link
          href="/docs"
          className={`flex-1 text-center py-1.5 px-2 text-xs font-medium rounded-md transition-colors ${
            !isAdmin
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          <BookOpen className="h-3.5 w-3.5 inline mr-1" />
          User Guide
        </Link>
        <Link
          href="/docs/admin"
          className={`flex-1 text-center py-1.5 px-2 text-xs font-medium rounded-md transition-colors ${
            isAdmin
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          <Shield className="h-3.5 w-3.5 inline mr-1" />
          Admin
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
        {(isAdmin ? adminDocsNav : userDocsNav).map((section) => (
          <SidebarSection
            key={section.title}
            section={section}
            currentPath={pathname}
          />
        ))}
      </nav>

      {/* Back to platform */}
      <div className="p-3 border-t border-border">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back to Platform
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 md:hidden p-2 rounded-lg bg-card border border-border shadow-sm"
        aria-label="Open docs menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="w-72 h-full bg-card border-r border-border shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-md hover:bg-muted"
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </button>
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-64 xl:w-72 flex-shrink-0 border-r border-border bg-card/50 flex-col h-screen sticky top-0 overflow-hidden">
        {sidebarContent}
      </aside>
    </>
  );
}
