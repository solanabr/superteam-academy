/**
 * Course catalog with full lesson content.
 * In production this comes from the database; here we provide rich demo data
 * so the app is fully functional without a DB connection.
 */

export interface QuizQuestion {
  question: string
  options: string[]
  answer: number // index
}

export interface Lesson {
  id: string
  title: string
  titlePt: string
  content: string // markdown
  type: 'TEXT' | 'VIDEO' | 'QUIZ'
  videoUrl?: string
  quiz?: QuizQuestion[]
  order: number
  xp?: number
}

export interface Module {
  id: string
  title: string
  titlePt: string
  order: number
  lessons: Lesson[]
}

export interface Course {
  id: string
  slug: string
  title: string
  titleEn: string
  description: string
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
  category: string
  icon: string
  modules: Module[]
  students: number
  tokenGated: boolean
  requiredToken?: string
}

export const COURSES: Course[] = [
  {
    id: '1',
    slug: 'intro-solana',
    title: 'Introdução ao Solana',
    titleEn: 'Introduction to Solana',
    description: 'Aprenda os fundamentos do blockchain Solana, wallets, tokens e o ecossistema.',
    difficulty: 'BEGINNER',
    category: 'Blockchain',
    icon: '☀️',
    students: 156,
    tokenGated: false,
    modules: [
      {
        id: 'm1-1',
        title: 'O que é Solana?',
        titlePt: 'O que é Solana?',
        order: 1,
        lessons: [
          {
            id: 'l1-1-1',
            title: 'History & Architecture',
            titlePt: 'História & Arquitetura',
            order: 1,
            type: 'TEXT',
            content: `# História & Arquitetura do Solana

O Solana foi criado por **Anatoly Yakovenko** em 2017 e lançado em março de 2020.

## Proof of History (PoH)

A grande inovação do Solana é o **Proof of History** — um relógio criptográfico que permite que validadores concordem sobre a ordem dos eventos sem comunicação extensiva.

\`\`\`
SHA256(hash_anterior) → hash_atual + timestamp
\`\`\`

Isso permite:
- **400ms** de tempo de bloco
- **65,000+ TPS** teórico
- **$0.00025** por transação média

## Arquitetura

| Componente | Função |
|-----------|--------|
| Tower BFT | Consenso otimizado com PoH |
| Turbine | Propagação de blocos via streaming |
| Gulf Stream | Encaminhamento de transações sem mempool |
| Sealevel | Runtime paralelo de smart contracts |
| Pipelining | Validação em pipeline de GPU |
| Cloudbreak | Banco de dados de contas horizontal |

## Por que Solana para dApps?

1. **Velocidade**: Finalidade em ~400ms
2. **Custo**: Frações de centavo por tx
3. **Composabilidade**: Tudo em uma Layer 1
4. **Ecossistema**: DeFi, NFTs, DePIN, e muito mais`,
          },
          {
            id: 'l1-1-2',
            title: 'Wallets & Keys',
            titlePt: 'Wallets & Chaves',
            order: 2,
            type: 'TEXT',
            content: `# Wallets & Chaves Criptográficas

## Par de Chaves (Keypair)

No Solana, cada conta é identificada por uma **chave pública** (32 bytes) derivada de uma **chave privada** usando curva **Ed25519**.

\`\`\`typescript
import { Keypair } from '@solana/web3.js'

const keypair = Keypair.generate()
console.log('Pública:', keypair.publicKey.toBase58())
// Exemplo: 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU
\`\`\`

## Wallets Populares

- **Phantom** — Mais popular, excelente UX
- **Solflare** — Staking nativo, hardware wallet support
- **Backpack** — xNFT ecosystem
- **Ledger** — Hardware wallet (cold storage)

## Segurança

> ⚠️ **NUNCA compartilhe sua seed phrase ou chave privada!**

Boas práticas:
- Use hardware wallet para valores grandes
- Ative 2FA quando disponível
- Verifique URLs antes de conectar wallet
- Use wallets separadas para interações desconhecidas`,
          },
          {
            id: 'l1-1-3',
            title: 'Quiz: Fundamentos',
            titlePt: 'Quiz: Fundamentos',
            order: 3,
            type: 'QUIZ',
            content: 'Teste seus conhecimentos sobre os fundamentos do Solana.',
            quiz: [
              {
                question: 'Qual é a inovação principal do Solana?',
                options: ['Proof of Work', 'Proof of Stake', 'Proof of History', 'Proof of Authority'],
                answer: 2,
              },
              {
                question: 'Qual é o tempo médio de bloco do Solana?',
                options: ['12 segundos', '400 milissegundos', '1 minuto', '6 segundos'],
                answer: 1,
              },
              {
                question: 'Qual algoritmo de assinatura o Solana usa?',
                options: ['RSA-2048', 'secp256k1', 'Ed25519', 'BLS'],
                answer: 2,
              },
              {
                question: 'Qual componente do Solana permite execução paralela de smart contracts?',
                options: ['Turbine', 'Gulf Stream', 'Sealevel', 'Cloudbreak'],
                answer: 2,
              },
            ],
          },
        ],
      },
      {
        id: 'm1-2',
        title: 'Tokens & Programas',
        titlePt: 'Tokens & Programas',
        order: 2,
        lessons: [
          {
            id: 'l1-2-1',
            title: 'SPL Token Program',
            titlePt: 'Programa SPL Token',
            order: 1,
            type: 'TEXT',
            content: `# Programa SPL Token

O **SPL Token Program** é o padrão para tokens fungíveis e não-fungíveis no Solana.

## Criando um Token

\`\`\`bash
# Instalar CLI do Solana
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Criar um token
spl-token create-token

# Criar conta de token
spl-token create-account <TOKEN_MINT>

# Mintear tokens
spl-token mint <TOKEN_MINT> 1000
\`\`\`

## Token Accounts

Diferente do Ethereum (ERC-20), no Solana cada token que você possui requer uma **Token Account** separada:

- **Mint Account**: Define o token (supply, decimals, authority)
- **Token Account**: Armazena o saldo de um token específico para um owner
- **Associated Token Account (ATA)**: Endereço derivado deterministicamente

## Token Extensions (Token-2022)

O novo padrão **Token-2022** adiciona:
- Transfer fees (taxas de transferência)
- Non-transferable tokens (soulbound)
- Confidential transfers
- Interest-bearing tokens
- Permanent delegate`,
          },
          {
            id: 'l1-2-2',
            title: 'Primeira Transação',
            titlePt: 'Sua Primeira Transação',
            order: 2,
            type: 'TEXT',
            content: `# Sua Primeira Transação on-chain

Vamos enviar SOL de uma wallet para outra usando TypeScript.

## Setup

\`\`\`bash
npm install @solana/web3.js
\`\`\`

## Código

\`\`\`typescript
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from '@solana/web3.js'

async function main() {
  // Conectar ao devnet
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed')

  // Gerar keypair (em produção, use sua wallet)
  const sender = Keypair.generate()

  // Airdrop de SOL (apenas devnet)
  const airdropSig = await connection.requestAirdrop(
    sender.publicKey,
    2 * LAMPORTS_PER_SOL
  )
  await connection.confirmTransaction(airdropSig)

  // Criar transação
  const receiver = Keypair.generate()
  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: sender.publicKey,
      toPubkey: receiver.publicKey,
      lamports: 0.5 * LAMPORTS_PER_SOL,
    })
  )

  // Enviar e confirmar
  const sig = await sendAndConfirmTransaction(connection, tx, [sender])
  console.log('Transação confirmada:', sig)
  console.log('Explorer:', \`https://explorer.solana.com/tx/\${sig}?cluster=devnet\`)
}

main()
\`\`\`

## Conceitos-chave

- **LAMPORTS_PER_SOL** = 1,000,000,000 (1 SOL = 10⁹ lamports)
- **Transação** = conjunto de instruções atômicas
- **Instrução** = chamada a um programa on-chain
- **Confirmação** = inclusão no ledger com nível de certeza configurável`,
          },
        ],
      },
    ],
  },
  {
    id: '2',
    slug: 'anchor-contracts',
    title: 'Smart Contracts com Anchor',
    titleEn: 'Smart Contracts with Anchor',
    description: 'Desenvolva smart contracts profissionais usando o framework Anchor.',
    difficulty: 'INTERMEDIATE',
    category: 'Development',
    icon: '⚓',
    students: 89,
    tokenGated: false,
    modules: [
      {
        id: 'm2-1',
        title: 'Setup & Primeiro Programa',
        titlePt: 'Setup & Primeiro Programa',
        order: 1,
        lessons: [
          {
            id: 'l2-1-1',
            title: 'Anchor Setup',
            titlePt: 'Instalação do Anchor',
            order: 1,
            type: 'TEXT',
            content: `# Instalação do Anchor Framework

## Pré-requisitos

\`\`\`bash
# Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Anchor CLI
cargo install --git https://github.com/coral-xyz/anchor avm --locked
avm install latest
avm use latest
\`\`\`

## Criando um Projeto

\`\`\`bash
anchor init meu_programa
cd meu_programa
\`\`\`

## Estrutura do Projeto

\`\`\`
meu_programa/
├── Anchor.toml        # Configuração
├── programs/          # Smart contracts (Rust)
│   └── meu_programa/
│       └── src/
│           └── lib.rs
├── tests/             # Testes (TypeScript)
│   └── meu_programa.ts
├── app/               # Frontend
└── migrations/        # Deploy scripts
\`\`\`

## Anatomia de um Programa Anchor

\`\`\`rust
use anchor_lang::prelude::*;

declare_id!("YOUR_PROGRAM_ID");

#[program]
mod meu_programa {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, data: u64) -> Result<()> {
        let conta = &mut ctx.accounts.minha_conta;
        conta.data = data;
        conta.authority = ctx.accounts.user.key();
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = user, space = 8 + 32 + 8)]
    pub minha_conta: Account<'info, MinhaConta>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct MinhaConta {
    pub authority: Pubkey,
    pub data: u64,
}
\`\`\``,
          },
          {
            id: 'l2-1-2',
            title: 'Quiz: Anchor Basics',
            titlePt: 'Quiz: Básicos do Anchor',
            order: 2,
            type: 'QUIZ',
            content: 'Teste seus conhecimentos sobre Anchor.',
            quiz: [
              {
                question: 'O que o macro #[program] faz no Anchor?',
                options: [
                  'Define variáveis globais',
                  'Marca o módulo como entry point do smart contract',
                  'Cria uma transação automaticamente',
                  'Compila para WebAssembly',
                ],
                answer: 1,
              },
              {
                question: 'Qual é o tamanho do discriminator no Anchor?',
                options: ['4 bytes', '8 bytes', '16 bytes', '32 bytes'],
                answer: 1,
              },
              {
                question: 'O que #[account(init, payer = user)] faz?',
                options: [
                  'Lê uma conta existente',
                  'Fecha uma conta',
                  'Cria e inicializa uma nova conta, com user pagando o rent',
                  'Transfere SOL para user',
                ],
                answer: 2,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: '3',
    slug: 'defi-practice',
    title: 'DeFi na Prática',
    titleEn: 'DeFi in Practice',
    description: 'Construa protocolos DeFi: AMMs, lending, staking e yield farming.',
    difficulty: 'ADVANCED',
    category: 'DeFi',
    icon: '💰',
    students: 45,
    tokenGated: true,
    requiredToken: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    modules: [
      {
        id: 'm3-1',
        title: 'AMM — Automated Market Maker',
        titlePt: 'AMM — Automated Market Maker',
        order: 1,
        lessons: [
          {
            id: 'l3-1-1',
            title: 'Constant Product AMM',
            titlePt: 'AMM de Produto Constante',
            order: 1,
            type: 'TEXT',
            content: `# AMM de Produto Constante (x * y = k)

## Teoria

A fórmula fundamental: **x × y = k**

Onde:
- **x** = reserva do token A
- **y** = reserva do token B
- **k** = constante (invariante)

## Implementação em Anchor

\`\`\`rust
pub fn swap(ctx: Context<Swap>, amount_in: u64, min_amount_out: u64) -> Result<()> {
    let pool = &mut ctx.accounts.pool;
    
    // x * y = k (antes do swap)
    let k = pool.reserve_a as u128 * pool.reserve_b as u128;
    
    // Novo reserve_a após depósito
    let new_reserve_a = pool.reserve_a + amount_in;
    
    // Calcular novo reserve_b mantendo k constante
    let new_reserve_b = (k / new_reserve_a as u128) as u64;
    
    // Amount out = diferença
    let amount_out = pool.reserve_b - new_reserve_b;
    
    // Aplicar fee (0.3%)
    let fee = amount_out * 3 / 1000;
    let amount_out_after_fee = amount_out - fee;
    
    require!(amount_out_after_fee >= min_amount_out, ErrorCode::SlippageExceeded);
    
    // Atualizar reserves
    pool.reserve_a = new_reserve_a;
    pool.reserve_b = new_reserve_b + fee; // fee fica no pool
    
    // Transfer tokens...
    Ok(())
}
\`\`\`

## Conceitos Importantes

- **Slippage**: Diferença entre preço esperado e executado
- **Impermanent Loss**: Perda temporária para LPs vs holding
- **Price Impact**: Quanto um trade move o preço (depende do tamanho vs liquidez)
- **Concentrated Liquidity**: Orca Whirlpools, range orders`,
          },
        ],
      },
    ],
  },
  {
    id: '4',
    slug: 'nft-marketplace',
    title: 'NFT Marketplace do Zero',
    titleEn: 'NFT Marketplace from Scratch',
    description: 'Crie um marketplace de NFTs completo com Metaplex e Solana.',
    difficulty: 'INTERMEDIATE',
    category: 'NFT',
    icon: '🎨',
    students: 67,
    tokenGated: false,
    modules: [
      {
        id: 'm4-1',
        title: 'Metaplex & NFT Standards',
        titlePt: 'Metaplex & Padrões NFT',
        order: 1,
        lessons: [
          {
            id: 'l4-1-1',
            title: 'NFT Standards on Solana',
            titlePt: 'Padrões NFT no Solana',
            order: 1,
            type: 'TEXT',
            content: `# Padrões NFT no Solana

## Metaplex Token Metadata

O padrão mais usado para NFTs no Solana. Cada NFT consiste em:

1. **Mint Account** — Token com supply = 1, decimals = 0
2. **Metadata Account** — Nome, símbolo, URI (PDA derivado do mint)
3. **Master Edition** — Garante unicidade (não pode mintar mais)

## Tipos de NFT

### Standard NFTs
- 1 mint por NFT
- Custo: ~0.012 SOL por NFT
- Bom para coleções pequenas

### Compressed NFTs (cNFTs)
- Usam Merkle trees (Bubblegum)
- Custo: ~$0.001 por NFT
- Ideal para coleções grandes (milhões)

### Programmable NFTs (pNFTs)
- Regras de royalty enforced on-chain
- Auth rules configuráveis
- Padrão para royalties obrigatórios

## Metaplex Core (Novo!)

\`\`\`typescript
import { create } from '@metaplex-foundation/mpl-core'

await create(umi, {
  asset: generateSigner(umi),
  name: 'Meu NFT',
  uri: 'https://arweave.net/metadata.json',
  plugins: [
    { type: 'Royalties', basisPoints: 500, creators: [...] },
    { type: 'FreezeDelegate', frozen: false },
  ],
}).sendAndConfirm(umi)
\`\`\``,
          },
        ],
      },
    ],
  },
  {
    id: '5',
    slug: 'web3-frontend',
    title: 'Frontend Web3 com Next.js',
    titleEn: 'Web3 Frontend with Next.js',
    description: 'Construa interfaces modernas para dApps com Next.js, TypeScript e wallet adapters.',
    difficulty: 'BEGINNER',
    category: 'Frontend',
    icon: '🖥️',
    students: 203,
    tokenGated: false,
    modules: [
      {
        id: 'm5-1',
        title: 'Wallet Adapter',
        titlePt: 'Wallet Adapter',
        order: 1,
        lessons: [
          {
            id: 'l5-1-1',
            title: 'Connecting Wallets',
            titlePt: 'Conectando Wallets',
            order: 1,
            type: 'TEXT',
            content: `# Conectando Wallets com @solana/wallet-adapter

## Instalação

\`\`\`bash
npm install @solana/wallet-adapter-base \\
  @solana/wallet-adapter-react \\
  @solana/wallet-adapter-react-ui \\
  @solana/wallet-adapter-wallets \\
  @solana/web3.js
\`\`\`

## Provider Setup

\`\`\`tsx
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets'

function App({ children }) {
  const wallets = [new PhantomWalletAdapter()]
  
  return (
    <ConnectionProvider endpoint="https://api.devnet.solana.com">
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}
\`\`\`

## Usando o Hook

\`\`\`tsx
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'

function MyComponent() {
  const { publicKey, connected, signTransaction } = useWallet()
  
  return (
    <div>
      <WalletMultiButton />
      {connected && <p>Conectado: {publicKey?.toBase58()}</p>}
    </div>
  )
}
\`\`\``,
          },
        ],
      },
    ],
  },
  {
    id: '6',
    slug: 'tokenomics',
    title: 'Tokenomics & Economia Cripto',
    titleEn: 'Tokenomics & Crypto Economics',
    description: 'Entenda design de tokens, governance, incentivos e economia de protocolos.',
    difficulty: 'INTERMEDIATE',
    category: 'Economics',
    icon: '📊',
    students: 112,
    tokenGated: false,
    modules: [
      {
        id: 'm6-1',
        title: 'Design de Tokens',
        titlePt: 'Design de Tokens',
        order: 1,
        lessons: [
          {
            id: 'l6-1-1',
            title: 'Token Design Fundamentals',
            titlePt: 'Fundamentos de Design de Token',
            order: 1,
            type: 'TEXT',
            content: `# Fundamentos de Design de Token

## Supply & Distribuição

### Modelos de Supply
- **Fixed Supply**: Bitcoin (21M), NFTs
- **Inflationary**: Solana (~5.5% inicial, diminuindo)
- **Deflationary**: Burn mechanics, buyback
- **Elastic**: Rebase tokens (ajustam supply)

## Distribuição Típica

| Alocação | Porcentagem | Vesting |
|----------|------------|---------|
| Team | 15-20% | 4 anos, cliff 1 ano |
| Investors | 15-25% | 2-3 anos |
| Community | 30-40% | Airdrops, rewards |
| Treasury | 10-20% | DAO governance |
| Liquidity | 5-10% | DEX pools |

## Mecanismos de Valor

1. **Utility**: Acesso a serviços (compute, storage)
2. **Governance**: Poder de voto em decisões
3. **Staking**: Yield por securing a rede
4. **Fee Sharing**: Revenue distribution
5. **Deflation**: Burns reduzem supply

## Erros Comuns

- ❌ Token sem utilidade real
- ❌ Vesting muito curto (dump ao unlock)
- ❌ Concentração excessiva na equipe
- ❌ Inflação sem demanda correspondente`,
          },
        ],
      },
    ],
  },
]

// Helper functions
export function getCourse(slug: string): Course | undefined {
  return COURSES.find(c => c.slug === slug)
}

export function getLesson(courseSlug: string, lessonId: string): { course: Course; lesson: Lesson; module: Module } | undefined {
  const course = getCourse(courseSlug)
  if (!course) return undefined
  for (const mod of course.modules) {
    const lesson = mod.lessons.find(l => l.id === lessonId)
    if (lesson) return { course, lesson, module: mod }
  }
  return undefined
}

export function getTotalLessons(course: Course): number {
  return course.modules.reduce((acc, m) => acc + m.lessons.length, 0)
}

export function getAllLessonsFlat(course: Course): Lesson[] {
  return course.modules.flatMap(m => m.lessons)
}
