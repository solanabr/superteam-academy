'use client'

import { StandardLayout } from '@/components/layout/StandardLayout'
import { signOut } from '@/libs/auth-client'
import {
  LANGUAGE_OPTIONS,
  MOCK_USER_SETTINGS,
  NOTIFICATION_PREFS,
  SETTINGS_TABS,
  SOCIAL_CONNECTIONS,
  WALLET_OPTIONS,
} from '@/libs/constants/auth.constants'
import { truncateAddress } from '@/libs/string'
import { useAuthStore } from '@/stores'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertTriangle,
  Bell,
  Camera,
  Check,
  Download,
  Eye,
  EyeOff,
  Github,
  Languages,
  Lock,
  LogOut,
  Save,
  Shield,
  Sliders,
  Trash2,
  User,
  Wallet,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import posthog from 'posthog-js'
import { useState } from 'react'

// ─── Types ──────────────────────────────────────────────────────

type TabId = 'profile' | 'account' | 'preferences' | 'privacy'

// ─── Helpers ────────────────────────────────────────────────────

function TabIcon({ id, size = 16 }: { id: string; size?: number }) {
  const props = { size, strokeWidth: 1.5 }
  switch (id) {
    case 'profile':
      return <User {...props} />
    case 'account':
      return <Shield {...props} />
    case 'preferences':
      return <Sliders {...props} />
    case 'privacy':
      return <Lock {...props} />
    default:
      return <User {...props} />
  }
}

function ToggleSwitch({
  enabled,
  onChange,
}: {
  enabled: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className='relative w-10 h-5.5 rounded-full transition-colors duration-200 cursor-pointer flex-shrink-0'
      style={{
        background: enabled
          ? 'hsl(var(--green-primary))'
          : 'rgba(139,109,56,0.15)',
      }}
    >
      <span
        className='absolute top-0.5 left-0.5 w-4.5 h-4.5 bg-white rounded-full shadow-sm transition-transform duration-200'
        style={{ transform: enabled ? 'translateX(18px)' : 'translateX(0)' }}
      />
    </button>
  )
}

function FormField({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className='flex flex-col gap-1.5'>
      <label className='font-ui text-[0.78rem] font-semibold text-charcoal'>
        {label}
      </label>
      {children}
      {hint && (
        <p className='font-ui text-[0.65rem] text-text-tertiary'>{hint}</p>
      )}
    </div>
  )
}

function Input({
  value,
  onChange,
  placeholder,
  prefix,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  prefix?: string
}) {
  return (
    <div
      className='flex items-center gap-0 rounded-xl border overflow-hidden transition-all focus-within:border-green-primary/40'
      style={{
        background: 'hsl(var(--cream))',
        borderColor: 'hsl(var(--border-warm))',
      }}
    >
      {prefix && (
        <span
          className='font-ui text-[0.72rem] text-text-tertiary px-3 py-2.5 border-r select-none'
          style={{ borderColor: 'hsl(var(--border-warm))' }}
        >
          {prefix}
        </span>
      )}
      <input
        type='text'
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className='flex-1 px-3 py-2.5 font-ui text-[0.8rem] text-charcoal bg-transparent focus:outline-none placeholder:text-text-tertiary'
      />
    </div>
  )
}

function Textarea({
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className='w-full px-3 py-2.5 font-ui text-[0.8rem] text-charcoal rounded-xl border focus:outline-none focus:border-green-primary/40 resize-none transition-colors placeholder:text-text-tertiary'
      style={{
        background: 'hsl(var(--cream))',
        borderColor: 'hsl(var(--border-warm))',
      }}
    />
  )
}

function SaveButton({
  onClick,
  saved,
}: {
  onClick: () => void
  saved: boolean
}) {
  const t = useTranslations('settings')
  return (
    <button
      onClick={onClick}
      className='flex items-center gap-2 font-ui text-[0.82rem] font-semibold px-5 py-2.5 rounded-xl transition-all cursor-pointer'
      style={{
        background: saved
          ? 'hsl(var(--green-mint-soft) / 0.4)'
          : 'hsl(var(--green-primary))',
        color: saved ? 'hsl(var(--green-dark))' : 'hsl(var(--cream))',
      }}
    >
      {saved ? (
        <Check size={14} strokeWidth={2.5} />
      ) : (
        <Save size={14} strokeWidth={1.5} />
      )}
      {saved ? t('profile.saved') : t('profile.save')}
    </button>
  )
}

// ─── Tab Panels ──────────────────────────────────────────────────

function ProfileTab() {
  const t = useTranslations('settings')
  const { user } = useAuthStore()
  const [name, setName] = useState(user?.name || '')
  const [username, setUsername] = useState(user?.username || '')
  const [bio, setBio] = useState(user?.bio || '')
  const [website, setWebsite] = useState('')
  const [twitter, setTwitter] = useState(user?.twitter || '')
  const [github, setGithub] = useState(user?.github || '')
  const [linkedin, setLinkedin] = useState(user?.linkedin || '')
  const [telegram, setTelegram] = useState(user?.telegram || '')
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    posthog.capture('profile_settings_saved', { tab: 'profile' })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className='flex flex-col gap-8'>
      {/* Profile photo */}
      <div
        className='p-6 rounded-2xl border'
        style={{
          background: 'hsl(var(--card-warm))',
          borderColor: 'hsl(var(--border-warm))',
        }}
      >
        <h3 className='font-display text-[0.95rem] font-bold text-charcoal mb-4'>
          {t('profile.photoTitle')}
        </h3>
        <div className='flex items-center gap-5'>
          <div
            className='w-20 h-20 rounded-full flex items-center justify-center flex-shrink-0 text-[1.75rem] border-2'
            style={{
              background: 'hsl(var(--green-primary) / 0.1)',
              borderColor: 'hsl(var(--green-primary) / 0.2)',
            }}
          >
            🧑‍💻
          </div>
          <div className='flex flex-col gap-2'>
            <button
              className='flex items-center gap-2 font-ui text-[0.78rem] font-semibold px-4 py-2 rounded-lg border cursor-pointer transition-all hover:border-green-primary/30'
              style={{
                borderColor: 'hsl(var(--border-warm))',
                background: 'hsl(var(--cream))',
                color: 'hsl(var(--charcoal))',
              }}
            >
              <Camera size={13} strokeWidth={1.5} />
              {t('profile.uploadPhoto')}
            </button>
            <p className='font-ui text-[0.62rem] text-text-tertiary'>
              {t('profile.photoHint')}
            </p>
          </div>
        </div>
      </div>

      {/* Basic information */}
      <div
        className='p-6 rounded-2xl border flex flex-col gap-5'
        style={{
          background: 'hsl(var(--card-warm))',
          borderColor: 'hsl(var(--border-warm))',
        }}
      >
        <h3 className='font-display text-[0.95rem] font-bold text-charcoal'>
          {t('profile.basicInfo')}
        </h3>
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
          <FormField label={t('profile.displayName')}>
            <Input
              value={name}
              onChange={setName}
              placeholder={t('profile.placeholderName')}
            />
          </FormField>
          <FormField
            label={t('profile.username')}
            hint={t('profile.usernameHint')}
          >
            <Input
              value={username}
              onChange={setUsername}
              placeholder={t('profile.placeholderUsername')}
              prefix='@'
            />
          </FormField>
        </div>
        <FormField label={t('profile.bio')} hint={t('profile.bioHint')}>
          <Textarea
            value={bio}
            onChange={setBio}
            placeholder={t('profile.placeholderBio')}
            rows={3}
          />
        </FormField>
        <FormField label={t('profile.website')}>
          <Input
            value={website}
            onChange={setWebsite}
            placeholder={t('profile.placeholderWebsite')}
            prefix='🌐'
          />
        </FormField>
      </div>

      {/* Social links */}
      <div
        className='p-6 rounded-2xl border flex flex-col gap-5'
        style={{
          background: 'hsl(var(--card-warm))',
          borderColor: 'hsl(var(--border-warm))',
        }}
      >
        <h3 className='font-display text-[0.95rem] font-bold text-charcoal'>
          {t('profile.socialLinks')}
        </h3>
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
          <FormField label={t('profile.twitter')}>
            <Input
              value={twitter}
              onChange={setTwitter}
              placeholder='username'
              prefix='x.com/'
            />
          </FormField>
          <FormField label={t('profile.github')}>
            <Input
              value={github}
              onChange={setGithub}
              placeholder='username'
              prefix='github.com/'
            />
          </FormField>
          <FormField label={t('profile.linkedin')}>
            <Input
              value={linkedin}
              onChange={setLinkedin}
              placeholder='username'
              prefix='linkedin.com/in/'
            />
          </FormField>
          <FormField label={t('profile.telegram')}>
            <Input
              value={telegram}
              onChange={setTelegram}
              placeholder='username'
              prefix='@'
            />
          </FormField>
        </div>
      </div>

      <div className='flex justify-end'>
        <SaveButton onClick={handleSave} saved={saved} />
      </div>
    </div>
  )
}

function AccountTab() {
  const t = useTranslations('settings')
  const { user } = useAuthStore()

  const [wallets, setWallets] = useState(WALLET_OPTIONS)
  const [socials, setSocials] = useState(SOCIAL_CONNECTIONS)

  const toggleWallet = (id: string) => {
    setWallets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, connected: !w.connected } : w)),
    )
  }

  const toggleSocial = (id: string) => {
    setSocials((prev) =>
      prev.map((s) => (s.id === id ? { ...s, connected: !s.connected } : s)),
    )
  }

  return (
    <div className='flex flex-col gap-8'>
      {/* Email */}
      <div
        className='p-6 rounded-2xl border flex flex-col gap-4'
        style={{
          background: 'hsl(var(--card-warm))',
          borderColor: 'hsl(var(--border-warm))',
        }}
      >
        <h3 className='font-display text-[0.95rem] font-bold text-charcoal'>
          {t('account.email')}
        </h3>
        <div className='flex items-center justify-between gap-4'>
          <div>
            <p className='font-ui text-[0.82rem] font-semibold text-charcoal'>
              {user?.email || MOCK_USER_SETTINGS.email}
            </p>
            <p className='font-ui text-[0.65rem] text-text-tertiary mt-0.5 flex items-center gap-1'>
              <Check
                size={11}
                strokeWidth={2.5}
                className='text-green-primary'
              />
              {t('account.verified')}
            </p>
          </div>
          <button
            className='font-ui text-[0.72rem] font-semibold px-4 py-2 rounded-lg border cursor-pointer hover:border-green-primary/30 transition-colors'
            style={{
              borderColor: 'hsl(var(--border-warm))',
              background: 'hsl(var(--cream))',
              color: 'hsl(var(--charcoal))',
            }}
          >
            {t('account.changeEmail')}
          </button>
        </div>
      </div>

      {/* Wallets */}
      <div
        className='p-6 rounded-2xl border flex flex-col gap-4'
        style={{
          background: 'hsl(var(--card-warm))',
          borderColor: 'hsl(var(--border-warm))',
        }}
      >
        <div>
          <h3 className='font-display text-[0.95rem] font-bold text-charcoal'>
            {t('account.wallets')}
          </h3>
          <p className='font-ui text-[0.68rem] text-text-tertiary mt-0.5'>
            {t('account.walletsHint')}
          </p>
        </div>
        <div className='flex flex-col gap-2'>
          {wallets.map((w) => (
            <div
              key={w.id}
              className='flex items-center justify-between p-4 rounded-xl border transition-colors'
              style={{
                background: w.connected
                  ? 'hsl(var(--green-primary) / 0.04)'
                  : 'hsl(var(--cream))',
                borderColor: w.connected
                  ? 'hsl(var(--green-primary) / 0.2)'
                  : 'hsl(var(--border-warm))',
              }}
            >
              <div className='flex items-center gap-3'>
                <span className='text-[1.25rem] text-charcoal'>
                  {w.icon === 'solana' ? (
                    <Wallet size={22} strokeWidth={1.5} />
                  ) : (
                    w.icon
                  )}
                </span>
                <div>
                  <p className='font-ui text-[0.8rem] font-semibold text-charcoal'>
                    {w.name}
                  </p>
                  {w.connected && w.address && (
                    <p className='font-ui text-[0.6rem] text-text-tertiary font-mono'>
                      {truncateAddress(w.address)}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => toggleWallet(w.id)}
                className='font-ui text-[0.7rem] font-semibold px-3.5 py-1.5 rounded-lg border cursor-pointer transition-all'
                style={
                  w.connected
                    ? {
                        background: 'transparent',
                        borderColor: 'hsl(var(--charcoal) / 0.15)',
                        color: 'hsl(var(--text-secondary))',
                      }
                    : {
                        background: 'hsl(var(--green-primary))',
                        borderColor: 'transparent',
                        color: 'hsl(var(--cream))',
                      }
                }
              >
                {w.connected ? t('account.disconnect') : t('account.connect')}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Social connections */}
      <div
        className='p-6 rounded-2xl border flex flex-col gap-4'
        style={{
          background: 'hsl(var(--card-warm))',
          borderColor: 'hsl(var(--border-warm))',
        }}
      >
        <h3 className='font-display text-[0.95rem] font-bold text-charcoal'>
          {t('account.socialConnections')}
        </h3>
        <div className='flex flex-col gap-2'>
          {socials.map((s) => (
            <div
              key={s.id}
              className='flex items-center justify-between p-4 rounded-xl border transition-colors'
              style={{
                background: s.connected
                  ? 'hsl(var(--green-primary) / 0.04)'
                  : 'hsl(var(--cream))',
                borderColor: s.connected
                  ? 'hsl(var(--green-primary) / 0.2)'
                  : 'hsl(var(--border-warm))',
              }}
            >
              <div className='flex items-center gap-3'>
                <div
                  className='w-9 h-9 rounded-lg flex items-center justify-center font-ui text-[0.72rem] font-black'
                  style={{
                    background: s.id === 'github' ? '#1b1f23' : '#fff',
                    color: s.id === 'github' ? '#fff' : '#333',
                    border: s.id === 'google' ? '1px solid #e5e7eb' : 'none',
                  }}
                >
                  {s.id === 'github' && <Github size={18} strokeWidth={1.5} />}
                  {s.id === 'google' && (
                    <span
                      className='font-black text-[1rem]'
                      style={{ color: '#4285f4' }}
                    >
                      G
                    </span>
                  )}
                </div>
                <div>
                  <p className='font-ui text-[0.8rem] font-semibold text-charcoal'>
                    {s.name}
                  </p>
                  {s.connected && s.handle && (
                    <p className='font-ui text-[0.6rem] text-text-tertiary'>
                      {s.handle}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => toggleSocial(s.id)}
                className='font-ui text-[0.7rem] font-semibold px-3.5 py-1.5 rounded-lg border cursor-pointer transition-all'
                style={
                  s.connected
                    ? {
                        background: 'transparent',
                        borderColor: 'hsl(var(--charcoal) / 0.15)',
                        color: 'hsl(var(--text-secondary))',
                      }
                    : {
                        background: 'hsl(var(--green-primary))',
                        borderColor: 'transparent',
                        color: 'hsl(var(--cream))',
                      }
                }
              >
                {s.connected ? t('account.disconnect') : t('account.connect')}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Danger zone */}
      <div
        className='p-6 rounded-2xl border flex flex-col gap-4'
        style={{
          background: 'hsl(6 63% 46% / 0.04)',
          borderColor: 'hsl(6 63% 46% / 0.2)',
        }}
      >
        <div className='flex items-center gap-2'>
          <AlertTriangle size={15} strokeWidth={1.5} className='text-red-500' />
          <h3 className='font-display text-[0.95rem] font-bold text-charcoal'>
            {t('account.dangerZone')}
          </h3>
        </div>
        <div className='flex items-center justify-between'>
          <div>
            <p className='font-ui text-[0.8rem] font-semibold text-charcoal'>
              {t('account.deleteAccount')}
            </p>
            <p className='font-ui text-[0.65rem] text-text-tertiary mt-0.5'>
              {t('account.deleteDesc')}
            </p>
          </div>
          <button className='flex items-center gap-1.5 font-ui text-[0.72rem] font-semibold px-4 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-500/8 cursor-pointer transition-colors'>
            <Trash2 size={13} strokeWidth={1.5} />
            {t('account.delete')}
          </button>
        </div>
      </div>
    </div>
  )
}

function PreferencesTab() {
  const t = useTranslations('settings')
  const [language, setLanguage] = useState(MOCK_USER_SETTINGS.language)
  const [notifications, setNotifications] = useState<Record<string, boolean>>(
    Object.fromEntries(NOTIFICATION_PREFS.map((p) => [p.id, p.defaultEnabled])),
  )
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    posthog.capture('profile_settings_saved', { tab: 'preferences', language })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className='flex flex-col gap-8'>
      {/* Language */}
      <div
        className='p-6 rounded-2xl border flex flex-col gap-4'
        style={{
          background: 'hsl(var(--card-warm))',
          borderColor: 'hsl(var(--border-warm))',
        }}
      >
        <div className='flex items-center gap-2'>
          <Languages
            size={16}
            strokeWidth={1.5}
            className='text-green-primary'
          />
          <h3 className='font-display text-[0.95rem] font-bold text-charcoal'>
            {t('preferences.language')}
          </h3>
        </div>
        <div className='grid grid-cols-1 sm:grid-cols-3 gap-2'>
          {LANGUAGE_OPTIONS.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              className='flex items-center gap-3 p-3.5 rounded-xl border text-left cursor-pointer transition-all'
              style={{
                background:
                  language === lang.code
                    ? 'hsl(var(--green-primary) / 0.06)'
                    : 'hsl(var(--cream))',
                borderColor:
                  language === lang.code
                    ? 'hsl(var(--green-primary) / 0.3)'
                    : 'hsl(var(--border-warm))',
              }}
            >
              <span className='text-[1.35rem]'>{lang.flag}</span>
              <div>
                <p className='font-ui text-[0.78rem] font-semibold text-charcoal'>
                  {lang.nativeLabel}
                </p>
                <p className='font-ui text-[0.6rem] text-text-tertiary'>
                  {lang.label}
                </p>
              </div>
              {language === lang.code && (
                <Check
                  size={14}
                  strokeWidth={2.5}
                  className='text-green-primary ml-auto'
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications */}
      <div
        className='p-6 rounded-2xl border flex flex-col gap-4'
        style={{
          background: 'hsl(var(--card-warm))',
          borderColor: 'hsl(var(--border-warm))',
        }}
      >
        <div className='flex items-center gap-2'>
          <Bell size={16} strokeWidth={1.5} className='text-green-primary' />
          <h3 className='font-display text-[0.95rem] font-bold text-charcoal'>
            {t('preferences.notifications')}
          </h3>
        </div>
        <div
          className='flex flex-col divide-y'
          style={{ borderColor: 'hsl(var(--border-warm))' }}
        >
          {NOTIFICATION_PREFS.map((pref) => (
            <div
              key={pref.id}
              className='flex items-center justify-between py-3.5 gap-4'
            >
              <div>
                <p className='font-ui text-[0.8rem] font-semibold text-charcoal'>
                  {t(`preferences.notif.${pref.id}.label`)}
                </p>
                <p className='font-ui text-[0.65rem] text-text-tertiary mt-0.5'>
                  {t(`preferences.notif.${pref.id}.desc`)}
                </p>
              </div>
              <ToggleSwitch
                enabled={notifications[pref.id]}
                onChange={(v) =>
                  setNotifications((prev) => ({ ...prev, [pref.id]: v }))
                }
              />
            </div>
          ))}
        </div>
      </div>

      <div className='flex justify-end'>
        <SaveButton onClick={handleSave} saved={saved} />
      </div>
    </div>
  )
}

function PrivacyTab() {
  const t = useTranslations('settings')
  const [visibility, setVisibility] = useState<'public' | 'private'>(
    MOCK_USER_SETTINGS.profileVisibility,
  )
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    posthog.capture('profile_settings_saved', {
      tab: 'privacy',
      profile_visibility: visibility,
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className='flex flex-col gap-8'>
      {/* Profile visibility */}
      <div
        className='p-6 rounded-2xl border flex flex-col gap-5'
        style={{
          background: 'hsl(var(--card-warm))',
          borderColor: 'hsl(var(--border-warm))',
        }}
      >
        <div className='flex items-center gap-2'>
          {visibility === 'public' ? (
            <Eye size={16} strokeWidth={1.5} className='text-green-primary' />
          ) : (
            <EyeOff
              size={16}
              strokeWidth={1.5}
              className='text-text-tertiary'
            />
          )}
          <h3 className='font-display text-[0.95rem] font-bold text-charcoal'>
            {t('privacy.visibility')}
          </h3>
        </div>
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
          {(['public', 'private'] as const).map((opt) => (
            <button
              key={opt}
              onClick={() => setVisibility(opt)}
              className='p-4 rounded-xl border text-left cursor-pointer transition-all'
              style={{
                background:
                  visibility === opt
                    ? 'hsl(var(--green-primary) / 0.06)'
                    : 'hsl(var(--cream))',
                borderColor:
                  visibility === opt
                    ? 'hsl(var(--green-primary) / 0.3)'
                    : 'hsl(var(--border-warm))',
              }}
            >
              <div className='flex items-center justify-between mb-1.5'>
                <p className='font-ui text-[0.82rem] font-semibold text-charcoal capitalize'>
                  {opt === 'public'
                    ? t('privacy.public')
                    : t('privacy.private')}
                </p>
                {visibility === opt && (
                  <div
                    className='w-4.5 h-4.5 rounded-full flex items-center justify-center'
                    style={{ background: 'hsl(var(--green-primary))' }}
                  >
                    <Check size={10} strokeWidth={3} className='text-cream' />
                  </div>
                )}
              </div>
              <p className='font-ui text-[0.65rem] text-text-tertiary'>
                {opt === 'public'
                  ? t('privacy.publicDesc')
                  : t('privacy.privateDesc')}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Data export */}
      <div
        className='p-6 rounded-2xl border flex flex-col gap-4'
        style={{
          background: 'hsl(var(--card-warm))',
          borderColor: 'hsl(var(--border-warm))',
        }}
      >
        <div>
          <h3 className='font-display text-[0.95rem] font-bold text-charcoal'>
            {t('privacy.dataExport')}
          </h3>
          <p className='font-ui text-[0.68rem] text-text-tertiary mt-1'>
            {t('privacy.dataExportDesc')}
          </p>
        </div>
        <button
          className='flex items-center gap-2 w-fit font-ui text-[0.78rem] font-semibold px-4 py-2.5 rounded-xl border cursor-pointer hover:border-green-primary/30 transition-colors'
          style={{
            borderColor: 'hsl(var(--border-warm))',
            background: 'hsl(var(--cream))',
            color: 'hsl(var(--charcoal))',
          }}
        >
          <Download size={14} strokeWidth={1.5} />
          {t('privacy.requestExport')}
        </button>
      </div>

      <div className='flex justify-end'>
        <SaveButton onClick={handleSave} saved={saved} />
      </div>
    </div>
  )
}

// ─── Settings Page ───────────────────────────────────────────────

const Settings = () => {
  const t = useTranslations('settings')
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabId>('profile')

  const handleSignOut = async () => {
    try {
      await signOut()
      posthog.capture('user_signed_out', { source: 'settings_page' })
      router.push('/courses')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const tabContent = {
    profile: <ProfileTab />,
    account: <AccountTab />,
    preferences: <PreferencesTab />,
    privacy: <PrivacyTab />,
  }

  return (
    <StandardLayout>
      {/* ─── HERO ──────────────────────────────────── */}
      <div className='relative overflow-hidden bg-green-secondary'>
        <div className='absolute inset-0 pattern-diagonal' />
        <div className='max-w-[1200px] mx-auto px-4 sm:px-6 py-10 relative z-10'>
          <h1 className='font-display text-[1.8rem] sm:text-[2.2rem] font-black tracking-tight text-cream'>
            {t('page.title')}
          </h1>
          <p className='font-ui text-[0.82rem] text-cream/55 mt-1'>
            {t('page.subtitle')}
          </p>
        </div>
      </div>

      {/* ─── CONTENT ──────────────────────────────── */}
      <div className='max-w-[1200px] mx-auto px-4 sm:px-6 py-10'>
        <div className='flex flex-col lg:flex-row gap-8'>
          {/* Left — tab rail */}
          <aside className='w-full lg:w-56 flex-shrink-0'>
            <nav className='flex lg:flex-col gap-1'>
              {SETTINGS_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabId)}
                  className='flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl font-ui text-[0.8rem] font-medium transition-all cursor-pointer text-left w-full'
                  style={{
                    background:
                      activeTab === tab.id
                        ? 'hsl(var(--green-primary) / 0.08)'
                        : 'transparent',
                    color:
                      activeTab === tab.id
                        ? 'hsl(var(--green-primary))'
                        : 'hsl(var(--text-secondary))',
                    fontWeight: activeTab === tab.id ? 600 : 400,
                    borderLeft:
                      activeTab === tab.id
                        ? '2px solid hsl(var(--green-primary))'
                        : '2px solid transparent',
                  }}
                >
                  <TabIcon id={tab.id} />
                  {t(`tabs.${tab.id}`)}
                </button>
              ))}
            </nav>

            {/* Sign out */}
            <div className='mt-6 pt-6 border-t border-border-warm hidden lg:block'>
              <button
                onClick={handleSignOut}
                className='flex items-center gap-2 w-full px-3.5 py-2.5 rounded-xl font-ui text-[0.78rem] text-text-secondary hover:text-red-500 hover:bg-red-500/5 transition-all cursor-pointer'
              >
                <LogOut size={15} strokeWidth={1.5} />
                {t('tabs.signOut')}
              </button>
            </div>
          </aside>

          {/* Right — content panel */}
          <div className='flex-1 min-w-0'>
            <AnimatePresence mode='wait'>
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
              >
                {tabContent[activeTab]}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </StandardLayout>
  )
}

export default Settings
