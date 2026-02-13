# Demo Video Script (3-5 min)

## 0:00 - 0:30 | Intro
- Nome do projeto: Superteam Academy Brasil LMS.
- Objetivo: LMS open-source para trilhas Solana com gamificacao e credenciais on-chain.

## 0:30 - 1:20 | Registro e Auth
- Abrir `/register`.
- Mostrar login por Google/GitHub e wallet.
- Mostrar linking adicional em `/settings`.

## 1:20 - 2:20 | Cursos e Licoes
- Abrir `/courses` e `/courses/[slug]`.
- Inscrever no curso.
- Abrir `/courses/[slug]/lessons/[id]`.
- Completar uma licao/desafio.

## 2:20 - 3:10 | Gamificacao
- Abrir `/dashboard`.
- Mostrar XP, nivel, streak e ranking.
- Abrir `/leaderboard` e trocar filtros.

## 3:10 - 4:00 | Credenciais On-chain
- Abrir `/profile`.
- Mostrar credenciais e verificacao.
- Abrir `/certificates/[id]` e link para Explorer.

## 4:00 - 4:40 | CMS + Arquitetura
- Mostrar `sanity/schemas/*` e `sanity/sample-course.json`.
- Mostrar `LearningProgressService` e `lib/services/index.ts` como swap point.

## 4:40 - 5:00 | Encerramento
- Recapitular requisitos entregues.
- Mostrar URL de demo e link da PR.
