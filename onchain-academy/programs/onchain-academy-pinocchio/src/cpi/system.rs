//! System-program CPIs mirroring Anchor 0.31's `init` and `close` codegen.

use pinocchio::{
    cpi::Signer,
    error::ProgramError,
    sysvars::{get_sysvar, rent::RENT_ID},
    AccountView, Address, ProgramResult, Resize,
};
use pinocchio_system::instructions::{Allocate, Assign, CreateAccount, Transfer};

use crate::consts::SYSTEM_PROGRAM_ID;

const ACCOUNT_STORAGE_OVERHEAD: u64 = 128;

/// Rent-exemption minimum from the rent sysvar ACCOUNT's classic 17-byte
/// layout (`lamports_per_byte_year: u64, exemption_threshold: f64,
/// burn_percent: u8`), with the same f64 arithmetic `solana_program::Rent`
/// (and therefore the Anchor build) uses.
///
/// Deliberately NOT `pinocchio::sysvars::rent::Rent::get()`: pinocchio 0.11's
/// `Rent` is a redesigned 8-byte struct whose syscall-filled value only
/// matches on runtimes with the new rent representation — on Agave 3.0 it
/// reads the yearly rate without the exemption threshold and under-funds
/// accounts by 2x.
pub fn rent_minimum_balance(data_len: usize) -> Result<u64, ProgramError> {
    let mut raw = [0u8; 17];
    get_sysvar(&mut raw, &RENT_ID, 0)?;
    let mut lamports_per_byte_year = [0u8; 8];
    lamports_per_byte_year.copy_from_slice(&raw[0..8]);
    let mut exemption_threshold = [0u8; 8];
    exemption_threshold.copy_from_slice(&raw[8..16]);
    let per_year =
        (ACCOUNT_STORAGE_OVERHEAD + data_len as u64) * u64::from_le_bytes(lamports_per_byte_year);
    Ok((per_year as f64 * f64::from_bits(u64::from_le_bytes(exemption_threshold))) as u64)
}

/// Anchor `init`-equivalent PDA creation. `signer_seeds` are the NEW
/// account's own seeds (including bump).
///
/// Fresh accounts get one `CreateAccount`; pre-funded addresses follow
/// Anchor's fallback — transfer the rent shortfall (payer-signed), then
/// `Allocate` + `Assign` (PDA-signed). Re-initializing a live PDA therefore
/// fails inside the system program exactly as it does under Anchor.
pub fn create_pda_account(
    payer: &AccountView,
    target: &AccountView,
    space: usize,
    owner: &Address,
    signer_seeds: &Signer,
) -> ProgramResult {
    let min_balance = rent_minimum_balance(space)?;
    let current_lamports = target.lamports();

    if current_lamports == 0 {
        CreateAccount {
            from: payer,
            to: target,
            lamports: min_balance,
            space: space as u64,
            owner,
        }
        .invoke_signed(core::slice::from_ref(signer_seeds))
    } else {
        let required = min_balance.max(1).saturating_sub(current_lamports);
        if required > 0 {
            Transfer {
                from: payer,
                to: target,
                lamports: required,
            }
            .invoke()?;
        }
        Allocate {
            account: target,
            space: space as u64,
        }
        .invoke_signed(core::slice::from_ref(signer_seeds))?;
        Assign {
            account: target,
            owner,
        }
        .invoke_signed(core::slice::from_ref(signer_seeds))
    }
}

/// Anchor `close = <destination>` equivalent (anchor-lang 0.31
/// `common::close`): drain lamports, assign to the system program, then
/// truncate the data to zero length. No CLOSED-discriminator write in 0.31.
pub fn close_account(target: &mut AccountView, destination: &mut AccountView) -> ProgramResult {
    let merged = destination
        .lamports()
        .checked_add(target.lamports())
        .ok_or(ProgramError::ArithmeticOverflow)?;
    destination.set_lamports(merged);
    target.set_lamports(0);
    // SAFETY: no reference to `target.owner()` is alive and the account is
    // writable and program-owned.
    unsafe { target.assign(&SYSTEM_PROGRAM_ID) };
    target.resize(0)
}
