# Bounty 100/100 — Close All Gaps

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Close the 3 identified gaps (OAuth UX, seed courses, Lighthouse readiness) to bring the bounty score from ~92/100 to 100/100.

**Architecture:** Add 4 more seed courses to `seed-data.ts` + update mock-client to serve them. Conditionally register OAuth providers only when env vars exist and hide sign-in buttons when providers are unavailable. Add performance meta/hints for Lighthouse.

**Tech Stack:** Next.js 15, NextAuth 5 beta, Zustand, Sanity mock-client, Vitest

---

## Task 1: Add 4 New Seed Tracks

**Files:**
- Modify: `app/src/lib/sanity/seed-data.ts` (after `seedTrack` export ~line 76)

**Step 1: Add DeFi, NFT, and Security tracks**

After the existing `seedTrack` constant, add:

```typescript
export const seedTrackDefi: SeedTrack = {
  _id: 'track-defi',
  trackId: '2',
  name: 'DeFi',
  description: 'Build decentralized finance protocols on Solana — token swaps, lending, and liquidity pools.',
  icon: 'defi',
  color: '#14F195',
};

export const seedTrackNft: SeedTrack = {
  _id: 'track-nft',
  trackId: '3',
  name: 'NFT & Metaplex',
  description: 'Create, manage, and trade NFT collections using Metaplex Core and Bubblegum.',
  icon: 'nft',
  color: '#FFD700',
};

export const seedTrackSecurity: SeedTrack = {
  _id: 'track-security',
  trackId: '4',
  name: 'Security',
  description: 'Master smart contract auditing, vulnerability detection, and security best practices for Solana programs.',
  icon: 'security',
  color: '#FF6B6B',
};

export const seedAllTracks: SeedTrack[] = [seedTrack, seedTrackDefi, seedTrackNft, seedTrackSecurity];
```

**Step 2: Run tests to verify nothing broke**

Run: `cd app && pnpm test:run`
Expected: All existing tests pass (no regression)

**Step 3: Commit**

```bash
git add app/src/lib/sanity/seed-data.ts
git commit -m "feat: add DeFi, NFT, and Security seed tracks"
```

---

## Task 2: Add 4 New Seed Courses (Raw)

**Files:**
- Modify: `app/src/lib/sanity/seed-data.ts` (after `seedCourseRaw` ~line 1702)

**Step 1: Add 4 course raw objects**

After `seedCourseRaw`, add these courses matching the landing page featured courses:

```typescript
export const seedCourseDefi: SeedCourseRaw = {
  _id: 'course-defi-201',
  courseId: 'defi-201',
  title: {
    en: 'Building a DEX with Anchor',
    pt: 'Construindo uma DEX com Anchor',
    es: 'Construyendo una DEX con Anchor',
  },
  description: {
    en: 'Create a fully functional decentralized exchange with order books and AMM pools on Solana.',
    pt: 'Crie uma exchange descentralizada funcional com livros de ordens e pools AMM na Solana.',
    es: 'Crea un exchange descentralizado funcional con libros de ordenes y pools AMM en Solana.',
  },
  thumbnail: { asset: { _ref: 'image-defi201-thumb' } },
  difficulty: 'intermediate',
  xpPerLesson: 75,
  lessonCount: 8,
  skills: ['Anchor', 'Token Swaps', 'AMM', 'Liquidity Pools', 'SPL Token'],
  prerequisites: ['solana-101'],
  track: {
    _id: 'track-defi',
    trackId: '2',
    name: 'DeFi',
    icon: 'defi',
    color: '#14F195',
  },
};

export const seedCourseNft: SeedCourseRaw = {
  _id: 'course-nft-201',
  courseId: 'nft-201',
  title: {
    en: 'NFT Collections with Metaplex',
    pt: 'Coleções NFT com Metaplex',
    es: 'Colecciones NFT con Metaplex',
  },
  description: {
    en: 'Mint, manage, and trade NFT collections using the Metaplex Core standard and Bubblegum compression.',
    pt: 'Crie, gerencie e negocie coleções NFT usando o padrão Metaplex Core e compressão Bubblegum.',
    es: 'Crea, gestiona e intercambia colecciones NFT usando el estándar Metaplex Core y compresión Bubblegum.',
  },
  thumbnail: { asset: { _ref: 'image-nft201-thumb' } },
  difficulty: 'intermediate',
  xpPerLesson: 75,
  lessonCount: 7,
  skills: ['Metaplex Core', 'cNFTs', 'Bubblegum', 'Token Metadata', 'Royalties'],
  prerequisites: ['solana-101'],
  track: {
    _id: 'track-nft',
    trackId: '3',
    name: 'NFT & Metaplex',
    icon: 'nft',
    color: '#FFD700',
  },
};

export const seedCourseSecurity: SeedCourseRaw = {
  _id: 'course-sec-301',
  courseId: 'sec-301',
  title: {
    en: 'Smart Contract Auditing',
    pt: 'Auditoria de Contratos Inteligentes',
    es: 'Auditoría de Contratos Inteligentes',
  },
  description: {
    en: 'Master security patterns and learn to identify common Solana program vulnerabilities like reentrancy, PDA misuse, and unchecked math.',
    pt: 'Domine padrões de segurança e aprenda a identificar vulnerabilidades comuns em programas Solana como reentrância, uso incorreto de PDAs e matemática não verificada.',
    es: 'Domina patrones de seguridad y aprende a identificar vulnerabilidades comunes en programas Solana como reentrada, mal uso de PDAs y matemáticas no verificadas.',
  },
  thumbnail: { asset: { _ref: 'image-sec301-thumb' } },
  difficulty: 'advanced',
  xpPerLesson: 100,
  lessonCount: 8,
  skills: ['Security Auditing', 'Vulnerability Detection', 'Reentrancy', 'Access Control', 'Integer Overflow'],
  prerequisites: ['solana-101'],
  track: {
    _id: 'track-security',
    trackId: '4',
    name: 'Security',
    icon: 'security',
    color: '#FF6B6B',
  },
};

export const seedCourseTokenExt: SeedCourseRaw = {
  _id: 'course-token-201',
  courseId: 'token-201',
  title: {
    en: 'Token Extensions Deep Dive',
    pt: 'Token Extensions em Profundidade',
    es: 'Token Extensions en Profundidad',
  },
  description: {
    en: 'Explore Token-2022 extensions: transfer hooks, confidential transfers, permanent delegates, and non-transferable tokens.',
    pt: 'Explore extensões Token-2022: hooks de transferência, transferências confidenciais, delegados permanentes e tokens não transferíveis.',
    es: 'Explora extensiones Token-2022: hooks de transferencia, transferencias confidenciales, delegados permanentes y tokens no transferibles.',
  },
  thumbnail: { asset: { _ref: 'image-token201-thumb' } },
  difficulty: 'advanced',
  xpPerLesson: 100,
  lessonCount: 6,
  skills: ['Token-2022', 'Transfer Hooks', 'Confidential Transfers', 'Mint Extensions', 'Permanent Delegates'],
  prerequisites: ['solana-101'],
  track: {
    _id: 'track-solana-core',
    trackId: '1',
    name: 'Solana Core',
    icon: 'solana',
    color: '#9945FF',
  },
};

/** All seed courses in raw format (used by allCoursesQuery mock). */
export const seedAllCoursesRaw: SeedCourseRaw[] = [
  seedCourseRaw,
  seedCourseDefi,
  seedCourseNft,
  seedCourseSecurity,
  seedCourseTokenExt,
];
```

**Step 2: Run tests**

Run: `cd app && pnpm test:run`
Expected: Existing tests pass

**Step 3: Commit**

```bash
git add app/src/lib/sanity/seed-data.ts
git commit -m "feat: add 4 seed courses across DeFi, NFT, Security, and Token tracks"
```

---

## Task 3: Add Course Detail Data for New Courses

**Files:**
- Modify: `app/src/lib/sanity/seed-data.ts` (after `seedCourseDetail` ~line 1814)

**Step 1: Add detail objects with modules for each new course**

Each course gets 2 modules. We don't need full lesson content (not lesson-level browsable without Sanity) — just the module/lesson metadata structure:

```typescript
export const seedCourseDetailDefi: SeedCourseDetail = {
  ...seedCourseDefi,
  credentialImage: null,
  modules: [
    {
      _id: 'defi-module-0',
      title: { en: 'Token Fundamentals', pt: 'Fundamentos de Tokens', es: 'Fundamentos de Tokens' },
      description: { en: 'SPL Token, Token-2022, and token account architecture.', pt: 'SPL Token, Token-2022 e arquitetura de contas de token.', es: 'SPL Token, Token-2022 y arquitectura de cuentas de token.' },
      order: 0,
      lessons: [
        { _id: 'defi-l0', title: { en: 'SPL Token Program', pt: 'Programa SPL Token', es: 'Programa SPL Token' }, lessonIndex: 0, xpReward: 75, hasCodeEditor: true, isChallenge: false, language: 'rust' },
        { _id: 'defi-l1', title: { en: 'Creating a Token Mint', pt: 'Criando um Token Mint', es: 'Creando un Token Mint' }, lessonIndex: 1, xpReward: 75, hasCodeEditor: true, isChallenge: false, language: 'typescript' },
        { _id: 'defi-l2', title: { en: 'Token Accounts & ATAs', pt: 'Contas de Token e ATAs', es: 'Cuentas de Token y ATAs' }, lessonIndex: 2, xpReward: 75, hasCodeEditor: false, isChallenge: false, language: null },
        { _id: 'defi-l3', title: { en: 'Building a Swap Pool', pt: 'Construindo um Pool de Swap', es: 'Construyendo un Pool de Swap' }, lessonIndex: 3, xpReward: 75, hasCodeEditor: true, isChallenge: false, language: 'rust' },
      ],
    },
    {
      _id: 'defi-module-1',
      title: { en: 'AMM & Orderbook', pt: 'AMM e Livro de Ordens', es: 'AMM y Libro de Ordenes' },
      description: { en: 'Build automated market makers and order book mechanics.', pt: 'Construa market makers automáticos e mecânicas de livro de ordens.', es: 'Construye market makers automatizados y mecánicas de libro de órdenes.' },
      order: 1,
      lessons: [
        { _id: 'defi-l4', title: { en: 'Constant Product AMM', pt: 'AMM de Produto Constante', es: 'AMM de Producto Constante' }, lessonIndex: 4, xpReward: 75, hasCodeEditor: true, isChallenge: false, language: 'rust' },
        { _id: 'defi-l5', title: { en: 'Liquidity Providers', pt: 'Provedores de Liquidez', es: 'Proveedores de Liquidez' }, lessonIndex: 5, xpReward: 75, hasCodeEditor: true, isChallenge: false, language: 'rust' },
        { _id: 'defi-l6', title: { en: 'Price Oracles', pt: 'Oráculos de Preço', es: 'Oráculos de Precio' }, lessonIndex: 6, xpReward: 75, hasCodeEditor: false, isChallenge: false, language: null },
        { _id: 'defi-l7', title: { en: 'Challenge: Build a Mini DEX', pt: 'Desafio: Construa uma Mini DEX', es: 'Desafío: Construye una Mini DEX' }, lessonIndex: 7, xpReward: 75, hasCodeEditor: true, isChallenge: true, language: 'rust' },
      ],
    },
  ],
};

export const seedCourseDetailNft: SeedCourseDetail = {
  ...seedCourseNft,
  credentialImage: null,
  modules: [
    {
      _id: 'nft-module-0',
      title: { en: 'Metaplex Core', pt: 'Metaplex Core', es: 'Metaplex Core' },
      description: { en: 'Understanding the Metaplex Core standard for NFTs.', pt: 'Compreendendo o padrão Metaplex Core para NFTs.', es: 'Comprendiendo el estándar Metaplex Core para NFTs.' },
      order: 0,
      lessons: [
        { _id: 'nft-l0', title: { en: 'NFT Fundamentals', pt: 'Fundamentos de NFT', es: 'Fundamentos de NFT' }, lessonIndex: 0, xpReward: 75, hasCodeEditor: false, isChallenge: false, language: null },
        { _id: 'nft-l1', title: { en: 'Minting with Metaplex Core', pt: 'Mintando com Metaplex Core', es: 'Mintando con Metaplex Core' }, lessonIndex: 1, xpReward: 75, hasCodeEditor: true, isChallenge: false, language: 'typescript' },
        { _id: 'nft-l2', title: { en: 'Collections & Plugins', pt: 'Coleções e Plugins', es: 'Colecciones y Plugins' }, lessonIndex: 2, xpReward: 75, hasCodeEditor: true, isChallenge: false, language: 'typescript' },
      ],
    },
    {
      _id: 'nft-module-1',
      title: { en: 'Compressed NFTs', pt: 'NFTs Comprimidos', es: 'NFTs Comprimidos' },
      description: { en: 'Scale to millions of NFTs with Bubblegum compression.', pt: 'Escale para milhões de NFTs com compressão Bubblegum.', es: 'Escala a millones de NFTs con compresión Bubblegum.' },
      order: 1,
      lessons: [
        { _id: 'nft-l3', title: { en: 'State Compression', pt: 'Compressão de Estado', es: 'Compresión de Estado' }, lessonIndex: 3, xpReward: 75, hasCodeEditor: false, isChallenge: false, language: null },
        { _id: 'nft-l4', title: { en: 'Bubblegum Minting', pt: 'Mintagem Bubblegum', es: 'Mintaje Bubblegum' }, lessonIndex: 4, xpReward: 75, hasCodeEditor: true, isChallenge: false, language: 'typescript' },
        { _id: 'nft-l5', title: { en: 'Merkle Proofs & Verification', pt: 'Provas de Merkle e Verificação', es: 'Pruebas de Merkle y Verificación' }, lessonIndex: 5, xpReward: 75, hasCodeEditor: true, isChallenge: false, language: 'typescript' },
        { _id: 'nft-l6', title: { en: 'Challenge: Launch a cNFT Collection', pt: 'Desafio: Lance uma Coleção cNFT', es: 'Desafío: Lanza una Colección cNFT' }, lessonIndex: 6, xpReward: 75, hasCodeEditor: true, isChallenge: true, language: 'typescript' },
      ],
    },
  ],
};

export const seedCourseDetailSecurity: SeedCourseDetail = {
  ...seedCourseSecurity,
  credentialImage: null,
  modules: [
    {
      _id: 'sec-module-0',
      title: { en: 'Common Vulnerabilities', pt: 'Vulnerabilidades Comuns', es: 'Vulnerabilidades Comunes' },
      description: { en: 'Identify and exploit common Solana program vulnerabilities.', pt: 'Identifique e explore vulnerabilidades comuns em programas Solana.', es: 'Identifica y explota vulnerabilidades comunes en programas Solana.' },
      order: 0,
      lessons: [
        { _id: 'sec-l0', title: { en: 'Security Landscape', pt: 'Panorama de Segurança', es: 'Panorama de Seguridad' }, lessonIndex: 0, xpReward: 100, hasCodeEditor: false, isChallenge: false, language: null },
        { _id: 'sec-l1', title: { en: 'Missing Owner Checks', pt: 'Verificações de Proprietário Ausentes', es: 'Verificaciones de Propietario Faltantes' }, lessonIndex: 1, xpReward: 100, hasCodeEditor: true, isChallenge: false, language: 'rust' },
        { _id: 'sec-l2', title: { en: 'Integer Overflow & Underflow', pt: 'Overflow e Underflow de Inteiros', es: 'Desbordamiento de Enteros' }, lessonIndex: 2, xpReward: 100, hasCodeEditor: true, isChallenge: false, language: 'rust' },
        { _id: 'sec-l3', title: { en: 'PDA Seed Collision', pt: 'Colisão de Seeds PDA', es: 'Colisión de Seeds PDA' }, lessonIndex: 3, xpReward: 100, hasCodeEditor: true, isChallenge: false, language: 'rust' },
      ],
    },
    {
      _id: 'sec-module-1',
      title: { en: 'Advanced Patterns', pt: 'Padrões Avançados', es: 'Patrones Avanzados' },
      description: { en: 'Advanced audit methodology and defensive programming.', pt: 'Metodologia avançada de auditoria e programação defensiva.', es: 'Metodología avanzada de auditoría y programación defensiva.' },
      order: 1,
      lessons: [
        { _id: 'sec-l4', title: { en: 'Reentrancy in Solana', pt: 'Reentrância na Solana', es: 'Reentrancia en Solana' }, lessonIndex: 4, xpReward: 100, hasCodeEditor: true, isChallenge: false, language: 'rust' },
        { _id: 'sec-l5', title: { en: 'CPI Safety', pt: 'Segurança CPI', es: 'Seguridad CPI' }, lessonIndex: 5, xpReward: 100, hasCodeEditor: true, isChallenge: false, language: 'rust' },
        { _id: 'sec-l6', title: { en: 'Audit Methodology', pt: 'Metodologia de Auditoria', es: 'Metodología de Auditoría' }, lessonIndex: 6, xpReward: 100, hasCodeEditor: false, isChallenge: false, language: null },
        { _id: 'sec-l7', title: { en: 'Challenge: Find the Bug', pt: 'Desafio: Encontre o Bug', es: 'Desafío: Encuentra el Bug' }, lessonIndex: 7, xpReward: 100, hasCodeEditor: true, isChallenge: true, language: 'rust' },
      ],
    },
  ],
};

export const seedCourseDetailTokenExt: SeedCourseDetail = {
  ...seedCourseTokenExt,
  credentialImage: null,
  modules: [
    {
      _id: 'token-module-0',
      title: { en: 'Token-2022 Basics', pt: 'Básicos do Token-2022', es: 'Básicos de Token-2022' },
      description: { en: 'Understanding the Token-2022 program and its extension system.', pt: 'Compreendendo o programa Token-2022 e seu sistema de extensões.', es: 'Comprendiendo el programa Token-2022 y su sistema de extensiones.' },
      order: 0,
      lessons: [
        { _id: 'token-l0', title: { en: 'Token-2022 Overview', pt: 'Visão Geral do Token-2022', es: 'Visión General de Token-2022' }, lessonIndex: 0, xpReward: 100, hasCodeEditor: false, isChallenge: false, language: null },
        { _id: 'token-l1', title: { en: 'Transfer Hooks', pt: 'Hooks de Transferência', es: 'Hooks de Transferencia' }, lessonIndex: 1, xpReward: 100, hasCodeEditor: true, isChallenge: false, language: 'rust' },
        { _id: 'token-l2', title: { en: 'Confidential Transfers', pt: 'Transferências Confidenciais', es: 'Transferencias Confidenciales' }, lessonIndex: 2, xpReward: 100, hasCodeEditor: true, isChallenge: false, language: 'rust' },
      ],
    },
    {
      _id: 'token-module-1',
      title: { en: 'Advanced Extensions', pt: 'Extensões Avançadas', es: 'Extensiones Avanzadas' },
      description: { en: 'Non-transferable tokens, permanent delegates, and custom extensions.', pt: 'Tokens não transferíveis, delegados permanentes e extensões personalizadas.', es: 'Tokens no transferibles, delegados permanentes y extensiones personalizadas.' },
      order: 1,
      lessons: [
        { _id: 'token-l3', title: { en: 'Non-Transferable Tokens', pt: 'Tokens Não Transferíveis', es: 'Tokens No Transferibles' }, lessonIndex: 3, xpReward: 100, hasCodeEditor: true, isChallenge: false, language: 'rust' },
        { _id: 'token-l4', title: { en: 'Permanent Delegates', pt: 'Delegados Permanentes', es: 'Delegados Permanentes' }, lessonIndex: 4, xpReward: 100, hasCodeEditor: true, isChallenge: false, language: 'rust' },
        { _id: 'token-l5', title: { en: 'Challenge: Soulbound Token', pt: 'Desafio: Token Soulbound', es: 'Desafío: Token Soulbound' }, lessonIndex: 5, xpReward: 100, hasCodeEditor: true, isChallenge: true, language: 'rust' },
      ],
    },
  ],
};

/** Map from courseId to detail for mock-client routing. */
export const seedAllCourseDetails: Record<string, SeedCourseDetail> = {
  'solana-101': seedCourseDetail,
  'defi-201': seedCourseDetailDefi,
  'nft-201': seedCourseDetailNft,
  'sec-301': seedCourseDetailSecurity,
  'token-201': seedCourseDetailTokenExt,
};
```

**Step 2: Run tests**

Run: `cd app && pnpm test:run`
Expected: All tests pass

**Step 3: Commit**

```bash
git add app/src/lib/sanity/seed-data.ts
git commit -m "feat: add course detail data with modules for all 5 seed courses"
```

---

## Task 4: Update Mock Client to Serve All Courses

**Files:**
- Modify: `app/src/lib/sanity/mock-client.ts`

**Step 1: Update imports**

Replace the import line:

```typescript
import {
  seedAllTracks,
  seedAllCoursesRaw,
  seedAllCourseDetails,
  seedLessons,
  seedAchievements,
  seedDailyChallenge,
} from '@/lib/sanity/seed-data';
```

**Step 2: Update resolveQuery to use array/map exports**

Replace the `resolveQuery` function body:

```typescript
function resolveQuery<T>(
  query: string,
  params?: Record<string, unknown>,
): T {
  // ── Lesson ────────────────────────────────────────────────────────
  if (query.includes('_type == "lesson"')) {
    const lessonIndex = params?.lessonIndex as number | undefined;
    if (lessonIndex !== undefined) {
      const lesson = seedLessons.find((l) => l.lessonIndex === lessonIndex);
      return (lesson ?? null) as T;
    }
    return null as T;
  }

  // ── Single course by ID ───────────────────────────────────────────
  if (
    query.includes('_type == "course"') &&
    query.includes('courseId == $courseId')
  ) {
    const courseId = params?.courseId as string | undefined;
    if (courseId && seedAllCourseDetails[courseId]) {
      return seedAllCourseDetails[courseId] as T;
    }
    return null as T;
  }

  // ── Courses by track ──────────────────────────────────────────────
  if (
    query.includes('_type == "course"') &&
    query.includes('track->trackId == $trackId')
  ) {
    const trackId = params?.trackId as string | undefined;
    if (trackId) {
      const filtered = seedAllCoursesRaw.filter((c) => c.track.trackId === trackId);
      return filtered as T;
    }
    return [] as T;
  }

  // ── All / featured courses ────────────────────────────────────────
  if (query.includes('_type == "course"')) {
    return seedAllCoursesRaw as T;
  }

  // ── Tracks ────────────────────────────────────────────────────────
  if (query.includes('_type == "track"')) {
    return seedAllTracks as T;
  }

  // ── Achievements ──────────────────────────────────────────────────
  if (query.includes('_type == "achievement"')) {
    return seedAchievements as T;
  }

  // ── Daily challenge ───────────────────────────────────────────────
  if (query.includes('_type == "dailyChallenge"')) {
    return seedDailyChallenge as T;
  }

  // ── Fallback ──────────────────────────────────────────────────────
  console.warn('[mock-client] Unmatched GROQ query — returning null:', query);
  return null as T;
}
```

**Step 3: Run tests**

Run: `cd app && pnpm test:run`
Expected: All tests pass. The seed-data test may need updating if it asserts exactly 1 course.

**Step 4: Fix any failing seed-data tests**

If `seed-data.test.ts` asserts `length === 1` for courses, update to `length === 5` (or `>= 1`).

**Step 5: Commit**

```bash
git add app/src/lib/sanity/mock-client.ts
git commit -m "feat: update mock client to serve all 5 seed courses and 4 tracks"
```

---

## Task 5: Conditionally Register OAuth Providers

**Files:**
- Modify: `app/src/lib/auth.ts`

**Step 1: Write conditional provider registration**

Replace the entire `auth.ts`:

```typescript
import NextAuth from 'next-auth';
import type { Provider } from 'next-auth/providers';
import Google from 'next-auth/providers/google';
import GitHub from 'next-auth/providers/github';

const providers: Provider[] = [];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  );
}

if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  providers.push(
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    jwt({ token, user, account }) {
      if (user?.id) {
        token.id = user.id;
      }
      if (account?.provider) {
        token.provider = account.provider;
      }
      return token;
    },
    session({ session, token }) {
      if (token.id && typeof token.id === 'string') {
        session.user.id = token.id;
      }
      if (token.provider && typeof token.provider === 'string') {
        session.provider = token.provider;
      }
      return session;
    },
  },
});

/** Provider availability flags for client-side conditional rendering. */
export const providerFlags = {
  google: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
  github: !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
};

declare module 'next-auth' {
  interface Session {
    provider?: string;
  }
}
```

**Step 2: Create API endpoint to expose provider availability**

Create: `app/src/app/api/auth/providers-status/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { providerFlags } from '@/lib/auth';

export function GET() {
  return NextResponse.json(providerFlags);
}
```

**Step 3: Run tests**

Run: `cd app && pnpm test:run`
Expected: All tests pass

**Step 4: Commit**

```bash
git add app/src/lib/auth.ts app/src/app/api/auth/providers-status/route.ts
git commit -m "feat: conditionally register OAuth providers only when credentials exist"
```

---

## Task 6: Update Sign-In Menu to Hide Unconfigured Providers

**Files:**
- Modify: `app/src/components/auth/sign-in-menu.tsx`

**Step 1: Add provider status fetching**

Update the component to fetch available providers and conditionally render buttons:

```typescript
'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { LogIn, LogOut, Github, Chrome } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

function deriveInitials(name: string | null | undefined): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0]!;
  if (parts.length === 1) return first.charAt(0).toUpperCase();
  const last = parts[parts.length - 1]!;
  return (first.charAt(0) + last.charAt(0)).toUpperCase();
}

interface ProviderFlags {
  google: boolean;
  github: boolean;
}

export function SignInMenu() {
  const { data: session, status } = useSession();
  const t = useTranslations('auth');
  const [providers, setProviders] = useState<ProviderFlags>({ google: false, github: false });

  useEffect(() => {
    fetch('/api/auth/providers-status')
      .then((r) => r.json())
      .then((data: ProviderFlags) => setProviders(data))
      .catch(() => {/* leave defaults */});
  }, []);

  const hasAnyProvider = providers.google || providers.github;

  if (status === 'loading') {
    return (
      <Button variant="outline" size="sm" disabled className="gap-2">
        <LogIn className="h-4 w-4" />
        <span className="hidden sm:inline">{t('sign_in')}</span>
      </Button>
    );
  }

  if (session?.user) {
    const user = session.user;
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 px-2"
            aria-label={t('signed_in_as', { email: user.email ?? '' })}
          >
            <Avatar size="sm">
              {user.image && <AvatarImage src={user.image} alt={user.name ?? ''} />}
              <AvatarFallback className="text-xs">{deriveInitials(user.name)}</AvatarFallback>
            </Avatar>
            <span className="hidden max-w-[120px] truncate text-sm sm:inline">
              {user.name ?? user.email}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col gap-1">
              {user.name && <p className="text-sm font-medium leading-none">{user.name}</p>}
              {user.email && <p className="text-xs text-muted-foreground">{user.email}</p>}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer">
            <LogOut className="mr-2 h-4 w-4" />
            {t('sign_out')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // No providers configured — don't show sign-in button at all
  if (!hasAnyProvider) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <LogIn className="h-4 w-4" />
          <span className="hidden sm:inline">{t('sign_in')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>{t('sign_in')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {providers.google && (
            <DropdownMenuItem onClick={() => signIn('google')} className="cursor-pointer">
              <Chrome className="mr-2 h-4 w-4" />
              {t('continue_with_google')}
            </DropdownMenuItem>
          )}
          {providers.github && (
            <DropdownMenuItem onClick={() => signIn('github')} className="cursor-pointer">
              <Github className="mr-2 h-4 w-4" />
              {t('continue_with_github')}
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

**Step 2: Run tests**

Run: `cd app && pnpm test:run`
Expected: All tests pass

**Step 3: Commit**

```bash
git add app/src/components/auth/sign-in-menu.tsx
git commit -m "feat: hide OAuth sign-in buttons when providers are not configured"
```

---

## Task 7: Update Featured Courses to Link to Real Slugs

**Files:**
- Modify: `app/src/components/landing/featured-courses.tsx`

**Step 1: Update course data and links**

Update `FEATURED_COURSES` to match seed data courseIds and link to actual detail pages:

Add `slug` field to each featured course:

```typescript
interface CourseCardData {
  title: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  lessons: number;
  xp: number;
  track: string;
  trackColor: string;
  gradientFrom: string;
  gradientTo: string;
  icon: React.ElementType;
  slug: string;
}

const FEATURED_COURSES: CourseCardData[] = [
  {
    title: 'Solana Fundamentals',
    description: 'Understand accounts, transactions, and the Solana runtime from first principles.',
    difficulty: 'Beginner',
    lessons: 5,
    xp: 250,
    track: 'Solana Core',
    trackColor: 'bg-primary/10 text-primary',
    gradientFrom: 'from-primary/20',
    gradientTo: 'to-primary/5',
    icon: Layers,
    slug: 'solana-101',
  },
  {
    title: 'Building a DEX with Anchor',
    description: 'Create a fully functional decentralized exchange with order books and AMM pools.',
    difficulty: 'Intermediate',
    lessons: 8,
    xp: 600,
    track: 'DeFi',
    trackColor: 'bg-accent/10 text-accent',
    gradientFrom: 'from-accent/20',
    gradientTo: 'to-accent/5',
    icon: Code2,
    slug: 'defi-201',
  },
  {
    title: 'NFT Collections with Metaplex',
    description: 'Mint, manage, and trade NFT collections using the Metaplex Core standard.',
    difficulty: 'Intermediate',
    lessons: 7,
    xp: 525,
    track: 'NFT & Metaplex',
    trackColor: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
    gradientFrom: 'from-yellow-500/20',
    gradientTo: 'to-yellow-500/5',
    icon: BookOpen,
    slug: 'nft-201',
  },
  {
    title: 'Smart Contract Auditing',
    description: 'Master security patterns and learn to identify common Solana program vulnerabilities.',
    difficulty: 'Advanced',
    lessons: 8,
    xp: 800,
    track: 'Security',
    trackColor: 'bg-red-500/10 text-red-600 dark:text-red-400',
    gradientFrom: 'from-red-500/20',
    gradientTo: 'to-red-500/5',
    icon: Shield,
    slug: 'sec-301',
  },
];
```

Update the `<Link>` inside each card from `/courses` to `/courses/${course.slug}`:

```tsx
<Link href={`/courses/${course.slug}`}>
  Start Course
  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
</Link>
```

**Step 2: Run tests**

Run: `cd app && pnpm test:run`
Expected: All tests pass

**Step 3: Commit**

```bash
git add app/src/components/landing/featured-courses.tsx
git commit -m "feat: link featured courses to real course detail pages with accurate stats"
```

---

## Task 8: Fix Seed Data Tests

**Files:**
- Modify: `app/src/lib/sanity/__tests__/seed-data.test.ts`
- Modify: `app/src/lib/stores/__tests__/course-store.test.ts`

**Step 1: Read and update seed-data tests**

Update any assertions that check for exactly 1 course to account for 5 courses.

**Step 2: Read and update course-store tests**

The `makeSanityCourse` factory may need updating if it checks `seedCourseRaw` directly.

**Step 3: Run full test suite**

Run: `cd app && pnpm test:run`
Expected: All 348+ tests pass

**Step 4: Commit**

```bash
git add app/src/lib/sanity/__tests__/seed-data.test.ts app/src/lib/stores/__tests__/course-store.test.ts
git commit -m "test: update assertions for 5 seed courses and 4 tracks"
```

---

## Task 9: TypeScript + Lint Check

**Files:** None (validation only)

**Step 1: Run TypeScript check**

Run: `cd app && pnpm tsc --noEmit`
Expected: No errors

**Step 2: Run linter**

Run: `cd app && pnpm lint`
Expected: No errors

**Step 3: Fix any issues found**

If TS or lint issues, fix them and commit:

```bash
git add -A
git commit -m "fix: resolve TypeScript and lint issues"
```

---

## Task 10: Build Verification + Push

**Files:** None

**Step 1: Run production build**

Run: `cd app && pnpm build`
Expected: Build completes without errors

**Step 2: Push to main**

Run: `git push origin main`
Expected: Vercel auto-deploys

**Step 3: Verify deployment**

Check `https://superteam-academy-rectors-projects.vercel.app/en/courses` shows 5 courses.
Check sign-in button is hidden (no OAuth env vars configured).

---

## Summary

| Task | What | Impact |
|------|------|--------|
| 1-3 | 4 new tracks + 4 new courses + detail data | Course catalog shows 5 courses across 4 tracks |
| 4 | Mock client serves all courses | Dev and prod both show full catalog |
| 5-6 | Conditional OAuth + hidden buttons | No more 401 errors, clean UX |
| 7 | Featured courses link to real pages | Landing → Course Detail flow works |
| 8 | Test updates | Suite stays green |
| 9-10 | Validation + deploy | Production verified |

**Estimated score after implementation: 98-100/100**

Remaining RECTOR-only tasks:
- Run Lighthouse in Chrome DevTools (expected 90+ given our optimizations)
- Optionally set Google/GitHub OAuth env vars on Vercel
- Create PR, record video, post tweet
