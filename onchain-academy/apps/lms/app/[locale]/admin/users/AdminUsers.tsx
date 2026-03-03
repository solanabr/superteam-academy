'use client'

import {
  ADMIN_USERS,
  ROLE_META,
  type AdminUser,
  type UserRole,
} from '@/libs/constants/admin.constants'
import { truncateAddress } from '@/libs/string'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, ChevronDown, Search, Shield, X } from 'lucide-react'
import { useState } from 'react'

const AUTH_ICONS: Record<string, string> = {
  wallet: '👻',
  google: '🔵',
  github: '⬛',
}

// ─── User Detail Panel ────────────────────────────────────────────────────────

function UserDetailPanel({
  user,
  onClose,
  onRoleChange,
}: {
  user: AdminUser
  onClose: () => void
  onRoleChange: (id: string, role: UserRole) => void
}) {
  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 300 }}
      className='fixed right-0 top-0 h-full w-full max-w-sm z-50 flex flex-col shadow-2xl'
      style={{
        background: 'hsl(var(--cream))',
        borderLeft: '1px solid hsl(var(--border-warm))',
      }}
    >
      {/* Header */}
      <div
        className='px-6 py-5 border-b shrink-0 flex items-center justify-between'
        style={{ borderColor: 'hsl(var(--border-warm))' }}
      >
        <div className='flex items-center gap-3'>
          <div className='w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-green-primary/10'>
            {user.avatar}
          </div>
          <div>
            <div className='font-display text-base font-bold text-charcoal'>
              {user.name}
            </div>
            <div className='font-ui text-[0.65rem] text-text-tertiary'>
              @{user.username}
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className='p-2 rounded-lg hover:bg-charcoal/8 transition-colors'
        >
          <X size={16} className='text-text-tertiary' />
        </button>
      </div>

      <div className='flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5'>
        {/* Account Info */}
        <div
          className='p-4 rounded-2xl border flex flex-col gap-3'
          style={{
            background: 'hsl(var(--card-warm))',
            borderColor: 'hsl(var(--border-warm))',
          }}
        >
          <h3 className='font-display text-sm font-bold text-charcoal'>
            Account Info
          </h3>
          <div className='grid grid-cols-1 gap-2 text-sm'>
            <Row label='Email' value={user.email} />
            <Row
              label='Wallet'
              value={
                <span className='font-mono text-xs'>
                  {truncateAddress(user.walletAddress)}
                </span>
              }
            />
            <Row
              label='Auth'
              value={`${AUTH_ICONS[user.authProvider]} ${user.authProvider}`}
            />
            <Row label='Joined' value={user.joinedAt} />
            <Row label='Last active' value={user.lastActive} />
          </div>
        </div>

        {/* Stats */}
        <div className='grid grid-cols-3 gap-2 text-center'>
          <StatBox label='Level' value={`Lv. ${user.level}`} />
          <StatBox label='XP' value={user.xp.toLocaleString()} accent />
          <StatBox label='Courses' value={String(user.coursesCompleted)} />
        </div>

        {/* Role */}
        <div>
          <h3 className='font-display text-sm font-bold text-charcoal mb-3'>
            Role Assignment
          </h3>
          <div className='grid grid-cols-2 gap-2'>
            {(['student', 'author', 'moderator', 'admin'] as UserRole[]).map(
              (role) => {
                const meta = ROLE_META[role]
                const isActive = user.role === role
                return (
                  <button
                    key={role}
                    onClick={() => onRoleChange(user.id, role)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border font-ui text-xs font-semibold transition-all capitalize ${
                      isActive
                        ? `${meta.bg} ${meta.color} shadow-sm`
                        : 'border-border-warm text-text-secondary hover:bg-card-warm'
                    }`}
                  >
                    {isActive && <CheckCircle2 size={12} />}
                    {!isActive && (
                      <div className='w-3 h-3 rounded-full border border-text-tertiary' />
                    )}
                    {meta.label}
                  </button>
                )
              },
            )}
          </div>
        </div>

        {/* Danger Zone */}
        <div className='p-4 rounded-2xl border border-red-200 bg-red-50'>
          <h3 className='font-display text-sm font-bold text-red-600 mb-2'>
            Danger Zone
          </h3>
          <button className='w-full py-2 rounded-xl border border-red-300 font-ui text-xs font-bold text-red-600 hover:bg-red-100 transition-colors'>
            {user.suspended ? 'Unsuspend Account' : 'Suspend Account'}
          </button>
        </div>
      </div>
    </motion.div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className='flex items-center justify-between'>
      <span className='font-ui text-[0.65rem] text-text-tertiary'>{label}</span>
      <span className='font-ui text-[0.72rem] font-semibold text-charcoal'>
        {value}
      </span>
    </div>
  )
}

function StatBox({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <div
      className='p-3 rounded-xl border text-center'
      style={{
        background: 'hsl(var(--card-warm))',
        borderColor: 'hsl(var(--border-warm))',
      }}
    >
      <div
        className={`font-display text-base font-black ${accent ? 'text-amber-dark' : 'text-charcoal'}`}
      >
        {value}
      </div>
      <div className='font-ui text-[0.6rem] text-text-tertiary'>{label}</div>
    </div>
  )
}

// ─── Users Table ──────────────────────────────────────────────────────────────

export function AdminUsers() {
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all')
  const [selected, setSelected] = useState<AdminUser | null>(null)
  const [users, setUsers] = useState<AdminUser[]>(ADMIN_USERS)

  const filtered = users.filter((u) => {
    const matchQ =
      u.name.toLowerCase().includes(query.toLowerCase()) ||
      u.username.toLowerCase().includes(query.toLowerCase())
    const matchRole = roleFilter === 'all' || u.role === roleFilter
    return matchQ && matchRole
  })

  const handleRoleChange = (id: string, role: UserRole) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)))
    setSelected((prev) => (prev && prev.id === id ? { ...prev, role } : prev))
  }

  return (
    <div className='relative h-full flex flex-col'>
      {/* Header */}
      <div
        className='px-6 lg:px-8 py-5 border-b shrink-0 flex items-center justify-between gap-4'
        style={{
          borderColor: 'hsl(var(--border-warm))',
          background: 'hsl(var(--card-warm))',
        }}
      >
        <div>
          <h1 className='font-display text-xl font-black text-charcoal'>
            User Management
          </h1>
          <p className='font-ui text-xs text-text-tertiary'>
            {users.length} registered users
          </p>
        </div>
        <div
          className='flex items-center gap-2 p-2 rounded-xl border font-ui text-xs'
          style={{ borderColor: 'hsl(var(--border-warm))' }}
        >
          <Shield size={14} className='text-green-primary' />
          <span className='text-text-secondary'>Role-based access control</span>
        </div>
      </div>

      {/* Filters */}
      <div
        className='px-6 lg:px-8 py-4 border-b shrink-0 flex items-center gap-3'
        style={{ borderColor: 'hsl(var(--border-warm))' }}
      >
        <div className='relative flex-1 max-w-sm'>
          <Search
            size={14}
            className='absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary'
          />
          <input
            className='w-full pl-8 pr-3 py-2 rounded-xl border font-ui text-sm bg-cream text-charcoal focus:outline-none focus:border-green-primary transition-colors'
            style={{ borderColor: 'hsl(var(--border-warm))' }}
            placeholder='Search users...'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        {(['all', 'student', 'author', 'moderator', 'admin'] as const).map(
          (r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-lg font-ui text-xs font-semibold border transition-all capitalize ${
                roleFilter === r
                  ? 'bg-charcoal text-cream border-charcoal'
                  : 'bg-cream text-text-secondary border-border-warm hover:bg-card-warm'
              }`}
            >
              {r}
            </button>
          ),
        )}
      </div>

      {/* Table */}
      <div className='flex-1 overflow-auto px-6 lg:px-8 py-4'>
        <table className='w-full min-w-[820px]'>
          <thead>
            <tr
              className='border-b'
              style={{ borderColor: 'hsl(var(--border-warm))' }}
            >
              {[
                'User',
                'Wallet',
                'Auth',
                'Level / XP',
                'Role',
                'Joined',
                '',
              ].map((h) => (
                <th
                  key={h}
                  className='text-left pb-3 font-ui text-[0.625rem] font-bold text-text-tertiary uppercase tracking-wider pr-4'
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((user, i) => {
              const roleMeta = ROLE_META[user.role]
              return (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className='border-b hover:bg-card-warm transition-colors cursor-pointer'
                  style={{ borderColor: 'hsl(var(--border-warm))' }}
                  onClick={() => setSelected(user)}
                >
                  <td className='py-3.5 pr-4'>
                    <div className='flex items-center gap-3'>
                      <div className='w-8 h-8 rounded-lg flex items-center justify-center text-base bg-green-primary/10 shrink-0'>
                        {user.avatar}
                      </div>
                      <div>
                        <div className='font-ui text-sm font-semibold text-charcoal flex items-center gap-1.5'>
                          {user.name}
                          {user.suspended && (
                            <span className='text-[0.55rem] bg-red-100 text-red-600 px-1 rounded'>
                              Suspended
                            </span>
                          )}
                        </div>
                        <div className='font-ui text-[0.6rem] text-text-tertiary'>
                          @{user.username}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className='py-3.5 pr-4'>
                    <span className='font-mono text-[0.65rem] text-text-secondary'>
                      {truncateAddress(user.walletAddress, 5, 5)}
                    </span>
                  </td>
                  <td className='py-3.5 pr-4'>
                    <span className='font-ui text-sm'>
                      {AUTH_ICONS[user.authProvider]}
                    </span>
                  </td>
                  <td className='py-3.5 pr-4'>
                    <div>
                      <div className='font-display text-sm font-black text-charcoal'>
                        Lv. {user.level}
                      </div>
                      <div className='font-ui text-[0.6rem] text-amber-dark font-bold'>
                        {user.xp.toLocaleString()} XP
                      </div>
                    </div>
                  </td>
                  <td className='py-3.5 pr-4'>
                    <div className='flex items-center gap-1'>
                      <select
                        className={`py-1 px-2 rounded-lg border font-ui text-[0.65rem] font-semibold cursor-pointer ${roleMeta.bg} ${roleMeta.color}`}
                        defaultValue={user.role}
                        onChange={(e) => {
                          e.stopPropagation()
                          handleRoleChange(user.id, e.target.value as UserRole)
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <option value='student'>Student</option>
                        <option value='author'>Author</option>
                        <option value='moderator'>Moderator</option>
                        <option value='admin'>Admin</option>
                      </select>
                      <ChevronDown
                        size={10}
                        className='text-text-tertiary -ml-1'
                      />
                    </div>
                  </td>
                  <td className='py-3.5 pr-4'>
                    <span className='font-ui text-[0.65rem] text-text-tertiary'>
                      {user.joinedAt}
                    </span>
                  </td>
                  <td
                    className='py-3.5'
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelected(user)
                    }}
                  >
                    <button className='font-ui text-[0.65rem] font-semibold text-green-primary hover:underline'>
                      View
                    </button>
                  </td>
                </motion.tr>
              )
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className='py-16 text-center'>
            <p className='font-ui text-sm text-text-tertiary'>
              No users match your filters.
            </p>
          </div>
        )}
      </div>

      {/* User Panel */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className='fixed inset-0 bg-charcoal/30 z-40'
              onClick={() => setSelected(null)}
            />
            <UserDetailPanel
              user={selected}
              onClose={() => setSelected(null)}
              onRoleChange={handleRoleChange}
            />
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
