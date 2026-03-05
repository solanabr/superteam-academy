export type ChallengeStatus = "open" | "completed" | "claimed";
export type ChallengeTrack =
  | "Rust"
  | "Anchor"
  | "TypeScript"
  | "Assembly"
  | "General";
export type ChallengeDifficulty = "beginner" | "intermediate" | "advanced";

export interface ChallengeBlock {
  prompt: string;
  starterCode: string;
  language: "rust" | "typescript" | "json";
  testCases: { input: string; expected: string }[];
}

export interface Challenge {
  id: string;
  slug: string;
  title: string;
  description: string;
  image: string;
  track: ChallengeTrack;
  difficulty: ChallengeDifficulty;
  tags: string[];
  reward: string;
  status: ChallengeStatus;
  challengeBlock: ChallengeBlock;
}

export const challenges: Challenge[] = [
  // ─── 1. Cunhar um SPL Token (TypeScript, beginner) ───
  {
    id: "1",
    slug: "mint-spl-token",
    title: "Cunhar um SPL Token",
    description:
      "Implemente a cunhagem de um token SPL na rede Solana usando TypeScript e @solana/web3.js.",
    image: "/challenges/mint-spl-token.png",
    track: "TypeScript",
    difficulty: "beginner",
    tags: ["TypeScript", "SPL", "Token"],
    reward: "1 NFT",
    status: "open",
    challengeBlock: {
      prompt: `## Objetivo

Crie um script TypeScript completo que:

1. Conecte à devnet e crie um keypair para o payer
2. Crie um **novo Mint** de SPL Token com 9 decimais
3. Crie uma **Associated Token Account (ATA)** para o payer
4. Minte **1.000.000 tokens** para a ATA do payer
5. Crie uma **segunda ATA** para um receiver e transfira **250.000 tokens**
6. Imprima o saldo final de ambas as contas

### Requisitos
- Use \`@solana/spl-token\` para todas as operações de token
- O mint authority deve ser o payer
- Use \`getOrCreateAssociatedTokenAccount\` para criar ATAs
- Use \`mintTo\` e \`transfer\` do spl-token
- Trate os decimais corretamente (9 decimais = multiplicar por 10^9)`,
      starterCode: `import { Connection, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  transfer,
  getMint,
  getAccount,
} from '@solana/spl-token';

const DECIMALS = 9;

async function main() {
  // 1. Conectar à devnet e criar payer
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  const payer = Keypair.generate();
  const airdropSig = await connection.requestAirdrop(payer.publicKey, 2 * LAMPORTS_PER_SOL);
  await connection.confirmTransaction(airdropSig);

  const receiver = Keypair.generate();

  // 2. TODO: Criar um novo Mint com 9 decimais
  // Use createMint(connection, payer, mintAuthority, freezeAuthority, decimals)
  // mintAuthority e freezeAuthority devem ser payer.publicKey


  // 3. TODO: Criar ATA do payer para o mint
  // Use getOrCreateAssociatedTokenAccount(connection, payer, mint, owner)


  // 4. TODO: Mintar 1.000.000 tokens (atenção aos decimais!) para a ATA do payer
  // Use mintTo(connection, payer, mint, destination, authority, amount)


  // 5. TODO: Criar ATA do receiver e transferir 250.000 tokens
  // Use getOrCreateAssociatedTokenAccount para o receiver
  // Use transfer(connection, payer, source, destination, owner, amount)


  // 6. TODO: Buscar e imprimir saldos finais de ambas as contas
  // Use getAccount(connection, ata.address) e divida amount por 10^DECIMALS

}

main();`,
      language: "typescript",
      testCases: [
        {
          input: "createMint",
          expected:
            "createMint(connection, payer, payer.publicKey, payer.publicKey, DECIMALS)",
        },
        {
          input: "getOrCreateAssociatedTokenAccount",
          expected:
            "getOrCreateAssociatedTokenAccount(connection, payer, mint, payer.publicKey)",
        },
        {
          input: "mintTo",
          expected:
            "mintTo(connection, payer, mint, payerAta.address, payer, 1_000_000 * 10 ** DECIMALS)",
        },
        {
          input: "transfer",
          expected:
            "transfer(connection, payer, payerAta.address, receiverAta.address, payer, 250_000 * 10 ** DECIMALS)",
        },
      ],
    },
  },

  // ─── 2. Anchor Escrow (Anchor, beginner) ───
  {
    id: "2",
    slug: "anchor-escrow",
    title: "Anchor Escrow",
    description:
      "Construa um programa de escrow em Anchor: depósito, liberação e cancelamento de acordos.",
    image: "/challenges/anchor-escrow.png",
    track: "Anchor",
    difficulty: "beginner",
    tags: ["Anchor", "Escrow", "DeFi"],
    reward: "1 NFT",
    status: "open",
    challengeBlock: {
      prompt: `## Objetivo

Implemente um programa Anchor de **Escrow** completo com 3 instruções:

### 1. \`initialize_escrow\`
- Cria uma conta PDA Escrow com seeds \`["escrow", maker.key()]\`
- O maker deposita SOL nativos no escrow via CPI para System Program
- Armazena: maker, receiver, amount, bump, is_active = true

### 2. \`release_escrow\`
- Somente o **maker** pode liberar
- Transfere os SOL do escrow PDA para o receiver via CPI
- Marca is_active = false

### 3. \`cancel_escrow\`
- Somente o **maker** pode cancelar (antes de liberar)
- Devolve os SOL do escrow PDA para o maker
- Marca is_active = false

### Requisitos
- Use \`require!\` para validar que o escrow está ativo
- Use \`has_one\` para validar authority
- O escrow PDA deve ser o detentor dos fundos (lamports direto na conta)
- Implemente \`EscrowError\` com variantes: EscrowInactive, Unauthorized
- Use \`#[account(close = maker)]\` no cancel para devolver o rent`,
      starterCode: `use anchor_lang::prelude::*;
use anchor_lang::system_program;

declare_id!("EscrowProgramXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");

#[program]
pub mod escrow {
    use super::*;

    pub fn initialize_escrow(
        ctx: Context<InitializeEscrow>,
        amount: u64,
    ) -> Result<()> {
        // TODO: Configurar a conta escrow com:
        // - maker = ctx.accounts.maker.key()
        // - receiver = ctx.accounts.receiver.key()
        // - amount
        // - bump = ctx.bumps.escrow
        // - is_active = true


        // TODO: Transferir SOL do maker para o escrow PDA
        // Use system_program::transfer com CpiContext


        Ok(())
    }

    pub fn release_escrow(ctx: Context<ReleaseEscrow>) -> Result<()> {
        // TODO: Verificar que o escrow está ativo
        // Use require!(escrow.is_active, EscrowError::EscrowInactive)


        // TODO: Transferir lamports do escrow PDA para o receiver
        // Como o escrow é PDA, use transferência direta de lamports:
        // **escrow.to_account_info().try_borrow_mut_lamports()? -= amount;
        // **receiver.to_account_info().try_borrow_mut_lamports()? += amount;


        // TODO: Marcar escrow como inativo


        Ok(())
    }

    pub fn cancel_escrow(ctx: Context<CancelEscrow>) -> Result<()> {
        // TODO: Verificar que o escrow está ativo


        // TODO: Fechar a conta escrow devolvendo rent + fundos ao maker
        // O #[account(close = maker)] já cuida disso


        Ok(())
    }
}

// TODO: Definir a struct Escrow com #[account] e #[derive(InitSpace)]
// Campos: maker (Pubkey), receiver (Pubkey), amount (u64), bump (u8), is_active (bool)
#[account]
#[derive(InitSpace)]
pub struct Escrow {

}

// TODO: Definir InitializeEscrow com #[derive(Accounts)]
// Contas: escrow (init, PDA), maker (mut, Signer), receiver, system_program
#[derive(Accounts)]
pub struct InitializeEscrow<'info> {

}

// TODO: Definir ReleaseEscrow com #[derive(Accounts)]
// Contas: escrow (mut, has_one = maker), maker (Signer), receiver (mut)
#[derive(Accounts)]
pub struct ReleaseEscrow<'info> {

}

// TODO: Definir CancelEscrow com #[derive(Accounts)]
// Contas: escrow (mut, close = maker, has_one = maker), maker (mut, Signer)
#[derive(Accounts)]
pub struct CancelEscrow<'info> {

}

// TODO: Definir EscrowError com #[error_code]
// Variantes: EscrowInactive, Unauthorized
#[error_code]
pub enum EscrowError {

}`,
      language: "rust",
      testCases: [
        {
          input: "Escrow struct",
          expected:
            "pub maker: Pubkey, pub receiver: Pubkey, pub amount: u64, pub bump: u8, pub is_active: bool",
        },
        {
          input: "initialize_escrow",
          expected:
            "escrow.maker = maker.key(); escrow.amount = amount; escrow.is_active = true; system_program::transfer(cpi_ctx, amount)",
        },
        {
          input: "release_escrow",
          expected:
            "require!(escrow.is_active); transfer lamports from escrow to receiver; escrow.is_active = false",
        },
        {
          input: "cancel_escrow",
          expected: "require!(escrow.is_active); #[account(close = maker)]",
        },
      ],
    },
  },

  // ─── 3. Anchor Vault (Anchor, beginner) ───
  {
    id: "3",
    slug: "anchor-vault",
    title: "Anchor Vault",
    description:
      "Crie um vault que aceita depósitos e permite saques com regras de tempo e ownership.",
    image: "/challenges/anchor-vault.png",
    track: "Anchor",
    difficulty: "beginner",
    tags: ["Anchor", "Vault", "DeFi"],
    reward: "1 NFT",
    status: "open",
    challengeBlock: {
      prompt: `## Objetivo

Implemente um **Vault program** em Anchor com timelock e multiple depositors:

### Instruções

#### 1. \`initialize_vault\`
- Cria a conta PDA do vault com seeds \`["vault", authority.key()]\`
- Define o \`lock_duration\` (em segundos) — período mínimo antes de permitir saque
- Armazena authority, total_deposited, lock_duration, created_at (Clock timestamp)

#### 2. \`deposit\`
- Qualquer pessoa pode depositar SOL no vault
- Cria/atualiza uma conta PDA \`DepositReceipt\` com seeds \`["receipt", vault.key(), depositor.key()]\`
- Registra: depositor, amount, deposited_at (Clock timestamp)
- Atualiza \`vault.total_deposited\`

#### 3. \`withdraw\`
- Somente o depositor original pode sacar
- Verifica que o \`lock_duration\` já passou desde \`deposited_at\`
- Transfere os lamports do vault PDA de volta ao depositor
- Fecha o DepositReceipt

### Requisitos
- Use \`Clock::get()?.unix_timestamp\` para timestamps
- Implemente \`VaultError\` com: LockPeriodNotExpired, InsufficientFunds, Unauthorized
- O vault PDA detém os SOL diretamente (não usa token accounts)
- Use \`require!\` e \`has_one\` para todas as validações`,
      starterCode: `use anchor_lang::prelude::*;
use anchor_lang::system_program;

declare_id!("VaultProgXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");

#[program]
pub mod vault {
    use super::*;

    pub fn initialize_vault(
        ctx: Context<InitializeVault>,
        lock_duration: i64,
    ) -> Result<()> {
        // TODO: Configurar vault com:
        // - authority, total_deposited = 0, lock_duration
        // - created_at = Clock::get()?.unix_timestamp
        // - bump = ctx.bumps.vault


        Ok(())
    }

    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        // TODO: Transferir SOL do depositor para o vault PDA
        // Use system_program::transfer


        // TODO: Atualizar deposit_receipt com:
        // - depositor, amount (acumular se já existir), deposited_at


        // TODO: Atualizar vault.total_deposited


        Ok(())
    }

    pub fn withdraw(ctx: Context<Withdraw>) -> Result<()> {
        let now = Clock::get()?.unix_timestamp;

        // TODO: Verificar que o lock_duration já expirou
        // require!(now >= receipt.deposited_at + vault.lock_duration, VaultError::LockPeriodNotExpired)


        // TODO: Transferir lamports do vault PDA para o depositor
        // Use transferência direta de lamports (vault é PDA)


        // TODO: Atualizar vault.total_deposited


        // O #[account(close = depositor)] já fecha o receipt

        Ok(())
    }
}

#[account]
#[derive(InitSpace)]
pub struct Vault {
    // TODO: Definir campos:
    // authority: Pubkey, total_deposited: u64, lock_duration: i64,
    // created_at: i64, bump: u8
}

#[account]
#[derive(InitSpace)]
pub struct DepositReceipt {
    // TODO: Definir campos:
    // depositor: Pubkey, amount: u64, deposited_at: i64, bump: u8
}

#[derive(Accounts)]
pub struct InitializeVault<'info> {
    // TODO: Definir contas:
    // vault (init, PDA seeds=["vault", authority.key()], payer=authority)
    // authority (mut, Signer)
    // system_program
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    // TODO: Definir contas:
    // vault (mut)
    // deposit_receipt (init_if_needed, PDA seeds=["receipt", vault.key(), depositor.key()])
    // depositor (mut, Signer)
    // system_program
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    // TODO: Definir contas:
    // vault (mut)
    // deposit_receipt (mut, close=depositor, has_one=depositor)
    // depositor (mut, Signer)
    // system_program
}

#[error_code]
pub enum VaultError {
    // TODO: Definir variantes:
    // LockPeriodNotExpired, InsufficientFunds, Unauthorized
}`,
      language: "rust",
      testCases: [
        {
          input: "Vault struct",
          expected:
            "authority: Pubkey, total_deposited: u64, lock_duration: i64, created_at: i64, bump: u8",
        },
        {
          input: "initialize_vault",
          expected:
            "vault.authority = authority.key(); vault.lock_duration = lock_duration; vault.created_at = Clock::get()?.unix_timestamp",
        },
        {
          input: "deposit",
          expected:
            "system_program::transfer(cpi_ctx, amount); receipt.amount += amount; vault.total_deposited += amount",
        },
        {
          input: "withdraw",
          expected:
            "require!(now >= receipt.deposited_at + vault.lock_duration); transfer lamports; vault.total_deposited -= receipt.amount",
        },
      ],
    },
  },

  // ─── 4. Anchor Flash Loan (Anchor, intermediate) ───
  {
    id: "4",
    slug: "anchor-flash-loan",
    title: "Anchor Flash Loan",
    description:
      "Desenvolva um protocolo de flash loan em Anchor: empréstimo e devolução na mesma transação.",
    image: "/challenges/anchor-flash-loan.png",
    track: "Anchor",
    difficulty: "intermediate",
    tags: ["Anchor", "DeFi"],
    reward: "1 NFT",
    status: "open",
    challengeBlock: {
      prompt: `## Objetivo

Implemente um protocolo de **Flash Loan** em Anchor. Flash loans permitem emprestar tokens sem colateral, desde que o empréstimo seja devolvido **na mesma transação** com uma taxa.

### Instruções

#### 1. \`initialize_pool\`
- Cria um pool PDA com seeds \`["pool", mint.key()]\`
- Define o fee_bps (taxa em basis points, ex: 30 = 0.3%)
- A authority do pool deposita liquidez inicial

#### 2. \`flash_borrow\`
- Transfere tokens SPL do pool vault para o borrower
- Registra o empréstimo em uma conta temporária \`FlashLoan\` PDA
- Armazena: borrower, amount, fee, repaid = false

#### 3. \`flash_repay\`
- O borrower devolve amount + fee ao pool vault
- Verifica que \`flash_loan.repaid == false\`
- Marca \`flash_loan.repaid = true\` e fecha a conta
- Se a instrução seguinte na tx não for repay, o runtime falha (invariante)

### Requisitos
- Use Token Program CPIs (\`token::transfer\`) para mover tokens SPL
- Fee calculado: \`amount * fee_bps / 10_000\`
- Use \`checked_mul\` e \`checked_div\` para evitar overflow
- Implemente \`FlashLoanError\` com: AlreadyRepaid, InsufficientRepayment, PoolDrained
- O pool vault é uma token account owned pela pool PDA`,
      starterCode: `use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Mint, Transfer};

declare_id!("F1ashLoanXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");

#[program]
pub mod flash_loan {
    use super::*;

    pub fn initialize_pool(
        ctx: Context<InitializePool>,
        fee_bps: u16,
    ) -> Result<()> {
        // TODO: Configurar pool com:
        // - authority, mint, fee_bps, total_liquidity = 0
        // - vault = ctx.accounts.vault.key()
        // - bump = ctx.bumps.pool


        Ok(())
    }

    pub fn add_liquidity(
        ctx: Context<AddLiquidity>,
        amount: u64,
    ) -> Result<()> {
        // TODO: Transferir tokens do provider para o vault via CPI
        // Use token::transfer com CpiContext


        // TODO: Atualizar pool.total_liquidity


        Ok(())
    }

    pub fn flash_borrow(
        ctx: Context<FlashBorrow>,
        amount: u64,
    ) -> Result<()> {
        let pool = &ctx.accounts.pool;

        // TODO: Verificar que o pool tem liquidez suficiente
        // require!(pool.total_liquidity >= amount, FlashLoanError::PoolDrained)


        // TODO: Calcular fee = amount * fee_bps / 10_000
        // Use checked_mul e checked_div


        // TODO: Transferir tokens do vault para o borrower via CPI com PDA signer
        // Seeds: ["pool", pool.mint.as_ref(), &[pool.bump]]


        // TODO: Configurar flash_loan PDA:
        // - borrower, amount, fee, repaid = false


        Ok(())
    }

    pub fn flash_repay(ctx: Context<FlashRepay>) -> Result<()> {
        let flash_loan = &mut ctx.accounts.flash_loan;

        // TODO: Verificar que ainda não foi repaid
        // require!(!flash_loan.repaid, FlashLoanError::AlreadyRepaid)


        // TODO: Calcular total_due = flash_loan.amount + flash_loan.fee


        // TODO: Transferir total_due do borrower para o vault via CPI


        // TODO: Atualizar pool.total_liquidity com a fee


        // TODO: Marcar flash_loan.repaid = true


        Ok(())
    }
}

#[account]
#[derive(InitSpace)]
pub struct Pool {
    // TODO: authority: Pubkey, mint: Pubkey, vault: Pubkey,
    // fee_bps: u16, total_liquidity: u64, bump: u8
}

#[account]
#[derive(InitSpace)]
pub struct FlashLoan {
    // TODO: borrower: Pubkey, amount: u64, fee: u64,
    // repaid: bool, bump: u8
}

#[derive(Accounts)]
pub struct InitializePool<'info> {
    // TODO: pool (init, PDA), authority (Signer), mint, vault (token account),
    // token_program, system_program
}

#[derive(Accounts)]
pub struct AddLiquidity<'info> {
    // TODO: pool (mut), vault (mut token account), provider_ata (mut),
    // provider (Signer), token_program
}

#[derive(Accounts)]
pub struct FlashBorrow<'info> {
    // TODO: pool (mut), vault (mut), flash_loan (init, PDA),
    // borrower_ata (mut), borrower (Signer), token_program, system_program
}

#[derive(Accounts)]
pub struct FlashRepay<'info> {
    // TODO: pool (mut), vault (mut), flash_loan (mut, close=borrower),
    // borrower_ata (mut), borrower (Signer), token_program
}

#[error_code]
pub enum FlashLoanError {
    // TODO: AlreadyRepaid, InsufficientRepayment, PoolDrained
}`,
      language: "rust",
      testCases: [
        {
          input: "Pool struct",
          expected:
            "authority: Pubkey, mint: Pubkey, vault: Pubkey, fee_bps: u16, total_liquidity: u64, bump: u8",
        },
        {
          input: "flash_borrow fee",
          expected: "amount.checked_mul(fee_bps as u64).checked_div(10_000)",
        },
        {
          input: "flash_borrow transfer",
          expected:
            "token::transfer(cpi_ctx.with_signer(signer_seeds), amount)",
        },
        {
          input: "flash_repay",
          expected:
            "require!(!flash_loan.repaid); token::transfer(cpi_ctx, total_due); pool.total_liquidity += flash_loan.fee; flash_loan.repaid = true",
        },
      ],
    },
  },

  // ─── 5. Pinocchio Vault (Rust nativo, intermediate) ───
  {
    id: "5",
    slug: "pinocchio-vault",
    title: "Pinocchio Vault",
    description:
      "Implemente um vault em Rust nativo (Pinocchio) com contas PDA e CPI.",
    image: "/challenges/pinocchio-vault.png",
    track: "Rust",
    difficulty: "intermediate",
    tags: ["Rust", "Vault"],
    reward: "1 NFT",
    status: "open",
    challengeBlock: {
      prompt: `## Objetivo

Implemente um **Vault** em Rust nativo usando a crate \`pinocchio\` (sem Anchor). Este desafio testa seu conhecimento de programação Solana de baixo nível.

### Instruções (discriminadas por 1 byte)

#### Instrução 0: \`Initialize\`
- Cria uma conta PDA com seeds \`["vault", authority]\`
- Serializa os dados: authority (32 bytes), balance (8 bytes), bump (1 byte)
- O caller paga o rent via \`create_account\` CPI ao System Program

#### Instrução 1: \`Deposit\`
- Verifica que o caller é o authority do vault
- Transfere lamports do caller para o vault via \`transfer\` CPI
- Atualiza o campo balance no vault

#### Instrução 2: \`Withdraw\`
- Verifica que o caller é o authority
- Verifica que balance >= amount solicitado
- Transfere lamports do vault PDA para o caller (PDA sign)
- Atualiza balance

### Requisitos
- Parse manual de instruction_data (sem Borsh, use slices)
- Derive PDA manualmente com \`Pubkey::find_program_address\`
- Valide todas as contas (is_signer, is_writable, key matches)
- Use \`invoke_signed\` para transferências do PDA
- Retorne \`ProgramError\` customizado para cada falha`,
      starterCode: `use pinocchio::{
    account_info::AccountInfo,
    entrypoint,
    msg,
    program::invoke_signed,
    program_error::ProgramError,
    pubkey::Pubkey,
    ProgramResult,
};
use pinocchio_system::instructions::Transfer;

entrypoint!(process_instruction);

// Vault data layout: authority (32) + balance (8) + bump (1) = 41 bytes
const VAULT_SIZE: usize = 41;
const AUTHORITY_OFFSET: usize = 0;
const BALANCE_OFFSET: usize = 32;
const BUMP_OFFSET: usize = 40;

pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    if instruction_data.is_empty() {
        return Err(ProgramError::InvalidInstructionData);
    }

    match instruction_data[0] {
        0 => initialize(program_id, accounts, &instruction_data[1..]),
        1 => deposit(program_id, accounts, &instruction_data[1..]),
        2 => withdraw(program_id, accounts, &instruction_data[1..]),
        _ => Err(ProgramError::InvalidInstructionData),
    }
}

fn initialize(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    _data: &[u8],
) -> ProgramResult {
    // accounts[0] = authority (signer, writable)
    // accounts[1] = vault PDA (writable)
    // accounts[2] = system_program

    // TODO: Validar que accounts tem pelo menos 3 elementos


    // TODO: Verificar que authority é signer


    // TODO: Derivar PDA com seeds ["vault", authority.key]
    // Use Pubkey::find_program_address


    // TODO: Verificar que vault.key == PDA derivado


    // TODO: Criar a conta via CPI (invoke_signed)
    // Use system_program create_account com rent, space=VAULT_SIZE


    // TODO: Serializar dados no vault:
    // - bytes 0..32: authority.key
    // - bytes 32..40: balance (0u64.to_le_bytes())
    // - byte 40: bump


    Ok(())
}

fn deposit(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
    data: &[u8],
) -> ProgramResult {
    // accounts[0] = authority (signer, writable)
    // accounts[1] = vault PDA (writable)
    // accounts[2] = system_program

    // TODO: Parse amount from data (first 8 bytes, little-endian u64)
    // let amount = u64::from_le_bytes(data[0..8].try_into().unwrap());


    // TODO: Verificar que authority é signer e é o authority do vault
    // Compare accounts[0].key com vault_data[0..32]


    // TODO: Transferir lamports do authority para vault via CPI
    // Use Transfer instruction


    // TODO: Atualizar balance no vault
    // Read current balance, add amount, write back


    Ok(())
}

fn withdraw(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    data: &[u8],
) -> ProgramResult {
    // accounts[0] = authority (signer, writable)
    // accounts[1] = vault PDA (writable)
    // accounts[2] = system_program

    // TODO: Parse amount from data


    // TODO: Verificar authority


    // TODO: Verificar balance >= amount


    // TODO: Transferir lamports do vault para authority via invoke_signed
    // Seeds: ["vault", authority.key, &[bump]]


    // TODO: Atualizar balance no vault


    Ok(())
}`,
      language: "rust",
      testCases: [
        {
          input: "initialize PDA",
          expected:
            'Pubkey::find_program_address(&[b"vault", authority.key.as_ref()], program_id)',
        },
        {
          input: "deposit transfer",
          expected:
            "Transfer { from: authority, to: vault }; invoke(transfer_ix, &[authority, vault, system_program])",
        },
        {
          input: "withdraw invoke_signed",
          expected:
            'invoke_signed(transfer_ix, &[vault, authority], &[&[b"vault", authority_key, &[bump]]])',
        },
        {
          input: "balance update",
          expected:
            "vault_data[32..40].copy_from_slice(&new_balance.to_le_bytes())",
        },
      ],
    },
  },

  // ─── 6. Pinocchio AMM (Rust nativo, advanced) ───
  {
    id: "6",
    slug: "pinocchio-amm",
    title: "Pinocchio AMM",
    description:
      "Construa um AMM (Automated Market Maker) em Rust com pool de liquidez e swap.",
    image: "/challenges/pinocchio-amm.png",
    track: "Rust",
    difficulty: "advanced",
    tags: ["Rust", "AMM", "DeFi", "Swap"],
    reward: "1 NFT",
    status: "open",
    challengeBlock: {
      prompt: `## Objetivo

Implemente um **Automated Market Maker (AMM)** em Rust nativo usando a fórmula de produto constante \`x * y = k\`.

### Instruções

#### 0: \`InitializePool\`
- Cria a pool PDA com seeds \`["amm", token_a_mint, token_b_mint]\`
- Armazena: token_a_mint, token_b_mint, reserve_a, reserve_b, lp_supply, fee_bps, bump
- Cria token accounts (vault_a, vault_b) owned pela pool PDA

#### 1: \`AddLiquidity\`
- Provider deposita token_a e token_b proporcionalmente às reservas
- Se pool vazia: aceita qualquer proporção (primeiro depositor define o preço)
- Calcula LP tokens: \`min(amount_a * lp_supply / reserve_a, amount_b * lp_supply / reserve_b)\`
- Primeira adição: \`LP = sqrt(amount_a * amount_b)\`
- Minta LP tokens para o provider

#### 2: \`Swap\`
- Implementa \`x * y = k\` com fee
- Input: token_a ou token_b (indicado por flag)
- \`amount_out = (reserve_out * amount_in_after_fee) / (reserve_in + amount_in_after_fee)\`
- \`amount_in_after_fee = amount_in * (10_000 - fee_bps) / 10_000\`
- Atualiza reservas

#### 3: \`RemoveLiquidity\`
- Provider queima LP tokens e recebe proporção das reservas
- \`amount_a = lp_amount * reserve_a / lp_supply\`
- \`amount_b = lp_amount * reserve_b / lp_supply\`

### Requisitos
- Toda aritmética com \`checked_mul\`, \`checked_div\`, \`checked_add\`, \`checked_sub\`
- Implementar sqrt via método babilônico (Newton) para LP tokens iniciais
- Token CPIs para todas transferências (invoke_signed com PDA seeds)
- Slippage check: \`require!(amount_out >= min_amount_out)\`
- Validar que mints correspondem aos da pool`,
      starterCode: `use pinocchio::{
    account_info::AccountInfo,
    entrypoint,
    msg,
    program::invoke_signed,
    program_error::ProgramError,
    pubkey::Pubkey,
    ProgramResult,
};

entrypoint!(process_instruction);

// Pool data layout
const POOL_SIZE: usize = 145;
// token_a_mint (32) + token_b_mint (32) + reserve_a (8) + reserve_b (8)
// + lp_supply (8) + fee_bps (2) + bump (1) + vault_a (32) + vault_b (32)

pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    data: &[u8],
) -> ProgramResult {
    match data[0] {
        0 => initialize_pool(program_id, accounts, &data[1..]),
        1 => add_liquidity(program_id, accounts, &data[1..]),
        2 => swap(program_id, accounts, &data[1..]),
        3 => remove_liquidity(program_id, accounts, &data[1..]),
        _ => Err(ProgramError::InvalidInstructionData),
    }
}

/// Babylonian sqrt for u128 -> u64
fn sqrt(n: u128) -> u64 {
    // TODO: Implementar sqrt via método de Newton
    // 1. Se n == 0, retorne 0
    // 2. x = n, y = (x + 1) / 2
    // 3. Enquanto y < x: x = y, y = (x + n/x) / 2
    // 4. Retorne x as u64

    0
}

fn initialize_pool(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    data: &[u8],
) -> ProgramResult {
    // accounts: [authority, pool_pda, vault_a, vault_b, mint_a, mint_b, system_program, token_program]

    // TODO: Parse fee_bps from data (2 bytes, u16 LE)


    // TODO: Derive pool PDA: seeds = ["amm", mint_a.key, mint_b.key]


    // TODO: Create pool account via CPI


    // TODO: Serialize pool data


    Ok(())
}

fn add_liquidity(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    data: &[u8],
) -> ProgramResult {
    // accounts: [provider, pool, vault_a, vault_b, provider_ata_a, provider_ata_b, token_program]

    // TODO: Parse amount_a and amount_b from data (8 bytes each)


    // TODO: Read current reserves from pool data


    // TODO: Calculate LP tokens to mint
    // Se pool vazia (lp_supply == 0): lp = sqrt(amount_a * amount_b)
    // Senão: lp = min(amount_a * lp_supply / reserve_a, amount_b * lp_supply / reserve_b)


    // TODO: Transfer token_a from provider to vault_a via CPI


    // TODO: Transfer token_b from provider to vault_b via CPI


    // TODO: Update reserves and lp_supply in pool data


    Ok(())
}

fn swap(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    data: &[u8],
) -> ProgramResult {
    // accounts: [user, pool, vault_in, vault_out, user_ata_in, user_ata_out, token_program]

    // TODO: Parse amount_in (8 bytes), min_amount_out (8 bytes), direction flag (1 byte)


    // TODO: Read reserves (determine which is in/out based on direction)


    // TODO: Calculate amount_out using constant product formula:
    // amount_in_after_fee = amount_in * (10_000 - fee_bps) / 10_000
    // amount_out = reserve_out * amount_in_after_fee / (reserve_in + amount_in_after_fee)


    // TODO: Slippage check: require amount_out >= min_amount_out


    // TODO: Transfer token_in from user to vault_in via CPI


    // TODO: Transfer token_out from vault_out to user via invoke_signed (PDA signer)


    // TODO: Update reserves in pool data


    Ok(())
}

fn remove_liquidity(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    data: &[u8],
) -> ProgramResult {
    // accounts: [provider, pool, vault_a, vault_b, provider_ata_a, provider_ata_b, token_program]

    // TODO: Parse lp_amount from data (8 bytes)


    // TODO: Calculate proportional amounts:
    // amount_a = lp_amount * reserve_a / lp_supply
    // amount_b = lp_amount * reserve_b / lp_supply


    // TODO: Transfer token_a from vault_a to provider via invoke_signed


    // TODO: Transfer token_b from vault_b to provider via invoke_signed


    // TODO: Update reserves and lp_supply


    Ok(())
}`,
      language: "rust",
      testCases: [
        {
          input: "sqrt function",
          expected:
            "if n == 0 { return 0 }; let mut x = n; let mut y = (x + 1) / 2; while y < x { x = y; y = (x + n/x) / 2 }; x as u64",
        },
        {
          input: "swap formula",
          expected:
            "amount_in_after_fee = amount_in.checked_mul(10_000 - fee_bps).checked_div(10_000); amount_out = reserve_out.checked_mul(amount_in_after_fee).checked_div(reserve_in + amount_in_after_fee)",
        },
        {
          input: "add_liquidity LP",
          expected:
            "if lp_supply == 0 { sqrt((amount_a as u128).checked_mul(amount_b as u128)) } else { min(amount_a * lp_supply / reserve_a, amount_b * lp_supply / reserve_b) }",
        },
        {
          input: "remove_liquidity",
          expected:
            "amount_a = lp_amount * reserve_a / lp_supply; amount_b = lp_amount * reserve_b / lp_supply",
        },
      ],
    },
  },

  // ─── 7. Assembly Memo (Assembly, intermediate) ───
  {
    id: "7",
    slug: "assembly-memo",
    title: "Assembly Memo",
    description:
      "Programa de memo em Assembly: valide e armazene mensagens on-chain com o mínimo de custo.",
    image: "/challenges/assembly-memo.png",
    track: "Assembly",
    difficulty: "intermediate",
    tags: ["Assembly"],
    reward: "1 NFT",
    status: "open",
    challengeBlock: {
      prompt: `## Objetivo

Implemente um programa de **Memo** em Assembly SBF (Solana Bytecode Format) que valida e armazena mensagens on-chain com custo mínimo de compute units.

### Funcionalidades

#### Instrução 0: \`StoreMemo\`
- Recebe uma mensagem UTF-8 nos instruction_data (após o byte de instrução)
- Valida que a mensagem tem entre 1 e 280 caracteres
- Valida que o signer é o primeiro account
- Armazena na conta memo PDA: author (32 bytes) + timestamp (8 bytes) + length (4 bytes) + message (até 280 bytes)
- Emite um log com a mensagem via \`sol_log_\`

#### Instrução 1: \`UpdateMemo\`
- Atualiza a mensagem de uma memo existente
- Verifica que o caller é o author original
- Atualiza length + message + timestamp
- Mantém o author

#### Instrução 2: \`DeleteMemo\`
- Verifica que o caller é o author
- Zera os dados da conta e devolve os lamports ao author

### Requisitos
- Use raw SBF syscalls: \`sol_log_\`, \`sol_invoke_signed_c\`
- Parse manual dos AccountInfo (sem frameworks)
- Validação de UTF-8 manual (verificar bytes válidos)
- Minimize compute units: sem alocações desnecessárias
- A conta memo é PDA com seeds \`["memo", author, memo_id_bytes]\`
- memo_id é um u32 passado nos data`,
      starterCode: `/// Assembly-level Solana Memo Program
/// Uses raw SBF instructions for minimal compute cost

/// Entrypoint - receives raw instruction data
/// Parameters passed via registers:
///   r1 = pointer to serialized input
#[no_mangle]
pub unsafe extern "C" fn entrypoint(input: *mut u8) -> u64 {
    // Input layout (Solana serialized):
    // - num_accounts (8 bytes, u64 LE)
    // - For each account:
    //   - is_duplicate (1 byte)
    //   - is_signer (1 byte)
    //   - is_writable (1 byte)
    //   - executable (1 byte)
    //   - padding (4 bytes)
    //   - key (32 bytes)
    //   - owner (32 bytes)
    //   - lamports (8 bytes)
    //   - data_len (8 bytes)
    //   - data (data_len bytes, padded to 8)
    //   - rent_epoch (8 bytes)
    // - instruction_data_len (8 bytes)
    // - instruction_data (instruction_data_len bytes)
    // - program_id (32 bytes)

    let mut offset: usize = 0;

    // TODO: Parse num_accounts
    // let num_accounts = *(input.add(offset) as *const u64);
    // offset += 8;


    // TODO: Parse first account (signer/author)
    // Skip duplicate flag, read is_signer, is_writable
    // Read key (32 bytes), skip owner, read lamports, data_len, data pointer


    // TODO: Parse memo PDA account (second account)
    // Read key, data pointer, data_len


    // TODO: Skip remaining accounts, parse instruction_data_len and instruction_data


    // TODO: Read instruction byte (data[0])
    // Match on instruction:
    // 0 => store_memo(author_key, memo_data, instruction_data)
    // 1 => update_memo(author_key, memo_data, instruction_data)
    // 2 => delete_memo(author_key, memo_data, memo_lamports, author_lamports)


    // Return 0 for success
    0
}

/// Validate UTF-8 bytes manually
unsafe fn validate_utf8(data: *const u8, len: usize) -> bool {
    // TODO: Iterate through bytes and validate UTF-8 encoding
    // - 0x00..=0x7F: single byte (ASCII)
    // - 0xC2..=0xDF: 2-byte sequence
    // - 0xE0..=0xEF: 3-byte sequence
    // - 0xF0..=0xF4: 4-byte sequence
    // - Continuation bytes: 0x80..=0xBF
    // Return false if any invalid sequence found

    let mut i = 0;
    while i < len {
        let b = *data.add(i);
        // TODO: Implement validation logic

        i += 1;
    }
    true
}

/// Store a new memo
unsafe fn store_memo(
    author_key: *const u8,
    memo_data: *mut u8,
    memo_data_len: usize,
    message: *const u8,
    message_len: usize,
) -> u64 {
    // TODO: Validate message length (1..=280)


    // TODO: Validate UTF-8


    // TODO: Write to memo account data:
    // offset 0: author key (32 bytes) - copy from author_key
    // offset 32: timestamp (8 bytes) - use Clock sysvar or pass as data
    // offset 40: message length (4 bytes, u32 LE)
    // offset 44: message bytes


    // TODO: Log the memo via sol_log_
    // extern "C" { fn sol_log_(message: *const u8, len: u64); }


    0 // success
}

/// Update existing memo
unsafe fn update_memo(
    author_key: *const u8,
    memo_data: *mut u8,
    memo_data_len: usize,
    message: *const u8,
    message_len: usize,
) -> u64 {
    // TODO: Verify caller is original author
    // Compare author_key with memo_data[0..32]


    // TODO: Validate new message


    // TODO: Update message length and content at offsets 40 and 44


    0
}

/// Delete memo and reclaim lamports
unsafe fn delete_memo(
    author_key: *const u8,
    memo_data: *mut u8,
    memo_lamports: *mut u64,
    author_lamports: *mut u64,
) -> u64 {
    // TODO: Verify caller is author


    // TODO: Transfer all lamports from memo to author
    // *author_lamports += *memo_lamports;
    // *memo_lamports = 0;


    // TODO: Zero out memo data


    0
}`,
      language: "rust",
      testCases: [
        {
          input: "parse num_accounts",
          expected:
            "let num_accounts = *(input.add(offset) as *const u64); offset += 8;",
        },
        {
          input: "validate_utf8",
          expected:
            "Check byte ranges: 0x00-0x7F (1 byte), 0xC2-0xDF (2 bytes), 0xE0-0xEF (3 bytes), 0xF0-0xF4 (4 bytes); validate continuation bytes 0x80-0xBF",
        },
        {
          input: "store_memo layout",
          expected:
            "memo_data[0..32] = author_key; memo_data[32..40] = timestamp; memo_data[40..44] = message_len as u32; memo_data[44..44+len] = message",
        },
        {
          input: "delete_memo",
          expected:
            "*author_lamports += *memo_lamports; *memo_lamports = 0; zero memo_data",
        },
      ],
    },
  },
];

export function getChallengesByStatus(
  status: ChallengeStatus | "",
): Challenge[] {
  if (!status) return challenges;
  return challenges.filter((c) => c.status === status);
}

export function getChallengesByTrack(track: string): Challenge[] {
  if (!track) return challenges;
  return challenges.filter((c) => c.track === track);
}

export function getDifficultyLabel(d: ChallengeDifficulty): string {
  const map: Record<ChallengeDifficulty, string> = {
    beginner: "Iniciante",
    intermediate: "Intermediário",
    advanced: "Avançado",
  };
  return map[d];
}
