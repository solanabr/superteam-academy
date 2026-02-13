# Submission Package (Superteam Brasil LMS)

Este arquivo deixa a entrega pronta para o envio no Superteam Earn.

## 1) Status Atual

- [x] 10 paginas principais implementadas
- [x] i18n PT-BR / ES / EN
- [x] tema claro/escuro
- [x] auth (wallet + Google + GitHub)
- [x] integracao CMS (Sanity schema + sample)
- [x] analytics hooks (GA4, Hotjar, Clarity, PostHog)
- [x] Sentry integrado
- [x] build de producao passando (`npm run build`)
- [ ] testes E2E e Lighthouse (planejado para amanha)

## 2) Checklist de Entrega do Bounty

- [ ] PR para `github.com/solanabr/superteam-academy`
- [ ] URL da demo (Vercel/Netlify)
- [ ] Video de 3-5 minutos
- [ ] Post no Twitter/X marcando `@SuperteamBR`

## 3) Template de Submissao (copiar e preencher)

- PR Link: `...`
- Live Demo URL: `...`
- Demo Video URL (3-5 min): `...`
- Twitter/X Post URL: `...`

## 4) PR Description (template)

```md
## Superteam Brasil LMS dApp Submission

### Scope Delivered
- 10 required routes fully implemented
- Wallet + Google + GitHub auth with account linking
- i18n (PT-BR, ES, EN) with externalized UI strings
- Gamification surface (XP, level, streak, leaderboard)
- On-chain read integrations (XP token accounts + cNFT/DAS)
- Backend learning API with clean service abstraction for on-chain swap
- Sanity CMS schema + sample content
- Analytics hooks (GA4, Hotjar/Clarity/PostHog) + Sentry

### Architecture Notes
- `LearningProgressService` contract maintained
- `lib/services/index.ts` is the integration swap point
- `app/api/learning/*` encapsulates enrollment/completion/progress mutations

### Quality
- `npm run typecheck` passing
- `npm run lint` passing
- `npm run build` passing

### Pending/Planned
- E2E and Lighthouse final run (to be attached after run)
```

## 5) Deploy (Vercel) rapido

1. Importar repositorio no Vercel.
2. Definir todas as variaveis de ambiente (`.env.example`).
3. Garantir build command: `npm run build`.
4. Publicar e validar:
   - `/register`
   - `/courses`
   - `/dashboard`
   - `/leaderboard`
   - `/certificates/[id]`

## 6) Entrega no Superteam Earn

Cole os 4 links obrigatorios no formulario final.
