import { registerLessonContent } from "./courses-i18n";

// ============================================================
// English (EN) translations for Courses 7–9 (lessons l44–l65)
// ============================================================

registerLessonContent("en", {
  // ── Course 7: Advanced SPL Token ──────────────────────────

  l44: {
    content: `# SPL Token vs Token-2022

## Historical Context

The original **SPL Token** program was launched in 2020 and became the standard for fungible and non-fungible tokens on Solana. However, its architecture is limited: every new feature would require a fork or a wrapper program.

In 2022, Solana Labs introduced **Token-2022** (also called Token Extensions), a new program that maintains **backward compatibility** with the original SPL Token and adds a system of **modular extensions**.

## Key Differences

| Feature | SPL Token | Token-2022 |
|---|---|---|
| Program ID | \`TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA\` | \`TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb\` |
| Extensions | Not supported | Supported (transfer fee, confidential, etc.) |
| Compatibility | Legacy standard | Backward compatible with SPL Token |
| Mint Size | Fixed 82 bytes | Variable (82 + extensions) |

## Backward Compatibility

Token-2022 accepts the **same instructions** as the original SPL Token. This means existing wallets and DEXs can interact with Token-2022 tokens without changes — as long as they don't use extensions that require special handling (such as transfer fees).

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

## When to Use Each One?

- **SPL Token**: simple projects, maximum compatibility with legacy DEXs
- **Token-2022**: when you need transfer fees, confidential tokens, on-chain metadata, or any extension`,
    exerciseQuestion:
      "What is the main advantage of Token-2022 over the original SPL Token?",
    exerciseOptions: [
      "It is faster in terms of TPS",
      "It supports modular extensions like transfer fees and confidential transfers",
      "It uses fewer compute units per transaction",
      "It is the only program that supports NFTs on Solana",
    ],
  },

  l45: {
    content: `# Mint Authority and Freeze Authority

## What Are Authorities?

On Solana, each **Mint** (token) has two optional authorities:

- **Mint Authority**: who can create (mint) new tokens
- **Freeze Authority**: who can freeze and unfreeze token accounts

These authorities are public keys defined at the time the mint is created and can be changed or **revoked** permanently.

## Mint Authority

The mint authority controls the token's **supply**. Only this key can call the \`MintTo\` instruction.

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

The freeze authority can **freeze** a token account, preventing any transfers. It is used for compliance, regulated stablecoins, and anti-fraud mechanisms.

\`\`\`typescript
import { freezeAccount, thawAccount } from '@solana/spl-token';

// Congelar conta
await freezeAccount(connection, payer, tokenAccount, mint, freezeAuthority);

// Descongelar
await thawAccount(connection, payer, tokenAccount, mint, freezeAuthority);
\`\`\`

## Multisig Authority

For greater security, you can use a **multisig** as an authority. SPL Token natively supports multisigs with M-of-N signatures.

\`\`\`typescript
import { createMultisig } from '@solana/spl-token';

const multisig = await createMultisig(
  connection,
  payer,
  [signer1.publicKey, signer2.publicKey, signer3.publicKey],
  2 // threshold: 2 de 3
);
\`\`\`

## Best Practices

- **Revoke mint authority** after the initial supply if the token should have a fixed supply
- **Set freeze authority to null** if there is no need for compliance
- Use **multisig** for treasuries and DAOs
- Publicly document the status of authorities for transparency`,
    exerciseQuestion:
      "What happens when you set the mint authority to null by calling setAuthority?",
    exerciseOptions: [
      "The authority is transferred to the System Program",
      "New tokens can be minted by anyone",
      "The mint authority is permanently revoked and no new tokens can be created",
      "The token is automatically burned",
    ],
  },

  l46: {
    content: `# Transfer Fees on Token-2022

## What Are Transfer Fees?

The **TransferFee** extension of Token-2022 allows charging an **automatic fee** on every token transfer. The fee is configured on the mint and enforced by the program itself — it cannot be bypassed.

## How It Works

When a token with a transfer fee is transferred:

1. The fee amount is **withheld** in the destination account in a separate field called \`withheld amount\`
2. The fee accumulates until it is **collected** by the collection authority (\`withdraw withheld authority\`)
3. The recipient receives the **net** amount (total amount - fee)

## Configuration

The transfer fee is configured with two parameters:

- **feeBasisPoints**: fee in basis points (100 = 1%)
- **maximumFee**: fee cap in absolute token units

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

## Collecting Fees

Withheld fees remain in the recipients' token accounts. To collect them:

\`\`\`typescript
import { harvestWithheldTokensToMint, withdrawWithheldTokensFromMint } from '@solana/spl-token';

// Passo 1: Colher taxas de todas as contas para o mint
await harvestWithheldTokensToMint(connection, payer, mint, [account1, account2]);

// Passo 2: Sacar do mint para uma conta de destino
await withdrawWithheldTokensFromMint(
  connection, payer, mint, destination, withdrawAuthority
);
\`\`\`

## Use Cases

- **DeFi protocols**: automatic revenue from transaction volume
- **DAOs**: continuous funding via transaction fees
- **Memecoins**: fee redistribution to holders
- **Stablecoins**: regulatory maintenance fee

## Important

- The fee is enforced at the **program** level and cannot be circumvented
- DEXs and aggregators need to support Token-2022 to correctly calculate net values
- Jupiter and Raydium already support tokens with transfer fees`,
    exerciseQuestion:
      "Where are transfer fees stored until they are collected?",
    exerciseOptions: [
      "In a PDA account of the Token-2022 program",
      "In the sender's account of the transaction",
      "In the withheld amount field of the recipient's token account",
      "In a treasury account defined at mint creation",
    ],
  },

  l47: {
    content: `# Confidential Transfers

## The Transparency Problem

On Solana, all transactions and balances are **public by default**. Anyone can check how much a wallet holds and to whom it transferred. While this brings transparency, many use cases require **financial privacy**.

## What Are Confidential Transfers?

The **ConfidentialTransfer** extension of Token-2022 uses **zero-knowledge proofs** to hide:

- The **amount** being transferred
- The **balances** of the involved accounts

The **existence** of the transaction and the **addresses** of the parties remain public — only the amounts are hidden.

## How It Works (Simplified)

1. Balances are stored as **ciphertexts** using ElGamal encryption
2. Each transfer includes a **range proof** that guarantees the amount is valid and the sender has sufficient balance
3. The program verifies the proof without needing to know the actual amount

\`\`\`
Saldo público:     1,000 USDC  (todos veem)
Saldo confidencial: Enc(1000)  (só o dono decifra)
\`\`\`

## Configuration

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

A unique feature: it is possible to define an **auditor** who holds an ElGamal key capable of decrypting all transfers. This enables:

- Regulatory compliance
- Internal audits
- Selective transparency

## Current Limitations

- **High compute budget**: ZK proofs consume many compute units
- **Latency**: proofs need to be generated off-chain before submitting the transaction
- **Compatibility**: not all wallets and DEXs support confidential transfers
- **Cost**: more expensive transactions (more space and computation)

## Ideal Use Cases

- Corporate payments (stablecoin salaries)
- Institutional transactions
- Stablecoins with regulated privacy`,
    exerciseQuestion: "What do Token-2022 confidential transfers hide?",
    exerciseOptions: [
      "The sender and recipient addresses",
      "The existence of the transaction on the blockchain",
      "The transferred amounts and account balances",
      "The program that processed the transaction",
    ],
  },

  l48: {
    content: `# Interest-Bearing Tokens

## Concept

The **InterestBearingMint** extension of Token-2022 allows a token to **accrue interest** automatically over time. Interest is calculated at the **display layer** — the raw balance on the blockchain does not change, but the "UI balance" presented to the user reflects the accrued interest.

## How Does It Work?

The mechanism is simple and elegant:

1. The mint stores an **interest rate** (in basis points per year)
2. The mint stores an **initialization timestamp**
3. Any client that queries the balance applies the compound interest formula based on elapsed time

\`\`\`
Saldo UI = saldo_raw × (1 + taxa/10000) ^ (tempo_decorrido / 1_ano)
\`\`\`

## Configuration

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

## Updating the Rate

The rate can be changed by the \`rateAuthority\` at any time:

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

## Calculating the Balance with Interest

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

## Important

- Interest is **display-only** — the raw balance does not change on the blockchain
- There is no automatic minting of new tokens — it is a visual representation
- Ideal for **tokenized bonds**, **yield-bearing stablecoins**, and **on-chain savings accounts**
- The rate can be negative (depreciation)`,
    exerciseQuestion:
      "How is interest on an interest-bearing token applied in practice?",
    exerciseOptions: [
      "New tokens are automatically minted to each holder every epoch",
      "The raw balance on the blockchain is updated by an on-chain cron job",
      "Interest is calculated at the display layer based on elapsed time, without changing the raw balance",
      "A staking program distributes proportional rewards",
    ],
  },

  l49: {
    content: `# Permanent Delegate and Non-Transferable Tokens

## Permanent Delegate

The **PermanentDelegate** extension of Token-2022 defines an authority that can **transfer or burn** tokens from **any** account of that mint, without needing the owner's signature.

### Use Cases

- **Regulated stablecoins**: compliance can recover funds from sanctioned accounts
- **Gaming**: in-game items that can be revoked for terms violations
- **Insurance**: automatic token redemption by a smart contract

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

The **NonTransferable** extension creates tokens that **cannot be transferred** between wallets — the so-called **soulbound tokens** (SBTs).

### How Does It Work?

- The mint is marked as non-transferable at creation
- Token accounts of this mint can **only receive** tokens via mint (MintTo)
- Any transfer attempt fails with an error
- The holder can still **burn** their tokens

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

### SBT Use Cases

- **Educational credentials**: certificates proving course completion
- **Reputation**: non-transferable governance score
- **In-game XP**: experience that cannot be sold
- **KYC tokens**: proof of identity linked to the wallet
- **Memberships**: exclusive access that cannot be resold

## Combining Extensions

One of the great advantages of Token-2022 is the ability to **combine extensions**. Powerful examples:

- **NonTransferable + Metadata**: soulbound credential with name and image
- **PermanentDelegate + TransferFee**: stablecoin with fee and compliance
- **InterestBearing + NonTransferable**: XP that accrues a time bonus

## At Superteam Academy

The platform's **XP** system uses exactly this combination:
- Token-2022 with **NonTransferable** extension (soulbound)
- Level = \`floor(sqrt(xp / 100))\``,
    exerciseQuestion:
      "Which Token-2022 extension is used to create soulbound (non-transferable) tokens?",
    exerciseOptions: [
      "PermanentDelegate",
      "TransferFee with a 100% fee",
      "NonTransferable",
      "FreezeAuthority on all accounts",
    ],
  },

  l50: {
    content: `# Challenge: Creating a Token-2022 with Extensions

## Objective

In this challenge, you will create a token using the **Token-2022** program with two extensions:

1. **TransferFee**: 1% fee per transfer, maximum of 1000 tokens
2. **TokenMetadata**: on-chain name, symbol, and URI

## Requirements

- Create the mint with both extensions configured
- Configure the transfer fee as 100 basis points (1%)
- Set the maximum fee to 1000 tokens (considering decimals)
- Add metadata with the name "Academy Token", symbol "ACAD", and a URI pointing to a JSON file

## Tips

- Use \`getMintLen\` to calculate the required space with extensions
- Extension instructions must be executed **before** \`InitializeMint\`
- Order matters: extensions first, then mint init

## Expected Flow

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
    exerciseQuestion:
      "What is the correct order to create a Token-2022 mint with extensions?",
    exerciseOptions: [
      "InitializeMint -> create extensions -> create account",
      "Create account -> InitializeMint -> create extensions",
      "Create account with sufficient space -> initialize extensions -> InitializeMint",
      "Extensions can be added in any order, including after the mint",
    ],
    challengePrompt:
      "Create a Token-2022 token with a TransferFee extension (1%, max 1000 tokens) and metadata. Complete the code below to configure the extensions and initialize the mint.",
  },

  // ── Course 8: AMM and Liquidity ───────────────────────────

  l51: {
    content: `# What Is an AMM?

## Introduction

An **Automated Market Maker** (AMM) is a protocol that enables trading of assets **without an order book** and **without intermediaries**. Instead of buyers and sellers creating orders, the AMM uses a **mathematical formula** to determine the price based on a pool's reserves.

## Order Book vs AMM

### Order Book (Traditional Model)

In the order book model (used by Binance, NYSE, etc.):
- Buyers post buy orders (**bids**)
- Sellers post sell orders (**asks**)
- Trades happen when bid >= ask
- Requires active **market makers** to provide liquidity

### AMM (DeFi Model)

In the AMM model:
- Liquidity providers (**LPs**) deposit token pairs into a **pool**
- The price is automatically determined by a **price curve**
- Anyone can swap tokens at any time
- No specific counterparty is needed

## How Does a Pool Work?

\`\`\`
Pool SOL/USDC:
├── Reserva de SOL: 1,000 SOL
├── Reserva de USDC: 150,000 USDC
└── Preço implícito: 150 USDC/SOL
\`\`\`

When someone buys SOL:
1. Deposits USDC into the pool
2. Withdraws SOL from the pool
3. The ratio changes -> price goes up

## AMMs on Solana

Solana is ideal for AMMs because of:
- **High speed**: swaps in ~400ms
- **Low cost**: fractions of a cent per transaction
- **Composability**: CPIs allow integrating AMMs into any program

### Main AMMs on Solana

| AMM | Type | Highlight |
|---|---|---|
| Raydium | CLMM + Legacy | OpenBook integration |
| Orca | Whirlpools (CLMM) | Simplified UX |
| Meteora | DLMM | Dynamic liquidity bins |
| Phoenix | Hybrid (LOB + AMM) | On-chain order book |`,
    exerciseQuestion:
      "What is the main difference between an AMM and an order book?",
    exerciseOptions: [
      "The AMM is slower because it needs consensus for each trade",
      "The AMM uses a mathematical formula to set prices, without the need for buy/sell orders",
      "The order book does not need liquidity to function",
      "The AMM only works on high-performance blockchains",
    ],
  },

  l52: {
    content: `# Constant Product Formula

## The x * y = k Formula

The most fundamental AMM formula is the **constant product**, popularized by Uniswap V2:

\`\`\`
x * y = k
\`\`\`

Where:
- **x** = reserve of token A in the pool
- **y** = reserve of token B in the pool
- **k** = constant (does not change during swaps, only during liquidity addition/removal)

## Numerical Example

\`\`\`
Pool inicial:
  x = 100 SOL
  y = 15,000 USDC
  k = 100 × 15,000 = 1,500,000

Preço: y/x = 15,000/100 = 150 USDC/SOL
\`\`\`

### Buying 10 SOL:

\`\`\`
Novo x = 100 - 10 = 90 SOL
Novo y = k / x = 1,500,000 / 90 = 16,666.67 USDC

Custo = 16,666.67 - 15,000 = 1,666.67 USDC
Preço efetivo = 1,666.67 / 10 = 166.67 USDC/SOL
\`\`\`

Note that the effective price (166.67) is **higher** than the spot price (150). This is the **price impact**.

## Price Impact

The larger the trade relative to the pool, the greater the price impact:

| Trade | % of Pool | Price Impact |
|---|---|---|
| 1 SOL | 1% | ~1% |
| 10 SOL | 10% | ~11% |
| 50 SOL | 50% | ~100% |

## Price Derivation

The marginal price (spot price) at any point is:

\`\`\`
Preço de A em termos de B = dy/dx = y/x
\`\`\`

To calculate the output amount for a given input:

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

**Slippage** is the difference between the expected price and the executed price. When performing a swap, you define a **slippage tolerance** (e.g., 0.5%) to protect against price movements between submission and execution.

## Alternative Curves

- **StableSwap (Curve)**: \`x³y + xy³ = k\` — lower price impact for similar assets (e.g., USDC/USDT)
- **Concentrated Liquidity (Uni V3/Raydium CLMM)**: liquidity allocated to specific price ranges`,
    exerciseQuestion:
      "In a pool with x*y=k containing 200 SOL and 30,000 USDC, what is the spot price of 1 SOL?",
    exerciseOptions: ["200 USDC", "100 USDC", "150 USDC", "30,000 USDC"],
  },

  l53: {
    content: `# Impermanent Loss

## What Is Impermanent Loss?

**Impermanent Loss** (IL) is the difference in value between:
- Keeping your tokens in a **liquidity pool**
- Simply **holding** the same tokens in your wallet

When the relative price of the tokens changes, the pool automatically rebalances, and the LP ends up with more of the token that depreciated and less of the one that appreciated.

## Why "Impermanent"?

It is called "impermanent" because:
- If the price **returns** to the original value, the loss **disappears**
- The loss only becomes **permanent** when you withdraw liquidity at a price different from the entry price

## Calculating IL

The impermanent loss formula for a pool with x*y=k is:

\`\`\`
IL = 2 × √(price_ratio) / (1 + price_ratio) - 1
\`\`\`

Where \`price_ratio = new_price / initial_price\`

### Reference Table

| Price Change | IL |
|---|---|
| 1.25x (25% increase) | -0.6% |
| 1.50x (50% increase) | -2.0% |
| 2x (100% increase) | -5.7% |
| 3x (200% increase) | -13.4% |
| 5x (400% increase) | -25.5% |
| 0.5x (50% decrease) | -5.7% |

## Practical Example

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

## Strategies to Minimize IL

1. **Stable pairs**: USDC/USDT pools have near-zero IL
2. **High-fee pools**: swap fees offset IL
3. **Concentrated liquidity**: narrow ranges generate more fees (but more IL if the price exits the range)
4. **Hedging**: use derivatives to protect the position
5. **Single-sided liquidity**: some protocols allow single-token deposits

## IL in Concentrated Liquidity

In concentrated liquidity pools (Raydium CLMM, Orca Whirlpools):
- IL is **amplified** within the range
- If the price exits the range, the LP holds 100% of the depreciated token
- Earned fees are also higher (compensation)

\`\`\`typescript
// Simulando IL
function impermanentLoss(priceRatio: number): number {
  return 2 * Math.sqrt(priceRatio) / (1 + priceRatio) - 1;
}

console.log(impermanentLoss(2));   // -0.0572 (-5.72%)
console.log(impermanentLoss(0.5)); // -0.0572 (-5.72%)
\`\`\``,
    exerciseQuestion:
      "If the price of an asset doubles (2x), what is the approximate impermanent loss in a pool with x*y=k?",
    exerciseOptions: ["-2.0%", "-5.7%", "-13.4%", "-25.5%"],
  },

  l54: {
    content: `# Raydium: Architecture and Integration

## What Is Raydium?

Raydium is the largest AMM in the Solana ecosystem, offering two types of pools:

- **Legacy AMM (V4)**: classic constant product pools
- **Concentrated Liquidity Market Maker (CLMM)**: concentrated liquidity with ticks, similar to Uniswap V3

## CLMM Architecture

### Ticks and Ranges

In the CLMM model, the price space is divided into discrete **ticks**. Each LP chooses a **range** (lower and upper tick) where their liquidity is active.

\`\`\`
Preço: ──────|=====LP1=====|──────────────
             $140          $160

Preço: ──|========LP2========|────────────
         $130               $170

Preço atual: $150 → ambos LP1 e LP2 estão ativos
\`\`\`

### Advantages of Concentrated Liquidity

- **Capital efficiency**: 4000x more efficient than full-range
- **More fees**: concentrated liquidity earns proportionally more
- **Flexibility**: each LP defines their own strategy

## SDK Integration

### Installation

\`\`\`bash
npm install @raydium-io/raydium-sdk-v2
\`\`\`

### Initializing the Raydium SDK

\`\`\`typescript
import { Raydium } from '@raydium-io/raydium-sdk-v2';

const raydium = await Raydium.load({
  connection,
  owner: wallet,
  cluster: 'mainnet',
});
\`\`\`

### Querying Pools

\`\`\`typescript
// Buscar pools CLMM
const pools = await raydium.clmm.getPoolInfoFromRpc(poolId);

// Informações do pool
console.log('Preço atual:', pools.currentPrice);
console.log('Liquidez:', pools.liquidity);
console.log('Fee rate:', pools.ammConfig.tradeFeeRate);
\`\`\`

### Executing a Swap

\`\`\`typescript
const { execute } = await raydium.clmm.swap({
  poolInfo,
  inputMint: SOL_MINT,
  amountIn: new BN(1_000_000_000), // 1 SOL
  slippage: 0.005, // 0.5%
});

const txId = await execute();
\`\`\`

## Raydium Accounts

A Raydium CLMM pool involves several PDA accounts:

| Account | Description |
|---|---|
| PoolState | Main pool state (price, liquidity, ticks) |
| AmmConfig | Configuration (fee rate, tick spacing) |
| ProtocolPosition | Protocol position |
| PersonalPosition | Each LP's position |
| TickArray | Array of ticks with liquidity |
| TokenVault A/B | Vaults that hold the tokens |

## Events

Raydium emits events for indexing:
- \`Swap\`: token in/out, price, fee
- \`LiquidityChange\`: liquidity addition/removal
- \`CollectFee\`: fee collection by LP`,
    exerciseQuestion:
      "What is the main advantage of Raydium CLMM pools over legacy pools?",
    exerciseOptions: [
      "CLMM pools are cheaper to create",
      "CLMM pools allow concentrated liquidity in price ranges, increasing capital efficiency",
      "CLMM pools do not charge swap fees",
      "CLMM pools do not suffer from impermanent loss",
    ],
  },

  l55: {
    content: `# Orca: Whirlpools

## What Are Whirlpools?

**Whirlpools** are Orca's concentrated liquidity pools — the second largest AMM on Solana. The name "Whirlpool" comes from the idea of liquidity spinning efficiently in a price vortex.

## Key Concepts

### Tick Arrays

Whirlpools organize ticks into **tick arrays** — contiguous groups of ticks stored in a single PDA account. Each tick array contains **88 ticks**.

\`\`\`
TickArray 0:  [tick 0 ... tick 87]
TickArray 1:  [tick 88 ... tick 175]
TickArray 2:  [tick 176 ... tick 263]
...
\`\`\`

### Tick Spacing

The \`tickSpacing\` defines the pool's granularity:

| tickSpacing | Typical Use | Example |
|---|---|---|
| 1 | Stable pairs | USDC/USDT |
| 8 | Popular pairs | SOL/USDC |
| 64 | Exotic pairs | MEME/SOL |
| 128 | High volatility pairs | NEW/SOL |

Lower tickSpacing = more granularity = more efficiency for stable pairs.

### Positions

Each LP opens a **position** defined by:
- \`tickLowerIndex\`: lower tick of the range
- \`tickUpperIndex\`: upper tick of the range
- \`liquidity\`: amount of deposited liquidity

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

## Position Management

### Opening a Position

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

### Collecting Fees

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

| Aspect | Orca Whirlpools | Raydium CLMM |
|---|---|---|
| SDK | @orca-so/whirlpools-sdk | @raydium-io/raydium-sdk-v2 |
| Tick storage | Tick Arrays (88 ticks) | Tick Arrays |
| Fee tiers | 0.01%, 0.05%, 0.3%, 1% | Configurable per AmmConfig |
| Ecosystem | More integrated with Jupiter | OpenBook integration |`,
    exerciseQuestion: "What are tick arrays in Orca Whirlpools?",
    exerciseOptions: [
      "Arrays of historical pool prices",
      "Contiguous groups of ticks stored in a single PDA account",
      "Lists of pending transactions in the pool",
      "Records of all LP positions",
    ],
  },

  l56: {
    content: `# Arbitrage and MEV on Solana

## What Is MEV?

**Maximal Extractable Value** (MEV) is the maximum profit that can be extracted from block production, beyond standard rewards and gas fees. On Solana, MEV takes different forms from Ethereum due to its unique architecture.

## Types of MEV on Solana

### 1. Arbitrage

Exploiting price differences between pools/DEXs:

\`\`\`
Raydium SOL/USDC: 150.00
Orca SOL/USDC:    150.50

Arbitragem:
1. Comprar SOL no Raydium por 150.00
2. Vender SOL na Orca por 150.50
3. Lucro: 0.50 USDC por SOL (menos fees)
\`\`\`

### 2. Sandwich Attack

The attacker "wraps" the victim's transaction:

\`\`\`
1. Frontrun: Atacante compra SOL (preço sobe)
2. Vítima:   Compra SOL a preço inflado
3. Backrun:  Atacante vende SOL (lucro com a diferença)
\`\`\`

### 3. Liquidation

Monitoring under-collateralized positions in lending protocols to liquidate them and earn the liquidation bonus.

### 4. JIT Liquidity (Just-In-Time)

Adding liquidity to a concentrated pool **moments before** a large swap, capturing the fees, and removing the liquidity right after.

## Jito: MEV on Solana

**Jito** is the main MEV system on Solana:

### Jito Bundles

- Ordered transaction packages that execute **atomically**
- If one transaction fails, the entire bundle fails
- Validators running Jito prioritize bundles with tips

\`\`\`typescript
import { SearcherClient } from 'jito-ts/dist/sdk/block-engine/searcher';

const client = SearcherClient.connect(jitoBlockEngineUrl);

// Criar bundle
const bundle = new Bundle([tx1, tx2, tx3], tipAmount);
await client.sendBundle(bundle);
\`\`\`

### Jito Tips

Jito validators accept **tips** for priority inclusion. Tips go to the validator, not to Jito.

## MEV Protection

### For Developers

1. **Slippage protection**: always set maximum slippage on swaps
2. **Priority fees**: pay priority fees for fast inclusion
3. **Jito bundles**: use bundles for order-sensitive transactions
4. **Private mempools**: send transactions directly to trusted validators

### For Users

- Use Jupiter with **MEV protection** enabled
- Set appropriate slippage (0.5-1% for liquid pairs)
- Avoid large transactions in shallow pools

## MEV on Solana vs Ethereum

| Aspect | Solana | Ethereum |
|---|---|---|
| Mempool | No public mempool | Public mempool |
| Latency | ~400ms per slot | ~12s per block |
| Attempt cost | Very low | High (gas) |
| Mechanism | Jito bundles | Flashbots, MEV-Boost |
| Sandwich | Harder (no mempool) | Very common |`,
    exerciseQuestion:
      "Why are sandwich attacks harder on Solana than on Ethereum?",
    exerciseOptions: [
      "Solana has a native anti-MEV protection mechanism",
      "There is no public mempool on Solana, so it is harder to see pending transactions",
      "Transaction fees on Solana are too high to make sandwiches profitable",
      "Solana automatically blocks MEV transactions",
    ],
  },

  l57: {
    content: `# Challenge: Creating a Liquidity Pool

## Objective

In this challenge, you will create and interact with a liquidity pool using the Raydium SDK. You will:

1. Create a CLMM pool for a token pair
2. Add liquidity within a price range
3. Execute a swap
4. Collect accumulated fees

## Requirements

- Initialize the Raydium SDK with a devnet connection
- Create a CLMM pool with a 0.25% fee tier
- Open a position with a range of +-10% of the initial price
- Perform a test swap
- Collect fees from the position

## Necessary Concepts

- CLMM and tick spacing
- Position with lower and upper tick
- Swap quote with slippage
- Accumulated fee collection

## Tips

- Use the Raydium SDK V2 for simplified interactions
- The \`tickSpacing\` is determined by the fee tier
- Calculate ticks from the desired price with \`TickUtils\`
- Always set slippage when executing swaps`,
    exerciseQuestion:
      "When creating a position in a CLMM pool, what defines the price range where your liquidity is active?",
    exerciseOptions: [
      "The total value deposited in each token",
      "The lower tick (tickLower) and upper tick (tickUpper)",
      "The fee tier configured in the pool",
      "The amount of SOL used as a priority fee",
    ],
    challengePrompt:
      "Complete the code to create a CLMM pool on Raydium, add liquidity, and execute a swap. Fill in the indicated TODOs.",
  },

  // ── Course 9: Advanced Anchor ─────────────────────────────

  l58: {
    content: `# Review: Anchor Fundamentals

## What Is Anchor?

**Anchor** is the most popular framework for developing programs (smart contracts) on Solana. It abstracts much of the Solana runtime complexity and provides:

- **Automatic serialization/deserialization** with Borsh
- **Declarative account validation** with macros
- **IDL** (Interface Definition Language) generated automatically
- **Client SDK** for TypeScript generated from the IDL

## Structure of an Anchor Program

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

## Fundamental Concepts

### Discriminator (8 bytes)

Every Anchor account starts with 8 bytes of **discriminator** — a SHA256 hash of the struct name. This ensures the account is of the expected type.

### Context and Accounts

The \`Context<T>\` contains:
- \`accounts\`: the validated accounts
- \`program_id\`: the program ID
- \`remaining_accounts\`: extra untyped accounts
- \`bumps\`: PDA bumps

### PDAs in Anchor

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

## Testing with Anchor

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
    exerciseQuestion:
      "What is the purpose of the 8-byte discriminator in an Anchor account?",
    exerciseOptions: [
      "To store the account's lamport balance",
      "To identify the account type through a hash, ensuring it is of the expected type",
      "To encrypt the account data for privacy",
      "To define the maximum size the account can have",
    ],
  },

  l59: {
    content: `# Cross-Program Invocations (CPIs)

## What Are CPIs?

**Cross-Program Invocations** allow a Solana program to call instructions from **another program**. This is the foundation of **composability** on Solana — programs can interact with each other like building blocks.

## invoke vs invoke_signed

### invoke

Used when the signing accounts are **external wallets** that have already signed the transaction:

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

Used when a **PDA** needs to sign. The program provides the seeds so the runtime can derive the signature:

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

## CPIs in Anchor (CpiContext)

Anchor simplifies CPIs with \`CpiContext\`:

### SOL Transfer

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

### Minting Tokens via CPI

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

## Limits and Considerations

- **Maximum depth**: 4 levels of chained CPIs
- **Compute budget**: CPIs share the main transaction's compute budget
- **Security**: always validate the \`program_id\` of the called program
- **Re-entrancy**: Solana natively prevents re-entrancy (a program cannot call itself via CPI)

## Pattern: Intermediary Program

\`\`\`
Usuário → Programa A (seu protocolo)
              ├── CPI → Token Program (mint tokens)
              ├── CPI → System Program (transferir SOL)
              └── CPI → Programa B (outro protocolo)
\`\`\`

## Debugging CPIs

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
    exerciseQuestion:
      "When should you use invoke_signed instead of invoke in a CPI?",
    exerciseOptions: [
      "When the CPI involves the System Program",
      "When a PDA needs to sign the transaction, since PDAs do not have a private key",
      "When the transaction has more than 2 signatures",
      "When the called program requires more compute units",
    ],
  },

  l60: {
    content: `# Events and Indexing

## Why Events?

Solana programs are like backends — they process transactions but do **not proactively notify** clients. **Events** solve this by allowing programs to emit structured data that can be:

- **Captured** in real time via WebSocket
- **Indexed** for historical queries
- **Processed** by off-chain systems

## Events in Anchor

### Defining an Event

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

### Emitting an Event

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

## How Events Work Internally

1. \`emit!\` serializes the event with Borsh
2. Adds an 8-byte **discriminator** (SHA256 hash of the event name)
3. Calls \`sol_log_data\` with the serialized data
4. The data appears in the \`data\` field of the transaction logs

## Consuming Events on the Client

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

## Indexing with Helius

**Helius** offers webhooks and APIs for event indexing:

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

## Indexing with Yellowstone (Geyser)

**Yellowstone** (Geyser plugin) provides real-time data streaming via gRPC:

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

## Best Practices

- Emit events for **all important actions** (swaps, deposits, withdrawals)
- Include **timestamps** and **slots** for ordering
- Use **specific types** (Pubkey, u64) to facilitate indexing
- Keep events **compatible** across program versions`,
    exerciseQuestion:
      "Which Anchor function is used to emit an event from an instruction?",
    exerciseOptions: ["log!()", "emit!()", "msg!()", "event!()"],
  },

  l61: {
    content: `# Zero-Copy and Memory Optimization

## The Problem

Every standard Anchor account is **fully deserialized** onto the heap when accessed. For small accounts (< 1KB), this is efficient. But for large accounts (e.g., order books, pools with many ticks), deserialization can:

- **Consume excessive compute units**
- **Overflow the heap** (32KB on Solana)
- **Increase transaction latency**

## Zero-Copy: The Solution

The \`#[account(zero_copy)]\` macro makes Anchor map the account's memory **directly** without Borsh deserialization. Data is accessed as a **pointer** to the memory region.

### Before (standard):
\`\`\`
Account data → Borsh deserialize → Struct na heap → uso → Borsh serialize → Account data
\`\`\`

### With zero-copy:
\`\`\`
Account data → Ponteiro direto → uso → escrita direta → Account data
\`\`\`

## Implementation

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

To access zero-copy accounts, use \`AccountLoader\` instead of \`Account\`:

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

## Important Rules

1. **repr(C)**: required for deterministic memory layout
2. **Padding**: fields must be manually aligned (Rust C layout rules)
3. **Allowed types**: only primitive types and fixed-size arrays (no Vec, String, etc.)
4. **Discriminator**: 8 bytes, same as normal accounts

## Performance Comparison

| Operation | Standard Account | Zero-copy |
|---|---|---|
| Read (1KB) | ~2,000 CU | ~200 CU |
| Read (10KB) | ~20,000 CU | ~200 CU |
| Write (1KB) | ~2,500 CU | ~300 CU |
| Write (10KB) | ~25,000 CU | ~300 CU |
| Practical max size | ~10KB | ~10MB |

## When to Use

- **Use zero-copy** when: accounts > 1KB, many fields, large arrays, performance is critical
- **Use standard** when: small accounts, complex types (String, Vec), simplicity is the priority

## Limitation: No Dynamic Types

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
    exerciseQuestion:
      "What is the main benefit of the #[account(zero_copy)] macro in Anchor?",
    exerciseOptions: [
      "It allows using dynamic types like Vec and String in accounts",
      "It eliminates the need to pay rent for the account",
      "It accesses data directly in memory without Borsh deserialization, reducing compute units",
      "It compresses the account data to occupy less space",
    ],
  },

  l62: {
    content: `# Solana Program Security

## Why Is Security Critical?

Solana programs manage **real money**. A single vulnerability can result in the loss of millions. Most exploits on Solana come from validation errors.

## Common Vulnerabilities

### 1. Missing Signer Check

**Problem**: not verifying that the caller actually signed the transaction.

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

**Problem**: not verifying that the account belongs to the expected program.

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

**Problem**: an attacker replaces an expected account with another.

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

## Anchor Constraints

Anchor provides declarative constraints for security:

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

## Security Checklist

1. Do all accounts have appropriate **signer checks**?
2. Do all accounts have **owner checks**?
3. Do PDAs use **unique seeds** and verify **bumps**?
4. Does arithmetic use **checked_** operations?
5. Do **has_one** constraints validate relationships between accounts?
6. Can accounts not be **substituted** with malicious accounts?
7. Does the program handle **re-initialization** attacks?
8. Is input data **validated** (ranges, limits)?

## Audit Tools

- **Anchor verifiable**: \`anchor build --verifiable\` for deterministic builds
- **Soteria**: static security analysis for Solana
- **Sec3 (X-ray)**: automatic vulnerability scanner
- **Professional audits**: OtterSec, Neodyme, Trail of Bits`,
    exerciseQuestion:
      "Which vulnerability occurs when a program does not verify that the caller actually signed the transaction?",
    exerciseOptions: [
      "PDA Seed Collision",
      "Arithmetic Overflow",
      "Missing Signer Check",
      "Account Substitution",
    ],
  },

  l63: {
    content: `# Upgradeable Programs

## How Are Programs Deployed on Solana?

On Solana, programs are stored in special accounts managed by the **BPF Upgradeable Loader**. A deploy creates three accounts:

1. **Program Account**: the program's public address (immutable)
2. **ProgramData Account**: contains the program's bytecode (upgradeable)
3. **Buffer Account**: temporary, used during upload

\`\`\`
┌─────────────────────┐
│   Program Account   │
│   (endereço fixo)   │──→ ProgramData Account
│                     │     ├── upgrade_authority: Pubkey
└─────────────────────┘     ├── slot_deployed: u64
                            └── bytecode: [u8]
\`\`\`

## Upgrade Authority

The **upgrade authority** is the key that can update the program. Whoever controls this key, controls the program.

### Updating a Program

\`\`\`bash
# Deploy inicial
anchor deploy --provider.cluster devnet

# Upgrade (novo bytecode, mesmo endereço)
anchor upgrade target/deploy/meu_programa.so \\
  --program-id <PROGRAM_ID> \\
  --provider.cluster devnet
\`\`\`

### Transferring Authority

\`\`\`bash
solana program set-upgrade-authority <PROGRAM_ID> \\
  --new-upgrade-authority <NOVA_PUBKEY>
\`\`\`

### Making It Immutable

\`\`\`bash
# CUIDADO: irreversível!
solana program set-upgrade-authority <PROGRAM_ID> --final
\`\`\`

After \`--final\`, the program can **never** be updated again. This is ideal for protocols that want to guarantee total immutability.

## Upgrade Strategies

### 1. Multisig Authority

Use a multisig (Squads Protocol) as the upgrade authority:

\`\`\`
Authority = Squads Multisig (2 de 3)
├── Dev Team Key
├── Security Auditor Key
└── Community Council Key
\`\`\`

### 2. Timelock

Add a delay (e.g., 72h) before upgrades take effect, giving the community time to review.

### 3. Progressive Upgrade

1. Deploy with upgrade authority -> quick fixes
2. After audit, transfer to multisig
3. After maturity, make immutable (\`--final\`)

## Closing Programs

It is possible to **close** a program and recover the lamports from the data account:

\`\`\`bash
solana program close <PROGRAM_ID> \\
  --recipient <WALLET_ADDRESS>
\`\`\`

**Warning**: closing a program is destructive. The address continues to exist, but any instruction will fail.

## On-chain Verification

Anyone can verify whether a program is upgradeable:

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
    exerciseQuestion:
      'What happens when you run "solana program set-upgrade-authority --final" on a program?',
    exerciseOptions: [
      "The program is deleted from the blockchain",
      "The upgrade authority is transferred to the System Program",
      "The program becomes permanently immutable and can never be updated again",
      "The program is temporarily paused for 72 hours",
    ],
  },

  l64: {
    content: `# Clockwork and Automation on Solana

## The Problem

Solana programs are **reactive** — they only execute when someone sends a transaction. There is no native "cron job" on the blockchain. But many protocols need automated execution:

- **DCA** (Dollar Cost Averaging): buy X tokens every day
- **Liquidations**: liquidate under-collateralized positions periodically
- **Vesting**: release tokens on specific dates
- **Oracles**: update prices at regular intervals
- **Auto-compound**: reinvest staking rewards

## Clockwork

**Clockwork** was the pioneering automation protocol on Solana (discontinued in 2024, but the concepts remain relevant).

### Concept: Threads

A **thread** is a scheduled instruction that executes automatically:

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

## Current Alternatives

### 1. Jito Bundles + Keeper Bots

The most common approach currently: off-chain bots that monitor conditions and send transactions via Jito:

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

Helius can notify your backend when on-chain conditions change:

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

For user-initiated automations, Solana Actions allow executing transactions from URLs:

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

## Pattern: Crank

The **crank** pattern is the simplest: a public instruction that anyone can call, with an economic incentive:

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

## Comparison of Approaches

| Approach | Decentralization | Cost | Complexity |
|---|---|---|---|
| Keeper bot (Jito) | Low | Medium | Medium |
| Helius webhook | Low | Low | Low |
| Crank pattern | High | Variable | Medium |
| Clockwork (legacy) | High | Low | Low |`,
    exerciseQuestion: 'What is the "crank" pattern in Solana programs?',
    exerciseOptions: [
      "A mechanism for on-chain data compression",
      "A public instruction that anyone can call to execute periodic logic, usually with a reward",
      "A special type of PDA for storing temporary data",
      "A Token-2022 extension for transfer automation",
    ],
  },

  l65: {
    content: `# Final Project: DeFi Lending/Borrowing Protocol

## Objective

In this final project, you will build the skeleton of a **lending/borrowing protocol** on Solana using Anchor. The protocol allows:

1. **Depositing** collateral (SOL or tokens)
2. **Borrowing** tokens based on collateral
3. **Repaying** loans with interest
4. **Liquidating** under-collateralized positions

## Architecture

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

## Protocol Accounts

- **Market**: global PDA with configurations (interest rate, LTV ratio, liquidation threshold)
- **Position**: per-user PDA with deposited collateral and borrowed amount
- **Vault**: the program's token account that holds deposits
- **Oracle**: price feed for calculating collateralization

## Instructions

1. \`initialize_market\` -- creates the Market PDA
2. \`deposit_collateral\` -- deposits tokens as collateral
3. \`borrow\` -- borrows tokens (CPI to token program)
4. \`repay\` -- repays loan with accrued interest
5. \`liquidate\` -- liquidates position with LTV above the threshold

## Tips

- Use \`Clock::get()?\` to calculate accrued interest
- Implement \`checked_mul\` and \`checked_div\` for safe arithmetic
- Use CPIs for token transfers
- The oracle can be simulated with a simple price account`,
    exerciseQuestion:
      "In a lending protocol, what happens when a position's LTV (Loan-to-Value) exceeds the liquidation threshold?",
    exerciseOptions: [
      "The loan is automatically forgiven by the protocol",
      "The position can be liquidated by a third party, who receives part of the collateral as incentive",
      "The protocol automatically increases the interest rate",
      "The position is frozen until the user deposits more collateral",
    ],
    challengePrompt:
      "Complete the Anchor lending/borrowing program. Implement the deposit_collateral and borrow instructions with the necessary security validations.",
  },
});

// ============================================================
// Spanish (ES) translations for Courses 7–9 (lessons l44–l65)
// ============================================================

registerLessonContent("es", {
  // ── Curso 7: SPL Token Avanzado ───────────────────────────

  l44: {
    content: `# SPL Token vs Token-2022

## Contexto Historico

El programa **SPL Token** original fue lanzado en 2020 y se convirtio en el estandar para tokens fungibles y no fungibles en Solana. Sin embargo, su arquitectura es limitada: cada nueva funcionalidad requeriria un fork o un programa wrapper.

En 2022, Solana Labs introdujo **Token-2022** (tambien llamado Token Extensions), un nuevo programa que mantiene **compatibilidad retroactiva** con el SPL Token original y agrega un sistema de **extensiones modulares**.

## Diferencias principales

| Caracteristica | SPL Token | Token-2022 |
|---|---|---|
| Program ID | \`TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA\` | \`TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb\` |
| Extensiones | No soporta | Soporta (transfer fee, confidential, etc.) |
| Compatibilidad | Estandar legado | Retrocompatible con SPL Token |
| Tamano del Mint | 82 bytes fijo | Variable (82 + extensiones) |

## Compatibilidad retroactiva

Token-2022 acepta las **mismas instrucciones** del SPL Token original. Esto significa que wallets y DEXs existentes pueden interactuar con tokens Token-2022 sin cambios — siempre que no usen extensiones que requieran tratamiento especial (como transfer fees).

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

## Cuando usar cada uno?

- **SPL Token**: proyectos simples, maxima compatibilidad con DEXs legadas
- **Token-2022**: cuando necesites transfer fees, tokens confidenciales, metadata on-chain o cualquier extension`,
    exerciseQuestion:
      "Cual es la principal ventaja de Token-2022 sobre el SPL Token original?",
    exerciseOptions: [
      "Es mas rapido en terminos de TPS",
      "Soporta extensiones modulares como transfer fees y confidential transfers",
      "Usa menos compute units por transaccion",
      "Es el unico programa que soporta NFTs en Solana",
    ],
  },

  l45: {
    content: `# Mint Authority y Freeze Authority

## Que son las authorities?

En Solana, cada **Mint** (token) tiene dos autoridades opcionales:

- **Mint Authority**: quien puede crear (mintear) nuevos tokens
- **Freeze Authority**: quien puede congelar y descongelar cuentas de token

Estas autoridades son claves publicas definidas al momento de la creacion del mint y pueden ser modificadas o **revocadas** permanentemente.

## Mint Authority

La mint authority controla la **oferta** del token. Solo esta clave puede llamar a la instruccion \`MintTo\`.

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

La freeze authority puede **congelar** una token account, impidiendo cualquier transferencia. Se usa en casos de compliance, stablecoins reguladas y mecanismos antifraude.

\`\`\`typescript
import { freezeAccount, thawAccount } from '@solana/spl-token';

// Congelar conta
await freezeAccount(connection, payer, tokenAccount, mint, freezeAuthority);

// Descongelar
await thawAccount(connection, payer, tokenAccount, mint, freezeAuthority);
\`\`\`

## Multisig Authority

Para mayor seguridad, puedes usar un **multisig** como authority. SPL Token soporta multisigs nativamente con firmas M-de-N.

\`\`\`typescript
import { createMultisig } from '@solana/spl-token';

const multisig = await createMultisig(
  connection,
  payer,
  [signer1.publicKey, signer2.publicKey, signer3.publicKey],
  2 // threshold: 2 de 3
);
\`\`\`

## Buenas practicas

- **Revocar mint authority** despues del supply inicial si el token debe tener oferta fija
- **Definir freeze authority como null** si no hay necesidad de compliance
- Usar **multisig** para treasuries y DAOs
- Documentar publicamente el estado de las authorities para transparencia`,
    exerciseQuestion:
      "Que sucede cuando defines la mint authority como null al llamar a setAuthority?",
    exerciseOptions: [
      "La autoridad se transfiere al System Program",
      "Nuevos tokens pueden ser minteados por cualquier persona",
      "La mint authority se revoca permanentemente y ningun nuevo token puede ser creado",
      "El token se quema automaticamente",
    ],
  },

  l46: {
    content: `# Transfer Fees en Token-2022

## Que son las transfer fees?

La extension **TransferFee** de Token-2022 permite cobrar una **tarifa automatica** en cada transferencia de tokens. La tarifa se configura en el mint y es aplicada por el propio programa — no es posible eludirla.

## Como funciona

Cuando un token con transfer fee es transferido:

1. El monto de la tarifa es **retenido** en la cuenta de destino en un campo separado llamado \`withheld amount\`
2. La tarifa se acumula hasta ser **recolectada** por la autoridad de recoleccion (\`withdraw withheld authority\`)
3. El destinatario recibe el monto **neto** (monto total - tarifa)

## Configuracion

La transfer fee se configura con dos parametros:

- **feeBasisPoints**: tarifa en basis points (100 = 1%)
- **maximumFee**: tope de la tarifa en unidades absolutas del token

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

## Recolectando tarifas

Las tarifas retenidas permanecen en las token accounts de los destinatarios. Para recolectarlas:

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

- **Protocolos DeFi**: ingreso automatico por volumen transaccionado
- **DAOs**: financiamiento continuo via tarifas de transaccion
- **Memecoins**: redistribucion de tarifas a holders
- **Stablecoins**: tarifa de mantenimiento regulatorio

## Importante

- La tarifa se aplica a nivel del **programa** y no puede ser eludida
- DEXs y aggregators necesitan soportar Token-2022 para calcular correctamente los valores netos
- Jupiter y Raydium ya soportan tokens con transfer fees`,
    exerciseQuestion:
      "Donde se almacenan las tarifas de transfer fee hasta que son recolectadas?",
    exerciseOptions: [
      "En una cuenta PDA del programa Token-2022",
      "En la cuenta del remitente de la transaccion",
      "En el campo withheld amount de la cuenta de token del destinatario",
      "En una cuenta de treasury definida en la creacion del mint",
    ],
  },

  l47: {
    content: `# Transferencias Confidenciales

## El problema de la transparencia

En Solana, todas las transacciones y saldos son **publicos por defecto**. Cualquier persona puede verificar cuanto posee una wallet y a quien transfirio. Aunque esto brinda transparencia, muchos casos de uso requieren **privacidad financiera**.

## Que son las Confidential Transfers?

La extension **ConfidentialTransfer** de Token-2022 usa **pruebas de conocimiento cero** (zero-knowledge proofs) para ocultar:

- El **monto** siendo transferido
- El **saldo** de las cuentas involucradas

La **existencia** de la transaccion y las **direcciones** de las partes siguen siendo publicas — solo los montos son ocultados.

## Como funciona (simplificado)

1. Los saldos se almacenan como **ciphertexts** (textos cifrados) usando criptografia ElGamal
2. Cada transferencia incluye una **prueba de rango** (range proof) que garantiza que el monto es valido y que el remitente tiene saldo suficiente
3. El programa verifica la prueba sin necesitar conocer el monto real

\`\`\`
Saldo público:     1,000 USDC  (todos veem)
Saldo confidencial: Enc(1000)  (só o dono decifra)
\`\`\`

## Configuracion

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

Una caracteristica unica: es posible definir un **auditor** que posee una clave ElGamal capaz de descifrar todas las transferencias. Esto permite:

- Cumplimiento regulatorio
- Auditorias internas
- Transparencia selectiva

## Limitaciones actuales

- **Compute budget alto**: las pruebas ZK consumen muchas compute units
- **Latencia**: las pruebas necesitan ser generadas off-chain antes de enviar la transaccion
- **Compatibilidad**: no todas las wallets y DEXs soportan confidential transfers
- **Costo**: transacciones mas caras (mas espacio y computacion)

## Casos de uso ideales

- Pagos corporativos (salarios en stablecoin)
- Transacciones institucionales
- Stablecoins con privacidad regulada`,
    exerciseQuestion:
      "Que ocultan las transferencias confidenciales de Token-2022?",
    exerciseOptions: [
      "Las direcciones de remitente y destinatario",
      "La existencia de la transaccion en la blockchain",
      "Los montos transferidos y los saldos de las cuentas",
      "El programa que proceso la transaccion",
    ],
  },

  l48: {
    content: `# Interest-Bearing Tokens

## Concepto

La extension **InterestBearingMint** de Token-2022 permite que un token **acumule intereses** automaticamente a lo largo del tiempo. Los intereses se calculan en la **capa de visualizacion** — el saldo raw en la blockchain no cambia, pero el "saldo UI" presentado al usuario refleja los intereses acumulados.

## Como funciona?

El mecanismo es simple y elegante:

1. El mint almacena una **tasa de interes** (en basis points por ano)
2. El mint almacena un **timestamp de inicializacion**
3. Cualquier cliente que consulta el saldo aplica la formula de interes compuesto basada en el tiempo transcurrido

\`\`\`
Saldo UI = saldo_raw × (1 + taxa/10000) ^ (tempo_decorrido / 1_ano)
\`\`\`

## Configuracion

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

## Actualizando la tasa

La tasa puede ser modificada por la \`rateAuthority\` en cualquier momento:

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

## Calculando el saldo con intereses

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

- Los intereses son **solo de visualizacion** — el saldo raw no cambia en la blockchain
- No hay minteo automatico de nuevos tokens — es una representacion visual
- Ideal para **bonos tokenizados**, **stablecoins con yield** y **cuentas de ahorro on-chain**
- La tasa puede ser negativa (depreciacion)`,
    exerciseQuestion:
      "Como se aplican los intereses de un interest-bearing token en la practica?",
    exerciseOptions: [
      "Nuevos tokens son automaticamente minteados para cada holder en cada epoch",
      "El saldo raw en la blockchain es actualizado por un cron job on-chain",
      "Los intereses se calculan en la capa de visualizacion basandose en el tiempo transcurrido, sin modificar el saldo raw",
      "Un programa de staking distribuye rewards proporcionales",
    ],
  },

  l49: {
    content: `# Permanent Delegate y Tokens Non-Transferable

## Permanent Delegate

La extension **PermanentDelegate** de Token-2022 define una autoridad que puede **transferir o quemar** tokens de **cualquier** cuenta de ese mint, sin necesitar la firma del dueno.

### Casos de uso

- **Stablecoins reguladas**: compliance puede recuperar fondos de cuentas sancionadas
- **Gaming**: items de juego que pueden ser revocados por violacion de terminos
- **Seguros**: rescate automatico de tokens por un smart contract

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

La extension **NonTransferable** crea tokens que **no pueden ser transferidos** entre wallets — los llamados **soulbound tokens** (SBTs).

### Como funciona?

- El mint se marca como non-transferable en la creacion
- Las token accounts de este mint **solo pueden recibir** tokens via mint (MintTo)
- Cualquier intento de transferencia falla con error
- El holder aun puede **quemar** sus tokens

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

- **Credenciales educativas**: certificados que prueban la finalizacion de cursos
- **Reputacion**: score de gobernanza intransferible
- **XP en juegos**: experiencia que no puede ser vendida
- **KYC tokens**: prueba de identidad vinculada a la wallet
- **Memberships**: acceso exclusivo que no puede ser revendido

## Combinando extensiones

Una de las grandes ventajas de Token-2022 es poder **combinar extensiones**. Ejemplos poderosos:

- **NonTransferable + Metadata**: credencial soulbound con nombre e imagen
- **PermanentDelegate + TransferFee**: stablecoin con tarifa y compliance
- **InterestBearing + NonTransferable**: XP que acumula bonus temporal

## En Superteam Academy

El sistema de **XP** de la plataforma usa exactamente esta combinacion:
- Token-2022 con extension **NonTransferable** (soulbound)
- Level = \`floor(sqrt(xp / 100))\``,
    exerciseQuestion:
      "Que extension de Token-2022 se usa para crear tokens soulbound (intransferibles)?",
    exerciseOptions: [
      "PermanentDelegate",
      "TransferFee con tarifa de 100%",
      "NonTransferable",
      "FreezeAuthority en todas las cuentas",
    ],
  },

  l50: {
    content: `# Desafio: Creando un Token-2022 con Extensiones

## Objetivo

En este desafio, vas a crear un token usando el programa **Token-2022** con dos extensiones:

1. **TransferFee**: tarifa de 1% por transferencia, maximo de 1000 tokens
2. **TokenMetadata**: nombre, simbolo y URI on-chain

## Requisitos

- Crear el mint con ambas extensiones configuradas
- Configurar la tarifa de transferencia como 100 basis points (1%)
- Definir el maximo de fee como 1000 tokens (considerando decimales)
- Agregar metadata con nombre "Academy Token", simbolo "ACAD" y URI apuntando a un JSON

## Consejos

- Usa \`getMintLen\` para calcular el espacio necesario con extensiones
- Las instrucciones de extension deben ejecutarse **antes** del \`InitializeMint\`
- El orden importa: extensiones primero, luego mint init

## Flujo esperado

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
    exerciseQuestion:
      "Cual es el orden correcto para crear un mint Token-2022 con extensiones?",
    exerciseOptions: [
      "InitializeMint -> crear extensiones -> crear cuenta",
      "Crear cuenta -> InitializeMint -> crear extensiones",
      "Crear cuenta con espacio suficiente -> inicializar extensiones -> InitializeMint",
      "Las extensiones pueden agregarse en cualquier orden, incluso despues del mint",
    ],
    challengePrompt:
      "Crea un token Token-2022 con extension TransferFee (1%, max 1000 tokens) y metadata. Completa el codigo a continuacion para configurar las extensiones e inicializar el mint.",
  },

  // ── Curso 8: AMM y Liquidez ───────────────────────────────

  l51: {
    content: `# Que es un AMM?

## Introduccion

Un **Automated Market Maker** (AMM) es un protocolo que permite la negociacion de activos **sin order book** y **sin intermediarios**. En lugar de que compradores y vendedores creen ordenes, el AMM usa una **formula matematica** para definir el precio basandose en las reservas de un pool.

## Order Book vs AMM

### Order Book (modelo tradicional)

En el modelo de order book (usado por Binance, NYSE, etc.):
- Compradores publican ordenes de compra (**bids**)
- Vendedores publican ordenes de venta (**asks**)
- Los trades ocurren cuando bid >= ask
- Requiere **market makers** activos para proveer liquidez

### AMM (modelo DeFi)

En el modelo AMM:
- Proveedores de liquidez (**LPs**) depositan pares de tokens en un **pool**
- El precio se determina automaticamente por una **curva de precio**
- Cualquier persona puede intercambiar (swap) tokens en cualquier momento
- No se necesita una contraparte especifica

## Como funciona un pool?

\`\`\`
Pool SOL/USDC:
├── Reserva de SOL: 1,000 SOL
├── Reserva de USDC: 150,000 USDC
└── Preço implícito: 150 USDC/SOL
\`\`\`

Cuando alguien compra SOL:
1. Deposita USDC en el pool
2. Retira SOL del pool
3. La proporcion cambia -> el precio sube

## AMMs en Solana

Solana es ideal para AMMs gracias a:
- **Alta velocidad**: swaps en ~400ms
- **Bajo costo**: fracciones de centavo por transaccion
- **Composabilidad**: CPIs permiten integrar AMMs en cualquier programa

### Principales AMMs en Solana

| AMM | Tipo | Destaque |
|---|---|---|
| Raydium | CLMM + Legacy | Integracion con OpenBook |
| Orca | Whirlpools (CLMM) | UX simplificada |
| Meteora | DLMM | Bins de liquidez dinamica |
| Phoenix | Hibrido (LOB + AMM) | Order book on-chain |`,
    exerciseQuestion:
      "Cual es la principal diferencia entre un AMM y un order book?",
    exerciseOptions: [
      "El AMM es mas lento porque necesita consenso para cada trade",
      "El AMM usa una formula matematica para definir precios, sin necesidad de ordenes de compra/venta",
      "El order book no necesita liquidez para funcionar",
      "El AMM solo funciona en blockchains de alto rendimiento",
    ],
  },

  l52: {
    content: `# Formula del Producto Constante

## La formula x * y = k

La formula mas fundamental de los AMMs es el **producto constante**, popularizada por Uniswap V2:

\`\`\`
x * y = k
\`\`\`

Donde:
- **x** = reserva del token A en el pool
- **y** = reserva del token B en el pool
- **k** = constante (no cambia en swaps, solo en adicion/remocion de liquidez)

## Ejemplo numerico

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

Nota que el precio efectivo (166.67) es **mayor** que el precio spot (150). Esto es el **price impact**.

## Price Impact (Impacto en el Precio)

Cuanto mayor sea el trade en relacion al pool, mayor sera el price impact:

| Trade | % del Pool | Price Impact |
|---|---|---|
| 1 SOL | 1% | ~1% |
| 10 SOL | 10% | ~11% |
| 50 SOL | 50% | ~100% |

## Derivacion del precio

El precio marginal (spot price) en cualquier punto es:

\`\`\`
Preço de A em termos de B = dy/dx = y/x
\`\`\`

Para calcular la cantidad de output para un input dado:

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

El **slippage** es la diferencia entre el precio esperado y el precio ejecutado. Al hacer un swap, defines un **slippage tolerance** (ej: 0.5%) para protegerte contra movimientos de precio entre el envio y la ejecucion.

## Curvas alternativas

- **StableSwap (Curve)**: \`x³y + xy³ = k\` — menor price impact para activos similares (ej: USDC/USDT)
- **Concentrated Liquidity (Uni V3/Raydium CLMM)**: liquidez asignada a rangos de precio especificos`,
    exerciseQuestion:
      "En un pool x*y=k con 200 SOL y 30,000 USDC, cual es el precio spot de 1 SOL?",
    exerciseOptions: ["200 USDC", "100 USDC", "150 USDC", "30,000 USDC"],
  },

  l53: {
    content: `# Impermanent Loss

## Que es el Impermanent Loss?

**Impermanent Loss** (IL) es la diferencia de valor entre:
- Mantener tus tokens en un **pool de liquidez**
- Simplemente **holdear** los mismos tokens en tu wallet

Cuando el precio relativo de los tokens cambia, el pool rebalancea automaticamente, y el LP termina con mas del token que se deprecio y menos del que se aprecio.

## Por que "impermanent"?

Se llama "impermanent" porque:
- Si el precio **vuelve** al valor original, la perdida **desaparece**
- La perdida solo se vuelve **permanente** cuando retiras liquidez con un precio diferente al de entrada

## Calculando el IL

La formula del impermanent loss para un pool x*y=k es:

\`\`\`
IL = 2 × √(price_ratio) / (1 + price_ratio) - 1
\`\`\`

Donde \`price_ratio = precio_nuevo / precio_inicial\`

### Tabla de referencia

| Variacion de precio | IL |
|---|---|
| 1.25x (25% de alza) | -0.6% |
| 1.50x (50% de alza) | -2.0% |
| 2x (100% de alza) | -5.7% |
| 3x (200% de alza) | -13.4% |
| 5x (400% de alza) | -25.5% |
| 0.5x (50% de caida) | -5.7% |

## Ejemplo practico

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

## Estrategias para minimizar IL

1. **Pares estables**: pools USDC/USDT tienen IL casi cero
2. **Pools con fees altas**: tarifas de swap compensan el IL
3. **Concentrated liquidity**: rangos estrechos generan mas fees (pero mas IL si sale del rango)
4. **Cobertura**: usar derivados para proteger la posicion
5. **Single-sided liquidity**: algunos protocolos permiten deposito de un solo token

## IL en Concentrated Liquidity

En pools de liquidez concentrada (Raydium CLMM, Orca Whirlpools):
- El IL se **amplifica** dentro del rango
- Si el precio sale del rango, el LP tiene 100% del token que se deprecio
- Las fees ganadas tambien son mayores (compensacion)

\`\`\`typescript
// Simulando IL
function impermanentLoss(priceRatio: number): number {
  return 2 * Math.sqrt(priceRatio) / (1 + priceRatio) - 1;
}

console.log(impermanentLoss(2));   // -0.0572 (-5.72%)
console.log(impermanentLoss(0.5)); // -0.0572 (-5.72%)
\`\`\``,
    exerciseQuestion:
      "Si el precio de un activo se duplica (2x), cual es el impermanent loss aproximado en un pool x*y=k?",
    exerciseOptions: ["-2.0%", "-5.7%", "-13.4%", "-25.5%"],
  },

  l54: {
    content: `# Raydium: Arquitectura e Integracion

## Que es Raydium?

Raydium es el mayor AMM del ecosistema Solana, ofreciendo dos tipos de pools:

- **Legacy AMM (V4)**: pools de producto constante clasicos
- **Concentrated Liquidity Market Maker (CLMM)**: liquidez concentrada con ticks, similar a Uniswap V3

## Arquitectura CLMM

### Ticks y ranges

En el modelo CLMM, el espacio de precio se divide en **ticks** discretos. Cada LP elige un **range** (tick inferior y superior) donde su liquidez permanece activa.

\`\`\`
Preço: ──────|=====LP1=====|──────────────
             $140          $160

Preço: ──|========LP2========|────────────
         $130               $170

Preço atual: $150 → ambos LP1 e LP2 estão ativos
\`\`\`

### Ventajas de la liquidez concentrada

- **Eficiencia de capital**: 4000x mas eficiente que full-range
- **Mas fees**: liquidez concentrada gana proporcionalmente mas
- **Flexibilidad**: cada LP define su propia estrategia

## Integracion con SDK

### Instalacion

\`\`\`bash
npm install @raydium-io/raydium-sdk-v2
\`\`\`

### Inicializando el Raydium SDK

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

### Ejecutando un swap

\`\`\`typescript
const { execute } = await raydium.clmm.swap({
  poolInfo,
  inputMint: SOL_MINT,
  amountIn: new BN(1_000_000_000), // 1 SOL
  slippage: 0.005, // 0.5%
});

const txId = await execute();
\`\`\`

## Cuentas de Raydium

Un pool CLMM de Raydium involucra varias cuentas PDA:

| Cuenta | Descripcion |
|---|---|
| PoolState | Estado principal del pool (precio, liquidez, ticks) |
| AmmConfig | Configuracion (fee rate, tick spacing) |
| ProtocolPosition | Posicion del protocolo |
| PersonalPosition | Posicion de cada LP |
| TickArray | Array de ticks con liquidez |
| TokenVault A/B | Vaults que almacenan los tokens |

## Eventos

Raydium emite eventos para indexacion:
- \`Swap\`: token in/out, precio, fee
- \`LiquidityChange\`: adicion/remocion de liquidez
- \`CollectFee\`: recoleccion de fees por LP`,
    exerciseQuestion:
      "Cual es la principal ventaja de los pools CLMM de Raydium sobre los pools legacy?",
    exerciseOptions: [
      "Los pools CLMM son mas baratos de crear",
      "Los pools CLMM permiten liquidez concentrada en rangos de precio, aumentando la eficiencia de capital",
      "Los pools CLMM no cobran tarifas de swap",
      "Los pools CLMM no sufren impermanent loss",
    ],
  },

  l55: {
    content: `# Orca: Whirlpools

## Que son los Whirlpools?

**Whirlpools** son los pools de liquidez concentrada de Orca — el segundo AMM mas grande de Solana. El nombre "Whirlpool" viene de la idea de liquidez girando eficientemente en un vortice de precios.

## Conceptos clave

### Tick Arrays

Los Whirlpools organizan ticks en **tick arrays** — grupos contiguos de ticks almacenados en una misma cuenta PDA. Cada tick array contiene **88 ticks**.

\`\`\`
TickArray 0:  [tick 0 ... tick 87]
TickArray 1:  [tick 88 ... tick 175]
TickArray 2:  [tick 176 ... tick 263]
...
\`\`\`

### Tick Spacing

El \`tickSpacing\` define la granularidad del pool:

| tickSpacing | Uso tipico | Ejemplo |
|---|---|---|
| 1 | Pares estables | USDC/USDT |
| 8 | Pares populares | SOL/USDC |
| 64 | Pares exoticos | MEME/SOL |
| 128 | Pares de alta volatilidad | NEW/SOL |

Menor tickSpacing = mas granularidad = mas eficiencia para pares estables.

### Posiciones

Cada LP abre una **posicion** definida por:
- \`tickLowerIndex\`: tick inferior del rango
- \`tickUpperIndex\`: tick superior del rango
- \`liquidity\`: cantidad de liquidez depositada

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

## Gestion de posiciones

### Abriendo una posicion

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

### Recolectando fees

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
| Fee tiers | 0.01%, 0.05%, 0.3%, 1% | Configurable por AmmConfig |
| Ecosistema | Mas integrado con Jupiter | Integracion con OpenBook |`,
    exerciseQuestion: "Que son los tick arrays en los Whirlpools de Orca?",
    exerciseOptions: [
      "Arrays de precios historicos del pool",
      "Grupos contiguos de ticks almacenados en una misma cuenta PDA",
      "Listas de transacciones pendientes en el pool",
      "Registros de posiciones de todos los LPs",
    ],
  },

  l56: {
    content: `# Arbitraje y MEV en Solana

## Que es MEV?

**Maximal Extractable Value** (MEV) es el beneficio maximo que puede ser extraido de la produccion de bloques, mas alla de las recompensas estandar y tarifas de gas. En Solana, el MEV toma formas diferentes que en Ethereum debido a su arquitectura unica.

## Tipos de MEV en Solana

### 1. Arbitraje

Explotar diferencias de precio entre pools/DEXs:

\`\`\`
Raydium SOL/USDC: 150.00
Orca SOL/USDC:    150.50

Arbitragem:
1. Comprar SOL no Raydium por 150.00
2. Vender SOL na Orca por 150.50
3. Lucro: 0.50 USDC por SOL (menos fees)
\`\`\`

### 2. Sandwich Attack

El atacante "envuelve" la transaccion de la victima:

\`\`\`
1. Frontrun: Atacante compra SOL (preço sobe)
2. Vítima:   Compra SOL a preço inflado
3. Backrun:  Atacante vende SOL (lucro com a diferença)
\`\`\`

### 3. Liquidacion

Monitorear posiciones sub-colateralizadas en protocolos de lending para liquidarlas y ganar el bono de liquidacion.

### 4. JIT Liquidity (Just-In-Time)

Agregar liquidez en un pool concentrado **momentos antes** de un gran swap, capturar las fees, y remover la liquidez justo despues.

## Jito: MEV en Solana

**Jito** es el principal sistema de MEV en Solana:

### Jito Bundles

- Paquetes de transacciones ordenadas que se ejecutan **atomicamente**
- Si una transaccion falla, todo el bundle falla
- Validators con Jito priorizan bundles con propinas (tips)

\`\`\`typescript
import { SearcherClient } from 'jito-ts/dist/sdk/block-engine/searcher';

const client = SearcherClient.connect(jitoBlockEngineUrl);

// Criar bundle
const bundle = new Bundle([tx1, tx2, tx3], tipAmount);
await client.sendBundle(bundle);
\`\`\`

### Jito Tips

Validators de Jito aceptan **tips** (propinas) para inclusion prioritaria. Las tips van al validator, no a Jito.

## Proteccion contra MEV

### Para desarrolladores

1. **Slippage protection**: siempre definir slippage maximo en los swaps
2. **Priority fees**: pagar priority fees para inclusion rapida
3. **Jito bundles**: usar bundles para transacciones sensibles al orden
4. **Private mempools**: enviar transacciones directamente a validators de confianza

### Para usuarios

- Usar Jupiter con **MEV protection** activado
- Configurar slippage adecuado (0.5-1% para pares liquidos)
- Evitar transacciones grandes en pools poco profundos

## MEV en Solana vs Ethereum

| Aspecto | Solana | Ethereum |
|---|---|---|
| Mempool | No existe mempool publica | Mempool publica |
| Latencia | ~400ms por slot | ~12s por bloque |
| Costo de intento | Muy bajo | Alto (gas) |
| Mecanismo | Jito bundles | Flashbots, MEV-Boost |
| Sandwich | Mas dificil (sin mempool) | Muy comun |`,
    exerciseQuestion:
      "Por que los sandwich attacks son mas dificiles en Solana que en Ethereum?",
    exerciseOptions: [
      "Solana tiene un mecanismo de proteccion anti-MEV nativo",
      "No existe mempool publica en Solana, por lo que es mas dificil ver transacciones pendientes",
      "Las tarifas de transaccion en Solana son muy altas para hacer sandwiches rentables",
      "Solana bloquea automaticamente transacciones de MEV",
    ],
  },

  l57: {
    content: `# Desafio: Creando un Pool de Liquidez

## Objetivo

En este desafio, vas a crear e interactuar con un pool de liquidez usando el SDK de Raydium. Vas a:

1. Crear un pool CLMM para un par de tokens
2. Agregar liquidez en un rango de precio
3. Ejecutar un swap
4. Recolectar fees acumuladas

## Requisitos

- Inicializar el Raydium SDK con conexion devnet
- Crear un pool CLMM con fee tier de 0.25%
- Abrir una posicion con rango de +-10% del precio inicial
- Realizar un swap de prueba
- Recolectar fees de la posicion

## Conceptos necesarios

- CLMM y tick spacing
- Posicion con tick inferior y superior
- Quote de swap con slippage
- Recoleccion de fees acumuladas

## Consejos

- Usa el Raydium SDK V2 para interacciones simplificadas
- El \`tickSpacing\` es determinado por el fee tier
- Calcula ticks a partir del precio deseado con \`TickUtils\`
- Siempre define slippage al ejecutar swaps`,
    exerciseQuestion:
      "Al crear una posicion en un pool CLMM, que define el rango de precio donde tu liquidez esta activa?",
    exerciseOptions: [
      "El valor total depositado en cada token",
      "Los ticks inferior (tickLower) y superior (tickUpper)",
      "El fee tier configurado en el pool",
      "La cantidad de SOL usada como priority fee",
    ],
    challengePrompt:
      "Completa el codigo para crear un pool CLMM en Raydium, agregar liquidez y ejecutar un swap. Completa los TODOs indicados.",
  },

  // ── Curso 9: Anchor Avanzado ──────────────────────────────

  l58: {
    content: `# Revision: Fundamentos de Anchor

## Que es Anchor?

**Anchor** es el framework mas popular para el desarrollo de programas (smart contracts) en Solana. Abstrae gran parte de la complejidad del runtime de Solana y proporciona:

- **Serializacion/Deserializacion** automatica con Borsh
- **Validacion de cuentas** declarativa con macros
- **IDL** (Interface Definition Language) generada automaticamente
- **Client SDK** para TypeScript generado a partir del IDL

## Estructura de un programa Anchor

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

## Conceptos fundamentales

### Discriminator (8 bytes)

Toda account Anchor comienza con 8 bytes de **discriminator** — un hash SHA256 del nombre de la struct. Esto garantiza que la cuenta es del tipo esperado.

### Context y Accounts

El \`Context<T>\` contiene:
- \`accounts\`: las cuentas validadas
- \`program_id\`: el ID del programa
- \`remaining_accounts\`: cuentas extra sin tipo
- \`bumps\`: bumps de PDAs

### PDAs en Anchor

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

### Manejo de errores

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

## Tests con Anchor

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
    exerciseQuestion:
      "Cual es la funcion del discriminator de 8 bytes en una account Anchor?",
    exerciseOptions: [
      "Almacenar el saldo en lamports de la cuenta",
      "Identificar el tipo de cuenta a traves de un hash, garantizando que es del tipo esperado",
      "Encriptar los datos de la cuenta para privacidad",
      "Definir el tamano maximo que puede tener la cuenta",
    ],
  },

  l59: {
    content: `# Cross-Program Invocations (CPIs)

## Que son las CPIs?

**Cross-Program Invocations** permiten que un programa Solana llame instrucciones de **otro programa**. Esto es la base de la **composabilidad** en Solana — los programas pueden interactuar entre si como bloques de construccion.

## invoke vs invoke_signed

### invoke

Usado cuando las cuentas firmantes son **wallets externas** que ya firmaron la transaccion:

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

Usado cuando un **PDA** necesita firmar. El programa proporciona las seeds para que el runtime derive la firma:

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

## CPIs en Anchor (CpiContext)

Anchor simplifica CPIs con \`CpiContext\`:

### Transferencia de SOL

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

### Minteo de tokens via CPI

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

## Limites y consideraciones

- **Profundidad maxima**: 4 niveles de CPIs encadenadas
- **Compute budget**: las CPIs comparten el compute budget de la transaccion principal
- **Seguridad**: siempre validar el \`program_id\` del programa llamado
- **Re-entrancy**: Solana previene re-entrancy nativamente (un programa no puede llamarse a si mismo via CPI)

## Patron: Programa Intermediario

\`\`\`
Usuário → Programa A (seu protocolo)
              ├── CPI → Token Program (mint tokens)
              ├── CPI → System Program (transferir SOL)
              └── CPI → Programa B (outro protocolo)
\`\`\`

## Depuracion de CPIs

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
    exerciseQuestion:
      "Cuando debes usar invoke_signed en lugar de invoke en una CPI?",
    exerciseOptions: [
      "Cuando la CPI involucra al System Program",
      "Cuando un PDA necesita firmar la transaccion, ya que los PDAs no tienen clave privada",
      "Cuando la transaccion tiene mas de 2 firmas",
      "Cuando el programa llamado requiere mas compute units",
    ],
  },

  l60: {
    content: `# Eventos e Indexacion

## Por que eventos?

Los programas Solana son como backends — procesan transacciones, pero **no notifican** a los clientes proactivamente. Los **eventos** resuelven esto permitiendo que los programas emitan datos estructurados que pueden ser:

- **Capturados** en tiempo real via WebSocket
- **Indexados** para consultas historicas
- **Procesados** por sistemas off-chain

## Eventos en Anchor

### Definiendo un evento

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

### Emitiendo un evento

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

## Como funcionan los eventos internamente

1. \`emit!\` serializa el evento con Borsh
2. Agrega un **discriminator** de 8 bytes (hash SHA256 del nombre del evento)
3. Llama a \`sol_log_data\` con los datos serializados
4. El dato aparece en el campo \`data\` de los logs de la transaccion

## Consumiendo eventos en el client

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

## Indexacion con Helius

**Helius** ofrece webhooks y APIs para indexar eventos:

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

## Indexacion con Yellowstone (Geyser)

**Yellowstone** (plugin Geyser) proporciona streaming de datos en tiempo real via gRPC:

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

## Buenas practicas

- Emitir eventos para **todas las acciones** importantes (swaps, deposits, withdrawals)
- Incluir **timestamps** y **slots** para ordenacion
- Usar **tipos especificos** (Pubkey, u64) para facilitar indexacion
- Mantener eventos **compatibles** entre versiones del programa`,
    exerciseQuestion:
      "Que funcion de Anchor se usa para emitir un evento desde una instruccion?",
    exerciseOptions: ["log!()", "emit!()", "msg!()", "event!()"],
  },

  l61: {
    content: `# Zero-Copy y Optimizacion de Memoria

## El problema

Toda account Anchor estandar es **deserializada completamente** en el heap al accederla. Para cuentas pequenas (< 1KB), esto es eficiente. Pero para cuentas grandes (ej: order books, pools con muchos ticks), la deserializacion puede:

- **Consumir compute units** excesivas
- **Desbordar el heap** (32KB en Solana)
- **Aumentar la latencia** de la transaccion

## Zero-Copy: la solucion

La macro \`#[account(zero_copy)]\` hace que Anchor mapee la memoria de la cuenta **directamente** sin deserializacion Borsh. Los datos se acceden como un **puntero** a la region de memoria.

### Antes (estandar):
\`\`\`
Account data → Borsh deserialize → Struct na heap → uso → Borsh serialize → Account data
\`\`\`

### Con zero-copy:
\`\`\`
Account data → Ponteiro direto → uso → escrita direta → Account data
\`\`\`

## Implementacion

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

Para acceder a cuentas zero-copy, usa \`AccountLoader\` en lugar de \`Account\`:

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

## Reglas importantes

1. **repr(C)**: obligatorio para layout de memoria deterministico
2. **Padding**: los campos deben ser alineados manualmente (reglas de layout C de Rust)
3. **Tipos permitidos**: solo tipos primitivos y arrays de tamano fijo (sin Vec, String, etc.)
4. **Discriminator**: 8 bytes, como cuentas normales

## Comparacion de rendimiento

| Operacion | Account estandar | Zero-copy |
|---|---|---|
| Lectura (1KB) | ~2,000 CU | ~200 CU |
| Lectura (10KB) | ~20,000 CU | ~200 CU |
| Escritura (1KB) | ~2,500 CU | ~300 CU |
| Escritura (10KB) | ~25,000 CU | ~300 CU |
| Tamano maximo practico | ~10KB | ~10MB |

## Cuando usar

- **Usa zero-copy** cuando: cuentas > 1KB, muchos campos, arrays grandes, rendimiento critico
- **Usa estandar** cuando: cuentas pequenas, tipos complejos (String, Vec), la simplicidad es prioridad

## Limitacion: sin tipos dinamicos

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
    exerciseQuestion:
      "Cual es el principal beneficio de la macro #[account(zero_copy)] en Anchor?",
    exerciseOptions: [
      "Permite usar tipos dinamicos como Vec y String en las cuentas",
      "Elimina la necesidad de pagar rent por la cuenta",
      "Accede a los datos directamente en memoria sin deserializacion Borsh, reduciendo compute units",
      "Comprime los datos de la cuenta para ocupar menos espacio",
    ],
  },

  l62: {
    content: `# Seguridad de Programas Solana

## Por que la seguridad es critica?

Los programas Solana gestionan **dinero real**. Una unica vulnerabilidad puede resultar en la perdida de millones. La mayoria de los exploits en Solana provienen de errores de validacion.

## Vulnerabilidades comunes

### 1. Missing Signer Check

**Problema**: no verificar que el llamador realmente firmo la transaccion.

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

**Problema**: no verificar que la cuenta pertenece al programa esperado.

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

**Problema**: un atacante sustituye una cuenta esperada por otra.

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

## Constraints de Anchor

Anchor ofrece constraints declarativos para seguridad:

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

## Checklist de seguridad

1. Todas las cuentas tienen **signer checks** apropiados?
2. Todas las cuentas tienen **owner checks**?
3. Los PDAs usan **seeds unicas** y verifican **bumps**?
4. La aritmetica usa operaciones **checked_**?
5. Los constraints **has_one** validan relaciones entre cuentas?
6. Las cuentas no pueden ser **sustituidas** por cuentas maliciosas?
7. El programa maneja ataques de **re-initialization**?
8. Los datos de entrada estan **validados** (rangos, limites)?

## Herramientas de auditoria

- **Anchor verificable**: \`anchor build --verifiable\` para builds deterministicos
- **Soteria**: analisis estatico de seguridad para Solana
- **Sec3 (X-ray)**: scanner automatico de vulnerabilidades
- **Auditorias profesionales**: OtterSec, Neodyme, Trail of Bits`,
    exerciseQuestion:
      "Que vulnerabilidad ocurre cuando un programa no verifica que el llamador realmente firmo la transaccion?",
    exerciseOptions: [
      "PDA Seed Collision",
      "Arithmetic Overflow",
      "Missing Signer Check",
      "Account Substitution",
    ],
  },

  l63: {
    content: `# Programas Actualizables

## Como se despliegan los programas en Solana?

En Solana, los programas se almacenan en cuentas especiales gestionadas por el **BPF Upgradeable Loader**. Un deploy crea tres cuentas:

1. **Program Account**: direccion publica del programa (inmutable)
2. **ProgramData Account**: contiene el bytecode del programa (actualizable)
3. **Buffer Account**: temporal, usada durante la carga

\`\`\`
┌─────────────────────┐
│   Program Account   │
│   (endereço fixo)   │──→ ProgramData Account
│                     │     ├── upgrade_authority: Pubkey
└─────────────────────┘     ├── slot_deployed: u64
                            └── bytecode: [u8]
\`\`\`

## Upgrade Authority

La **upgrade authority** es la clave que puede actualizar el programa. Quien controla esta clave, controla el programa.

### Actualizando un programa

\`\`\`bash
# Deploy inicial
anchor deploy --provider.cluster devnet

# Upgrade (novo bytecode, mesmo endereço)
anchor upgrade target/deploy/meu_programa.so \\
  --program-id <PROGRAM_ID> \\
  --provider.cluster devnet
\`\`\`

### Transfiriendo authority

\`\`\`bash
solana program set-upgrade-authority <PROGRAM_ID> \\
  --new-upgrade-authority <NOVA_PUBKEY>
\`\`\`

### Haciendo inmutable

\`\`\`bash
# CUIDADO: irreversível!
solana program set-upgrade-authority <PROGRAM_ID> --final
\`\`\`

Despues de \`--final\`, el programa **nunca mas** puede ser actualizado. Esto es ideal para protocolos que quieren garantizar inmutabilidad total.

## Estrategias de upgrade

### 1. Multisig Authority

Usa un multisig (Squads Protocol) como upgrade authority:

\`\`\`
Authority = Squads Multisig (2 de 3)
├── Dev Team Key
├── Security Auditor Key
└── Community Council Key
\`\`\`

### 2. Timelock

Agrega un retraso (ej: 72h) antes de que los upgrades entren en vigor, dando tiempo a la comunidad para revisar.

### 3. Upgrade progresivo

1. Deploy con upgrade authority -> correcciones rapidas
2. Despues de la auditoria, transferir a multisig
3. Despues de la madurez, hacer inmutable (\`--final\`)

## Cerrando programas

Es posible **cerrar** un programa y recuperar los lamports de la cuenta de datos:

\`\`\`bash
solana program close <PROGRAM_ID> \\
  --recipient <WALLET_ADDRESS>
\`\`\`

**Atencion**: cerrar un programa es destructivo. La direccion sigue existiendo, pero cualquier instruccion fallara.

## Verificacion on-chain

Cualquier persona puede verificar si un programa es actualizable:

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
    exerciseQuestion:
      'Que sucede cuando ejecutas "solana program set-upgrade-authority --final" en un programa?',
    exerciseOptions: [
      "El programa se elimina de la blockchain",
      "La upgrade authority se transfiere al System Program",
      "El programa se vuelve permanentemente inmutable y nunca mas puede ser actualizado",
      "El programa se pausa temporalmente por 72 horas",
    ],
  },

  l64: {
    content: `# Clockwork y Automatizacion en Solana

## El problema

Los programas Solana son **reactivos** — solo se ejecutan cuando alguien envia una transaccion. No existe un "cron job" nativo en la blockchain. Pero muchos protocolos necesitan ejecucion automatizada:

- **DCA** (Dollar Cost Averaging): comprar X tokens cada dia
- **Liquidaciones**: liquidar posiciones sub-colateralizadas periodicamente
- **Vesting**: liberar tokens en fechas especificas
- **Oraculos**: actualizar precios en intervalos regulares
- **Auto-compound**: reinvertir rewards de staking

## Clockwork

**Clockwork** fue el protocolo pionero de automatizacion en Solana (descontinuado en 2024, pero los conceptos siguen siendo relevantes).

### Concepto: Threads

Un **thread** es una instruccion programada que se ejecuta automaticamente:

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

## Alternativas actuales

### 1. Jito Bundles + Keeper Bots

El enfoque mas comun actualmente: bots off-chain que monitorean condiciones y envian transacciones via Jito:

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

Helius puede notificar a tu backend cuando las condiciones on-chain cambian:

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

Para automatizaciones iniciadas por el usuario, Solana Actions permiten ejecutar transacciones desde URLs:

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

## Patron: Crank

El patron **crank** es el mas simple: una instruccion publica que cualquier persona puede llamar, con incentivo economico:

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

## Comparacion de enfoques

| Enfoque | Descentralizacion | Costo | Complejidad |
|---|---|---|---|
| Keeper bot (Jito) | Baja | Medio | Media |
| Helius webhook | Baja | Bajo | Baja |
| Patron crank | Alta | Variable | Media |
| Clockwork (legado) | Alta | Bajo | Baja |`,
    exerciseQuestion: 'Que es el patron "crank" en programas Solana?',
    exerciseOptions: [
      "Un mecanismo de compresion de datos on-chain",
      "Una instruccion publica que cualquier persona puede llamar para ejecutar logica periodica, generalmente con recompensa",
      "Un tipo especial de PDA para almacenar datos temporales",
      "Una extension de Token-2022 para automatizacion de transferencias",
    ],
  },

  l65: {
    content: `# Proyecto Final: Protocolo DeFi de Lending/Borrowing

## Objetivo

En este proyecto final, vas a construir el esqueleto de un **protocolo de lending/borrowing** en Solana usando Anchor. El protocolo permite:

1. **Depositar** colateral (SOL o tokens)
2. **Pedir prestado** tokens basandose en el colateral
3. **Pagar** prestamos con intereses
4. **Liquidar** posiciones sub-colateralizadas

## Arquitectura

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

## Cuentas del protocolo

- **Market**: PDA global con configuraciones (tasa de interes, LTV ratio, liquidation threshold)
- **Position**: PDA por usuario con colateral depositado y monto prestado
- **Vault**: token account del programa que almacena los depositos
- **Oracle**: feed de precio para calcular colateralizacion

## Instrucciones

1. \`initialize_market\` -- crea el Market PDA
2. \`deposit_collateral\` -- deposita tokens como colateral
3. \`borrow\` -- pide prestado tokens (CPI al token program)
4. \`repay\` -- paga prestamo con intereses acumulados
5. \`liquidate\` -- liquida posicion con LTV por encima del threshold

## Consejos

- Usa \`Clock::get()?\` para calcular intereses acumulados
- Implementa \`checked_mul\` y \`checked_div\` para aritmetica segura
- Usa CPIs para transferencias de tokens
- El oraculo puede ser simulado con una cuenta de precio simple`,
    exerciseQuestion:
      "En un protocolo de lending, que sucede cuando el LTV (Loan-to-Value) de una posicion supera el liquidation threshold?",
    exerciseOptions: [
      "El prestamo es automaticamente perdonado por el protocolo",
      "La posicion puede ser liquidada por un tercero, que recibe parte del colateral como incentivo",
      "El protocolo aumenta automaticamente la tasa de interes",
      "La posicion se congela hasta que el usuario deposite mas colateral",
    ],
    challengePrompt:
      "Completa el programa Anchor de lending/borrowing. Implementa las instrucciones deposit_collateral y borrow con las validaciones de seguridad necesarias.",
  },
});
