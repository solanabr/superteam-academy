"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Search, BookOpen, Users, Trophy, Settings } from "lucide-react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useUIStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";

interface SearchItem {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  category: string;
}

export function CommandSearch() {
  const t = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const { searchOpen, setSearchOpen } = useUIStore();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const allItems: SearchItem[] = [
    { id: "courses", label: t("courses"), description: "Browse all courses", icon: <BookOpen className="h-4 w-4" />, href: `/${locale}/courses`, category: "Pages" },
    { id: "dashboard", label: t("dashboard"), description: "Your learning dashboard", icon: <Users className="h-4 w-4" />, href: `/${locale}/dashboard`, category: "Pages" },
    { id: "leaderboard", label: t("leaderboard"), description: "XP rankings", icon: <Trophy className="h-4 w-4" />, href: `/${locale}/leaderboard`, category: "Pages" },
    { id: "settings", label: t("settings"), description: "Preferences", icon: <Settings className="h-4 w-4" />, href: `/${locale}/settings`, category: "Pages" },
    { id: "solana-101", label: "Solana 101", description: "Introduction to Solana development", icon: <BookOpen className="h-4 w-4" />, href: `/${locale}/courses/solana-101`, category: "Courses" },
    { id: "anchor-fundamentals", label: "Anchor Fundamentals", description: "Build Solana programs with Anchor", icon: <BookOpen className="h-4 w-4" />, href: `/${locale}/courses/anchor-fundamentals`, category: "Courses" },
    { id: "token-2022", label: "Token-2022 Deep Dive", description: "Advanced token extensions", icon: <BookOpen className="h-4 w-4" />, href: `/${locale}/courses/token-2022-deep-dive`, category: "Courses" },
    { id: "defi-basics", label: "DeFi Basics", description: "Decentralized finance fundamentals", icon: <BookOpen className="h-4 w-4" />, href: `/${locale}/courses/defi-basics`, category: "Courses" },
    { id: "nft-masterclass", label: "NFT Masterclass", description: "Build NFT collections on Solana", icon: <BookOpen className="h-4 w-4" />, href: `/${locale}/courses/nft-masterclass`, category: "Courses" },
  ];

  const filtered = query
    ? allItems.filter(
        (item) =>
          item.label.toLowerCase().includes(query.toLowerCase()) ||
          item.description.toLowerCase().includes(query.toLowerCase())
      )
    : allItems;

  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(!searchOpen);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [searchOpen, setSearchOpen]);

  const handleSelect = useCallback(
    (item: SearchItem) => {
      setSearchOpen(false);
      setQuery("");
      router.push(item.href);
    },
    [router, setSearchOpen]
  );

  // Arrow key navigation
  useEffect(() => {
    if (!searchOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && filtered[selectedIndex]) {
        handleSelect(filtered[selectedIndex]);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [searchOpen, filtered, selectedIndex, handleSelect]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  return (
    <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
      <DialogContent className="sm:max-w-lg p-0 gap-0">
        <div className="flex items-center border-b border-border px-3">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`${t("search")}...`}
            className="border-0 focus-visible:ring-0 shadow-none"
            autoFocus
          />
        </div>
        <div className="max-h-[300px] overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-6">
              No results found.
            </p>
          ) : (
            <>
              {["Pages", "Courses"].map((category) => {
                const items = filtered.filter((i) => i.category === category);
                if (items.length === 0) return null;
                return (
                  <div key={category}>
                    <p className="text-xs text-muted-foreground px-2 py-1.5 font-medium">
                      {category}
                    </p>
                    {items.map((item) => {
                      const globalIdx = filtered.indexOf(item);
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleSelect(item)}
                          className={cn(
                            "flex items-center gap-3 w-full px-2 py-2 rounded-md text-sm transition-colors",
                            globalIdx === selectedIndex
                              ? "bg-accent"
                              : "hover:bg-accent/50"
                          )}
                        >
                          <span className="text-muted-foreground">{item.icon}</span>
                          <div className="flex-1 text-left">
                            <p className="font-medium">{item.label}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.description}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
