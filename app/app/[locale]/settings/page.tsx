'use client';

import { useState, useEffect } from 'react';
import {
  Globe,
  Moon,
  Sun,
  Monitor,
  Bell,
  ShieldCheck,
  CheckCircle,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ---------- types ----------

type Language = 'pt-BR' | 'en' | 'es';
type Theme    = 'dark' | 'light' | 'system';

interface ToggleSetting {
  key: string;
  label: string;
  description: string;
}

const LANGUAGES: { value: Language; label: string; flag: string; region: string }[] = [
  { value: 'pt-BR', label: 'Português',   flag: '🇧🇷', region: 'Brasil'      },
  { value: 'en',    label: 'English',     flag: '🇺🇸', region: 'United States' },
  { value: 'es',    label: 'Español',     flag: '🇪🇸', region: 'España'      },
];

const THEMES: { value: Theme; label: string; icon: typeof Moon; desc: string }[] = [
  { value: 'dark',   label: 'Escuro',  icon: Moon,    desc: 'Fundo preto, ideal para noite'   },
  { value: 'light',  label: 'Claro',   icon: Sun,     desc: 'Fundo branco, ideal para dia'    },
  { value: 'system', label: 'Sistema', icon: Monitor, desc: 'Segue a preferência do sistema'  },
];

const NOTIFICATION_TOGGLES: ToggleSetting[] = [
  {
    key: 'newCourses',
    label: 'Novos cursos',
    description: 'Notifique quando novos cursos forem lançados',
  },
  {
    key: 'achievements',
    label: 'Conquistas desbloqueadas',
    description: 'Notifique quando você desbloquear uma conquista',
  },
];

const PRIVACY_TOGGLES: ToggleSetting[] = [
  {
    key: 'publicProfile',
    label: 'Perfil público',
    description: 'Outros usuários podem ver seu perfil e progresso',
  },
  {
    key: 'showXpRanking',
    label: 'Mostrar XP no ranking',
    description: 'Seu XP aparece na tabela de classificação',
  },
];

// ---------- sub-components ----------

function SectionHeading({
  icon: Icon,
  title,
  color,
}: {
  icon: typeof Globe;
  title: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon className={cn('h-5 w-5', color)} />
      <h2 className="text-base font-bold text-white">{title}</h2>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  id,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  id: string;
}) {
  return (
    <button
      id={id}
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2 focus:ring-offset-gray-900',
        checked ? 'bg-purple-600' : 'bg-gray-700'
      )}
    >
      <span
        className={cn(
          'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-md transform transition-transform duration-200',
          checked ? 'translate-x-5' : 'translate-x-0'
        )}
      />
    </button>
  );
}

// ---------- page ----------

export default function SettingsPage() {
  const [language,  setLanguage]  = useState<Language>('pt-BR');
  const [theme,     setTheme]     = useState<Theme>('dark');

  const [notifications, setNotifications] = useState<Record<string, boolean>>({
    newCourses:   true,
    achievements: true,
  });

  const [privacy, setPrivacy] = useState<Record<string, boolean>>({
    publicProfile: true,
    showXpRanking: true,
  });

  const [toast, setToast] = useState(false);

  // Auto-hide toast
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(false), 3000);
    return () => clearTimeout(id);
  }, [toast]);

  function handleSave() {
    // Simulate save
    setToast(true);
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/60 py-10 px-4">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-3xl font-extrabold text-white mb-1">Configurações</h1>
          <p className="text-gray-400 text-sm">Personalize sua experiência na Superteam Academy</p>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-8 space-y-8">

        {/* Idioma */}
        <section className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6">
          <SectionHeading icon={Globe} title="Idioma" color="text-blue-400" />
          <div className="space-y-2">
            {LANGUAGES.map((lang) => {
              const selected = language === lang.value;
              return (
                <label
                  key={lang.value}
                  className={cn(
                    'flex cursor-pointer items-center gap-4 rounded-xl border px-4 py-3.5 transition-all',
                    selected
                      ? 'border-purple-600/60 bg-purple-900/20 ring-1 ring-purple-600/30'
                      : 'border-gray-800 hover:border-gray-700 hover:bg-gray-800/40'
                  )}
                >
                  <input
                    type="radio"
                    name="language"
                    value={lang.value}
                    checked={selected}
                    onChange={() => setLanguage(lang.value)}
                    className="sr-only"
                  />
                  <span className="text-2xl" aria-hidden="true">{lang.flag}</span>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-white">{lang.label}</div>
                    <div className="text-xs text-gray-500">{lang.region}</div>
                  </div>
                  {selected && (
                    <CheckCircle className="h-5 w-5 text-purple-400 shrink-0" />
                  )}
                </label>
              );
            })}
          </div>
        </section>

        {/* Tema */}
        <section className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6">
          <SectionHeading icon={Sun} title="Tema" color="text-yellow-400" />
          <div className="space-y-2">
            {THEMES.map(({ value, label, icon: Icon, desc }) => {
              const selected = theme === value;
              return (
                <label
                  key={value}
                  className={cn(
                    'flex cursor-pointer items-center gap-4 rounded-xl border px-4 py-3.5 transition-all',
                    selected
                      ? 'border-purple-600/60 bg-purple-900/20 ring-1 ring-purple-600/30'
                      : 'border-gray-800 hover:border-gray-700 hover:bg-gray-800/40'
                  )}
                >
                  <input
                    type="radio"
                    name="theme"
                    value={value}
                    checked={selected}
                    onChange={() => setTheme(value)}
                    className="sr-only"
                  />
                  <div
                    className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border',
                      selected
                        ? 'border-purple-600/40 bg-purple-900/30 text-purple-400'
                        : 'border-gray-700 bg-gray-800 text-gray-500'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-white">{label}</div>
                    <div className="text-xs text-gray-500">{desc}</div>
                  </div>
                  {selected && (
                    <CheckCircle className="h-5 w-5 text-purple-400 shrink-0" />
                  )}
                </label>
              );
            })}
          </div>
        </section>

        {/* Notificações */}
        <section className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6">
          <SectionHeading icon={Bell} title="Notificações" color="text-orange-400" />
          <div className="space-y-1 divide-y divide-gray-800/60">
            {NOTIFICATION_TOGGLES.map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
              >
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-200">{item.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{item.description}</div>
                </div>
                <Toggle
                  id={`notif-${item.key}`}
                  checked={notifications[item.key] ?? false}
                  onChange={(v) =>
                    setNotifications((prev) => ({ ...prev, [item.key]: v }))
                  }
                />
              </div>
            ))}
          </div>
        </section>

        {/* Privacidade */}
        <section className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6">
          <SectionHeading icon={ShieldCheck} title="Privacidade" color="text-green-400" />
          <div className="space-y-1 divide-y divide-gray-800/60">
            {PRIVACY_TOGGLES.map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
              >
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-200">{item.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{item.description}</div>
                </div>
                <Toggle
                  id={`privacy-${item.key}`}
                  checked={privacy[item.key] ?? false}
                  onChange={(v) =>
                    setPrivacy((prev) => ({ ...prev, [item.key]: v }))
                  }
                />
              </div>
            ))}
          </div>
        </section>

        {/* Save button */}
        <div className="flex items-center justify-between gap-4 pt-2">
          <p className="text-xs text-gray-600">
            As configurações são salvas localmente neste dispositivo
          </p>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 rounded-xl bg-purple-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-purple-500 active:scale-95 transition-all shadow-lg shadow-purple-900/40"
          >
            <CheckCircle className="h-4 w-4" />
            Salvar
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Success toast */}
      <div
        className={cn(
          'fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border border-green-700/50 bg-gray-900 px-5 py-3.5 shadow-xl transition-all duration-300',
          toast ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        )}
        role="status"
        aria-live="polite"
      >
        <CheckCircle className="h-5 w-5 text-green-400 shrink-0" />
        <div>
          <div className="text-sm font-semibold text-white">Configurações salvas!</div>
          <div className="text-xs text-gray-400">Suas preferências foram atualizadas.</div>
        </div>
      </div>
    </div>
  );
}
