# Guia do CMS — Superteam Academy

## Objetivo

O conteúdo dos cursos (módulos, aulas, challenges) deve ser editável via Headless CMS (Sanity, Strapi, Contentful ou similar). Este guia descreve o schema esperado e o fluxo de publicação.

## Schema de conteúdo (conceitual)

### Curso

- **slug** (string, único)
- **title**, **description**, **longDescription**
- **difficulty**: beginner | intermediate | advanced
- **duration**: short | medium | long
- **totalDurationMinutes**, **xpTotal**
- **thumbnail** (imagem/URL)
- **instructor**: nome, avatar, role
- **track** (string, ex.: "Solana Fundamentals", "DeFi")
- **modules** (array de Módulo)

### Módulo

- **id**, **title**
- **lessons** (array de Aula)

### Aula

- **id**, **title**, **slug**
- **type**: content | challenge
- **durationMinutes**, **xpReward**
- **content** (Markdown, opcional; usado quando type = content)
- **challenge** (objeto, opcional; usado quando type = challenge):
  - **prompt** (texto)
  - **starterCode** (string)
  - **language**: rust | typescript | json
  - **testCases**: array de { input, expected }

## Editor visual

- Suporte a Markdown e blocos de código no conteúdo.
- Gerenciamento de mídia (imagens, vídeos) para aulas.
- Workflow: rascunho → revisão → publicado.

## Dados mock atuais

Enquanto o CMS não estiver conectado, o frontend usa `src/data/courses.ts`: array de cursos com a estrutura acima. Ao integrar o CMS:

1. Substituir a importação de `courses` por uma função que busca do CMS (API ou SDK).
2. Manter os tipos em `src/data/courses.ts` (ou mover para `src/types/course.ts`) para garantir compatibilidade.

## Publicação

- Publicar curso = disponível em `/courses/[slug]`.
- Publicar aula = disponível em `/courses/[slug]/lessons/[lessonSlug]`.
- Despublicar = remover da listagem e retornar 404 nas rotas correspondentes.
