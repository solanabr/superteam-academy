'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useTheme } from 'next-themes';
import { useWallet } from '@solana/wallet-adapter-react';
import {
  Settings, Globe, Moon, Sun, Monitor, Bell, Shield,
  LogOut, Download, Save, CheckCircle, User
} from 'lucide-react';
import { clsx } from 'clsx';

const cn = (...args: Parameters<typeof clsx>) => clsx(args);

type Section = 'profile' | 'language' | 'theme' | 'notifications' | 'privacy' | 'account';

const LANGUAGES = [
  { code: 'pt-BR', label: 'Português (Brasil)', flag: '🇧🇷' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
];

const NAV_ITEMS: { id: Section; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'profile', label: 'Perfil', icon: User },
  { id: 'language', label: 'Idioma', icon: Globe },
  { id: 'theme', label: 'Tema', icon: Moon },
  { id: 'notifications', label: 'Notificações', icon: Bell },
  { id: 'privacy', label: 'Privacidade', icon: Shield },
  { id: 'account', label: 'Conta', icon: LogOut },
];

function Toggle({
  checked, onChange, label, desc
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  desc?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3.5 border-b border-gray-800 last:border-0">
      <div>
        <div className="text-sm font-medium text-gray-200">{label}</div>
        {desc && <div className="text-xs text-gray-500 mt-0.5">{desc}</div>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-all',
          checked ? 'bg-purple-600' : 'bg-gray-700'
        )}
      >
        <span
          className={cn(
            'inline-block h-4 w-4 rounded-full bg-white shadow transition-transform',
            checked ? 'translate-x-6' : 'translate-x-1'
          )}
        />
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params.locale as string) || 'pt-BR';
  const { setTheme, theme } = useTheme();
  const { disconnect, connected } = useWallet();

  const [activeSection, setActiveSection] = useState<Section>('profile');
  const [saved, setSaved] = useState(false);

  // Profile state
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');

  // Language
  const [selectedLang, setSelectedLang] = useState(locale);

  // Notifications
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [browserNotifs, setBrowserNotifs] = useState(false);
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  const [streakReminder, setStreakReminder] = useState(true);

  // Privacy
  const [publicProfile, setPublicProfile] = useState(true);
  const [showXP, setShowXP] = useState(true);
  const [showAchievements, setShowAchievements] = useState(true);
  const [showCourses, setShowCourses] = useState(true);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleDisconnect = () => {
    if (connected) disconnect();
    router.push(`/${locale}`);
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'profile':
        return (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-white mb-1">Perfil Público</h2>
              <p className="text-sm text-gray-400">Informações opcionais que aparecem no seu perfil</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Nome de Exibição <span className="text-gray-600">(opcional)</span>
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Ex: João Silva"
                maxLength={40}
                className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 transition-all"
              />
              <p className="mt-1 text-xs text-gray-600">{displayName.length}/40 caracteres</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Bio <span className="text-gray-600">(opcional)</span>
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Conte um pouco sobre você e seus interesses em Web3..."
                maxLength={200}
                rows={3}
                className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 transition-all resize-none"
              />
              <p className="mt-1 text-xs text-gray-600">{bio.length}/200 caracteres</p>
            </div>
          </div>
        );

      case 'language':
        return (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-white mb-1">Idioma da Interface</h2>
              <p className="text-sm text-gray-400">Escolha o idioma preferido para a plataforma</p>
            </div>
            <div className="space-y-2">
              {LANGUAGES.map(({ code, label, flag }) => (
                <button
                  key={code}
                  onClick={() => setSelectedLang(code)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-all',
                    selectedLang === code
                      ? 'border-purple-600 bg-purple-900/20 text-white'
                      : 'border-gray-700 bg-gray-800/40 text-gray-300 hover:border-gray-600'
                  )}
                >
                  <span className="text-2xl">{flag}</span>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{label}</div>
                    <div className="text-xs text-gray-500">{code}</div>
                  </div>
                  {selectedLang === code && (
                    <CheckCircle className="h-5 w-5 text-purple-400" />
                  )}
                </button>
              ))}
            </div>
            {selectedLang !== locale && (
              <div className="rounded-xl border border-blue-800/50 bg-blue-900/10 p-3 text-xs text-blue-300">
                Salve para aplicar o idioma. A página será recarregada.
              </div>
            )}
          </div>
        );

      case 'theme':
        return (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-white mb-1">Tema Visual</h2>
              <p className="text-sm text-gray-400">Escolha como a interface aparece para você</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'dark', label: 'Escuro', icon: Moon, preview: 'bg-gray-900 border-gray-700' },
                { value: 'light', label: 'Claro', icon: Sun, preview: 'bg-gray-100 border-gray-300' },
                { value: 'system', label: 'Sistema', icon: Monitor, preview: 'bg-gradient-to-br from-gray-900 to-gray-100 border-gray-500' },
              ].map(({ value, label, icon: Icon, preview }) => (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  className={cn(
                    'flex flex-col items-center gap-3 rounded-2xl border-2 p-4 transition-all',
                    theme === value
                      ? 'border-purple-600 bg-purple-900/20'
                      : 'border-gray-700 bg-gray-800/40 hover:border-gray-600'
                  )}
                >
                  {/* Preview swatch */}
                  <div className={cn('h-12 w-full rounded-xl border', preview)} />
                  <Icon className={cn('h-5 w-5', theme === value ? 'text-purple-400' : 'text-gray-500')} />
                  <span className={cn('text-sm font-medium', theme === value ? 'text-white' : 'text-gray-400')}>
                    {label}
                  </span>
                  {theme === value && <CheckCircle className="h-4 w-4 text-purple-400" />}
                </button>
              ))}
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-white mb-1">Notificações</h2>
              <p className="text-sm text-gray-400">Configure quando e como receber alertas</p>
            </div>
            <div className="rounded-2xl border border-gray-800 bg-gray-900/40 px-4 divide-y-0">
              <Toggle checked={emailNotifs} onChange={setEmailNotifs} label="Notificações por Email" desc="Receba atualizações sobre novos cursos e conquistas" />
              <Toggle checked={browserNotifs} onChange={setBrowserNotifs} label="Notificações no Navegador" desc="Alertas em tempo real no seu browser" />
              <Toggle checked={weeklyDigest} onChange={setWeeklyDigest} label="Resumo Semanal" desc="Um email com seu progresso da semana" />
              <Toggle checked={streakReminder} onChange={setStreakReminder} label="Lembrete de Sequência" desc="Alerta quando você está prestes a perder sua streak" />
            </div>
          </div>
        );

      case 'privacy':
        return (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-white mb-1">Privacidade</h2>
              <p className="text-sm text-gray-400">Controle o que outros usuários podem ver</p>
            </div>
            <div className="rounded-2xl border border-gray-800 bg-gray-900/40 px-4 divide-y-0">
              <Toggle checked={publicProfile} onChange={setPublicProfile} label="Perfil Público" desc="Seu perfil pode ser visto por outros usuários" />
              <Toggle checked={showXP} onChange={setShowXP} label="Mostrar XP Total" desc="Exibir seu XP no ranking e no perfil público" />
              <Toggle checked={showAchievements} onChange={setShowAchievements} label="Mostrar Conquistas" desc="Exibir suas conquistas desbloqueadas no perfil" />
              <Toggle checked={showCourses} onChange={setShowCourses} label="Mostrar Cursos Concluídos" desc="Listar cursos completados no perfil público" />
            </div>
          </div>
        );

      case 'account':
        return (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-white mb-1">Conta</h2>
              <p className="text-sm text-gray-400">Gerencie sua conta e dados</p>
            </div>

            <div className="rounded-2xl border border-gray-800 bg-gray-900/40 p-5 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-300 mb-1">Exportar Dados</h3>
                <p className="text-xs text-gray-500 mb-3">Baixe todos os seus dados da plataforma em formato JSON.</p>
                <button className="flex items-center gap-2 rounded-xl border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-gray-300 hover:border-gray-600 hover:text-white transition-all">
                  <Download className="h-4 w-4" />
                  Exportar meus dados
                </button>
              </div>

              <div className="border-t border-gray-800 pt-4">
                <h3 className="text-sm font-semibold text-gray-300 mb-1">Desconectar Carteira</h3>
                <p className="text-xs text-gray-500 mb-3">Desconecte sua carteira Solana desta sessão.</p>
                <button
                  onClick={handleDisconnect}
                  className="flex items-center gap-2 rounded-xl border border-red-800/60 bg-red-900/20 px-4 py-2.5 text-sm font-medium text-red-400 hover:bg-red-900/30 hover:border-red-700 transition-all"
                >
                  <LogOut className="h-4 w-4" />
                  Desconectar Carteira
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-gray-800 bg-gray-900/30 p-4 text-xs text-gray-500 leading-relaxed">
              <p className="font-medium text-gray-400 mb-1">Sobre seus dados</p>
              A Superteam Academy não armazena sua chave privada. Seu progresso é vinculado ao endereço público da sua carteira. Credenciais NFT são armazenadas on-chain na Solana.
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 pb-12">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/60 py-8 px-4">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-center gap-3">
            <Settings className="h-6 w-6 text-purple-400" />
            <h1 className="text-2xl font-bold text-white">Configurações</h1>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Nav sidebar */}
          <div className="lg:col-span-1">
            <nav className="space-y-1">
              {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveSection(id)}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all text-left',
                    activeSection === id
                      ? 'bg-purple-900/40 border border-purple-800/50 text-purple-300'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6">
              {renderSection()}

              {activeSection !== 'account' && (
                <div className="mt-6 flex items-center gap-3 pt-4 border-t border-gray-800">
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:from-purple-500 hover:to-indigo-500 transition-all hover:scale-[1.02]"
                  >
                    {saved ? <CheckCircle className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                    {saved ? 'Configurações Salvas!' : 'Salvar Configurações'}
                  </button>
                  {saved && (
                    <span className="text-sm text-green-400 flex items-center gap-1">
                      <CheckCircle className="h-3.5 w-3.5" />
                      Salvo com sucesso
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
