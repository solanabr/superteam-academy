export interface ChallengeDefinition {
	title: string;
	description: string;
	difficulty: string;
	estimatedTime: string;
	xpReward: number;
	language: string;
	starterCode: string;
	instructions: Array<{ title: string; content: string }>;
	objectives: string[];
	tests: Array<{ id: string; description: string; type: "unit" | "integration" }>;
	hints: Array<{ content: string; cost: number }>;
}

const CHALLENGES: Record<string, ChallengeDefinition> = {
	"transactions-and-signers": {
		title: "Build a Simple Counter Program",
		description:
			"Create a Solana program that implements a basic counter with increment and decrement functionality.",
		difficulty: "Beginner",
		estimatedTime: "45 min",
		xpReward: 100,
		language: "rust",
		starterCode: `use anchor_lang::prelude::*;

declare_id!("YourProgramIDHere");

#[program]
pub mod counter_program {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let counter = &mut ctx.accounts.counter;
        counter.count = 0;
        Ok(())
    }

    pub fn increment(ctx: Context<Increment>) -> Result<()> {
        let counter = &mut ctx.accounts.counter;
        counter.count += 1;
        Ok(())
    }

    pub fn decrement(ctx: Context<Decrement>) -> Result<()> {
        let counter = &mut ctx.accounts.counter;
        counter.count -= 1;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = user, space = 8 + 8)]
    pub counter: Account<'info, Counter>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Increment<'info> {
    #[account(mut)]
    pub counter: Account<'info, Counter>,
}

#[derive(Accounts)]
pub struct Decrement<'info> {
    #[account(mut)]
    pub counter: Account<'info, Counter>,
}

#[account]
pub struct Counter {
    pub count: i64,
}`,
		instructions: [
			{
				title: "Understanding the Requirements",
				content:
					"You need to create a Solana program that allows users to initialize a counter and then increment or decrement its value. The counter should store an i64 value.",
			},
			{
				title: "Setting up the Program Structure",
				content:
					"Use Anchor framework to create the program structure with proper account derivations and instructions.",
			},
			{
				title: "Implementing Initialize",
				content:
					"The initialize instruction should create a new counter account with an initial value of 0.",
			},
			{
				title: "Implementing Increment/Decrement",
				content: "Create instructions to increase and decrease the counter value by 1.",
			},
		],
		objectives: [
			"Initialize a counter account with a value of 0",
			"Implement an increment instruction",
			"Implement a decrement instruction",
			"Apply proper Anchor account constraints",
		],
		tests: [
			{ id: "test-1", description: "Initialize counter with value 0", type: "unit" },
			{ id: "test-2", description: "Increment counter from 0 to 1", type: "unit" },
			{ id: "test-3", description: "Decrement counter from 1 to 0", type: "unit" },
			{
				id: "test-4",
				description: "Multiple increments work correctly",
				type: "integration",
			},
		],
		hints: [
			{
				content: "Remember to use proper Anchor account constraints for PDA derivation.",
				cost: 10,
			},
			{
				content:
					"The counter account needs space for the discriminator (8 bytes) plus the i64 (8 bytes).",
				cost: 15,
			},
			{
				content:
					"Use the system program for account initialization in the Initialize instruction.",
				cost: 20,
			},
		],
	},
};

export function getChallengeDefinition(challengeId: string): ChallengeDefinition {
	const found = CHALLENGES[challengeId];
	if (!found) {
		throw new Error(`Challenge definition not found for slug: ${challengeId}`);
	}

	return found;
}
