//! Zero-copy views over Anchor-serialized account data.
//!
//! Account bytes are TRUE Borsh behind an 8-byte discriminator: `String` is a
//! u32-LE length prefix + bytes and `Option<T>` is a 1-byte tag + payload, so
//! field offsets can shift with content. Each module parses the offsets once
//! (validating bounds/tags exactly where Anchor's deserializer would fail with
//! `AccountDidNotDeserialize`), then reads and patches fields in place.
//!
//! In-place patching is byte-identical to Anchor's serialize-on-exit because
//! every variable-size transition in this program only grows (`completed_at`
//! and `credential_asset` go None→Some once; strings are write-once at init),
//! so no stale trailing bytes can ever be observed. Proven against the Anchor
//! crate in `tests/layout_parity.rs`.

pub mod achievement;
pub mod config;
pub mod course;
pub mod enrollment;
pub mod minter_role;

use pinocchio::{error::ProgramError, Address};

use crate::errors::{fw, ACCOUNT_DID_NOT_DESERIALIZE};

#[inline(always)]
pub(crate) fn read_address(data: &[u8], offset: usize) -> Address {
    let mut bytes = [0u8; 32];
    bytes.copy_from_slice(&data[offset..offset + 32]);
    Address::new_from_array(bytes)
}

#[inline(always)]
pub(crate) fn write_address(data: &mut [u8], offset: usize, value: &Address) {
    data[offset..offset + 32].copy_from_slice(value.as_array());
}

#[inline(always)]
pub(crate) fn read_u16(data: &[u8], offset: usize) -> u16 {
    u16::from_le_bytes([data[offset], data[offset + 1]])
}

#[inline(always)]
pub(crate) fn read_u32(data: &[u8], offset: usize) -> u32 {
    let mut b = [0u8; 4];
    b.copy_from_slice(&data[offset..offset + 4]);
    u32::from_le_bytes(b)
}

#[inline(always)]
pub(crate) fn read_u64(data: &[u8], offset: usize) -> u64 {
    let mut b = [0u8; 8];
    b.copy_from_slice(&data[offset..offset + 8]);
    u64::from_le_bytes(b)
}

#[inline(always)]
pub(crate) fn read_i64(data: &[u8], offset: usize) -> i64 {
    read_u64(data, offset) as i64
}

/// Borsh `Option` tag: 0 = None, 1 = Some, anything else is data Anchor's
/// deserializer would reject.
#[inline(always)]
pub(crate) fn read_option_tag(data: &[u8], offset: usize) -> Result<bool, ProgramError> {
    match data[offset] {
        0 => Ok(false),
        1 => Ok(true),
        _ => Err(fw(ACCOUNT_DID_NOT_DESERIALIZE)),
    }
}

/// Reads a Borsh string header at `offset` and returns its byte length,
/// validating that BOTH the 4-byte header AND the declared body fit within
/// the account. The full-width bounds check (against the whole account, which
/// is ≤ a few hundred bytes) guarantees the returned length never exceeds
/// `data.len()`, so downstream `as u16` offset narrowing cannot truncate a
/// huge length into a small in-bounds offset — matching Anchor's borsh
/// `String::deserialize`, which errors (`AccountDidNotDeserialize`) when the
/// declared length overruns the remaining bytes.
#[inline(always)]
pub(crate) fn read_str_len(data: &[u8], offset: usize) -> Result<usize, ProgramError> {
    if offset + 4 > data.len() {
        return Err(fw(ACCOUNT_DID_NOT_DESERIALIZE));
    }
    let len = read_u32(data, offset) as usize;
    if offset + 4 + len > data.len() {
        return Err(fw(ACCOUNT_DID_NOT_DESERIALIZE));
    }
    Ok(len)
}

/// Validates that a string field's bytes are UTF-8, matching Anchor's borsh
/// `String::deserialize` (which rejects invalid UTF-8 with
/// `AccountDidNotDeserialize`). The caller passes offsets that `read_str_len`
/// already bounds-checked.
#[inline(always)]
pub(crate) fn validate_utf8(data: &[u8], start: usize, len: usize) -> Result<(), ProgramError> {
    core::str::from_utf8(&data[start..start + len]).map_err(|_| fw(ACCOUNT_DID_NOT_DESERIALIZE))?;
    Ok(())
}
