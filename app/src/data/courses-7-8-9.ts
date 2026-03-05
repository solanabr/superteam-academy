// Course 7: SPL Token avançado
// Course 8: AMM e liquidez
// Course 9: Anchor avançado
// Lesson IDs: l44 – l65

import type { Course } from "./courses";

export const course7: Course = {
  id: "7",
  slug: "spl-token-avancado",
  title: "SPL Token avançado",
  description:
    "Token-2022, extensões, transfer fees e tokens soulbound no Solana.",
  longDescription:
    "Domine as funcionalidades avançadas de tokens no Solana: entenda as diferenças entre SPL Token e Token-2022, configure transfer fees, crie tokens confidenciais e implemente extensões como interest-bearing e non-transferable.",
  difficulty: "intermediate",
  duration: "medium",
  totalDurationMinutes: 230,
  xpTotal: 470,
  thumbnail: "/courses/spl-token-avancado.png",
  instructor: {
    name: "Kuka",
    avatar: "/instructors/kuka.png",
    role: "Instrutor",
  },
  instructorSlug: "superteam-br",
  track: "DeFi",
  modules: [
    {
      id: "m7",
      title: "Token-2022 e Extensões",
      lessons: [
        {
          id: "l44",
          title: "SPL Token vs Token-2022",
          slug: "spl-vs-token2022",
          type: "content",
          durationMinutes: 25,
          xpReward: 50,
          content: `# SPL Token vs Token-2022

## Contexto histórico

O programa **SPL Token** original foi lançado em 2020 e se tornou o padrão para tokens fungíveis e não-fungíveis no Solana. Porém, sua arquitetura é limitada: cada nova funcionalidade exigiria um fork ou um programa wrapper.

Em 2022 a Solana Labs introduziu o **Token-2022** (também chamado Token Extensions), um novo programa que mantém **compatibilidade retroativa** com o SPL Token original e adiciona um sistema de **extensões modulares**.

## Diferenças principais

| Característica | SPL Token | Token-2022 |
|---|---|---|
| Program ID | \`TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA\` | \`TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb\` |
| Extensões | Não suporta | Suporta (transfer fee, confidential, etc.) |
| Compatibilidade | Padrão legado | Retrocompatível com SPL Token |
| Tamanho do Mint | 82 bytes fixo | Variável (82 + extensões) |

## Compatibilidade retroativa

O Token-2022 aceita as **mesmas instruções** do SPL Token original. Isso significa que wallets e DEXs existentes podem interagir com tokens Token-2022 sem mudanças — desde que não usem extensões que exigem tratamento especial (como transfer fees).

\`\`\`typescript
import { TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';

// Mesmo fluxo do SPL Token, apenas trocando o program ID
const mint = await createMint(
  connection,
  payer,
  authority,
  null,
  9,
  keypair,
  undefined,
  TOKEN_2022_PROGRAM_ID // <-- única diferença
);
\`\`\`

## Quando usar cada um?

- **SPL Token**: projetos simples, máxima compatibilidade com DEXs legadas
- **Token-2022**: quando precisar de transfer fees, tokens confidenciais, metadata on-chain ou qualquer extensão`,
          exercise: {
            question:
              "Qual é a principal vantagem do Token-2022 em relação ao SPL Token original?",
            options: [
              "É mais rápido em termos de TPS",
              "Suporta extensões modulares como transfer fees e confidential transfers",
              "Usa menos compute units por transação",
              "É o único programa que suporta NFTs no Solana",
            ],
            correctIndex: 1,
          },
        },
        {
          id: "l45",
          title: "Mint authority e freeze authority",
          slug: "mint-freeze-authority",
          type: "content",
          durationMinutes: 30,
          xpReward: 60,
          content: `# Mint Authority e Freeze Authority

## O que são authorities?

No Solana, cada **Mint** (token) possui duas autoridades opcionais:

- **Mint Authority**: quem pode criar (mintar) novos tokens
- **Freeze Authority**: quem pode congelar e descongelar contas de token

Essas autoridades são chaves públicas definidas no momento da criação do mint e podem ser alteradas ou **revogadas** permanentemente.

## Mint Authority

A mint authority controla a **oferta** do token. Somente essa chave pode chamar a instrução \`MintTo\`.

\`\`\`typescript
import { mintTo, setAuthority, AuthorityType } from '@solana/spl-token';

// Mintar 1000 tokens (com 9 decimais)
await mintTo(connection, payer, mint, destination, mintAuthority, 1000_000_000_000n);

// Revogar mint authority (supply fixo para sempre)
await setAuthority(
  connection,
  payer,
  mint,
  currentAuthority,
  AuthorityType.MintTokens,
  null // null = revogar
);
\`\`\`

## Freeze Authority

A freeze authority pode **congelar** uma token account, impedindo qualquer transferência. É usada em casos de compliance, stablecoins reguladas e mecanismos antifraude.

\`\`\`typescript
import { freezeAccount, thawAccount } from '@solana/spl-token';

// Congelar conta
await freezeAccount(connection, payer, tokenAccount, mint, freezeAuthority);

// Descongelar
await thawAccount(connection, payer, tokenAccount, mint, freezeAuthority);
\`\`\`

## Multisig Authority

Para maior segurança, você pode usar um **multisig** como authority. O SPL Token suporta multisigs nativamente com M-de-N assinaturas.

\`\`\`typescript
import { createMultisig } from '@solana/spl-token';

const multisig = await createMultisig(
  connection,
  payer,
  [signer1.publicKey, signer2.publicKey, signer3.publicKey],
  2 // threshold: 2 de 3
);
\`\`\`

## Boas práticas

- **Revogar mint authority** após o supply inicial se o token deve ter oferta fixa
- **Definir freeze authority como null** se não houver necessidade de compliance
- Usar **multisig** para treasuries e DAOs
- Documentar publicamente o status das authorities para transparência`,
          exercise: {
            question:
              "O que acontece quando você define a mint authority como null ao chamar setAuthority?",
            options: [
              "A autoridade é transferida para o programa do sistema",
              "Novos tokens podem ser mintados por qualquer pessoa",
              "A mint authority é revogada permanentemente e nenhum novo token pode ser criado",
              "O token é automaticamente queimado",
            ],
            correctIndex: 2,
          },
        },
        {
          id: "l46",
          title: "Transfer fees",
          slug: "transfer-fees",
          type: "content",
          durationMinutes: 35,
          xpReward: 70,
          content: `# Transfer Fees no Token-2022

## O que são transfer fees?

A extensão **TransferFee** do Token-2022 permite cobrar uma **taxa automática** em toda transferência de tokens. A taxa é configurada no mint e aplicada pelo próprio programa — não é possível contorná-la.

## Como funciona

Quando um token com transfer fee é transferido:

1. O valor da taxa é **retido** na conta de destino em um campo separado chamado \`withheld amount\`
2. A taxa acumula até ser **coletada** pela autoridade de coleta (\`withdraw withheld authority\`)
3. O destinatário recebe o valor **líquido** (valor total - taxa)

## Configuração

A transfer fee é configurada com dois parâmetros:

- **feeBasisPoints**: taxa em basis points (100 = 1%)
- **maximumFee**: teto da taxa em unidades absolutas do token

\`\`\`typescript
import {
  createInitializeTransferFeeConfigInstruction,
  TOKEN_2022_PROGRAM_ID,
} from '@solana/spl-token';

// 2.5% de taxa, máximo de 5000 tokens por transferência
const feeBasisPoints = 250; // 2.5%
const maximumFee = BigInt(5000_000_000_000); // 5000 tokens (9 decimais)

const ix = createInitializeTransferFeeConfigInstruction(
  mint,
  transferFeeConfigAuthority,
  withdrawWithheldAuthority,
  feeBasisPoints,
  maximumFee,
  TOKEN_2022_PROGRAM_ID
);
\`\`\`

## Coletando taxas

As taxas retidas ficam nas token accounts dos destinatários. Para coletá-las:

\`\`\`typescript
import { harvestWithheldTokensToMint, withdrawWithheldTokensFromMint } from '@solana/spl-token';

// Passo 1: Colher taxas de todas as contas para o mint
await harvestWithheldTokensToMint(connection, payer, mint, [account1, account2]);

// Passo 2: Sacar do mint para uma conta de destino
await withdrawWithheldTokensFromMint(
  connection, payer, mint, destination, withdrawAuthority
);
\`\`\`

## Casos de uso

- **Protocolos DeFi**: receita automática por volume transacionado
- **DAOs**: funding contínuo via taxas de transação
- **Memecoins**: redistribuição de taxas para holders
- **Stablecoins**: taxa de manutenção regulatória

## Importante

- A taxa é aplicada no **programa**, não pode ser burlada
- DEXs e aggregators precisam suportar Token-2022 para calcular corretamente os valores líquidos
- O Jupiter e o Raydium já suportam tokens com transfer fee`,
          exercise: {
            question:
              "Onde ficam armazenadas as taxas de transfer fee até serem coletadas?",
            options: [
              "Em uma conta PDA do programa Token-2022",
              "Na conta do remetente da transação",
              "No campo withheld amount da conta de token do destinatário",
              "Em uma conta de treasury definida na criação do mint",
            ],
            correctIndex: 2,
          },
        },
        {
          id: "l47",
          title: "Confidential transfers",
          slug: "transferencias-confidenciais",
          type: "content",
          durationMinutes: 35,
          xpReward: 70,
          content: `# Transferências Confidenciais

## O problema da transparência

No Solana, todas as transações e saldos são **públicos por padrão**. Qualquer pessoa pode verificar quanto uma carteira possui e para quem transferiu. Embora isso traga transparência, muitos casos de uso exigem **privacidade financeira**.

## O que são Confidential Transfers?

A extensão **ConfidentialTransfer** do Token-2022 usa **provas de conhecimento zero** (zero-knowledge proofs) para ocultar:

- O **valor** sendo transferido
- O **saldo** das contas envolvidas

A **existência** da transação e os **endereços** das partes continuam públicos — apenas os valores são ocultados.

## Como funciona (simplificado)

1. Os saldos são armazenados como **ciphertexts** (textos cifrados) usando criptografia ElGamal
2. Cada transferência inclui uma **prova de range** (range proof) que garante que o valor é válido e que o remetente tem saldo suficiente
3. O programa verifica a prova sem precisar saber o valor real

\`\`\`
Saldo público:     1,000 USDC  (todos veem)
Saldo confidencial: Enc(1000)  (só o dono decifra)
\`\`\`

## Configuração

\`\`\`typescript
import {
  createInitializeConfidentialTransferMintInstruction,
  TOKEN_2022_PROGRAM_ID,
} from '@solana/spl-token';

const ix = createInitializeConfidentialTransferMintInstruction(
  mint,
  confidentialTransferAuthority,
  autoApproveNewAccounts, // se true, contas são aprovadas automaticamente
  auditorElGamalPubkey,   // auditor opcional (compliance)
  TOKEN_2022_PROGRAM_ID
);
\`\`\`

## Auditor

Um recurso único: é possível definir um **auditor** que possui uma chave ElGamal capaz de decifrar todas as transferências. Isso permite:

- Compliance regulatório
- Auditorias internas
- Transparência seletiva

## Limitações atuais

- **Compute budget alto**: provas ZK consomem muitas compute units
- **Latência**: provas precisam ser geradas off-chain antes de enviar a transação
- **Compatibilidade**: nem todas as wallets e DEXs suportam confidential transfers
- **Custo**: transações mais caras (mais espaço e computação)

## Casos de uso ideais

- Pagamentos corporativos (salários em stablecoin)
- Transações institucionais
- Stablecoins com privacidade regulada`,
          exercise: {
            question:
              "O que as transferências confidenciais do Token-2022 ocultam?",
            options: [
              "Os endereços de remetente e destinatário",
              "A existência da transação na blockchain",
              "Os valores transferidos e os saldos das contas",
              "O programa que processou a transação",
            ],
            correctIndex: 2,
          },
        },
        {
          id: "l48",
          title: "Interest-bearing tokens",
          slug: "tokens-interest-bearing",
          type: "content",
          durationMinutes: 30,
          xpReward: 60,
          content: `# Interest-Bearing Tokens

## Conceito

A extensão **InterestBearingMint** do Token-2022 permite que um token **acumule juros** automaticamente ao longo do tempo. Os juros são calculados na **camada de exibição** — o saldo raw na blockchain não muda, mas o "saldo UI" apresentado ao usuário reflete os juros acumulados.

## Como funciona?

O mecanismo é simples e elegante:

1. O mint armazena uma **taxa de juros** (em basis points por ano)
2. O mint armazena um **timestamp de inicialização**
3. Qualquer client que consulta o saldo aplica a fórmula de juros compostos com base no tempo decorrido

\`\`\`
Saldo UI = saldo_raw × (1 + taxa/10000) ^ (tempo_decorrido / 1_ano)
\`\`\`

## Configuração

\`\`\`typescript
import {
  createInitializeInterestBearingMintInstruction,
  TOKEN_2022_PROGRAM_ID,
} from '@solana/spl-token';

// Taxa de 5% ao ano = 500 basis points
const rate = 500;

const ix = createInitializeInterestBearingMintInstruction(
  mint,
  rateAuthority, // quem pode alterar a taxa
  rate,
  TOKEN_2022_PROGRAM_ID
);
\`\`\`

## Atualizando a taxa

A taxa pode ser alterada pela \`rateAuthority\` a qualquer momento:

\`\`\`typescript
import { updateRateInterestBearingMint } from '@solana/spl-token';

// Alterar para 7.5% ao ano
await updateRateInterestBearingMint(
  connection,
  payer,
  mint,
  rateAuthority,
  750 // 7.5%
);
\`\`\`

## Calculando o saldo com juros

\`\`\`typescript
import { amountToUiAmount } from '@solana/spl-token';

// Retorna o saldo com juros acumulados
const uiAmount = await amountToUiAmount(
  connection,
  payer,
  mint,
  rawBalance,
  TOKEN_2022_PROGRAM_ID
);
\`\`\`

## Importante

- Os juros são **somente na exibição** — o saldo raw não muda na blockchain
- Não há mint automático de novos tokens — é uma representação visual
- Ideal para **bonds tokenizados**, **stablecoins com yield** e **contas poupança on-chain**
- A taxa pode ser negativa (depreciação)`,
          exercise: {
            question:
              "Como os juros de um interest-bearing token são aplicados na prática?",
            options: [
              "Novos tokens são automaticamente mintados para cada holder a cada epoch",
              "O saldo raw na blockchain é atualizado por um cron job on-chain",
              "Os juros são calculados na camada de exibição com base no tempo decorrido, sem alterar o saldo raw",
              "Um programa de staking distribui rewards proporcionais",
            ],
            correctIndex: 2,
          },
        },
        {
          id: "l49",
          title: "Permanent delegate e non-transferable",
          slug: "permanent-delegate",
          type: "content",
          durationMinutes: 30,
          xpReward: 60,
          content: `# Permanent Delegate e Non-Transferable Tokens

## Permanent Delegate

A extensão **PermanentDelegate** do Token-2022 define uma autoridade que pode **transferir ou queimar** tokens de **qualquer** conta daquele mint, sem precisar da assinatura do dono.

### Casos de uso

- **Stablecoins reguladas**: compliance pode recuperar fundos de contas sancionadas
- **Gaming**: itens de jogo que podem ser revogados por violação de termos
- **Seguros**: resgate automático de tokens por um smart contract

\`\`\`typescript
import {
  createInitializePermanentDelegateInstruction,
  TOKEN_2022_PROGRAM_ID,
} from '@solana/spl-token';

const ix = createInitializePermanentDelegateInstruction(
  mint,
  permanentDelegate, // essa chave pode transferir/queimar de qualquer conta
  TOKEN_2022_PROGRAM_ID
);
\`\`\`

## Non-Transferable Tokens (Soulbound)

A extensão **NonTransferable** cria tokens que **não podem ser transferidos** entre carteiras — os chamados **soulbound tokens** (SBTs).

### Como funciona?

- O mint é marcado como non-transferable na criação
- Token accounts desse mint **só podem receber** tokens via mint (MintTo)
- Qualquer tentativa de transferência falha com erro
- O holder ainda pode **queimar** seus tokens

\`\`\`typescript
import {
  createInitializeNonTransferableMintInstruction,
  TOKEN_2022_PROGRAM_ID,
} from '@solana/spl-token';

const ix = createInitializeNonTransferableMintInstruction(
  mint,
  TOKEN_2022_PROGRAM_ID
);
\`\`\`

### Casos de uso de SBTs

- **Credenciais educacionais**: certificados que provam conclusão de cursos
- **Reputação**: score de governança intransferível
- **XP em jogos**: experiência que não pode ser vendida
- **KYC tokens**: prova de identidade vinculada à carteira
- **Memberships**: acesso exclusivo que não pode ser revendido

## Combinando extensões

Uma das grandes vantagens do Token-2022 é poder **combinar extensões**. Exemplos poderosos:

- **NonTransferable + Metadata**: credencial soulbound com nome e imagem
- **PermanentDelegate + TransferFee**: stablecoin com taxa e compliance
- **InterestBearing + NonTransferable**: XP que acumula bônus temporal

## Na Superteam Academy

O sistema de **XP** da plataforma usa exatamente essa combinação:
- Token-2022 com extensão **NonTransferable** (soulbound)
- Level = \`floor(sqrt(xp / 100))\``,
          exercise: {
            question:
              "Qual extensão do Token-2022 é usada para criar tokens soulbound (intransferíveis)?",
            options: [
              "PermanentDelegate",
              "TransferFee com taxa de 100%",
              "NonTransferable",
              "FreezeAuthority em todas as contas",
            ],
            correctIndex: 2,
          },
        },
        {
          id: "l50",
          title: "Criando um token com extensões",
          slug: "token-com-extensoes",
          type: "challenge",
          durationMinutes: 45,
          xpReward: 100,
          content: `# Desafio: Criando um Token-2022 com Extensões

## Objetivo

Neste desafio, você vai criar um token usando o programa **Token-2022** com duas extensões:

1. **TransferFee**: taxa de 1% por transferência, máximo de 1000 tokens
2. **TokenMetadata**: nome, símbolo e URI on-chain

## Requisitos

- Criar o mint com as duas extensões configuradas
- Configurar a taxa de transferência como 100 basis points (1%)
- Definir o máximo de fee como 1000 tokens (considerando decimais)
- Adicionar metadata com nome "Academy Token", símbolo "ACAD" e URI apontando para um JSON

## Dicas

- Use \`getMintLen\` para calcular o espaço necessário com extensões
- As instruções de extensão devem ser executadas **antes** do \`InitializeMint\`
- A ordem importa: extensões primeiro, depois mint init

## Fluxo esperado

\`\`\`
1. Calcular espaço do mint (com extensões)
2. Criar conta com espaço suficiente
3. Inicializar TransferFee config
4. Inicializar Metadata
5. Inicializar Mint
6. Criar ATA
7. Mintar tokens
8. Transferir para outra conta (verifica fee)
\`\`\``,
          exercise: {
            question:
              "Qual é a ordem correta para criar um mint Token-2022 com extensões?",
            options: [
              "InitializeMint → criar extensões → criar conta",
              "Criar conta → InitializeMint → criar extensões",
              "Criar conta com espaço suficiente → inicializar extensões → InitializeMint",
              "As extensões podem ser adicionadas em qualquer ordem, inclusive depois do mint",
            ],
            correctIndex: 2,
          },
          challenge: {
            prompt:
              "Crie um token Token-2022 com extensão TransferFee (1%, max 1000 tokens) e metadata. Complete o código abaixo para configurar as extensões e inicializar o mint.",
            starterCode: `import {
  Connection, Keypair, SystemProgram, Transaction,
  sendAndConfirmTransaction
} from '@solana/web3.js';
import {
  TOKEN_2022_PROGRAM_ID,
  createInitializeMintInstruction,
  createInitializeTransferFeeConfigInstruction,
  getMintLen,
  ExtensionType,
  mintTo,
  createAssociatedTokenAccountIdempotent,
} from '@solana/spl-token';
import {
  createInitializeInstruction,
  pack,
  TokenMetadata,
} from '@solana/spl-token-metadata';

const connection = new Connection('http://127.0.0.1:8899', 'confirmed');
const payer = Keypair.generate();
const mintKeypair = Keypair.generate();
const mint = mintKeypair.publicKey;
const decimals = 9;

async function createTokenWithExtensions() {
  // TODO 1: Calcule o espaço necessário para o mint com extensões
  // Dica: use getMintLen([ExtensionType.TransferFeeConfig])
  const mintLen = 0; // substitua

  // TODO 2: Crie a instrução para alocar a conta do mint
  // Dica: use SystemProgram.createAccount

  // TODO 3: Crie a instrução de TransferFeeConfig
  // feeBasisPoints = 100 (1%), maximumFee = 1000 * 10^9

  // TODO 4: Crie a instrução de InitializeMint

  // TODO 5: Monte a transação na ordem correta e envie
}

createTokenWithExtensions();`,
            language: "typescript",
            testCases: [
              {
                input: "getMintLen",
                expected: "ExtensionType.TransferFeeConfig",
              },
              { input: "feeBasisPoints", expected: "100" },
              {
                input: "createInitializeTransferFeeConfigInstruction",
                expected: "mint",
              },
              {
                input: "order",
                expected: "createAccount → transferFee → initMint",
              },
            ],
          },
        },
      ],
    },
  ],
};

export const course8: Course = {
  id: "8",
  slug: "amm-e-liquidity",
  title: "AMM e liquidez",
  description: "Pools, liquidez e arbitragem em DEXs no Solana.",
  longDescription:
    "Entenda como funcionam os Automated Market Makers, domine a fórmula do produto constante, aprenda sobre impermanent loss e integre com Raydium e Orca para criar e gerenciar pools de liquidez.",
  difficulty: "intermediate",
  duration: "long",
  totalDurationMinutes: 235,
  xpTotal: 490,
  thumbnail: "/courses/amm-e-liquidity.png",
  instructor: {
    name: "Kauê",
    avatar: "/instructors/kaue.png",
    role: "Instrutor",
  },
  instructorSlug: "kaue",
  track: "DeFi",
  modules: [
    {
      id: "m8",
      title: "AMM e DEXs no Solana",
      lessons: [
        {
          id: "l51",
          title: "O que é um AMM?",
          slug: "o-que-e-amm",
          type: "content",
          durationMinutes: 25,
          xpReward: 50,
          content: `# O que é um AMM?

## Introdução

Um **Automated Market Maker** (AMM) é um protocolo que permite a negociação de ativos **sem order book** e **sem intermediários**. Em vez de compradores e vendedores criarem ordens, o AMM usa uma **fórmula matemática** para definir o preço com base nas reservas de um pool.

## Order Book vs AMM

### Order Book (modelo tradicional)

No modelo de order book (usado por Binance, NYSE, etc.):
- Compradores postam ordens de compra (**bids**)
- Vendedores postam ordens de venda (**asks**)
- Trades acontecem quando bid >= ask
- Requer **market makers** ativos para fornecer liquidez

### AMM (modelo DeFi)

No modelo AMM:
- Provedores de liquidez (**LPs**) depositam pares de tokens em um **pool**
- O preço é determinado automaticamente por uma **curva de preço**
- Qualquer pessoa pode trocar (swap) tokens a qualquer momento
- Não há necessidade de contraparte específica

## Como funciona um pool?

\`\`\`
Pool SOL/USDC:
├── Reserva de SOL: 1,000 SOL
├── Reserva de USDC: 150,000 USDC
└── Preço implícito: 150 USDC/SOL
\`\`\`

Quando alguém compra SOL:
1. Deposita USDC no pool
2. Retira SOL do pool
3. A proporção muda → preço sobe

## AMMs no Solana

O Solana é ideal para AMMs por conta de:
- **Alta velocidade**: swaps em ~400ms
- **Baixo custo**: frações de centavo por transação
- **Composabilidade**: CPIs permitem integrar AMMs em qualquer programa

### Principais AMMs no Solana

| AMM | Tipo | Destaque |
|---|---|---|
| Raydium | CLMM + Legacy | Integração com OpenBook |
| Orca | Whirlpools (CLMM) | UX simplificada |
| Meteora | DLMM | Bins de liquidez dinâmica |
| Phoenix | Híbrido (LOB + AMM) | Order book on-chain |`,
          exercise: {
            question:
              "Qual é a principal diferença entre um AMM e um order book?",
            options: [
              "O AMM é mais lento porque precisa de consenso para cada trade",
              "O AMM usa uma fórmula matemática para definir preços, sem necessidade de ordens de compra/venda",
              "O order book não precisa de liquidez para funcionar",
              "O AMM só funciona em blockchains de alta performance",
            ],
            correctIndex: 1,
          },
        },
        {
          id: "l52",
          title: "Fórmula do produto constante",
          slug: "formula-produto-constante",
          type: "content",
          durationMinutes: 30,
          xpReward: 60,
          content: `# Fórmula do Produto Constante

## A fórmula x * y = k

A fórmula mais fundamental dos AMMs é o **produto constante**, popularizada pelo Uniswap V2:

\`\`\`
x * y = k
\`\`\`

Onde:
- **x** = reserva do token A no pool
- **y** = reserva do token B no pool
- **k** = constante (não muda em swaps, apenas em adição/remoção de liquidez)

## Exemplo numérico

\`\`\`
Pool inicial:
  x = 100 SOL
  y = 15,000 USDC
  k = 100 × 15,000 = 1,500,000

Preço: y/x = 15,000/100 = 150 USDC/SOL
\`\`\`

### Comprando 10 SOL:

\`\`\`
Novo x = 100 - 10 = 90 SOL
Novo y = k / x = 1,500,000 / 90 = 16,666.67 USDC

Custo = 16,666.67 - 15,000 = 1,666.67 USDC
Preço efetivo = 1,666.67 / 10 = 166.67 USDC/SOL
\`\`\`

Note que o preço efetivo (166.67) é **maior** que o preço spot (150). Isso é o **price impact**.

## Price Impact (Impacto no Preço)

Quanto maior o trade em relação ao pool, maior o price impact:

| Trade | % do Pool | Price Impact |
|---|---|---|
| 1 SOL | 1% | ~1% |
| 10 SOL | 10% | ~11% |
| 50 SOL | 50% | ~100% |

## Derivação do preço

O preço marginal (spot price) em qualquer ponto é:

\`\`\`
Preço de A em termos de B = dy/dx = y/x
\`\`\`

Para calcular a quantidade de output para um dado input:

\`\`\`typescript
function getAmountOut(
  amountIn: number,
  reserveIn: number,
  reserveOut: number,
  feeBps: number = 30 // 0.3%
): number {
  const amountInWithFee = amountIn * (10000 - feeBps) / 10000;
  const numerator = amountInWithFee * reserveOut;
  const denominator = reserveIn + amountInWithFee;
  return numerator / denominator;
}
\`\`\`

## Slippage

O **slippage** é a diferença entre o preço esperado e o preço executado. Ao fazer um swap, você define um **slippage tolerance** (ex: 0.5%) para proteger contra movimentos de preço entre o envio e a execução.

## Curvas alternativas

- **StableSwap (Curve)**: \`x³y + xy³ = k\` — menor price impact para ativos similares (ex: USDC/USDT)
- **Concentrated Liquidity (Uni V3/Raydium CLMM)**: liquidez alocada em faixas de preço específicas`,
          exercise: {
            question:
              "Em um pool x*y=k com 200 SOL e 30,000 USDC, qual é o preço spot de 1 SOL?",
            options: ["200 USDC", "100 USDC", "150 USDC", "30,000 USDC"],
            correctIndex: 2,
          },
        },
        {
          id: "l53",
          title: "Impermanent loss",
          slug: "impermanent-loss",
          type: "content",
          durationMinutes: 30,
          xpReward: 60,
          content: `# Impermanent Loss

## O que é Impermanent Loss?

**Impermanent Loss** (IL) é a diferença de valor entre:
- Manter seus tokens em um **pool de liquidez**
- Simplesmente **segurar** (hold) os mesmos tokens na carteira

Quando o preço relativo dos tokens muda, o pool rebalanceia automaticamente, e o LP termina com mais do token que desvalorizou e menos do que valorizou.

## Por que "impermanent"?

É chamado de "impermanent" porque:
- Se o preço **voltar** ao valor original, a perda **desaparece**
- A perda só se torna **permanente** quando você retira liquidez com preço diferente do de entrada

## Calculando o IL

A fórmula do impermanent loss para um pool x*y=k é:

\`\`\`
IL = 2 × √(price_ratio) / (1 + price_ratio) - 1
\`\`\`

Onde \`price_ratio = preço_novo / preço_inicial\`

### Tabela de referência

| Variação de preço | IL |
|---|---|
| 1.25x (25% de alta) | -0.6% |
| 1.50x (50% de alta) | -2.0% |
| 2x (100% de alta) | -5.7% |
| 3x (200% de alta) | -13.4% |
| 5x (400% de alta) | -25.5% |
| 0.5x (50% de queda) | -5.7% |

## Exemplo prático

\`\`\`
Depósito inicial:
  10 SOL + 1,500 USDC (SOL = 150 USDC)
  Valor total: 3,000 USDC

SOL sobe para 300 USDC:
  Pool rebalanceia para: ~7.07 SOL + 2,121 USDC
  Valor no pool: ~4,242 USDC
  Valor se tivesse holdado: 10 × 300 + 1,500 = 4,500 USDC
  IL = (4,242 - 4,500) / 4,500 = -5.7%
\`\`\`

## Estratégias para minimizar IL

1. **Pares estáveis**: pools USDC/USDT têm IL quase zero
2. **Pools com fees altas**: taxas de swap compensam o IL
3. **Concentrated liquidity**: faixas estreitas geram mais fees (mas mais IL se sair do range)
4. **Hedge**: usar derivativos para proteger posição
5. **Single-sided liquidity**: alguns protocolos permitem depósito de um token só

## IL em Concentrated Liquidity

Em pools de liquidez concentrada (Raydium CLMM, Orca Whirlpools):
- O IL é **amplificado** dentro do range
- Se o preço sair do range, o LP tem 100% do token que desvalorizou
- As fees ganhas também são maiores (compensação)

\`\`\`typescript
// Simulando IL
function impermanentLoss(priceRatio: number): number {
  return 2 * Math.sqrt(priceRatio) / (1 + priceRatio) - 1;
}

console.log(impermanentLoss(2));   // -0.0572 (-5.72%)
console.log(impermanentLoss(0.5)); // -0.0572 (-5.72%)
\`\`\``,
          exercise: {
            question:
              "Se o preço de um ativo dobra (2x), qual é o impermanent loss aproximado em um pool x*y=k?",
            options: ["-2.0%", "-5.7%", "-13.4%", "-25.5%"],
            correctIndex: 1,
          },
        },
        {
          id: "l54",
          title: "Raydium: arquitetura e integração",
          slug: "raydium-arquitetura",
          type: "content",
          durationMinutes: 35,
          xpReward: 70,
          content: `# Raydium: Arquitetura e Integração

## O que é Raydium?

Raydium é o maior AMM do ecossistema Solana, oferecendo dois tipos de pools:

- **Legacy AMM (V4)**: pools de produto constante clássicos
- **Concentrated Liquidity Market Maker (CLMM)**: liquidez concentrada com ticks, similar ao Uniswap V3

## Arquitetura CLMM

### Ticks e ranges

No modelo CLMM, o espaço de preço é dividido em **ticks** discretos. Cada LP escolhe um **range** (tick inferior e superior) onde sua liquidez fica ativa.

\`\`\`
Preço: ──────|=====LP1=====|──────────────
             $140          $160

Preço: ──|========LP2========|────────────
         $130               $170

Preço atual: $150 → ambos LP1 e LP2 estão ativos
\`\`\`

### Vantagens da liquidez concentrada

- **Eficiência de capital**: 4000x mais eficiente que full-range
- **Mais fees**: liquidez concentrada ganha proporcionalmente mais
- **Flexibilidade**: cada LP define sua estratégia

## Integração com SDK

### Instalação

\`\`\`bash
npm install @raydium-io/raydium-sdk-v2
\`\`\`

### Inicializando o Raydium SDK

\`\`\`typescript
import { Raydium } from '@raydium-io/raydium-sdk-v2';

const raydium = await Raydium.load({
  connection,
  owner: wallet,
  cluster: 'mainnet',
});
\`\`\`

### Consultando pools

\`\`\`typescript
// Buscar pools CLMM
const pools = await raydium.clmm.getPoolInfoFromRpc(poolId);

// Informações do pool
console.log('Preço atual:', pools.currentPrice);
console.log('Liquidez:', pools.liquidity);
console.log('Fee rate:', pools.ammConfig.tradeFeeRate);
\`\`\`

### Executando um swap

\`\`\`typescript
const { execute } = await raydium.clmm.swap({
  poolInfo,
  inputMint: SOL_MINT,
  amountIn: new BN(1_000_000_000), // 1 SOL
  slippage: 0.005, // 0.5%
});

const txId = await execute();
\`\`\`

## Accounts do Raydium

Um pool CLMM do Raydium envolve várias contas PDA:

| Conta | Descrição |
|---|---|
| PoolState | Estado principal do pool (preço, liquidez, ticks) |
| AmmConfig | Configuração (fee rate, tick spacing) |
| ProtocolPosition | Posição do protocolo |
| PersonalPosition | Posição de cada LP |
| TickArray | Array de ticks com liquidez |
| TokenVault A/B | Vaults que guardam os tokens |

## Eventos

O Raydium emite eventos para indexação:
- \`Swap\`: token in/out, preço, fee
- \`LiquidityChange\`: adição/remoção de liquidez
- \`CollectFee\`: coleta de fees por LP`,
          exercise: {
            question:
              "Qual é a principal vantagem dos pools CLMM do Raydium em relação aos pools legacy?",
            options: [
              "Os pools CLMM são mais baratos para criar",
              "Os pools CLMM permitem liquidez concentrada em faixas de preço, aumentando a eficiência de capital",
              "Os pools CLMM não cobram taxas de swap",
              "Os pools CLMM não sofrem impermanent loss",
            ],
            correctIndex: 1,
          },
        },
        {
          id: "l55",
          title: "Orca: Whirlpools",
          slug: "orca-whirlpools",
          type: "content",
          durationMinutes: 35,
          xpReward: 70,
          content: `# Orca: Whirlpools

## O que são Whirlpools?

**Whirlpools** são os pools de liquidez concentrada da Orca — o segundo maior AMM do Solana. O nome "Whirlpool" vem da ideia de liquidez girando eficientemente em um vórtice de preços.

## Conceitos-chave

### Tick Arrays

Os Whirlpools organizam ticks em **tick arrays** — grupos contíguos de ticks armazenados em uma mesma conta PDA. Cada tick array contém **88 ticks**.

\`\`\`
TickArray 0:  [tick 0 ... tick 87]
TickArray 1:  [tick 88 ... tick 175]
TickArray 2:  [tick 176 ... tick 263]
...
\`\`\`

### Tick Spacing

O \`tickSpacing\` define a granularidade do pool:

| tickSpacing | Uso típico | Exemplo |
|---|---|---|
| 1 | Pares estáveis | USDC/USDT |
| 8 | Pares populares | SOL/USDC |
| 64 | Pares exóticos | MEME/SOL |
| 128 | Pares de alta volatilidade | NEW/SOL |

Menor tickSpacing = mais granularidade = mais eficiência para pares estáveis.

### Posições

Cada LP abre uma **posição** definida por:
- \`tickLowerIndex\`: tick inferior do range
- \`tickUpperIndex\`: tick superior do range
- \`liquidity\`: quantidade de liquidez depositada

\`\`\`typescript
import { WhirlpoolContext, buildWhirlpoolClient } from '@orca-so/whirlpools-sdk';

const ctx = WhirlpoolContext.from(connection, wallet, ORCA_WHIRLPOOL_PROGRAM_ID);
const client = buildWhirlpoolClient(ctx);

// Buscar pool SOL/USDC
const pool = await client.getPool(poolAddress);
const poolData = pool.getData();

console.log('sqrtPrice:', poolData.sqrtPrice.toString());
console.log('tickCurrentIndex:', poolData.tickCurrentIndex);
console.log('liquidity:', poolData.liquidity.toString());
\`\`\`

## Gerenciamento de posição

### Abrindo posição

\`\`\`typescript
import { increaseLiquidityQuoteByInputToken } from '@orca-so/whirlpools-sdk';

// Calcular quote para depositar 1 SOL
const quote = increaseLiquidityQuoteByInputToken(
  SOL_MINT,
  new Decimal(1),
  tickLower,
  tickUpper,
  Percentage.fromFraction(1, 100), // 1% slippage
  pool
);

// Abrir posição
const { positionMint, tx } = await pool.openPosition(
  tickLower,
  tickUpper,
  quote
);
await tx.buildAndExecute();
\`\`\`

### Coletando fees

\`\`\`typescript
const position = await client.getPosition(positionAddress);
const fees = position.getData();
console.log('Fees em token A:', fees.feeOwedA.toString());
console.log('Fees em token B:', fees.feeOwedB.toString());

// Coletar
const collectTx = await position.collectFees();
await collectTx.buildAndExecute();
\`\`\`

## Orca vs Raydium

| Aspecto | Orca Whirlpools | Raydium CLMM |
|---|---|---|
| SDK | @orca-so/whirlpools-sdk | @raydium-io/raydium-sdk-v2 |
| Tick storage | Tick Arrays (88 ticks) | Tick Arrays |
| Fee tiers | 0.01%, 0.05%, 0.3%, 1% | Configurável por AmmConfig |
| Ecosystem | Mais integrado com Jupiter | OpenBook integration |`,
          exercise: {
            question: "O que são tick arrays nos Whirlpools da Orca?",
            options: [
              "Arrays de preços históricos do pool",
              "Grupos contíguos de ticks armazenados em uma mesma conta PDA",
              "Listas de transações pendentes no pool",
              "Registros de posições de todos os LPs",
            ],
            correctIndex: 1,
          },
        },
        {
          id: "l56",
          title: "Arbitragem e MEV",
          slug: "arbitragem-mev",
          type: "content",
          durationMinutes: 30,
          xpReward: 60,
          content: `# Arbitragem e MEV no Solana

## O que é MEV?

**Maximal Extractable Value** (MEV) é o lucro máximo que pode ser extraído da produção de blocos, além das recompensas padrão e taxas de gas. No Solana, o MEV assume formas diferentes do Ethereum devido à arquitetura única.

## Tipos de MEV no Solana

### 1. Arbitragem

Explorar diferenças de preço entre pools/DEXs:

\`\`\`
Raydium SOL/USDC: 150.00
Orca SOL/USDC:    150.50

Arbitragem:
1. Comprar SOL no Raydium por 150.00
2. Vender SOL na Orca por 150.50
3. Lucro: 0.50 USDC por SOL (menos fees)
\`\`\`

### 2. Sandwich Attack

O atacante "envolve" a transação da vítima:

\`\`\`
1. Frontrun: Atacante compra SOL (preço sobe)
2. Vítima:   Compra SOL a preço inflado
3. Backrun:  Atacante vende SOL (lucro com a diferença)
\`\`\`

### 3. Liquidation

Monitorar posições sub-colateralizadas em protocolos de lending para liquidá-las e ganhar o bônus de liquidação.

### 4. JIT Liquidity (Just-In-Time)

Adicionar liquidez em um pool concentrado **momentos antes** de um grande swap, capturar as fees, e remover a liquidez logo após.

## Jito: MEV no Solana

O **Jito** é o principal sistema de MEV do Solana:

### Jito Bundles

- Pacotes de transações ordenadas que executam **atomicamente**
- Se uma transação falha, todo o bundle falha
- Validators com Jito priorizam bundles com gorjetas (tips)

\`\`\`typescript
import { SearcherClient } from 'jito-ts/dist/sdk/block-engine/searcher';

const client = SearcherClient.connect(jitoBlockEngineUrl);

// Criar bundle
const bundle = new Bundle([tx1, tx2, tx3], tipAmount);
await client.sendBundle(bundle);
\`\`\`

### Jito Tips

Validators Jito aceitam **tips** (gorjetas) para inclusão prioritária. As tips vão para o validator, não para o Jito.

## Proteção contra MEV

### Para desenvolvedores

1. **Slippage protection**: sempre definir slippage máximo nos swaps
2. **Priority fees**: pagar priority fees para inclusão rápida
3. **Jito bundles**: usar bundles para transações sensíveis à ordem
4. **Private mempools**: enviar transações diretamente para validators confiáveis

### Para usuários

- Usar Jupiter com **MEV protection** ativado
- Configurar slippage adequado (0.5-1% para pares líquidos)
- Evitar transações grandes em pools rasos

## MEV no Solana vs Ethereum

| Aspecto | Solana | Ethereum |
|---|---|---|
| Mempool | Não existe mempool pública | Mempool pública |
| Latência | ~400ms por slot | ~12s por bloco |
| Custo de tentativa | Muito baixo | Alto (gas) |
| Mecanismo | Jito bundles | Flashbots, MEV-Boost |
| Sandwich | Mais difícil (sem mempool) | Muito comum |`,
          exercise: {
            question:
              "Por que sandwich attacks são mais difíceis no Solana do que no Ethereum?",
            options: [
              "O Solana tem um mecanismo de proteção anti-MEV nativo",
              "Não existe mempool pública no Solana, então é mais difícil ver transações pendentes",
              "As taxas de transação no Solana são muito altas para tornar sandwiches lucrativas",
              "O Solana bloqueia automaticamente transações de MEV",
            ],
            correctIndex: 1,
          },
        },
        {
          id: "l57",
          title: "Criando um pool de liquidez",
          slug: "criando-pool-liquidez",
          type: "challenge",
          durationMinutes: 50,
          xpReward: 120,
          content: `# Desafio: Criando um Pool de Liquidez

## Objetivo

Neste desafio, você vai criar e interagir com um pool de liquidez usando o SDK do Raydium. Você vai:

1. Criar um pool CLMM para um par de tokens
2. Adicionar liquidez em um range de preço
3. Executar um swap
4. Coletar fees acumuladas

## Requisitos

- Inicializar o Raydium SDK com conexão devnet
- Criar um pool CLMM com fee tier de 0.25%
- Abrir uma posição com range de +-10% do preço inicial
- Realizar um swap de teste
- Coletar fees da posição

## Conceitos necessários

- CLMM e tick spacing
- Posição com tick inferior e superior
- Quote de swap com slippage
- Coleta de fees acumuladas

## Dicas

- Use o Raydium SDK V2 para interações simplificadas
- O \`tickSpacing\` é determinado pelo fee tier
- Calcule ticks a partir do preço desejado com \`TickUtils\`
- Sempre defina slippage ao executar swaps`,
          exercise: {
            question:
              "Ao criar uma posição em um pool CLMM, o que define o range de preço onde sua liquidez fica ativa?",
            options: [
              "O valor total depositado em cada token",
              "Os ticks inferior (tickLower) e superior (tickUpper)",
              "O fee tier configurado no pool",
              "A quantidade de SOL usada como priority fee",
            ],
            correctIndex: 1,
          },
          challenge: {
            prompt:
              "Complete o código para criar um pool CLMM no Raydium, adicionar liquidez e executar um swap. Preencha os TODOs indicados.",
            starterCode: `import { Raydium, TxVersion } from '@raydium-io/raydium-sdk-v2';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import BN from 'bn.js';

const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
const wallet = Keypair.generate();

async function main() {
  // TODO 1: Inicializar o Raydium SDK
  // Dica: use Raydium.load({ connection, owner: wallet, cluster: 'devnet' })
  const raydium = null; // substitua

  // TODO 2: Definir os parâmetros do pool
  // mintA: token A mint address
  // mintB: token B mint address
  // initialPrice: preço inicial (ex: 150)
  // configId: fee tier config (0.25%)

  // TODO 3: Calcular ticks para um range de +-10% do preço inicial
  // tickLower: tick correspondente a preço * 0.9
  // tickUpper: tick correspondente a preço * 1.1

  // TODO 4: Abrir posição com liquidez
  // Dica: use raydium.clmm.openPositionFromBase({
  //   poolInfo, base: 'MintA', baseAmount: new BN(1_000_000_000),
  //   tickLower, tickUpper
  // })

  // TODO 5: Executar um swap
  // Dica: use raydium.clmm.swap({
  //   poolInfo, inputMint, amountIn, slippage: 0.01
  // })
}

main().catch(console.error);`,
            language: "typescript",
            testCases: [
              { input: "Raydium.load", expected: "connection" },
              { input: "tickLower", expected: "tickUpper" },
              { input: "openPositionFromBase", expected: "poolInfo" },
              { input: "swap", expected: "slippage" },
            ],
          },
        },
      ],
    },
  ],
};

export const course9: Course = {
  id: "9",
  slug: "anchor-avancado",
  title: "Anchor avançado",
  description:
    "CPIs, eventos, zero-copy, segurança e automação de programas Solana.",
  longDescription:
    "Domine padrões avançados do framework Anchor: Cross-Program Invocations, eventos e indexação, otimização de memória com zero-copy, segurança de programas, upgrades e automação com Clockwork.",
  difficulty: "advanced",
  duration: "long",
  totalDurationMinutes: 310,
  xpTotal: 890,
  thumbnail: "/courses/anchor-avancado.png",
  instructor: {
    name: "Ana Silva",
    avatar: "https://i.pravatar.cc/400?img=22",
    role: "Instrutora · Rust & Solana",
  },
  instructorSlug: "ana-silva",
  track: "Full Stack",
  modules: [
    {
      id: "m9",
      title: "Anchor Avançado",
      lessons: [
        {
          id: "l58",
          title: "Revisão: Anchor fundamentals",
          slug: "revisao-anchor",
          type: "content",
          durationMinutes: 25,
          xpReward: 80,
          content: `# Revisão: Anchor Fundamentals

## O que é Anchor?

O **Anchor** é o framework mais popular para desenvolvimento de programas (smart contracts) no Solana. Ele abstrai grande parte da complexidade do runtime do Solana e fornece:

- **Serialização/Deserialização** automática com Borsh
- **Validação de contas** declarativa com macros
- **IDL** (Interface Definition Language) gerada automaticamente
- **Client SDK** para TypeScript gerado a partir do IDL

## Estrutura de um programa Anchor

\`\`\`rust
use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod meu_programa {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, data: u64) -> Result<()> {
        let conta = &mut ctx.accounts.minha_conta;
        conta.data = data;
        conta.authority = ctx.accounts.authority.key();
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + MinhaConta::INIT_SPACE
    )]
    pub minha_conta: Account<'info, MinhaConta>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct MinhaConta {
    pub data: u64,        // 8 bytes
    pub authority: Pubkey, // 32 bytes
}
\`\`\`

## Conceitos fundamentais

### Discriminator (8 bytes)

Todo account Anchor começa com 8 bytes de **discriminator** — um hash SHA256 do nome da struct. Isso garante que a conta é do tipo esperado.

### Context e Accounts

O \`Context<T>\` contém:
- \`accounts\`: as contas validadas
- \`program_id\`: o ID do programa
- \`remaining_accounts\`: contas extras não tipadas
- \`bumps\`: bumps de PDAs

### PDAs no Anchor

\`\`\`rust
#[account(
    init,
    payer = authority,
    space = 8 + 32 + 8,
    seeds = [b"user", authority.key().as_ref()],
    bump
)]
pub user_account: Account<'info, UserAccount>,
\`\`\`

### Error Handling

\`\`\`rust
#[error_code]
pub enum MeuErro {
    #[msg("Valor excede o máximo permitido")]
    ValorExcedido,
    #[msg("Autoridade inválida")]
    AutoridadeInvalida,
}

// Uso
require!(valor <= MAX, MeuErro::ValorExcedido);
\`\`\`

## Testes com Anchor

\`\`\`typescript
import * as anchor from '@coral-xyz/anchor';

describe('meu_programa', () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.MeuPrograma;

  it('initializes', async () => {
    const conta = anchor.web3.Keypair.generate();
    await program.methods
      .initialize(new anchor.BN(42))
      .accounts({ minhaConta: conta.publicKey })
      .signers([conta])
      .rpc();
  });
});
\`\`\``,
          exercise: {
            question:
              "Qual é a função do discriminator de 8 bytes em uma account Anchor?",
            options: [
              "Armazenar o saldo em lamports da conta",
              "Identificar o tipo da conta através de um hash, garantindo que é do tipo esperado",
              "Criptografar os dados da conta para privacidade",
              "Definir o tamanho máximo que a conta pode ter",
            ],
            correctIndex: 1,
          },
        },
        {
          id: "l59",
          title: "Cross-Program Invocations (CPIs)",
          slug: "cross-program-invocations",
          type: "content",
          durationMinutes: 40,
          xpReward: 120,
          content: `# Cross-Program Invocations (CPIs)

## O que são CPIs?

**Cross-Program Invocations** permitem que um programa Solana chame instruções de **outro programa**. Isso é a base da **composabilidade** no Solana — programas podem interagir entre si como blocos de construção.

## invoke vs invoke_signed

### invoke

Usado quando as contas signatárias são **wallets externas** que já assinaram a transação:

\`\`\`rust
use anchor_lang::solana_program::program::invoke;

invoke(
    &transfer_instruction,
    &[
        ctx.accounts.from.to_account_info(),
        ctx.accounts.to.to_account_info(),
    ],
)?;
\`\`\`

### invoke_signed

Usado quando um **PDA** precisa assinar. O programa fornece as seeds para que o runtime derive a assinatura:

\`\`\`rust
use anchor_lang::solana_program::program::invoke_signed;

let seeds = &[b"vault", &[bump]];
let signer_seeds = &[&seeds[..]];

invoke_signed(
    &transfer_instruction,
    &[
        ctx.accounts.vault.to_account_info(),
        ctx.accounts.destination.to_account_info(),
    ],
    signer_seeds,
)?;
\`\`\`

## CPIs no Anchor (CpiContext)

O Anchor simplifica CPIs com \`CpiContext\`:

### Transferência de SOL

\`\`\`rust
use anchor_lang::system_program::{transfer, Transfer};

let cpi_accounts = Transfer {
    from: ctx.accounts.vault.to_account_info(),
    to: ctx.accounts.user.to_account_info(),
};

let seeds = &[b"vault", &[ctx.bumps.vault]];
let signer_seeds = &[&seeds[..]];

let cpi_ctx = CpiContext::new_with_signer(
    ctx.accounts.system_program.to_account_info(),
    cpi_accounts,
    signer_seeds,
);

transfer(cpi_ctx, amount)?;
\`\`\`

### Mintando tokens via CPI

\`\`\`rust
use anchor_spl::token::{mint_to, MintTo};

let cpi_accounts = MintTo {
    mint: ctx.accounts.mint.to_account_info(),
    to: ctx.accounts.token_account.to_account_info(),
    authority: ctx.accounts.mint_authority.to_account_info(),
};

let cpi_ctx = CpiContext::new_with_signer(
    ctx.accounts.token_program.to_account_info(),
    cpi_accounts,
    signer_seeds,
);

mint_to(cpi_ctx, 1_000_000_000)?; // 1 token (9 decimais)
\`\`\`

## Limites e considerações

- **Profundidade máxima**: 4 níveis de CPI encadeadas
- **Compute budget**: CPIs compartilham o compute budget da transação principal
- **Segurança**: sempre validar o \`program_id\` do programa chamado
- **Re-entrancy**: Solana previne re-entrancy nativamente (um programa não pode chamar a si mesmo via CPI)

## Padrão: Programa Intermediário

\`\`\`
Usuário → Programa A (seu protocolo)
              ├── CPI → Token Program (mint tokens)
              ├── CPI → System Program (transferir SOL)
              └── CPI → Programa B (outro protocolo)
\`\`\`

## Depuração de CPIs

\`\`\`bash
# Logs de CPI aparecem indentados no explorer
# "Program X invoke [2]" = CPI de nível 2
Program 11111111111111111111111111111111 invoke [1]
Program log: Transfer
  Program TokenkegQ... invoke [2]
  Program log: MintTo
  Program TokenkegQ... success
Program 11111111111111111111111111111111 success
\`\`\``,
          exercise: {
            question:
              "Quando você deve usar invoke_signed em vez de invoke em uma CPI?",
            options: [
              "Quando a CPI envolve o System Program",
              "Quando um PDA precisa assinar a transação, pois PDAs não têm chave privada",
              "Quando a transação tem mais de 2 assinaturas",
              "Quando o programa chamado requer mais compute units",
            ],
            correctIndex: 1,
          },
        },
        {
          id: "l60",
          title: "Eventos e indexação",
          slug: "eventos-indexacao",
          type: "content",
          durationMinutes: 35,
          xpReward: 100,
          content: `# Eventos e Indexação

## Por que eventos?

Programas Solana são como backends — eles processam transações, mas **não notificam** clientes proativamente. **Eventos** resolvem isso permitindo que programas emitam dados estruturados que podem ser:

- **Capturados** em tempo real por WebSocket
- **Indexados** para consultas históricas
- **Processados** por sistemas off-chain

## Eventos no Anchor

### Definindo um evento

\`\`\`rust
#[event]
pub struct SwapExecuted {
    pub user: Pubkey,
    pub token_in: Pubkey,
    pub token_out: Pubkey,
    pub amount_in: u64,
    pub amount_out: u64,
    pub timestamp: i64,
}
\`\`\`

### Emitindo um evento

\`\`\`rust
pub fn execute_swap(ctx: Context<ExecuteSwap>, amount_in: u64) -> Result<()> {
    // ... lógica do swap ...

    emit!(SwapExecuted {
        user: ctx.accounts.user.key(),
        token_in: ctx.accounts.token_in_mint.key(),
        token_out: ctx.accounts.token_out_mint.key(),
        amount_in,
        amount_out: calculated_output,
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}
\`\`\`

## Como eventos funcionam internamente

1. \`emit!\` serializa o evento com Borsh
2. Adiciona um **discriminator** de 8 bytes (hash SHA256 do nome do evento)
3. Chama \`sol_log_data\` com os dados serializados
4. O dado aparece no campo \`data\` dos logs da transação

## Consumindo eventos no client

\`\`\`typescript
// Listener em tempo real
const listenerId = program.addEventListener('SwapExecuted', (event, slot) => {
  console.log('Swap:', event.user.toBase58());
  console.log('Amount in:', event.amountIn.toString());
  console.log('Amount out:', event.amountOut.toString());
});

// Remover listener
program.removeEventListener(listenerId);
\`\`\`

## Indexação com Helius

O **Helius** oferece webhooks e APIs para indexar eventos:

\`\`\`typescript
// Helius Enhanced Transactions API
const txns = await fetch(
  \`https://api.helius.xyz/v0/transactions?api-key=\${API_KEY}\`,
  {
    method: 'POST',
    body: JSON.stringify({ query: { programIds: [PROGRAM_ID] } }),
  }
);
\`\`\`

## Indexação com Yellowstone (Geyser)

O **Yellowstone** (Geyser plugin) fornece streaming de dados em tempo real via gRPC:

\`\`\`typescript
import { Client } from '@triton-one/yellowstone-grpc';

const client = new Client(GEYSER_ENDPOINT, TOKEN);
const stream = await client.subscribe();

stream.on('data', (update) => {
  if (update.transaction) {
    const logs = update.transaction.transaction.meta.logMessages;
    // Parse evento dos logs
  }
});

// Filtrar por programa
await stream.write({
  transactions: {
    myFilter: {
      accountInclude: [PROGRAM_ID],
    },
  },
});
\`\`\`

## Boas práticas

- Emitir eventos para **todas as ações** importantes (swaps, deposits, withdrawals)
- Incluir **timestamps** e **slots** para ordenação
- Usar **tipos específicos** (Pubkey, u64) para facilitar indexação
- Manter eventos **compatíveis** entre versões do programa`,
          exercise: {
            question:
              "Qual função do Anchor é usada para emitir um evento a partir de uma instrução?",
            options: ["log!()", "emit!()", "msg!()", "event!()"],
            correctIndex: 1,
          },
        },
        {
          id: "l61",
          title: "Zero-copy e otimização de memória",
          slug: "zero-copy-otimizacao",
          type: "content",
          durationMinutes: 40,
          xpReward: 120,
          content: `# Zero-Copy e Otimização de Memória

## O problema

Toda account Anchor padrão é **deserializada inteiramente** na heap ao acessar. Para contas pequenas (< 1KB), isso é eficiente. Mas para contas grandes (ex: order books, pools com muitos ticks), a deserialização pode:

- **Consumir compute units** excessivas
- **Estourar o heap** (32KB no Solana)
- **Aumentar a latência** da transação

## Zero-Copy: a solução

A macro \`#[account(zero_copy)]\` faz o Anchor mapear a memória da conta **diretamente** sem deserialização Borsh. Os dados são acessados como um **ponteiro** para a região de memória.

### Antes (padrão):
\`\`\`
Account data → Borsh deserialize → Struct na heap → uso → Borsh serialize → Account data
\`\`\`

### Com zero-copy:
\`\`\`
Account data → Ponteiro direto → uso → escrita direta → Account data
\`\`\`

## Implementação

\`\`\`rust
use anchor_lang::prelude::*;

// Conta zero-copy deve usar repr(C) para layout determinístico
#[account(zero_copy)]
#[repr(C)]
pub struct OrderBook {
    pub authority: Pubkey,          // 32 bytes
    pub head: u32,                  // 4 bytes
    pub count: u32,                 // 4 bytes
    pub orders: [Order; 256],       // 256 * sizeof(Order) bytes
}

#[zero_copy]
#[repr(C)]
pub struct Order {
    pub price: u64,      // 8 bytes
    pub amount: u64,     // 8 bytes
    pub owner: Pubkey,   // 32 bytes
    pub side: u8,        // 1 byte
    pub _padding: [u8; 7], // 7 bytes (alinhamento)
}
\`\`\`

## AccountLoader

Para acessar contas zero-copy, use \`AccountLoader\` em vez de \`Account\`:

\`\`\`rust
#[derive(Accounts)]
pub struct PlaceOrder<'info> {
    #[account(mut)]
    pub order_book: AccountLoader<'info, OrderBook>,
    pub authority: Signer<'info>,
}

pub fn place_order(ctx: Context<PlaceOrder>, price: u64, amount: u64) -> Result<()> {
    // Acesso mutável
    let mut book = ctx.accounts.order_book.load_mut()?;

    let idx = book.count as usize;
    book.orders[idx] = Order {
        price,
        amount,
        owner: ctx.accounts.authority.key(),
        side: 0,
        _padding: [0; 7],
    };
    book.count += 1;

    Ok(())
}
\`\`\`

## Regras importantes

1. **repr(C)**: obrigatório para layout de memória determinístico
2. **Padding**: campos devem ser alinhados manualmente (Rust C layout rules)
3. **Tipos permitidos**: apenas tipos primitivos e arrays de tamanho fixo (sem Vec, String, etc.)
4. **Discriminator**: 8 bytes, como contas normais

## Comparação de performance

| Operação | Account padrão | Zero-copy |
|---|---|---|
| Leitura (1KB) | ~2,000 CU | ~200 CU |
| Leitura (10KB) | ~20,000 CU | ~200 CU |
| Escrita (1KB) | ~2,500 CU | ~300 CU |
| Escrita (10KB) | ~25,000 CU | ~300 CU |
| Tamanho máximo prático | ~10KB | ~10MB |

## Quando usar

- **Use zero-copy** quando: contas > 1KB, muitos campos, arrays grandes, performance crítica
- **Use padrão** quando: contas pequenas, tipos complexos (String, Vec), simplicidade é prioridade

## Limitação: sem tipos dinâmicos

\`\`\`rust
// NÃO funciona com zero-copy:
pub struct Conta {
    pub nome: String,       // tamanho dinâmico
    pub items: Vec<Item>,   // tamanho dinâmico
}

// FUNCIONA:
#[zero_copy]
#[repr(C)]
pub struct Conta {
    pub nome: [u8; 32],       // tamanho fixo
    pub items: [Item; 100],   // tamanho fixo
}
\`\`\``,
          exercise: {
            question:
              "Qual é o principal benefício da macro #[account(zero_copy)] no Anchor?",
            options: [
              "Permite usar tipos dinâmicos como Vec e String nas contas",
              "Elimina a necessidade de pagar rent para a conta",
              "Acessa os dados diretamente na memória sem deserialização Borsh, reduzindo compute units",
              "Comprime os dados da conta para ocupar menos espaço",
            ],
            correctIndex: 2,
          },
        },
        {
          id: "l62",
          title: "Segurança de programas",
          slug: "seguranca-programas",
          type: "content",
          durationMinutes: 40,
          xpReward: 120,
          content: `# Segurança de Programas Solana

## Por que segurança é crítica?

Programas Solana gerenciam **dinheiro real**. Uma única vulnerabilidade pode resultar na perda de milhões. A maioria dos exploits no Solana vem de erros de validação.

## Vulnerabilidades comuns

### 1. Missing Signer Check

**Problema**: não verificar se o chamador realmente assinou a transação.

\`\`\`rust
// VULNERÁVEL - qualquer pessoa pode chamar
pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
    // transfere sem verificar quem é o authority
    transfer(ctx, amount)?;
    Ok(())
}

// SEGURO - Anchor valida o Signer automaticamente
#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut, has_one = authority)]
    pub vault: Account<'info, Vault>,
    pub authority: Signer<'info>, // ← garante assinatura
}
\`\`\`

### 2. Missing Owner Check

**Problema**: não verificar se a conta pertence ao programa esperado.

\`\`\`rust
// VULNERÁVEL - atacante pode passar conta de outro programa
pub fn process(ctx: Context<Process>) -> Result<()> {
    let data = &ctx.accounts.data_account;
    // ... usa data sem verificar owner
}

// SEGURO - Anchor Account<'info, T> verifica owner automaticamente
#[derive(Accounts)]
pub struct Process<'info> {
    pub data_account: Account<'info, MyData>, // owner = this program
}
\`\`\`

### 3. Account Substitution

**Problema**: um atacante substitui uma conta esperada por outra.

\`\`\`rust
// SEGURO - has_one garante que vault.authority == authority
#[derive(Accounts)]
pub struct Secure<'info> {
    #[account(has_one = authority)]
    pub vault: Account<'info, Vault>,
    pub authority: Signer<'info>,
}
\`\`\`

### 4. Arithmetic Overflow/Underflow

\`\`\`rust
// VULNERÁVEL
let result = a + b; // pode overflow em u64

// SEGURO
let result = a.checked_add(b).ok_or(ErrorCode::MathOverflow)?;
\`\`\`

### 5. PDA Seed Collision

\`\`\`rust
// VULNERÁVEL - seeds genéricas podem colidir
seeds = [b"account"]

// SEGURO - seeds únicas por usuário
seeds = [b"account", user.key().as_ref()]
\`\`\`

## Constraints do Anchor

O Anchor oferece constraints declarativas para segurança:

\`\`\`rust
#[derive(Accounts)]
pub struct SecureAccounts<'info> {
    // Verifica que vault.authority == authority
    #[account(mut, has_one = authority)]
    pub vault: Account<'info, Vault>,

    // Verifica assinatura
    pub authority: Signer<'info>,

    // Verifica PDA com seeds e bump
    #[account(
        seeds = [b"config", authority.key().as_ref()],
        bump = config.bump,
    )]
    pub config: Account<'info, Config>,

    // Verifica que é o System Program correto
    pub system_program: Program<'info, System>,

    // Constraint customizado
    #[account(constraint = amount > 0 @ ErrorCode::InvalidAmount)]
    pub amount_account: Account<'info, AmountData>,
}
\`\`\`

## Checklist de segurança

1. Todas as contas têm **signer checks** apropriados?
2. Todas as contas têm **owner checks**?
3. PDAs usam **seeds únicas** e verificam **bumps**?
4. Aritmética usa **checked_** operations?
5. **has_one** constraints validam relações entre contas?
6. Accounts não podem ser **substituídas** por contas maliciosas?
7. O programa lida com **re-initialization** attacks?
8. Dados de entrada são **validados** (ranges, limites)?

## Ferramentas de auditoria

- **Anchor verificável**: \`anchor build --verifiable\` para builds determinísticos
- **Soteria**: análise estática de segurança para Solana
- **Sec3 (X-ray)**: scanner automático de vulnerabilidades
- **Auditorias profissionais**: OtterSec, Neodyme, Trail of Bits`,
          exercise: {
            question:
              "Qual vulnerabilidade ocorre quando um programa não verifica se o chamador realmente assinou a transação?",
            options: [
              "PDA Seed Collision",
              "Arithmetic Overflow",
              "Missing Signer Check",
              "Account Substitution",
            ],
            correctIndex: 2,
          },
        },
        {
          id: "l63",
          title: "Upgradeable programs",
          slug: "upgradeable-programs",
          type: "content",
          durationMinutes: 35,
          xpReward: 100,
          content: `# Upgradeable Programs

## Como programas são deployados no Solana?

No Solana, programas são armazenados em contas especiais gerenciadas pelo **BPF Upgradeable Loader**. Um deploy cria três contas:

1. **Program Account**: endereço público do programa (imutável)
2. **ProgramData Account**: contém o bytecode do programa (atualizável)
3. **Buffer Account**: temporária, usada durante upload

\`\`\`
┌─────────────────────┐
│   Program Account   │
│   (endereço fixo)   │──→ ProgramData Account
│                     │     ├── upgrade_authority: Pubkey
└─────────────────────┘     ├── slot_deployed: u64
                            └── bytecode: [u8]
\`\`\`

## Upgrade Authority

A **upgrade authority** é a chave que pode atualizar o programa. Quem controla essa chave, controla o programa.

### Atualizando um programa

\`\`\`bash
# Deploy inicial
anchor deploy --provider.cluster devnet

# Upgrade (novo bytecode, mesmo endereço)
anchor upgrade target/deploy/meu_programa.so \\
  --program-id <PROGRAM_ID> \\
  --provider.cluster devnet
\`\`\`

### Transferindo authority

\`\`\`bash
solana program set-upgrade-authority <PROGRAM_ID> \\
  --new-upgrade-authority <NOVA_PUBKEY>
\`\`\`

### Tornando imutável

\`\`\`bash
# CUIDADO: irreversível!
solana program set-upgrade-authority <PROGRAM_ID> --final
\`\`\`

Após \`--final\`, o programa **nunca mais** pode ser atualizado. Isso é ideal para protocolos que querem garantir imutabilidade total.

## Estratégias de upgrade

### 1. Multisig Authority

Use um multisig (Squads Protocol) como upgrade authority:

\`\`\`
Authority = Squads Multisig (2 de 3)
├── Dev Team Key
├── Security Auditor Key
└── Community Council Key
\`\`\`

### 2. Timelock

Adicione um atraso (ex: 72h) antes que upgrades entrem em vigor, dando tempo para a comunidade revisar.

### 3. Upgrade progressivo

1. Deploy com upgrade authority → correções rápidas
2. Após auditoria, transferir para multisig
3. Após maturidade, tornar imutável (\`--final\`)

## Fechando programas

É possível **fechar** um programa e recuperar os lamports da conta de dados:

\`\`\`bash
solana program close <PROGRAM_ID> \\
  --recipient <WALLET_ADDRESS>
\`\`\`

**Atenção**: fechar um programa é destrutivo. O endereço continua existindo, mas qualquer instrução falhará.

## Verificação on-chain

Qualquer pessoa pode verificar se um programa é atualizável:

\`\`\`typescript
import { Connection, PublicKey } from '@solana/web3.js';

const programInfo = await connection.getAccountInfo(programId);
const programDataAddress = new PublicKey(programInfo.data.slice(4, 36));
const programData = await connection.getAccountInfo(programDataAddress);

// Bytes 0-4: tipo da conta
// Bytes 4-12: slot do último deploy
// Bytes 12-13: flag de upgrade authority
// Bytes 13-45: upgrade authority pubkey (se existe)

const hasAuthority = programData.data[12] === 1;
const authority = hasAuthority
  ? new PublicKey(programData.data.slice(13, 45))
  : null;

console.log('Upgradeable:', hasAuthority);
console.log('Authority:', authority?.toBase58() ?? 'IMUTÁVEL');
\`\`\``,
          exercise: {
            question:
              'O que acontece quando você executa "solana program set-upgrade-authority --final" em um programa?',
            options: [
              "O programa é deletado da blockchain",
              "A upgrade authority é transferida para o System Program",
              "O programa se torna permanentemente imutável e nunca mais pode ser atualizado",
              "O programa é pausado temporariamente por 72 horas",
            ],
            correctIndex: 2,
          },
        },
        {
          id: "l64",
          title: "Clockwork e automação",
          slug: "clockwork-automacao",
          type: "content",
          durationMinutes: 35,
          xpReward: 100,
          content: `# Clockwork e Automação no Solana

## O problema

Programas Solana são **reativos** — eles só executam quando alguém envia uma transação. Não existe um "cron job" nativo na blockchain. Mas muitos protocolos precisam de execução automatizada:

- **DCA** (Dollar Cost Averaging): comprar X tokens todo dia
- **Liquidações**: liquidar posições sub-colateralizadas periodicamente
- **Vesting**: liberar tokens em datas específicas
- **Oráculos**: atualizar preços em intervalos regulares
- **Auto-compound**: reinvestir rewards de staking

## Clockwork

O **Clockwork** foi o protocolo pioneiro de automação no Solana (descontinuado em 2024, mas os conceitos permanecem relevantes).

### Conceito: Threads

Um **thread** é uma instrução agendada que executa automaticamente:

\`\`\`rust
// Pseudocódigo do conceito
Thread {
    authority: Pubkey,        // quem controla
    trigger: Trigger,         // quando executar
    instructions: Vec<Ix>,    // o que executar
    rate_limit: u64,          // max execuções por slot
}

enum Trigger {
    Cron { schedule: String },  // "0 0 * * *" (todo dia à meia-noite)
    Account { address: Pubkey }, // quando conta muda
    Epoch { epoch: u64 },       // a cada N epochs
    Slot { slot: u64 },         // a cada N slots
    Immediate,                  // o mais rápido possível
}
\`\`\`

## Alternativas atuais

### 1. Jito Bundles + Keeper Bots

A abordagem mais comum atualmente: bots off-chain que monitoram condições e enviam transações via Jito:

\`\`\`typescript
import { SearcherClient } from 'jito-ts/dist/sdk/block-engine/searcher';

async function keeperLoop() {
  while (true) {
    // Verificar condição on-chain
    const shouldExecute = await checkCondition();

    if (shouldExecute) {
      const tx = buildTransaction();
      const bundle = new Bundle([tx], tipAmount);
      await jitoClient.sendBundle(bundle);
    }

    await sleep(1000); // check a cada 1s
  }
}
\`\`\`

### 2. Helius Webhooks

O Helius pode notificar seu backend quando condições on-chain mudam:

\`\`\`typescript
// Webhook configurado no Helius dashboard
// Dispara quando a conta do oráculo atualiza
app.post('/webhook', async (req, res) => {
  const { accountData } = req.body;
  const price = parseOraclePrice(accountData);

  if (price < LIQUIDATION_THRESHOLD) {
    await executeLiquidation();
  }

  res.status(200).send('ok');
});
\`\`\`

### 3. Solana Actions + Blinks

Para automações iniciadas pelo usuário, Solana Actions permitem executar transações a partir de URLs:

\`\`\`typescript
// API endpoint que retorna uma transação pronta
app.get('/api/action/auto-compound', async (req, res) => {
  const tx = await buildAutoCompoundTx(req.query.wallet);
  res.json({
    transaction: tx.serialize().toString('base64'),
    message: 'Auto-compound de staking rewards',
  });
});
\`\`\`

## Padrão: Crank

O padrão **crank** é o mais simples: uma instrução pública que qualquer pessoa pode chamar, com incentivo econômico:

\`\`\`rust
pub fn crank(ctx: Context<Crank>) -> Result<()> {
    let clock = Clock::get()?;
    let state = &mut ctx.accounts.state;

    // Verificar se já passou tempo suficiente
    require!(
        clock.unix_timestamp >= state.last_crank + INTERVAL,
        ErrorCode::TooEarly
    );

    // Executar lógica automatizada
    execute_periodic_task(state)?;

    // Recompensar o cranker
    transfer_reward(ctx, CRANK_REWARD)?;

    state.last_crank = clock.unix_timestamp;
    Ok(())
}
\`\`\`

## Comparação de abordagens

| Abordagem | Decentralização | Custo | Complexidade |
|---|---|---|---|
| Keeper bot (Jito) | Baixa | Médio | Média |
| Helius webhook | Baixa | Baixo | Baixa |
| Crank pattern | Alta | Variável | Média |
| Clockwork (legado) | Alta | Baixo | Baixa |`,
          exercise: {
            question: 'O que é o padrão "crank" em programas Solana?',
            options: [
              "Um mecanismo de compressão de dados on-chain",
              "Uma instrução pública que qualquer pessoa pode chamar para executar lógica periódica, geralmente com recompensa",
              "Um tipo especial de PDA para armazenar dados temporários",
              "Uma extensão do Token-2022 para automação de transferências",
            ],
            correctIndex: 1,
          },
        },
        {
          id: "l65",
          title: "Projeto final: protocolo DeFi",
          slug: "projeto-final-protocolo",
          type: "challenge",
          durationMinutes: 60,
          xpReward: 150,
          content: `# Projeto Final: Protocolo DeFi de Lending/Borrowing

## Objetivo

Neste projeto final, você vai construir o esqueleto de um **protocolo de lending/borrowing** no Solana usando Anchor. O protocolo permite:

1. **Depositar** colateral (SOL ou tokens)
2. **Emprestar** tokens com base no colateral
3. **Pagar** empréstimos com juros
4. **Liquidar** posições sub-colateralizadas

## Arquitetura

\`\`\`
┌─────────────────────────────────┐
│          Lending Program         │
│                                  │
│  ┌──────────┐  ┌──────────────┐ │
│  │  Market   │  │   Position   │ │
│  │   PDA     │  │     PDA      │ │
│  │           │  │ (per user)   │ │
│  │ - mint    │  │ - collateral │ │
│  │ - rate    │  │ - borrowed   │ │
│  │ - total   │  │ - last_update│ │
│  └──────────┘  └──────────────┘ │
│        │              │          │
│  CPI: Token Program (SPL/2022)  │
│  CPI: System Program             │
│  CPI: Oracle (Pyth/Switchboard)  │
└─────────────────────────────────┘
\`\`\`

## Contas do protocolo

- **Market**: PDA global com configurações (taxa de juros, LTV ratio, liquidation threshold)
- **Position**: PDA por usuário com colateral depositado e valor emprestado
- **Vault**: token account do programa que guarda os depósitos
- **Oracle**: feed de preço para calcular colateralização

## Instruções

1. \`initialize_market\` — cria o Market PDA
2. \`deposit_collateral\` — deposita tokens como colateral
3. \`borrow\` — empresta tokens (CPI para token program)
4. \`repay\` — paga empréstimo com juros acumulados
5. \`liquidate\` — liquida posição com LTV acima do threshold

## Dicas

- Use \`Clock::get()?\` para calcular juros acumulados
- Implemente \`checked_mul\` e \`checked_div\` para aritmética segura
- Use CPIs para transferências de tokens
- O oráculo pode ser simulado com uma conta de preço simples`,
          exercise: {
            question:
              "Em um protocolo de lending, o que acontece quando o LTV (Loan-to-Value) de uma posição ultrapassa o liquidation threshold?",
            options: [
              "O empréstimo é automaticamente perdoado pelo protocolo",
              "A posição pode ser liquidada por um terceiro, que recebe parte do colateral como incentivo",
              "O protocolo aumenta automaticamente a taxa de juros",
              "A posição é congelada até o usuário depositar mais colateral",
            ],
            correctIndex: 1,
          },
          challenge: {
            prompt:
              "Complete o programa Anchor de lending/borrowing. Implemente as instruções deposit_collateral e borrow com as validações de segurança necessárias.",
            starterCode: `use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("Lend111111111111111111111111111111111111111");

#[program]
pub mod lending {
    use super::*;

    pub fn initialize_market(
        ctx: Context<InitializeMarket>,
        interest_rate_bps: u16,
        ltv_ratio: u16,          // ex: 7500 = 75%
        liquidation_threshold: u16, // ex: 8500 = 85%
    ) -> Result<()> {
        let market = &mut ctx.accounts.market;
        market.authority = ctx.accounts.authority.key();
        market.interest_rate_bps = interest_rate_bps;
        market.ltv_ratio = ltv_ratio;
        market.liquidation_threshold = liquidation_threshold;
        market.total_deposits = 0;
        market.total_borrows = 0;
        market.bump = ctx.bumps.market;
        Ok(())
    }

    // TODO: Implemente deposit_collateral
    // 1. Transferir tokens do usuário para o vault (CPI)
    // 2. Atualizar position.collateral_amount
    // 3. Emitir evento DepositEvent
    pub fn deposit_collateral(
        ctx: Context<DepositCollateral>,
        amount: u64,
    ) -> Result<()> {
        // Seu código aqui
        Ok(())
    }

    // TODO: Implemente borrow
    // 1. Verificar que collateral * ltv >= borrowed + new_amount
    // 2. Transferir tokens do vault para o usuário (CPI com PDA signer)
    // 3. Atualizar position.borrowed_amount
    // 4. Emitir evento BorrowEvent
    pub fn borrow(
        ctx: Context<Borrow>,
        amount: u64,
    ) -> Result<()> {
        // Seu código aqui
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeMarket<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Market::INIT_SPACE,
        seeds = [b"market"],
        bump
    )]
    pub market: Account<'info, Market>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

// TODO: Defina DepositCollateral accounts struct
// Precisa: market, position (init_if_needed), vault, user_token_account,
//          user (signer), token_program, system_program

// TODO: Defina Borrow accounts struct
// Precisa: market, position (mut, has_one), vault (mut),
//          user_token_account, user (signer), token_program

#[account]
#[derive(InitSpace)]
pub struct Market {
    pub authority: Pubkey,
    pub interest_rate_bps: u16,
    pub ltv_ratio: u16,
    pub liquidation_threshold: u16,
    pub total_deposits: u64,
    pub total_borrows: u64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct Position {
    pub owner: Pubkey,
    pub collateral_amount: u64,
    pub borrowed_amount: u64,
    pub last_update: i64,
    pub bump: u8,
}

#[event]
pub struct DepositEvent {
    pub user: Pubkey,
    pub amount: u64,
    pub total_collateral: u64,
}

#[event]
pub struct BorrowEvent {
    pub user: Pubkey,
    pub amount: u64,
    pub total_borrowed: u64,
}

#[error_code]
pub enum LendingError {
    #[msg("Insufficient collateral for this borrow amount")]
    InsufficientCollateral,
    #[msg("Math overflow")]
    MathOverflow,
}`,
            language: "rust",
            testCases: [
              { input: "deposit_collateral", expected: "token::transfer" },
              { input: "collateral_amount", expected: "checked_add" },
              { input: "borrow", expected: "InsufficientCollateral" },
              { input: "CpiContext::new_with_signer", expected: "seeds" },
            ],
          },
        },
      ],
    },
  ],
};
