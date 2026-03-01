use anchor_lang::{prelude::*, system_program};
use litesvm::LiteSVM;
use solana_sdk::{instruction::Instruction, pubkey::Pubkey, signature::Keypair, signer::Signer, transaction::Transaction};

use superteam_academy::{
    instruction::*,
    state::*,
    errors::AcademyError,
};

pub struct TestFixtures;

impl TestFixtures {
    pub fn create_config_instruction(
        authority: &Pubkey,
        max_daily_xp: u32,
        max_achievement_xp: u32,
    ) -> Instruction {
        let config_pda = Pubkey::find_program_address(
            &[Config::SEED],
            &superteam_academy::id(),
        ).0;

        Instruction {
            program_id: superteam_academy::id(),
            accounts: vec![
                AccountMeta::new(*authority, true),
                AccountMeta::new(config_pda, false),
                AccountMeta::new_readonly(system_program::id(), false),
            ],
            data: Initialize {
                max_daily_xp,
                max_achievement_xp,
            }.data(),
        }
    }

    pub fn create_season_instruction(
        authority: &Keypair,
        season: u16,
    ) -> Instruction {
        let config_pda = Pubkey::find_program_address(
            &[Config::SEED],
            &superteam_academy::id(),
        ).0;

        // In real implementation, would need to derive mint PDA
        // For now, simplified
        Instruction {
            program_id: superteam_academy::id(),
            accounts: vec![
                AccountMeta::new(authority.pubkey(), true),
                AccountMeta::new(config_pda, false),
                // Additional accounts for mint creation would go here
            ],
            data: CreateSeason {
                season,
            }.data(),
        }
    }

    pub fn create_init_learner_instruction(
        learner: &Keypair,
    ) -> Instruction {
        let learner_pda = Pubkey::find_program_address(
            &[b"learner", learner.pubkey().as_ref()],
            &superteam_academy::id(),
        ).0;

        Instruction {
            program_id: superteam_academy::id(),
            accounts: vec![
                AccountMeta::new(learner.pubkey(), true),
                AccountMeta::new(learner_pda, false),
                AccountMeta::new_readonly(system_program::id(), false),
            ],
            data: InitLearner {}.data(),
        }
    }

    pub fn create_course_params() -> CreateCourseParams {
        CreateCourseParams {
            course_id: "anchor-beginner".to_string(),
            creator: Pubkey::new_unique(),
            authority: None,
            content_tx_id: [0u8; 32],
            content_type: 0,
            lesson_count: 5,
            challenge_count: 1,
            difficulty: 1,
            xp_total: 500,
            track_id: 1,
            track_level: 1,
            prerequisite: None,
            completion_reward_xp: 50,
            min_completions_for_reward: 10,
        }
    }
}

// Helper trait for instruction serialization
trait InstructionData {
    fn data(&self) -> Vec<u8>;
}

macro_rules! impl_instruction_data {
    ($($t:ty),*) => {
        $(
            impl InstructionData for $t {
                fn data(&self) -> Vec<u8> {
                    let mut data = vec![
                        // Discriminator would be added here
                        // For now, empty - actual implementation needs proper serialization
                    ];
                    // Append serialized data
                    data.extend_from_slice(&anchor_lang::AnchorSerialize::try_to_vec(self).unwrap());
                    data
                }
            }
        )*
    };
}

impl_instruction_data!(Initialize, CreateSeason, InitLearner, CreateCourseParams);

#[derive(AnchorSerialize, AnchorDeserialize)]
struct Initialize {
    max_daily_xp: u32,
    max_achievement_xp: u32,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
struct CreateSeason {
    season: u16,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
struct InitLearner;

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct CreateCourseParams {
    pub course_id: String,
    pub creator: Pubkey,
    pub authority: Option<Pubkey>,
    pub content_tx_id: [u8; 32],
    pub content_type: u8,
    pub lesson_count: u8,
    pub challenge_count: u8,
    pub difficulty: u8,
    pub xp_total: u32,
    pub track_id: u16,
    pub track_level: u8,
    pub prerequisite: Option<Pubkey>,
    pub completion_reward_xp: u32,
    pub min_completions_for_reward: u16,
}

impl CreateCourseParams {
    fn data(&self) -> Vec<u8> {
        anchor_lang::AnchorSerialize::try_to_vec(self).unwrap()
    }
}
