/**
 * Course data translations (EN / ES).
 * Primary locale (pt) comes from the data files themselves.
 * Keys are slugs for courses, module IDs for modules, lesson IDs for lessons.
 */

type LocaleStrings = Record<
  string,
  { title?: string; description?: string; longDescription?: string }
>;

const en: LocaleStrings = {
  // ── Courses ────────────────────────────────────────────────
  "solana-fundamentals": {
    title: "Solana Fundamentals",
    description:
      "Master the fundamentals of the Solana ecosystem: architecture, accounts, transactions, programs and CLI.",
    longDescription:
      "A complete course for beginners covering Solana's history and architecture through to hands-on CLI practice and your first transaction. Learn how the account model, transactions, instructions and on-chain programs work.",
  },
  "defi-developer": {
    title: "DeFi Developer",
    description:
      "SPL tokens, AMMs, oracles and complete DeFi protocols on the Solana ecosystem.",
    longDescription:
      "A comprehensive intermediate course on DeFi development on Solana. Learn to create tokens, understand AMMs and liquidity pools, integrate with Jupiter, explore yield farming and oracles, and build a DeFi vault.",
  },
  "fullstack-dapp": {
    title: "Full Stack dApp",
    description:
      "From Anchor program to React frontend with wallet adapter, tests and mainnet deploy.",
    longDescription:
      "A complete advanced course for building a full-stack dApp on Solana. Learn Anchor from scratch, write tests, build the frontend with React and wallet adapter, and deploy to production.",
  },
  "solana-cli-workshop": {
    title: "Solana CLI Workshop",
    description:
      "Set up the environment, create accounts and send transactions via CLI.",
    longDescription:
      "Hands-on workshop with Solana CLI: installation, keypairs, airdrop, transfers and transaction exploration on the blockchain.",
  },
  "rust-para-solana": {
    title: "Rust for Solana",
    description: "Rust syntax and concepts needed for on-chain programs.",
    longDescription:
      "Learn the Rust fundamentals required for Solana development: variables, types, ownership, borrowing, structs, enums, pattern matching, traits, generics and error handling.",
  },
  "pdas-e-contas": {
    title: "PDAs and Accounts on Solana",
    description: "Program Derived Addresses and the account model in depth.",
    longDescription:
      "Deep dive into Solana's account model and PDAs. Understand seeds, determinism, creating accounts with PDAs, PDA signers, on-chain hashmaps, and build a practical on-chain blog.",
  },
  "spl-token-avancado": {
    title: "Advanced SPL Token",
    description:
      "Token-2022, extensions, transfer fees and soulbound tokens on Solana.",
    longDescription:
      "Master advanced token features on Solana: understand the differences between SPL Token and Token-2022, configure transfer fees, create confidential tokens and implement extensions like interest-bearing and non-transferable.",
  },
  "amm-e-liquidity": {
    title: "AMM and Liquidity",
    description: "Pools, liquidity and arbitrage on Solana DEXs.",
    longDescription:
      "Understand how AMMs work on Solana, learn about constant product formula, impermanent loss, Raydium and Orca integration, MEV and arbitrage, and build your own liquidity pool.",
  },
  "anchor-avancado": {
    title: "Advanced Anchor",
    description:
      "CPIs, events, zero-copy, program security and automation on Solana.",
    longDescription:
      "Advanced course on Anchor framework: cross-program invocations, events and indexing, memory optimization with zero-copy, program security, upgradeable programs, automation with Clockwork, and a final DeFi protocol project.",
  },

  // ── Modules ────────────────────────────────────────────────
  // Course 1 – Solana Fundamentals
  "m1-1": { title: "Introduction to Solana" },
  "m1-2": { title: "Data Model" },
  "m1-3": { title: "Practice" },
  // Course 2 – DeFi Developer
  "m2-1": { title: "DeFi Fundamentals" },
  "m2-2": { title: "DeFi Mechanisms" },
  "m2-3": { title: "Yield and Oracles" },
  "m2-4": { title: "Practical Project" },
  // Course 3 – Full Stack dApp
  "m3-1": { title: "Anchor Framework" },
  "m3-2": { title: "Frontend" },
  "m3-3": { title: "Deploy" },
  // Course 4 – Solana CLI
  "m4-1": { title: "Setup" },
  "m4-2": { title: "Operations" },
  // Course 5 – Rust para Solana
  "m5-1": { title: "Rust Fundamentals" },
  "m5-2": { title: "Ownership and Structures" },
  "m5-3": { title: "Advanced" },
  // Course 6 – PDAs e contas
  "m6-1": { title: "Account Fundamentals" },
  "m6-2": { title: "Working with PDAs" },
  "m6-3": { title: "Advanced Patterns" },
  // Course 7 – SPL Token avançado
  m7: { title: "Token-2022 and Extensions" },
  // Course 8 – AMM e liquidez
  m8: { title: "AMM and DEXs on Solana" },
  // Course 9 – Anchor avançado
  m9: { title: "Advanced Anchor" },

  // ── Lessons ────────────────────────────────────────────────
  // Course 1
  "sf-l1": { title: "What is Solana?" },
  "sf-l2": { title: "Solana Architecture" },
  "sf-l3": { title: "Accounts and the Account Model" },
  "sf-l4": { title: "Transactions and Instructions" },
  "sf-l5": { title: "On-chain Programs" },
  "sf-l6": { title: "Solana CLI in Practice" },
  "sf-l7": { title: "Your First Transaction" },
  // Course 2
  "df-l1": { title: "Introduction to DeFi" },
  "df-l2": { title: "SPL Token: Creating Your Token" },
  "df-l3": { title: "Token Accounts and Associated Token Accounts" },
  "df-l4": { title: "Swaps and Liquidity Pools" },
  "df-l5": { title: "Integrating with Jupiter" },
  "df-l6": { title: "Yield Farming and Staking" },
  "df-l7": { title: "Price Oracles" },
  "df-l8": { title: "Building a DeFi Vault" },
  // Course 3
  "fs-l1": { title: "Environment Setup" },
  "fs-l2": { title: "Anchor: Declaring Programs and Accounts" },
  "fs-l3": { title: "Anchor: Instructions and Validation" },
  "fs-l4": { title: "Testing with Anchor" },
  "fs-l5": { title: "Frontend: React and Wallet" },
  "fs-l6": { title: "Frontend: Interacting with Programs" },
  "fs-l7": { title: "Deploy to Devnet and Mainnet" },
  "fs-l8": { title: "Final Project: Complete dApp" },
  // Course 4
  "cli-l1": { title: "Installing Solana CLI" },
  "cli-l2": { title: "Configuring the Network" },
  "cli-l3": { title: "Keypairs and Wallets" },
  "cli-l4": { title: "Airdrop and Balances" },
  "cli-l5": { title: "Transferring SOL" },
  "cli-l6": { title: "Exploring Transactions" },
  // Course 5
  "rs-l1": { title: "Why Rust for Solana?" },
  "rs-l2": { title: "Variables and Types" },
  "rs-l3": { title: "Ownership and Borrowing" },
  "rs-l4": { title: "Structs and Enums" },
  "rs-l5": { title: "Pattern Matching" },
  "rs-l6": { title: "Traits and Generics" },
  "rs-l7": { title: "Error Handling" },
  // Course 6
  "pda-l1": { title: "Account Model Revisited" },
  "pda-l2": { title: "Program Derived Addresses" },
  "pda-l3": { title: "Seeds and Determinism" },
  "pda-l4": { title: "Creating Accounts with PDAs" },
  "pda-l5": { title: "PDAs as Signers" },
  "pda-l6": { title: "On-chain Hashmaps" },
  "pda-l7": { title: "Practical Exercise: On-chain Blog" },
  // Course 7
  l44: { title: "SPL Token vs Token-2022" },
  l45: { title: "Mint Authority and Freeze Authority" },
  l46: { title: "Transfer Fees" },
  l47: { title: "Confidential Transfers" },
  l48: { title: "Interest-bearing Tokens" },
  l49: { title: "Permanent Delegate and Non-transferable" },
  l50: { title: "Creating a Token with Extensions" },
  // Course 8
  l51: { title: "What is an AMM?" },
  l52: { title: "Constant Product Formula" },
  l53: { title: "Impermanent Loss" },
  l54: { title: "Raydium: Architecture and Integration" },
  l55: { title: "Orca: Whirlpools" },
  l56: { title: "Arbitrage and MEV" },
  l57: { title: "Creating a Liquidity Pool" },
  // Course 9
  l58: { title: "Review: Anchor Fundamentals" },
  l59: { title: "Cross-Program Invocations (CPIs)" },
  l60: { title: "Events and Indexing" },
  l61: { title: "Zero-copy and Memory Optimization" },
  l62: { title: "Program Security" },
  l63: { title: "Upgradeable Programs" },
  l64: { title: "Clockwork and Automation" },
  l65: { title: "Final Project: DeFi Protocol" },
};

const es: LocaleStrings = {
  // ── Courses ────────────────────────────────────────────────
  "solana-fundamentals": {
    title: "Fundamentos de Solana",
    description:
      "Domina los fundamentos del ecosistema Solana: arquitectura, cuentas, transacciones, programas y CLI.",
    longDescription:
      "Un curso completo para principiantes que cubre desde la historia y arquitectura de Solana hasta la práctica con CLI y tu primera transacción. Aprende cómo funciona el modelo de cuentas, transacciones, instrucciones y programas on-chain.",
  },
  "defi-developer": {
    title: "Desarrollador DeFi",
    description:
      "Tokens SPL, AMMs, oráculos y protocolos DeFi completos en el ecosistema Solana.",
    longDescription:
      "Curso intermedio completo sobre desarrollo DeFi en Solana. Aprende a crear tokens, entender AMMs y pools de liquidez, integrar con Jupiter, explorar yield farming y oráculos, y construir un vault DeFi.",
  },
  "fullstack-dapp": {
    title: "dApp Full Stack",
    description:
      "Del programa Anchor al frontend React con wallet adapter, tests y deploy en mainnet.",
    longDescription:
      "Curso avanzado completo para construir una dApp full-stack en Solana. Aprende Anchor desde cero, escribe tests, construye el frontend con React y wallet adapter, y despliega en producción.",
  },
  "solana-cli-workshop": {
    title: "Taller de Solana CLI",
    description:
      "Configura el entorno, crea cuentas y envía transacciones vía CLI.",
    longDescription:
      "Taller práctico con Solana CLI: instalación, keypairs, airdrop, transferencias y exploración de transacciones en la blockchain.",
  },
  "rust-para-solana": {
    title: "Rust para Solana",
    description:
      "Sintaxis y conceptos de Rust necesarios para programas on-chain.",
    longDescription:
      "Aprende los fundamentos de Rust requeridos para el desarrollo en Solana: variables, tipos, ownership, borrowing, structs, enums, pattern matching, traits, generics y manejo de errores.",
  },
  "pdas-e-contas": {
    title: "PDAs y Cuentas en Solana",
    description:
      "Program Derived Addresses y el modelo de cuentas en profundidad.",
    longDescription:
      "Inmersión profunda en el modelo de cuentas de Solana y PDAs. Entiende seeds, determinismo, creación de cuentas con PDAs, PDA signers, hashmaps on-chain y construye un blog on-chain práctico.",
  },
  "spl-token-avancado": {
    title: "SPL Token Avanzado",
    description:
      "Token-2022, extensiones, transfer fees y tokens soulbound en Solana.",
    longDescription:
      "Domina las funcionalidades avanzadas de tokens en Solana: diferencias entre SPL Token y Token-2022, configura transfer fees, crea tokens confidenciales e implementa extensiones como interest-bearing y non-transferable.",
  },
  "amm-e-liquidity": {
    title: "AMM y Liquidez",
    description: "Pools, liquidez y arbitraje en DEXs de Solana.",
    longDescription:
      "Entiende cómo funcionan los AMMs en Solana, aprende sobre la fórmula de producto constante, impermanent loss, integración con Raydium y Orca, MEV y arbitraje, y construye tu propio pool de liquidez.",
  },
  "anchor-avancado": {
    title: "Anchor Avanzado",
    description:
      "CPIs, eventos, zero-copy, seguridad de programas y automatización en Solana.",
    longDescription:
      "Curso avanzado sobre el framework Anchor: invocaciones cross-program, eventos e indexación, optimización de memoria con zero-copy, seguridad de programas, programas actualizables, automatización con Clockwork y un proyecto final de protocolo DeFi.",
  },

  // ── Modules ────────────────────────────────────────────────
  "m1-1": { title: "Introducción a Solana" },
  "m1-2": { title: "Modelo de Datos" },
  "m1-3": { title: "Práctica" },
  "m2-1": { title: "Fundamentos DeFi" },
  "m2-2": { title: "Mecanismos DeFi" },
  "m2-3": { title: "Yield y Oráculos" },
  "m2-4": { title: "Proyecto Práctico" },
  "m3-1": { title: "Framework Anchor" },
  "m3-2": { title: "Frontend" },
  "m3-3": { title: "Deploy" },
  "m4-1": { title: "Configuración" },
  "m4-2": { title: "Operaciones" },
  "m5-1": { title: "Fundamentos de Rust" },
  "m5-2": { title: "Ownership y Estructuras" },
  "m5-3": { title: "Avanzado" },
  "m6-1": { title: "Fundamentos de Cuentas" },
  "m6-2": { title: "Trabajando con PDAs" },
  "m6-3": { title: "Patrones Avanzados" },
  m7: { title: "Token-2022 y Extensiones" },
  m8: { title: "AMM y DEXs en Solana" },
  m9: { title: "Anchor Avanzado" },

  // ── Lessons ────────────────────────────────────────────────
  "sf-l1": { title: "¿Qué es Solana?" },
  "sf-l2": { title: "Arquitectura de Solana" },
  "sf-l3": { title: "Cuentas y el Modelo de Cuentas" },
  "sf-l4": { title: "Transacciones e Instrucciones" },
  "sf-l5": { title: "Programas on-chain" },
  "sf-l6": { title: "Solana CLI en Práctica" },
  "sf-l7": { title: "Tu Primera Transacción" },
  "df-l1": { title: "Introducción al DeFi" },
  "df-l2": { title: "SPL Token: Creando tu Token" },
  "df-l3": { title: "Token Accounts y Associated Token Accounts" },
  "df-l4": { title: "Swaps y Pools de Liquidez" },
  "df-l5": { title: "Integrando con Jupiter" },
  "df-l6": { title: "Yield Farming y Staking" },
  "df-l7": { title: "Oráculos de Precio" },
  "df-l8": { title: "Construyendo un Vault DeFi" },
  "fs-l1": { title: "Configuración del Entorno" },
  "fs-l2": { title: "Anchor: Declarar Programa y Cuentas" },
  "fs-l3": { title: "Anchor: Instrucciones y Validación" },
  "fs-l4": { title: "Pruebas con Anchor" },
  "fs-l5": { title: "Frontend: React y Wallet" },
  "fs-l6": { title: "Frontend: Interactuando con Programas" },
  "fs-l7": { title: "Deploy a Devnet y Mainnet" },
  "fs-l8": { title: "Proyecto Final: dApp Completa" },
  "cli-l1": { title: "Instalando Solana CLI" },
  "cli-l2": { title: "Configurando la Red" },
  "cli-l3": { title: "Keypairs y Carteras" },
  "cli-l4": { title: "Airdrop y Saldos" },
  "cli-l5": { title: "Transfiriendo SOL" },
  "cli-l6": { title: "Explorando Transacciones" },
  "rs-l1": { title: "¿Por qué Rust para Solana?" },
  "rs-l2": { title: "Variables y Tipos" },
  "rs-l3": { title: "Ownership y Borrowing" },
  "rs-l4": { title: "Structs y Enums" },
  "rs-l5": { title: "Pattern Matching" },
  "rs-l6": { title: "Traits y Generics" },
  "rs-l7": { title: "Manejo de Errores" },
  "pda-l1": { title: "Modelo de Cuentas Revisitado" },
  "pda-l2": { title: "Program Derived Addresses" },
  "pda-l3": { title: "Seeds y Determinismo" },
  "pda-l4": { title: "Creando Cuentas con PDAs" },
  "pda-l5": { title: "PDAs como Signers" },
  "pda-l6": { title: "Hashmaps On-chain" },
  "pda-l7": { title: "Ejercicio Práctico: Blog On-chain" },
  l44: { title: "SPL Token vs Token-2022" },
  l45: { title: "Mint Authority y Freeze Authority" },
  l46: { title: "Transfer Fees" },
  l47: { title: "Transferencias Confidenciales" },
  l48: { title: "Tokens con Interés" },
  l49: { title: "Permanent Delegate y Non-transferable" },
  l50: { title: "Creando un Token con Extensiones" },
  l51: { title: "¿Qué es un AMM?" },
  l52: { title: "Fórmula del Producto Constante" },
  l53: { title: "Impermanent Loss" },
  l54: { title: "Raydium: Arquitectura e Integración" },
  l55: { title: "Orca: Whirlpools" },
  l56: { title: "Arbitraje y MEV" },
  l57: { title: "Creando un Pool de Liquidez" },
  l58: { title: "Revisión: Fundamentos de Anchor" },
  l59: { title: "Cross-Program Invocations (CPIs)" },
  l60: { title: "Eventos e Indexación" },
  l61: { title: "Zero-copy y Optimización de Memoria" },
  l62: { title: "Seguridad de Programas" },
  l63: { title: "Programas Actualizables" },
  l64: { title: "Clockwork y Automatización" },
  l65: { title: "Proyecto Final: Protocolo DeFi" },
};

const translationsMap: Record<string, LocaleStrings> = { en, es };

/**
 * Return a localized string for a given key (slug or id) and field.
 * Falls back to the original value when no translation exists.
 */
export function localize(
  locale: string,
  key: string,
  field: "title" | "description" | "longDescription",
  fallback: string,
): string {
  if (locale === "pt" || locale === "pt-BR") return fallback;
  return translationsMap[locale]?.[key]?.[field] ?? fallback;
}

// ── Lesson content translations ──────────────────────────────

export interface LessonContentTranslation {
  content?: string;
  exerciseQuestion?: string;
  exerciseOptions?: string[];
  challengePrompt?: string;
}

type LessonContentMap = Record<string, LessonContentTranslation>;

let contentEn: LessonContentMap = {};
let contentEs: LessonContentMap = {};

/** Register lesson content translations (called by content files) */
export function registerLessonContent(locale: string, map: LessonContentMap) {
  if (locale === "en") contentEn = { ...contentEn, ...map };
  if (locale === "es") contentEs = { ...contentEs, ...map };
}

import type { Lesson } from "./courses";

/**
 * Return a Lesson with translated content fields.
 * Code blocks in markdown are preserved as-is (already in English).
 */
export function localizeLesson(locale: string, lesson: Lesson): Lesson {
  if (locale === "pt" || locale === "pt-BR") return lesson;
  const map = locale === "en" ? contentEn : locale === "es" ? contentEs : null;
  if (!map) return lesson;
  const t = map[lesson.id];
  if (!t) return lesson;

  const result = { ...lesson };
  if (t.content && result.content) result.content = t.content;
  if (t.exerciseQuestion && result.exercise) {
    result.exercise = {
      ...result.exercise,
      question: t.exerciseQuestion,
      options: t.exerciseOptions ?? result.exercise.options,
    };
  }
  if (t.challengePrompt && result.challenge) {
    result.challenge = { ...result.challenge, prompt: t.challengePrompt };
  }
  return result;
}
