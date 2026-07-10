//! `Enrollment` — two `Option` fields make the layout variable, and both make
//! a one-way None→Some transition during the account's life:
//! `completed_at` at finalize_course, `credential_asset` at issue_credential.
//! Growing an option shifts every byte after it, exactly as Anchor's
//! full-struct rewrite does; the setters below reproduce that with a small
//! stack copy of the tail.
//!
//! ```text
//! 0..8   discriminator
//! 8..40  course: Pubkey
//! 40..48 enrolled_at: i64
//! 48     completed_at tag [+8 i64]
//! +32    lesson_flags: [u64; 4]
//! +1     credential_asset tag [+32 pubkey]
//! +4     course_gen (u32) | +1 bump
//! ```
//!
//! `course_gen` occupies the former trailing `_reserved` word; it records the
//! `Course.generation` in force at enroll time so the mint/credential handlers
//! can reject an enrollment left over from a superseded course generation.
//! It rides along the `completed_at` grow-shift and is re-planted (not zeroed)
//! by the `credential_asset` transition.

use pinocchio::{error::ProgramError, Address};

use super::*;
use crate::consts::{ACC_ENROLLMENT, ENROLLMENT_SIZE};
use crate::errors::{fw, ACCOUNT_DID_NOT_DESERIALIZE};

const O_COURSE: usize = 8;
const O_ENROLLED_AT: usize = 40;
const O_COMPLETED_TAG: usize = 48;

#[derive(Clone, Copy)]
pub struct EnrollmentOffsets {
    has_completed: bool,
    has_credential: bool,
}

impl EnrollmentOffsets {
    pub fn parse(data: &[u8]) -> Result<Self, ProgramError> {
        if data.len() <= O_COMPLETED_TAG {
            return Err(fw(ACCOUNT_DID_NOT_DESERIALIZE));
        }
        let has_completed = read_option_tag(data, O_COMPLETED_TAG)?;
        let o_cred_tag = 49 + if has_completed { 8 } else { 0 } + 32;
        if o_cred_tag >= data.len() {
            return Err(fw(ACCOUNT_DID_NOT_DESERIALIZE));
        }
        let has_credential = read_option_tag(data, o_cred_tag)?;
        let this = Self {
            has_completed,
            has_credential,
        };
        if this.o_bump() >= data.len() {
            return Err(fw(ACCOUNT_DID_NOT_DESERIALIZE));
        }
        Ok(this)
    }

    #[inline(always)]
    fn o_flags(&self) -> usize {
        49 + if self.has_completed { 8 } else { 0 }
    }
    #[inline(always)]
    fn o_cred_tag(&self) -> usize {
        self.o_flags() + 32
    }
    #[inline(always)]
    fn o_reserved(&self) -> usize {
        self.o_cred_tag() + 1 + if self.has_credential { 32 } else { 0 }
    }
    #[inline(always)]
    fn o_bump(&self) -> usize {
        self.o_reserved() + 4
    }

    #[inline(always)]
    pub fn course(&self, data: &[u8]) -> Address {
        read_address(data, O_COURSE)
    }
    #[inline(always)]
    pub fn enrolled_at(&self, data: &[u8]) -> i64 {
        read_i64(data, O_ENROLLED_AT)
    }
    #[inline(always)]
    pub fn completed_at(&self, data: &[u8]) -> Option<i64> {
        if self.has_completed {
            Some(read_i64(data, O_COMPLETED_TAG + 1))
        } else {
            None
        }
    }
    #[inline(always)]
    pub fn credential_asset(&self, data: &[u8]) -> Option<Address> {
        if self.has_credential {
            Some(read_address(data, self.o_cred_tag() + 1))
        } else {
            None
        }
    }
    #[inline(always)]
    pub fn course_gen(&self, data: &[u8]) -> u32 {
        read_u32(data, self.o_reserved())
    }
    #[inline(always)]
    pub fn bump(&self, data: &[u8]) -> u8 {
        data[self.o_bump()]
    }

    #[inline(always)]
    pub fn lesson_flag_word(&self, data: &[u8], word: usize) -> u64 {
        read_u64(data, self.o_flags() + word * 8)
    }

    #[inline(always)]
    pub fn set_lesson_flag_word(&self, data: &mut [u8], word: usize, value: u64) {
        let o = self.o_flags() + word * 8;
        data[o..o + 8].copy_from_slice(&value.to_le_bytes());
    }

    /// Total completed lessons (popcount over the 4-word bitmap).
    #[inline(always)]
    pub fn completed_lessons(&self, data: &[u8]) -> u32 {
        (0..4)
            .map(|w| self.lesson_flag_word(data, w).count_ones())
            .sum()
    }

    /// `completed_at`: None → Some(ts). Inserts 8 bytes at offset 49 and
    /// shifts the tail (flags + credential + reserved + bump — at most 70
    /// bytes) right, mirroring Anchor's re-serialization.
    pub fn set_completed_at(&mut self, data: &mut [u8], ts: i64) {
        debug_assert!(!self.has_completed);
        let tail_start = O_COMPLETED_TAG + 1;
        let tail_len = self.o_bump() + 1 - tail_start;
        let mut tail = [0u8; 72];
        tail[..tail_len].copy_from_slice(&data[tail_start..tail_start + tail_len]);
        data[O_COMPLETED_TAG] = 1;
        data[tail_start..tail_start + 8].copy_from_slice(&ts.to_le_bytes());
        data[tail_start + 8..tail_start + 8 + tail_len].copy_from_slice(&tail[..tail_len]);
        self.has_completed = true;
    }

    /// `credential_asset`: None → Some(asset). Inserts 32 bytes before the
    /// trailing `course_gen` word + `bump`, re-planting `course_gen` at its new
    /// offset (the pre-`course_gen` version zeroed this word).
    pub fn set_credential_asset(&mut self, data: &mut [u8], asset: &Address) {
        debug_assert!(!self.has_credential);
        let bump = data[self.o_bump()];
        let course_gen = self.course_gen(data);
        let o_tag = self.o_cred_tag();
        data[o_tag] = 1;
        write_address(data, o_tag + 1, asset);
        self.has_credential = true;
        let o_reserved = self.o_reserved();
        data[o_reserved..o_reserved + 4].copy_from_slice(&course_gen.to_le_bytes());
        data[self.o_bump()] = bump;
    }
}

/// Writes a fresh `Enrollment` (both options None, empty bitmap) into the
/// account buffer. Zeroes first so it is also correct for re-initialising a
/// stale-generation enrollment in place (see `enroll`), not only a freshly
/// created zeroed account.
pub fn init(data: &mut [u8], course: &Address, enrolled_at: i64, course_gen: u32, bump: u8) {
    debug_assert_eq!(data.len(), ENROLLMENT_SIZE);
    data.fill(0);
    data[0..8].copy_from_slice(&ACC_ENROLLMENT);
    write_address(data, O_COURSE, course);
    data[O_ENROLLED_AT..O_ENROLLED_AT + 8].copy_from_slice(&enrolled_at.to_le_bytes());
    // both options None: flags at 49, cred tag at 81, course_gen at 82, bump at 86.
    data[82..86].copy_from_slice(&course_gen.to_le_bytes());
    data[86] = bump;
}
