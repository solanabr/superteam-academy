# @superteam-academy/i18n

Internationalization package for the Superteam Academy LMS platform. Built with Next.js 14+ and next-intl for comprehensive multi-language support.

## Features

- **Multi-language Support**: English (en), Portuguese Brazil (pt-BR), Spanish (es)
- **Next.js Integration**: Seamless integration with Next.js App Router
- **Type Safety**: Full TypeScript support with type-safe translation keys
- **Developer Tools**: Translation validation, extraction, and management utilities
- **SSR Ready**: Server-side rendering support with metadata generation
- **Middleware**: Automatic locale detection and routing

## Installation

```bash
pnpm add @superteam-academy/i18n
```

## Quick Start

### 1. Configure Next.js

Add to your `next.config.js`:

```js
const { withNextIntl } = require('@superteam-academy/i18n/config');

module.exports = withNextIntl({
  // Your Next.js config
});
```

### 2. Add Middleware

Create `middleware.ts` in your project root:

```ts
export { default } from '@superteam-academy/i18n/middleware';
```

### 3. Use in Components

```tsx
import { useTranslations } from '@superteam-academy/i18n';

export default function HomePage() {
  const t = useTranslations('common');

  return (
    <div>
      <h1>{t('welcome')}</h1>
      <p>{t('description')}</p>
    </div>
  );
}
```

## API Reference

### Configuration

```ts
import { locales, defaultLocale, withNextIntl } from '@superteam-academy/i18n/config';
```

### Translation Hooks

```ts
import { useTranslations, t } from '@superteam-academy/i18n';

// Client component
const t = useTranslations('common');

// Server component
const t = await getTranslations('common');
```

### Translation Keys

Pre-defined constants for type safety:

```ts
import { COMMON_KEYS, NAVIGATION_KEYS, AUTH_KEYS } from '@superteam-academy/i18n/utils';

const loadingText = t(COMMON_KEYS.LOADING);
```

### Server-Side Rendering

```ts
import { generatePageMetadata, createTranslationContext } from '@superteam-academy/i18n/ssr';

// Generate metadata
export async function generateMetadata({ params: { locale } }) {
  return generatePageMetadata(locale, 'common', 'title', 'description');
}

// Create translation context
const context = await createTranslationContext(locale);
```

## Translation Management

### Validation

Validate translation files for completeness:

```bash
pnpm validate
```

### Extraction

Extract translation keys from source code:

```bash
pnpm extract
```

### Check Missing Keys

Find missing translations:

```bash
pnpm check-missing
```

## Translation Structure

```
messages/
├── en.json      # English translations
├── pt-BR.json  # Portuguese (Brazil)
└── es.json     # Spanish
```

### Key Format

Translation keys use dot notation:

```json
{
  "common": {
    "loading": "Loading...",
    "error": "An error occurred"
  },
  "navigation": {
    "home": "Home",
    "courses": "Courses"
  }
}
```

## Supported Languages

| Language | Code | Status |
|----------|------|--------|
| English | `en` | Complete |
| Portuguese (Brazil) | `pt-BR` | Complete |
| Spanish | `es` | Complete |

## Development

### Building

```bash
pnpm build
```

### Type Checking

```bash
pnpm typecheck
```

### Linting

```bash
pnpm lint
pnpm lint:fix
```

## Contributing

1. Add new translation keys to all language files
2. Run validation: `pnpm validate`
3. Update types if needed
4. Test in development environment

## License

MIT © Superteam Academy
