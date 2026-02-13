# PERSONALIZACAO

## Customizacao de Tema

Tokens de design:

- `app/globals.css`
- `tailwind.config.ts`

Classes utilitarias compartilhadas:

- `.panel`
- `.panel-soft`
- `.btn-primary`
- `.btn-secondary`
- `.chip`
- `.input-field`

## Adicionar Novo Idioma

1. Extender `Locale` em `lib/types.ts`.
2. Adicionar dicionario em `lib/i18n/messages.ts`.
3. Incluir opcao no seletor em `components/i18n/language-switcher.tsx`.
4. Garantir que nao restou texto hardcoded em componentes/paginas.

Validacao:

```bash
npm run lint
npm run typecheck
```

## Estender Gamificacao

Pontos principais:

- `lib/services/learning-progress-service.ts`
- `lib/services/local-learning-progress-service.ts`
- `lib/services/hybrid-learning-progress-service.ts`
- telas de consumo:
  - `components/dashboard/dashboard-client.tsx`
  - `components/leaderboard/leaderboard-client.tsx`
  - `components/profile/profile-client.tsx`

Exemplos:

- desafios diarios
- eventos sazonais
- streak freeze
- rankings por trilha

## Trocar Stub por Integracao On-chain Real

1. Criar `lib/services/onchain-learning-progress-service.ts`.
2. Implementar `LearningProgressService`.
3. Exportar em `lib/services/index.ts`.
4. Manter o contrato para evitar mudancas em rotas/componentes.
