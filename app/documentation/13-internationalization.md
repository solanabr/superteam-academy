# Internationalization (i18n)

## Table of Contents

- [i18n Architecture](#i18n-architecture)
- [Locale Routing](#locale-routing)
- [Translation System](#translation-system)
- [Translation Workflow](#translation-workflow)
- [Frontend Integration](#frontend-integration)

---

## i18n Architecture

```mermaid
graph TB
    subgraph Config["Configuration"]
        I18NEXUS["i18nexus.config.js<br/>Translation service config"]
        NEXT_INTL["next-intl v4.8<br/>Framework integration"]
        SCRIPTS["scripts/generate-translations.js<br/>Translation file generator"]
    end

    subgraph Routing["Locale Routing"]
        URL["URL: /{locale}/...<br/>/en/dashboard<br/>/pt/dashboard<br/>/es/dashboard"]
        SEGMENT["[locale] Dynamic Segment"]
        MIDDLEWARE["Locale Detection<br/>Accept-Language / cookie"]
    end

    subgraph Translations["Translation Files"]
        EN["English (en)"]
        PT["Portuguese BR (pt)"]
        ES["Spanish (es)"]
    end

    subgraph Components["Component Layer"]
        USE_T["useTranslations()<br/>Client components"]
        GET_T["getTranslations()<br/>Server components"]
        FORMAT["Format utilities<br/>Numbers, dates, relative time"]
    end

    Config --> Routing
    Routing --> Translations
    Translations --> Components
```

---

## Locale Routing

### URL Structure

| Locale | URL Pattern | Example |
|---|---|---|
| English | `/en/{path}` | `/en/dashboard` |
| Portuguese (BR) | `/pt/{path}` | `/pt/dashboard` |
| Spanish | `/es/{path}` | `/es/dashboard` |

### Route Architecture

```mermaid
graph TD
    ROOT["app/layout.tsx"]
    ROOT --> LOCALE["[locale]/layout.tsx<br/>IntlProvider"]
    LOCALE --> PAGE["page.tsx<br/>Landing page"]
    LOCALE --> ROUTES["(routes)/<br/>Authenticated pages"]
    LOCALE --> OFFLINE["offline/<br/>PWA fallback"]

    ROUTES --> DASH["dashboard/"]
    ROUTES --> COURSES["courses/"]
    ROUTES --> PROFILE["profile/"]
    ROUTES --> SETTINGS["settings/"]
    ROUTES --> OTHER["...13 route groups"]
```

### Locale Detection Flow

```mermaid
flowchart TD
    REQUEST[Incoming Request] --> CHECK_URL{Locale in URL?}
    CHECK_URL -->|Yes| USE_URL[Use URL locale]
    CHECK_URL -->|No| CHECK_COOKIE{Locale cookie?}
    CHECK_COOKIE -->|Yes| USE_COOKIE[Use cookie locale]
    CHECK_COOKIE -->|No| CHECK_HEADER{Accept-Language?}
    CHECK_HEADER -->|Yes| MATCH{Supported locale?}
    MATCH -->|Yes| USE_HEADER[Use header locale]
    MATCH -->|No| DEFAULT[Default: en]
    CHECK_HEADER -->|No| DEFAULT
    USE_URL --> RENDER[Render page]
    USE_COOKIE --> RENDER
    USE_HEADER --> RENDER
    DEFAULT --> RENDER
```

---

## Translation System

### Supported Locales

| Locale Code | Language | Status |
|---|---|---|
| `en` | English | Primary |
| `pt` | Portuguese (Brazil) | Supported |
| `es` | Spanish | Supported |

### Translation File Structure

```
context/
  i18n/                    # i18n configuration
    {locale}/              # Per-locale message bundles
      common.json          # Shared translations
      dashboard.json       # Dashboard page
      courses.json         # Course pages
      settings.json        # Settings page
      ...
```

---

## Translation Workflow

### Build-Time Generation

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant Script as generate-translations.js
    participant I18Nexus as i18nexus CLI
    participant Files as Translation Files

    Dev->>Script: npm run predev / npm run prebuild
    Script->>I18Nexus: Pull latest translations
    I18Nexus-->>Script: Translation data (JSON)
    Script->>Files: Write locale/{lang}/**.json files
    Script-->>Dev: Translations ready

    Note over Script: Runs automatically before dev and build
```

### CLI Commands

| Command | Description |
|---|---|
| `npm run i18n:pull` | Pull translations from i18nexus |
| `npm run i18n:generate` | Generate translation files from pulled data |
| `npm run predev` | Auto-runs generate before `next dev` |
| `npm run prebuild` | Auto-runs generate before `next build` |

---

## Frontend Integration

### Component Usage

```mermaid
graph LR
    subgraph ServerComponents["Server Components"]
        SC["getTranslations('namespace')"]
    end

    subgraph ClientComponents["Client Components"]
        CC["useTranslations('namespace')"]
    end

    subgraph Provider["NextIntlClientProvider"]
        MSG["Messages bundle"]
        LOC["Locale string"]
    end

    Provider --> ServerComponents
    Provider --> ClientComponents
```

### Usage Patterns

| Pattern | Context | Function |
|---|---|---|
| `useTranslations()` | Client components | Hook for reactive translations |
| `getTranslations()` | Server components | Async translation loader |
| `{t('key')}` | JSX | Render translated string |
| `{t('key', { count: 5 })}` | JSX | Translations with interpolation |
| Locale switcher | UI Component | Language toggle in navbar |

### Language Switcher Component

```mermaid
graph LR
    SWITCH["Language Switcher<br/>components/i18n/"]
    
    SWITCH --> EN["EN"]
    SWITCH --> PT["PT"]
    SWITCH --> ES["ES"]

    EN --> REDIRECT_EN["/{en}/current-path"]
    PT --> REDIRECT_PT["/{pt}/current-path"]
    ES --> REDIRECT_ES["/{es}/current-path"]
```
