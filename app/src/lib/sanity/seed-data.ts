/**
 * Comprehensive CMS seed data for Superteam Academy.
 *
 * Exports sample data in the exact shapes that Sanity GROQ projections return.
 * Consumed by `mock-client.ts` during development without a Sanity backend
 * and by tests to verify data integrity.
 *
 * Data hierarchy:
 *   Track -> Course -> Module[] -> Lesson[]
 *
 * Content locales: en (English), pt (Portuguese), es (Spanish)
 *
 * @module seed-data
 */

// ---------------------------------------------------------------------------
// Shared i18n helpers
// ---------------------------------------------------------------------------

/** Localized string object matching Sanity's `localizedString` helper. */
export interface LocalizedString {
  en: string;
  pt: string;
  es: string;
}

/** Localized text (multi-line) matching Sanity's `localizedText` helper. */
export interface LocalizedText {
  en: string;
  pt: string;
  es: string;
}

// ---------------------------------------------------------------------------
// Content section types (used by the LessonContent component)
// ---------------------------------------------------------------------------

/**
 * A single content block within a lesson. The LessonContent component
 * renders these sequentially to build the lesson page.
 */
export interface SeedContentSection {
  /** Block type that determines the renderer. */
  type: 'text' | 'code' | 'admonition' | 'key-concepts';
  /** Markdown/plain text content for `text` and `admonition` types. */
  content?: string;
  /** Programming language for syntax highlighting in `code` sections. */
  language?: string;
  /** Visual variant for `admonition` blocks. */
  admonitionType?: 'tip' | 'warning' | 'info';
  /** Array of concept strings for `key-concepts` type. */
  concepts?: string[];
}

// ---------------------------------------------------------------------------
// Track
// ---------------------------------------------------------------------------

export interface SeedTrack {
  _id: string;
  trackId: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export const seedTrack: SeedTrack = {
  _id: 'track-solana-core',
  trackId: '1',
  name: 'Solana Core',
  description:
    'Master the fundamentals of Solana blockchain development. From accounts and transactions to building full programs with Anchor.',
  icon: 'solana',
  color: '#9945FF',
};

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

// ---------------------------------------------------------------------------
// Test case shape (shared by lessons & daily challenges)
// ---------------------------------------------------------------------------

/** A single test case used by challenge lessons and daily challenges. */
export interface SeedTestCase {
  description: string;
  input: string;
  expectedOutput: string;
  points: number;
  hidden: boolean;
}

// ---------------------------------------------------------------------------
// Lesson
// ---------------------------------------------------------------------------

/**
 * Shape returned by `lessonByCourseAndIndexQuery`.
 *
 * Note: `content` lives in the separate `seedLessonContents` export because
 * some consumers (module summaries, course detail) only need the metadata.
 */
export interface SeedLesson {
  _id: string;
  title: LocalizedString;
  lessonIndex: number;
  xpReward: number;
  hasCodeEditor: boolean;
  starterCode: string | null;
  language: string | null;
  isChallenge: boolean;
  testCases: SeedTestCase[] | null;
}

export const seedLessons: SeedLesson[] = [
  // ── Lesson 0 ─────────────────────────────────────────────────────
  {
    _id: 'lesson-0',
    title: {
      en: 'Introduction to Solana',
      pt: 'Introdu\u00e7\u00e3o \u00e0 Solana',
      es: 'Introducci\u00f3n a Solana',
    },
    lessonIndex: 0,
    xpReward: 50,
    hasCodeEditor: true,
    starterCode: `use solana_program::{
  account_info::AccountInfo,
  entrypoint,
  entrypoint::ProgramResult,
  msg,
  pubkey::Pubkey,
};

entrypoint!(process_instruction);

pub fn process_instruction(
  _program_id: &Pubkey,
  _accounts: &[AccountInfo],
  _instruction_data: &[u8],
) -> ProgramResult {
  // TODO: Log a greeting message using msg!()
  // Hint: msg!("Hello, Solana!");

  Ok(())
}`,
    language: 'rust',
    isChallenge: false,
    testCases: null,
  },
  // ── Lesson 1 ─────────────────────────────────────────────────────
  {
    _id: 'lesson-1',
    title: {
      en: 'Accounts and Data Model',
      pt: 'Contas e Modelo de Dados',
      es: 'Cuentas y Modelo de Datos',
    },
    lessonIndex: 1,
    xpReward: 50,
    hasCodeEditor: false,
    starterCode: null,
    language: null,
    isChallenge: false,
    testCases: null,
  },
  // ── Lesson 2 ─────────────────────────────────────────────────────
  {
    _id: 'lesson-2',
    title: {
      en: 'Transactions and Instructions',
      pt: 'Transa\u00e7\u00f5es e Instru\u00e7\u00f5es',
      es: 'Transacciones e Instrucciones',
    },
    lessonIndex: 2,
    xpReward: 50,
    hasCodeEditor: true,
    starterCode: `import {
  Connection,
  Keypair,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";

const connection = new Connection("http://localhost:8899", "confirmed");

// Sender keypair (loaded from local file for development)
const sender = Keypair.generate();

// Recipient address
const recipient = Keypair.generate().publicKey;

async function sendSol() {
  // TODO: Request an airdrop of 2 SOL to the sender

  // TODO: Create a transfer instruction using SystemProgram.transfer()

  // TODO: Build a Transaction, add the instruction, and send it

  // TODO: Log the transaction signature
}

sendSol();`,
    language: 'typescript',
    isChallenge: false,
    testCases: null,
  },
  // ── Lesson 3 ─────────────────────────────────────────────────────
  {
    _id: 'lesson-3',
    title: {
      en: 'Your First Anchor Program',
      pt: 'Seu Primeiro Programa Anchor',
      es: 'Tu Primer Programa Anchor',
    },
    lessonIndex: 3,
    xpReward: 50,
    hasCodeEditor: true,
    starterCode: `use anchor_lang::prelude::*;

declare_id!("11111111111111111111111111111111");

#[program]
pub mod counter {
  use super::*;

  pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
    // TODO: Get a mutable reference to the counter account
    // TODO: Set the count to 0
    // TODO: Set the authority to the signer's key
    Ok(())
  }

  pub fn increment(ctx: Context<Increment>) -> Result<()> {
    // TODO: Get a mutable reference to the counter account
    // TODO: Increment the count by 1
    Ok(())
  }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
  #[account(
    init,
    payer = authority,
    space = 8 + Counter::INIT_SPACE,
  )]
  pub counter: Account<'info, Counter>,
  #[account(mut)]
  pub authority: Signer<'info>,
  pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Increment<'info> {
  #[account(mut, has_one = authority)]
  pub counter: Account<'info, Counter>,
  pub authority: Signer<'info>,
}

#[account]
#[derive(InitSpace)]
pub struct Counter {
  pub count: u64,
  pub authority: Pubkey,
}`,
    language: 'rust',
    isChallenge: false,
    testCases: null,
  },
  // ── Lesson 4 ─────────────────────────────────────────────────────
  {
    _id: 'lesson-4',
    title: {
      en: 'Final Challenge: Build a Token Vault',
      pt: 'Desafio Final: Construa um Cofre de Tokens',
      es: 'Desaf\u00edo Final: Construye una B\u00f3veda de Tokens',
    },
    lessonIndex: 4,
    xpReward: 50,
    hasCodeEditor: true,
    starterCode: `use anchor_lang::prelude::*;

declare_id!("11111111111111111111111111111111");

#[program]
pub mod token_vault {
  use super::*;

  pub fn initialize(ctx: Context<InitializeVault>) -> Result<()> {
    // TODO: Initialize the vault with:
    //   - authority set to the signer
    //   - balance set to 0
    Ok(())
  }

  pub fn deposit(ctx: Context<VaultAction>, amount: u64) -> Result<()> {
    // TODO: Add amount to the vault balance
    // HINT: Use checked_add to prevent overflow
    Ok(())
  }

  pub fn withdraw(ctx: Context<VaultAction>, amount: u64) -> Result<()> {
    // TODO: Verify the signer is the authority
    // TODO: Subtract amount from the vault balance
    // HINT: Use checked_sub and return an error if insufficient funds
    Ok(())
  }
}

#[derive(Accounts)]
pub struct InitializeVault<'info> {
  #[account(
    init,
    payer = authority,
    space = 8 + Vault::INIT_SPACE,
  )]
  pub vault: Account<'info, Vault>,
  #[account(mut)]
  pub authority: Signer<'info>,
  pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct VaultAction<'info> {
  #[account(mut, has_one = authority @ VaultError::Unauthorized)]
  pub vault: Account<'info, Vault>,
  pub authority: Signer<'info>,
}

#[account]
#[derive(InitSpace)]
pub struct Vault {
  pub authority: Pubkey,
  pub balance: u64,
}

#[error_code]
pub enum VaultError {
  #[msg("You are not authorized to perform this action")]
  Unauthorized,
  #[msg("Arithmetic overflow detected")]
  Overflow,
  #[msg("Insufficient vault balance")]
  InsufficientFunds,
}`,
    language: 'rust',
    isChallenge: true,
    testCases: [
      {
        description: 'Vault initializes with correct state',
        input: 'initialize',
        expectedOutput: 'Vault { authority: <user>, balance: 0 }',
        points: 20,
        hidden: false,
      },
      {
        description: 'Deposit increases vault balance',
        input: 'deposit 100',
        expectedOutput: 'Vault { balance: 100 }',
        points: 20,
        hidden: false,
      },
      {
        description: 'Withdraw decreases vault balance',
        input: 'withdraw 50',
        expectedOutput: 'Vault { balance: 50 }',
        points: 20,
        hidden: false,
      },
      {
        description: 'Unauthorized withdraw fails',
        input: 'withdraw_unauthorized 50',
        expectedOutput: 'Error: Unauthorized',
        points: 20,
        hidden: true,
      },
      {
        description: 'Overflow protection works',
        input: 'deposit 18446744073709551615',
        expectedOutput: 'Error: Overflow',
        points: 20,
        hidden: true,
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Lesson content (rich-text sections per locale)
// ---------------------------------------------------------------------------

/** Groups content sections per lesson per locale for the LessonContent component. */
export interface SeedLessonContent {
  lessonIndex: number;
  en: SeedContentSection[];
  pt: SeedContentSection[];
  es: SeedContentSection[];
}

export const seedLessonContents: SeedLessonContent[] = [
  // ======================================================================
  // Lesson 0: Introduction to Solana
  // ======================================================================
  {
    lessonIndex: 0,
    en: [
      {
        type: 'text',
        content:
          'Solana is a high-performance blockchain designed for mass adoption. Unlike traditional blockchains that process transactions sequentially, Solana introduces **Proof of History (PoH)** -- a cryptographic clock that allows validators to agree on the order of events without constant communication.',
      },
      {
        type: 'key-concepts',
        concepts: [
          'Proof of History (PoH) -- cryptographic timestamps for transaction ordering',
          'High throughput -- up to 65,000 transactions per second',
          'Low cost -- average transaction fee under $0.001',
          'Accounts model -- all state lives in accounts, programs are stateless',
        ],
      },
      {
        type: 'text',
        content:
          'At its core, Solana separates **code** from **data**. Programs (smart contracts) are stateless executables deployed on-chain. All mutable state is stored in **accounts** -- think of them as key-value entries in a global database, each owned by a specific program.',
      },
      {
        type: 'admonition',
        admonitionType: 'tip',
        content:
          'Solana programs are stateless. They read and write data through accounts passed to them as instruction arguments. This is fundamentally different from Ethereum, where contracts hold their own storage.',
      },
      {
        type: 'text',
        content:
          'The Solana runtime executes programs inside the **Sealevel** parallel processing engine. Because each transaction declares which accounts it will read and write upfront, Sealevel can schedule non-conflicting transactions to run simultaneously across multiple cores.',
      },
      {
        type: 'code',
        language: 'rust',
        content: `use solana_program::{
  account_info::AccountInfo,
  entrypoint,
  entrypoint::ProgramResult,
  msg,
  pubkey::Pubkey,
};

// Declare the program entrypoint
entrypoint!(process_instruction);

pub fn process_instruction(
  program_id: &Pubkey,
  accounts: &[AccountInfo],
  instruction_data: &[u8],
) -> ProgramResult {
  msg!("Hello, Solana! Program ID: {}", program_id);
  msg!("Number of accounts: {}", accounts.len());
  msg!("Instruction data length: {}", instruction_data.len());
  Ok(())
}`,
      },
      {
        type: 'text',
        content:
          'Every Solana program starts with an **entrypoint**. The `entrypoint!` macro registers a function that the runtime calls whenever a transaction targets your program. It receives three arguments: the program ID, an array of accounts, and raw instruction data.',
      },
      {
        type: 'admonition',
        admonitionType: 'info',
        content:
          'In practice, most developers use the **Anchor framework** instead of raw `solana_program` calls. Anchor provides macros that handle serialization, account validation, and error handling automatically. We will cover Anchor in Lesson 3.',
      },
      {
        type: 'text',
        content:
          'When you deploy a program, Solana stores the compiled BPF bytecode in an **executable account**. The program itself has no mutable storage -- it can only modify accounts that are passed into it and that it has authority over. This design is what enables Sealevel\'s parallelism.',
      },
      {
        type: 'admonition',
        admonitionType: 'tip',
        content:
          'Use `solana-test-validator` to spin up a local cluster for development. It gives you an instant feedback loop without needing devnet SOL or dealing with rate limits.',
      },
    ],
    pt: [
      {
        type: 'text',
        content:
          'Solana \u00e9 uma blockchain de alto desempenho projetada para ado\u00e7\u00e3o em massa. Diferente de blockchains tradicionais que processam transa\u00e7\u00f5es sequencialmente, a Solana introduz a **Prova de Hist\u00f3ria (PoH)** -- um rel\u00f3gio criptogr\u00e1fico que permite que validadores concordem sobre a ordem dos eventos sem comunica\u00e7\u00e3o constante.',
      },
      {
        type: 'key-concepts',
        concepts: [
          'Prova de Hist\u00f3ria (PoH) -- timestamps criptogr\u00e1ficos para ordena\u00e7\u00e3o de transa\u00e7\u00f5es',
          'Alta vaz\u00e3o -- at\u00e9 65.000 transa\u00e7\u00f5es por segundo',
          'Baixo custo -- taxa m\u00e9dia de transa\u00e7\u00e3o inferior a $0,001',
          'Modelo de contas -- todo estado reside em contas, programas s\u00e3o stateless',
        ],
      },
      {
        type: 'text',
        content:
          'Em sua ess\u00eancia, a Solana separa **c\u00f3digo** de **dados**. Programas (contratos inteligentes) s\u00e3o execut\u00e1veis stateless implantados on-chain. Todo estado mut\u00e1vel \u00e9 armazenado em **contas** -- pense nelas como entradas chave-valor em um banco de dados global, cada uma pertencente a um programa espec\u00edfico.',
      },
      {
        type: 'admonition',
        admonitionType: 'tip',
        content:
          'Programas Solana s\u00e3o stateless. Eles leem e escrevem dados atrav\u00e9s de contas passadas como argumentos de instru\u00e7\u00e3o. Isso \u00e9 fundamentalmente diferente do Ethereum, onde contratos mant\u00eam seu pr\u00f3prio armazenamento.',
      },
      {
        type: 'text',
        content:
          'O runtime da Solana executa programas dentro do motor de processamento paralelo **Sealevel**. Como cada transa\u00e7\u00e3o declara antecipadamente quais contas ir\u00e1 ler e escrever, o Sealevel pode agendar transa\u00e7\u00f5es n\u00e3o conflitantes para execu\u00e7\u00e3o simult\u00e2nea em m\u00faltiplos n\u00facleos.',
      },
      {
        type: 'code',
        language: 'rust',
        content: `use solana_program::{
  account_info::AccountInfo,
  entrypoint,
  entrypoint::ProgramResult,
  msg,
  pubkey::Pubkey,
};

// Declara o entrypoint do programa
entrypoint!(process_instruction);

pub fn process_instruction(
  program_id: &Pubkey,
  accounts: &[AccountInfo],
  instruction_data: &[u8],
) -> ProgramResult {
  msg!("Ol\u00e1, Solana! Program ID: {}", program_id);
  msg!("N\u00famero de contas: {}", accounts.len());
  msg!("Tamanho dos dados de instru\u00e7\u00e3o: {}", instruction_data.len());
  Ok(())
}`,
      },
      {
        type: 'text',
        content:
          'Todo programa Solana come\u00e7a com um **entrypoint**. A macro `entrypoint!` registra uma fun\u00e7\u00e3o que o runtime chama sempre que uma transa\u00e7\u00e3o direciona seu programa. Ela recebe tr\u00eas argumentos: o ID do programa, um array de contas e dados brutos de instru\u00e7\u00e3o.',
      },
      {
        type: 'admonition',
        admonitionType: 'info',
        content:
          'Na pr\u00e1tica, a maioria dos desenvolvedores usa o **framework Anchor** em vez de chamadas diretas ao `solana_program`. O Anchor fornece macros que lidam automaticamente com serializa\u00e7\u00e3o, valida\u00e7\u00e3o de contas e tratamento de erros. Abordaremos o Anchor na Li\u00e7\u00e3o 3.',
      },
      {
        type: 'text',
        content:
          'Quando voc\u00ea implanta um programa, a Solana armazena o bytecode BPF compilado em uma **conta execut\u00e1vel**. O programa em si n\u00e3o possui armazenamento mut\u00e1vel -- ele s\u00f3 pode modificar contas que s\u00e3o passadas para ele e sobre as quais possui autoridade.',
      },
      {
        type: 'admonition',
        admonitionType: 'tip',
        content:
          'Use `solana-test-validator` para iniciar um cluster local para desenvolvimento. Ele oferece um ciclo de feedback instant\u00e2neo sem precisar de SOL de devnet ou lidar com limites de taxa.',
      },
    ],
    es: [
      {
        type: 'text',
        content:
          'Solana es una blockchain de alto rendimiento dise\u00f1ada para la adopci\u00f3n masiva. A diferencia de blockchains tradicionales que procesan transacciones secuencialmente, Solana introduce la **Prueba de Historia (PoH)** -- un reloj criptogr\u00e1fico que permite a los validadores acordar el orden de los eventos sin comunicaci\u00f3n constante.',
      },
      {
        type: 'key-concepts',
        concepts: [
          'Prueba de Historia (PoH) -- marcas de tiempo criptogr\u00e1ficas para ordenar transacciones',
          'Alto rendimiento -- hasta 65,000 transacciones por segundo',
          'Bajo costo -- comisi\u00f3n promedio por transacci\u00f3n inferior a $0.001',
          'Modelo de cuentas -- todo el estado reside en cuentas, los programas son stateless',
        ],
      },
      {
        type: 'text',
        content:
          'En su n\u00facleo, Solana separa **c\u00f3digo** de **datos**. Los programas (contratos inteligentes) son ejecutables stateless desplegados on-chain. Todo estado mutable se almacena en **cuentas** -- pi\u00e9nsalas como entradas clave-valor en una base de datos global, cada una propiedad de un programa espec\u00edfico.',
      },
      {
        type: 'admonition',
        admonitionType: 'tip',
        content:
          'Los programas de Solana son stateless. Leen y escriben datos a trav\u00e9s de cuentas pasadas como argumentos de instrucci\u00f3n. Esto es fundamentalmente diferente de Ethereum, donde los contratos mantienen su propio almacenamiento.',
      },
      {
        type: 'text',
        content:
          'El runtime de Solana ejecuta programas dentro del motor de procesamiento paralelo **Sealevel**. Como cada transacci\u00f3n declara de antemano qu\u00e9 cuentas leer\u00e1 y escribir\u00e1, Sealevel puede programar transacciones no conflictivas para ejecuci\u00f3n simult\u00e1nea en m\u00faltiples n\u00facleos.',
      },
      {
        type: 'code',
        language: 'rust',
        content: `use solana_program::{
  account_info::AccountInfo,
  entrypoint,
  entrypoint::ProgramResult,
  msg,
  pubkey::Pubkey,
};

// Declara el entrypoint del programa
entrypoint!(process_instruction);

pub fn process_instruction(
  program_id: &Pubkey,
  accounts: &[AccountInfo],
  instruction_data: &[u8],
) -> ProgramResult {
  msg!("Hola, Solana! Program ID: {}", program_id);
  msg!("N\u00famero de cuentas: {}", accounts.len());
  msg!("Longitud de datos de instrucci\u00f3n: {}", instruction_data.len());
  Ok(())
}`,
      },
      {
        type: 'text',
        content:
          'Todo programa de Solana comienza con un **entrypoint**. La macro `entrypoint!` registra una funci\u00f3n que el runtime llama cada vez que una transacci\u00f3n apunta a tu programa. Recibe tres argumentos: el ID del programa, un array de cuentas y datos brutos de instrucci\u00f3n.',
      },
      {
        type: 'admonition',
        admonitionType: 'info',
        content:
          'En la pr\u00e1ctica, la mayor\u00eda de desarrolladores usa el **framework Anchor** en lugar de llamadas directas a `solana_program`. Anchor proporciona macros que manejan autom\u00e1ticamente la serializaci\u00f3n, validaci\u00f3n de cuentas y manejo de errores. Cubriremos Anchor en la Lecci\u00f3n 3.',
      },
      {
        type: 'text',
        content:
          'Cuando despliegas un programa, Solana almacena el bytecode BPF compilado en una **cuenta ejecutable**. El programa en s\u00ed no tiene almacenamiento mutable -- solo puede modificar cuentas que le son pasadas y sobre las cuales tiene autoridad.',
      },
      {
        type: 'admonition',
        admonitionType: 'tip',
        content:
          'Usa `solana-test-validator` para levantar un cluster local de desarrollo. Te da un ciclo de retroalimentaci\u00f3n instant\u00e1neo sin necesitar SOL de devnet ni lidiar con l\u00edmites de tasa.',
      },
    ],
  },

  // ======================================================================
  // Lesson 1: Accounts and Data Model
  // ======================================================================
  {
    lessonIndex: 1,
    en: [
      {
        type: 'text',
        content:
          'Everything on Solana is an **account**. Programs, wallets, token balances, NFT metadata -- they all live inside accounts. Understanding the account model is the single most important concept for Solana development.',
      },
      {
        type: 'key-concepts',
        concepts: [
          'Account structure -- address (pubkey), lamport balance, data buffer, owner program, executable flag',
          'PDA derivation -- deterministic addresses from seeds + program ID, no private key',
          'Owner model -- only the owner program can modify an account\'s data',
          'Rent exemption -- accounts must hold minimum lamports to avoid garbage collection',
        ],
      },
      {
        type: 'text',
        content:
          'Every account has five core fields:\n\n1. **Address** (Pubkey) -- a 32-byte Ed25519 public key that uniquely identifies the account.\n2. **Lamports** -- the SOL balance in the smallest unit (1 SOL = 1 billion lamports).\n3. **Data** -- a byte array storing arbitrary program state.\n4. **Owner** -- the program that has write access to this account\'s data.\n5. **Executable** -- a flag indicating whether this account contains a deployed program.',
      },
      {
        type: 'admonition',
        admonitionType: 'warning',
        content:
          'Only the owner program can modify an account\'s data field. The System Program owns all new wallets. When you "create" an account for your program, you are actually transferring ownership from the System Program to your program.',
      },
      {
        type: 'text',
        content:
          '**Program Derived Addresses (PDAs)** are special accounts whose addresses are derived deterministically from a set of seeds and a program ID. Unlike normal accounts, PDAs do not lie on the Ed25519 curve, which means no private key exists for them. This makes them perfect for program-controlled state.',
      },
      {
        type: 'code',
        language: 'typescript',
        content: `import { PublicKey } from "@solana/web3.js";

const PROGRAM_ID = new PublicKey("YourProgramId...");

// Derive a PDA for a user's profile account
const [profilePda, bump] = PublicKey.findProgramAddressSync(
  [
    Buffer.from("profile"),          // static seed
    userWallet.toBuffer(),           // dynamic seed (user pubkey)
  ],
  PROGRAM_ID,
);

console.log("Profile PDA:", profilePda.toBase58());
console.log("Bump seed:", bump);`,
      },
      {
        type: 'text',
        content:
          'The `findProgramAddressSync` method iterates bump seeds from 255 downward until it finds an address that falls off the Ed25519 curve. The resulting bump is stored alongside your data so you can re-derive the PDA in your program.',
      },
      {
        type: 'admonition',
        admonitionType: 'tip',
        content:
          'Always use `findProgramAddressSync` (or its async variant) on the client side. Inside your Anchor program, the bump is automatically verified through the `seeds` constraint, saving compute units.',
      },
      {
        type: 'text',
        content:
          '**Rent** is a mechanism that prevents state bloat. Every account must maintain a minimum lamport balance proportional to its data size. If an account\'s balance falls below the rent-exempt threshold, validators may garbage-collect it. In practice, all accounts should be made rent-exempt at creation time.',
      },
      {
        type: 'text',
        content:
          'The rent-exempt minimum is calculated as: `(128 + data_size) * rent_per_byte_year * 2`. For a 100-byte account, this is approximately 0.00144768 SOL. Anchor\'s `init` constraint handles this calculation automatically and transfers the correct amount from the payer.',
      },
    ],
    pt: [
      {
        type: 'text',
        content:
          'Tudo na Solana \u00e9 uma **conta**. Programas, carteiras, saldos de tokens, metadados de NFT -- tudo reside em contas. Compreender o modelo de contas \u00e9 o conceito mais importante para o desenvolvimento na Solana.',
      },
      {
        type: 'key-concepts',
        concepts: [
          'Estrutura da conta -- endere\u00e7o (pubkey), saldo em lamports, buffer de dados, programa propriet\u00e1rio, flag de execut\u00e1vel',
          'Deriva\u00e7\u00e3o de PDA -- endere\u00e7os determin\u00edsticos a partir de seeds + ID do programa, sem chave privada',
          'Modelo de propriedade -- somente o programa propriet\u00e1rio pode modificar os dados de uma conta',
          'Isen\u00e7\u00e3o de aluguel -- contas devem manter um m\u00ednimo de lamports para evitar coleta de lixo',
        ],
      },
      {
        type: 'text',
        content:
          'Toda conta possui cinco campos principais:\n\n1. **Endere\u00e7o** (Pubkey) -- uma chave p\u00fablica Ed25519 de 32 bytes que identifica a conta.\n2. **Lamports** -- o saldo em SOL na menor unidade (1 SOL = 1 bilh\u00e3o de lamports).\n3. **Dados** -- um array de bytes que armazena estado arbitr\u00e1rio do programa.\n4. **Propriet\u00e1rio** -- o programa que tem acesso de escrita aos dados desta conta.\n5. **Execut\u00e1vel** -- um flag indicando se esta conta cont\u00e9m um programa implantado.',
      },
      {
        type: 'admonition',
        admonitionType: 'warning',
        content:
          'Somente o programa propriet\u00e1rio pode modificar o campo de dados de uma conta. O System Program \u00e9 propriet\u00e1rio de todas as carteiras novas. Quando voc\u00ea "cria" uma conta para seu programa, na verdade est\u00e1 transferindo a propriedade do System Program para o seu programa.',
      },
      {
        type: 'text',
        content:
          '**Endere\u00e7os Derivados de Programa (PDAs)** s\u00e3o contas especiais cujos endere\u00e7os s\u00e3o derivados deterministicamente a partir de um conjunto de seeds e um ID de programa. Diferente de contas normais, PDAs n\u00e3o est\u00e3o na curva Ed25519, o que significa que n\u00e3o existe chave privada para eles.',
      },
      {
        type: 'code',
        language: 'typescript',
        content: `import { PublicKey } from "@solana/web3.js";

const PROGRAM_ID = new PublicKey("SeuProgramId...");

// Derivar um PDA para a conta de perfil do usu\u00e1rio
const [profilePda, bump] = PublicKey.findProgramAddressSync(
  [
    Buffer.from("profile"),          // seed est\u00e1tica
    userWallet.toBuffer(),           // seed din\u00e2mica (pubkey do usu\u00e1rio)
  ],
  PROGRAM_ID,
);

console.log("PDA do Perfil:", profilePda.toBase58());
console.log("Seed bump:", bump);`,
      },
      {
        type: 'text',
        content:
          'O m\u00e9todo `findProgramAddressSync` itera seeds de bump de 255 para baixo at\u00e9 encontrar um endere\u00e7o fora da curva Ed25519. O bump resultante \u00e9 armazenado junto com seus dados para que voc\u00ea possa re-derivar o PDA em seu programa.',
      },
      {
        type: 'admonition',
        admonitionType: 'tip',
        content:
          'Sempre use `findProgramAddressSync` (ou sua variante ass\u00edncrona) no lado do cliente. Dentro do seu programa Anchor, o bump \u00e9 verificado automaticamente atrav\u00e9s da restri\u00e7\u00e3o `seeds`, economizando unidades de computa\u00e7\u00e3o.',
      },
      {
        type: 'text',
        content:
          '**Aluguel** \u00e9 um mecanismo que previne infla\u00e7\u00e3o de estado. Toda conta deve manter um saldo m\u00ednimo de lamports proporcional ao tamanho dos seus dados. Se o saldo de uma conta cair abaixo do limite de isen\u00e7\u00e3o de aluguel, validadores podem coletar essa conta.',
      },
      {
        type: 'text',
        content:
          'O m\u00ednimo para isen\u00e7\u00e3o de aluguel \u00e9 calculado como: `(128 + tamanho_dados) * aluguel_por_byte_ano * 2`. Para uma conta de 100 bytes, isso \u00e9 aproximadamente 0,00144768 SOL. A restri\u00e7\u00e3o `init` do Anchor lida com esse c\u00e1lculo automaticamente.',
      },
    ],
    es: [
      {
        type: 'text',
        content:
          'Todo en Solana es una **cuenta**. Programas, billeteras, saldos de tokens, metadatos de NFT -- todo reside en cuentas. Comprender el modelo de cuentas es el concepto m\u00e1s importante para el desarrollo en Solana.',
      },
      {
        type: 'key-concepts',
        concepts: [
          'Estructura de cuenta -- direcci\u00f3n (pubkey), saldo en lamports, buffer de datos, programa propietario, flag de ejecutable',
          'Derivaci\u00f3n de PDA -- direcciones determin\u00edsticas a partir de seeds + ID del programa, sin clave privada',
          'Modelo de propiedad -- solo el programa propietario puede modificar los datos de una cuenta',
          'Exenci\u00f3n de renta -- las cuentas deben mantener un m\u00ednimo de lamports para evitar recolecci\u00f3n de basura',
        ],
      },
      {
        type: 'text',
        content:
          'Toda cuenta tiene cinco campos principales:\n\n1. **Direcci\u00f3n** (Pubkey) -- una clave p\u00fablica Ed25519 de 32 bytes que identifica la cuenta.\n2. **Lamports** -- el saldo en SOL en la unidad m\u00e1s peque\u00f1a (1 SOL = mil millones de lamports).\n3. **Datos** -- un array de bytes que almacena estado arbitrario del programa.\n4. **Propietario** -- el programa que tiene acceso de escritura a los datos de esta cuenta.\n5. **Ejecutable** -- un flag que indica si esta cuenta contiene un programa desplegado.',
      },
      {
        type: 'admonition',
        admonitionType: 'warning',
        content:
          'Solo el programa propietario puede modificar el campo de datos de una cuenta. El System Program es propietario de todas las billeteras nuevas. Cuando "creas" una cuenta para tu programa, en realidad est\u00e1s transfiriendo la propiedad del System Program a tu programa.',
      },
      {
        type: 'text',
        content:
          'Las **Direcciones Derivadas de Programa (PDAs)** son cuentas especiales cuyas direcciones se derivan determin\u00edsticamente de un conjunto de seeds y un ID de programa. A diferencia de cuentas normales, los PDAs no est\u00e1n en la curva Ed25519, lo que significa que no existe clave privada para ellos.',
      },
      {
        type: 'code',
        language: 'typescript',
        content: `import { PublicKey } from "@solana/web3.js";

const PROGRAM_ID = new PublicKey("TuProgramId...");

// Derivar un PDA para la cuenta de perfil del usuario
const [profilePda, bump] = PublicKey.findProgramAddressSync(
  [
    Buffer.from("profile"),          // seed est\u00e1tica
    userWallet.toBuffer(),           // seed din\u00e1mica (pubkey del usuario)
  ],
  PROGRAM_ID,
);

console.log("PDA del Perfil:", profilePda.toBase58());
console.log("Seed bump:", bump);`,
      },
      {
        type: 'text',
        content:
          'El m\u00e9todo `findProgramAddressSync` itera seeds de bump desde 255 hacia abajo hasta encontrar una direcci\u00f3n fuera de la curva Ed25519. El bump resultante se almacena junto con tus datos para que puedas re-derivar el PDA en tu programa.',
      },
      {
        type: 'admonition',
        admonitionType: 'tip',
        content:
          'Siempre usa `findProgramAddressSync` (o su variante as\u00edncrona) en el lado del cliente. Dentro de tu programa Anchor, el bump se verifica autom\u00e1ticamente a trav\u00e9s de la restricci\u00f3n `seeds`, ahorrando unidades de c\u00f3mputo.',
      },
      {
        type: 'text',
        content:
          'La **renta** es un mecanismo que previene la inflaci\u00f3n de estado. Toda cuenta debe mantener un saldo m\u00ednimo de lamports proporcional al tama\u00f1o de sus datos. Si el saldo de una cuenta cae por debajo del umbral de exenci\u00f3n de renta, los validadores pueden recolectarla.',
      },
      {
        type: 'text',
        content:
          'El m\u00ednimo para exenci\u00f3n de renta se calcula como: `(128 + tama\u00f1o_datos) * renta_por_byte_a\u00f1o * 2`. Para una cuenta de 100 bytes, esto es aproximadamente 0.00144768 SOL. La restricci\u00f3n `init` de Anchor maneja este c\u00e1lculo autom\u00e1ticamente.',
      },
    ],
  },

  // ======================================================================
  // Lesson 2: Transactions and Instructions
  // ======================================================================
  {
    lessonIndex: 2,
    en: [
      {
        type: 'text',
        content:
          'Transactions are the fundamental unit of interaction with Solana. Every state change on the network happens through a transaction. A transaction is an atomic batch of **instructions** -- either all succeed or all fail.',
      },
      {
        type: 'key-concepts',
        concepts: [
          'Transaction lifecycle -- create, sign, send, confirm',
          'Instructions -- the smallest unit of execution, targeting a specific program',
          'Recent blockhash -- a timestamp that prevents replay attacks and expires after ~60 seconds',
          'Versioned transactions -- V0 transactions support Address Lookup Tables for more accounts',
        ],
      },
      {
        type: 'text',
        content:
          'A transaction consists of three parts:\n\n1. **Message** -- contains the instructions, account keys, and a recent blockhash.\n2. **Signatures** -- Ed25519 signatures from all required signers.\n3. **Recent Blockhash** -- a reference to a recent block that acts as a transaction expiry.',
      },
      {
        type: 'text',
        content:
          'Each **instruction** within a transaction specifies:\n\n- **Program ID** -- the on-chain program to execute.\n- **Accounts** -- the accounts the instruction needs to read/write, with `isSigner` and `isWritable` flags.\n- **Data** -- serialized arguments for the program.',
      },
      {
        type: 'admonition',
        admonitionType: 'info',
        content:
          'A single transaction can contain multiple instructions targeting different programs. This composability is one of Solana\'s superpowers -- you can atomically swap tokens, update metadata, and emit an event all in one transaction.',
      },
      {
        type: 'code',
        language: 'typescript',
        content: `import {
  Connection,
  Keypair,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";

const connection = new Connection("http://localhost:8899", "confirmed");
const sender = Keypair.generate();
const recipient = Keypair.generate().publicKey;

async function transferSol() {
  // Airdrop SOL for testing
  const airdropSig = await connection.requestAirdrop(
    sender.publicKey,
    2 * LAMPORTS_PER_SOL,
  );
  await connection.confirmTransaction(airdropSig);

  // Create a transfer instruction
  const transferIx = SystemProgram.transfer({
    fromPubkey: sender.publicKey,
    toPubkey: recipient,
    lamports: 0.5 * LAMPORTS_PER_SOL,
  });

  // Build and send the transaction
  const tx = new Transaction().add(transferIx);
  const signature = await sendAndConfirmTransaction(connection, tx, [sender]);

  console.log("Transaction confirmed:", signature);
}`,
      },
      {
        type: 'text',
        content:
          'The `sendAndConfirmTransaction` helper handles fetching a recent blockhash, signing, sending, and waiting for confirmation. Under the hood, the flow is: fetch blockhash, set on transaction, sign with required keypairs, serialize and send, then poll for confirmation.',
      },
      {
        type: 'admonition',
        admonitionType: 'warning',
        content:
          'Transactions expire after roughly 60 seconds (150 slots). If your transaction is not confirmed in time, you must fetch a new blockhash and re-sign. Never reuse a stale blockhash.',
      },
      {
        type: 'text',
        content:
          '**Versioned Transactions** (V0) were introduced to support **Address Lookup Tables** (ALTs). Legacy transactions are limited to 35 accounts due to the 1232-byte packet size. V0 transactions can reference ALTs that store account addresses off-chain, effectively lifting this limit.',
      },
      {
        type: 'admonition',
        admonitionType: 'tip',
        content:
          'For most use cases, legacy transactions work fine. Use V0 transactions when you need to interact with programs that require many accounts (like DeFi protocols with large routing tables).',
      },
    ],
    pt: [
      {
        type: 'text',
        content:
          'Transa\u00e7\u00f5es s\u00e3o a unidade fundamental de intera\u00e7\u00e3o com a Solana. Toda mudan\u00e7a de estado na rede acontece atrav\u00e9s de uma transa\u00e7\u00e3o. Uma transa\u00e7\u00e3o \u00e9 um lote at\u00f4mico de **instru\u00e7\u00f5es** -- ou todas s\u00e3o bem-sucedidas ou todas falham.',
      },
      {
        type: 'key-concepts',
        concepts: [
          'Ciclo de vida da transa\u00e7\u00e3o -- criar, assinar, enviar, confirmar',
          'Instru\u00e7\u00f5es -- a menor unidade de execu\u00e7\u00e3o, direcionada a um programa espec\u00edfico',
          'Blockhash recente -- um timestamp que previne ataques de replay e expira ap\u00f3s ~60 segundos',
          'Transa\u00e7\u00f5es versionadas -- transa\u00e7\u00f5es V0 suportam Address Lookup Tables para mais contas',
        ],
      },
      {
        type: 'text',
        content:
          'Uma transa\u00e7\u00e3o consiste em tr\u00eas partes:\n\n1. **Mensagem** -- cont\u00e9m as instru\u00e7\u00f5es, chaves de conta e um blockhash recente.\n2. **Assinaturas** -- assinaturas Ed25519 de todos os signat\u00e1rios necess\u00e1rios.\n3. **Blockhash Recente** -- uma refer\u00eancia a um bloco recente que atua como expira\u00e7\u00e3o da transa\u00e7\u00e3o.',
      },
      {
        type: 'text',
        content:
          'Cada **instru\u00e7\u00e3o** dentro de uma transa\u00e7\u00e3o especifica:\n\n- **ID do Programa** -- o programa on-chain a ser executado.\n- **Contas** -- as contas que a instru\u00e7\u00e3o precisa ler/escrever, com flags `isSigner` e `isWritable`.\n- **Dados** -- argumentos serializados para o programa.',
      },
      {
        type: 'admonition',
        admonitionType: 'info',
        content:
          'Uma \u00fanica transa\u00e7\u00e3o pode conter m\u00faltiplas instru\u00e7\u00f5es direcionadas a diferentes programas. Essa composabilidade \u00e9 um dos superpoderes da Solana -- voc\u00ea pode atomicamente trocar tokens, atualizar metadados e emitir um evento tudo em uma transa\u00e7\u00e3o.',
      },
      {
        type: 'code',
        language: 'typescript',
        content: `import {
  Connection,
  Keypair,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";

const connection = new Connection("http://localhost:8899", "confirmed");
const sender = Keypair.generate();
const recipient = Keypair.generate().publicKey;

async function transferirSol() {
  const airdropSig = await connection.requestAirdrop(
    sender.publicKey,
    2 * LAMPORTS_PER_SOL,
  );
  await connection.confirmTransaction(airdropSig);

  const transferIx = SystemProgram.transfer({
    fromPubkey: sender.publicKey,
    toPubkey: recipient,
    lamports: 0.5 * LAMPORTS_PER_SOL,
  });

  const tx = new Transaction().add(transferIx);
  const signature = await sendAndConfirmTransaction(connection, tx, [sender]);

  console.log("Transa\u00e7\u00e3o confirmada:", signature);
}`,
      },
      {
        type: 'text',
        content:
          'O helper `sendAndConfirmTransaction` cuida de buscar um blockhash recente, assinar, enviar e aguardar a confirma\u00e7\u00e3o. O fluxo interno \u00e9: buscar blockhash, definir na transa\u00e7\u00e3o, assinar com keypairs, serializar e enviar, consultar confirma\u00e7\u00e3o.',
      },
      {
        type: 'admonition',
        admonitionType: 'warning',
        content:
          'Transa\u00e7\u00f5es expiram ap\u00f3s aproximadamente 60 segundos (150 slots). Se sua transa\u00e7\u00e3o n\u00e3o for confirmada a tempo, voc\u00ea deve buscar um novo blockhash e reassinar. Nunca reutilize um blockhash obsoleto.',
      },
      {
        type: 'text',
        content:
          '**Transa\u00e7\u00f5es Versionadas** (V0) foram introduzidas para suportar **Address Lookup Tables** (ALTs). Transa\u00e7\u00f5es legadas s\u00e3o limitadas a 35 contas. Transa\u00e7\u00f5es V0 podem referenciar ALTs que armazenam endere\u00e7os fora da cadeia, eliminando esse limite.',
      },
      {
        type: 'admonition',
        admonitionType: 'tip',
        content:
          'Para a maioria dos casos de uso, transa\u00e7\u00f5es legadas funcionam bem. Use transa\u00e7\u00f5es V0 quando precisar interagir com programas que requerem muitas contas (como protocolos DeFi).',
      },
    ],
    es: [
      {
        type: 'text',
        content:
          'Las transacciones son la unidad fundamental de interacci\u00f3n con Solana. Todo cambio de estado en la red ocurre a trav\u00e9s de una transacci\u00f3n. Una transacci\u00f3n es un lote at\u00f3mico de **instrucciones** -- todas tienen \u00e9xito o todas fallan.',
      },
      {
        type: 'key-concepts',
        concepts: [
          'Ciclo de vida de la transacci\u00f3n -- crear, firmar, enviar, confirmar',
          'Instrucciones -- la unidad m\u00e1s peque\u00f1a de ejecuci\u00f3n, dirigida a un programa espec\u00edfico',
          'Blockhash reciente -- una marca temporal que previene ataques de replay y expira despu\u00e9s de ~60 segundos',
          'Transacciones versionadas -- las transacciones V0 soportan Address Lookup Tables para m\u00e1s cuentas',
        ],
      },
      {
        type: 'text',
        content:
          'Una transacci\u00f3n consta de tres partes:\n\n1. **Mensaje** -- contiene las instrucciones, claves de cuenta y un blockhash reciente.\n2. **Firmas** -- firmas Ed25519 de todos los firmantes requeridos.\n3. **Blockhash Reciente** -- una referencia a un bloque reciente que act\u00faa como expiraci\u00f3n de la transacci\u00f3n.',
      },
      {
        type: 'text',
        content:
          'Cada **instrucci\u00f3n** dentro de una transacci\u00f3n especifica:\n\n- **ID del Programa** -- el programa on-chain a ejecutar.\n- **Cuentas** -- las cuentas que la instrucci\u00f3n necesita leer/escribir, con flags `isSigner` e `isWritable`.\n- **Datos** -- argumentos serializados para el programa.',
      },
      {
        type: 'admonition',
        admonitionType: 'info',
        content:
          'Una sola transacci\u00f3n puede contener m\u00faltiples instrucciones dirigidas a diferentes programas. Esta componibilidad es uno de los superpoderes de Solana -- puedes at\u00f3micamente intercambiar tokens, actualizar metadatos y emitir un evento todo en una transacci\u00f3n.',
      },
      {
        type: 'code',
        language: 'typescript',
        content: `import {
  Connection,
  Keypair,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";

const connection = new Connection("http://localhost:8899", "confirmed");
const sender = Keypair.generate();
const recipient = Keypair.generate().publicKey;

async function transferirSol() {
  const airdropSig = await connection.requestAirdrop(
    sender.publicKey,
    2 * LAMPORTS_PER_SOL,
  );
  await connection.confirmTransaction(airdropSig);

  const transferIx = SystemProgram.transfer({
    fromPubkey: sender.publicKey,
    toPubkey: recipient,
    lamports: 0.5 * LAMPORTS_PER_SOL,
  });

  const tx = new Transaction().add(transferIx);
  const signature = await sendAndConfirmTransaction(connection, tx, [sender]);

  console.log("Transacci\u00f3n confirmada:", signature);
}`,
      },
      {
        type: 'text',
        content:
          'El helper `sendAndConfirmTransaction` se encarga de obtener un blockhash reciente, firmar, enviar y esperar la confirmaci\u00f3n. El flujo interno es: obtener blockhash, establecer en la transacci\u00f3n, firmar con keypairs, serializar y enviar, consultar confirmaci\u00f3n.',
      },
      {
        type: 'admonition',
        admonitionType: 'warning',
        content:
          'Las transacciones expiran despu\u00e9s de aproximadamente 60 segundos (150 slots). Si tu transacci\u00f3n no se confirma a tiempo, debes obtener un nuevo blockhash y refirmar. Nunca reutilices un blockhash obsoleto.',
      },
      {
        type: 'text',
        content:
          'Las **Transacciones Versionadas** (V0) se introdujeron para soportar **Address Lookup Tables** (ALTs). Las transacciones heredadas est\u00e1n limitadas a 35 cuentas. Las transacciones V0 pueden referenciar ALTs que almacenan direcciones fuera de la cadena, eliminando ese l\u00edmite.',
      },
      {
        type: 'admonition',
        admonitionType: 'tip',
        content:
          'Para la mayor\u00eda de los casos de uso, las transacciones heredadas funcionan bien. Usa transacciones V0 cuando necesites interactuar con programas que requieren muchas cuentas (como protocolos DeFi).',
      },
    ],
  },

  // ======================================================================
  // Lesson 3: Your First Anchor Program
  // ======================================================================
  {
    lessonIndex: 3,
    en: [
      {
        type: 'text',
        content:
          'The **Anchor framework** is the de facto standard for building Solana programs. It provides a collection of procedural macros that dramatically reduce boilerplate: automatic account deserialization, constraint validation, error handling, and instruction dispatch.',
      },
      {
        type: 'key-concepts',
        concepts: [
          'Anchor macros -- #[program], #[derive(Accounts)], #[account] generate serialization and validation logic',
          'declare_id! -- associates the program with its on-chain address for security checks',
          '#[derive(Accounts)] -- defines the account validation struct for each instruction',
          'Space calculation -- 8 bytes discriminator + your data size, use InitSpace derive macro',
        ],
      },
      {
        type: 'text',
        content:
          'An Anchor program has three core components:\n\n1. **`#[program]` module** -- contains your instruction handlers. Each public function becomes an instruction.\n2. **Account structs** -- `#[derive(Accounts)]` structs validate and deserialize accounts before your handler runs.\n3. **State structs** -- `#[account]` structs define the data layout for on-chain accounts.',
      },
      {
        type: 'code',
        language: 'rust',
        content: `use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod counter {
  use super::*;

  pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
    let counter = &mut ctx.accounts.counter;
    counter.count = 0;
    counter.authority = ctx.accounts.authority.key();
    msg!("Counter initialized with authority: {}", counter.authority);
    Ok(())
  }

  pub fn increment(ctx: Context<Increment>) -> Result<()> {
    let counter = &mut ctx.accounts.counter;
    counter.count = counter.count.checked_add(1)
      .ok_or(ErrorCode::Overflow)?;
    msg!("Counter incremented to: {}", counter.count);
    Ok(())
  }
}`,
      },
      {
        type: 'text',
        content:
          'The `Context<T>` wrapper gives you access to the validated accounts defined in your `#[derive(Accounts)]` struct. By the time your handler runs, Anchor has already verified ownership, signer status, mutability, and any custom constraints.',
      },
      {
        type: 'admonition',
        admonitionType: 'tip',
        content:
          'Always use `checked_add`, `checked_sub`, and `checked_mul` for arithmetic in your programs. Overflow panics will abort the transaction with an unhelpful error. Checked arithmetic lets you return a meaningful error message.',
      },
      {
        type: 'code',
        language: 'rust',
        content: `#[derive(Accounts)]
pub struct Initialize<'info> {
  #[account(
    init,
    payer = authority,
    space = 8 + Counter::INIT_SPACE,
  )]
  pub counter: Account<'info, Counter>,
  #[account(mut)]
  pub authority: Signer<'info>,
  pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct Counter {
  pub count: u64,      // 8 bytes
  pub authority: Pubkey, // 32 bytes
  // Total: 8 (discriminator) + 8 + 32 = 48 bytes
}`,
      },
      {
        type: 'text',
        content:
          'The `init` constraint tells Anchor to create the account via a CPI to the System Program, allocate the specified space, assign ownership to your program, and pay rent from the `payer`. The 8-byte discriminator is a hash of the account type name -- Anchor uses it to prevent type confusion attacks.',
      },
      {
        type: 'admonition',
        admonitionType: 'warning',
        content:
          'Never forget the 8-byte discriminator in your space calculation. If you write `space = Counter::INIT_SPACE` without the `+ 8`, account deserialization will fail with a confusing error.',
      },
      {
        type: 'text',
        content:
          'The `has_one = authority` constraint in the `Increment` struct checks that `counter.authority == authority.key()`. This ensures only the original creator can increment the counter. Anchor generates this check at compile time, so there is zero chance of forgetting it.',
      },
    ],
    pt: [
      {
        type: 'text',
        content:
          'O **framework Anchor** \u00e9 o padr\u00e3o de facto para construir programas na Solana. Ele fornece uma cole\u00e7\u00e3o de macros procedurais que reduzem drasticamente o boilerplate: deserializa\u00e7\u00e3o autom\u00e1tica de contas, valida\u00e7\u00e3o de restri\u00e7\u00f5es, tratamento de erros e despacho de instru\u00e7\u00f5es.',
      },
      {
        type: 'key-concepts',
        concepts: [
          'Macros Anchor -- #[program], #[derive(Accounts)], #[account] geram l\u00f3gica de serializa\u00e7\u00e3o e valida\u00e7\u00e3o',
          'declare_id! -- associa o programa ao seu endere\u00e7o on-chain para verifica\u00e7\u00f5es de seguran\u00e7a',
          '#[derive(Accounts)] -- define a struct de valida\u00e7\u00e3o de contas para cada instru\u00e7\u00e3o',
          'C\u00e1lculo de espa\u00e7o -- 8 bytes discriminador + tamanho dos dados, use a derive macro InitSpace',
        ],
      },
      {
        type: 'text',
        content:
          'Um programa Anchor tem tr\u00eas componentes principais:\n\n1. **M\u00f3dulo `#[program]`** -- cont\u00e9m seus handlers de instru\u00e7\u00e3o. Cada fun\u00e7\u00e3o p\u00fablica se torna uma instru\u00e7\u00e3o.\n2. **Structs de contas** -- structs `#[derive(Accounts)]` validam e deserializam contas antes do seu handler executar.\n3. **Structs de estado** -- structs `#[account]` definem o layout de dados para contas on-chain.',
      },
      {
        type: 'code',
        language: 'rust',
        content: `use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod counter {
  use super::*;

  pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
    let counter = &mut ctx.accounts.counter;
    counter.count = 0;
    counter.authority = ctx.accounts.authority.key();
    msg!("Contador inicializado com autoridade: {}", counter.authority);
    Ok(())
  }

  pub fn increment(ctx: Context<Increment>) -> Result<()> {
    let counter = &mut ctx.accounts.counter;
    counter.count = counter.count.checked_add(1)
      .ok_or(ErrorCode::Overflow)?;
    msg!("Contador incrementado para: {}", counter.count);
    Ok(())
  }
}`,
      },
      {
        type: 'text',
        content:
          'O wrapper `Context<T>` d\u00e1 acesso \u00e0s contas validadas definidas na sua struct `#[derive(Accounts)]`. Quando seu handler executa, o Anchor j\u00e1 verificou propriedade, status de signat\u00e1rio, mutabilidade e quaisquer restri\u00e7\u00f5es customizadas.',
      },
      {
        type: 'admonition',
        admonitionType: 'tip',
        content:
          'Sempre use `checked_add`, `checked_sub` e `checked_mul` para aritm\u00e9tica em seus programas. Panics de overflow abortar\u00e3o a transa\u00e7\u00e3o com um erro pouco \u00fatil. Aritm\u00e9tica verificada permite retornar uma mensagem de erro significativa.',
      },
      {
        type: 'code',
        language: 'rust',
        content: `#[derive(Accounts)]
pub struct Initialize<'info> {
  #[account(init, payer = authority, space = 8 + Counter::INIT_SPACE)]
  pub counter: Account<'info, Counter>,
  #[account(mut)]
  pub authority: Signer<'info>,
  pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct Counter {
  pub count: u64,      // 8 bytes
  pub authority: Pubkey, // 32 bytes
}`,
      },
      {
        type: 'text',
        content:
          'A restri\u00e7\u00e3o `init` instrui o Anchor a criar a conta via CPI ao System Program, alocar o espa\u00e7o especificado, atribuir propriedade ao seu programa e pagar o aluguel do `payer`. O discriminador de 8 bytes \u00e9 um hash do nome do tipo de conta.',
      },
      {
        type: 'admonition',
        admonitionType: 'warning',
        content:
          'Nunca esque\u00e7a o discriminador de 8 bytes no c\u00e1lculo de espa\u00e7o. Se voc\u00ea escrever `space = Counter::INIT_SPACE` sem o `+ 8`, a deserializa\u00e7\u00e3o da conta falhar\u00e1 com um erro confuso.',
      },
      {
        type: 'text',
        content:
          'A restri\u00e7\u00e3o `has_one = authority` na struct `Increment` verifica que `counter.authority == authority.key()`. Isso garante que apenas o criador original pode incrementar o contador. O Anchor gera essa verifica\u00e7\u00e3o em tempo de compila\u00e7\u00e3o.',
      },
    ],
    es: [
      {
        type: 'text',
        content:
          'El **framework Anchor** es el est\u00e1ndar de facto para construir programas en Solana. Proporciona una colecci\u00f3n de macros procedurales que reducen dr\u00e1sticamente el boilerplate: deserializaci\u00f3n autom\u00e1tica de cuentas, validaci\u00f3n de restricciones, manejo de errores y despacho de instrucciones.',
      },
      {
        type: 'key-concepts',
        concepts: [
          'Macros Anchor -- #[program], #[derive(Accounts)], #[account] generan l\u00f3gica de serializaci\u00f3n y validaci\u00f3n',
          'declare_id! -- asocia el programa con su direcci\u00f3n on-chain para verificaciones de seguridad',
          '#[derive(Accounts)] -- define la struct de validaci\u00f3n de cuentas para cada instrucci\u00f3n',
          'C\u00e1lculo de espacio -- 8 bytes discriminador + tama\u00f1o de datos, usa la derive macro InitSpace',
        ],
      },
      {
        type: 'text',
        content:
          'Un programa Anchor tiene tres componentes principales:\n\n1. **M\u00f3dulo `#[program]`** -- contiene tus handlers de instrucci\u00f3n. Cada funci\u00f3n p\u00fablica se convierte en una instrucci\u00f3n.\n2. **Structs de cuentas** -- structs `#[derive(Accounts)]` validan y deserializan cuentas.\n3. **Structs de estado** -- structs `#[account]` definen el layout de datos para cuentas on-chain.',
      },
      {
        type: 'code',
        language: 'rust',
        content: `use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod counter {
  use super::*;

  pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
    let counter = &mut ctx.accounts.counter;
    counter.count = 0;
    counter.authority = ctx.accounts.authority.key();
    msg!("Contador inicializado con autoridad: {}", counter.authority);
    Ok(())
  }

  pub fn increment(ctx: Context<Increment>) -> Result<()> {
    let counter = &mut ctx.accounts.counter;
    counter.count = counter.count.checked_add(1)
      .ok_or(ErrorCode::Overflow)?;
    msg!("Contador incrementado a: {}", counter.count);
    Ok(())
  }
}`,
      },
      {
        type: 'text',
        content:
          'El wrapper `Context<T>` te da acceso a las cuentas validadas definidas en tu struct `#[derive(Accounts)]`. Para cuando tu handler se ejecuta, Anchor ya ha verificado propiedad, estado de firmante, mutabilidad y restricciones personalizadas.',
      },
      {
        type: 'admonition',
        admonitionType: 'tip',
        content:
          'Siempre usa `checked_add`, `checked_sub` y `checked_mul` para aritm\u00e9tica en tus programas. Los panics de overflow abortar\u00e1n la transacci\u00f3n con un error poco \u00fatil. La aritm\u00e9tica verificada te permite devolver un mensaje de error significativo.',
      },
      {
        type: 'code',
        language: 'rust',
        content: `#[derive(Accounts)]
pub struct Initialize<'info> {
  #[account(init, payer = authority, space = 8 + Counter::INIT_SPACE)]
  pub counter: Account<'info, Counter>,
  #[account(mut)]
  pub authority: Signer<'info>,
  pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct Counter {
  pub count: u64,      // 8 bytes
  pub authority: Pubkey, // 32 bytes
}`,
      },
      {
        type: 'text',
        content:
          'La restricci\u00f3n `init` le dice a Anchor que cree la cuenta v\u00eda CPI al System Program, asigne el espacio especificado, asigne propiedad a tu programa y pague la renta del `payer`. El discriminador de 8 bytes es un hash del nombre del tipo de cuenta.',
      },
      {
        type: 'admonition',
        admonitionType: 'warning',
        content:
          'Nunca olvides el discriminador de 8 bytes en tu c\u00e1lculo de espacio. Si escribes `space = Counter::INIT_SPACE` sin el `+ 8`, la deserializaci\u00f3n de cuenta fallar\u00e1 con un error confuso.',
      },
      {
        type: 'text',
        content:
          'La restricci\u00f3n `has_one = authority` en la struct `Increment` verifica que `counter.authority == authority.key()`. Esto asegura que solo el creador original puede incrementar el contador.',
      },
    ],
  },

  // ======================================================================
  // Lesson 4: Final Challenge -- Build a Token Vault
  // ======================================================================
  {
    lessonIndex: 4,
    en: [
      {
        type: 'text',
        content:
          'Time to put everything together. In this challenge, you will build a **Token Vault** program using Anchor. The vault stores a balance and restricts withdrawals to the authorized user.',
      },
      {
        type: 'key-concepts',
        concepts: [
          'Account initialization with init constraint and proper space calculation',
          'Authority-based access control with has_one constraint',
          'Safe arithmetic using checked_add and checked_sub',
          'Custom error codes with #[error_code] for meaningful failure messages',
          'PDA-based account derivation for deterministic vault addresses',
        ],
      },
      {
        type: 'text',
        content:
          'Your vault program must implement three instructions:\n\n1. **`initialize`** -- Creates the vault account, sets the authority to the signer, and initializes the balance to 0.\n2. **`deposit`** -- Adds tokens to the vault balance. Must handle overflow.\n3. **`withdraw`** -- Removes tokens from the vault balance. Must verify authority and handle underflow.',
      },
      {
        type: 'admonition',
        admonitionType: 'info',
        content:
          'This challenge simulates a simplified vault. In a production program, you would use SPL Token accounts and actual token transfers. Here we track a virtual balance to focus on the Anchor patterns.',
      },
      {
        type: 'text',
        content:
          'Pay special attention to **error handling**. Your program must:\n\n- Return `VaultError::Unauthorized` when a non-authority user tries to withdraw.\n- Return `VaultError::Overflow` when a deposit would cause a u64 overflow.\n- Return `VaultError::InsufficientFunds` when a withdrawal exceeds the balance.',
      },
      {
        type: 'code',
        language: 'rust',
        content: `// Example: using checked arithmetic with custom errors
pub fn deposit(ctx: Context<VaultAction>, amount: u64) -> Result<()> {
  let vault = &mut ctx.accounts.vault;
  vault.balance = vault.balance
    .checked_add(amount)
    .ok_or(VaultError::Overflow)?;
  Ok(())
}`,
      },
      {
        type: 'admonition',
        admonitionType: 'warning',
        content:
          'There are 5 test cases, including 2 hidden tests for edge cases. Make sure your program handles unauthorized access and arithmetic overflow correctly.',
      },
      {
        type: 'text',
        content:
          'The `has_one = authority @ VaultError::Unauthorized` syntax in the `VaultAction` struct tells Anchor to check that `vault.authority == authority.key()` and return your custom error if the check fails.',
      },
      {
        type: 'admonition',
        admonitionType: 'tip',
        content:
          'Test your solution against all visible test cases before submitting. Think about edge cases: what happens with a zero deposit? What about withdrawing exactly the full balance? Your code should handle these gracefully.',
      },
      {
        type: 'text',
        content:
          'Good luck! Once you pass all 5 test cases, you will earn the "Challenge Accepted" achievement and complete the Solana 101 course.',
      },
    ],
    pt: [
      {
        type: 'text',
        content:
          'Hora de colocar tudo em pr\u00e1tica. Neste desafio, voc\u00ea construir\u00e1 um programa de **Cofre de Tokens** usando Anchor. O cofre armazena um saldo e restringe saques ao usu\u00e1rio autorizado.',
      },
      {
        type: 'key-concepts',
        concepts: [
          'Inicializa\u00e7\u00e3o de conta com restri\u00e7\u00e3o init e c\u00e1lculo adequado de espa\u00e7o',
          'Controle de acesso baseado em autoridade com restri\u00e7\u00e3o has_one',
          'Aritm\u00e9tica segura usando checked_add e checked_sub',
          'C\u00f3digos de erro personalizados com #[error_code] para mensagens significativas',
          'Deriva\u00e7\u00e3o de conta baseada em PDA para endere\u00e7os determin\u00edsticos de cofre',
        ],
      },
      {
        type: 'text',
        content:
          'Seu programa de cofre deve implementar tr\u00eas instru\u00e7\u00f5es:\n\n1. **`initialize`** -- Cria a conta do cofre, define a autoridade como o signat\u00e1rio e inicializa o saldo em 0.\n2. **`deposit`** -- Adiciona tokens ao saldo do cofre. Deve tratar overflow.\n3. **`withdraw`** -- Remove tokens do saldo do cofre. Deve verificar a autoridade e tratar underflow.',
      },
      {
        type: 'admonition',
        admonitionType: 'info',
        content:
          'Este desafio simula um cofre simplificado. Em um programa de produ\u00e7\u00e3o, voc\u00ea usaria contas SPL Token e transfer\u00eancias reais de tokens. Aqui rastreamos um saldo virtual para focar nos padr\u00f5es do Anchor.',
      },
      {
        type: 'text',
        content:
          'Preste aten\u00e7\u00e3o especial ao **tratamento de erros**. Seu programa deve:\n\n- Retornar `VaultError::Unauthorized` quando um usu\u00e1rio n\u00e3o autorizado tentar sacar.\n- Retornar `VaultError::Overflow` quando um dep\u00f3sito causar overflow de u64.\n- Retornar `VaultError::InsufficientFunds` quando um saque exceder o saldo.',
      },
      {
        type: 'code',
        language: 'rust',
        content: `// Exemplo: usando aritm\u00e9tica verificada com erros personalizados
pub fn deposit(ctx: Context<VaultAction>, amount: u64) -> Result<()> {
  let vault = &mut ctx.accounts.vault;
  vault.balance = vault.balance
    .checked_add(amount)
    .ok_or(VaultError::Overflow)?;
  Ok(())
}`,
      },
      {
        type: 'admonition',
        admonitionType: 'warning',
        content:
          'Existem 5 casos de teste, incluindo 2 testes ocultos para casos extremos. Certifique-se de que seu programa trata corretamente acesso n\u00e3o autorizado e overflow aritm\u00e9tico.',
      },
      {
        type: 'text',
        content:
          'A sintaxe `has_one = authority @ VaultError::Unauthorized` na struct `VaultAction` diz ao Anchor para verificar que `vault.authority == authority.key()` e retornar seu erro personalizado se a verifica\u00e7\u00e3o falhar.',
      },
      {
        type: 'admonition',
        admonitionType: 'tip',
        content:
          'Teste sua solu\u00e7\u00e3o contra todos os casos de teste vis\u00edveis antes de enviar. Pense em casos extremos: o que acontece com um dep\u00f3sito de zero? E sacar exatamente o saldo total?',
      },
      {
        type: 'text',
        content:
          'Boa sorte! Ao passar nos 5 casos de teste, voc\u00ea ganhar\u00e1 a conquista "Desafio Aceito" e completar\u00e1 o curso Solana 101.',
      },
    ],
    es: [
      {
        type: 'text',
        content:
          'Es hora de ponerlo todo en pr\u00e1ctica. En este desaf\u00edo, construir\u00e1s un programa de **B\u00f3veda de Tokens** usando Anchor. La b\u00f3veda almacena un saldo y restringe los retiros al usuario autorizado.',
      },
      {
        type: 'key-concepts',
        concepts: [
          'Inicializaci\u00f3n de cuenta con restricci\u00f3n init y c\u00e1lculo adecuado de espacio',
          'Control de acceso basado en autoridad con restricci\u00f3n has_one',
          'Aritm\u00e9tica segura usando checked_add y checked_sub',
          'C\u00f3digos de error personalizados con #[error_code] para mensajes significativos',
          'Derivaci\u00f3n de cuenta basada en PDA para direcciones determin\u00edsticas de b\u00f3veda',
        ],
      },
      {
        type: 'text',
        content:
          'Tu programa de b\u00f3veda debe implementar tres instrucciones:\n\n1. **`initialize`** -- Crea la cuenta de la b\u00f3veda, establece la autoridad como el firmante e inicializa el saldo en 0.\n2. **`deposit`** -- A\u00f1ade tokens al saldo de la b\u00f3veda. Debe manejar overflow.\n3. **`withdraw`** -- Retira tokens del saldo de la b\u00f3veda. Debe verificar la autoridad y manejar underflow.',
      },
      {
        type: 'admonition',
        admonitionType: 'info',
        content:
          'Este desaf\u00edo simula una b\u00f3veda simplificada. En un programa de producci\u00f3n, usar\u00edas cuentas SPL Token y transferencias reales de tokens. Aqu\u00ed rastreamos un saldo virtual para enfocarnos en los patrones de Anchor.',
      },
      {
        type: 'text',
        content:
          'Presta especial atenci\u00f3n al **manejo de errores**. Tu programa debe:\n\n- Devolver `VaultError::Unauthorized` cuando un usuario no autorizado intente retirar.\n- Devolver `VaultError::Overflow` cuando un dep\u00f3sito cause overflow de u64.\n- Devolver `VaultError::InsufficientFunds` cuando un retiro exceda el saldo.',
      },
      {
        type: 'code',
        language: 'rust',
        content: `// Ejemplo: usando aritm\u00e9tica verificada con errores personalizados
pub fn deposit(ctx: Context<VaultAction>, amount: u64) -> Result<()> {
  let vault = &mut ctx.accounts.vault;
  vault.balance = vault.balance
    .checked_add(amount)
    .ok_or(VaultError::Overflow)?;
  Ok(())
}`,
      },
      {
        type: 'admonition',
        admonitionType: 'warning',
        content:
          'Hay 5 casos de prueba, incluyendo 2 pruebas ocultas para casos extremos. Aseg\u00farate de que tu programa maneje correctamente el acceso no autorizado y el overflow aritm\u00e9tico.',
      },
      {
        type: 'text',
        content:
          'La sintaxis `has_one = authority @ VaultError::Unauthorized` en la struct `VaultAction` le dice a Anchor que verifique que `vault.authority == authority.key()` y devuelva tu error personalizado si la verificaci\u00f3n falla.',
      },
      {
        type: 'admonition',
        admonitionType: 'tip',
        content:
          'Prueba tu soluci\u00f3n contra todos los casos de prueba visibles antes de enviar. Piensa en casos extremos: dep\u00f3sito de cero, retirar exactamente el saldo total. Tu c\u00f3digo debe manejar estos casos con elegancia.',
      },
      {
        type: 'text',
        content:
          'Buena suerte. Al pasar los 5 casos de prueba, obtendr\u00e1s el logro "Desaf\u00edo Aceptado" y completar\u00e1s el curso Solana 101.',
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Course (raw -- as returned by allCoursesQuery / coursesByTrackQuery)
// ---------------------------------------------------------------------------

export interface SeedCourseRaw {
  _id: string;
  courseId: string;
  title: LocalizedString;
  description: LocalizedText;
  thumbnail: { asset?: { _ref?: string } } | null;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  xpPerLesson: number;
  lessonCount: number;
  skills: string[];
  prerequisites: string[] | null;
  track: {
    _id: string;
    trackId: string;
    name: string;
    icon: string | null;
    color: string | null;
  };
  arweaveTxId?: string;
}

export const seedCourseRaw: SeedCourseRaw = {
  _id: 'course-solana-101',
  courseId: 'solana-101',
  title: {
    en: 'Introduction to Solana Development',
    pt: 'Introdu\u00e7\u00e3o ao Desenvolvimento Solana',
    es: 'Introducci\u00f3n al Desarrollo en Solana',
  },
  description: {
    en: 'Learn the core concepts of Solana blockchain development. Understand accounts, transactions, and build your first on-chain programs using Anchor.',
    pt: 'Aprenda os conceitos fundamentais do desenvolvimento na blockchain Solana. Compreenda contas, transa\u00e7\u00f5es e construa seus primeiros programas on-chain usando Anchor.',
    es: 'Aprende los conceptos fundamentales del desarrollo en la blockchain Solana. Comprende cuentas, transacciones y construye tus primeros programas on-chain usando Anchor.',
  },
  thumbnail: { asset: { _ref: 'image-solana101-thumb' } },
  difficulty: 'beginner',
  xpPerLesson: 50,
  lessonCount: 5,
  skills: ['Solana Basics', 'Rust', 'Accounts Model', 'Transactions', 'PDAs'],
  prerequisites: null,
  track: {
    _id: 'track-solana-core',
    trackId: '1',
    name: 'Solana Core',
    icon: 'solana',
    color: '#9945FF',
  },
  arweaveTxId: 'Aw3kVgN2Tp_S4VJQq0K9xHT6x_0qDp3jPFmS5EqhzKw',
};

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
  track: { _id: 'track-defi', trackId: '2', name: 'DeFi', icon: 'defi', color: '#14F195' },
  arweaveTxId: 'Bx4lWhN3Uq_T5WKRr1L0yIT7y_1rEq4kQGnT6FriALx',
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
  track: { _id: 'track-nft', trackId: '3', name: 'NFT & Metaplex', icon: 'nft', color: '#FFD700' },
  arweaveTxId: 'Cy5mXiO4Vr_U6XLSs2M1zJU8z_2sFr5lRHoU7GsjBMy',
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
  track: { _id: 'track-security', trackId: '4', name: 'Security', icon: 'security', color: '#FF6B6B' },
  arweaveTxId: 'Dz6nYjP5Ws_V7YMTt3N2AKV9A_3tGs6mSIpV8HtkCNz',
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
  track: { _id: 'track-solana-core', trackId: '1', name: 'Solana Core', icon: 'solana', color: '#9945FF' },
  arweaveTxId: 'EA7oZkQ6Xt_W8ZNUu4O3BLW0B_4uHt7nTJqW9IulDOA',
};

export const seedAllCoursesRaw: SeedCourseRaw[] = [
  seedCourseRaw,
  seedCourseDefi,
  seedCourseNft,
  seedCourseSecurity,
  seedCourseTokenExt,
];

// ---------------------------------------------------------------------------
// Course detail (as returned by courseByIdQuery -- includes modules + lessons)
// ---------------------------------------------------------------------------

/** Lesson summary as it appears inside a module within courseByIdQuery. */
export interface SeedModuleLessonSummary {
  _id: string;
  title: LocalizedString;
  lessonIndex: number;
  xpReward: number;
  hasCodeEditor: boolean;
  isChallenge: boolean;
  language: string | null;
}

export interface SeedModule {
  _id: string;
  title: LocalizedString;
  description: LocalizedText;
  order: number;
  lessons: SeedModuleLessonSummary[];
}

export interface SeedCourseDetail extends SeedCourseRaw {
  modules: SeedModule[];
  credentialImage: null;
}

export const seedCourseDetail: SeedCourseDetail = {
  ...seedCourseRaw,
  credentialImage: null,
  modules: [
    {
      _id: 'module-0',
      title: {
        en: 'Solana Fundamentals',
        pt: 'Fundamentos de Solana',
        es: 'Fundamentos de Solana',
      },
      description: {
        en: 'Understand the core architecture of Solana: Proof of History, accounts, and the transaction lifecycle.',
        pt: 'Compreenda a arquitetura central da Solana: Prova de Hist\u00f3ria, contas e o ciclo de vida das transa\u00e7\u00f5es.',
        es: 'Comprende la arquitectura central de Solana: Prueba de Historia, cuentas y el ciclo de vida de las transacciones.',
      },
      order: 0,
      lessons: [
        {
          _id: 'lesson-0',
          title: seedLessons[0]!.title,
          lessonIndex: 0,
          xpReward: 50,
          hasCodeEditor: true,
          isChallenge: false,
          language: 'rust',
        },
        {
          _id: 'lesson-1',
          title: seedLessons[1]!.title,
          lessonIndex: 1,
          xpReward: 50,
          hasCodeEditor: false,
          isChallenge: false,
          language: null,
        },
        {
          _id: 'lesson-2',
          title: seedLessons[2]!.title,
          lessonIndex: 2,
          xpReward: 50,
          hasCodeEditor: true,
          isChallenge: false,
          language: 'typescript',
        },
      ],
    },
    {
      _id: 'module-1',
      title: {
        en: 'Building Programs',
        pt: 'Construindo Programas',
        es: 'Construyendo Programas',
      },
      description: {
        en: 'Learn the Anchor framework and build real on-chain programs from scratch.',
        pt: 'Aprenda o framework Anchor e construa programas on-chain reais do zero.',
        es: 'Aprende el framework Anchor y construye programas on-chain reales desde cero.',
      },
      order: 1,
      lessons: [
        {
          _id: 'lesson-3',
          title: seedLessons[3]!.title,
          lessonIndex: 3,
          xpReward: 50,
          hasCodeEditor: true,
          isChallenge: false,
          language: 'rust',
        },
        {
          _id: 'lesson-4',
          title: seedLessons[4]!.title,
          lessonIndex: 4,
          xpReward: 50,
          hasCodeEditor: true,
          isChallenge: true,
          language: 'rust',
        },
      ],
    },
  ],
};

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

export const seedAllCourseDetails: Record<string, SeedCourseDetail> = {
  'solana-101': seedCourseDetail,
  'defi-201': seedCourseDetailDefi,
  'nft-201': seedCourseDetailNft,
  'sec-301': seedCourseDetailSecurity,
  'token-201': seedCourseDetailTokenExt,
};

// ---------------------------------------------------------------------------
// Achievements
// ---------------------------------------------------------------------------

export interface SeedAchievement {
  _id: string;
  achievementId: string;
  name: LocalizedString;
  description: LocalizedText;
  icon: string;
  category: 'learning' | 'streak' | 'challenge' | 'social' | 'special' | 'progress' | 'skill' | 'community';
  xpReward: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  condition: { type: string; value: number };
}

export const seedAchievements: SeedAchievement[] = [
  // ── Learning / Progress ─────────────────────────────────────────────────
  {
    _id: 'achievement-first-lesson',
    achievementId: 'first-lesson',
    name: {
      en: 'First Steps',
      pt: 'Primeiros Passos',
      es: 'Primeros Pasos',
    },
    description: {
      en: 'Complete your first lesson and begin your Solana development journey.',
      pt: 'Complete sua primeira lição e comece sua jornada de desenvolvimento Solana.',
      es: 'Completa tu primera lección y comienza tu viaje de desarrollo en Solana.',
    },
    icon: '🚀',
    category: 'progress',
    xpReward: 50,
    rarity: 'common',
    condition: { type: 'lessons_completed', value: 1 },
  },
  {
    _id: 'achievement-fast-learner',
    achievementId: 'fast-learner',
    name: {
      en: 'Fast Learner',
      pt: 'Aprendiz Veloz',
      es: 'Aprendiz Veloz',
    },
    description: {
      en: 'Complete 5 lessons. You are building real momentum.',
      pt: 'Complete 5 lições. Você está criando um ritmo real.',
      es: 'Completa 5 lecciones. Estás construyendo un impulso real.',
    },
    icon: '⚡',
    category: 'progress',
    xpReward: 200,
    rarity: 'common',
    condition: { type: 'lessons_completed', value: 5 },
  },
  {
    _id: 'achievement-course-completer',
    achievementId: 'course-completer',
    name: {
      en: 'Course Completer',
      pt: 'Curso Completo',
      es: 'Curso Completado',
    },
    description: {
      en: 'Complete any course from start to finish. Your first major milestone.',
      pt: 'Complete qualquer curso do início ao fim. Seu primeiro grande marco.',
      es: 'Completa cualquier curso de principio a fin. Tu primer gran hito.',
    },
    icon: '🎓',
    category: 'progress',
    xpReward: 500,
    rarity: 'rare',
    condition: { type: 'courses_completed', value: 1 },
  },
  {
    _id: 'achievement-speed-runner',
    achievementId: 'speed-runner',
    name: {
      en: 'Speed Runner',
      pt: 'Velocista',
      es: 'Velocista',
    },
    description: {
      en: 'Complete a course in under 7 days. Speed and dedication combined.',
      pt: 'Complete um curso em menos de 7 dias. Velocidade e dedicação combinadas.',
      es: 'Completa un curso en menos de 7 días. Velocidad y dedicación combinadas.',
    },
    icon: '⏱️',
    category: 'special',
    xpReward: 750,
    rarity: 'epic',
    condition: { type: 'course_completed_days', value: 7 },
  },

  // ── Streak ──────────────────────────────────────────────────────────
  {
    _id: 'achievement-streak-3',
    achievementId: 'streak-3',
    name: {
      en: 'On Fire',
      pt: 'Em Chamas',
      es: 'En Llamas',
    },
    description: {
      en: 'Maintain a 3-day learning streak. Consistency is key to mastery.',
      pt: 'Mantenha uma sequência de aprendizado de 3 dias. Consistência é a chave para a maestria.',
      es: 'Mantiene una racha de aprendizaje de 3 días. La consistencia es la clave del dominio.',
    },
    icon: '🔥',
    category: 'streak',
    xpReward: 100,
    rarity: 'common',
    condition: { type: 'streak_days', value: 3 },
  },
  {
    _id: 'achievement-streak-7',
    achievementId: 'streak-7',
    name: {
      en: 'Week Warrior',
      pt: 'Guerreiro Semanal',
      es: 'Guerrero Semanal',
    },
    description: {
      en: 'Maintain a 7-day learning streak. A full week of dedication.',
      pt: 'Mantenha uma sequência de aprendizado de 7 dias. Uma semana completa de dedicação.',
      es: 'Mantiene una racha de aprendizaje de 7 días. Una semana completa de dedicación.',
    },
    icon: '⚔️',
    category: 'streak',
    xpReward: 300,
    rarity: 'rare',
    condition: { type: 'streak_days', value: 7 },
  },
  {
    _id: 'achievement-streak-30',
    achievementId: 'streak-30',
    name: {
      en: 'Monthly Master',
      pt: 'Mestre Mensal',
      es: 'Maestro Mensual',
    },
    description: {
      en: 'Maintain a 30-day learning streak. True dedication to your craft.',
      pt: 'Mantenha uma sequência de aprendizado de 30 dias. Verdadeira dedicação ao seu ofício.',
      es: 'Mantiene una racha de aprendizaje de 30 días. Verdadera dedicación a tu oficio.',
    },
    icon: '🏅',
    category: 'streak',
    xpReward: 1000,
    rarity: 'epic',
    condition: { type: 'streak_days', value: 30 },
  },
  {
    _id: 'achievement-streak-100',
    achievementId: 'streak-100',
    name: {
      en: 'Consistency King',
      pt: 'Rei da Consistência',
      es: 'Rey de la Consistencia',
    },
    description: {
      en: 'Maintain a 100-day learning streak. You are a true legend.',
      pt: 'Mantenha uma sequência de aprendizado de 100 dias. Você é uma verdadeira lenda.',
      es: 'Mantiene una racha de aprendizaje de 100 días. Eres una verdadera leyenda.',
    },
    icon: '👑',
    category: 'streak',
    xpReward: 5000,
    rarity: 'legendary',
    condition: { type: 'streak_days', value: 100 },
  },

  // ── Challenge ───────────────────────────────────────────────────────
  {
    _id: 'achievement-first-challenge',
    achievementId: 'first-challenge',
    name: {
      en: 'Challenge Accepted',
      pt: 'Desafio Aceito',
      es: 'Desafío Aceptado',
    },
    description: {
      en: 'Complete your first code challenge. You have proven you can build.',
      pt: 'Complete seu primeiro desafio de código. Você provou que consegue construir.',
      es: 'Completa tu primer desafío de código. Has demostrado que puedes construir.',
    },
    icon: '⚔️',
    category: 'challenge',
    xpReward: 150,
    rarity: 'common',
    condition: { type: 'challenges_completed', value: 1 },
  },

  // ── Skill ───────────────────────────────────────────────────────────
  {
    _id: 'achievement-rust-rookie',
    achievementId: 'rust-rookie',
    name: {
      en: 'Rust Rookie',
      pt: 'Novato em Rust',
      es: 'Novato en Rust',
    },
    description: {
      en: 'Complete your first Rust lesson. The foundation of Solana programs.',
      pt: 'Complete sua primeira lição de Rust. A base dos programas Solana.',
      es: 'Completa tu primera lección de Rust. La base de los programas Solana.',
    },
    icon: '🦀',
    category: 'skill',
    xpReward: 100,
    rarity: 'common',
    condition: { type: 'rust_lessons_completed', value: 1 },
  },
  {
    _id: 'achievement-anchor-expert',
    achievementId: 'anchor-expert',
    name: {
      en: 'Anchor Expert',
      pt: 'Especialista em Anchor',
      es: 'Experto en Anchor',
    },
    description: {
      en: 'Complete the Anchor track. You have mastered the most popular Solana framework.',
      pt: 'Complete a trilha Anchor. Você dominou o framework Solana mais popular.',
      es: 'Completa la pista de Anchor. Has dominado el framework Solana más popular.',
    },
    icon: '⚓',
    category: 'skill',
    xpReward: 1500,
    rarity: 'epic',
    condition: { type: 'track_completed', value: 1 },
  },
  {
    _id: 'achievement-full-stack-solana',
    achievementId: 'full-stack-solana',
    name: {
      en: 'Full Stack Solana',
      pt: 'Full Stack Solana',
      es: 'Full Stack Solana',
    },
    description: {
      en: 'Complete all tracks. You are a full-stack Solana developer.',
      pt: 'Complete todas as trilhas. Você é um desenvolvedor Solana full-stack.',
      es: 'Completa todas las pistas. Eres un desarrollador Solana full-stack.',
    },
    icon: '🏆',
    category: 'special',
    xpReward: 10000,
    rarity: 'legendary',
    condition: { type: 'all_tracks_completed', value: 1 },
  },

  // ── Community ────────────────────────────────────────────────────────────
  {
    _id: 'achievement-first-comment',
    achievementId: 'first-comment',
    name: {
      en: 'First Comment',
      pt: 'Primeiro Comentário',
      es: 'Primer Comentario',
    },
    description: {
      en: 'Post your first comment in the community',
      pt: 'Publique seu primeiro comentário na comunidade',
      es: 'Publica tu primer comentario en la comunidad',
    },
    icon: '💬',
    category: 'community',
    xpReward: 50,
    rarity: 'common',
    condition: { type: 'community_posts', value: 1 },
  },
  {
    _id: 'achievement-helper',
    achievementId: 'helper',
    name: {
      en: 'Helper',
      pt: 'Ajudante',
      es: 'Ayudante',
    },
    description: {
      en: 'Help another learner in the community forum',
      pt: 'Ajude outro aprendiz no fórum da comunidade',
      es: 'Ayuda a otro aprendiz en el foro de la comunidad',
    },
    icon: '🤝',
    category: 'community',
    xpReward: 200,
    rarity: 'rare',
    condition: { type: 'community_replies', value: 5 },
  },
  {
    _id: 'achievement-top-contributor',
    achievementId: 'top-contributor',
    name: {
      en: 'Top Contributor',
      pt: 'Principal Colaborador',
      es: 'Colaborador Principal',
    },
    description: {
      en: 'Become a top contributor with 50+ helpful replies',
      pt: 'Torne-se o principal colaborador com 50+ respostas úteis',
      es: 'Conviértete en un colaborador principal con 50+ respuestas útiles',
    },
    icon: '🌟',
    category: 'community',
    xpReward: 1000,
    rarity: 'epic',
    condition: { type: 'community_replies', value: 50 },
  },

  // ── Special ──────────────────────────────────────────────────────────────
  {
    _id: 'achievement-early-adopter',
    achievementId: 'early-adopter',
    name: {
      en: 'Early Adopter',
      pt: 'Usuário Pioneiro',
      es: 'Usuario Pionero',
    },
    description: {
      en: 'Join the platform during its launch period',
      pt: 'Junte-se à plataforma durante seu período de lançamento',
      es: 'Únete a la plataforma durante su período de lanzamiento',
    },
    icon: '🚀',
    category: 'special',
    xpReward: 500,
    rarity: 'rare',
    condition: { type: 'join_date_before', value: 1 },
  },
  {
    _id: 'achievement-bug-hunter',
    achievementId: 'bug-hunter',
    name: {
      en: 'Bug Hunter',
      pt: 'Caçador de Bugs',
      es: 'Cazador de Bugs',
    },
    description: {
      en: 'Report a verified bug in the platform',
      pt: 'Reporte um bug verificado na plataforma',
      es: 'Reporta un bug verificado en la plataforma',
    },
    icon: '🐛',
    category: 'special',
    xpReward: 750,
    rarity: 'epic',
    condition: { type: 'bugs_reported', value: 1 },
  },
  {
    _id: 'achievement-perfect-score',
    achievementId: 'perfect-score',
    name: {
      en: 'Perfect Score',
      pt: 'Pontuação Perfeita',
      es: 'Puntuación Perfecta',
    },
    description: {
      en: 'Complete a course challenge with 100% test pass rate on first try',
      pt: 'Conclua um desafio de curso com 100% de taxa de aprovação nos testes na primeira tentativa',
      es: 'Completa un desafío de curso con 100% de tasa de aprobación en los tests en el primer intento',
    },
    icon: '💯',
    category: 'special',
    xpReward: 2000,
    rarity: 'legendary',
    condition: { type: 'perfect_challenges', value: 1 },
  },
];

// ---------------------------------------------------------------------------
// Daily Challenge
// ---------------------------------------------------------------------------

export interface SeedDailyChallenge {
  _id: string;
  date: string;
  title: LocalizedString;
  description: LocalizedText;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  xpReward: number;
  starterCode: string;
  language: string;
  testCases: SeedTestCase[];
}

export const seedDailyChallenge: SeedDailyChallenge = {
  _id: 'daily-challenge-2026-02-24',
  date: '2026-02-24',
  title: {
    en: 'Fibonacci on Solana',
    pt: 'Fibonacci na Solana',
    es: 'Fibonacci en Solana',
  },
  description: {
    en: 'Implement an efficient Fibonacci calculator as a Solana program instruction. Given an index n, compute the nth Fibonacci number using iterative calculation to stay within compute budget.',
    pt: 'Implemente uma calculadora de Fibonacci eficiente como uma instru\u00e7\u00e3o de programa Solana. Dado um \u00edndice n, calcule o en\u00e9simo n\u00famero de Fibonacci usando c\u00e1lculo iterativo para permanecer dentro do or\u00e7amento de computa\u00e7\u00e3o.',
    es: 'Implementa una calculadora de Fibonacci eficiente como una instrucci\u00f3n de programa Solana. Dado un \u00edndice n, calcula el en\u00e9simo n\u00famero de Fibonacci usando c\u00e1lculo iterativo para mantenerse dentro del presupuesto de c\u00f3mputo.',
  },
  difficulty: 'intermediate',
  xpReward: 150,
  language: 'rust',
  starterCode: `use anchor_lang::prelude::*;

declare_id!("11111111111111111111111111111111");

#[program]
pub mod fibonacci {
  use super::*;

  pub fn compute(ctx: Context<Compute>, n: u64) -> Result<()> {
    let result_account = &mut ctx.accounts.result;

    // TODO: Calculate the nth Fibonacci number iteratively
    // Store the result in result_account.value
    // Handle potential overflow with checked arithmetic
    // fib(0) = 0, fib(1) = 1, fib(2) = 1, fib(3) = 2, ...

    result_account.input = n;

    Ok(())
  }
}

#[derive(Accounts)]
pub struct Compute<'info> {
  #[account(mut)]
  pub result: Account<'info, FibResult>,
  pub authority: Signer<'info>,
}

#[account]
#[derive(InitSpace)]
pub struct FibResult {
  pub value: u64,
  pub input: u64,
}`,
  testCases: [
    {
      description: 'Computes fib(0) = 0',
      input: '0',
      expectedOutput: 'FibResult { value: 0, input: 0 }',
      points: 30,
      hidden: false,
    },
    {
      description: 'Computes fib(10) = 55',
      input: '10',
      expectedOutput: 'FibResult { value: 55, input: 10 }',
      points: 40,
      hidden: false,
    },
    {
      description: 'Handles overflow for large n',
      input: '100',
      expectedOutput: 'Error: Overflow',
      points: 30,
      hidden: true,
    },
  ],
};
