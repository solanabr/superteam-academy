import type { Course } from "./types";

export const anchorCourses: Course[] = [
  {
    id: "anchor-fundamentals",
    slug: "anchor-fundamentals",
    title: "Anchor Fundamentals",
    description:
      "Learn the core concepts of the Anchor framework — program structure, account constraints, PDAs, and cross-program invocations. Build your first Solana program with type-safe macros and declarative validation.",
    shortDescription:
      "Master Anchor's program structure, constraints, PDAs, and CPIs.",
    thumbnail: "/thumbnails/anchor-fundamentals.jpg",
    trackId: "anchor-development",
    difficulty: 2,
    totalLessons: 15,
    totalDuration: 260,
    xpReward: 2625,
    enrollmentCount: 1056,
    creator: {
      name: "Carlos Mendes",
      avatar: "/avatars/carlos.jpg",
      title: "Full-Stack Solana Developer",
    },
    prerequisiteSlug: null,
    isActive: true,
    tags: ["anchor", "rust", "programs", "pda"],
    modules: [
      {
        id: "anchor-fundamentals-setup",
        title: "Anchor Setup",
        description: "Initialize an Anchor project and understand the workspace layout.",
        lessons: [
          {
            id: "af-setup-1",
            title: "Installing Anchor and Creating a Project",
            type: "content",
            duration: 12,
            xp: 150,
            body: "Anchor is installed via `avm` (Anchor Version Manager). Run `anchor init my_project` to scaffold a new program with `programs/`, `tests/`, and `Anchor.toml`. The workspace uses Cargo workspaces for Rust and npm/pnpm for TypeScript tests.",
          },
          {
            id: "af-setup-2",
            title: "Understanding Anchor.toml and Build Process",
            type: "content",
            duration: 10,
            xp: 150,
            body: "`Anchor.toml` defines program IDs, cluster config, and build scripts. Run `anchor build` to compile programs and generate the IDL. The IDL is consumed by clients and test harnesses for type-safe account and instruction serialization.",
          },
          {
            id: "af-setup-3",
            title: "Scaffold Your First Anchor Program",
            type: "challenge",
            duration: 20,
            xp: 225,
            prompt: "Create a new Anchor project and add a single instruction `initialize` that creates a config account. The config should store a `bump` (u8) and `authority` (Pubkey). Use `#[account(init)]` and derive the PDA from `[\"config\"]`.",
            starterCode: `#[program]
pub mod my_program {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let config = &mut ctx.accounts.config;
        config.bump = ctx.bumps.config;
        config.authority = ctx.accounts.authority.key();
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = authority, space = 8 + 1 + 32, seeds = [b"config"], bump)]
    pub config: Account<'info, Config>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[account]
pub struct Config {
    pub bump: u8,
    pub authority: Pubkey,
}`,
            language: "rust",
            testCases: [
              {
                input: "initialize",
                expectedOutput: "success",
                label: "Initialize creates config account",
              },
            ],
          },
        ],
      },
      {
        id: "anchor-fundamentals-structure",
        title: "Program Structure",
        description: "Organize programs with #[program], #[account], and instruction handlers.",
        lessons: [
          {
            id: "af-structure-1",
            title: "The #[program] Macro and Instruction Handlers",
            type: "content",
            duration: 14,
            xp: 150,
            body: "The `#[program]` macro marks your module as the program entry point. Each `pub fn` becomes an instruction. Use `Context<YourAccounts>` to receive validated accounts. Anchor deserializes instruction data and validates accounts before your handler runs.",
          },
          {
            id: "af-structure-2",
            title: "Account Structs and #[account]",
            type: "content",
            duration: 16,
            xp: 150,
            body: "Define account state with `#[account]`. The first 8 bytes are the discriminator (derived from the struct name). Add `pub` fields for your data. Use `space = 8 + ...` in constraints to allocate the correct size. Implement `Discriminator` for custom serialization.",
          },
          {
            id: "af-structure-3",
            title: "Implement a Course Registry Account",
            type: "challenge",
            duration: 25,
            xp: 225,
            prompt: "Create an instruction that initializes a `Course` account with `title` (String), `xp_reward` (u32), and `creator` (Pubkey). Use `#[account(init)]` with `space` calculated for the string (4 + len). Validate title length is between 1 and 64 chars.",
            starterCode: `#[program]
pub mod course_registry {
    use super::*;

    pub fn create_course(ctx: Context<CreateCourse>, title: String, xp_reward: u32) -> Result<()> {
        require!(title.len() >= 1 && title.len() <= 64, ErrorCode::InvalidTitle);
        let course = &mut ctx.accounts.course;
        course.title = title;
        course.xp_reward = xp_reward;
        course.creator = ctx.accounts.creator.key();
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(title: String, xp_reward: u32)]
pub struct CreateCourse<'info> {
    #[account(init, payer = creator, space = 8 + 4 + 64 + 4 + 32, seeds = [b"course", creator.key().as_ref()], bump)]
    pub course: Account<'info, Course>,

    #[account(mut)]
    pub creator: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[account]
pub struct Course {
    pub title: String,
    pub xp_reward: u32,
    pub creator: Pubkey,
}`,
            language: "rust",
            testCases: [
              {
                input: "create_course",
                expectedOutput: "success",
                label: "Creates course with valid title",
              },
            ],
          },
        ],
      },
      {
        id: "anchor-fundamentals-constraints",
        title: "Account Constraints",
        description: "Validate accounts with has_one, constraint, and custom checks.",
        lessons: [
          {
            id: "af-constraints-1",
            title: "Common Constraints: mut, has_one, constraint",
            type: "content",
            duration: 15,
            xp: 150,
            body: "Use `#[account(mut)]` for accounts that will be modified. `has_one = field` ensures the account's field matches another account's key. `constraint = expression` runs arbitrary boolean checks. These run before your instruction logic, reducing attack surface.",
          },
          {
            id: "af-constraints-2",
            title: "init, init_if_needed, and Space Calculation",
            type: "content",
            duration: 14,
            xp: 150,
            body: "`init` creates a new account; `init_if_needed` creates only when empty (requires `realloc` feature). Space is `8 + sum(field_sizes)`. Strings need `4 + max_len`, Vecs need `4 + (item_size * max_len)`. Under-allocating causes deserialization failures.",
          },
          {
            id: "af-constraints-3",
            title: "Add Constraint Validation to Enrollment",
            type: "challenge",
            duration: 22,
            xp: 225,
            prompt: "Add an `enroll` instruction that creates an `Enrollment` account. Use `has_one` to ensure the course exists and the learner matches the signer. Add a `constraint` that the enrollment doesn't already exist (check PDA uniqueness).",
            starterCode: `#[program]
pub mod academy {
    use super::*;

    pub fn enroll(ctx: Context<Enroll>) -> Result<()> {
        let enrollment = &mut ctx.accounts.enrollment;
        enrollment.learner = ctx.accounts.learner.key();
        enrollment.course = ctx.accounts.course.key();
        enrollment.completed = false;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Enroll<'info> {
    #[account(init, payer = learner, space = 8 + 32 + 32 + 1, seeds = [b"enrollment", learner.key().as_ref(), course.key().as_ref()], bump)]
    pub enrollment: Account<'info, Enrollment>,

    #[account(mut)]
    pub learner: Signer<'info>,

    pub course: Account<'info, Course>,

    pub system_program: Program<'info, System>,
}

#[account]
pub struct Enrollment {
    pub learner: Pubkey,
    pub course: Pubkey,
    pub completed: bool,
}

#[account]
pub struct Course {
    pub creator: Pubkey,
}`,
            language: "rust",
            testCases: [
              {
                input: "enroll",
                expectedOutput: "success",
                label: "Enrollment created with valid constraints",
              },
            ],
          },
        ],
      },
      {
        id: "anchor-fundamentals-pdas",
        title: "PDAs & Seeds",
        description: "Derive and use Program Derived Addresses for deterministic account lookup.",
        lessons: [
          {
            id: "af-pdas-1",
            title: "PDA Derivation and Seeds",
            type: "content",
            duration: 16,
            xp: 150,
            body: "PDAs are derived with `Pubkey::find_program_address(&[seeds], program_id)`. Seeds can be bytes, pubkeys, or u64s. Store the bump in the account to avoid recomputation. Use `seeds` and `bump` in `#[account(...)]` for validation.",
          },
          {
            id: "af-pdas-2",
            title: "Realloc and Closing Accounts",
            type: "content",
            duration: 12,
            xp: 150,
            body: "Use `realloc` to grow or shrink accounts. `close = destination` transfers lamports to the specified account and zeroes data. Always validate the close target. Use `has_one` to ensure only the owner can close.",
          },
          {
            id: "af-pdas-3",
            title: "Implement a PDA-Based Config",
            type: "challenge",
            duration: 24,
            xp: 225,
            prompt: "Create a singleton config PDA with seeds `[\"config\"]`. Add `update_config` that changes `backend_signer` and `xp_mint`. Use `require` to ensure only the current authority can update. Return the bump from the config in a test.",
            starterCode: `#[program]
pub mod config_program {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, backend_signer: Pubkey, xp_mint: Pubkey) -> Result<()> {
        let config = &mut ctx.accounts.config;
        config.authority = ctx.accounts.authority.key();
        config.backend_signer = backend_signer;
        config.xp_mint = xp_mint;
        config.bump = ctx.bumps.config;
        Ok(())
    }

    pub fn update_config(ctx: Context<UpdateConfig>, backend_signer: Pubkey, xp_mint: Pubkey) -> Result<()> {
        let config = &mut ctx.accounts.config;
        require!(config.authority == ctx.accounts.authority.key(), ErrorCode::Unauthorized);
        config.backend_signer = backend_signer;
        config.xp_mint = xp_mint;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = authority, space = 8 + 32 + 32 + 32 + 1, seeds = [b"config"], bump)]
    pub config: Account<'info, Config>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateConfig<'info> {
    #[account(mut, seeds = [b"config"], bump = config.bump)]
    pub config: Account<'info, Config>,

    pub authority: Signer<'info>,
}

#[account]
pub struct Config {
    pub authority: Pubkey,
    pub backend_signer: Pubkey,
    pub xp_mint: Pubkey,
    pub bump: u8,
}`,
            language: "rust",
            testCases: [
              {
                input: "update_config",
                expectedOutput: "success",
                label: "Authority can update config",
              },
            ],
          },
        ],
      },
      {
        id: "anchor-fundamentals-cpi",
        title: "Cross-Program Invocations",
        description: "Call other programs via CPI — SPL Token, System, and custom programs.",
        lessons: [
          {
            id: "af-cpi-1",
            title: "CPI Basics and CpiContext",
            type: "content",
            duration: 14,
            xp: 150,
            body: "Use `CpiContext::new(program, accounts)` to build a CPI context. Pass signer seeds with `CpiContext::new_with_signer`. The invoked program receives the same account validation rules. Always verify the target program ID.",
          },
          {
            id: "af-cpi-2",
            title: "SPL Token CPI: Mint, Transfer, Burn",
            type: "content",
            duration: 18,
            xp: 150,
            body: "Use `anchor_spl::token` for Token and Token-2022. `mint_to` requires mint authority. `transfer` moves tokens between ATAs. `burn` reduces supply. Pass the correct token program (Token or Token2022) in the accounts struct.",
          },
          {
            id: "af-cpi-3",
            title: "Mint XP Tokens via CPI",
            type: "challenge",
            duration: 28,
            xp: 225,
            prompt: "Implement `mint_xp` that mints Token-2022 XP to a learner's ATA. Use a PDA as mint authority with seeds `[\"xp_mint\"]`. Validate the mint matches the config's xp_mint. Create the ATA if needed with `create_associated_token_account` CPI.",
            starterCode: `#[program]
pub mod academy {
    use super::*;

    pub fn mint_xp(ctx: Context<MintXp>, amount: u64) -> Result<()> {
        let seeds = &[b"xp_mint".as_ref(), &[ctx.bumps.xp_mint_authority]];
        let signer_seeds = &[&seeds[..]];
        token::mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                token::MintTo {
                    mint: ctx.accounts.xp_mint.to_account_info(),
                    to: ctx.accounts.learner_ata.to_account_info(),
                    authority: ctx.accounts.xp_mint_authority.to_account_info(),
                },
                signer_seeds,
            ),
            amount,
        )?;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct MintXp<'info> {
    pub config: Account<'info, Config>,

    #[account(mut, seeds = [b"xp_mint"], bump)]
    pub xp_mint_authority: AccountInfo<'info>,

    #[account(mut)]
    pub xp_mint: Account<'info, Mint>,

    #[account(mut)]
    pub learner_ata: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[account]
pub struct Config {
    pub xp_mint: Pubkey,
}`,
            language: "rust",
            testCases: [
              {
                input: "mint_xp",
                expectedOutput: "success",
                label: "Mints XP to learner ATA",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "advanced-anchor-patterns",
    slug: "advanced-anchor-patterns",
    title: "Advanced Anchor Patterns",
    description:
      "Master error handling, Token-2022 integration, program composability, and security patterns. Build production-grade Solana programs with robust validation and defense-in-depth.",
    shortDescription:
      "Error handling, Token-2022, composability, and security patterns.",
    thumbnail: "/thumbnails/advanced-anchor.jpg",
    trackId: "anchor-development",
    difficulty: 3,
    totalLessons: 12,
    totalDuration: 222,
    xpReward: 2800,
    enrollmentCount: 421,
    creator: {
      name: "Lucas Ferreira",
      avatar: "/avatars/lucas.jpg",
      title: "Solana Security Researcher",
    },
    prerequisiteSlug: "anchor-fundamentals",
    isActive: true,
    tags: ["anchor", "security", "optimization", "patterns"],
    modules: [
      {
        id: "aap-errors",
        title: "Error Handling & Validation",
        description: "Custom errors, require! macros, and input validation.",
        lessons: [
          {
            id: "aap-errors-1",
            title: "Custom Errors and require!",
            type: "content",
            duration: 12,
            xp: 200,
            body: "Define errors in an `errors` module with `#[error_code]`. Use `require!(condition, ErrorCode::YourError)` for early exits. Errors are serialized as u32 discriminators. Keep error messages concise; avoid leaking internal state.",
          },
          {
            id: "aap-errors-2",
            title: "Input Validation and Bounds Checking",
            type: "content",
            duration: 14,
            xp: 200,
            body: "Validate all user inputs: string length, numeric ranges, enum values. Use `checked_add`/`checked_sub` for arithmetic to prevent overflow. Reject zero amounts and invalid pubkeys. Validate account ownership and program IDs in constraints.",
          },
          {
            id: "aap-errors-3",
            title: "Add Comprehensive Error Handling",
            type: "challenge",
            duration: 25,
            xp: 300,
            prompt: "Implement a `claim_reward` instruction with custom errors: `InsufficientXp`, `AlreadyClaimed`, `InvalidCourse`. Validate the learner has enough XP, hasn't claimed before, and the course is active. Use checked arithmetic for XP deduction.",
            starterCode: `#[program]
pub mod rewards {
    use super::*;

    pub fn claim_reward(ctx: Context<ClaimReward>, amount: u64) -> Result<()> {
        let enrollment = &ctx.accounts.enrollment;
        let xp_balance = &mut ctx.accounts.xp_balance;
        require!(xp_balance.amount >= amount, ErrorCode::InsufficientXp);
        require!(!enrollment.reward_claimed, ErrorCode::AlreadyClaimed);
        require!(ctx.accounts.course.is_active, ErrorCode::InvalidCourse);
        xp_balance.amount = xp_balance.amount.checked_sub(amount).unwrap();
        Ok(())
    }
}

#[derive(Accounts)]
pub struct ClaimReward<'info> {
    pub enrollment: Account<'info, Enrollment>,
    #[account(mut)]
    pub xp_balance: Account<'info, XpBalance>,
    pub course: Account<'info, Course>,
}

#[account]
pub struct Enrollment { pub reward_claimed: bool; }
#[account]
pub struct XpBalance { pub amount: u64; }
#[account]
pub struct Course { pub is_active: bool; }`,
            language: "rust",
            testCases: [
              {
                input: "claim_reward",
                expectedOutput: "success",
                label: "Claims reward with valid state",
              },
            ],
          },
        ],
      },
      {
        id: "aap-token",
        title: "Token Integration",
        description: "Token-2022, extensions, and soulbound patterns.",
        lessons: [
          {
            id: "aap-token-1",
            title: "Token-2022 and Extensions",
            type: "content",
            duration: 16,
            xp: 200,
            body: "Token-2022 supports extensions: TransferFee, NonTransferable, PermanentDelegate, MetadataPointer. Use `spl_token_2022` for minting. NonTransferable makes tokens soulbound. PermanentDelegate allows program-controlled burns or transfers.",
          },
          {
            id: "aap-token-2",
            title: "ATA Creation and Token Accounts",
            type: "content",
            duration: 14,
            xp: 200,
            body: "Associated Token Accounts (ATAs) are PDAs from owner + mint + token program. Use `associated_token::get_associated_token_address` for derivation. Create with `create_associated_token_account` CPI. Pass the correct token program for Token vs Token-2022.",
          },
          {
            id: "aap-token-3",
            title: "Integrate Token-2022 XP Mint",
            type: "challenge",
            duration: 28,
            xp: 300,
            prompt: "Add an instruction that mints from a Token-2022 XP mint (NonTransferable) to a learner. Validate the mint has the NonTransferable extension. Use the correct Token-2022 program ID. Handle the case where the ATA doesn't exist.",
            starterCode: `#[program]
pub mod academy {
    use super::*;

    pub fn award_xp(ctx: Context<AwardXp>, amount: u64) -> Result<()> {
        let seeds = &[b"authority".as_ref(), &[ctx.bumps.authority]];
        token::mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                token::MintTo {
                    mint: ctx.accounts.xp_mint.to_account_info(),
                    to: ctx.accounts.learner_ata.to_account_info(),
                    authority: ctx.accounts.authority.to_account_info(),
                },
                &[&seeds[..]],
            ),
            amount,
        )?;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct AwardXp<'info> {
    #[account(seeds = [b"authority"], bump)]
    pub authority: AccountInfo<'info>,
    #[account(mut)]
    pub xp_mint: Account<'info, Mint>,
    #[account(mut)]
    pub learner_ata: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}`,
            language: "rust",
            testCases: [
              {
                input: "award_xp",
                expectedOutput: "success",
                label: "Mints soulbound XP tokens",
              },
            ],
          },
        ],
      },
      {
        id: "aap-composability",
        title: "Program Composability",
        description: "Calling and being called by other programs.",
        lessons: [
          {
            id: "aap-composability-1",
            title: "Invoking External Programs",
            type: "content",
            duration: 15,
            xp: 200,
            body: "Pass the target program's `AccountInfo` and use `invoke` or `invoke_signed` for raw CPIs. With Anchor, use the program's `cpi` module. Always validate the program ID. Pass remaining accounts when the callee needs them.",
          },
          {
            id: "aap-composability-2",
            title: "Being a CPI Target",
            type: "content",
            duration: 14,
            xp: 200,
            body: "Your program can be invoked by others. Use `Signer` only when the signer must be the transaction signer. For PDA signers, use `UncheckedAccount` and verify with `invoke_signed`. Document which accounts callers must pass.",
          },
          {
            id: "aap-composability-3",
            title: "CPI to Metaplex Core for Credentials",
            type: "challenge",
            duration: 30,
            xp: 300,
            prompt: "Implement a stub that prepares accounts for a Metaplex Core `create` CPI. Your instruction should validate the collection mint, create the asset PDA seeds, and pass the correct remaining accounts structure. Use `invoke_signed` with your program's PDA as delegate.",
            starterCode: `#[program]
pub mod credentials {
    use super::*;

    pub fn issue_credential(ctx: Context<IssueCredential>, name: String, uri: String) -> Result<()> {
        let seeds = &[b"credential".as_ref(), ctx.accounts.learner.key().as_ref(), &[ctx.bumps.credential]];
        let signer_seeds = &[&seeds[..]];
        // Metaplex Core create CPI would go here
        Ok(())
    }
}

#[derive(Accounts)]
pub struct IssueCredential<'info> {
    #[account(mut, seeds = [b"credential", learner.key().as_ref()], bump)]
    pub credential: AccountInfo<'info>,
    pub learner: Signer<'info>,
    pub collection_mint: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}`,
            language: "rust",
            testCases: [
              {
                input: "issue_credential",
                expectedOutput: "success",
                label: "Prepares credential CPI accounts",
              },
            ],
          },
        ],
      },
      {
        id: "aap-security",
        title: "Security Patterns",
        description: "Defense-in-depth, signer verification, and common pitfalls.",
        lessons: [
          {
            id: "aap-security-1",
            title: "Signer Verification and Authority Checks",
            type: "content",
            duration: 14,
            xp: 200,
            body: "Always use `Signer` for accounts that must sign. For PDA signers, verify with `invoke_signed` and correct seeds. Use `has_one = authority` to bind accounts. Never trust account data from untrusted programs without validation.",
          },
          {
            id: "aap-security-2",
            title: "Reentrancy and Account Reloading",
            type: "content",
            duration: 12,
            xp: 200,
            body: "After CPIs, account data may have changed. Use `reload()` on accounts if you read them again. Avoid multiple CPIs that could reenter your program. Validate state transitions (e.g., enrollment not already finalized) before CPIs.",
          },
          {
            id: "aap-security-3",
            title: "Implement Authority-Rotatable Config",
            type: "challenge",
            duration: 28,
            xp: 300,
            prompt: "Add `rotate_authority` that transfers config ownership to a new pubkey. Validate only the current authority can call it. Use `require` to prevent setting authority to the system program or a PDA. Emit an event with old and new authority.",
            starterCode: `#[program]
pub mod config {
    use super::*;

    pub fn rotate_authority(ctx: Context<RotateAuthority>, new_authority: Pubkey) -> Result<()> {
        let config = &mut ctx.accounts.config;
        let old_authority = config.authority;
        require!(config.authority == ctx.accounts.authority.key(), ErrorCode::Unauthorized);
        require!(new_authority != Pubkey::default(), ErrorCode::InvalidAuthority);
        config.authority = new_authority;
        emit!(AuthorityRotated { old_authority, new_authority });
        Ok(())
    }
}

#[derive(Accounts)]
pub struct RotateAuthority<'info> {
    #[account(mut, seeds = [b"config"], bump = config.bump)]
    pub config: Account<'info, Config>,
    pub authority: Signer<'info>,
}

#[account]
pub struct Config { pub authority: Pubkey; pub bump: u8; }

#[event]
pub struct AuthorityRotated {
    pub old_authority: Pubkey,
    pub new_authority: Pubkey,
}`,
            language: "rust",
            testCases: [
              {
                input: "rotate_authority",
                expectedOutput: "success",
                label: "Authority rotated by current owner",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "testing-solana-programs",
    slug: "testing-solana-programs",
    title: "Testing Solana Programs",
    description:
      "Write Rust unit tests, TypeScript integration tests with Anchor, and use Mollusk and LiteSVM for fast local execution. Integrate tests into CI pipelines.",
    shortDescription:
      "Rust unit tests, integration tests, Mollusk, LiteSVM, and CI.",
    thumbnail: "/thumbnails/testing-programs.jpg",
    trackId: "anchor-development",
    difficulty: 2,
    totalLessons: 10,
    totalDuration: 152,
    xpReward: 1725,
    enrollmentCount: 387,
    creator: {
      name: "Lucas Ferreira",
      avatar: "/avatars/lucas.jpg",
      title: "Solana Security Researcher",
    },
    prerequisiteSlug: null,
    isActive: true,
    tags: ["testing", "mollusk", "litesvm", "ci"],
    modules: [
      {
        id: "tsp-fundamentals",
        title: "Testing Fundamentals",
        description: "Test structure, fixtures, and Anchor test harness.",
        lessons: [
          {
            id: "tsp-fund-1",
            title: "Anchor Test Setup and Provider",
            type: "content",
            duration: 12,
            xp: 150,
            body: "Use `anchor test` to run TypeScript tests. The `Provider` wraps a connection and default wallet. Tests run against a local validator by default. Use `program.methods` for type-safe instruction calls. Fetch accounts with `program.account`.",
          },
          {
            id: "tsp-fund-2",
            title: "Fixtures and Test Data",
            type: "content",
            duration: 10,
            xp: 150,
            body: "Create keypairs with `Keypair.generate()`. Airdrop SOL with `connection.requestAirdrop`. Use `@coral-xyz/anchor` for program types. Structure tests: setup (create accounts), act (call instructions), assert (verify state and events).",
          },
          {
            id: "tsp-fund-3",
            title: "Write an Integration Test",
            type: "challenge",
            duration: 22,
            xp: 225,
            prompt: "Write a TypeScript test that initializes a config account, then calls update_config. Assert the config's backend_signer and xp_mint match the updated values. Use program.account.config.fetch to verify state.",
            starterCode: `import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { expect } from "chai";
import { PublicKey } from "@solana/web3.js";

describe("config", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.MyProgram as Program;

  it("initializes and updates config", async () => {
    const [configPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("config")],
      program.programId
    );
    await program.methods
      .initialize(provider.wallet.publicKey, anchor.utils.publicKey("11111111111111111111111111111111"))
      .accounts({ config: configPda })
      .rpc();
    const config = await program.account.config.fetch(configPda);
    expect(config.authority.toBase58()).to.equal(provider.wallet.publicKey.toBase58());
  });
});`,
            language: "typescript",
            testCases: [
              {
                input: "config test",
                expectedOutput: "pass",
                label: "Config initialized and fetched",
              },
            ],
          },
        ],
      },
      {
        id: "tsp-rust",
        title: "Rust Unit Tests",
        description: "In-process tests with #[cfg(test)] and test helpers.",
        lessons: [
          {
            id: "tsp-rust-1",
            title: "Rust #[cfg(test)] and Test Modules",
            type: "content",
            duration: 10,
            xp: 150,
            body: "Add `#[cfg(test)] mod tests` in your lib.rs. Use `cargo test` to run. Mock accounts with `AccountMeta` and `Instruction`. Test pure logic (e.g., bitmap operations, XP calculations) without a full runtime.",
          },
          {
            id: "tsp-rust-2",
            title: "Testing with Mollusk",
            type: "content",
            duration: 14,
            xp: 150,
            body: "Mollusk runs programs in-process without a validator. Use `ProgramTest` to load your program. Build transactions and process them. Assert return data and account changes. Faster than validator-based tests for unit-level checks.",
          },
          {
            id: "tsp-rust-3",
            title: "LiteSVM for Isolated Execution",
            type: "content",
            duration: 12,
            xp: 150,
            body: "LiteSVM provides a lightweight SVM for testing. Spawn a bank, load programs, execute transactions. Useful for testing CPIs and multi-program flows. No network or RPC; runs entirely in memory. Good for CI and fuzz testing.",
          },
          {
            id: "tsp-rust-4",
            title: "Unit Test for XP Calculation",
            type: "challenge",
            duration: 20,
            xp: 225,
            prompt: "Write a Rust unit test that verifies `compute_lesson_xp(lesson_type, difficulty)` returns 150 for content+intermediate, 225 for challenge+intermediate. Mock the function or test the helper in isolation.",
            starterCode: `#[cfg(test)]
mod tests {
    use super::*;

    fn compute_lesson_xp(is_challenge: bool, difficulty: u8) -> u32 {
        let base = match difficulty {
            1 => 100,
            2 => 150,
            3 => 200,
            _ => 0,
        };
        if is_challenge {
            (base as f64 * 1.5) as u32
        } else {
            base
        }
    }

    #[test]
    fn test_xp_calculation() {
        assert_eq!(compute_lesson_xp(false, 2), 150);
        assert_eq!(compute_lesson_xp(true, 2), 225);
    }
}`,
            language: "rust",
            testCases: [
              {
                input: "cargo test",
                expectedOutput: "ok",
                label: "XP calculation correct",
              },
            ],
          },
        ],
      },
      {
        id: "tsp-integration",
        title: "Integration Testing",
        description: "End-to-end tests with validators and CI.",
        lessons: [
          {
            id: "tsp-integration-1",
            title: "Full Enrollment Flow Test",
            type: "content",
            duration: 14,
            xp: 150,
            body: "Test the full flow: create course, enroll learner, complete lessons, finalize, mint XP, issue credential. Use multiple keypairs for different roles. Assert events and account state at each step. Catch regressions in cross-instruction flows.",
          },
          {
            id: "tsp-integration-2",
            title: "CI Integration and Test Scripts",
            type: "content",
            duration: 12,
            xp: 150,
            body: "Run `anchor test` in GitHub Actions. Use `solana-test-validator` or `mpl-test-validator` for Metaplex. Cache `target/` and `node_modules/`. Fail the build on test failure. Add CU profiling with `--cu-limit` for regression detection.",
          },
          {
            id: "tsp-integration-3",
            title: "Test CPI and Token Flows",
            type: "challenge",
            duration: 26,
            xp: 225,
            prompt: "Write an integration test that mints XP tokens via your program's mint_xp instruction. Use a real Token-2022 mint and ATA. Assert the learner's token balance increases. Use before/after balance checks.",
            starterCode: `import * as anchor from "@coral-xyz/anchor";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { expect } from "chai";

describe("mint_xp", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Academy as anchor.Program;

  it("mints XP to learner", async () => {
    const [configPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("config")],
      program.programId
    );
    const config = await program.account.config.fetch(configPda);
    const learnerAta = getAssociatedTokenAddressSync(
      config.xpMint,
      provider.wallet.publicKey
    );
    const before = await provider.connection.getTokenAccountBalance(learnerAta);
    await program.methods.mintXp(new anchor.BN(100)).accounts({ config: configPda, learnerAta }).rpc();
    const after = await provider.connection.getTokenAccountBalance(learnerAta);
    expect(after.value.amount - before.value.amount).to.equal("100");
  });
});`,
            language: "typescript",
            testCases: [
              {
                input: "mint_xp test",
                expectedOutput: "pass",
                label: "XP minted to learner ATA",
              },
            ],
          },
        ],
      },
    ],
  },
];
