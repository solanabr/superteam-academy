//! Shared validation helpers — each mirrors one Anchor constraint or account
//! check, returning the exact error code (and log line) the Anchor build
//! produces for the same violation.

use pinocchio::{
    error::ProgramError,
    sysvars::{clock::Clock, Sysvar},
    AccountView, Address,
};

use crate::consts::{ID, SYSTEM_PROGRAM_ID};
use crate::errors::*;

/// Borsh instruction-argument reader over the raw bytes after the 8-byte
/// discriminator. Failures map to Anchor's `InstructionDidNotDeserialize`.
/// Like Anchor (which uses `BorshDeserialize::deserialize`), trailing bytes
/// after the last argument are ignored.
pub struct Cursor<'a> {
    data: &'a [u8],
}

impl<'a> Cursor<'a> {
    #[inline(always)]
    pub fn new(data: &'a [u8]) -> Self {
        Self { data }
    }

    #[inline(always)]
    fn take(&mut self, n: usize) -> Result<&'a [u8], ProgramError> {
        if self.data.len() < n {
            return Err(fw(INSTRUCTION_DID_NOT_DESERIALIZE));
        }
        let (bytes, rest) = self.data.split_at(n);
        self.data = rest;
        Ok(bytes)
    }

    #[inline(always)]
    pub fn u8(&mut self) -> Result<u8, ProgramError> {
        Ok(self.take(1)?[0])
    }

    #[inline(always)]
    pub fn bool(&mut self) -> Result<bool, ProgramError> {
        // Borsh only accepts 0 or 1 for bool.
        match self.u8()? {
            0 => Ok(false),
            1 => Ok(true),
            _ => Err(fw(INSTRUCTION_DID_NOT_DESERIALIZE)),
        }
    }

    #[inline(always)]
    pub fn u16(&mut self) -> Result<u16, ProgramError> {
        let b = self.take(2)?;
        Ok(u16::from_le_bytes([b[0], b[1]]))
    }

    #[inline(always)]
    pub fn u32(&mut self) -> Result<u32, ProgramError> {
        let b = self.take(4)?;
        let mut a = [0u8; 4];
        a.copy_from_slice(b);
        Ok(u32::from_le_bytes(a))
    }

    #[inline(always)]
    pub fn u64(&mut self) -> Result<u64, ProgramError> {
        let b = self.take(8)?;
        let mut a = [0u8; 8];
        a.copy_from_slice(b);
        Ok(u64::from_le_bytes(a))
    }

    #[inline(always)]
    pub fn bytes32(&mut self) -> Result<&'a [u8; 32], ProgramError> {
        let b = self.take(32)?;
        b.try_into()
            .map_err(|_| fw(INSTRUCTION_DID_NOT_DESERIALIZE))
    }

    #[inline(always)]
    pub fn address(&mut self) -> Result<Address, ProgramError> {
        Ok(Address::new_from_array(*self.bytes32()?))
    }

    /// Borsh `String`: u32 LE length + UTF-8 bytes (validated, as borsh does).
    #[inline(always)]
    pub fn str(&mut self) -> Result<&'a str, ProgramError> {
        let len = self.u32()? as usize;
        let bytes = self.take(len)?;
        core::str::from_utf8(bytes).map_err(|_| fw(INSTRUCTION_DID_NOT_DESERIALIZE))
    }

    #[inline(always)]
    fn option_tag(&mut self) -> Result<bool, ProgramError> {
        match self.u8()? {
            0 => Ok(false),
            1 => Ok(true),
            _ => Err(fw(INSTRUCTION_DID_NOT_DESERIALIZE)),
        }
    }

    #[inline(always)]
    pub fn option_address(&mut self) -> Result<Option<Address>, ProgramError> {
        Ok(if self.option_tag()? {
            Some(self.address()?)
        } else {
            None
        })
    }

    #[inline(always)]
    pub fn option_bool(&mut self) -> Result<Option<bool>, ProgramError> {
        Ok(if self.option_tag()? {
            Some(self.bool()?)
        } else {
            None
        })
    }

    #[inline(always)]
    pub fn option_u16(&mut self) -> Result<Option<u16>, ProgramError> {
        Ok(if self.option_tag()? {
            Some(self.u16()?)
        } else {
            None
        })
    }

    #[inline(always)]
    pub fn option_u32(&mut self) -> Result<Option<u32>, ProgramError> {
        Ok(if self.option_tag()? {
            Some(self.u32()?)
        } else {
            None
        })
    }

    #[inline(always)]
    pub fn option_bytes32(&mut self) -> Result<Option<&'a [u8; 32]>, ProgramError> {
        Ok(if self.option_tag()? {
            Some(self.bytes32()?)
        } else {
            None
        })
    }
}

// ---- Anchor constraint mirrors ------------------------------------------

/// `Signer<'info>` — AccountNotSigner (3010).
#[inline(always)]
pub fn expect_signer(acct: &AccountView) -> Result<(), ProgramError> {
    if acct.is_signer() {
        Ok(())
    } else {
        Err(fw(ACCOUNT_NOT_SIGNER))
    }
}

/// `#[account(mut)]` — ConstraintMut (2000).
#[inline(always)]
pub fn expect_writable(acct: &AccountView) -> Result<(), ProgramError> {
    if acct.is_writable() {
        Ok(())
    } else {
        Err(fw(CONSTRAINT_MUT))
    }
}

/// `constraint = acct.key() == expected @ err` — custom program error.
#[inline(always)]
pub fn expect_key(
    acct: &AccountView,
    expected: &Address,
    err: AcademyError,
) -> Result<(), ProgramError> {
    if acct.address() == expected {
        Ok(())
    } else {
        Err(academy(err))
    }
}

/// `address = expected` — ConstraintAddress (2012).
#[inline(always)]
pub fn expect_address(acct: &AccountView, expected: &Address) -> Result<(), ProgramError> {
    if acct.address() == expected {
        Ok(())
    } else {
        Err(fw(CONSTRAINT_ADDRESS))
    }
}

/// `Program<'info, System>` — InvalidProgramId (3008).
#[inline(always)]
pub fn expect_system_program(acct: &AccountView) -> Result<(), ProgramError> {
    if acct.address() == &SYSTEM_PROGRAM_ID {
        Ok(())
    } else {
        Err(fw(INVALID_PROGRAM_ID))
    }
}

// ---- Anchor `Account<T>` load sequence -----------------------------------

/// Anchor rejects accounts that are system-owned with zero lamports before
/// anything else — AccountNotInitialized (3012).
#[inline(always)]
pub fn expect_initialized(acct: &AccountView) -> Result<(), ProgramError> {
    if acct.owned_by(&SYSTEM_PROGRAM_ID) && acct.lamports() == 0 {
        return Err(fw(ACCOUNT_NOT_INITIALIZED));
    }
    Ok(())
}

/// Owner must be this program — AccountOwnedByWrongProgram (3007).
#[inline(always)]
pub fn expect_program_owned(acct: &AccountView) -> Result<(), ProgramError> {
    if acct.owned_by(&ID) {
        Ok(())
    } else {
        Err(fw(ACCOUNT_OWNED_BY_WRONG_PROGRAM))
    }
}

/// Discriminator presence (3001) and match (3002).
#[inline(always)]
pub fn expect_discriminator(data: &[u8], expected: &[u8; 8]) -> Result<(), ProgramError> {
    if data.len() < 8 {
        return Err(fw(ACCOUNT_DISCRIMINATOR_NOT_FOUND));
    }
    if data[..8] != expected[..] {
        return Err(fw(ACCOUNT_DISCRIMINATOR_MISMATCH));
    }
    Ok(())
}

/// Full `Account<T>` load precondition sequence (everything except the
/// type-specific offset parse, which the caller runs on the borrowed data).
#[inline(always)]
pub fn expect_account(acct: &AccountView, disc: &[u8; 8]) -> Result<(), ProgramError> {
    expect_initialized(acct)?;
    expect_program_owned(acct)?;
    let data = acct.try_borrow()?;
    expect_discriminator(&data, disc)
}

/// `seeds = [b"config"], bump = config.bump` — `["config"]` derives exactly
/// one address for this program id, so the PDA check collapses to a 32-byte
/// compare against the compile-time [`crate::consts::CONFIG_PDA`] (saving the
/// ~1,500 CU `create_program_address` syscall Anchor pays on every
/// instruction). Load the account with
/// `expect_account(.., &ACC_CONFIG)` first (extraction phase).
#[inline(always)]
pub fn expect_config_pda(acct: &AccountView) -> Result<(), ProgramError> {
    if acct.address() == &crate::consts::CONFIG_PDA {
        Ok(())
    } else {
        Err(fw(CONSTRAINT_SEEDS))
    }
}

// ---- PDA checks -----------------------------------------------------------

/// `seeds = [...], bump = <stored>` — one `create_program_address` syscall
/// against the provided seeds (which must already include the bump slice).
/// ConstraintSeeds (2006) on mismatch.
#[inline(always)]
pub fn expect_pda(acct: &AccountView, seeds_with_bump: &[&[u8]]) -> Result<(), ProgramError> {
    let derived =
        Address::create_program_address(seeds_with_bump, &ID).map_err(|_| fw(CONSTRAINT_SEEDS))?;
    if acct.address() == &derived {
        Ok(())
    } else {
        Err(fw(CONSTRAINT_SEEDS))
    }
}

/// `seeds = [...], bump` on init paths — canonical bump search.
#[inline(always)]
pub fn find_pda(seeds: &[&[u8]]) -> (Address, u8) {
    Address::find_program_address(seeds, &ID)
}

/// Like [`expect_pda`] but for `init`/find-derived accounts: derives the
/// canonical PDA and errors with ConstraintSeeds (2006) on mismatch.
#[inline(always)]
pub fn expect_found_pda(acct: &AccountView, seeds: &[&[u8]]) -> Result<u8, ProgramError> {
    let (derived, bump) = find_pda(seeds);
    if acct.address() == &derived {
        Ok(bump)
    } else {
        Err(fw(CONSTRAINT_SEEDS))
    }
}

// ---- Token-2022 account binding ------------------------------------------

const TOKEN_ACCOUNT_BASE_LEN: usize = 165;
const MULTISIG_LEN: usize = 355;
const ACCOUNT_TYPE_ACCOUNT: u8 = 2;

/// Structural validation identical to
/// `StateWithExtensions::<spl_token_2022::state::Account>::unpack`:
/// length/multisig gate, base-field tag validation, initialization check,
/// then the extension account-type byte. Returns the same `ProgramError`s.
fn validate_token_account(data: &[u8]) -> Result<(), ProgramError> {
    if data.len() == MULTISIG_LEN || data.len() < TOKEN_ACCOUNT_BASE_LEN {
        return Err(ProgramError::InvalidAccountData);
    }
    // COption<Pubkey> delegate tag at 72, COption<u64> is_native tag at 109,
    // COption<Pubkey> close_authority tag at 129: u32 LE ∈ {0, 1}.
    for tag_offset in [72usize, 109, 129] {
        let tag = u32::from_le_bytes([
            data[tag_offset],
            data[tag_offset + 1],
            data[tag_offset + 2],
            data[tag_offset + 3],
        ]);
        if tag > 1 {
            return Err(ProgramError::InvalidAccountData);
        }
    }
    // AccountState at 108: 0 Uninitialized / 1 Initialized / 2 Frozen.
    match data[108] {
        0 => return Err(ProgramError::UninitializedAccount),
        1 | 2 => {}
        _ => return Err(ProgramError::InvalidAccountData),
    }
    if data.len() > TOKEN_ACCOUNT_BASE_LEN && data[TOKEN_ACCOUNT_BASE_LEN] != ACCOUNT_TYPE_ACCOUNT {
        return Err(ProgramError::InvalidAccountData);
    }
    Ok(())
}

/// Mirrors `utils::require_xp_mint`: the token account's mint must equal
/// `Config.xp_mint` — WrongXpMint (6032).
pub fn require_xp_mint(acct: &AccountView, expected_mint: &Address) -> Result<(), ProgramError> {
    let data = acct.try_borrow()?;
    validate_token_account(&data)?;
    if data[0..32] != expected_mint.as_array()[..] {
        return Err(academy(AcademyError::WrongXpMint));
    }
    Ok(())
}

/// Mirrors `utils::require_xp_recipient`: mint binding plus token-account
/// owner binding — Unauthorized (6000) when the owner differs.
pub fn require_xp_recipient(
    acct: &AccountView,
    expected_mint: &Address,
    expected_owner: &Address,
) -> Result<(), ProgramError> {
    let data = acct.try_borrow()?;
    validate_token_account(&data)?;
    if data[0..32] != expected_mint.as_array()[..] {
        return Err(academy(AcademyError::WrongXpMint));
    }
    if data[32..64] != expected_owner.as_array()[..] {
        return Err(academy(AcademyError::Unauthorized));
    }
    Ok(())
}

/// `Clock::get()?.unix_timestamp`.
#[inline(always)]
pub fn now() -> Result<i64, ProgramError> {
    Ok(Clock::get()?.unix_timestamp)
}

/// Slice the accounts array or fail like Anchor's missing-accounts path —
/// AccountNotEnoughKeys (3005).
#[macro_export]
macro_rules! take_accounts {
    ([$($name:ident),+ $(,)?] = $accounts:expr) => {
        let [$($name),+, ..] = $accounts else {
            return Err($crate::errors::fw($crate::errors::ACCOUNT_NOT_ENOUGH_KEYS));
        };
    };
    ([$($name:ident),+ $(,)?] rest $rest:ident = $accounts:expr) => {
        let [$($name),+, $rest @ ..] = $accounts else {
            return Err($crate::errors::fw($crate::errors::ACCOUNT_NOT_ENOUGH_KEYS));
        };
    };
}
