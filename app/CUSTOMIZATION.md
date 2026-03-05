# Customização — Superteam Academy

## Tema (dark/light)

- **Tailwind**: variáveis CSS em `src/app/globals.css` (`:root` e `.light`).
- **Tokens**: `--background`, `--foreground`, `--primary`, `--card`, `--muted`, `--accent`, `--border`, `--ring`, `--radius`.
- Toggle no header via `next-themes`; preferência persistida em `localStorage`.

Para alterar cores da marca: edite `--primary` e `--accent` em `globals.css` e, se quiser, as cores `brand` e `solana` em `tailwind.config.ts`.

## Idiomas (i18n)

- **Locales**: PT (padrão), ES, EN em `src/i18n/routing.ts`.
- **Strings**: arquivos em `messages/pt.json`, `messages/es.json`, `messages/en.json`. Chaves por namespace: `common`, `landing`, `courses`, `course`, `lesson`, `dashboard`, `profile`, `leaderboard`, `settings`, `certificate`.
- **Troca de idioma**: header (dropdown) usa `Link` de `@/i18n/navigation` com prop `locale`.

Para adicionar um idioma:

1. Incluir o locale em `routing.locales` em `src/i18n/routing.ts`.
2. Criar `messages/<locale>.json` com as mesmas chaves.
3. Incluir opção no dropdown do header (componente `Header`).

## Gamificação

- **XP e nível**: `src/lib/utils.ts` — `xpToLevel`, `levelToXp`, `xpProgressInLevel`. Fórmula: Level = floor(sqrt(xp / 100)).
- **Streaks e achievements**: definidos no tipo `StreakData` e no serviço; hoje stub. No on-chain, streaks vêm como efeito de `complete_lesson`; achievements usam bitmap no Learner PDA.
- **Leaderboard**: `LearningProgressService.getLeaderboard(timeframe)`. Stub retorna array vazio ou mock; produção = indexar saldos de XP (token soulbound).

Para novos tipos de conquista ou regras de XP, estender os tipos em `src/types/learning.ts` e a lógica no serviço (e depois no programa Anchor).
