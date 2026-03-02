'use client'

import React, { useCallback, useEffect, useState } from 'react'

type ThemeMode = 'auto' | 'light' | 'dark'

const COOKIE_NAME = 'payload-theme'

function getInitialMode(): ThemeMode {
  if (typeof document === 'undefined') return 'auto'
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]*)`))
  if (match) {
    const val = match[1]
    if (val === 'light' || val === 'dark') return val
  }
  return 'auto'
}

function setCookie(value: string) {
  document.cookie = `${COOKIE_NAME}=${value};path=/;max-age=${60 * 60 * 24 * 365};SameSite=Lax`
}

function clearCookie() {
  document.cookie = `${COOKIE_NAME}=;path=/;max-age=0`
}

function applyTheme(mode: ThemeMode) {
  const html = document.documentElement
  if (mode === 'auto') {
    clearCookie()
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    html.setAttribute('data-theme', prefersDark ? 'dark' : 'light')
  } else {
    setCookie(mode)
    html.setAttribute('data-theme', mode)
  }
}

const iconStyle: React.CSSProperties = {
  width: 18,
  height: 18,
  stroke: 'currentColor',
  fill: 'none',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

function SunIcon() {
  return (
    <svg style={iconStyle} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg style={iconStyle} viewBox="0 0 24 24">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

function MonitorIcon() {
  return (
    <svg style={iconStyle} viewBox="0 0 24 24">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  )
}

const buttonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'none',
  border: '1px solid var(--theme-elevation-300)',
  borderRadius: 4,
  padding: 6,
  cursor: 'pointer',
  color: 'var(--theme-text)',
  transition: 'background 0.15s, border-color 0.15s',
}

export const ThemeToggle: React.FC = () => {
  const [mode, setMode] = useState<ThemeMode>('auto')

  useEffect(() => {
    setMode(getInitialMode())
  }, [])

  const handleClick = useCallback(() => {
    const next: ThemeMode = mode === 'auto' ? 'light' : mode === 'light' ? 'dark' : 'auto'
    setMode(next)
    applyTheme(next)
  }, [mode])

  let icon: React.ReactNode
  let title: string
  if (mode === 'auto') {
    icon = <MonitorIcon />
    title = 'Theme: Auto (click for Light)'
  } else if (mode === 'light') {
    icon = <SunIcon />
    title = 'Theme: Light (click for Dark)'
  } else {
    icon = <MoonIcon />
    title = 'Theme: Dark (click for Auto)'
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      style={buttonStyle}
      title={title}
      aria-label={title}
    >
      {icon}
    </button>
  )
}
