import type { SolanaLanguage } from './SolanaCodeLesson'

/**
 * Code templates for the Solana code editor.
 * Organized by language → template name → code string.
 */
export const TEMPLATES: Record<string, Record<string, string>> = {
    rust: {
        'Hello World': `fn main() {
    println!("Hello, Solana!");
    let lamports: u64 = 1_000_000_000;
    println!("1 SOL = {} lamports", lamports);
}`,
        'Struct & Impl': `#[derive(Debug)]
struct SolanaAccount {
    pubkey: String,
    lamports: u64,
    owner: String,
}

impl SolanaAccount {
    fn new(pubkey: &str, lamports: u64) -> Self {
        Self {
            pubkey: pubkey.to_string(),
            lamports,
            owner: "11111111111111111111111111111111".to_string(),
        }
    }

    fn balance_in_sol(&self) -> f64 {
        self.lamports as f64 / 1e9
    }
}

fn main() {
    let account = SolanaAccount::new("AbcDef...", 2_000_000_000);
    println!("Account: {:?}", account);
    println!("Balance: {} SOL", account.balance_in_sol());
}`,
        Anchor: `use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWxTWqNLVJjAiJXPanK5Md1MFhm");

#[program]
pub mod my_program {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, data: u64) -> Result<()> {
        let counter = &mut ctx.accounts.counter;
        counter.value = data;
        counter.authority = ctx.accounts.user.key();
        msg!("Counter initialized to {}", data);
        Ok(())
    }

    pub fn increment(ctx: Context<Increment>) -> Result<()> {
        let counter = &mut ctx.accounts.counter;
        counter.value = counter.value.checked_add(1)
            .ok_or(ProgramError::ArithmeticOverflow)?;
        msg!("Counter incremented to {}", counter.value);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = user, space = Counter::LEN)]
    pub counter: Account<'info, Counter>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Increment<'info> {
    #[account(mut, has_one = authority)]
    pub counter: Account<'info, Counter>,
    pub authority: Signer<'info>,
}

#[account]
pub struct Counter {
    pub value: u64,
    pub authority: Pubkey,
}

impl Counter {
    pub const LEN: usize = 8 + 8 + 32;
}`,
        PDA: `use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWxTWqNLVJjAiJXPanK5Md1MFhm");

#[program]
pub mod pda_example {
    use super::*;

    pub fn create_user_profile(
        ctx: Context<CreateUserProfile>,
        username: String,
    ) -> Result<()> {
        require!(username.len() <= 32, ErrorCode::UsernameTooLong);
        let profile = &mut ctx.accounts.profile;
        profile.owner = ctx.accounts.user.key();
        profile.username = username;
        profile.xp = 0;
        profile.level = 0;
        Ok(())
    }

    pub fn award_xp(ctx: Context<AwardXp>, amount: u64) -> Result<()> {
        let profile = &mut ctx.accounts.profile;
        profile.xp = profile.xp.checked_add(amount)
            .ok_or(ErrorCode::Overflow)?;
        profile.level = ((profile.xp as f64 / 100.0).sqrt()) as u64;
        msg!("XP: {}, Level: {}", profile.xp, profile.level);
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(username: String)]
pub struct CreateUserProfile<'info> {
    #[account(
        init,
        payer = user,
        space = UserProfile::LEN,
        seeds = [b"profile", user.key().as_ref()],
        bump
    )]
    pub profile: Account<'info, UserProfile>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AwardXp<'info> {
    #[account(mut, has_one = owner)]
    pub profile: Account<'info, UserProfile>,
    pub owner: Signer<'info>,
}

#[account]
pub struct UserProfile {
    pub owner: Pubkey,
    pub username: String,
    pub xp: u64,
    pub level: u64,
}

impl UserProfile {
    pub const LEN: usize = 8 + 32 + 4 + 32 + 8 + 8;
}

#[error_code]
pub enum ErrorCode {
    #[msg("Username must be 32 characters or less")]
    UsernameTooLong,
    #[msg("Arithmetic overflow")]
    Overflow,
}`,
    },
    typescript: {
        'Wallet Connect': `import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

async function main() {
  const connection = new Connection("https://api.devnet.solana.com", "confirmed");

  // Replace with your wallet address
  const walletAddress = new PublicKey("11111111111111111111111111111111");

  const balance = await connection.getBalance(walletAddress);
  console.log(\`Balance: \${balance / LAMPORTS_PER_SOL} SOL\`);

  const slot = await connection.getSlot();
  console.log(\`Current slot: \${slot}\`);
}

main().catch(console.error);`,
        'Send SOL': `import {
  Connection,
  Keypair,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";

async function sendSol(
  connection: Connection,
  from: Keypair,
  to: string,
  amountInSol: number
) {
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: from.publicKey,
      toPubkey: new PublicKey(to),
      lamports: amountInSol * LAMPORTS_PER_SOL,
    })
  );

  const signature = await sendAndConfirmTransaction(connection, transaction, [from]);
  console.log(\`Transaction: https://explorer.solana.com/tx/\${signature}?cluster=devnet\`);
  return signature;
}`,
        'Anchor Client': `import { Program, AnchorProvider, web3, BN } from "@coral-xyz/anchor";
import { PublicKey, Connection } from "@solana/web3.js";

// Example: Interact with a deployed Anchor program
async function interactWithProgram() {
  const connection = new Connection("https://api.devnet.solana.com");
  const programId = new PublicKey("YOUR_PROGRAM_ID_HERE");

  // Derive PDA for user profile
  const [profilePda, bump] = PublicKey.findProgramAddressSync(
    [Buffer.from("profile"), wallet.publicKey.toBuffer()],
    programId
  );

  // Fetch account data
  const profileAccount = await program.account.userProfile.fetch(profilePda);
  console.log("Username:", profileAccount.username);
  console.log("XP:", profileAccount.xp.toString());
  console.log("Level:", profileAccount.level.toString());

  // Call increment instruction
  const tx = await program.methods
    .increment()
    .accounts({ counter: counterPda, authority: wallet.publicKey })
    .rpc();

  console.log("Transaction:", tx);
}`,
        'Token-2022 XP': `import {
  Connection,
  PublicKey,
  Keypair,
} from "@solana/web3.js";
import {
  getAccount,
  getAssociatedTokenAddress,
  TOKEN_2022_PROGRAM_ID,
  getMint,
} from "@solana/spl-token";

async function getXPBalance(
  connection: Connection,
  walletAddress: string,
  xpMintAddress: string
): Promise<number> {
  const wallet = new PublicKey(walletAddress);
  const mint = new PublicKey(xpMintAddress);

  // Get the associated token account for the XP mint
  const ata = await getAssociatedTokenAddress(
    mint,
    wallet,
    false,
    TOKEN_2022_PROGRAM_ID
  );

  const account = await getAccount(connection, ata, "confirmed", TOKEN_2022_PROGRAM_ID);
  const mintInfo = await getMint(connection, mint, "confirmed", TOKEN_2022_PROGRAM_ID);

  const balance = Number(account.amount) / Math.pow(10, mintInfo.decimals);
  console.log(\`XP Balance: \${balance}\`);
  console.log(\`Level: \${Math.floor(Math.sqrt(balance / 100))}\`);
  return balance;
}`,
    },
    json: {
        IDL: `{
  "version": "0.1.0",
  "name": "academy_program",
  "instructions": [
    {
      "name": "initialize",
      "accounts": [
        { "name": "config", "isMut": true, "isSigner": false },
        { "name": "authority", "isMut": true, "isSigner": true },
        { "name": "systemProgram", "isMut": false, "isSigner": false }
      ],
      "args": []
    },
    {
      "name": "createCourse",
      "accounts": [
        { "name": "course", "isMut": true, "isSigner": false },
        { "name": "authority", "isMut": true, "isSigner": true },
        { "name": "systemProgram", "isMut": false, "isSigner": false }
      ],
      "args": [
        { "name": "courseId", "type": "bytes" },
        { "name": "totalLessons", "type": "u8" },
        { "name": "xpReward", "type": "u64" }
      ]
    }
  ],
  "accounts": [
    {
      "name": "Config",
      "type": {
        "kind": "struct",
        "fields": [
          { "name": "authority", "type": "publicKey" },
          { "name": "xpMint", "type": "publicKey" },
          { "name": "totalCourses", "type": "u64" }
        ]
      }
    }
  ]
}`,
    },
}
