import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCourse } from '@/hooks/useCourse';
import { getLevel } from '@/lib/xp';
import { BookOpen, Zap, User, LogOut, Menu, X, Code2, Globe, ChevronDown } from 'lucide-react';

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'pt', label: 'Português', flag: '🇧🇷' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
];

export function Navbar() {
  const { user, logout } = useAuth();
  const { progress } = useCourse();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState(LANGUAGES[0]);

  const levelInfo = getLevel(progress.xp);
  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  const navLinks = [
    { href: '/courses', label: 'Courses', icon: BookOpen },
    { href: '/dashboard', label: 'Dashboard', icon: Zap },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-card-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-solana shadow-purple group-hover:scale-110 transition-transform">
              <Code2 className="h-4 w-4 text-background" />
            </div>
            <span className="font-bold text-lg tracking-tight">
              <span className="gradient-text">Superteam</span>
              <span className="text-foreground"> Academy</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <Link
                key={link.href}
                to={link.href}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive(link.href)
                    ? 'bg-primary/15 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Language selector */}
            <div className="relative hidden sm:block">
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
              >
                <Globe className="h-4 w-4" />
                <span>{selectedLang.flag}</span>
                <ChevronDown className="h-3 w-3" />
              </button>
              {langOpen && (
                <div className="absolute right-0 top-10 w-44 rounded-xl border border-card-border bg-card shadow-card overflow-hidden z-50">
                  {LANGUAGES.map(lang => (
                    <button
                      key={lang.code}
                      onClick={() => { setSelectedLang(lang); setLangOpen(false); }}
                      className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-muted/50 transition-colors ${
                        selectedLang.code === lang.code ? 'text-primary' : 'text-muted-foreground'
                      }`}
                    >
                      <span>{lang.flag}</span>
                      <span>{lang.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {user ? (
              <>
                {/* XP Badge */}
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg xp-badge text-sm font-semibold">
                  <Zap className="h-3.5 w-3.5" />
                  <span>{progress.xp.toLocaleString()} XP</span>
                </div>

                {/* User menu */}
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 rounded-lg border border-card-border bg-card px-3 py-1.5 hover:border-primary/40 transition-all"
                  >
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="h-6 w-6 rounded-full"
                      onError={(e) => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/identicon/svg?seed=${user.id}`; }}
                    />
                    <span className="text-sm font-medium text-foreground hidden sm:block max-w-[100px] truncate">{user.name}</span>
                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 top-11 w-56 rounded-xl border border-card-border bg-card shadow-card overflow-hidden z-50">
                      <div className="px-4 py-3 border-b border-card-border">
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{levelInfo.title} • Lv. {levelInfo.level}</p>
                      </div>
                      <Link
                        to="/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                      >
                        <User className="h-4 w-4" />
                        Profile
                      </Link>
                      <button
                        onClick={() => { logout(); setUserMenuOpen(false); navigate('/'); }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Link
                to="/login"
                className="btn-solana px-4 py-2 rounded-lg text-sm font-semibold"
              >
                Get Started
              </Link>
            )}

            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-muted/50 text-muted-foreground"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-card-border py-3 space-y-1">
            {navLinks.map(link => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? 'bg-primary/15 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                }`}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            ))}
            {user && (
              <div className="flex items-center gap-1.5 px-4 py-2.5 xp-badge rounded-lg text-sm font-semibold w-fit mx-4">
                <Zap className="h-3.5 w-3.5" />
                <span>{progress.xp.toLocaleString()} XP</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Click outside to close dropdowns */}
      {(langOpen || userMenuOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => { setLangOpen(false); setUserMenuOpen(false); }}
        />
      )}
    </nav>
  );
}
