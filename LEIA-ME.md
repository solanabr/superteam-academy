# LEIA-ME

Frontend open-source do LMS da Superteam Academy Brasil, alinhado com o escopo do bounty.

## Pilha Tecnica

- Next.js 14 (App Router)
- TypeScript (strict mode)
- Tailwind CSS com tokens de design
- Solana Wallet Adapter (multi-carteira)
- Monaco Editor (desafios de codigo)
- Sanity CMS (schemas e leitura de cursos)
- Analytics (GA4, Hotjar, Clarity, PostHog)
- Sentry

## Alinhamento com o Escopo

Paginas principais implementadas:

- `/`
- `/courses`
- `/courses/[slug]`
- `/courses/[slug]/lessons/[id]`
- `/dashboard`
- `/profile`
- `/profile/[username]`
- `/leaderboard`
- `/settings`
- `/certificates/[id]`

Implementado para leitura Devnet/on-chain:

- autenticacao de carteira (UI multi-carteira)
- leitura de XP
- leitura/verificacao de credenciais
- leaderboard por saldo indexado

Stub com interface limpa (troca futura por on-chain real):

- relay de inscricao em `/api/learning/enroll`
- relay de conclusao em `/api/learning/complete-lesson`
- persistencia de progresso em `/api/learning/progress`
- estado de streak/XP em `/api/learning/streak` e `/api/learning/xp`

## Setup Local

1. Instalar dependencias:

```bash
npm install
```

2. Criar env local:

```bash
cp .env.example .env.local
```

3. Rodar app:

```bash
npm run dev
```

4. Validar qualidade:

```bash
npm run lint
npm run typecheck
```

## Variaveis de Ambiente

Use `.env.example` como base.

Grupos principais:

- Solana RPC
- Leitura on-chain (XP, DAS, leaderboard)
- Autenticacao (AUTH_SECRET + Google/GitHub OAuth)
- Backend de progresso (`LEARNING_STORE_PATH`)
- Analytics
- Sentry
- CMS (Sanity)

## Deploy

- Vercel ou Netlify
- preview deploy em PR
- producao via branch principal

## Checklist de Entrega

- Link da PR
- URL de demo
- Video de 3-5 minutos
- Post no Twitter/X com `@SuperteamBR`
