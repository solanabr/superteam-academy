# ARQUITETURA

## Visao Geral

O projeto e um frontend Next.js 14 (App Router) com fronteira de servicos para facilitar a troca de stubs por integracao on-chain real.

## Arquitetura em Camadas

1. Camada de apresentacao
- `app/**`: rotas e paginas
- `components/**`: blocos de UI e componentes reutilizaveis

2. Camada de dominio
- `lib/types.ts`: modelos de dominio
- `lib/services/learning-progress-service.ts`: contrato principal de progresso

3. Camada de adaptadores
- `lib/services/local-learning-progress-service.ts`: comportamento local (stub)
- `lib/services/onchain-learning-progress-service.ts`: leitura on-chain + mutacoes via API backend
- `lib/learning/server-transaction-relay.ts`: relay de transacao (stub trocavel)
- `lib/learning/server-progress-store.ts`: persistencia de progresso no servidor (`.learning/store.json`)

4. Camada de conteudo
- `lib/cms/sanity-client.ts`: entrada de CMS
- `lib/data/courses.ts`: carregamento normalizado de cursos publicados

5. Camada transversal
- i18n: `lib/i18n/messages.ts`
- analytics: `lib/analytics.ts`, `components/providers/analytics-scripts.tsx`
- observabilidade: `instrumentation.ts`, `app/global-error.tsx`, `sentry.client.config.ts`

## Contrato de Servico

```ts
interface LearningProgressService {
  getProgress(userId: string, courseId: string): Promise<Progress>;
  enrollCourse(userId: string, courseId: string): Promise<void>;
  getEnrollment(userId: string, courseId: string): Promise<boolean>;
  completeLesson(userId: string, courseId: string, lessonIndex: number): Promise<void>;
  getXP(userId: string): Promise<number>;
  getStreak(userId: string): Promise<StreakData>;
  getLeaderboard(timeframe: 'weekly' | 'monthly' | 'alltime'): Promise<LeaderboardEntry[]>;
  getCredentials(wallet: PublicKey): Promise<Credential[]>;
}
```

## Fluxo de Dados

1. A rota carrega conteudo publicado do CMS.
2. O client resolve contexto da conta (registro + carteira).
3. O componente chama `learningProgressService`.
4. Mutacoes passam por `app/api/learning/*` com sessao autenticada.
5. A UI calcula valores derivados (exemplo: `level = floor(sqrt(xp / 100))`).
6. Eventos de produto seguem por `lib/analytics.ts`.

## Alinhamento do Escopo (Implementado vs Stub)

Implementado para leitura:

- conexao de carteira (UI)
- leitura de XP
- leitura de credenciais
- leaderboard por saldo

Stub com abstracao limpa:

- relay de inscricao em curso
- relay de conclusao de licao com recibo backend
- caminho de bitmap de conquistas (planejado)
- atualizacao de streak como efeito colateral de conclusao

## Cobertura de Rotas

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

## Pontos de Integracao On-chain

Ponto de troca:

- `lib/services/index.ts`

Integracoes previstas:

- operacoes de enrollment PDA
- fluxo `complete_lesson`
- leitura Token-2022 de XP nao-transferivel
- verificacao de cNFT via DAS/Bubblegum
- indexacao de leaderboard
- troca do relay stub por assinador backend real

## Estrutura de Pastas

- `app/`: rotas
- `components/`: UI e modulos de feature
- `lib/data/`: loaders de conteudo
- `lib/services/`: contratos e adaptadores
- `lib/learning/`: estado de progresso e relay backend
- `lib/i18n/`: idiomas e dicionarios
- `lib/cms/`: cliente CMS
- `sanity/`: schemas e conteudo de exemplo
