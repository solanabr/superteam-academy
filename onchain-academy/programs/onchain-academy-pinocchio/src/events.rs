//! Anchor-format event emission.
//!
//! Each function serializes `discriminator ++ borsh(fields)` into a stack
//! buffer and emits it via `sol_log_data`, producing byte-identical
//! `Program data: <base64>` logs to the Anchor build's `emit!` (the format
//! the Helius webhook decoder and tests parse). Field order and types mirror
//! the Anchor crate's `events.rs` verbatim; parity is proven per-event in
//! `tests/discriminator_parity.rs`.

use pinocchio::Address;

use crate::consts::*;
use crate::log::sol_log_data;

pub struct BorshWriter<'a> {
    buf: &'a mut [u8],
    len: usize,
}

impl<'a> BorshWriter<'a> {
    #[inline(always)]
    pub fn new(buf: &'a mut [u8]) -> Self {
        Self { buf, len: 0 }
    }

    #[inline(always)]
    pub fn put(&mut self, bytes: &[u8]) {
        self.buf[self.len..self.len + bytes.len()].copy_from_slice(bytes);
        self.len += bytes.len();
    }

    #[inline(always)]
    pub fn put_u8(&mut self, v: u8) {
        self.buf[self.len] = v;
        self.len += 1;
    }

    #[inline(always)]
    pub fn put_bool(&mut self, v: bool) {
        self.put_u8(v as u8);
    }

    #[inline(always)]
    pub fn put_u16(&mut self, v: u16) {
        self.put(&v.to_le_bytes());
    }

    #[inline(always)]
    pub fn put_u32(&mut self, v: u32) {
        self.put(&v.to_le_bytes());
    }

    #[inline(always)]
    pub fn put_u64(&mut self, v: u64) {
        self.put(&v.to_le_bytes());
    }

    #[inline(always)]
    pub fn put_i64(&mut self, v: i64) {
        self.put(&v.to_le_bytes());
    }

    #[inline(always)]
    pub fn put_address(&mut self, v: &Address) {
        self.put(v.as_array());
    }

    /// Borsh `String`: u32 LE length prefix + UTF-8 bytes.
    #[inline(always)]
    pub fn put_str(&mut self, v: &str) {
        self.put_str_bytes(v.as_bytes());
    }

    /// Same wire format as [`Self::put_str`], for strings held as raw bytes
    /// (account state written by this program is always valid UTF-8).
    #[inline(always)]
    pub fn put_str_bytes(&mut self, v: &[u8]) {
        self.put_u32(v.len() as u32);
        self.put(v);
    }

    #[inline(always)]
    pub fn finish(self) -> &'a [u8] {
        &self.buf[..self.len]
    }
}

pub fn emit_config_updated(field: &str, timestamp: i64) {
    let mut buf = [0u8; 64];
    let mut w = BorshWriter::new(&mut buf);
    w.put(&EV_CONFIG_UPDATED);
    w.put_str(field);
    w.put_i64(timestamp);
    sol_log_data(&[w.finish()]);
}

#[allow(clippy::too_many_arguments)]
pub fn emit_course_created(
    course: &Address,
    course_id: &[u8],
    creator: &Address,
    track_id: u16,
    track_level: u8,
    collection: &Address,
    timestamp: i64,
) {
    let mut buf = [0u8; 160];
    let mut w = BorshWriter::new(&mut buf);
    w.put(&EV_COURSE_CREATED);
    w.put_address(course);
    w.put_str_bytes(course_id);
    w.put_address(creator);
    w.put_u16(track_id);
    w.put_u8(track_level);
    w.put_address(collection);
    w.put_i64(timestamp);
    sol_log_data(&[w.finish()]);
}

pub fn emit_course_updated(course: &Address, version: u16, collection: &Address, timestamp: i64) {
    let mut buf = [0u8; 96];
    let mut w = BorshWriter::new(&mut buf);
    w.put(&EV_COURSE_UPDATED);
    w.put_address(course);
    w.put_u16(version);
    w.put_address(collection);
    w.put_i64(timestamp);
    sol_log_data(&[w.finish()]);
}

pub fn emit_enrolled(learner: &Address, course: &Address, course_version: u16, timestamp: i64) {
    let mut buf = [0u8; 96];
    let mut w = BorshWriter::new(&mut buf);
    w.put(&EV_ENROLLED);
    w.put_address(learner);
    w.put_address(course);
    w.put_u16(course_version);
    w.put_i64(timestamp);
    sol_log_data(&[w.finish()]);
}

pub fn emit_lesson_completed(
    learner: &Address,
    course: &Address,
    lesson_index: u8,
    xp_earned: u32,
    timestamp: i64,
) {
    let mut buf = [0u8; 96];
    let mut w = BorshWriter::new(&mut buf);
    w.put(&EV_LESSON_COMPLETED);
    w.put_address(learner);
    w.put_address(course);
    w.put_u8(lesson_index);
    w.put_u32(xp_earned);
    w.put_i64(timestamp);
    sol_log_data(&[w.finish()]);
}

#[allow(clippy::too_many_arguments)]
pub fn emit_course_finalized(
    learner: &Address,
    course: &Address,
    total_xp: u32,
    bonus_xp: u64,
    creator: &Address,
    creator_xp: u32,
    timestamp: i64,
) {
    let mut buf = [0u8; 128];
    let mut w = BorshWriter::new(&mut buf);
    w.put(&EV_COURSE_FINALIZED);
    w.put_address(learner);
    w.put_address(course);
    w.put_u32(total_xp);
    w.put_u64(bonus_xp);
    w.put_address(creator);
    w.put_u32(creator_xp);
    w.put_i64(timestamp);
    sol_log_data(&[w.finish()]);
}

pub fn emit_enrollment_closed(
    learner: &Address,
    course: &Address,
    completed: bool,
    rent_reclaimed: u64,
    timestamp: i64,
) {
    let mut buf = [0u8; 96];
    let mut w = BorshWriter::new(&mut buf);
    w.put(&EV_ENROLLMENT_CLOSED);
    w.put_address(learner);
    w.put_address(course);
    w.put_bool(completed);
    w.put_u64(rent_reclaimed);
    w.put_i64(timestamp);
    sol_log_data(&[w.finish()]);
}

pub fn emit_credential_issued(
    learner: &Address,
    track_id: u16,
    credential_asset: &Address,
    current_level: u8,
    timestamp: i64,
) {
    let mut buf = [0u8; 96];
    let mut w = BorshWriter::new(&mut buf);
    w.put(&EV_CREDENTIAL_ISSUED);
    w.put_address(learner);
    w.put_u16(track_id);
    w.put_address(credential_asset);
    w.put_u8(current_level);
    w.put_i64(timestamp);
    sol_log_data(&[w.finish()]);
}

pub fn emit_credential_upgraded(
    learner: &Address,
    track_id: u16,
    credential_asset: &Address,
    current_level: u8,
    timestamp: i64,
) {
    let mut buf = [0u8; 96];
    let mut w = BorshWriter::new(&mut buf);
    w.put(&EV_CREDENTIAL_UPGRADED);
    w.put_address(learner);
    w.put_u16(track_id);
    w.put_address(credential_asset);
    w.put_u8(current_level);
    w.put_i64(timestamp);
    sol_log_data(&[w.finish()]);
}

pub fn emit_minter_registered(
    minter: &Address,
    label: &str,
    max_xp_per_call: u64,
    max_total_xp: u64,
    timestamp: i64,
) {
    let mut buf = [0u8; 112];
    let mut w = BorshWriter::new(&mut buf);
    w.put(&EV_MINTER_REGISTERED);
    w.put_address(minter);
    w.put_str(label);
    w.put_u64(max_xp_per_call);
    w.put_u64(max_total_xp);
    w.put_i64(timestamp);
    sol_log_data(&[w.finish()]);
}

pub fn emit_minter_revoked(minter: &Address, total_xp_minted: u64, timestamp: i64) {
    let mut buf = [0u8; 64];
    let mut w = BorshWriter::new(&mut buf);
    w.put(&EV_MINTER_REVOKED);
    w.put_address(minter);
    w.put_u64(total_xp_minted);
    w.put_i64(timestamp);
    sol_log_data(&[w.finish()]);
}

pub fn emit_minter_updated(
    minter: &Address,
    max_xp_per_call: u64,
    max_total_xp: u64,
    timestamp: i64,
) {
    let mut buf = [0u8; 64];
    let mut w = BorshWriter::new(&mut buf);
    w.put(&EV_MINTER_UPDATED);
    w.put_address(minter);
    w.put_u64(max_xp_per_call);
    w.put_u64(max_total_xp);
    w.put_i64(timestamp);
    sol_log_data(&[w.finish()]);
}

/// `memo` is caller-provided instruction data with no on-chain length cap; the
/// buffer covers the physical transaction limit (an instruction can never
/// carry more than ~1,232 bytes total). Isolated frame: see module docs.
#[inline(never)]
pub fn emit_xp_rewarded(
    minter: &Address,
    recipient: &Address,
    amount: u64,
    memo: &str,
    timestamp: i64,
) {
    // 1344 = 92 (disc + minter + recipient + amount + timestamp + len prefix)
    // + 1232 (the max memo a direct transaction can carry) + margin.
    let mut buf = [0u8; 1344];
    let mut w = BorshWriter::new(&mut buf);
    w.put(&EV_XP_REWARDED);
    w.put_address(minter);
    w.put_address(recipient);
    w.put_u64(amount);
    w.put_str(memo);
    w.put_i64(timestamp);
    sol_log_data(&[w.finish()]);
}

pub fn emit_achievement_awarded(
    achievement_id: &[u8],
    recipient: &Address,
    asset: &Address,
    xp_reward: u32,
    timestamp: i64,
) {
    let mut buf = [0u8; 128];
    let mut w = BorshWriter::new(&mut buf);
    w.put(&EV_ACHIEVEMENT_AWARDED);
    w.put_str_bytes(achievement_id);
    w.put_address(recipient);
    w.put_address(asset);
    w.put_u32(xp_reward);
    w.put_i64(timestamp);
    sol_log_data(&[w.finish()]);
}

pub fn emit_achievement_type_created(
    achievement_id: &[u8],
    collection: &Address,
    creator: &Address,
    max_supply: u32,
    xp_reward: u32,
    timestamp: i64,
) {
    let mut buf = [0u8; 128];
    let mut w = BorshWriter::new(&mut buf);
    w.put(&EV_ACHIEVEMENT_TYPE_CREATED);
    w.put_str_bytes(achievement_id);
    w.put_address(collection);
    w.put_address(creator);
    w.put_u32(max_supply);
    w.put_u32(xp_reward);
    w.put_i64(timestamp);
    sol_log_data(&[w.finish()]);
}

pub fn emit_achievement_type_deactivated(achievement_id: &[u8], timestamp: i64) {
    let mut buf = [0u8; 56];
    let mut w = BorshWriter::new(&mut buf);
    w.put(&EV_ACHIEVEMENT_TYPE_DEACTIVATED);
    w.put_str_bytes(achievement_id);
    w.put_i64(timestamp);
    sol_log_data(&[w.finish()]);
}

pub fn emit_course_closed(course: &Address, course_id: &[u8], timestamp: i64) {
    let mut buf = [0u8; 96];
    let mut w = BorshWriter::new(&mut buf);
    w.put(&EV_COURSE_CLOSED);
    w.put_address(course);
    w.put_str_bytes(course_id);
    w.put_i64(timestamp);
    sol_log_data(&[w.finish()]);
}

pub fn emit_minting_pause_set(paused: bool, timestamp: i64) {
    let mut buf = [0u8; 24];
    let mut w = BorshWriter::new(&mut buf);
    w.put(&EV_MINTING_PAUSE_SET);
    w.put_bool(paused);
    w.put_i64(timestamp);
    sol_log_data(&[w.finish()]);
}
