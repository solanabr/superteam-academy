//! `MinterRole` — variable layout after the write-once `label` string.
//!
//! ```text
//! 0..8   discriminator
//! 8..40  minter: Pubkey
//! 40..44 label len (u32) | 44..44+n label bytes
//! +8     max_xp_per_call | +8 total_xp_minted | +1 is_active
//! +8     created_at | +8 max_total_xp | +1 bump
//! ```

use pinocchio::{error::ProgramError, Address};

use super::*;
use crate::consts::{ACC_MINTER_ROLE, MINTER_ROLE_SIZE};
use crate::errors::{fw, ACCOUNT_DID_NOT_DESERIALIZE};

const O_MINTER: usize = 8;

#[derive(Clone, Copy)]
pub struct MinterRoleOffsets {
    label_len: u16,
}

impl MinterRoleOffsets {
    pub fn parse(data: &[u8]) -> Result<Self, ProgramError> {
        let label_len = read_str_len(data, 40)?;
        validate_utf8(data, 44, label_len)?;
        let this = Self {
            label_len: label_len as u16,
        };
        // trailing fixed run = 8+8+1+8+8+1 = 34 bytes
        if this.o_max_xp_per_call() + 34 > data.len() {
            return Err(fw(ACCOUNT_DID_NOT_DESERIALIZE));
        }
        Ok(this)
    }

    #[inline(always)]
    fn o_max_xp_per_call(&self) -> usize {
        44 + self.label_len as usize
    }
    #[inline(always)]
    fn o_total_xp_minted(&self) -> usize {
        self.o_max_xp_per_call() + 8
    }
    #[inline(always)]
    fn o_is_active(&self) -> usize {
        self.o_total_xp_minted() + 8
    }
    #[inline(always)]
    fn o_created_at(&self) -> usize {
        self.o_is_active() + 1
    }
    #[inline(always)]
    fn o_max_total_xp(&self) -> usize {
        self.o_created_at() + 8
    }
    #[inline(always)]
    fn o_bump(&self) -> usize {
        self.o_max_total_xp() + 8
    }

    #[inline(always)]
    pub fn minter(&self, data: &[u8]) -> Address {
        read_address(data, O_MINTER)
    }
    #[inline(always)]
    pub fn max_xp_per_call(&self, data: &[u8]) -> u64 {
        read_u64(data, self.o_max_xp_per_call())
    }
    #[inline(always)]
    pub fn total_xp_minted(&self, data: &[u8]) -> u64 {
        read_u64(data, self.o_total_xp_minted())
    }
    #[inline(always)]
    pub fn is_active(&self, data: &[u8]) -> bool {
        data[self.o_is_active()] == 1
    }
    #[inline(always)]
    pub fn max_total_xp(&self, data: &[u8]) -> u64 {
        read_u64(data, self.o_max_total_xp())
    }
    #[inline(always)]
    pub fn bump(&self, data: &[u8]) -> u8 {
        data[self.o_bump()]
    }

    #[inline(always)]
    pub fn set_max_xp_per_call(&self, data: &mut [u8], value: u64) {
        let o = self.o_max_xp_per_call();
        data[o..o + 8].copy_from_slice(&value.to_le_bytes());
    }
    #[inline(always)]
    pub fn set_total_xp_minted(&self, data: &mut [u8], value: u64) {
        let o = self.o_total_xp_minted();
        data[o..o + 8].copy_from_slice(&value.to_le_bytes());
    }
    #[inline(always)]
    pub fn set_is_active(&self, data: &mut [u8], value: bool) {
        data[self.o_is_active()] = value as u8;
    }
    #[inline(always)]
    pub fn set_max_total_xp(&self, data: &mut [u8], value: u64) {
        let o = self.o_max_total_xp();
        data[o..o + 8].copy_from_slice(&value.to_le_bytes());
    }
}

/// Writes a fresh `MinterRole` (total_xp_minted=0, is_active=true) into a
/// zeroed account buffer.
pub fn init(
    data: &mut [u8],
    minter: &Address,
    label: &[u8],
    max_xp_per_call: u64,
    max_total_xp: u64,
    now: i64,
    bump: u8,
) -> MinterRoleOffsets {
    debug_assert_eq!(data.len(), MINTER_ROLE_SIZE);
    data[0..8].copy_from_slice(&ACC_MINTER_ROLE);
    write_address(data, O_MINTER, minter);
    data[40..44].copy_from_slice(&(label.len() as u32).to_le_bytes());
    data[44..44 + label.len()].copy_from_slice(label);

    let off = MinterRoleOffsets {
        label_len: label.len() as u16,
    };
    off.set_max_xp_per_call(data, max_xp_per_call);
    // total_xp_minted stays zero
    off.set_is_active(data, true);
    let o = off.o_created_at();
    data[o..o + 8].copy_from_slice(&now.to_le_bytes());
    off.set_max_total_xp(data, max_total_xp);
    data[off.o_bump()] = bump;
    off
}
