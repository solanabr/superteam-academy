import { course4, course5, course6 } from "./courses-4-5-6";
import { course7, course8, course9 } from "./courses-7-8-9";

export type Difficulty = "beginner" | "intermediate" | "advanced";
export type Duration = "short" | "medium" | "long";

export interface Exercise {
  question: string;
  options: string[];
  correctIndex: number;
}

export interface Lesson {
  id: string;
  title: string;
  slug: string;
  type: "content" | "challenge";
  durationMinutes: number;
  xpReward: number;
  content?: string; // markdown
  exercise?: Exercise;
  challenge?: {
    prompt: string;
    starterCode: string;
    language: "rust" | "typescript" | "json";
    testCases: { input: string; expected: string }[];
  };
}

export interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  slug: string;
  title: string;
  description: string;
  longDescription: string;
  difficulty: Difficulty;
  duration: Duration;
  totalDurationMinutes: number;
  xpTotal: number;
  thumbnail: string;
  instructor: { name: string; avatar: string; role: string };
  instructorSlug: string;
  track: string;
  modules: Module[];
}

export const courses: Course[] = [
  {
    id: "1",
    slug: "solana-fundamentals",
    title: "Solana Fundamentals",
    description:
      "Domine os fundamentos do ecossistema Solana: arquitetura, contas, transações, programas e CLI.",
    longDescription:
      "Um curso completo para iniciantes que cobre desde a história e arquitetura do Solana até a prática com CLI e sua primeira transação. Aprenda como funciona o modelo de contas, transações, instruções e programas on-chain.",
    difficulty: "beginner",
    duration: "medium",
    totalDurationMinutes: 195,
    xpTotal: 255,
    thumbnail: "/courses/solana-fundamentals.png",
    instructor: {
      name: "Kuka",
      avatar: "/instructors/kuka.png",
      role: "Instrutor",
    },
    instructorSlug: "superteam-br",
    track: "Solana Fundamentals",
    modules: [
      {
        id: "m1-1",
        title: "Introdução ao Solana",
        lessons: [
          {
            id: "sf-l1",
            title: "O que é Solana?",
            slug: "o-que-e-solana",
            type: "content",
            durationMinutes: 20,
            xpReward: 25,
            content: `# O que é Solana?

Solana é uma blockchain de **alta performance** criada por Anatoly Yakovenko em 2017 e lançada oficialmente em março de 2020. Ela foi projetada desde o início para resolver o **trilema da blockchain**: escalabilidade, segurança e descentralização.

## Principais Características

- **Throughput**: até **65.000 transações por segundo** (TPS), muito acima de blockchains tradicionais
- **Latência**: tempo de confirmação de aproximadamente **400 milissegundos**
- **Custo**: transações custam frações de centavo (geralmente ~$0.00025)
- **Linguagem**: programas (smart contracts) escritos em **Rust**, C, ou C++

## Proof of History (PoH)

A grande inovação do Solana é o **Proof of History**, um relógio criptográfico que cria uma sequência verificável de eventos no tempo. Isso permite que os validadores concordem sobre a **ordem das transações** sem precisar se comunicar constantemente entre si.

\`\`\`
Bloco N -> Hash(Bloco N) -> Hash(Hash(Bloco N)) -> Bloco N+1
\`\`\`

Cada hash serve como **prova de que o tempo passou**, criando um registro histórico antes mesmo do consenso.

## Solana vs Ethereum

| Característica | Solana | Ethereum |
|---|---|---|
| TPS | ~65.000 | ~15-30 |
| Tempo de bloco | ~400ms | ~12s |
| Custo médio | ~$0.00025 | ~$1-50 |
| Linguagem | Rust | Solidity |
| Consenso | PoH + Tower BFT | PoS (Casper) |

## Por que aprender Solana?

1. **Ecossistema em crescimento**: DeFi, NFTs, gaming, pagamentos
2. **Developer experience**: ferramentas maduras (Anchor, Solana CLI)
3. **Comunidade ativa**: hackathons, grants e programas de aceleração
4. **Performance real**: ideal para aplicações que exigem velocidade`,
            exercise: {
              question:
                "Qual é a principal inovação do Solana que permite alta performance na ordenação de transações?",
              options: [
                "Proof of Work (PoW)",
                "Proof of History (PoH)",
                "Proof of Stake (PoS)",
                "Sharding",
              ],
              correctIndex: 1,
            },
          },
          {
            id: "sf-l2",
            title: "Arquitetura do Solana",
            slug: "arquitetura-solana",
            type: "content",
            durationMinutes: 25,
            xpReward: 30,
            content: `# Arquitetura do Solana

O Solana possui uma arquitetura única composta por **8 inovações tecnológicas** que trabalham juntas para alcançar alta performance.

## Validadores

Os **validadores** são os nós que processam transações e mantêm o estado da rede. Qualquer pessoa pode rodar um validador, contribuindo para a descentralização.

- **Leader**: o validador selecionado para produzir blocos em um slot
- **Voter**: validadores que votam para confirmar blocos
- **RPC Nodes**: nós que servem dados para aplicações (não votam)

## Clusters

Um cluster é um conjunto de validadores trabalhando juntos. Existem 3 clusters principais:

- **Mainnet-beta**: rede principal (produção)
- **Devnet**: rede de desenvolvimento (tokens sem valor real)
- **Testnet**: rede para testar atualizações do protocolo

## Slots e Epochs

- **Slot**: período de ~400ms onde um leader pode produzir um bloco
- **Epoch**: conjunto de **432.000 slots** (~2-3 dias), ao fim do qual ocorre a rotação de leaders e distribuição de recompensas

\`\`\`
Epoch 1: [Slot 0] [Slot 1] [Slot 2] ... [Slot 431.999]
Epoch 2: [Slot 432.000] [Slot 432.001] ...
\`\`\`

## Tower BFT

O **Tower BFT** é a implementação de consenso do Solana, baseada no PBFT (Practical Byzantine Fault Tolerance), mas otimizada usando o PoH como relógio.

- Validadores votam em forks da chain
- Cada voto tem um **lockout** crescente (exponencial)
- Quanto mais antigo o voto, mais caro é mudar de fork
- Isso reduz drasticamente a comunicação necessária entre validadores

## Gulf Stream

O **Gulf Stream** elimina o mempool tradicional. Em vez de transações ficarem esperando em um pool:

1. Clientes enviam transações diretamente ao **próximo leader**
2. Validadores fazem cache e encaminham transações antecipadamente
3. O leader já tem transações prontas quando seu slot começa

Isso reduz a latência de confirmação e o uso de memória dos validadores.

## Turbine

**Turbine** é o protocolo de propagação de blocos, inspirado no BitTorrent:

- Blocos são divididos em **pacotes pequenos** (shreds)
- Cada validador repassa pacotes para vizinhos
- A propagação acontece em **árvore**, não broadcast`,
            exercise: {
              question: 'O que é um "slot" na arquitetura do Solana?',
              options: [
                "Um tipo de conta que armazena tokens",
                "O período de ~400ms onde um leader pode produzir um bloco",
                "Um programa on-chain que valida transações",
                "O endereço público de um validador",
              ],
              correctIndex: 1,
            },
          },
        ],
      },
      {
        id: "m1-2",
        title: "Modelo de Dados",
        lessons: [
          {
            id: "sf-l3",
            title: "Contas e o Account Model",
            slug: "contas-account-model",
            type: "content",
            durationMinutes: 30,
            xpReward: 35,
            content: `# Contas e o Account Model

No Solana, **tudo é uma conta**. Diferente de blockchains baseadas em UTXO (como Bitcoin), o Solana usa um modelo de contas semelhante a um banco de dados.

## Estrutura de uma Conta

Toda conta no Solana possui os seguintes campos:

\`\`\`rust
pub struct Account {
    pub lamports: u64,        // saldo em lamports (1 SOL = 1 bilhão de lamports)
    pub data: Vec<u8>,        // dados arbitrários (bytes)
    pub owner: Pubkey,        // programa que controla esta conta
    pub executable: bool,     // se é um programa executável
    pub rent_epoch: u64,      // próxima epoch para cobrança de rent
}
\`\`\`

## Conceitos Fundamentais

### Owner (Proprietário)

- Cada conta tem um **owner** — o programa que pode modificar seus dados
- Por padrão, novas contas são owned pelo **System Program**
- Apenas o owner pode debitar lamports e modificar data
- Qualquer conta pode **creditar** lamports a outra conta

### Lamports

- **1 SOL = 1.000.000.000 lamports** (10^9)
- Lamports são a unidade atômica de valor no Solana
- Toda conta precisa manter um saldo mínimo para pagar **rent**

### Rent (Aluguel)

O rent é o custo de manter dados armazenados na blockchain:

- Contas com saldo suficiente ficam **rent-exempt** (isentas)
- O mínimo para rent-exemption depende do **tamanho dos dados**
- Fórmula: ~0.00089088 SOL por byte por ano (2 anos de reserva)

\`\`\`bash
# Calcular rent-exemption para 100 bytes
solana rent 100
# Resultado: Rent-exempt minimum: 0.00144768 SOL
\`\`\`

### Data (Dados)

- O campo \`data\` armazena bytes arbitrários
- Para **contas de programa**: contém o bytecode BPF compilado
- Para **contas de dados**: armazenam estado serializado (Borsh, JSON, etc.)

## Tipos Comuns de Contas

| Tipo | Owner | Uso |
|---|---|---|
| Wallet | System Program | Armazenar SOL |
| Token Mint | Token Program | Definir um tipo de token |
| Token Account | Token Program | Saldo de tokens de um usuário |
| Program | BPF Loader | Código executável |
| PDA | Qualquer programa | Dados controlados por programa |

## Program Derived Addresses (PDAs)

PDAs são endereços **derivados deterministicamente** a partir de seeds e um program ID:

\`\`\`typescript
const [pda, bump] = PublicKey.findProgramAddressSync(
  [Buffer.from("seed"), userPubkey.toBuffer()],
  programId
);
\`\`\`

- Não possuem chave privada (não podem assinar)
- São controladas exclusivamente pelo programa que as derivou
- Fundamentais para armazenar estado on-chain`,
            exercise: {
              question:
                "Qual campo da conta Solana determina qual programa pode modificar seus dados?",
              options: ["lamports", "data", "owner", "rent_epoch"],
              correctIndex: 2,
            },
          },
          {
            id: "sf-l4",
            title: "Transações e instruções",
            slug: "transacoes-instrucoes",
            type: "content",
            durationMinutes: 30,
            xpReward: 35,
            content: `# Transações e Instruções

Uma **transação** é a unidade atômica de mudança de estado no Solana. Cada transação contém uma ou mais **instruções** que são executadas sequencialmente.

## Anatomia de uma Transação

\`\`\`typescript
interface Transaction {
  signatures: Signature[];       // assinaturas dos signatários
  message: {
    header: MessageHeader;       // contagem de signatários
    accountKeys: PublicKey[];    // todas as contas envolvidas
    recentBlockhash: string;    // hash recente para expiração
    instructions: Instruction[]; // lista de instruções
  };
}
\`\`\`

### Componentes Principais

1. **Signatures**: cada signatário assina o hash da mensagem com Ed25519
2. **Account Keys**: lista ordenada de todas as contas referenciadas
3. **Recent Blockhash**: hash recente (~60s de validade) que previne replay attacks
4. **Instructions**: as operações a serem executadas

## Instruções

Cada instrução especifica:

\`\`\`typescript
interface Instruction {
  programId: PublicKey;           // programa a ser invocado
  keys: AccountMeta[];            // contas necessárias
  data: Buffer;                   // dados serializados para o programa
}

interface AccountMeta {
  pubkey: PublicKey;
  isSigner: boolean;              // precisa assinar?
  isWritable: boolean;            // será modificada?
}
\`\`\`

## Signatários (Signers)

- O **fee payer** é sempre o primeiro signatário
- Signatários provam autorização para operações (ex: transferir SOL)
- Uma transação pode ter **múltiplos signatários**

## Recent Blockhash

- Serve como **nonce** para evitar replay de transações
- Expira em aproximadamente **60 segundos** (~150 slots)
- Se a transação não for processada a tempo, ela é descartada
- Alternativa: **Durable Nonces** para transações que precisam de mais tempo

## Exemplo: Transferência de SOL

\`\`\`typescript
import {
  Connection,
  Transaction,
  SystemProgram,
  sendAndConfirmTransaction,
} from '@solana/web3.js';

const tx = new Transaction().add(
  SystemProgram.transfer({
    fromPubkey: sender.publicKey,
    toPubkey: receiver,
    lamports: 1_000_000_000, // 1 SOL
  })
);

const signature = await sendAndConfirmTransaction(
  connection,
  tx,
  [sender] // signatários
);
\`\`\`

## Limites Importantes

- Tamanho máximo da transação: **1232 bytes**
- Máximo de contas por transação: **64**
- Compute units padrão: **200.000** (pode pedir até 1.4M)
- Máximo de instruções: sem limite fixo (limitado pelo tamanho)

## Ciclo de Vida

1. Cliente cria e assina a transação
2. Transação é enviada a um RPC node
3. RPC encaminha ao leader atual (Gulf Stream)
4. Leader verifica assinaturas e executa instruções
5. Se todas instruções sucederem, estado é commitado
6. Transação é propagada e votada pelos validadores`,
            exercise: {
              question:
                'Para que serve o "recent blockhash" em uma transação Solana?',
              options: [
                "Identificar o programa que será executado",
                "Prevenir replay attacks e definir validade temporal da transação",
                "Armazenar o saldo do fee payer",
                "Criptografar os dados da transação",
              ],
              correctIndex: 1,
            },
          },
          {
            id: "sf-l5",
            title: "Programas on-chain",
            slug: "programas-on-chain",
            type: "content",
            durationMinutes: 25,
            xpReward: 30,
            content: `# Programas On-Chain

No Solana, "smart contracts" são chamados de **programas**. Eles são código executável armazenado em contas especiais da blockchain.

## Programas vs Smart Contracts

Diferente de outras blockchains, no Solana os programas são **stateless** (sem estado):

- O **código** fica separado dos **dados**
- Programas recebem contas como parâmetros e operam sobre elas
- Isso permite paralelização: transações que tocam contas diferentes rodam em paralelo

## BPF / SBF

Os programas Solana são compilados para **SBF** (Solana Bytecode Format, antigo eBPF):

\`\`\`
Código Rust → Compilador → Bytecode SBF → Deploy na blockchain
\`\`\`

- Execução determinística e segura em sandbox
- Runtime valida limites de memória e compute
- Programas podem ser **upgradeable** ou **imutáveis**

## Programas Nativos (Built-in)

O Solana vem com vários programas nativos essenciais:

### System Program
- **ID**: \`11111111111111111111111111111111\`
- Cria novas contas
- Transfere SOL
- Atribui ownership a outros programas

### Token Program (SPL Token)
- **ID**: \`TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA\`
- Cria e gerencia tokens fungíveis
- Mint, transfer, burn, freeze

### Token-2022 (Token Extensions)
- **ID**: \`TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb\`
- Versão estendida com features como transfer fees, confidential transfers

### Associated Token Account Program
- **ID**: \`ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL\`
- Deriva endereços determinísticos para token accounts

### Metaplex Token Metadata
- Gerencia metadados de tokens e NFTs (nome, símbolo, URI)

## Anatomia de um Programa

\`\`\`rust
use solana_program::{
    account_info::AccountInfo,
    entrypoint,
    entrypoint::ProgramResult,
    pubkey::Pubkey,
};

entrypoint!(process_instruction);

fn process_instruction(
    program_id: &Pubkey,        // ID do programa
    accounts: &[AccountInfo],    // contas passadas pela instrução
    instruction_data: &[u8],     // dados da instrução
) -> ProgramResult {
    // Lógica do programa aqui
    Ok(())
}
\`\`\`

## Deploy e Upgrades

- Programas são deployed com \`solana program deploy\`
- Por padrão, programas são **upgradeable** (upgrade authority pode atualizar)
- A upgrade authority pode renunciar, tornando o programa **imutável**
- O bytecode é armazenado em contas de programa separadas (program data account)

## Cross-Program Invocations (CPIs)

Programas podem chamar outros programas:

\`\`\`rust
// Invocar System Program para transferir SOL
invoke(
    &system_instruction::transfer(from, to, amount),
    &[from_info, to_info, system_program_info],
)?;
\`\`\`

Isso permite composabilidade — a base do DeFi!`,
            exercise: {
              question:
                'Por que os programas Solana são chamados de "stateless" (sem estado)?',
              options: [
                "Porque não podem ser atualizados após o deploy",
                "Porque o código é separado dos dados — programas recebem contas como parâmetros",
                "Porque não podem interagir com outros programas",
                "Porque não precisam de compilação",
              ],
              correctIndex: 1,
            },
          },
        ],
      },
      {
        id: "m1-3",
        title: "Prática",
        lessons: [
          {
            id: "sf-l6",
            title: "Solana CLI na prática",
            slug: "solana-cli-pratica",
            type: "challenge",
            durationMinutes: 35,
            xpReward: 50,
            content: `# Solana CLI na Prática

Vamos colocar a mão na massa e usar o **Solana CLI** para interagir com a blockchain.

## Instalação

### macOS / Linux

\`\`\`bash
sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"
\`\`\`

Adicione ao PATH:

\`\`\`bash
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
\`\`\`

Verifique a instalação:

\`\`\`bash
solana --version
# solana-cli 1.18.x
\`\`\`

## Configuração

Conecte-se à **devnet** (rede de desenvolvimento):

\`\`\`bash
solana config set --url devnet
# ou o shorthand:
solana config set -u d
\`\`\`

Verifique a configuração:

\`\`\`bash
solana config get
\`\`\`

## Criando um Keypair

\`\`\`bash
solana-keygen new --outfile ~/my-keypair.json
# Gera uma nova chave pública/privada
\`\`\`

Veja seu endereço:

\`\`\`bash
solana address
\`\`\`

## Airdrop (SOL gratuito na devnet)

\`\`\`bash
solana airdrop 2
# Solicita 2 SOL na devnet
\`\`\`

Verifique o saldo:

\`\`\`bash
solana balance
# 2 SOL
\`\`\`

## Explorando a Blockchain

\`\`\`bash
# Ver informações de uma conta
solana account <ENDERECO>

# Ver uma transação
solana confirm <SIGNATURE>

# Ver informações do cluster
solana cluster-version
\`\`\`

## Desafio

No editor ao lado, complete o script que usa a Solana CLI para: criar um keypair, solicitar airdrop e verificar o saldo.`,
            exercise: {
              question:
                "Qual comando do Solana CLI é usado para solicitar SOL gratuito na devnet?",
              options: [
                "solana transfer",
                "solana airdrop",
                "solana mint",
                "solana request",
              ],
              correctIndex: 1,
            },
            challenge: {
              prompt:
                "Complete o script que cria um keypair, solicita airdrop de 2 SOL na devnet e verifica o saldo.",
              starterCode: `import { Connection, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';

async function main() {
  // 1. Conectar à devnet
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

  // 2. Criar um novo keypair
  const keypair = Keypair.generate();
  console.log('Endereço:', keypair.publicKey.toBase58());

  // 3. TODO: Solicitar airdrop de 2 SOL
  // Use: connection.requestAirdrop(...)


  // 4. TODO: Verificar o saldo
  // Use: connection.getBalance(...)


  // 5. TODO: Imprimir o saldo em SOL (divida por LAMPORTS_PER_SOL)

}

main();`,
              language: "typescript",
              testCases: [
                {
                  input: "requestAirdrop",
                  expected:
                    "connection.requestAirdrop(keypair.publicKey, 2 * LAMPORTS_PER_SOL)",
                },
                {
                  input: "getBalance",
                  expected: "connection.getBalance(keypair.publicKey)",
                },
              ],
            },
          },
          {
            id: "sf-l7",
            title: "Sua primeira transação",
            slug: "primeira-transacao",
            type: "challenge",
            durationMinutes: 30,
            xpReward: 50,
            content: `# Sua Primeira Transação

Agora vamos criar e enviar uma **transferência de SOL** na devnet usando a biblioteca \`@solana/web3.js\`.

## Conceitos Revisados

Para enviar uma transação, precisamos:

1. **Connection**: conexão com um RPC node
2. **Keypair**: chave do remetente (para assinar)
3. **Transaction**: objeto que contém as instruções
4. **Instruction**: a operação (transferência de SOL)

## Passo a Passo

### 1. Importar dependências

\`\`\`typescript
import {
  Connection,
  Keypair,
  Transaction,
  SystemProgram,
  sendAndConfirmTransaction,
  PublicKey,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
\`\`\`

### 2. Criar a instrução de transferência

\`\`\`typescript
const instruction = SystemProgram.transfer({
  fromPubkey: sender.publicKey,
  toPubkey: new PublicKey('ENDERECO_DESTINO'),
  lamports: 0.1 * LAMPORTS_PER_SOL, // 0.1 SOL
});
\`\`\`

### 3. Montar e enviar a transação

\`\`\`typescript
const tx = new Transaction().add(instruction);
const signature = await sendAndConfirmTransaction(
  connection,
  tx,
  [sender]
);
console.log('Transação confirmada:', signature);
\`\`\`

### 4. Verificar no Explorer

Acesse: \`https://explorer.solana.com/tx/SIGNATURE?cluster=devnet\`

## Desafio

Complete o código no editor para enviar 0.5 SOL de uma carteira para outra na devnet.`,
            exercise: {
              question:
                "Qual programa nativo do Solana é responsável por transferências de SOL?",
              options: [
                "Token Program",
                "Associated Token Account Program",
                "System Program",
                "BPF Loader",
              ],
              correctIndex: 2,
            },
            challenge: {
              prompt:
                "Envie uma transferência de 0.5 SOL do sender para o receiver na devnet.",
              starterCode: `import {
  Connection,
  Keypair,
  Transaction,
  SystemProgram,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';

async function main() {
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

  // Sender (já tem SOL via airdrop)
  const sender = Keypair.generate();
  const airdropSig = await connection.requestAirdrop(sender.publicKey, 2 * LAMPORTS_PER_SOL);
  await connection.confirmTransaction(airdropSig);

  // Receiver
  const receiver = Keypair.generate();
  console.log('Receiver:', receiver.publicKey.toBase58());

  // TODO: Criar a instrução de transferência de 0.5 SOL
  // Use SystemProgram.transfer({ fromPubkey, toPubkey, lamports })


  // TODO: Montar a Transaction e adicionar a instrução


  // TODO: Enviar e confirmar a transação
  // Use sendAndConfirmTransaction(connection, tx, [sender])


  // Verificar saldo do receiver
  const balance = await connection.getBalance(receiver.publicKey);
  console.log('Saldo do receiver:', balance / LAMPORTS_PER_SOL, 'SOL');
}

main();`,
              language: "typescript",
              testCases: [
                {
                  input: "SystemProgram.transfer",
                  expected:
                    "SystemProgram.transfer({ fromPubkey: sender.publicKey, toPubkey: receiver.publicKey, lamports: 0.5 * LAMPORTS_PER_SOL })",
                },
                {
                  input: "sendAndConfirmTransaction",
                  expected:
                    "await sendAndConfirmTransaction(connection, tx, [sender])",
                },
              ],
            },
          },
        ],
      },
    ],
  },
  {
    id: "2",
    slug: "defi-developer",
    title: "DeFi Developer",
    description:
      "Tokens SPL, AMMs, oráculos e protocolos DeFi completos no ecossistema Solana.",
    longDescription:
      "Curso intermediário completo sobre desenvolvimento DeFi no Solana. Aprenda a criar tokens, entender AMMs e pools de liquidez, integrar com Jupiter, explorar yield farming e oráculos, e construir um vault DeFi.",
    difficulty: "intermediate",
    duration: "long",
    totalDurationMinutes: 250,
    xpTotal: 460,
    thumbnail: "/courses/defi-developer.png",
    instructor: {
      name: "Kauê",
      avatar: "/instructors/kaue.png",
      role: "Instrutor",
    },
    instructorSlug: "kaue",
    track: "DeFi",
    modules: [
      {
        id: "m2-1",
        title: "Fundamentos DeFi",
        lessons: [
          {
            id: "df-l1",
            title: "Introdução ao DeFi",
            slug: "intro-defi",
            type: "content",
            durationMinutes: 25,
            xpReward: 40,
            content: `# Introdução ao DeFi

**DeFi** (Finanças Descentralizadas) é o ecossistema de aplicações financeiras construídas sobre blockchains, sem intermediários tradicionais como bancos.

## O que é DeFi?

DeFi permite que qualquer pessoa no mundo acesse serviços financeiros usando apenas uma carteira crypto:

- **Empréstimos e financiamentos** sem banco (ex: Solend, MarginFi)
- **Trocas de tokens** sem corretora (ex: Jupiter, Raydium)
- **Rendimentos** sobre ativos depositados (yield farming)
- **Stablecoins** descentralizadas (ex: UXD)

## Total Value Locked (TVL)

O **TVL** é a métrica principal do DeFi — o valor total de ativos depositados em protocolos:

\`\`\`
TVL do Solana DeFi: ~$5-10 bilhões (varia com mercado)
Principais protocolos: Jupiter, Raydium, Marinade, Jito
\`\`\`

Você pode acompanhar em [DefiLlama](https://defillama.com/chain/Solana).

## Yield Farming

Yield farming é a prática de depositar ativos em protocolos para ganhar rendimentos:

1. **Fornecer liquidez** a pools (LP tokens)
2. **Staking** de tokens nativos
3. **Lending** — emprestar ativos e receber juros
4. **Incentivos** em tokens do protocolo

### Exemplo de Fluxo

\`\`\`
1. Depositar SOL + USDC em pool Raydium
2. Receber LP tokens representando sua posição
3. Fazer stake dos LP tokens para ganhar recompensas
4. Colher (harvest) recompensas periodicamente
\`\`\`

## Liquidez

**Liquidez** é a facilidade de trocar ativos sem impacto significativo no preço:

- **Pools de liquidez**: reservas de pares de tokens em smart contracts
- **Liquidity Providers (LPs)**: usuários que depositam tokens nos pools
- **Impermanent Loss**: risco de perda temporária comparado ao HODL

## Riscos do DeFi

- **Smart contract risk**: bugs no código podem drenar fundos
- **Oracle manipulation**: preços manipulados podem causar liquidações
- **Impermanent loss**: desbalanceamento de pools
- **Rug pulls**: projetos maliciosos que fogem com fundos

## Por que Solana para DeFi?

| Vantagem | Impacto |
|---|---|
| Baixas taxas (~$0.00025) | Operações frequentes são viáveis |
| Alta velocidade (~400ms) | Arbitragem e liquidações rápidas |
| Composabilidade | CPIs permitem flash loans em 1 tx |
| Orderbooks on-chain | Phoenix, OpenBook — impossível em chains lentas |`,
            exercise: {
              question: "O que significa TVL no contexto de DeFi?",
              options: [
                "Token Value Listing — o preço de listagem de um token",
                "Total Value Locked — o valor total de ativos depositados em protocolos DeFi",
                "Transaction Validation Layer — a camada de validação de transações",
                "Token Verified Liquidity — liquidez verificada de um token",
              ],
              correctIndex: 1,
            },
          },
          {
            id: "df-l2",
            title: "SPL Token: criando seu token",
            slug: "criando-spl-token",
            type: "content",
            durationMinutes: 30,
            xpReward: 50,
            content: `# SPL Token: Criando Seu Token

O **SPL Token** é o padrão de tokens no Solana, equivalente ao ERC-20 na Ethereum. Vamos entender como criar e gerenciar tokens.

## Conceitos Fundamentais

### Mint Account

O **Mint** é a conta que define um tipo de token:

\`\`\`rust
pub struct Mint {
    pub mint_authority: Option<Pubkey>,  // quem pode cunhar novos tokens
    pub supply: u64,                      // total em circulação
    pub decimals: u8,                     // casas decimais (ex: 6 para USDC)
    pub is_initialized: bool,
    pub freeze_authority: Option<Pubkey>, // quem pode congelar contas
}
\`\`\`

### Decimals

- **SOL**: 9 decimais (1 SOL = 1.000.000.000 lamports)
- **USDC**: 6 decimais (1 USDC = 1.000.000 unidades)
- **NFTs**: 0 decimais e supply de 1

### Token Account

Cada holder precisa de uma **Token Account** para cada tipo de token:

\`\`\`rust
pub struct TokenAccount {
    pub mint: Pubkey,        // qual token
    pub owner: Pubkey,       // dono da conta
    pub amount: u64,         // saldo
    pub delegate: Option<Pubkey>,
    pub state: AccountState,
    pub is_native: Option<u64>,
    pub delegated_amount: u64,
    pub close_authority: Option<Pubkey>,
}
\`\`\`

## Criando um Token via CLI

\`\`\`bash
# 1. Criar o mint
spl-token create-token
# Resultado: Creating token AbC123...

# 2. Criar token account para receber
spl-token create-account AbC123...
# Resultado: Creating account XyZ789...

# 3. Cunhar 1000 tokens
spl-token mint AbC123... 1000
# Resultado: Minting 1000 tokens

# 4. Verificar saldo
spl-token balance AbC123...
# 1000
\`\`\`

## Criando via TypeScript

\`\`\`typescript
import { createMint, mintTo, getOrCreateAssociatedTokenAccount } from '@solana/spl-token';

// 1. Criar mint
const mint = await createMint(
  connection,
  payer,           // quem paga o rent
  mintAuthority,   // quem pode cunhar
  freezeAuthority, // quem pode congelar (ou null)
  6               // decimais
);

// 2. Criar token account
const tokenAccount = await getOrCreateAssociatedTokenAccount(
  connection, payer, mint, owner.publicKey
);

// 3. Cunhar tokens
await mintTo(
  connection, payer, mint, tokenAccount.address,
  mintAuthority, 1000 * 10 ** 6 // 1000 tokens com 6 decimais
);
\`\`\`

## Token Metadata (Metaplex)

Para dar nome, símbolo e imagem ao seu token:

\`\`\`typescript
const metadata = {
  name: "Meu Token",
  symbol: "MTK",
  uri: "https://arweave.net/metadata.json", // JSON com imagem
  sellerFeeBasisPoints: 0,
  creators: null,
};
\`\`\`

O URI aponta para um JSON off-chain com a imagem e descrição do token.`,
            exercise: {
              question:
                'Qual é a função do campo "decimals" em um Mint account de SPL Token?',
              options: [
                "Define o número máximo de tokens que podem ser cunhados",
                "Define a precisão do token — quantas casas decimais ele possui",
                "Define o preço inicial do token em SOL",
                "Define quantas contas podem possuir o token",
              ],
              correctIndex: 1,
            },
          },
          {
            id: "df-l3",
            title: "Token Accounts e Associated Token Accounts",
            slug: "token-accounts-ata",
            type: "content",
            durationMinutes: 25,
            xpReward: 50,
            content: `# Token Accounts e Associated Token Accounts (ATAs)

Entenda como o Solana gerencia saldos de tokens e por que as ATAs são tão importantes.

## O Problema

No Solana, cada token precisa de uma **conta separada** para armazenar o saldo. Uma wallet pode ter dezenas de token accounts:

\`\`\`
Wallet (System Account)
├── Token Account 1 (USDC)
├── Token Account 2 (RAY)
├── Token Account 3 (mSOL)
└── Token Account 4 (JitoSOL)
\`\`\`

Mas como encontrar a token account de alguém se pode existir várias para o mesmo token?

## Associated Token Accounts (ATAs)

A solução é o **Associated Token Account Program**, que **deriva deterministicamente** um endereço único para cada par (wallet + mint):

\`\`\`typescript
// Derivação da ATA
const ata = PublicKey.findProgramAddressSync(
  [
    walletAddress.toBuffer(),
    TOKEN_PROGRAM_ID.toBuffer(),
    mintAddress.toBuffer(),
  ],
  ASSOCIATED_TOKEN_PROGRAM_ID
);
\`\`\`

### Vantagens das ATAs

1. **Determinístico**: dado um wallet e mint, o endereço é sempre o mesmo
2. **Sem ambiguidade**: cada wallet tem exatamente 1 ATA por token
3. **Criação automática**: pode ser criada por qualquer pessoa (quem envia paga)
4. **Padrão universal**: todas as carteiras e protocolos usam ATAs

## PDA (Program Derived Address)

A ATA é um tipo de **PDA** — endereço derivado de seeds sem chave privada:

\`\`\`
Seeds: [wallet_pubkey, token_program_id, mint_pubkey]
        ↓
PDA = SHA256(seeds + program_id + "ProgramDerivedAddress")
        ↓
ATA Address (sem chave privada!)
\`\`\`

## Criando ATAs

\`\`\`typescript
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  getOrCreateAssociatedTokenAccount,
} from '@solana/spl-token';

// Opção 1: apenas derivar o endereço
const ataAddress = await getAssociatedTokenAddress(mint, owner);

// Opção 2: criar se não existir
const ata = await getOrCreateAssociatedTokenAccount(
  connection,
  payer,   // quem paga o rent
  mint,    // mint do token
  owner    // dono da ATA
);
\`\`\`

## Token Account vs ATA

| Aspecto | Token Account | ATA |
|---|---|---|
| Endereço | Aleatório | Derivado (determinístico) |
| Quantidade por mint | Múltiplas | Exatamente 1 por wallet |
| Descoberta | Precisa buscar | Pode calcular offline |
| Padrão | Genérico | Universalmente adotado |

## Custos

- Criar uma ATA custa ~0.00204 SOL (rent-exempt)
- O **remetente** geralmente paga a criação da ATA do destinatário
- ATAs podem ser **fechadas** para recuperar o rent`,
            exercise: {
              question:
                "Por que as Associated Token Accounts (ATAs) existem no Solana?",
              options: [
                "Para permitir transferências mais rápidas entre wallets",
                "Para garantir um endereço determinístico e único para cada par wallet + mint",
                "Para reduzir o custo de criação de token accounts",
                "Para permitir que tokens tenham múltiplos donos",
              ],
              correctIndex: 1,
            },
          },
        ],
      },
      {
        id: "m2-2",
        title: "Mecanismos DeFi",
        lessons: [
          {
            id: "df-l4",
            title: "Swaps e pools de liquidez",
            slug: "swaps-pools",
            type: "content",
            durationMinutes: 35,
            xpReward: 60,
            content: `# Swaps e Pools de Liquidez

Os **AMMs** (Automated Market Makers) são a base do DeFi — permitem trocar tokens sem orderbook centralizado.

## O que é um AMM?

Um AMM é um smart contract que mantém **reservas de dois tokens** e permite trocas usando uma fórmula matemática:

\`\`\`
Pool SOL/USDC:
├── Reserva SOL: 1.000 SOL
└── Reserva USDC: 100.000 USDC
→ Preço implícito: 1 SOL = 100 USDC
\`\`\`

## Constant Product Formula (x * y = k)

A fórmula mais comum (usada por Raydium, Orca):

\`\`\`
x * y = k

Onde:
  x = reserva do token A
  y = reserva do token B
  k = constante (produto)
\`\`\`

### Exemplo de Swap

\`\`\`
Estado inicial: x=1000 SOL, y=100000 USDC, k=100.000.000

Usuário quer comprar SOL com 1000 USDC:
  y_new = 100000 + 1000 = 101000
  x_new = k / y_new = 100000000 / 101000 = 990.099
  SOL recebido = 1000 - 990.099 = 9.901 SOL

Preço efetivo: 1000/9.901 ≈ 101.01 USDC/SOL
Preço spot era: 100 USDC/SOL
→ Slippage de ~1%
\`\`\`

## Slippage

**Slippage** é a diferença entre o preço esperado e o preço executado:

- Swaps grandes em pools pequenos → **alto slippage**
- A maioria dos protocolos permite definir um **slippage tolerance** (ex: 0.5%)
- Se o slippage exceder o tolerance, a transação **reverte**

\`\`\`typescript
// Definindo slippage de 1%
const slippageBps = 100; // 100 basis points = 1%
const minAmountOut = expectedAmount * (10000 - slippageBps) / 10000;
\`\`\`

## Concentrated Liquidity (CLMM)

Pools avançados (Orca Whirlpools, Raydium CLMM) permitem que LPs concentrem liquidez em **faixas de preço** específicas:

\`\`\`
LP tradicional:  |████████████████████████████| (liquidez espalhada)
LP concentrada:  |        ████████████        | (liquidez focada)
                         ↑ preço atual
\`\`\`

**Vantagem**: maior eficiência de capital (mais fees com menos capital).

## Liquidity Providers (LPs)

Para fornecer liquidez:

1. Deposite **ambos os tokens** do par na proporção correta
2. Receba **LP tokens** representando sua posição
3. Ganhe **fees** proporcionais à sua participação
4. Risco: **impermanent loss** se os preços divergirem

## AMMs no Solana

| Protocolo | Tipo | Destaque |
|---|---|---|
| Raydium | CPMM + CLMM | Maior TVL, integrado com OpenBook |
| Orca | CLMM (Whirlpools) | UX amigável, eficiente |
| Meteora | DLMM | Liquidez dinâmica, zero slippage em faixas |
| Phoenix | Orderbook | Order book on-chain, spreads baixos |`,
            exercise: {
              question:
                "Na fórmula constant product (x * y = k), o que acontece quando um usuário faz um swap grande em um pool pequeno?",
              options: [
                "O preço do token diminui",
                "A constante k muda para acomodar o swap",
                "O slippage é alto — o preço efetivo diverge muito do preço spot",
                "A transação é automaticamente cancelada",
              ],
              correctIndex: 2,
            },
          },
          {
            id: "df-l5",
            title: "Integrando com Jupiter",
            slug: "integrando-jupiter",
            type: "content",
            durationMinutes: 30,
            xpReward: 60,
            content: `# Integrando com Jupiter

**Jupiter** é o principal agregador de swap do Solana. Ele encontra a melhor rota entre dezenas de DEXs para obter o melhor preço.

## Por que usar Jupiter?

Em vez de integrar individualmente com Raydium, Orca, Meteora, etc., o Jupiter:

- **Agrega rotas** de 20+ DEXs
- Encontra o **melhor preço** automaticamente
- Suporta **split routes** (divide o swap entre múltiplos pools)
- Lida com **intermediate tokens** (ex: SOL → mSOL → USDC)

## Jupiter API v6

### 1. Obter Cotação (Quote)

\`\`\`typescript
const quoteUrl = 'https://quote-api.jup.ag/v6/quote';
const params = new URLSearchParams({
  inputMint: 'So11111111111111111111111111111111111111112', // SOL
  outputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
  amount: '1000000000', // 1 SOL em lamports
  slippageBps: '50',    // 0.5% slippage
});

const quoteResponse = await fetch(\`\${quoteUrl}?\${params}\`);
const quote = await quoteResponse.json();

console.log('Melhor rota:', quote.routePlan);
console.log('Output estimado:', quote.outAmount);
\`\`\`

### 2. Obter Transação para Assinar

\`\`\`typescript
const swapUrl = 'https://quote-api.jup.ag/v6/swap';
const swapResponse = await fetch(swapUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    quoteResponse: quote,
    userPublicKey: wallet.publicKey.toBase58(),
    wrapAndUnwrapSol: true,
  }),
});

const { swapTransaction } = await swapResponse.json();
\`\`\`

### 3. Assinar e Enviar

\`\`\`typescript
import { VersionedTransaction } from '@solana/web3.js';

const txBuf = Buffer.from(swapTransaction, 'base64');
const transaction = VersionedTransaction.deserialize(txBuf);

// Assinar com a wallet
transaction.sign([wallet]);

// Enviar
const txId = await connection.sendRawTransaction(
  transaction.serialize()
);
await connection.confirmTransaction(txId);
console.log('Swap executado:', txId);
\`\`\`

## Jupiter SDK (@jup-ag/api)

Para facilitar a integração, existe o SDK oficial:

\`\`\`typescript
import { createJupiterApiClient } from '@jup-ag/api';

const jupiter = createJupiterApiClient();

// Quote
const quote = await jupiter.quoteGet({
  inputMint: 'So11111111111111111111111111111111111111112',
  outputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  amount: 1_000_000_000,
  slippageBps: 50,
});

// Swap
const swap = await jupiter.swapPost({
  swapRequest: {
    quoteResponse: quote,
    userPublicKey: wallet.publicKey.toBase58(),
  },
});
\`\`\`

## Dicas de Integração

- Sempre use **slippage tolerance** (50-100 bps é razoável)
- Verifique **priceImpactPct** na resposta do quote
- Use **wrapAndUnwrapSol: true** para lidar com wrapped SOL automaticamente
- Jupiter suporta **DCA** (Dollar Cost Average) e **Limit Orders** também`,
            exercise: {
              question:
                "Qual é a principal vantagem de usar o Jupiter em vez de integrar diretamente com uma DEX específica?",
              options: [
                "Jupiter cobra taxas mais baixas que outras DEXs",
                "Jupiter agrega rotas de múltiplos DEXs para encontrar o melhor preço",
                "Jupiter permite criar novos tokens automaticamente",
                "Jupiter funciona apenas na mainnet, garantindo segurança",
              ],
              correctIndex: 1,
            },
          },
        ],
      },
      {
        id: "m2-3",
        title: "Yield e Oráculos",
        lessons: [
          {
            id: "df-l6",
            title: "Yield farming e staking",
            slug: "yield-farming-staking",
            type: "content",
            durationMinutes: 30,
            xpReward: 60,
            content: `# Yield Farming e Staking

Aprenda como gerar rendimentos com seus ativos no ecossistema Solana DeFi.

## Staking de SOL

O staking é a forma mais simples de gerar yield: você delega SOL a um validador e recebe recompensas.

### Staking Nativo

\`\`\`bash
# Criar stake account e delegar
solana create-stake-account stake-keypair.json 100  # 100 SOL
solana delegate-stake stake-keypair.json <VALIDATOR_VOTE_PUBKEY>

# Verificar status
solana stake-account stake-keypair.json
\`\`\`

- **APY**: ~6-8% ao ano
- **Lockup**: precisa esperar 1 epoch (~2 dias) para deactivar
- **Risco**: mínimo (apenas risco do validador ter downtime)

## Liquid Staking

**Liquid staking** resolve o problema de lockup: você recebe um **token derivativo** que pode usar em DeFi enquanto ganha staking rewards.

### Principais Liquid Staking Tokens (LSTs)

| Token | Protocolo | Característica |
|---|---|---|
| mSOL | Marinade | Mais antigo, grande liquidez |
| jitoSOL | Jito | Inclui MEV rewards |
| bSOL | BlazeStake | Distribuição de stake descentralizada |
| hSOL | Helius | Staking via Helius validators |

### Como funciona

\`\`\`
1. Deposite 100 SOL no Marinade
2. Receba ~95.5 mSOL (taxa de câmbio cresce com rewards)
3. Use mSOL em DeFi (pool SOL/mSOL, colateral, etc.)
4. Quando quiser, troque mSOL → SOL (resgate)
\`\`\`

A taxa de câmbio mSOL/SOL **cresce continuamente** porque os rewards são acumulados no preço.

## Yield Farming

Yield farming combina múltiplas estratégias para maximizar retornos:

### 1. Fornecer Liquidez (LP)

\`\`\`
Depositar SOL + USDC em pool Raydium
→ Receber LP tokens
→ Ganhar fees de trading (~0.25% por swap)
→ APY depende do volume de trading
\`\`\`

### 2. Staking de LP tokens

\`\`\`
LP tokens do par SOL/USDC
→ Stake em farm do Raydium
→ Ganhar tokens RAY como recompensa
→ APR adicional sobre as fees
\`\`\`

### 3. Leveraged Farming

\`\`\`
Depositar colateral (ex: SOL)
→ Emprestar mais tokens (alavancagem)
→ Fornecer liquidez com valor ampliado
→ Maior yield, mas maior risco de liquidação
\`\`\`

## Calculando APY vs APR

\`\`\`
APR (Annual Percentage Rate) = rendimento simples
APY (Annual Percentage Yield) = com reinvestimento (compound)

APY = (1 + APR/n)^n - 1

Exemplo: APR de 20%, compound diário (n=365):
APY = (1 + 0.20/365)^365 - 1 = 22.13%
\`\`\`

## Riscos

- **Impermanent Loss**: variação de preço entre os tokens do par
- **Smart contract risk**: bugs podem drenar pools
- **Rendimentos insustentáveis**: APYs muito altos geralmente são temporários
- **Liquidação**: em farming alavancado`,
            exercise: {
              question:
                "Qual é a principal vantagem do liquid staking (como mSOL ou jitoSOL) em relação ao staking nativo de SOL?",
              options: [
                "O liquid staking oferece APY mais alto que o staking nativo",
                "O liquid staking não tem nenhum risco",
                "Você recebe um token derivativo que pode ser usado em DeFi enquanto continua ganhando staking rewards",
                "O liquid staking não precisa de validadores",
              ],
              correctIndex: 2,
            },
          },
          {
            id: "df-l7",
            title: "Oráculos de preço",
            slug: "oraculos-preco",
            type: "content",
            durationMinutes: 30,
            xpReward: 60,
            content: `# Oráculos de Preço

**Oráculos** são sistemas que trazem dados do mundo externo para a blockchain. Em DeFi, os oráculos de preço são fundamentais para lending, liquidações e derivativos.

## O Problema do Oráculo

Blockchains são **determinísticas** — não podem acessar dados externos nativamente. Como saber o preço do SOL em USD?

\`\`\`
Mundo real: SOL = $150 USD
                   ↓ como trazer?
Blockchain: precisa do preço para calcular colateral
\`\`\`

## Pyth Network

O **Pyth** é o oráculo dominante no Solana, com dados de **alta frequência** fornecidos por market makers e exchanges.

### Características

- **Atualização**: a cada ~400ms (a cada slot!)
- **Fontes**: 90+ provedores de dados (exchanges, market makers)
- **Intervalo de confiança**: cada preço vem com uma faixa de confiança
- **Cross-chain**: disponível em 30+ chains

### Integrando com Pyth

\`\`\`typescript
import { PythSolanaReceiver } from '@pythnetwork/pyth-solana-receiver';

// Feed ID do SOL/USD
const SOL_USD_FEED = '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d';

// Obter preço
const priceUpdate = await pythSolanaReceiver.fetchPriceUpdate([SOL_USD_FEED]);

// Ler preço on-chain em um programa
const price = priceUpdate.price; // ex: 15000000000 (com exponent -8)
const expo = priceUpdate.exponent; // -8
const priceUSD = price * 10 ** expo; // 150.00
\`\`\`

### Usando em Anchor

\`\`\`rust
use pyth_solana_receiver_sdk::price_update::PriceUpdateV2;

#[derive(Accounts)]
pub struct CheckPrice<'info> {
    pub price_update: Account<'info, PriceUpdateV2>,
}

pub fn check_price(ctx: Context<CheckPrice>) -> Result<()> {
    let price_update = &ctx.accounts.price_update;
    let price = price_update.get_price_no_older_than(
        &Clock::get()?,
        60, // max age em segundos
        &SOL_USD_FEED_ID,
    )?;
    msg!("SOL price: {} x 10^{}", price.price, price.exponent);
    Ok(())
}
\`\`\`

## Switchboard

**Switchboard** é outro oráculo popular, mais configurável:

- Suporta **dados customizados** (não apenas preços)
- **Verifiable Random Function (VRF)** para aleatoriedade on-chain
- Oracle queues configuráveis

### Casos de Uso

\`\`\`
Switchboard:
├── Preços de ativos
├── Dados climáticos
├── Resultados esportivos
├── Números aleatórios (VRF)
└── Qualquer dado off-chain
\`\`\`

## Segurança com Oráculos

Boas práticas ao usar oráculos:

1. **Verificar staleness**: rejeitar preços muito antigos
2. **Usar intervalo de confiança**: Pyth fornece \`confidence\` junto ao preço
3. **Múltiplas fontes**: combinar Pyth + Switchboard se possível
4. **TWAP**: usar preço médio ponderado por tempo para reduzir manipulação

\`\`\`rust
// Verificar que o preço não está stale
require!(
    price.publish_time > clock.unix_timestamp - MAX_STALENESS,
    ErrorCode::StalePriceFeed
);

// Verificar confiança (confidence deve ser < 1% do preço)
require!(
    price.confidence < price.price.unsigned_abs() / 100,
    ErrorCode::PriceConfidenceTooWide
);
\`\`\``,
            exercise: {
              question:
                'Por que é importante verificar o "staleness" (idade) de um preço de oráculo em um protocolo DeFi?',
              options: [
                "Para garantir que o oráculo está cobrando as taxas corretas",
                "Para evitar usar preços desatualizados que podem causar liquidações incorretas ou manipulação",
                "Para verificar se o oráculo é do Pyth ou Switchboard",
                "Para calcular o gas cost da transação corretamente",
              ],
              correctIndex: 1,
            },
          },
        ],
      },
      {
        id: "m2-4",
        title: "Projeto Prático",
        lessons: [
          {
            id: "df-l8",
            title: "Construindo um vault DeFi",
            slug: "vault-defi",
            type: "challenge",
            durationMinutes: 45,
            xpReward: 80,
            content: `# Construindo um Vault DeFi

Vamos construir um **vault simples** em Anchor — um programa que aceita depósitos de SOL e permite saques pelo proprietário.

## O que é um Vault?

Um vault é um smart contract que:

1. **Aceita depósitos** de tokens de múltiplos usuários
2. **Rastreia saldos** individuais
3. **Permite saques** apenas pelo depositante original
4. Opcionalmente: aplica **estratégias de yield** sobre os depósitos

## Arquitetura

\`\`\`
VaultState (PDA)
├── authority: Pubkey       // admin do vault
├── total_deposits: u64     // total depositado
└── bump: u8               // PDA bump

UserDeposit (PDA por usuário)
├── user: Pubkey
├── amount: u64
└── deposited_at: i64
\`\`\`

## Instruções do Programa

### 1. Initialize — criar o vault
### 2. Deposit — depositar SOL no vault
### 3. Withdraw — sacar SOL do vault

## Conceitos Aplicados

- **PDAs**: para o vault state e depósitos por usuário
- **CPI**: transferência de SOL via System Program
- **Seeds**: derivação de contas determinísticas
- **Constraints**: validação de autoridade e saldos

## Desafio

Complete o programa Anchor no editor ao lado. Você precisa:

1. Definir as structs \`VaultState\` e \`UserDeposit\`
2. Implementar a instrução \`deposit\`
3. Implementar a instrução \`withdraw\` com validação de saldo`,
            exercise: {
              question:
                "Em um vault DeFi no Solana, qual é a melhor forma de armazenar o saldo individual de cada usuário?",
              options: [
                "Em uma variável global no programa",
                "Em um PDA derivado das seeds do programa e do endereço do usuário",
                "No campo data da wallet do usuário",
                "Em um arquivo JSON off-chain",
              ],
              correctIndex: 1,
            },
            challenge: {
              prompt:
                "Complete o programa Anchor para um vault que aceita depósitos e saques de SOL, rastreando saldos por usuário via PDAs.",
              starterCode: `use anchor_lang::prelude::*;
use anchor_lang::system_program;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod vault {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let vault = &mut ctx.accounts.vault_state;
        vault.authority = ctx.accounts.authority.key();
        vault.total_deposits = 0;
        vault.bump = ctx.bumps.vault_state;
        Ok(())
    }

    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        // TODO: Transfer SOL from user to vault PDA
        // Use system_program::transfer(...)

        // TODO: Update user deposit amount

        // TODO: Update vault total deposits

        Ok(())
    }

    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        // TODO: Verify user has enough balance

        // TODO: Transfer SOL from vault PDA back to user
        // (hint: PDA needs to sign via seeds)

        // TODO: Update user deposit and vault total

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init,
        payer = authority,
        space = 8 + VaultState::INIT_SPACE,
        seeds = [b"vault"],
        bump
    )]
    pub vault_state: Account<'info, VaultState>,
    pub system_program: Program<'info, System>,
}

// TODO: Define Deposit accounts struct

// TODO: Define Withdraw accounts struct

#[account]
#[derive(InitSpace)]
pub struct VaultState {
    pub authority: Pubkey,
    pub total_deposits: u64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct UserDeposit {
    pub user: Pubkey,
    pub amount: u64,
    pub deposited_at: i64,
}`,
              language: "rust",
              testCases: [
                {
                  input: "initialize",
                  expected:
                    "VaultState created with authority and zero deposits",
                },
                {
                  input: "deposit 1000000000",
                  expected:
                    "User deposit of 1 SOL recorded, vault total updated",
                },
                {
                  input: "withdraw 500000000",
                  expected: "User withdrawal of 0.5 SOL, balances updated",
                },
              ],
            },
          },
        ],
      },
    ],
  },
  {
    id: "3",
    slug: "fullstack-dapp",
    title: "Full Stack dApp",
    description:
      "Do programa Anchor ao frontend React com wallet adapter, testes e deploy na mainnet.",
    longDescription:
      "Curso avançado completo para construir uma dApp full-stack no Solana. Aprenda Anchor do zero, escreva testes, construa o frontend com React e wallet adapter, e faça deploy em produção.",
    difficulty: "advanced",
    duration: "long",
    totalDurationMinutes: 275,
    xpTotal: 820,
    thumbnail: "/courses/fullstack-dapp.png",
    instructor: {
      name: "Ana Silva",
      avatar: "https://i.pravatar.cc/400?img=22",
      role: "Instrutora · Rust & Solana",
    },
    instructorSlug: "ana-silva",
    track: "Full Stack",
    modules: [
      {
        id: "m3-1",
        title: "Anchor Framework",
        lessons: [
          {
            id: "fs-l1",
            title: "Setup do ambiente",
            slug: "setup-ambiente",
            type: "content",
            durationMinutes: 25,
            xpReward: 80,
            content: `# Setup do Ambiente

Antes de construir dApps no Solana, precisamos configurar nosso ambiente de desenvolvimento completo.

## Pré-requisitos

### 1. Rust

\`\`\`bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env

# Verificar
rustc --version
cargo --version
\`\`\`

### 2. Solana CLI

\`\`\`bash
sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"

# Configurar devnet
solana config set -u devnet
solana-keygen new  # gerar keypair se não tiver
solana airdrop 5   # SOL para testes
\`\`\`

### 3. Node.js e Yarn

\`\`\`bash
# Node.js 18+
node --version  # v18.x ou superior

# Yarn
npm install -g yarn
\`\`\`

### 4. Anchor CLI

\`\`\`bash
# Instalar via cargo
cargo install --git https://github.com/coral-xyz/anchor avm --force
avm install latest
avm use latest

# Verificar
anchor --version
\`\`\`

## Criando um Projeto Anchor

\`\`\`bash
anchor init minha-dapp
cd minha-dapp
\`\`\`

## Estrutura do Projeto

\`\`\`
minha-dapp/
├── Anchor.toml          # Configuração do Anchor
├── Cargo.toml           # Workspace Rust
├── programs/
│   └── minha-dapp/
│       ├── Cargo.toml   # Dependências do programa
│       └── src/
│           └── lib.rs   # Código do programa
├── tests/
│   └── minha-dapp.ts    # Testes em TypeScript
├── app/                 # Frontend (opcional)
├── migrations/
│   └── deploy.ts        # Script de deploy
└── target/              # Build artifacts
\`\`\`

## Anchor.toml

\`\`\`toml
[features]
seeds = false
skip-lint = false

[programs.devnet]
minha_dapp = "Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS"

[registry]
url = "https://api.apr.dev"

[provider]
cluster = "devnet"
wallet = "~/.config/solana/id.json"

[scripts]
test = "yarn run ts-mocha -p ./tsconfig.json -t 1000000 tests/**/*.ts"
\`\`\`

## Compilando e Testando

\`\`\`bash
# Build
anchor build

# Ver program ID gerado
solana address -k target/deploy/minha_dapp-keypair.json

# Rodar testes
anchor test
\`\`\`

## IDL (Interface Definition Language)

Após o build, o Anchor gera um **IDL** em \`target/idl/minha_dapp.json\` — a interface que o frontend usa para interagir com o programa.`,
            exercise: {
              question:
                "Qual arquivo define a interface (IDL) que o frontend usa para interagir com um programa Anchor?",
              options: [
                "Anchor.toml",
                "programs/src/lib.rs",
                "target/idl/<nome_programa>.json",
                "tests/<nome_programa>.ts",
              ],
              correctIndex: 2,
            },
          },
          {
            id: "fs-l2",
            title: "Anchor: declarar programa e accounts",
            slug: "anchor-programa-accounts",
            type: "content",
            durationMinutes: 35,
            xpReward: 100,
            content: `# Anchor: Declarar Programa e Accounts

O **Anchor** é o framework mais popular para desenvolvimento de programas Solana. Ele abstrai a complexidade do Solana usando macros Rust.

## Estrutura Básica de um Programa

\`\`\`rust
use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod meu_programa {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, data: u64) -> Result<()> {
        let minha_conta = &mut ctx.accounts.minha_conta;
        minha_conta.data = data;
        minha_conta.authority = ctx.accounts.authority.key();
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init,
        payer = authority,
        space = 8 + MinhaConta::INIT_SPACE,
    )]
    pub minha_conta: Account<'info, MinhaConta>,
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct MinhaConta {
    pub data: u64,
    pub authority: Pubkey,
}
\`\`\`

## \`#[program]\` — O Módulo Principal

- Define o **entrypoint** do programa
- Cada função pública é uma **instrução**
- Recebe \`Context<T>\` como primeiro parâmetro
- Parâmetros adicionais são os **instruction data**

## \`#[derive(Accounts)]\` — Validação de Contas

O macro mais poderoso do Anchor. Define quais contas a instrução espera e como validá-las:

### Tipos de Conta

| Tipo | Uso |
|---|---|
| \`Account<'info, T>\` | Conta tipada, desserializada automaticamente |
| \`Signer<'info>\` | Conta que deve assinar a transação |
| \`Program<'info, T>\` | Referência a um programa (ex: System) |
| \`SystemAccount<'info>\` | Conta do sistema (wallet) |
| \`UncheckedAccount<'info>\` | Conta sem verificação (use com cuidado) |

### Constraints Comuns

\`\`\`rust
#[derive(Accounts)]
pub struct Update<'info> {
    // Deve assinar a transação
    pub authority: Signer<'info>,

    // Inicializa nova conta, paga por authority
    #[account(
        init,
        payer = authority,
        space = 8 + MinhaConta::INIT_SPACE,
    )]
    pub nova_conta: Account<'info, MinhaConta>,

    // Conta mutável existente
    #[account(mut)]
    pub conta_existente: Account<'info, MinhaConta>,

    // Conta com PDA (seeds + bump)
    #[account(
        seeds = [b"config", authority.key().as_ref()],
        bump,
    )]
    pub config: Account<'info, ConfigConta>,

    pub system_program: Program<'info, System>,
}
\`\`\`

## \`#[account]\` — Definição de Dados

\`\`\`rust
#[account]
#[derive(InitSpace)]
pub struct MinhaConta {
    pub authority: Pubkey,   // 32 bytes
    pub counter: u64,        // 8 bytes
    pub is_active: bool,     // 1 byte
    #[max_len(50)]
    pub name: String,        // 4 + 50 bytes
}
\`\`\`

### Cálculo de Space

- **Discriminator**: 8 bytes (hash da conta, adicionado automaticamente)
- **Pubkey**: 32 bytes
- **u64/i64**: 8 bytes
- **u32/i32**: 4 bytes
- **bool**: 1 byte
- **String**: 4 (length) + max_len bytes
- **Vec<T>**: 4 (length) + max_len * sizeof(T)
- **Option<T>**: 1 + sizeof(T)

\`\`\`rust
// Space total = 8 (disc) + 32 (Pubkey) + 8 (u64) + 1 (bool) + 4+50 (String)
space = 8 + 32 + 8 + 1 + 54 = 103
// Ou use InitSpace para calcular automaticamente!
space = 8 + MinhaConta::INIT_SPACE
\`\`\`

## Init com PDA

\`\`\`rust
#[account(
    init,
    payer = authority,
    space = 8 + MinhaConta::INIT_SPACE,
    seeds = [b"user-data", authority.key().as_ref()],
    bump,
)]
pub user_data: Account<'info, MinhaConta>,
\`\`\`

O Anchor automaticamente:
1. Deriva o PDA com as seeds
2. Cria a conta via System Program CPI
3. Atribui o owner ao seu programa`,
            exercise: {
              question:
                "No Anchor, para que serve o atributo #[account(init, payer = authority, space = ...)] em uma struct de Accounts?",
              options: [
                "Para ler dados de uma conta existente",
                "Para transferir tokens entre contas",
                "Para criar e inicializar uma nova conta, definindo quem paga o rent e o tamanho alocado",
                "Para deletar uma conta existente",
              ],
              correctIndex: 2,
            },
          },
          {
            id: "fs-l3",
            title: "Anchor: instruções e validação",
            slug: "anchor-instrucoes-validacao",
            type: "content",
            durationMinutes: 35,
            xpReward: 100,
            content: `# Anchor: Instruções e Validação

Aprenda a escrever instruções robustas com validação de dados e tratamento de erros no Anchor.

## Custom Errors

Defina erros específicos do seu programa:

\`\`\`rust
#[error_code]
pub enum ErrorCode {
    #[msg("O counter já atingiu o valor máximo")]
    MaxCounterReached,
    #[msg("Apenas a authority pode executar esta ação")]
    Unauthorized,
    #[msg("Valor inválido: deve ser maior que zero")]
    InvalidValue,
    #[msg("Conta já foi inicializada")]
    AlreadyInitialized,
}
\`\`\`

### Usando Erros

\`\`\`rust
pub fn increment(ctx: Context<Increment>) -> Result<()> {
    let counter = &mut ctx.accounts.counter;

    require!(counter.count < 1000, ErrorCode::MaxCounterReached);

    counter.count += 1;
    Ok(())
}
\`\`\`

## Constraint: \`has_one\`

Verifica que um campo da conta é igual a outra conta passada:

\`\`\`rust
#[derive(Accounts)]
pub struct Update<'info> {
    pub authority: Signer<'info>,

    // Verifica que counter.authority == authority.key()
    #[account(
        mut,
        has_one = authority @ ErrorCode::Unauthorized,
    )]
    pub counter: Account<'info, Counter>,
}
\`\`\`

Equivale a:
\`\`\`rust
require_keys_eq!(counter.authority, authority.key(), ErrorCode::Unauthorized);
\`\`\`

## Constraint: \`seeds\` e \`bump\`

Para validar e derivar PDAs:

\`\`\`rust
#[derive(Accounts)]
pub struct ReadConfig<'info> {
    pub user: Signer<'info>,

    // Valida que config é o PDA correto para este user
    #[account(
        seeds = [b"config", user.key().as_ref()],
        bump = config.bump,
    )]
    pub config: Account<'info, UserConfig>,
}
\`\`\`

### Seeds Dinâmicos

\`\`\`rust
#[derive(Accounts)]
#[instruction(game_id: u64)]
pub struct JoinGame<'info> {
    pub player: Signer<'info>,

    #[account(
        seeds = [b"game", game_id.to_le_bytes().as_ref()],
        bump = game.bump,
    )]
    pub game: Account<'info, Game>,

    #[account(
        init,
        payer = player,
        space = 8 + PlayerState::INIT_SPACE,
        seeds = [b"player", game.key().as_ref(), player.key().as_ref()],
        bump,
    )]
    pub player_state: Account<'info, PlayerState>,

    pub system_program: Program<'info, System>,
}
\`\`\`

## Constraint: \`constraint\`

Validações customizadas arbitrárias:

\`\`\`rust
#[account(
    mut,
    constraint = vault.amount >= withdrawal_amount @ ErrorCode::InsufficientFunds,
    constraint = vault.is_active @ ErrorCode::VaultInactive,
)]
pub vault: Account<'info, Vault>,
\`\`\`

## Constraint: \`close\`

Fechar uma conta e devolver o rent:

\`\`\`rust
#[derive(Accounts)]
pub struct CloseAccount<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    // Fecha a conta e envia lamports para authority
    #[account(
        mut,
        close = authority,
        has_one = authority,
    )]
    pub minha_conta: Account<'info, MinhaConta>,
}
\`\`\`

## Constraint: \`realloc\`

Redimensionar uma conta (aumentar ou diminuir dados):

\`\`\`rust
#[account(
    mut,
    realloc = 8 + 32 + 4 + new_name.len(),
    realloc::payer = authority,
    realloc::zero = false,
)]
pub profile: Account<'info, Profile>,
\`\`\`

## Padrão Completo

\`\`\`rust
#[program]
pub mod meu_app {
    use super::*;

    pub fn create_post(ctx: Context<CreatePost>, title: String, body: String) -> Result<()> {
        require!(title.len() <= 100, ErrorCode::TitleTooLong);
        require!(!body.is_empty(), ErrorCode::EmptyBody);

        let post = &mut ctx.accounts.post;
        post.author = ctx.accounts.author.key();
        post.title = title;
        post.body = body;
        post.created_at = Clock::get()?.unix_timestamp;
        post.bump = ctx.bumps.post;
        Ok(())
    }
}
\`\`\``,
            exercise: {
              question:
                'No Anchor, o que o constraint "has_one = authority" verifica em uma conta?',
              options: [
                "Que a conta foi criada pelo System Program",
                'Que o campo "authority" da conta é igual à key da conta "authority" passada na instrução',
                "Que a conta possui saldo suficiente em lamports",
                "Que a conta é um PDA válido",
              ],
              correctIndex: 1,
            },
          },
          {
            id: "fs-l4",
            title: "Testes com Anchor",
            slug: "testes-anchor",
            type: "content",
            durationMinutes: 35,
            xpReward: 100,
            content: `# Testes com Anchor

Testes são **essenciais** no desenvolvimento Solana. O Anchor facilita com integração TypeScript e simulação local.

## anchor test

O comando \`anchor test\` faz tudo automaticamente:

1. Compila o programa (\`anchor build\`)
2. Inicia um validador local (\`solana-test-validator\`)
3. Faz deploy do programa
4. Executa os testes TypeScript
5. Encerra o validador

\`\`\`bash
anchor test
# Ou, se o validador já está rodando:
anchor test --skip-local-validator
\`\`\`

## Estrutura de um Teste

\`\`\`typescript
import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { MeuPrograma } from '../target/types/meu_programa';
import { expect } from 'chai';

describe('meu-programa', () => {
  // Configurar provider
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.MeuPrograma as Program<MeuPrograma>;
  const authority = provider.wallet;

  it('Inicializa o counter', async () => {
    // Derivar PDA
    const [counterPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from('counter'), authority.publicKey.toBuffer()],
      program.programId
    );

    // Executar instrução
    const tx = await program.methods
      .initialize()
      .accounts({
        authority: authority.publicKey,
        counter: counterPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log('TX:', tx);

    // Verificar estado
    const counterAccount = await program.account.counter.fetch(counterPda);
    expect(counterAccount.count.toNumber()).to.equal(0);
    expect(counterAccount.authority.toBase58()).to.equal(
      authority.publicKey.toBase58()
    );
  });

  it('Incrementa o counter', async () => {
    const [counterPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from('counter'), authority.publicKey.toBuffer()],
      program.programId
    );

    await program.methods
      .increment()
      .accounts({
        authority: authority.publicKey,
        counter: counterPda,
      })
      .rpc();

    const counterAccount = await program.account.counter.fetch(counterPda);
    expect(counterAccount.count.toNumber()).to.equal(1);
  });

  it('Falha ao incrementar com authority errada', async () => {
    const fakeUser = anchor.web3.Keypair.generate();

    // Airdrop SOL para o fake user
    const airdropSig = await provider.connection.requestAirdrop(
      fakeUser.publicKey, 1e9
    );
    await provider.connection.confirmTransaction(airdropSig);

    const [counterPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from('counter'), authority.publicKey.toBuffer()],
      program.programId
    );

    try {
      await program.methods
        .increment()
        .accounts({
          authority: fakeUser.publicKey,
          counter: counterPda,
        })
        .signers([fakeUser])
        .rpc();
      expect.fail('Deveria ter falhado');
    } catch (err) {
      expect(err.error.errorCode.code).to.equal('Unauthorized');
    }
  });
});
\`\`\`

## Bankrun — Testes Rápidos

**Bankrun** (\`solana-bankrun\`) é uma alternativa mais rápida ao validador local:

\`\`\`typescript
import { startAnchor } from 'solana-bankrun';
import { BankrunProvider } from 'anchor-bankrun';

const context = await startAnchor('.', [], []);
const provider = new BankrunProvider(context);
anchor.setProvider(provider);
\`\`\`

Vantagens do Bankrun:
- **10-100x mais rápido** que solana-test-validator
- Sem necessidade de rodar validador
- Controle total sobre o estado (time travel, set accounts)
- Ideal para **testes de integração**

## Dicas para Bons Testes

1. **Teste happy paths e error paths** — verifique que erros são lançados corretamente
2. **Use PDAs derivados** — não use contas aleatórias
3. **Verifique estado final** — fetch accounts e compare valores
4. **Teste permissões** — verifique que usuarios não autorizados são rejeitados
5. **Teste edge cases** — valores zero, overflow, contas duplicadas

## Debugging

\`\`\`rust
// No programa — logs aparecem nos testes
msg!("Counter value: {}", counter.count);

// Em TypeScript — ver logs da transação
const tx = await program.methods.increment().accounts({...}).rpc();
const txDetails = await provider.connection.getTransaction(tx);
console.log(txDetails.meta.logMessages);
\`\`\``,
            exercise: {
              question:
                "Qual é a principal vantagem do Bankrun (solana-bankrun) em relação ao solana-test-validator para testes?",
              options: [
                "Bankrun suporta deploy na mainnet",
                "Bankrun é 10-100x mais rápido pois não precisa rodar um validador completo",
                "Bankrun permite testes apenas em Rust",
                "Bankrun é o único que suporta programas Anchor",
              ],
              correctIndex: 1,
            },
          },
        ],
      },
      {
        id: "m3-2",
        title: "Frontend",
        lessons: [
          {
            id: "fs-l5",
            title: "Frontend com React e wallet adapter",
            slug: "frontend-react-wallet",
            type: "content",
            durationMinutes: 35,
            xpReward: 100,
            content: `# Frontend com React e Wallet Adapter

Conecte seu programa Solana a um frontend React usando o **Solana Wallet Adapter**.

## Instalação

\`\`\`bash
npm install @solana/web3.js @solana/wallet-adapter-react \\
  @solana/wallet-adapter-react-ui @solana/wallet-adapter-wallets \\
  @solana/wallet-adapter-base
\`\`\`

## Setup do Provider

\`\`\`tsx
// src/providers/WalletProvider.tsx
import { FC, ReactNode, useMemo } from 'react';
import {
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';

import '@solana/wallet-adapter-react-ui/styles.css';

export const AppWalletProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const endpoint = useMemo(() => clusterApiUrl('devnet'), []);
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};
\`\`\`

## Botão de Conectar Wallet

\`\`\`tsx
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export function Navbar() {
  return (
    <nav>
      <h1>Minha dApp</h1>
      <WalletMultiButton />
    </nav>
  );
}
\`\`\`

O \`WalletMultiButton\` automaticamente:
- Mostra modal com wallets disponíveis
- Conecta/desconecta
- Exibe endereço truncado quando conectado

## Hooks Úteis

\`\`\`tsx
import { useConnection, useWallet } from '@solana/wallet-adapter-react';

function MeuComponente() {
  const { connection } = useConnection();
  const { publicKey, signTransaction, connected } = useWallet();

  if (!connected) {
    return <p>Conecte sua wallet para continuar</p>;
  }

  return <p>Conectado: {publicKey?.toBase58()}</p>;
}
\`\`\`

### useConnection

- \`connection\`: instância do \`Connection\` para fazer RPC calls

### useWallet

- \`publicKey\`: chave pública do usuário conectado
- \`connected\`: boolean se está conectado
- \`signTransaction\`: função para assinar transações
- \`signAllTransactions\`: assinar múltiplas transações
- \`sendTransaction\`: assinar e enviar
- \`disconnect\`: desconectar wallet

## Enviando uma Transação

\`\`\`tsx
import { Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';

function SendSOL() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();

  const handleSend = async () => {
    if (!publicKey) return;

    const tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: publicKey,
        toPubkey: new PublicKey('DESTINO...'),
        lamports: 0.1 * LAMPORTS_PER_SOL,
      })
    );

    const signature = await sendTransaction(tx, connection);
    await connection.confirmTransaction(signature, 'confirmed');
    alert('Enviado! ' + signature);
  };

  return <button onClick={handleSend}>Enviar 0.1 SOL</button>;
}
\`\`\`

## Verificando Saldo

\`\`\`tsx
import { useEffect, useState } from 'react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

function Balance() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [balance, setBalance] = useState<number>(0);

  useEffect(() => {
    if (!publicKey) return;
    connection.getBalance(publicKey).then((bal) => {
      setBalance(bal / LAMPORTS_PER_SOL);
    });
  }, [publicKey, connection]);

  return <p>Saldo: {balance.toFixed(4)} SOL</p>;
}
\`\`\``,
            exercise: {
              question:
                "Qual hook do @solana/wallet-adapter-react fornece acesso ao publicKey do usuário conectado?",
              options: ["useConnection", "useWallet", "useAnchor", "useSolana"],
              correctIndex: 1,
            },
          },
          {
            id: "fs-l6",
            title: "Interação frontend <-> programa",
            slug: "frontend-programa",
            type: "content",
            durationMinutes: 35,
            xpReward: 100,
            content: `# Interação Frontend <-> Programa

Aprenda a usar o **IDL** gerado pelo Anchor para interagir com seu programa diretamente do frontend React.

## O que é o IDL?

O **IDL** (Interface Definition Language) é um JSON que descreve seu programa:

- Instruções disponíveis
- Contas esperadas por cada instrução
- Tipos de dados (structs, enums)
- Erros customizados

\`\`\`json
{
  "version": "0.1.0",
  "name": "counter",
  "instructions": [
    {
      "name": "initialize",
      "accounts": [
        { "name": "authority", "isMut": true, "isSigner": true },
        { "name": "counter", "isMut": true, "isSigner": false }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "Counter",
      "type": {
        "kind": "struct",
        "fields": [
          { "name": "count", "type": "u64" },
          { "name": "authority", "type": "publicKey" }
        ]
      }
    }
  ]
}
\`\`\`

## Configurando o Program Client

\`\`\`typescript
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import idl from '../target/idl/counter.json';
import type { Counter } from '../target/types/counter';

function useProgram() {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  if (!wallet) return null;

  const provider = new AnchorProvider(connection, wallet, {
    commitment: 'confirmed',
  });

  return new Program<Counter>(
    idl as Counter,
    provider
  );
}
\`\`\`

## Lendo Dados (Fetch Accounts)

\`\`\`typescript
function CounterDisplay() {
  const program = useProgram();
  const { publicKey } = useWallet();
  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    if (!program || !publicKey) return;

    const [counterPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('counter'), publicKey.toBuffer()],
      program.programId
    );

    // Fetch a conta tipada
    program.account.counter.fetch(counterPda)
      .then((account) => {
        setCount(account.count.toNumber());
      })
      .catch(console.error);
  }, [program, publicKey]);

  return <h2>Counter: {count}</h2>;
}
\`\`\`

## Enviando Instruções

\`\`\`typescript
function IncrementButton() {
  const program = useProgram();
  const { publicKey } = useWallet();
  const [loading, setLoading] = useState(false);

  const handleIncrement = async () => {
    if (!program || !publicKey) return;

    setLoading(true);
    try {
      const [counterPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('counter'), publicKey.toBuffer()],
        program.programId
      );

      const tx = await program.methods
        .increment()
        .accounts({
          authority: publicKey,
          counter: counterPda,
        })
        .rpc();

      console.log('TX confirmada:', tx);
    } catch (err) {
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleIncrement} disabled={loading}>
      {loading ? 'Enviando...' : 'Incrementar'}
    </button>
  );
}
\`\`\`

## Listening to Account Changes

\`\`\`typescript
useEffect(() => {
  if (!program || !publicKey) return;

  const [counterPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('counter'), publicKey.toBuffer()],
    program.programId
  );

  // Subscribe para mudanças em tempo real
  const subscriptionId = program.account.counter.subscribe(counterPda)
    .on('change', (account) => {
      setCount(account.count.toNumber());
    });

  return () => {
    // Cleanup
    program.account.counter.unsubscribe(subscriptionId);
  };
}, [program, publicKey]);
\`\`\`

## Tratamento de Erros

\`\`\`typescript
import { AnchorError } from '@coral-xyz/anchor';

try {
  await program.methods.increment().accounts({...}).rpc();
} catch (err) {
  if (err instanceof AnchorError) {
    console.log('Erro do programa:', err.error.errorMessage);
    console.log('Código:', err.error.errorCode.code);
    // Ex: "O counter já atingiu o valor máximo"
  } else {
    console.log('Erro de rede:', err);
  }
}
\`\`\``,
            exercise: {
              question:
                "Como o frontend React sabe quais instruções e contas um programa Anchor espera?",
              options: [
                "O frontend lê o código Rust diretamente",
                "Através do IDL (Interface Definition Language) gerado pelo Anchor no build",
                "O frontend precisa fazer uma chamada RPC ao programa para descobrir",
                "O desenvolvedor precisa reescrever as interfaces manualmente em TypeScript",
              ],
              correctIndex: 1,
            },
          },
        ],
      },
      {
        id: "m3-3",
        title: "Deploy e Projeto Final",
        lessons: [
          {
            id: "fs-l7",
            title: "Deploy na devnet e mainnet",
            slug: "deploy-devnet-mainnet",
            type: "content",
            durationMinutes: 30,
            xpReward: 90,
            content: `# Deploy na Devnet e Mainnet

Aprenda o processo completo de deploy de programas Solana, desde a devnet até a mainnet.

## Deploy na Devnet

### 1. Build

\`\`\`bash
anchor build
\`\`\`

### 2. Verificar Program ID

\`\`\`bash
# O program ID é derivado do keypair em target/deploy/
solana address -k target/deploy/meu_programa-keypair.json
# Ex: 7nE4RfQmH2tLm7gQxkV3Pq...
\`\`\`

Atualize o \`declare_id!\` no \`lib.rs\` e o \`Anchor.toml\` com este ID.

### 3. Deploy

\`\`\`bash
# Garantir que está na devnet
solana config set -u devnet

# Garantir que tem SOL
solana balance
solana airdrop 5  # se precisar

# Deploy
anchor deploy

# Ou especificando o cluster:
anchor deploy --provider.cluster devnet
\`\`\`

### 4. Verificar

\`\`\`bash
solana program show <PROGRAM_ID>
# Program Id: 7nE4RfQmH2tLm7gQxkV3Pq...
# Owner: BPFLoaderUpgradeab1e11111111111111111111111
# Data Length: 245760 (0x3c000) bytes
# Balance: 1.70981 SOL
# Authority: <SEU_WALLET>
# Last Deployed In Slot: 123456789
# Upgradeable
\`\`\`

## Deploy na Mainnet

### Checklist Pré-Mainnet

1. **Testes passando** — \`anchor test\` green
2. **Auditoria** — código revisado (idealmente por terceiros)
3. **Program authority** — decida quem controla upgrades
4. **IDL publicado** — para que explorers mostrem instruções legíveis

### Processo

\`\`\`bash
# Mudar para mainnet
solana config set -u mainnet-beta

# Verificar saldo (precisa de ~3 SOL para deploy)
solana balance

# Deploy
anchor deploy --provider.cluster mainnet

# Publicar IDL (opcional, para Anchor Explorer)
anchor idl init <PROGRAM_ID> --filepath target/idl/meu_programa.json
\`\`\`

## Program Upgrades

Programas Anchor são **upgradeable** por padrão:

\`\`\`bash
# Fazer alterações no código...
anchor build

# Deploy da atualização
anchor upgrade target/deploy/meu_programa.so --program-id <PROGRAM_ID>

# Ou via Anchor:
anchor deploy --program-id <PROGRAM_ID>
\`\`\`

### Segurança do Upgrade

A **upgrade authority** é a wallet que pode atualizar o programa:

\`\`\`bash
# Ver authority atual
solana program show <PROGRAM_ID>

# Transferir authority para multisig
solana program set-upgrade-authority <PROGRAM_ID> \\
  --new-upgrade-authority <MULTISIG_ADDRESS>

# Tornar imutável (IRREVERSÍVEL!)
solana program set-upgrade-authority <PROGRAM_ID> --final
\`\`\`

## Boas Práticas de Deploy

### 1. Multisig Authority
Use **Squads** para gerenciar upgrades via multisig:
- Múltiplas assinaturas necessárias para upgrade
- Timelock (período de espera antes de executar)
- Transparência para os usuários

### 2. Verificação de Programa
Use **Solana Verify** para provar que o código on-chain corresponde ao código fonte:

\`\`\`bash
solana-verify verify-from-repo \\
  --program-id <PROGRAM_ID> \\
  https://github.com/user/repo
\`\`\`

### 3. Buffer Accounts

Para deploys grandes, use buffer accounts:

\`\`\`bash
# Criar buffer
solana program write-buffer target/deploy/meu_programa.so

# Deploy do buffer
solana program deploy --buffer <BUFFER_ADDRESS>
\`\`\`

### 4. Custo de Deploy

| Cluster | Custo Estimado |
|---|---|
| Devnet | Gratuito (airdrop) |
| Mainnet | ~2-5 SOL (depende do tamanho do programa) |

O custo é proporcional ao **tamanho do bytecode** (rent-exempt para o program data account).`,
            exercise: {
              question:
                'O que acontece quando você executa "solana program set-upgrade-authority <ID> --final"?',
              options: [
                "O programa é deletado da blockchain",
                "A authority é transferida para o System Program",
                "O programa se torna imutável — ninguém mais pode atualizá-lo (irreversível)",
                "O programa é pausado temporariamente",
              ],
              correctIndex: 2,
            },
          },
          {
            id: "fs-l8",
            title: "Projeto final: dApp completa",
            slug: "projeto-final-dapp",
            type: "challenge",
            durationMinutes: 45,
            xpReward: 150,
            content: `# Projeto Final: dApp Completa

Chegou a hora de construir uma **dApp completa** do zero: programa Anchor + frontend React + wallet adapter. Vamos criar um **Counter dApp**.

## Visão Geral

A dApp que vamos construir:

- **Programa Anchor**: Counter com initialize, increment e decrement
- **Frontend React**: interface para interagir com o programa
- **Wallet Adapter**: conectar Phantom/Solflare
- **Deploy**: funcional na devnet

## Arquitetura

\`\`\`
┌─────────────────────────┐
│    Frontend (React)      │
│  ┌───────────────────┐  │
│  │  Wallet Adapter    │  │
│  │  (Phantom, etc.)   │  │
│  └────────┬──────────┘  │
│           │              │
│  ┌────────▼──────────┐  │
│  │  Program Client    │  │
│  │  (IDL + Anchor)    │  │
│  └────────┬──────────┘  │
└───────────┼──────────────┘
            │ RPC
┌───────────▼──────────────┐
│  Programa Solana (Anchor) │
│  ┌───────────────────┐   │
│  │  initialize()      │   │
│  │  increment()       │   │
│  │  decrement()       │   │
│  └───────────────────┘   │
│  ┌───────────────────┐   │
│  │  Counter (PDA)     │   │
│  │  - count: u64      │   │
│  │  - authority: Pk   │   │
│  │  - bump: u8        │   │
│  └───────────────────┘   │
└───────────────────────────┘
\`\`\`

## O que você precisa implementar

### Programa (Rust/Anchor)

1. **initialize**: criar PDA do counter com count=0
2. **increment**: somar 1 ao count (apenas authority)
3. **decrement**: subtrair 1 do count (apenas authority, mínimo 0)

### Frontend (React/TypeScript)

1. Botão de conectar wallet
2. Exibir valor atual do counter
3. Botões de increment e decrement
4. Estado de loading durante transações
5. Mensagens de erro amigáveis

## Desafio

No editor ao lado, complete o programa Anchor do Counter. O frontend será construído como extensão deste exercício.`,
            exercise: {
              question:
                "Qual é a sequência correta para construir e publicar uma dApp full-stack no Solana?",
              options: [
                "Frontend primeiro, depois o programa, depois testes",
                "Deploy na mainnet primeiro, depois testes, depois frontend",
                "Programa Anchor -> Testes -> Frontend com Wallet Adapter -> Deploy",
                "Testes primeiro, depois programa, depois frontend",
              ],
              correctIndex: 2,
            },
            challenge: {
              prompt:
                "Complete o programa Anchor de um Counter dApp com instruções initialize, increment e decrement. O counter deve usar PDA, ter controle de authority e não permitir decrement abaixo de 0.",
              starterCode: `use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod counter {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let counter = &mut ctx.accounts.counter;
        counter.count = 0;
        counter.authority = ctx.accounts.authority.key();
        counter.bump = ctx.bumps.counter;
        Ok(())
    }

    pub fn increment(ctx: Context<Update>) -> Result<()> {
        // TODO: Increment the counter by 1
        // Make sure to check for overflow

        Ok(())
    }

    pub fn decrement(ctx: Context<Update>) -> Result<()> {
        // TODO: Decrement the counter by 1
        // Make sure count doesn't go below 0

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    // TODO: Add the counter account with init, PDA seeds, payer, and space

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Update<'info> {
    // TODO: Add authority as Signer

    // TODO: Add counter account with mut, seeds, bump, and has_one = authority

}

#[account]
#[derive(InitSpace)]
pub struct Counter {
    pub count: u64,
    pub authority: Pubkey,
    pub bump: u8,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Counter overflow")]
    Overflow,
    #[msg("Counter cannot go below zero")]
    Underflow,
}`,
              language: "rust",
              testCases: [
                {
                  input: "initialize",
                  expected: "Counter PDA created with count=0",
                },
                { input: "increment", expected: "Counter incremented to 1" },
                {
                  input: "decrement from 1",
                  expected: "Counter decremented to 0",
                },
                {
                  input: "decrement from 0",
                  expected: "Error: Counter cannot go below zero",
                },
              ],
            },
          },
        ],
      },
    ],
  },
  course4,
  course5,
  course6,
  course7,
  course8,
  course9,
];

export function getCourseBySlug(slug: string): Course | undefined {
  return courses.find((c) => c.slug === slug);
}

export function getCoursesByInstructorSlug(instructorSlug: string): Course[] {
  return courses.filter((c) => c.instructorSlug === instructorSlug);
}

export function getLesson(
  courseSlug: string,
  lessonSlug: string,
): { course: Course; module: Module; lesson: Lesson } | null {
  const course = getCourseBySlug(courseSlug);
  if (!course) return null;
  for (const mod of course.modules) {
    const lesson = mod.lessons.find((l) => l.slug === lessonSlug);
    if (lesson) return { course, module: mod, lesson };
  }
  return null;
}

export function getDifficultyLabel(d: Difficulty): string {
  const map = {
    beginner: "Iniciante",
    intermediate: "Intermediário",
    advanced: "Avançado",
  };
  return map[d];
}

export function getDurationLabel(d: Duration): string {
  const map = { short: "< 2h", medium: "2-5h", long: "5h+" };
  return map[d];
}
