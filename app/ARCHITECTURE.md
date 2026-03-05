# Arquitetura — Superteam Academy Web

## Visão geral

O frontend é uma aplicação Next.js 14 (App Router) que consome:

1. **Conteúdo**: CMS (Sanity/Strapi/Contentful) ou, em MVP, dados estáticos em `src/data/courses.ts`.
2. **Progresso e gamificação**: serviço abstrato `LearningProgressService`. Implementação atual: stub com localStorage; alvo: programa Anchor + indexer.

## Fluxo de dados

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Browser   │────▶│  Next.js (App)   │────▶│ LearningProgress│
│  (Wallet)   │     │  + Wallet Adapter│     │ Service (stub)   │
└─────────────┘     └──────────────────┘     └────────┬────────┘
                               │                        │
                               ▼                        ▼
                      ┌──────────────────┐     ┌─────────────────┐
                      │  CMS / Mock      │     │  On-chain       │
                      │  (courses)       │     │  (futuro)       │
                      └──────────────────┘     └─────────────────┘
```

## Estrutura de pastas

- `src/app/` — App Router: `(main)/` agrupa rotas com header; `layout.tsx` raiz aplica providers (theme, wallet, i18n).
- `src/components/` — `header`, `theme-provider`, `wallet-provider`, `code-editor`, `ui/` (Button, Card, Progress, Toast, etc.).
- `src/services/learning-progress.ts` — implementação do `LearningProgressService` (stub).
- `src/types/learning.ts` — tipos e interface do serviço de progresso.
- `src/i18n/` — `request.ts` (getRequestConfig), `routing.ts` (locales), `navigation.ts` (Link/useRouter com locale).
- `messages/` — JSON de tradução (pt, es, en).

## Pontos de integração on-chain

Ao conectar o programa Anchor (superteam-academy):

1. **XP**: ler saldo do token soulbound (Token-2022 NonTransferable) da carteira do usuário. Nível = `floor(sqrt(xp / 100))`.
2. **Credenciais**: listar cNFTs (Metaplex Bubblegum) do usuário via Helius DAS ou indexer; exibir em `/profile` e `/certificates/[id]`.
3. **Leaderboard**: indexar saldos de XP (mesmo token) por período (semanal/mensal/todo tempo); expor via API ou estático.
4. **Lesson completion / enrollment**: hoje stub (localStorage). No futuro: transações assinadas pelo backend ou pelo usuário (complete_lesson, enroll).

## Componentes críticos

- **Header**: navegação, seletor de idioma, tema, WalletMultiButton.
- **Lesson view**: layout split (conteúdo Markdown + Monaco); botões Run/Submit para challenges; integração com `completeLesson` (stub).
- **Dashboard**: XP, nível, streak, cursos em progresso; dados do `LearningProgressService` e, quando houver, wallet para XP on-chain.
- **Profile**: credenciais (cNFTs), conquistas, cursos concluídos.

## Performance

- Lighthouse: Performance 90+, Accessibility 95+, Best Practices 95+, SEO 90+.
- Core Web Vitals: LCP &lt; 2.5s, FID &lt; 100ms, CLS &lt; 0.1.
- Práticas: otimização de imagens (next/image), code splitting, lazy load do Monaco, geração estática onde possível.
