# Theme System Implementation

## Overview

The Solana Academy Platform implements a comprehensive light/dark theme system using:
- **Type Definitions** (`lib/types/theme.ts`) - TypeScript types and color constants
- **State Management** (`lib/stores/theme.store.ts`) - Zustand store with localStorage persistence
- **React Hook** (`lib/hooks/useTheme.ts`) - Component-level theme management
- **UI Components** (`components/ui/ThemeSwitcher.tsx`) - Theme toggle button
- **Provider** (`components/providers/ThemeProvider.tsx`) - Global theme initialization
- **Tailwind CSS** - Class-based dark mode with `dark:` utilities

## Theme Types

```typescript
// lib/types/theme.ts
type Theme = 'light' | 'dark' | 'system'

interface ThemeConfig {
  light: {
    background: string
    foreground: string
    card: string
    border: string
    primary: string
    accent: string
  }
  dark: {
    background: string
    foreground: string
    card: string
    border: string
    primary: string
    accent: string
  }
}

export const THEME_COLORS: ThemeConfig = {
  light: { /* colors */ },
  dark: { /* colors */ }
}
```

## State Management

The theme is managed using Zustand with localStorage persistence:

```typescript
// lib/stores/theme.store.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      systemDark: false,
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => {
        const current = get().theme
        const next = current === 'light' ? 'dark' : 'light'
        set({ theme: next })
      },
      // ... other methods
    }),
    { name: 'theme-storage' }
  )
)
```

**Key Features:**
- ✅ Persists to localStorage under `theme-storage` key
- ✅ Supports 'light', 'dark', and 'system' values
- ✅ 'system' mode respects OS preference
- ✅ Toggles between light and dark (skips system mode on toggle)

## Using the Theme Hook

```typescript
import { useTheme } from '@/lib/hooks/useTheme'

export function MyComponent() {
  const { theme, isDark, setTheme, toggleTheme, effectiveTheme } = useTheme()

  return (
    <div>
      {/* Current theme is light, dark, or system */}
      <p>Theme: {theme}</p>

      {/* Effective theme is the actual light or dark being used */}
      <p>Active Theme: {effectiveTheme}</p>

      {/* Boolean check if currently in dark mode */}
      {isDark && <p>Dark mode is active</p>}

      {/* Change theme */}
      <button onClick={() => setTheme('dark')}>Dark</button>
      <button onClick={() => setTheme('light')}>Light</button>
      <button onClick={() => setTheme('system')}>System</button>
      
      {/* Toggle between light/dark */}
      <button onClick={toggleTheme}>Toggle</button>
    </div>
  )
}
```

**Hook Returns:**
- `theme: 'light' | 'dark' | 'system'` - User's preference
- `isDark: boolean` - Is dark mode currently active?
- `effectiveTheme: 'light' | 'dark'` - Resolved theme (accounts for 'system')
- `setTheme(theme)` - Set theme preference
- `toggleTheme()` - Toggle between light/dark

## Theme Switcher Component

Add a theme toggle button to your layout:

```typescript
import { ThemeSwitcher } from '@/components/ui'

export function Header() {
  return (
    <header>
      <nav>
        {/* Other nav items */}
        <ThemeSwitcher />
      </nav>
    </header>
  )
}
```

The `ThemeSwitcher` component:
- Shows sun icon in light mode, moon icon in dark mode
- Toggles between light/dark on click
- Respects accessibility with aria-label
- Styled with Tailwind CSS

## Provider Integration

The `ThemeProvider` must wrap your app to initialize the theme properly:

```typescript
// app/layout.tsx
import { ThemeProvider } from '@/components/providers'

export default function RootLayout({ children }) {
  return (
    <html suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <I18nProvider>
            {children}
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
```

**Important:**
- ThemeProvider should wrap I18nProvider
- Use `suppressHydrationWarning` on the html tag to prevent SSR/client mismatches
- ThemeProvider handles hydration timing internally

## Tailwind Dark Mode

The project is configured with class-based dark mode:

```typescript
// tailwind.config.ts
const config: Config = {
  darkMode: 'class', // Uses 'dark' class on html element
  // ... other config
}
```

### Using Dark Mode Utilities

```typescript
// Light color, dark alternative
<div className="bg-white dark:bg-terminal-bg">
  <p className="text-gray-900 dark:text-gray-100">Text</p>
</div>

// With transitions
<button className="bg-blue-500 dark:bg-blue-600 transition-colors duration-200">
  Click me
</button>
```

## System Preference Detection

The theme hook automatically detects the OS preference:

```typescript
// lib/hooks/useTheme.ts
const mediaQuery = matchMedia('(prefers-color-scheme: dark)')
const isDarkMode = mediaQuery.matches // true if OS is dark mode

// Listen to changes
mediaQuery.addEventListener('change', (e) => {
  const isDark = e.matches
  // Update state
})
```

## Theme Colors

Both light and dark themes have consistent colors in `THEME_COLORS`:

```typescript
export const THEME_COLORS: ThemeConfig = {
  light: {
    background: '#FFFFFF',
    foreground: '#0A0E14',
    card: '#F5F5F5',
    border: '#E0E0E0',
    primary: '#9945FF',
    accent: '#00F0FF',
  },
  dark: {
    background: '#0A0E14',
    foreground: '#D4D4D4',
    card: '#1A1F29',
    border: '#2D3748',
    primary: '#9945FF',
    accent: '#00F0FF',
  },
}
```

## CSS Variables (Future Enhancement)

To use CSS variables for dynamic theming:

```css
/* app/globals.css */
:root {
  --color-background: #ffffff;
  --color-foreground: #000000;
}

html.dark {
  --color-background: #000000;
  --color-foreground: #ffffff;
}
```

```typescript
<div style={{ backgroundColor: 'var(--color-background)' }} />
```

## Common Patterns

### Conditional Rendering Based on Theme

```typescript
const { isDark } = useTheme()

return (
  <>
    {isDark ? <DarkIcon /> : <LightIcon />}
  </>
)
```

### Custom Styled Component with Theme

```typescript
function CustomCard() {
  const { isDark } = useTheme()
  
  return (
    <div className={cn(
      'p-4 rounded border',
      isDark 
        ? 'bg-terminal-surface border-terminal-border' 
        : 'bg-gray-100 border-gray-300'
    )}>
      Content
    </div>
  )
}
```

### Applying Theme to External Libraries

```typescript
import { ThemeProvider as StyledComponentsThemeProvider } from 'styled-components'
import { useTheme } from '@/lib/hooks/useTheme'
import { THEME_COLORS } from '@/lib/types/theme'

export function AppThemeProvider({ children }) {
  const { effectiveTheme } = useTheme()
  const colors = THEME_COLORS[effectiveTheme]
  
  return (
    <StyledComponentsThemeProvider theme={colors}>
      {children}
    </StyledComponentsThemeProvider>
  )
}
```

## File Locations

```
lib/
├── types/
│   └── theme.ts                 # Theme type definitions
├── stores/
│   └── theme.store.ts           # Zustand theme store
└── hooks/
    └── useTheme.ts              # React hook for theme
    
components/
├── ui/
│   └── ThemeSwitcher.tsx        # Theme toggle button
└── providers/
    ├── ThemeProvider.tsx        # Theme provider wrapper
    └── index.ts                 # Barrel export

app/
└── layout.tsx                   # Root layout with provider
```

## Testing the Theme System

```bash
# Start development server
npm run dev

# Check theme switching in Header
# Click the sun/moon icon to toggle

# Verify localStorage
localStorage.getItem('theme-storage')
# Returns: {"state":{"theme":"dark",...}}

# Check CSS class
document.documentElement.classList.contains('dark')
# Should be true in dark mode

# Check effective theme
const store = useThemeStore()
console.log(store.getState().getEffectiveTheme())
```

## Known Issues & Solutions

### Hydration Warnings
If you see "Extra attributes from server" warnings, ensure:
- ✅ `suppressHydrationWarning` is on html tag
- ✅ ThemeProvider is loaded before other providers
- ✅ Theme initialization happens in useEffect, not during render

### Flash of Wrong Theme
If you see a flash of the wrong theme on page load:
- ThemeProvider loads theme from localStorage before rendering
- Zustand persist middleware restores state before mount
- Consider adding a loading skeleton if needed

### Dark Mode Not Applying
Check:
- ✅ Tailwind config has `darkMode: 'class'`
- ✅ HTML element has `dark` class (check DevTools)
- ✅ Tailwind utilities use `dark:` prefix properly

## Future Enhancements

- [ ] CSS variables for custom component theming
- [ ] Per-component theme overrides
- [ ] Time-based auto theme switching (sunset/sunrise)
- [ ] Theme preview in settings page
- [ ] Multiple theme options (Solana purple, etc.)
- [ ] Export theme configuration to CSS-in-JS solutions

---

**Status**: ✅ Implemented  
**Last Updated**: February 2026
