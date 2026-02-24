"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Search, ArrowUpDown, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAdmin } from "@/lib/hooks/use-admin";
import { SOLANA_EXPLORER_URL } from "@/lib/constants";
import type { AdminUser } from "@/app/api/admin/users/route";

type SortKey = "xp" | "level" | "wallet";
type SortDir = "asc" | "desc";

function truncateWallet(wallet: string): string {
  if (wallet.length <= 12) return wallet;
  return `${wallet.slice(0, 4)}...${wallet.slice(-4)}`;
}

export function UserTable() {
  const { isAdmin } = useAdmin();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("xp");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const fetchUsers = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const data: AdminUser[] = await res.json();
      setUsers(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to fetch";
      setError(msg);
    }
    setLoading(false);
  }, [isAdmin]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const filtered = users
    .filter(
      (u) =>
        !searchQuery ||
        u.wallet.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    .sort((a, b) => {
      const mul = sortDir === "asc" ? 1 : -1;
      if (sortKey === "wallet") return a.wallet.localeCompare(b.wallet) * mul;
      return (a[sortKey] - b[sortKey]) * mul;
    });

  const explorerUrl = (wallet: string) =>
    SOLANA_EXPLORER_URL.replace("%s", wallet);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 flex-1 max-w-xs">
          <Search className="h-4 w-4 text-[var(--c-text-2)]" />
          <Input
            placeholder="Search by wallet..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 text-xs"
          />
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={fetchUsers}
          disabled={loading}
          className="gap-1.5"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
          />
        </Button>
      </div>

      {error && (
        <div className="rounded-[2px] border border-[#EF4444]/20 bg-[#EF4444]/5 px-4 py-3 mb-4">
          <p className="text-xs text-[#EF4444]">{error}</p>
        </div>
      )}

      <div className="border border-[var(--c-border-subtle)] rounded-[2px] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--c-bg-elevated)] text-[var(--c-text-2)] text-xs uppercase tracking-wider">
              <th className="px-4 py-2.5 text-left font-medium">#</th>
              <th className="px-4 py-2.5 text-left font-medium">
                <button
                  onClick={() => toggleSort("wallet")}
                  className="inline-flex items-center gap-1 hover:text-[var(--c-text)] transition-colors"
                >
                  Wallet
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th className="px-4 py-2.5 text-center font-medium">
                <button
                  onClick={() => toggleSort("xp")}
                  className="inline-flex items-center gap-1 hover:text-[var(--c-text)] transition-colors"
                >
                  XP
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th className="px-4 py-2.5 text-center font-medium">
                <button
                  onClick={() => toggleSort("level")}
                  className="inline-flex items-center gap-1 hover:text-[var(--c-text)] transition-colors"
                >
                  Level
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th className="px-4 py-2.5 text-right font-medium">Explorer</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--c-border-subtle)]">
            {loading && users.length === 0 ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={5} className="px-4 py-3">
                    <div className="h-4 rounded bg-[var(--c-border-subtle)] animate-pulse" />
                  </td>
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-sm text-[var(--c-text-2)]"
                >
                  {searchQuery
                    ? "No users match your search"
                    : "No XP holders found"}
                </td>
              </tr>
            ) : (
              filtered.map((user, idx) => (
                <tr
                  key={user.wallet}
                  className="hover:bg-[var(--c-bg-elevated)]/50 transition-colors"
                >
                  <td className="px-4 py-3 font-mono text-xs text-[var(--c-text-2)]">
                    {idx + 1}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-[var(--c-text)]">
                      {truncateWallet(user.wallet)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center font-mono text-[#00FFA3]">
                    {user.xp.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-center font-mono text-[var(--c-text)]">
                    {user.level}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <a
                      href={explorerUrl(user.wallet)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-[var(--c-text-2)] hover:text-[#00FFA3] transition-colors"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-3">
        <p className="text-xs text-[var(--c-text-2)]">
          {filtered.length} of {users.length} users
        </p>
      </div>
    </div>
  );
}
