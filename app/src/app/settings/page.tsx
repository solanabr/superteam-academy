'use client';

import { useState } from 'react';
import { useI18n, LanguageSwitcher } from '@/lib/i18n/context';
import { useTheme } from '@/lib/theme/context';
import { Navbar } from '@/components/navbar';

export default function SettingsPage() {
  const { t } = useI18n();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<'profile' | 'account' | 'preferences' | 'privacy'>('profile');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const tabs = [
    { key: 'profile' as const, label: t('settings.profile'), icon: '👤' },
    { key: 'account' as const, label: t('settings.account'), icon: '🔐' },
    { key: 'preferences' as const, label: t('settings.preferences'), icon: '⚙️' },
    { key: 'privacy' as const, label: t('settings.privacy'), icon: '🛡️' },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">{t('settings.title')}</h1>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-gray-800 pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-t-lg text-sm transition-colors ${
                activeTab === tab.key
                  ? 'bg-gray-800 text-white border-b-2 border-purple-500'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <h2 className="text-lg font-semibold mb-4">{t('settings.profile')}</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Nome de Exibição</label>
                  <input type="text" defaultValue="SolDev.sol" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Bio</label>
                  <textarea rows={3} defaultValue="Building on Solana 🚀" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none resize-none" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Avatar URL</label>
                  <input type="text" placeholder="https://..." className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Twitter</label>
                    <input type="text" placeholder="@username" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">GitHub</label>
                    <input type="text" placeholder="username" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Discord</label>
                    <input type="text" placeholder="user#1234" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Account Tab */}
        {activeTab === 'account' && (
          <div className="space-y-6">
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <h2 className="text-lg font-semibold mb-4">{t('settings.connected_accounts')}</h2>
              <div className="space-y-3">
                {[
                  { method: 'Phantom Wallet', icon: '👻', connected: true, detail: '7xKX...m3fR' },
                  { method: 'Google', icon: '🔵', connected: false, detail: '' },
                  { method: 'GitHub', icon: '⚫', connected: false, detail: '' },
                ].map((acc) => (
                  <div key={acc.method} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{acc.icon}</span>
                      <div>
                        <div className="font-medium">{acc.method}</div>
                        {acc.detail && <div className="text-xs text-gray-400 font-mono">{acc.detail}</div>}
                      </div>
                    </div>
                    <button className={`px-4 py-1.5 rounded-lg text-sm ${
                      acc.connected
                        ? 'bg-red-900/50 text-red-400 hover:bg-red-900'
                        : 'bg-purple-600 text-white hover:bg-purple-500'
                    }`}>
                      {acc.connected ? t('nav.disconnect') : 'Conectar'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <h2 className="text-lg font-semibold mb-2">Email</h2>
              <input type="email" placeholder="seu@email.com" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none" />
            </div>
          </div>
        )}

        {/* Preferences Tab */}
        {activeTab === 'preferences' && (
          <div className="space-y-6">
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <h2 className="text-lg font-semibold mb-4">{t('settings.language')}</h2>
              <LanguageSwitcher />
            </div>

            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <h2 className="text-lg font-semibold mb-4">{t('settings.theme')}</h2>
              <div className="flex gap-3">
                {(['dark', 'light', 'system'] as const).map((t_) => (
                  <button
                    key={t_}
                    onClick={() => setTheme(t_)}
                    className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                      theme === t_
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:text-white'
                    }`}
                  >
                    {t_ === 'dark' ? '🌙' : t_ === 'light' ? '☀️' : '💻'} {t(t_ === 'dark' ? 'settings.theme_dark' : t_ === 'light' ? 'settings.theme_light' : 'settings.theme_system')}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <h2 className="text-lg font-semibold mb-4">{t('settings.notifications')}</h2>
              <div className="space-y-3">
                {['Atualizações de cursos', 'Conquistas desbloqueadas', 'Novos cursos disponíveis', 'Lembretes de streak'].map((label) => (
                  <label key={label} className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm">{label}</span>
                    <input type="checkbox" defaultChecked className="w-5 h-5 rounded bg-gray-800 border-gray-700 text-purple-600 focus:ring-purple-500" />
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Privacy Tab */}
        {activeTab === 'privacy' && (
          <div className="space-y-6">
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <h2 className="text-lg font-semibold mb-4">{t('settings.privacy')}</h2>
              <div className="space-y-4">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <div className="font-medium">Perfil Público</div>
                    <div className="text-xs text-gray-400">Outros alunos podem ver seu perfil</div>
                  </div>
                  <input type="checkbox" defaultChecked className="w-5 h-5 rounded bg-gray-800 border-gray-700 text-purple-600" />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <div className="font-medium">Mostrar no Ranking</div>
                    <div className="text-xs text-gray-400">Aparecer no leaderboard público</div>
                  </div>
                  <input type="checkbox" defaultChecked className="w-5 h-5 rounded bg-gray-800 border-gray-700 text-purple-600" />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <div className="font-medium">Mostrar Wallet</div>
                    <div className="text-xs text-gray-400">Exibir endereço da carteira no perfil</div>
                  </div>
                  <input type="checkbox" className="w-5 h-5 rounded bg-gray-800 border-gray-700 text-purple-600" />
                </label>
              </div>
            </div>

            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <h2 className="text-lg font-semibold mb-4">{t('settings.export_data')}</h2>
              <p className="text-sm text-gray-400 mb-4">Baixe todos os seus dados de aprendizado em formato JSON.</p>
              <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors">
                📥 {t('settings.export_data')}
              </button>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSave}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              saved
                ? 'bg-green-600 text-white'
                : 'bg-purple-600 hover:bg-purple-500 text-white'
            }`}
          >
            {saved ? '✓ Salvo!' : t('settings.save')}
          </button>
        </div>
      </main>
    </div>
  );
}
