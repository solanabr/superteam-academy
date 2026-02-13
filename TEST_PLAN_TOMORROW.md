# Test Plan (Amanha)

## 1) E2E

```bash
npm run test:e2e
```

Fluxos criticos para validar:
- registro/login (Google/GitHub/wallet)
- link de carteira em `/settings`
- inscricao em curso
- conclusao de licao
- atualizacao dashboard/leaderboard
- visualizacao de certificado

## 2) Lighthouse

Rodar em producao (deploy):
- `/`
- `/courses`
- `/dashboard`
- `/leaderboard`

Metas:
- Performance 90+
- Accessibility 95+
- Best Practices 95+
- SEO 90+

## 3) Regressao rapida

```bash
npm run typecheck
npm run lint
npm run build
```

## 4) Evidencias para anexar

- print dos scores Lighthouse
- log do E2E
- confirmacao final dos 4 links da submissao
