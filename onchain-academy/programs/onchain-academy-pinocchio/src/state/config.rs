//! `Config` — fully fixed layout (no variable-size fields).
//!
//! ```text
//! 0..8    discriminator
//! 8..40   authority: Pubkey
//! 40..72  backend_signer: Pubkey
//! 72..104 xp_mint: Pubkey
//! 104     paused: bool
//! 105..109 course_nonce: u32   (monotonic; stamped as each Course's generation)
//! 109..112 _reserved: [u8; 3]
//! 112     bump: u8
//! ```

use pinocchio::Address;

use super::{read_address, read_u32, write_address};
use crate::consts::{ACC_CONFIG, CONFIG_SIZE};

const O_AUTHORITY: usize = 8;
const O_BACKEND_SIGNER: usize = 40;
const O_XP_MINT: usize = 72;
const O_PAUSED: usize = 104;
const O_COURSE_NONCE: usize = 105;
const O_BUMP: usize = 112;

#[inline(always)]
pub fn authority(data: &[u8]) -> Address {
    read_address(data, O_AUTHORITY)
}

#[inline(always)]
pub fn backend_signer(data: &[u8]) -> Address {
    read_address(data, O_BACKEND_SIGNER)
}

#[inline(always)]
pub fn xp_mint(data: &[u8]) -> Address {
    read_address(data, O_XP_MINT)
}

#[inline(always)]
pub fn paused(data: &[u8]) -> bool {
    data[O_PAUSED] == 1
}

/// Monotonic course-generation counter (see [`crate::state::course`]). Never
/// resets, so a course id recreated after `close_course` always receives a
/// generation distinct from its prior life.
#[inline(always)]
pub fn course_nonce(data: &[u8]) -> u32 {
    read_u32(data, O_COURSE_NONCE)
}

#[inline(always)]
pub fn set_course_nonce(data: &mut [u8], value: u32) {
    data[O_COURSE_NONCE..O_COURSE_NONCE + 4].copy_from_slice(&value.to_le_bytes());
}

#[inline(always)]
pub fn set_authority(data: &mut [u8], value: &Address) {
    write_address(data, O_AUTHORITY, value);
}

#[inline(always)]
pub fn set_backend_signer(data: &mut [u8], value: &Address) {
    write_address(data, O_BACKEND_SIGNER, value);
}

#[inline(always)]
pub fn set_paused(data: &mut [u8], value: bool) {
    data[O_PAUSED] = value as u8;
}

/// Writes a fresh `Config` into a zeroed account buffer.
pub fn init(
    data: &mut [u8],
    authority: &Address,
    backend_signer: &Address,
    xp_mint: &Address,
    bump: u8,
) {
    debug_assert_eq!(data.len(), CONFIG_SIZE);
    data[0..8].copy_from_slice(&ACC_CONFIG);
    write_address(data, O_AUTHORITY, authority);
    write_address(data, O_BACKEND_SIGNER, backend_signer);
    write_address(data, O_XP_MINT, xp_mint);
    // paused=false and _reserved stay zero
    data[O_BUMP] = bump;
}
