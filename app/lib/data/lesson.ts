/**
 * @fileoverview Lesson and Challenge data models for the Superteam Academy.
 * Defines the structure for in-depth lesson content, coding challenges, and navigation.
 */

import { SanityContent } from "./course-detail";

/**
 * Detailed representation of a single lesson, including content and challenge metadata.
 */
export interface Lesson {
	id: string;
	moduleId: string;
	moduleNumber: number;
	moduleTitle: string;
	number: string;
	title: string;
	ref: string;
	type: "content" | "challenge";
	duration: string;
	content: SanityContent; // PortableText or Markdown
	starterCode?: string;
	solutionCode?: string;
	hints?: string[];
	solution?: string;
	completed: boolean;
	locked: boolean;
	testCases?: {
		name: string;
		description: string;
		status: "pass" | "fail" | "pending";
	}[];
	consoleOutput?: string;
	nextLessonId?: string;
	prevLessonId?: string;
}

/**
 * Minimal lesson metadata used for sidebar navigation and module overviews.
 */
export interface ModuleLesson {
	id: string;
	number: string;
	title: string;
	duration?: string;
	completed: boolean;
	locked: boolean;
	active: boolean;
}

export const mockLesson: Lesson = {
	id: "lesson-4-3",
	moduleId: "mod-4",
	moduleNumber: 4,
	moduleTitle: "ACCOUNTS & PDAs",
	number: "4.3",
	title: "PROGRAM DERIVED ADDRESSES",
	ref: "PDA-2210",
	type: "content",
	duration: "25:00",
	completed: false,
	locked: false,
	prevLessonId: "lesson-4-2",
	nextLessonId: "lesson-4-5", // Updated to point to next lesson
	content: `# PROGRAM DERIVED ADDRESSES

Program Derived Addresses (PDAs) are home to the state of most Solana programs. Unlike regular Keypairs, PDAs do not have a private key. They are found using a combination of \`seeds\` and a \`program_id\`.

To find a PDA, we use the \`find_program_address\` function. This function iteratively adds a "bump seed" (starting from 255) until the resulting point is "off the curve" of the Ed25519 ellipse.

## The Challenge

Update the code in the editor to correctly derive the address for a "user_stats" account using the user's public key as a seed.

### Key Concepts

- PDAs are deterministic addresses derived from seeds
- They have no private key, so only the program can sign
- The bump seed ensures the address is off the Ed25519 curve
- Seeds can be any combination of bytes, including other public keys

### Common Use Cases

1. **User-specific accounts**: Derive an account address from a user's public key
2. **Token accounts**: Create deterministic token account addresses
3. **Program state**: Store global program configuration
4. **Associated accounts**: Link related accounts together`,
	hints: [
		'Remember that seeds must be passed as an array of byte slices: `&[b"user_stats", user_pubkey.as_ref()]`',
		"The `find_program_address` function returns both the PDA and the bump seed",
		"You need to use the program ID from the context to derive the PDA",
	],
	solution: `use anchor_lang::prelude::*;

declare_id!("Fg6PaF...7as");

#[program]
pub mod pda_tutorial {
    use super::*;
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let user_stats = &mut ctx.accounts.user_stats;
        user_stats.user = ctx.accounts.user.key();
        user_stats.total_points = 0;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        init,
        payer = user,
        space = 8 + 32 + 8,
        seeds = [b"user_stats", user.key().as_ref()],
        bump
    )]
    pub user_stats: Account<'info, UserStats>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct UserStats {
    pub user: Pubkey,
    pub total_points: u64,
}`,
	starterCode: `use anchor_lang::prelude::*;

declare_id!("Fg6PaF...7as");

#[program]
pub mod pda_tutorial {
    use super::*;
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        // TODO: Implement PDA initialization
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    // Add PDA account definition here
    pub system_program: Program<'info, System>,
}`,
};

// Mock data for the challenge lesson
export const mockLessonChallenge: Lesson = {
	id: "lesson-4-5",
	moduleId: "mod-4",
	moduleNumber: 4,
	moduleTitle: "ACCOUNTS & PDAs",
	number: "4.5",
	title: "PDA SEED DERIVATION",
	ref: "PDA-2210",
	type: "challenge",
	duration: "60:00",
	completed: false,
	locked: false,
	prevLessonId: "lesson-4-4",
	content:
		'Complete the derive_pda_address function. It should return a program-derived address using the string literal "vault" and the provided user_key as seeds.',
	starterCode: `use anchor_lang::prelude::*;

pub fn derive_pda_address(
    program_id: &Pubkey, 
    user_key: &Pubkey
) -> (Pubkey, u8) {
    // TODO: Implement PDA derivation using seeds:
    // 1. "vault"
    // 2. user_key
    
    let seeds = &[
        // Your code here
    ];

    Pubkey::find_program_address(seeds, program_id)
}`,
	testCases: [
		{
			name: "Seed Alignment",
			description: 'Seeds "vault" + key used correctly',
			status: "pass",
		},
		{
			name: "Bump Verification",
			description: "Canonical bump was not returned",
			status: "fail",
		},
		{
			name: "Program ID Context",
			description: "Address matches program owner",
			status: "pending",
		},
	],
	consoleOutput: `> cargo test-bpf...
> Compiling pda_module v0.1.0
> Error: expected (Pubkey, u8), found ()
> line 14: missing return expression
> Process exited with code 1`,
};

export const mockModuleLessons: ModuleLesson[] = [
	{
		id: "lesson-4-1",
		number: "4.1",
		title: "INTRODUCTION",
		completed: true,
		locked: false,
		active: false,
	},
	{
		id: "lesson-4-2",
		number: "4.2",
		title: "ACCOUNT MODELS",
		completed: true,
		locked: false,
		active: false,
	},
	{
		id: "lesson-4-3",
		number: "4.3",
		title: "PDA FUNDAMENTALS",
		completed: false,
		locked: false,
		active: true,
	},
	{
		id: "lesson-4-4",
		number: "4.4",
		title: "SEEDS & NONCES",
		completed: false,
		locked: false,
		active: false,
	},
	{
		id: "lesson-4-5",
		number: "4.5",
		title: "FINAL CHALLENGE",
		completed: false,
		locked: true,
		active: false,
	},
];

/**
 * Retrieves a lesson by its ID.
 * @param id - The unique identifier for the lesson.
 * @returns The Lesson object matching the ID.
 */
export function getLesson(id: string): Lesson {
	if (id === "lesson-4-5") {
		return mockLessonChallenge;
	}
	// For demo, return the main content lesson for all other IDs (lesson-4-3 etc)
	return mockLesson;
}
