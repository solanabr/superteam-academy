"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  BarChart2,
  MessageSquare,
  Trophy,
  LogOut,
  Menu,
  X,
  ShieldCheck,
} from "lucide-react";

import { fetchWithAuth } from "@/lib/api";

const NAV = [
  { href: "/osadmin/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/osadmin/admin/users", label: "Users", icon: Users },
  { href: "/osadmin/admin/courses", label: "Courses", icon: BookOpen },
  { href: "/osadmin/admin/analytics", label: "Analytics", icon: BarChart2 },
  { href: "/osadmin/admin/community", label: "Community", icon: MessageSquare },
  { href: "/osadmin/admin/achievements", label: "Achievements", icon: Trophy },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminName, setAdminName] = useState("Admin");

  useEffect(() => {
    async function verifyAccess() {
      try {
        const raw = localStorage.getItem("osmos_user");
        if (!raw) {
          router.replace("/");
          return;
        }

        const user = JSON.parse(raw);

        // If role is missing or not admin, try to verify with backend
        if (user && user.role !== "admin") {
          try {
            // Attempt an admin-only call to check real role
            const res = await fetchWithAuth<{ success: boolean }>("/admin/analytics/overview");
            if (res.success) {
              // User is an admin but role was missing/wrong in localStorage
              const updatedUser = { ...user, role: "admin" };
              localStorage.setItem("osmos_user", JSON.stringify(updatedUser));
              setAdminName(updatedUser.name || updatedUser.username || "Admin");
              setReady(true);
              return;
            }
          } catch (err) {
            // Forbidden or error — not an admin
            router.replace("/");
            return;
          }
        }

        if (user?.role !== "admin") {
          router.replace("/");
          return;
        }

        setAdminName(user.name || user.username || "Admin");
        setReady(true);
      } catch {
        router.replace("/");
      }
    }

    verifyAccess();
  }, [router]);

  if (!ready) {
    return (
      <div className="admin-loading">
        <ShieldCheck size={32} className="admin-loading-icon" />
        <span>Verifying admin access…</span>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <style>{`
        :root {
          --admin-bg: #0a0a0f;
          --admin-sidebar: #0f0f1a;
          --admin-sidebar-border: rgba(99,102,241,0.15);
          --admin-surface: #13131f;
          --admin-surface2: #1a1a2e;
          --admin-accent: #6366f1;
          --admin-accent2: #8b5cf6;
          --admin-text: #e2e8f0;
          --admin-muted: #94a3b8;
          --admin-border: rgba(255,255,255,0.07);
          --admin-danger: #ef4444;
          --admin-success: #22c55e;
          --admin-warning: #f59e0b;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: var(--admin-bg); color: var(--admin-text); font-family: 'Inter', system-ui, sans-serif; }

        .admin-loading {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          gap: 12px;
          background: var(--admin-bg);
          color: var(--admin-muted);
          font-size: 14px;
        }
        .admin-loading-icon { color: var(--admin-accent); animation: spin 1.5s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .admin-shell { display: flex; min-height: 100vh; background: var(--admin-bg); }

        /* ── Sidebar ── */
        .admin-sidebar {
          width: 240px;
          min-height: 100vh;
          background: var(--admin-sidebar);
          border-right: 1px solid var(--admin-sidebar-border);
          display: flex;
          flex-direction: column;
          position: fixed;
          top: 0; left: 0; bottom: 0;
          z-index: 50;
          transition: transform 0.25s ease;
        }
        .admin-sidebar.closed { transform: translateX(-100%); }
        .admin-sidebar-logo {
          padding: 20px 20px 16px;
          border-bottom: 1px solid var(--admin-border);
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .admin-logo-badge {
          width: 32px; height: 32px; border-radius: 8px;
          background: linear-gradient(135deg, var(--admin-accent), var(--admin-accent2));
          display: flex; align-items: center; justify-content: center;
          font-weight: 700; font-size: 14px; color: #fff;
          flex-shrink: 0;
        }
        .admin-logo-text { font-size: 15px; font-weight: 700; color: var(--admin-text); }
        .admin-logo-sub { font-size: 10px; color: var(--admin-accent); font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; }

        .admin-nav { flex: 1; padding: 16px 12px; display: flex; flex-direction: column; gap: 2px; }
        .admin-nav-link {
          display: flex; align-items: center; gap: 10px;
          padding: 9px 12px;
          border-radius: 8px;
          color: var(--admin-muted);
          text-decoration: none;
          font-size: 13.5px; font-weight: 500;
          transition: all 0.15s;
        }
        .admin-nav-link:hover { background: rgba(99,102,241,0.1); color: var(--admin-text); }
        .admin-nav-link.active { background: rgba(99,102,241,0.18); color: var(--admin-accent); }
        .admin-nav-link svg { flex-shrink: 0; }

        .admin-sidebar-footer {
          padding: 16px 12px;
          border-top: 1px solid var(--admin-border);
        }
        .admin-user-badge {
          display: flex; align-items: center; gap: 10px;
          padding: 8px 10px;
          border-radius: 8px;
          background: var(--admin-surface2);
          margin-bottom: 8px;
        }
        .admin-user-avatar {
          width: 28px; height: 28px; border-radius: 50%;
          background: linear-gradient(135deg, var(--admin-accent), var(--admin-accent2));
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 700; color: #fff; flex-shrink: 0;
        }
        .admin-user-name { font-size: 12.5px; font-weight: 600; color: var(--admin-text); }
        .admin-user-role { font-size: 10px; color: var(--admin-accent); font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; }
        .admin-logout-btn {
          width: 100%; display: flex; align-items: center; gap: 8px;
          padding: 8px 12px; border-radius: 8px;
          background: transparent; border: none; cursor: pointer;
          color: var(--admin-muted); font-size: 13px; font-weight: 500;
          transition: all 0.15s;
        }
        .admin-logout-btn:hover { background: rgba(239,68,68,0.1); color: var(--admin-danger); }

        /* ── Main ── */
        .admin-main { flex: 1; min-height: 100vh; margin-left: 240px; display: flex; flex-direction: column; }
        .admin-topbar {
          height: 56px; display: flex; align-items: center; gap: 12px;
          padding: 0 24px;
          border-bottom: 1px solid var(--admin-border);
          background: var(--admin-sidebar);
          position: sticky; top: 0; z-index: 40;
        }
        .admin-menu-btn {
          display: none; background: none; border: none; cursor: pointer;
          color: var(--admin-muted); padding: 6px;
        }
        .admin-topbar-title { font-size: 14px; color: var(--admin-muted); font-weight: 500; }
        .admin-topbar-title span { color: var(--admin-text); font-weight: 600; }
        .admin-overlay {
          display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.6);
          z-index: 49; backdrop-filter: blur(2px);
        }
        .admin-content { flex: 1; padding: 28px 28px; }

        @media (max-width: 768px) {
          .admin-sidebar { transform: translateX(-100%); }
          .admin-sidebar.open { transform: translateX(0); }
          .admin-main { margin-left: 0; }
          .admin-menu-btn { display: flex; }
          .admin-overlay { display: block; }
          .admin-content { padding: 16px; }
        }

        /* ── Shared card/table styles used across pages ── */
        .acard {
          background: var(--admin-surface);
          border: 1px solid var(--admin-border);
          border-radius: 12px;
          padding: 20px;
        }
        .acard-sm { padding: 16px; }
        .astat {
          background: var(--admin-surface);
          border: 1px solid var(--admin-border);
          border-radius: 12px;
          padding: 20px 22px;
          display: flex; flex-direction: column; gap: 6px;
        }
        .astat-label { font-size: 11.5px; color: var(--admin-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; }
        .astat-value { font-size: 28px; font-weight: 700; color: var(--admin-text); line-height: 1; }
        .astat-sub { font-size: 12px; color: var(--admin-muted); }
        .astat-icon {
          width: 36px; height: 36px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 8px;
        }
        .page-header { margin-bottom: 24px; }
        .page-title { font-size: 22px; font-weight: 700; color: var(--admin-text); }
        .page-sub { font-size: 13px; color: var(--admin-muted); margin-top: 4px; }
        .grid-stats { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; margin-bottom: 24px; }
        .grid-4 { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; }

        /* Table */
        .atable-wrap { overflow-x: auto; }
        .atable { width: 100%; border-collapse: collapse; font-size: 13px; }
        .atable th {
          text-align: left; padding: 10px 14px;
          font-size: 11px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase;
          color: var(--admin-muted);
          border-bottom: 1px solid var(--admin-border);
        }
        .atable td { padding: 11px 14px; border-bottom: 1px solid var(--admin-border); vertical-align: middle; color: var(--admin-text); }
        .atable tr:last-child td { border-bottom: none; }
        .atable tr:hover td { background: rgba(255,255,255,0.02); }

        /* Badges */
        .abadge {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 600;
        }
        .abadge-green { background: rgba(34,197,94,0.12); color: #22c55e; }
        .abadge-yellow { background: rgba(245,158,11,0.12); color: #f59e0b; }
        .abadge-gray { background: rgba(148,163,184,0.12); color: var(--admin-muted); }
        .abadge-purple { background: rgba(99,102,241,0.12); color: var(--admin-accent); }
        .abadge-red { background: rgba(239,68,68,0.12); color: var(--admin-danger); }
        .abadge-blue { background: rgba(59,130,246,0.12); color: #60a5fa; }

        /* Buttons */
        .abtn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 7px 14px; border-radius: 8px; font-size: 13px; font-weight: 600;
          cursor: pointer; border: none; transition: all 0.15s; text-decoration: none;
          white-space: nowrap;
        }
        .abtn-primary { background: var(--admin-accent); color: #fff; }
        .abtn-primary:hover { background: rgba(99,102,241,0.85); }
        .abtn-outline {
          background: transparent; color: var(--admin-muted);
          border: 1px solid var(--admin-border);
        }
        .abtn-outline:hover { background: var(--admin-surface2); color: var(--admin-text); border-color: rgba(99,102,241,0.3); }
        .abtn-danger { background: rgba(239,68,68,0.12); color: var(--admin-danger); }
        .abtn-danger:hover { background: rgba(239,68,68,0.22); }
        .abtn-success { background: rgba(34,197,94,0.12); color: var(--admin-success); }
        .abtn-success:hover { background: rgba(34,197,94,0.22); }
        .abtn-sm { padding: 4px 10px; font-size: 11.5px; border-radius: 6px; }

        /* Form inputs */
        .ainput {
          width: 100%; padding: 8px 12px; border-radius: 8px; font-size: 13.5px;
          background: var(--admin-surface2); border: 1px solid var(--admin-border);
          color: var(--admin-text); outline: none; transition: border-color 0.15s;
        }
        .ainput:focus { border-color: var(--admin-accent); }
        .ainput::placeholder { color: var(--admin-muted); }
        .aselect {
          padding: 7px 12px; border-radius: 8px; font-size: 13px;
          background: var(--admin-surface2); border: 1px solid var(--admin-border);
          color: var(--admin-text); outline: none; cursor: pointer;
        }
        .aselect:focus { border-color: var(--admin-accent); }
        .aform-row { display: flex; gap: 12px; flex-wrap: wrap; }
        .aform-group { display: flex; flex-direction: column; gap: 6px; flex: 1; min-width: 160px; }
        .aform-label { font-size: 11.5px; color: var(--admin-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
        .atextarea {
          width: 100%; padding: 10px 12px; border-radius: 8px; font-size: 13.5px;
          background: var(--admin-surface2); border: 1px solid var(--admin-border);
          color: var(--admin-text); outline: none; resize: vertical; min-height: 80px;
          transition: border-color 0.15s;
        }
        .atextarea:focus { border-color: var(--admin-accent); }

        /* Pagination */
        .apagination { display: flex; align-items: center; gap: 8px; justify-content: flex-end; padding-top: 16px; }
        .apagination-info { font-size: 12px; color: var(--admin-muted); margin-right: auto; }

        /* Modal overlay */
        .amodal-backdrop {
          position: fixed; inset: 0; background: rgba(0,0,0,0.7);
          z-index: 100; display: flex; align-items: center; justify-content: center;
          padding: 16px; backdrop-filter: blur(4px);
        }
        .amodal {
          background: var(--admin-surface); border: 1px solid var(--admin-border);
          border-radius: 16px; padding: 28px; width: 100%; max-width: 480px;
          display: flex; flex-direction: column; gap: 16px;
        }
        .amodal-title { font-size: 17px; font-weight: 700; color: var(--admin-text); }
        .amodal-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 4px; }

        /* Alert */
        .aalert {
          padding: 12px 16px; border-radius: 8px; font-size: 13px;
          display: flex; align-items: center; gap: 10px;
        }
        .aalert-error { background: rgba(239,68,68,0.1); color: #fc8181; border: 1px solid rgba(239,68,68,0.2); }
        .aalert-success { background: rgba(34,197,94,0.1); color: #6ee7b7; border: 1px solid rgba(34,197,94,0.2); }

        /* Toggle switch */
        .atoggle {
          position: relative; display: inline-block; width: 36px; height: 20px;
        }
        .atoggle input { opacity: 0; width: 0; height: 0; }
        .atoggle-slider {
          position: absolute; cursor: pointer; inset: 0;
          background: var(--admin-surface2); border-radius: 999px;
          border: 1px solid var(--admin-border);
          transition: background 0.2s;
        }
        .atoggle-slider::before {
          content: ""; position: absolute;
          width: 14px; height: 14px; border-radius: 50%;
          background: var(--admin-muted);
          left: 2px; top: 2px;
          transition: left 0.2s, background 0.2s;
        }
        .atoggle input:checked + .atoggle-slider { background: rgba(99,102,241,0.2); border-color: var(--admin-accent); }
        .atoggle input:checked + .atoggle-slider::before { left: 18px; background: var(--admin-accent); }

        /* Spinner */
        .aspinner {
          width: 16px; height: 16px; border: 2px solid var(--admin-border);
          border-top-color: var(--admin-accent); border-radius: 50%;
          animation: spin 0.7s linear infinite; display: inline-block;
        }

        /* Empty state */
        .aempty { text-align: center; padding: 48px 16px; color: var(--admin-muted); }
        .aempty-icon { font-size: 40px; margin-bottom: 10px; }
      `}</style>

      {/* Sidebar */}
      <aside className={`admin-sidebar${sidebarOpen ? " open" : ""}`}>
        <div className="admin-sidebar-logo">
          <div className="admin-logo-badge">O</div>
          <div>
            <div className="admin-logo-text">Osmos</div>
            <div className="admin-logo-sub">Admin Panel</div>
          </div>
        </div>

        <nav className="admin-nav">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname.includes(href);
            return (
              <Link
                key={href}
                href={href}
                className={`admin-nav-link${active ? " active" : ""}`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon size={16} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-user-badge">
            <div className="admin-user-avatar">{adminName[0]?.toUpperCase()}</div>
            <div>
              <div className="admin-user-name">{adminName}</div>
              <div className="admin-user-role">Admin</div>
            </div>
          </div>
          <button
            className="admin-logout-btn"
            onClick={() => {
              localStorage.removeItem("osmos_token");
              localStorage.removeItem("osmos_user");
              window.location.href = "/";
            }}
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="admin-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main area */}
      <main className="admin-main">
        <div className="admin-topbar">
          <button className="admin-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <span className="admin-topbar-title">
            <span>Osmos</span> Admin Dashboard
          </span>
        </div>
        <div className="admin-content">{children}</div>
      </main>
    </div>
  );
}
