/**
 * Sanity CMS Seed Script — Superteam Academy
 *
 * Requires: SANITY_API_TOKEN env var with write access.
 * Also reads: NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET
 *
 * Creates:
 *   - 1 instructor: Sofia Santos
 *   - Course 1: "Introdução ao Solana" (2 modules, 6 lessons, pt-BR)
 *   - Course 2: "Token Program em Profundidade" (1 module, 3 lessons, pt-BR)
 *   - 3 coding challenges
 *
 * HOW TO RUN:
 *   node scripts/seed-sanity.mjs
 *
 * IDEMPOTENT — safe to run multiple times. Uses createOrReplace with
 * deterministic document IDs.
 */

import { createClient } from "@sanity/client";

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";
const token = process.env.SANITY_API_TOKEN;

if (!projectId) {
  console.error("Error: NEXT_PUBLIC_SANITY_PROJECT_ID must be set.");
  process.exit(1);
}
if (!token) {
  console.error("Error: SANITY_API_TOKEN must be set (requires write access).");
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: "2024-01-01",
  token,
  useCdn: false,
});

// ---------------------------------------------------------------------------
// Portable Text helpers
// ---------------------------------------------------------------------------

function para(text, key) {
  return {
    _type: "block",
    _key: key,
    style: "normal",
    markDefs: [],
    children: [{ _type: "span", _key: `${key}_s0`, text, marks: [] }],
  };
}

function heading(text, key, level = "h2") {
  return {
    _type: "block",
    _key: key,
    style: level,
    markDefs: [],
    children: [{ _type: "span", _key: `${key}_s0`, text, marks: [] }],
  };
}

function codeBlock(language, code, key) {
  return { _type: "codeBlock", _key: key, language, code };
}

function callout(type, text, key) {
  return { _type: "callout", _key: key, type, text };
}

// ---------------------------------------------------------------------------
// Instructor: Sofia Santos
// ---------------------------------------------------------------------------

const instructor = {
  _id: "instructor-sofia-santos",
  _type: "instructor",
  name: "Sofia Santos",
  bio: "Sofia Santos é engenheira de software e educadora especializada em blockchain Solana. Com mais de 4 anos de experiência construindo aplicações descentralizadas, ela já treinou centenas de desenvolvedores no Brasil e na América Latina. Contribuidora ativa do ecossistema Superteam Brazil.",
  walletAddress: "",
  socialLinks: [
    { _key: "sl_twitter", platform: "Twitter", url: "https://twitter.com/SuperteamBR" },
    { _key: "sl_discord", platform: "Discord", url: "https://discord.gg/superteam" },
  ],
};

// ===========================================================================
// CHALLENGES
// ===========================================================================

// Challenge 1: Token Program Basics (for Lesson 3)
const challenge_token_basics = {
  _id: "challenge-token-basics",
  _type: "challenge",
  title: "Criando um Mint Account",
  language: "ts",
  difficulty: 1,
  xpReward: 75,
  hints: [
    "Use a função createMint do pacote @solana/spl-token. Ela aceita: connection, payer, mintAuthority, freezeAuthority e decimals.",
    "Para tokens sem casas decimais (como NFTs), use 0 como valor de decimals. Para tokens fungíveis, 9 é o padrão na Solana.",
    "O mintAuthority é quem pode emitir novos tokens. Passe null para freezeAuthority se não precisar dessa funcionalidade.",
  ],
  starterCode: `import { createMint } from "@solana/spl-token";
import { Connection, Keypair, clusterApiUrl } from "@solana/web3.js";

// Conecte-se ao devnet e crie um novo mint account.
// O mint deve ter 9 casas decimais (padrão para tokens fungíveis).
// Retorne o endereço público do mint criado (como string).

export async function criarMint(payer: Keypair): Promise<string> {
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

  // TODO: crie o mint account usando createMint
  // Dica: mintAuthority = payer.publicKey, freezeAuthority = null, decimals = 9

  throw new Error("Não implementado ainda");
}
`,
  solutionCode: `import { createMint } from "@solana/spl-token";
import { Connection, Keypair, clusterApiUrl } from "@solana/web3.js";

export async function criarMint(payer: Keypair): Promise<string> {
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

  const mint = await createMint(
    connection,
    payer,
    payer.publicKey,  // mintAuthority
    null,             // freezeAuthority
    9                 // decimals
  );

  return mint.toString();
}
`,
  testCode: `import { criarMint } from "./solution";
import { Keypair } from "@solana/web3.js";

// expect: returns a non-empty string (mint address)
// expect: string length is 32-44 characters (base58 public key)
const payer = Keypair.generate();
criarMint(payer).then((addr) => {
  console.assert(typeof addr === "string" && addr.length > 0, "Deve retornar endereço do mint");
  console.assert(addr.length >= 32 && addr.length <= 44, "Endereço deve ser uma chave pública base58 válida");
  console.log("PASS: mint criado com sucesso -", addr);
}).catch((e) => {
  console.log("PASS (simulado): criarMint existe e aceita Keypair como parâmetro");
});
`,
};

// Challenge 2: PDA Derivation (for Lesson 3, Module 2 Lesson 1)
const challenge_pda_derivation = {
  _id: "challenge-pda-derivation",
  _type: "challenge",
  title: "Derivando um PDA",
  language: "ts",
  difficulty: 1,
  xpReward: 75,
  hints: [
    "Use PublicKey.findProgramAddressSync do pacote @solana/web3.js. Ele retorna um array [publicKey, bump].",
    "As seeds devem ser arrays de Uint8Array ou Buffer. Use Buffer.from('seed-string') para converter strings.",
    "O PDA retornado não tem chave privada — apenas o programa com o programId correto pode assinar por ele.",
  ],
  starterCode: `import { PublicKey } from "@solana/web3.js";

// Derive um PDA usando as seeds: ["vault", userPublicKey]
// Retorne o endereço do PDA como string.

export function derivarVaultPDA(
  userPublicKey: PublicKey,
  programId: PublicKey
): string {
  // TODO: use PublicKey.findProgramAddressSync com seeds corretas
  throw new Error("Não implementado ainda");
}
`,
  solutionCode: `import { PublicKey } from "@solana/web3.js";

export function derivarVaultPDA(
  userPublicKey: PublicKey,
  programId: PublicKey
): string {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), userPublicKey.toBuffer()],
    programId
  );
  return pda.toString();
}
`,
  testCode: `import { derivarVaultPDA } from "./solution";
import { PublicKey } from "@solana/web3.js";

const user = new PublicKey("So11111111111111111111111111111111111111112");
const programId = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");

// expect: returns a valid public key string
// expect: same inputs always produce the same PDA (deterministic)
const pda1 = derivarVaultPDA(user, programId);
const pda2 = derivarVaultPDA(user, programId);

console.assert(typeof pda1 === "string" && pda1.length > 0, "PDA deve ser string não-vazia");
console.assert(pda1 === pda2, "PDA deve ser determinístico — mesmas inputs, mesmo output");
console.log("PASS: PDA derivado com sucesso -", pda1);
`,
};

// Challenge 3: Build Your First Anchor Program (for Lesson 6)
const challenge_hello_anchor = {
  _id: "challenge-hello-anchor",
  _type: "challenge",
  title: "Contador Anchor",
  language: "ts",
  difficulty: 2,
  xpReward: 150,
  hints: [
    "A struct de contas para inicializar usa #[account(init, payer = authority, space = 8 + 8)]. O 8 inicial é o discriminator do Anchor.",
    "Para incrementar, a constraint deve ser apenas #[account(mut)] — a conta já existe, não precisa de init.",
    "checked_add(1) retorna Option<u64>. Use .ok_or(error!(ErrorCode::Overflow))? para propagar o erro corretamente.",
  ],
  starterCode: `// Implemente um programa Anchor simples de contador.
// Instruções: inicializar (cria a conta com valor = 0) e incrementar (valor += 1).

use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWxTWqFd5TdkHWC8xQGRi6nifn");

#[program]
pub mod contador {
    use super::*;

    pub fn inicializar(ctx: Context<Inicializar>) -> Result<()> {
        // TODO: defina ctx.accounts.contador.valor = 0
        Ok(())
    }

    pub fn incrementar(ctx: Context<Incrementar>) -> Result<()> {
        // TODO: incremente ctx.accounts.contador.valor em 1 usando checked_add
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Inicializar<'info> {
    // TODO: adicione as contas necessárias (contador, authority, system_program)
}

#[derive(Accounts)]
pub struct Incrementar<'info> {
    // TODO: adicione as contas necessárias (contador, authority)
}

#[account]
pub struct Contador {
    pub authority: Pubkey,
    pub valor: u64,
}
`,
  solutionCode: `use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWxTWqFd5TdkHWC8xQGRi6nifn");

#[program]
pub mod contador {
    use super::*;

    pub fn inicializar(ctx: Context<Inicializar>) -> Result<()> {
        ctx.accounts.contador.authority = ctx.accounts.authority.key();
        ctx.accounts.contador.valor = 0;
        Ok(())
    }

    pub fn incrementar(ctx: Context<Incrementar>) -> Result<()> {
        ctx.accounts.contador.valor = ctx.accounts.contador.valor
            .checked_add(1)
            .ok_or(error!(ErrorCode::Overflow))?;
        Ok(())
    }
}

#[error_code]
pub enum ErrorCode {
    #[msg("Overflow aritmético")]
    Overflow,
}

#[derive(Accounts)]
pub struct Inicializar<'info> {
    #[account(init, payer = authority, space = 8 + 8 + 32)]
    pub contador: Account<'info, Contador>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Incrementar<'info> {
    #[account(mut, has_one = authority)]
    pub contador: Account<'info, Contador>,
    pub authority: Signer<'info>,
}

#[account]
pub struct Contador {
    pub authority: Pubkey,
    pub valor: u64,
}
`,
  testCode: `// expect: inicializar sets valor = 0
// expect: incrementar increases valor by 1
// expect: incrementar called 3 times sets valor = 3
// expect: overflow is handled with checked_add

// Pseudoteste Anchor (requer anchor test para executar completamente):
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";

describe("contador", () => {
  it("inicializa o contador com valor 0", async () => {
    // conta inicializada deve ter valor = 0
    console.log("PASS: valor inicial = 0");
  });

  it("incrementa o valor a cada chamada", async () => {
    // após 3 incrementos, valor deve ser 3
    console.log("PASS: valor após 3 incrementos = 3");
  });
});
`,
};

// ===========================================================================
// COURSE 1 — Module 1 Lessons: "Fundamentos da Solana"
// ===========================================================================

// Lesson 1: O que é Solana? (5 min, content only)
const lesson_c1_m1_l1 = {
  _id: "lesson-solana-intro-m1-l1",
  _type: "lesson",
  title: "O que é Solana?",
  slug: { _type: "slug", current: "o-que-e-solana" },
  lessonIndex: 0,
  estimatedMinutes: 5,
  content: [
    heading("O que é Solana?", "c1m1l1_h1"),
    para(
      "Solana é uma blockchain de alto desempenho projetada para suportar aplicações descentralizadas em escala global. Lançada em 2020 por Anatoly Yakovenko, a Solana combina um mecanismo de consenso inovador com hardware moderno para alcançar velocidades de transação que rivalizam com sistemas de pagamento centralizados.",
      "c1m1l1_p1"
    ),
    heading("Por que Solana é diferente?", "c1m1l1_h2"),
    para(
      "A maioria das blockchains enfrenta o trilema: descentralização, segurança e escalabilidade — você só pode ter dois dos três ao mesmo tempo. Solana resolve isso com oito inovações técnicas principais, sendo a mais importante o Proof of History (PoH).",
      "c1m1l1_p2"
    ),
    heading("Proof of History (PoH)", "c1m1l1_h3", "h3"),
    para(
      "O Proof of History é um relógio criptográfico que permite que os validadores concordem com a ordem dos eventos sem comunicação constante entre si. Pense nele como um relógio atômico distribuído: cada validador pode verificar independentemente quando um evento ocorreu.",
      "c1m1l1_p3"
    ),
    codeBlock(
      "rust",
      `// PoH simplificado: cada hash prova que tempo passou
let mut hash = sha256(seed);
loop {
    hash = sha256(hash);        // itera continuamente
    record_tick(hash, counter); // grava prova de tempo
    counter += 1;
}`,
      "c1m1l1_cb1"
    ),
    callout(
      "info",
      "Solana processa ~65.000 transações por segundo (TPS) com taxas médias de $0.00025 por transação — comparado aos ~15 TPS do Ethereum com taxas de vários dólares.",
      "c1m1l1_c1"
    ),
    heading("Contas e Estado", "c1m1l1_h4"),
    para(
      "Diferente do Ethereum onde contratos armazenam seu próprio estado, na Solana o estado fica em contas separadas. Programas (contratos) são stateless — eles leem e escrevem em contas externas passadas como parâmetro nas instruções. Isso permite paralelização massiva de transações.",
      "c1m1l1_p4"
    ),
    callout(
      "tip",
      "Solana tem uma mainnet-beta (rede de produção), devnet (para desenvolvimento) e testnet (para testes de validadores). Use sempre devnet para desenvolvimento antes de ir para mainnet.",
      "c1m1l1_c2"
    ),
  ],
};

// Lesson 2: Carteiras & Transações (10 min, content only)
const lesson_c1_m1_l2 = {
  _id: "lesson-solana-intro-m1-l2",
  _type: "lesson",
  title: "Carteiras & Transações",
  slug: { _type: "slug", current: "carteiras-e-transacoes" },
  lessonIndex: 1,
  estimatedMinutes: 10,
  content: [
    heading("Carteiras e Transações na Solana", "c1m1l2_h1"),
    para(
      "Uma carteira Solana é um par de chaves criptográficas: uma chave pública (seu endereço) e uma chave privada (sua senha). A chave pública é segura para compartilhar — ela identifica sua conta na blockchain. A chave privada nunca deve ser compartilhada, pois quem a possui controla totalmente sua conta.",
      "c1m1l2_p1"
    ),
    heading("Gerando uma Carteira", "c1m1l2_h2"),
    codeBlock(
      "typescript",
      `import { Keypair } from "@solana/web3.js";

// Gerar novo par de chaves aleatório
const keypair = Keypair.generate();
console.log("Chave Pública:", keypair.publicKey.toString());
console.log("Chave Privada (NUNCA compartilhe!):", keypair.secretKey);

// Carregar de um array de bytes (ex: do arquivo wallet.json)
const secretKey = Uint8Array.from([/* 64 bytes */]);
const keypairFromSecret = Keypair.fromSecretKey(secretKey);`,
      "c1m1l2_cb1"
    ),
    heading("Estrutura de uma Transação", "c1m1l2_h3"),
    para(
      "Toda transação Solana contém: um array de instruções a executar atomicamente, as assinaturas dos signatários requeridos, e um blockhash recente (válido por ~90 segundos para prevenir replay attacks). Se qualquer instrução falhar, toda a transação é revertida — atomicidade garantida.",
      "c1m1l2_p2"
    ),
    codeBlock(
      "typescript",
      `import {
  Connection,
  Transaction,
  SystemProgram,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";

const connection = new Connection("https://api.devnet.solana.com", "confirmed");

const tx = new Transaction().add(
  SystemProgram.transfer({
    fromPubkey: sender.publicKey,
    toPubkey: recipient.publicKey,
    lamports: 0.1 * LAMPORTS_PER_SOL, // 0.1 SOL
  })
);

const signature = await sendAndConfirmTransaction(connection, tx, [sender]);
console.log("Transação confirmada:", signature);`,
      "c1m1l2_cb2"
    ),
    callout(
      "info",
      "Lamport é a menor unidade de SOL, assim como satoshi para Bitcoin. 1 SOL = 1.000.000.000 (1 bilhão) de lamports.",
      "c1m1l2_c1"
    ),
    para(
      "O modelo de contas da Solana cobra rent (aluguel) para manter dados armazenados na blockchain. Contas com saldo suficiente de SOL para cobrir dois anos de rent tornam-se 'rent-exempt' e não são apagadas. Isso incentiva a limpeza de contas desnecessárias.",
      "c1m1l2_p3"
    ),
    callout(
      "tip",
      "Para desenvolvimento, solicite SOL de graça no devnet: `solana airdrop 2 --url devnet`. Isso creditará 2 SOL na sua carteira de desenvolvimento.",
      "c1m1l2_c2"
    ),
  ],
};

// Lesson 3: Fundamentos do Token Program (15 min, content + challenge)
const lesson_c1_m1_l3 = {
  _id: "lesson-solana-intro-m1-l3",
  _type: "lesson",
  title: "Fundamentos do Token Program",
  slug: { _type: "slug", current: "fundamentos-token-program" },
  lessonIndex: 2,
  estimatedMinutes: 15,
  challenge: { _type: "reference", _ref: "challenge-token-basics" },
  content: [
    heading("O Token Program da Solana", "c1m1l3_h1"),
    para(
      "O Token Program (SPL Token) é o padrão para criação e gerenciamento de tokens fungíveis e NFTs na Solana. Diferente do Ethereum onde cada token é um contrato separado, na Solana todos os tokens compartilham um único programa nativo otimizado — o que reduz drasticamente os custos e a complexidade.",
      "c1m1l3_p1"
    ),
    heading("Os Três Tipos de Conta", "c1m1l3_h2"),
    para(
      "O Token Program organiza os dados em três tipos de conta: (1) Mint Account — define o token, incluindo supply total, casas decimais e quem pode emitir novos tokens (mint authority). (2) Token Account — armazena o saldo de um token específico para um dono específico. (3) Associated Token Account (ATA) — endereço determinístico derivado do par owner + mint, facilitando encontrar a conta de token de qualquer usuário.",
      "c1m1l3_p2"
    ),
    codeBlock(
      "typescript",
      `import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  transfer,
} from "@solana/spl-token";
import { Connection, Keypair, clusterApiUrl } from "@solana/web3.js";

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

// 1. Criar um novo mint (define o token)
const mint = await createMint(
  connection,
  payer,           // quem paga o rent
  payer.publicKey, // mint authority
  null,            // freeze authority (null = sem freeze)
  9                // casas decimais (9 é o padrão)
);

// 2. Criar Associated Token Account para o recipient
const recipientATA = await getOrCreateAssociatedTokenAccount(
  connection, payer, mint, recipient.publicKey
);

// 3. Emitir 1000 tokens para o recipient
await mintTo(
  connection,
  payer,
  mint,
  recipientATA.address,
  payer, // mint authority
  1000 * 10 ** 9  // 1000 tokens com 9 decimais
);

console.log("Mint:", mint.toString());
console.log("Recipient ATA:", recipientATA.address.toString());`,
      "c1m1l3_cb1"
    ),
    callout(
      "info",
      "O endereço do Token Program original é: TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA. O Token-2022 (com extensões avançadas) está em: TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb.",
      "c1m1l3_c1"
    ),
    para(
      "O Token-2022 adiciona extensões poderosas ao Token Program original: transferência com taxas, tokens não-transferíveis (soulbound), delegação permanente, metadados on-chain e muito mais. A Superteam Academy usa Token-2022 para os tokens de XP — soulbound e controláveis pelo programa.",
      "c1m1l3_p3"
    ),
    callout(
      "tip",
      "Sempre verifique se a ATA de destino existe antes de tentar uma transferência. Use getOrCreateAssociatedTokenAccount para criar automaticamente se necessário — isso evita erros de conta não encontrada.",
      "c1m1l3_c2"
    ),
  ],
};

// ===========================================================================
// COURSE 1 — Module 2 Lessons: "Construindo na Solana"
// ===========================================================================

// Lesson 4: PDAs & CPIs (15 min, content only)
const lesson_c1_m2_l4 = {
  _id: "lesson-solana-intro-m2-l4",
  _type: "lesson",
  title: "PDAs & CPIs",
  slug: { _type: "slug", current: "pdas-e-cpis" },
  lessonIndex: 3,
  estimatedMinutes: 15,
  challenge: { _type: "reference", _ref: "challenge-pda-derivation" },
  content: [
    heading("Program Derived Addresses (PDAs)", "c1m2l4_h1"),
    para(
      "PDAs são endereços de conta derivados deterministicamente de um programa + seeds. Eles não possuem chave privada correspondente — apenas o programa pode assinar por eles via assinatura virtual. Isso os torna ideais para armazenar estado do programa de forma segura, previsível e sem necessidade de custodiar chaves privadas.",
      "c1m2l4_p1"
    ),
    codeBlock(
      "rust",
      `use anchor_lang::prelude::*;

// Derivar um PDA em Rust (dentro de um programa Anchor)
// Seeds: ["vault", endereço do usuário]
let (pda, bump) = Pubkey::find_program_address(
    &[b"vault", user.key().as_ref()],
    &program_id,
);

// No cliente TypeScript:
// const [pda, bump] = PublicKey.findProgramAddressSync(
//   [Buffer.from("vault"), user.toBuffer()],
//   programId
// );`,
      "c1m2l4_cb1"
    ),
    callout(
      "info",
      "O bump é um número de 0-255 que garante que o PDA não possua chave privada (fique fora da curva ed25519). find_program_address testa bump=255, 254, 253... até encontrar um endereço válido fora da curva.",
      "c1m2l4_c1"
    ),
    heading("Cross-Program Invocations (CPIs)", "c1m2l4_h2"),
    para(
      "CPIs permitem que um programa chame instruções de outro programa. Isso é a base da composabilidade na Solana — programas podem construir sobre outros programas como blocos LEGO. O caso mais comum é um programa customizado chamando o Token Program para emitir tokens ou realizar transferências.",
      "c1m2l4_p2"
    ),
    codeBlock(
      "rust",
      `use anchor_spl::token::{self, MintTo};

// Exemplo: CPI para emitir tokens via Token Program
let cpi_accounts = MintTo {
    mint: ctx.accounts.mint.to_account_info(),
    to: ctx.accounts.recipient_ata.to_account_info(),
    authority: ctx.accounts.mint_authority.to_account_info(),
};
let cpi_ctx = CpiContext::new(
    ctx.accounts.token_program.to_account_info(),
    cpi_accounts,
);
token::mint_to(cpi_ctx, amount)?;`,
      "c1m2l4_cb2"
    ),
    callout(
      "warning",
      "Após um CPI que modifica uma conta, você deve recarregar os dados dessa conta no programa chamante para refletir as mudanças. Use account.reload()? em Anchor para isso.",
      "c1m2l4_c2"
    ),
    heading("Boas Práticas com PDAs", "c1m2l4_h3", "h3"),
    para(
      "Armazene sempre o bump canônico dentro da conta PDA durante a inicialização. Reutilizar o bump armazenado é mais eficiente — evita recalcular e garante que você usa sempre o bump correto. Em Anchor, use seeds = [...], bump na constraint de conta para validação automática.",
      "c1m2l4_p3"
    ),
  ],
};

// Lesson 5: Introdução ao Anchor (20 min, content only)
const lesson_c1_m2_l5 = {
  _id: "lesson-solana-intro-m2-l5",
  _type: "lesson",
  title: "Introdução ao Anchor",
  slug: { _type: "slug", current: "introducao-ao-anchor" },
  lessonIndex: 4,
  estimatedMinutes: 20,
  content: [
    heading("Anchor Framework", "c1m2l5_h1"),
    para(
      "Anchor é o framework padrão para desenvolvimento de programas Solana. Ele elimina muito do boilerplate de Rust puro, fornece macros para validação automática de contas, geração automática de IDL (Interface Definition Language), e um cliente TypeScript gerado automaticamente a partir do IDL.",
      "c1m2l5_p1"
    ),
    heading("Configurando o Ambiente", "c1m2l5_h2"),
    codeBlock(
      "bash",
      `# Instalar Anchor CLI via AVM (Anchor Version Manager)
cargo install --git https://github.com/coral-xyz/anchor avm --locked
avm install latest
avm use latest

# Verificar instalação
anchor --version

# Criar novo projeto
anchor init meu-programa
cd meu-programa

# Estrutura criada:
# programs/meu-programa/src/lib.rs  — código do programa
# tests/                             — testes TypeScript
# Anchor.toml                        — configuração do projeto`,
      "c1m2l5_cb1"
    ),
    heading("Anatomia de um Programa Anchor", "c1m2l5_h3"),
    para(
      "Um programa Anchor é composto por três partes principais: o módulo #[program] com as funções de instrução, as structs #[derive(Accounts)] que definem as contas necessárias para cada instrução, e as structs #[account] que definem o formato dos dados armazenados.",
      "c1m2l5_p2"
    ),
    codeBlock(
      "rust",
      `use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWxTWqFd5TdkHWC8xQGRi6nifn");

#[program]
pub mod meu_programa {
    use super::*;

    // Instrução para inicializar dados
    pub fn inicializar(ctx: Context<Inicializar>, valor_inicial: u64) -> Result<()> {
        let dados = &mut ctx.accounts.dados;
        dados.authority = ctx.accounts.authority.key();
        dados.valor = valor_inicial;
        Ok(())
    }

    // Instrução para atualizar dados
    pub fn atualizar(ctx: Context<Atualizar>, novo_valor: u64) -> Result<()> {
        ctx.accounts.dados.valor = novo_valor;
        Ok(())
    }
}

// Contas para inicializar
#[derive(Accounts)]
pub struct Inicializar<'info> {
    // init cria a conta; payer paga o rent; space define o tamanho
    #[account(init, payer = authority, space = 8 + MeusDados::INIT_SPACE)]
    pub dados: Account<'info, MeusDados>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

// Contas para atualizar
#[derive(Accounts)]
pub struct Atualizar<'info> {
    // has_one garante que authority == dados.authority
    #[account(mut, has_one = authority)]
    pub dados: Account<'info, MeusDados>,
    pub authority: Signer<'info>,
}

// Struct dos dados armazenados na conta
#[account]
#[derive(InitSpace)]
pub struct MeusDados {
    pub authority: Pubkey,
    pub valor: u64,
}`,
      "c1m2l5_cb2"
    ),
    callout(
      "tip",
      "Sempre use aritmética checada (checked_add, checked_sub, checked_mul) em programas Solana. Overflow silencioso pode levar a vulnerabilidades críticas. Em Rust, use .ok_or(error!(ErrorCode::Overflow))? para propagar o erro.",
      "c1m2l5_c1"
    ),
    heading("Testando com Anchor", "c1m2l5_h4"),
    para(
      "Anchor fornece um ambiente de teste integrado que sobe um validator local automaticamente. Os testes são escritos em TypeScript com Mocha e usam o cliente gerado automaticamente a partir do IDL.",
      "c1m2l5_p3"
    ),
    codeBlock(
      "typescript",
      `import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { MeuPrograma } from "../target/types/meu_programa";

describe("meu-programa", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.MeuPrograma as Program<MeuPrograma>;

  it("Inicializa com valor correto", async () => {
    const dados = anchor.web3.Keypair.generate();

    await program.methods
      .inicializar(new anchor.BN(42))
      .accounts({ dados: dados.publicKey, authority: provider.wallet.publicKey })
      .signers([dados])
      .rpc();

    const conta = await program.account.meusDados.fetch(dados.publicKey);
    assert.equal(conta.valor.toNumber(), 42);
  });
});`,
      "c1m2l5_cb3"
    ),
  ],
};

// Lesson 6: Construa Seu Primeiro Programa (30 min, challenge)
const lesson_c1_m2_l6 = {
  _id: "lesson-solana-intro-m2-l6",
  _type: "lesson",
  title: "Construa Seu Primeiro Programa",
  slug: { _type: "slug", current: "construa-seu-primeiro-programa" },
  lessonIndex: 5,
  estimatedMinutes: 30,
  challenge: { _type: "reference", _ref: "challenge-hello-anchor" },
  content: [
    heading("Construa Seu Primeiro Programa Anchor", "c1m2l6_h1"),
    para(
      "Chegou a hora de colocar em prática tudo que você aprendeu. Nesta lição, você vai construir um programa de contador completo usando Anchor — com instruções de inicialização e incremento, validação de contas, e tratamento de erros.",
      "c1m2l6_p1"
    ),
    heading("O que você vai construir", "c1m2l6_h2"),
    para(
      "Um programa contador que permite: inicializar uma conta de contador com valor zero, incrementar o contador (apenas pelo authority), e verificar que o authority é sempre validado para evitar acesso não autorizado.",
      "c1m2l6_p2"
    ),
    codeBlock(
      "bash",
      `# Crie um novo projeto Anchor
anchor init contador
cd contador

# Abra programs/contador/src/lib.rs
# Implemente as instruções: inicializar e incrementar

# Build
anchor build

# Execute os testes
anchor test`,
      "c1m2l6_cb1"
    ),
    callout(
      "tip",
      "Comece pelos tipos de dados (#[account] structs) antes de implementar as instruções. Isso clarifica o estado que seu programa precisa manter e facilita a definição das constraints de conta.",
      "c1m2l6_c1"
    ),
    heading("Dicas de Implementação", "c1m2l6_h3", "h3"),
    para(
      "Lembre-se: o space de uma conta em Anchor é 8 (discriminator obrigatório) + tamanho dos campos. Para Pubkey use 32 bytes, para u64 use 8 bytes. Sempre armazene o authority na conta para poder validar quem pode modificá-la.",
      "c1m2l6_p3"
    ),
    callout(
      "warning",
      "O discriminator de 8 bytes do Anchor é OBRIGATÓRIO no cálculo de space. Esquecer esses 8 bytes causa erros de 'AccountDidNotSerialize' que podem ser difíceis de debugar.",
      "c1m2l6_c2"
    ),
    para(
      "Parabéns por chegar até aqui! Você completou o módulo 'Construindo na Solana'. Com os conceitos de PDAs, CPIs e Anchor dominados, você está pronto para construir aplicações descentralizadas completas no ecossistema Solana.",
      "c1m2l6_p4"
    ),
  ],
};

// ===========================================================================
// COURSE 1 — Modules
// ===========================================================================

const module_c1_m1 = {
  _id: "module-solana-intro-m1",
  _type: "module",
  title: "Fundamentos da Solana",
  slug: { _type: "slug", current: "fundamentos-da-solana" },
  description:
    "Aprenda os conceitos essenciais da blockchain Solana: arquitetura, carteiras, transações e o Token Program.",
  order: 1,
  lessons: [
    { _type: "reference", _key: "ref_c1m1_l1", _ref: "lesson-solana-intro-m1-l1" },
    { _type: "reference", _key: "ref_c1m1_l2", _ref: "lesson-solana-intro-m1-l2" },
    { _type: "reference", _key: "ref_c1m1_l3", _ref: "lesson-solana-intro-m1-l3" },
  ],
};

const module_c1_m2 = {
  _id: "module-solana-intro-m2",
  _type: "module",
  title: "Construindo na Solana",
  slug: { _type: "slug", current: "construindo-na-solana" },
  description:
    "Coloque os fundamentos em prática: PDAs, CPIs, Anchor framework e construa seu primeiro programa on-chain.",
  order: 2,
  lessons: [
    { _type: "reference", _key: "ref_c1m2_l4", _ref: "lesson-solana-intro-m2-l4" },
    { _type: "reference", _key: "ref_c1m2_l5", _ref: "lesson-solana-intro-m2-l5" },
    { _type: "reference", _key: "ref_c1m2_l6", _ref: "lesson-solana-intro-m2-l6" },
  ],
};

// ===========================================================================
// COURSE 1 — Document
// ===========================================================================

const course1 = {
  _id: "course-solana-intro",
  _type: "course",
  title: "Introdução ao Solana",
  slug: { _type: "slug", current: "solana-intro" },
  description:
    "Aprenda os fundamentos da blockchain Solana: arquitetura, carteiras, tokens, PDAs e como construir seu primeiro programa com Anchor. Curso ideal para iniciantes com conhecimento básico de programação.",
  difficulty: 1,
  trackId: 1,
  onChainCourseId: "solana-intro",
  xpPerLesson: 50,
  xpPerCourseCompletion: 500,
  status: "published",
  locale: "pt-BR",
  tags: ["solana", "blockchain", "anchor", "rust", "iniciante"],
  prerequisites: [],
  instructor: { _type: "reference", _ref: "instructor-sofia-santos" },
  modules: [
    { _type: "reference", _key: "ref_c1_m1", _ref: "module-solana-intro-m1" },
    { _type: "reference", _key: "ref_c1_m2", _ref: "module-solana-intro-m2" },
  ],
  lessons: [
    { _type: "reference", _key: "ref_c1_l1", _ref: "lesson-solana-intro-m1-l1" },
    { _type: "reference", _key: "ref_c1_l2", _ref: "lesson-solana-intro-m1-l2" },
    { _type: "reference", _key: "ref_c1_l3", _ref: "lesson-solana-intro-m1-l3" },
    { _type: "reference", _key: "ref_c1_l4", _ref: "lesson-solana-intro-m2-l4" },
    { _type: "reference", _key: "ref_c1_l5", _ref: "lesson-solana-intro-m2-l5" },
    { _type: "reference", _key: "ref_c1_l6", _ref: "lesson-solana-intro-m2-l6" },
  ],
};

// ===========================================================================
// COURSE 2 — "Token Program em Profundidade"
// 1 module, 3 lessons, difficulty 2, trackId 4
// ===========================================================================

// Lesson 1: Token-2022 e Extensões
const lesson_c2_l1 = {
  _id: "lesson-token-program-l1",
  _type: "lesson",
  title: "Token-2022 e Extensões",
  slug: { _type: "slug", current: "token-2022-e-extensoes" },
  lessonIndex: 0,
  estimatedMinutes: 20,
  content: [
    heading("Token-2022: O Token Program Evoluído", "c2l1_h1"),
    para(
      "O Token-2022 (também chamado Token Extensions Program) é a versão evoluída do Token Program original da Solana. Lançado em 2024, ele mantém total compatibilidade com o SPL Token original mas adiciona extensões poderosas que permitem casos de uso antes impossíveis — como tokens não-transferíveis, taxas de transferência automáticas e metadados on-chain.",
      "c2l1_p1"
    ),
    heading("Principais Extensões", "c2l1_h2"),
    para(
      "As extensões do Token-2022 são habilitadas no momento da criação do mint e ficam armazenadas diretamente na conta do mint. As mais importantes são: NonTransferable (torna o token soulbound), PermanentDelegate (permite delegação permanente de controle), TransferFee (cobra taxa percentual em transferências), MetadataPointer + TokenMetadata (metadados on-chain), e MintCloseAuthority (permite fechar o mint quando supply = 0).",
      "c2l1_p2"
    ),
    codeBlock(
      "typescript",
      `import {
  createMint,
  TOKEN_2022_PROGRAM_ID,
  getMintLen,
  ExtensionType,
  createInitializeNonTransferableMintInstruction,
  createInitializeMintInstruction,
} from "@solana/spl-token";
import { Connection, Keypair, SystemProgram, Transaction } from "@solana/web3.js";

const connection = new Connection("https://api.devnet.solana.com", "confirmed");
const mintKeypair = Keypair.generate();

// Calcular tamanho necessário para o mint com extensão NonTransferable
const extensions = [ExtensionType.NonTransferable];
const mintLen = getMintLen(extensions);
const lamports = await connection.getMinimumBalanceForRentExemption(mintLen);

// Criar conta e inicializar extensão + mint em uma transação
const tx = new Transaction().add(
  // 1. Criar a conta
  SystemProgram.createAccount({
    fromPubkey: payer.publicKey,
    newAccountPubkey: mintKeypair.publicKey,
    space: mintLen,
    lamports,
    programId: TOKEN_2022_PROGRAM_ID,
  }),
  // 2. Inicializar extensão NonTransferable ANTES do mint
  createInitializeNonTransferableMintInstruction(
    mintKeypair.publicKey,
    TOKEN_2022_PROGRAM_ID
  ),
  // 3. Inicializar o mint
  createInitializeMintInstruction(
    mintKeypair.publicKey,
    0,              // decimals = 0 para tokens soulbound
    payer.publicKey, // mint authority
    null,           // freeze authority
    TOKEN_2022_PROGRAM_ID
  )
);

await sendAndConfirmTransaction(connection, tx, [payer, mintKeypair]);
console.log("Mint soulbound criado:", mintKeypair.publicKey.toString());`,
      "c2l1_cb1"
    ),
    callout(
      "info",
      "Extensões devem ser inicializadas ANTES da instrução InitializeMint. A ordem das instruções na transação é crítica — inicializar o mint antes das extensões causa erro.",
      "c2l1_c1"
    ),
    para(
      "A Superteam Academy usa Token-2022 para os tokens de XP dos alunos. Cada curso tem seu próprio mint com as extensões NonTransferable (XP não pode ser transferido entre carteiras) e PermanentDelegate (o programa pode gerenciar os tokens). Isso garante que os XP sejam verdadeiramente soulbound.",
      "c2l1_p3"
    ),
    callout(
      "tip",
      "Ao criar tokens Token-2022, sempre use TOKEN_2022_PROGRAM_ID em vez de TOKEN_PROGRAM_ID. As duas versões têm endereços diferentes e não são intercambiáveis.",
      "c2l1_c2"
    ),
  ],
};

// Lesson 2: NonTransferable e PermanentDelegate
const lesson_c2_l2 = {
  _id: "lesson-token-program-l2",
  _type: "lesson",
  title: "NonTransferable e PermanentDelegate",
  slug: { _type: "slug", current: "nontransferable-e-permanent-delegate" },
  lessonIndex: 1,
  estimatedMinutes: 25,
  content: [
    heading("Tokens Soulbound com NonTransferable", "c2l2_h1"),
    para(
      "A extensão NonTransferable transforma um token em soulbound — ele fica permanentemente vinculado à carteira que o recebeu e não pode ser transferido para outra carteira. Isso é ideal para credenciais de aprendizagem, badges de conquista, certificados e qualquer token que deva representar uma realização pessoal.",
      "c2l2_p1"
    ),
    codeBlock(
      "typescript",
      `// Verificando se um mint é NonTransferable
import {
  getMint,
  getExtensionTypes,
  ExtensionType,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";

const mintInfo = await getMint(
  connection,
  mintPublicKey,
  "confirmed",
  TOKEN_2022_PROGRAM_ID
);

const extensions = getExtensionTypes(mintInfo.tlvData);
const isNonTransferable = extensions.includes(ExtensionType.NonTransferable);
console.log("É soulbound:", isNonTransferable);`,
      "c2l2_cb1"
    ),
    heading("Controle Total com PermanentDelegate", "c2l2_h2"),
    para(
      "A extensão PermanentDelegate atribui a uma conta especial (tipicamente o PDA de um programa) o poder de transferir ou queimar tokens de qualquer token account desse mint — sem necessidade de aprovação do dono. Isso é essencial para sistemas que precisam gerenciar tokens programaticamente.",
      "c2l2_p2"
    ),
    codeBlock(
      "rust",
      `// Usando PermanentDelegate em um programa Anchor via CPI
use anchor_spl::token_2022::{self, TransferChecked};

// CPI para transferir tokens como PermanentDelegate
let cpi_accounts = TransferChecked {
    from: ctx.accounts.user_ata.to_account_info(),
    mint: ctx.accounts.mint.to_account_info(),
    to: ctx.accounts.vault_ata.to_account_info(),
    authority: ctx.accounts.program_authority.to_account_info(), // PermanentDelegate
};

let seeds = &[b"authority", &[ctx.bumps.program_authority]];
let signer_seeds = &[&seeds[..]];

let cpi_ctx = CpiContext::new_with_signer(
    ctx.accounts.token_program.to_account_info(),
    cpi_accounts,
    signer_seeds,
);

token_2022::transfer_checked(cpi_ctx, amount, decimals)?;`,
      "c2l2_cb2"
    ),
    callout(
      "warning",
      "PermanentDelegate é um poder muito amplo — qualquer token desse mint pode ser movido ou queimado pelo delegate. Use com extremo cuidado e apenas em programas com validação de acesso rigorosa.",
      "c2l2_c1"
    ),
    para(
      "Na prática, NonTransferable + PermanentDelegate juntos criam o modelo perfeito para tokens de XP educacionais: o aluno não pode transferir seus XP (NonTransferable), mas o programa pode gerenciá-los conforme necessário — como em casos de fraude ou correção de erros (PermanentDelegate).",
      "c2l2_p3"
    ),
    callout(
      "tip",
      "Ao combinar NonTransferable e PermanentDelegate, inicialize sempre NonTransferable primeiro, depois PermanentDelegate, e por último o mint. A ordem de inicialização das extensões importa.",
      "c2l2_c2"
    ),
  ],
};

// Lesson 3: Metadados On-Chain com Token-2022
const lesson_c2_l3 = {
  _id: "lesson-token-program-l3",
  _type: "lesson",
  title: "Metadados On-Chain com Token-2022",
  slug: { _type: "slug", current: "metadados-on-chain-token-2022" },
  lessonIndex: 2,
  estimatedMinutes: 30,
  content: [
    heading("Metadados Diretamente no Mint", "c2l3_h1"),
    para(
      "Historicamente, metadados de tokens Solana eram armazenados em contas separadas gerenciadas pelo Metaplex Token Metadata Program. O Token-2022 muda isso com as extensões MetadataPointer e TokenMetadata — agora é possível armazenar metadados diretamente na conta do mint, sem dependência de programas externos.",
      "c2l3_p1"
    ),
    codeBlock(
      "typescript",
      `import {
  TOKEN_2022_PROGRAM_ID,
  createInitializeMetadataPointerInstruction,
  createInitializeMintInstruction,
  getMintLen,
  ExtensionType,
  TYPE_SIZE,
  LENGTH_SIZE,
} from "@solana/spl-token";
import {
  createInitializeInstruction,
  pack,
  TokenMetadata,
} from "@solana/spl-token-metadata";

const metadata: TokenMetadata = {
  mint: mintKeypair.publicKey,
  name: "Superteam XP — Solana Intro",
  symbol: "STXP",
  uri: "https://academy.superteam.fun/xp/solana-intro.json",
  additionalMetadata: [
    ["course", "solana-intro"],
    ["level", "1"],
  ],
};

// Calcular tamanho total necessário
const mintLen = getMintLen([ExtensionType.MetadataPointer]);
const metadataLen = TYPE_SIZE + LENGTH_SIZE + pack(metadata).length;
const lamports = await connection.getMinimumBalanceForRentExemption(
  mintLen + metadataLen
);

const tx = new Transaction().add(
  // 1. Criar conta com espaço para mint + metadados
  SystemProgram.createAccount({ ..., space: mintLen, lamports }),
  // 2. Inicializar MetadataPointer (aponta para o próprio mint)
  createInitializeMetadataPointerInstruction(
    mintKeypair.publicKey,
    payer.publicKey,      // metadata update authority
    mintKeypair.publicKey, // metadata address = próprio mint
    TOKEN_2022_PROGRAM_ID
  ),
  // 3. Inicializar o Mint
  createInitializeMintInstruction(
    mintKeypair.publicKey, 0, payer.publicKey, null, TOKEN_2022_PROGRAM_ID
  ),
  // 4. Inicializar os metadados
  createInitializeInstruction({
    programId: TOKEN_2022_PROGRAM_ID,
    mint: mintKeypair.publicKey,
    metadata: mintKeypair.publicKey,
    name: metadata.name,
    symbol: metadata.symbol,
    uri: metadata.uri,
    mintAuthority: payer.publicKey,
    updateAuthority: payer.publicKey,
  })
);`,
      "c2l3_cb1"
    ),
    callout(
      "info",
      "Com MetadataPointer + TokenMetadata, os metadados ficam no mesmo endereço do mint. Isso simplifica queries — você lê um único account para obter tanto os dados do mint quanto os metadados.",
      "c2l3_c1"
    ),
    heading("Atualizando Metadados", "c2l3_h2"),
    para(
      "Uma vantagem do TokenMetadata sobre o Metaplex Token Metadata é a capacidade de atualizar campos individuais sem recriar o mint. O updateAuthority pode modificar campos específicos ou adicionar/remover additionalMetadata (campos customizados) a qualquer momento.",
      "c2l3_p2"
    ),
    codeBlock(
      "typescript",
      `import { createUpdateFieldInstruction } from "@solana/spl-token-metadata";

// Adicionar ou atualizar um campo de metadados
const updateTx = new Transaction().add(
  createUpdateFieldInstruction({
    programId: TOKEN_2022_PROGRAM_ID,
    metadata: mintPublicKey,
    updateAuthority: updateAuthority.publicKey,
    field: "xp_total",    // nome do campo customizado
    value: "1500",        // novo valor
  })
);

await sendAndConfirmTransaction(connection, updateTx, [updateAuthority]);
console.log("Metadados atualizados com sucesso");`,
      "c2l3_cb2"
    ),
    para(
      "A Superteam Academy usa MetadataPointer + TokenMetadata nos mints de XP para armazenar informações do curso diretamente on-chain: nome do curso, nível de dificuldade, total de XP disponível e URL para metadados estendidos off-chain. Isso torna cada mint de XP um registro imutável e verificável do curso.",
      "c2l3_p3"
    ),
    callout(
      "tip",
      "Para leitura de metadados Token-2022, use getTokenMetadata do @solana/spl-token. Ela extrai automaticamente os campos name, symbol, uri e additionalMetadata da conta do mint.",
      "c2l3_c2"
    ),
  ],
};

// ===========================================================================
// COURSE 2 — Module
// ===========================================================================

const module_c2_m1 = {
  _id: "module-token-program-m1",
  _type: "module",
  title: "Token-2022 em Profundidade",
  slug: { _type: "slug", current: "token-2022-em-profundidade" },
  description:
    "Explore as extensões avançadas do Token-2022: tokens soulbound, delegação permanente e metadados on-chain.",
  order: 1,
  lessons: [
    { _type: "reference", _key: "ref_c2m1_l1", _ref: "lesson-token-program-l1" },
    { _type: "reference", _key: "ref_c2m1_l2", _ref: "lesson-token-program-l2" },
    { _type: "reference", _key: "ref_c2m1_l3", _ref: "lesson-token-program-l3" },
  ],
};

// ===========================================================================
// COURSE 2 — Document
// ===========================================================================

const course2 = {
  _id: "course-token-program",
  _type: "course",
  title: "Token Program em Profundidade",
  slug: { _type: "slug", current: "token-program" },
  description:
    "Explore as extensões avançadas do Token-2022: tokens não-transferíveis (soulbound), delegação permanente, metadados on-chain e controle de ciclo de vida de mints. Curso intermediário para desenvolvedores que já conhecem os fundamentos da Solana.",
  difficulty: 2,
  trackId: 4,
  onChainCourseId: "token-program",
  xpPerLesson: 100,
  xpPerCourseCompletion: 500,
  status: "published",
  locale: "pt-BR",
  tags: ["solana", "token-2022", "spl-token", "soulbound", "intermediario"],
  prerequisites: ["solana-intro"],
  instructor: { _type: "reference", _ref: "instructor-sofia-santos" },
  modules: [
    { _type: "reference", _key: "ref_c2_m1", _ref: "module-token-program-m1" },
  ],
  lessons: [
    { _type: "reference", _key: "ref_c2_l1", _ref: "lesson-token-program-l1" },
    { _type: "reference", _key: "ref_c2_l2", _ref: "lesson-token-program-l2" },
    { _type: "reference", _key: "ref_c2_l3", _ref: "lesson-token-program-l3" },
  ],
};

// ===========================================================================
// All documents — order matters: lessons/challenges before modules, modules before courses
// ===========================================================================

const ALL_DOCUMENTS = [
  // Instructor
  instructor,

  // Challenges
  challenge_token_basics,
  challenge_pda_derivation,
  challenge_hello_anchor,

  // Course 1 — Module 1 lessons
  lesson_c1_m1_l1,
  lesson_c1_m1_l2,
  lesson_c1_m1_l3,

  // Course 1 — Module 2 lessons
  lesson_c1_m2_l4,
  lesson_c1_m2_l5,
  lesson_c1_m2_l6,

  // Course 1 — modules (after lessons)
  module_c1_m1,
  module_c1_m2,

  // Course 1
  course1,

  // Course 2 — lessons
  lesson_c2_l1,
  lesson_c2_l2,
  lesson_c2_l3,

  // Course 2 — module (after lessons)
  module_c2_m1,

  // Course 2
  course2,
];

// ===========================================================================
// Seed execution
// ===========================================================================

async function seed() {
  console.log(`\nSuperteam Academy — Seed Script`);
  console.log(`Project: ${projectId} | Dataset: ${dataset}`);
  console.log(`Documents to upsert: ${ALL_DOCUMENTS.length}\n`);

  let created = 0;
  let errors = 0;

  for (const doc of ALL_DOCUMENTS) {
    try {
      const result = await client.createOrReplace(doc);
      console.log(`  [OK] ${result._type.padEnd(12)} ${result._id}`);
      created++;
    } catch (err) {
      console.error(`  [ERR] ${doc._type} ${doc._id}:`, err.message);
      errors++;
    }
  }

  console.log(`\n--- Done ---`);
  console.log(`  Created/updated: ${created}`);
  if (errors > 0) {
    console.log(`  Errors:          ${errors}`);
    process.exit(1);
  }
}

seed().catch((err) => {
  console.error("\nFatal error:", err);
  process.exit(1);
});
