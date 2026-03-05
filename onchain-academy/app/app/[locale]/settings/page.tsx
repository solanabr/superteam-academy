'use client';

import { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function SettingsPage() {
  const { user, authenticated, logout } = usePrivy();
  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const wallet = user?.wallet?.address || '';

  const [profile, setProfile] = useState({ display_name: '', bio: '', twitter: '', github: '' });
  const [prefs, setPrefs] = useState({ locale: 'en', email_notifications: true, push_notifications: false, marketing_emails: false });
  const [editor, setEditor] = useState({ editor_font_size: 14, editor_theme: 'vs-dark' });
  const [privacy, setPrivacy] = useState({ show_in_leaderboard: true, profile_public: true });

  async function loadSettings() {
    const [{ data: p }, { data: s }] = await Promise.all([
      supabase.from('user_profiles').select('*').eq('wallet', wallet).single(),
      supabase.from('user_settings').select('*').eq('user_wallet', wallet).single(),
    ]);
    if (p) setProfile({ display_name: p.display_name || '', bio: p.bio || '', twitter: p.twitter || '', github: p.github || '' });
    if (s) {
      setPrefs({ locale: s.locale || 'en', email_notifications: s.email_notifications ?? true, push_notifications: s.push_notifications ?? false, marketing_emails: s.marketing_emails ?? false });
      setEditor({ editor_font_size: s.editor_font_size || 14, editor_theme: s.editor_theme || 'vs-dark' });
      setPrivacy({ show_in_leaderboard: s.show_in_leaderboard ?? true, profile_public: s.profile_public ?? true });
    }
  }

  useEffect(() => {
    if (!authenticated || !wallet) return;
    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated, wallet]);

  async function save() {
    if (!wallet) return;
    setSaving(true);
    await Promise.all([
      supabase.from('user_profiles').upsert({ wallet, ...profile }, { onConflict: 'wallet' }),
      supabase.from('user_settings').upsert({ user_wallet: wallet, ...prefs, ...editor, ...privacy }, { onConflict: 'user_wallet' }),
    ]);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const tabs = ['profile', 'preferences', 'editor', 'privacy'];

  if (!authenticated) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <p className="text-gray-400">Please connect your wallet to access settings.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="border-b border-gray-800 px-6 py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-white">Settings</h1>
          <p className="text-gray-400 mt-1 text-sm font-mono">{wallet.slice(0,4)}...{wallet.slice(-4)}</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex gap-1 mb-8 bg-gray-900 p-1 rounded-xl border border-gray-800">
          {tabs.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${activeTab === tab ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
              {tab}
            </button>
          ))}
        </div>

        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 space-y-6">
          {activeTab === 'profile' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Display Name</label>
                <input value={profile.display_name} onChange={e => setProfile(p => ({...p, display_name: e.target.value}))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                  placeholder="Your name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Bio</label>
                <textarea value={profile.bio} onChange={e => setProfile(p => ({...p, bio: e.target.value}))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 resize-none"
                  rows={3} placeholder="Tell us about yourself" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Twitter</label>
                  <input value={profile.twitter} onChange={e => setProfile(p => ({...p, twitter: e.target.value}))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                    placeholder="@handle" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">GitHub</label>
                  <input value={profile.github} onChange={e => setProfile(p => ({...p, github: e.target.value}))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                    placeholder="username" />
                </div>
              </div>
            </>
          )}

          {activeTab === 'preferences' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Language</label>
                <select value={prefs.locale} onChange={e => setPrefs(p => ({...p, locale: e.target.value}))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500">
                  <option value="en">English</option>
                  <option value="pt-BR">Português (BR)</option>
                  <option value="es">Español</option>
                </select>
              </div>
              {[
                { key: 'email_notifications', label: 'Email Notifications', desc: 'Receive updates via email' },
                { key: 'push_notifications', label: 'Push Notifications', desc: 'Browser push notifications' },
                { key: 'marketing_emails', label: 'Marketing Emails', desc: 'News and announcements' },
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between p-4 bg-gray-800 rounded-xl">
                  <div>
                    <p className="text-white font-medium">{label}</p>
                    <p className="text-gray-500 text-sm">{desc}</p>
                  </div>
                  <button onClick={() => setPrefs(p => ({...p, [key]: !p[key as keyof typeof p]}))}
                    className={`w-12 h-6 rounded-full transition-colors ${prefs[key as keyof typeof prefs] ? 'bg-purple-600' : 'bg-gray-600'}`}>
                    <div className={`w-5 h-5 bg-white rounded-full mx-0.5 transition-transform ${prefs[key as keyof typeof prefs] ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>
              ))}
            </>
          )}

          {activeTab === 'editor' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Font Size: {editor.editor_font_size}px</label>
                <input type="range" min="10" max="24" value={editor.editor_font_size}
                  onChange={e => setEditor(p => ({...p, editor_font_size: Number(e.target.value)}))}
                  className="w-full accent-purple-500" />
                <div className="flex justify-between text-xs text-gray-600 mt-1"><span>10px</span><span>24px</span></div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Editor Theme</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'vs-dark', label: 'Dark', bg: 'bg-gray-900', text: 'text-gray-300' },
                    { value: 'vs', label: 'Light', bg: 'bg-white', text: 'text-gray-800' },
                    { value: 'hc-black', label: 'High Contrast', bg: 'bg-black', text: 'text-yellow-400' },
                    { value: 'monokai', label: 'Monokai', bg: 'bg-[#272822]', text: 'text-[#a6e22e]' },
                  ].map(theme => (
                    <button key={theme.value} onClick={() => setEditor(p => ({...p, editor_theme: theme.value}))}
                      className={`p-4 rounded-xl border-2 transition-all ${editor.editor_theme === theme.value ? 'border-purple-500' : 'border-gray-700'}`}>
                      <div className={`${theme.bg} rounded-lg p-2 mb-2`}>
                        <code className={`text-xs ${theme.text}`}>{'const x = 42;'}</code>
                      </div>
                      <p className="text-white text-sm">{theme.label}</p>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === 'privacy' && (
            <>
              {[
                { key: 'show_in_leaderboard', label: 'Show in Leaderboard', desc: 'Display your rank publicly' },
                { key: 'profile_public', label: 'Public Profile', desc: 'Anyone can view your profile' },
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between p-4 bg-gray-800 rounded-xl">
                  <div>
                    <p className="text-white font-medium">{label}</p>
                    <p className="text-gray-500 text-sm">{desc}</p>
                  </div>
                  <button onClick={() => setPrivacy(p => ({...p, [key]: !p[key as keyof typeof p]}))}
                    className={`w-12 h-6 rounded-full transition-colors ${privacy[key as keyof typeof privacy] ? 'bg-purple-600' : 'bg-gray-600'}`}>
                    <div className={`w-5 h-5 bg-white rounded-full mx-0.5 transition-transform ${privacy[key as keyof typeof privacy] ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>
              ))}
              <div className="p-4 bg-gray-800 rounded-xl">
                <p className="text-white font-medium mb-1">Wallet</p>
                <p className="text-gray-400 font-mono text-sm break-all">{wallet}</p>
              </div>
              <div className="border-t border-gray-700 pt-4">
                <button onClick={logout} className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-medium py-3 rounded-xl transition-colors">
                  Disconnect Wallet
                </button>
              </div>
            </>
          )}
        </div>

        <button onClick={save} disabled={saving}
          className="mt-6 w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold py-4 rounded-xl transition-colors">
          {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
