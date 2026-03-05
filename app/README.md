# Superteam Academy — Web (LMS Frontend)

Plataforma de ensino para desenvolvedores Solana: cursos interativos, credenciais on-chain e gamificação. Inspirada em Codecademy e Cyfrin Updraft.

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Linguagem**: TypeScript (strict)
- **Estilos**: Tailwind CSS + design tokens (dark/light)
- **Componentes**: Radix UI primitives
- **Auth**: Solana Wallet Adapter (multi-wallet) + stubs para Google/GitHub
- **i18n**: next-intl (PT-BR, ES, EN)
- **Code Editor**: Monaco Editor
- **Deploy**: Vercel/Netlify

## Setup local

```bash
# Na raiz do monorepo
yarn install

# Rodar em desenvolvimento
yarn dev
```

Acesse [http://localhost:3001](http://localhost:3001).

### ChunkLoadError (timeout ao carregar app/layout)

Se aparecer `ChunkLoadError: Loading chunk app/layout failed`, tente:

1. **Limpar cache e reiniciar**: `yarn dev:fresh` (ou `cd apps/web && yarn dev:fresh`)
2. **Recarregar a página** — geralmente resolve na segunda tentativa
3. **Aguardar** o servidor terminar de compilar antes de abrir o navegador

## Variáveis de ambiente

Crie `.env.local` em `apps/web/`:

```env
# Solana RPC (Devnet por padrão)
NEXT_PUBLIC_SOLANA_RPC=https://api.devnet.solana.com

# Opcional: GA4, Sentry, PostHog
NEXT_PUBLIC_GA_MEASUREMENT_ID=
NEXT_PUBLIC_SENTRY_DSN=
NEXT_PUBLIC_POSTHOG_KEY=
```

## Estrutura principal

- `src/app/(main)/` — páginas com header (landing, courses, dashboard, etc.)
- `src/components/` — UI reutilizável e providers (theme, wallet)
- `src/services/` — `LearningProgressService` (stub localStorage; trocar por on-chain)
- `src/types/learning.ts` — interfaces de progresso, XP, streaks, credentials
- `src/data/courses.ts` — cursos mock (substituir por CMS)
- `messages/` — traduções PT/ES/EN

## Serviço de progresso

A interface `LearningProgressService` em `src/types/learning.ts` define o contrato para:

- `getProgress`, `completeLesson`
- `getXP`, `getStreak`
- `getLeaderboard`
- `getCredentials(wallet)`

A implementação atual em `src/services/learning-progress.ts` usa **localStorage**. Para produção, troque por chamadas ao programa on-chain (superteam-academy) e/ou indexer (Helius DAS para cNFTs e XP).

## Documentação adicional

- [ARCHITECTURE.md](./ARCHITECTURE.md) — arquitetura e fluxo de dados
- [CMS_GUIDE.md](./CMS_GUIDE.md) — schema de cursos e conteúdo
- [CUSTOMIZATION.md](./CUSTOMIZATION.md) — tema, idiomas e gamificação

## Licença

MIT
