//! `Course` — variable layout after the `course_id` string and the
//! `prerequisite` option. Both are write-once at init, so parsed offsets stay
//! valid for the account's whole lifetime.
//!
//! ```text
//! 0..8   discriminator
//! 8..12  course_id len (u32) | 12..12+n course_id bytes
//! +32    creator | +32 content_tx_id | +2 version | +32 active_lessons [u64;4]
//! +1     difficulty | +4 xp_per_lesson | +2 track_id | +1 track_level
//! +1     prerequisite tag [+32 pubkey]
//! +4     creator_reward_xp
//! +4     total_completions | +4 total_enrollments | +1 is_active
//! +8     created_at | +8 updated_at | +32 collection
//! +4     generation (u32) | +4 _reserved | +1 bump
//! ```
//!
//! `generation` is a monotonic id copied from `Config.course_nonce` at
//! creation. Enrollments record it; the mint/credential handlers reject any
//! enrollment whose stored generation no longer matches the course's, so a
//! course id recreated after `close_course` cannot inherit stale enrollments.

use pinocchio::{error::ProgramError, Address};

use super::*;
use crate::consts::COURSE_SIZE;
use crate::errors::{fw, ACCOUNT_DID_NOT_DESERIALIZE};

#[derive(Clone, Copy)]
pub struct CourseOffsets {
    id_len: u16,
    has_prereq: bool,
}

impl CourseOffsets {
    pub fn parse(data: &[u8]) -> Result<Self, ProgramError> {
        let id_len = read_str_len(data, 8)?;
        validate_utf8(data, 12, id_len)?;
        // fixed run creator..=track_level = 32+32+2+32+1+4+2+1 = 106 bytes
        // (v2: active_lessons [u64;4] replaced the v1 lesson_count u8)
        let o_prereq_tag = 12 + id_len + 106;
        if o_prereq_tag >= data.len() {
            return Err(fw(ACCOUNT_DID_NOT_DESERIALIZE));
        }
        let has_prereq = read_option_tag(data, o_prereq_tag)?;
        let this = Self {
            id_len: id_len as u16,
            has_prereq,
        };
        // trailing fixed run creator_reward_xp..=bump = 4+4+4+1+8+8+32+8+1 = 70
        // (v2: min_completions_for_reward u16 dropped)
        if this.o_creator_reward_xp() + 70 > data.len() {
            return Err(fw(ACCOUNT_DID_NOT_DESERIALIZE));
        }
        Ok(this)
    }

    #[inline(always)]
    fn o_creator(&self) -> usize {
        12 + self.id_len as usize
    }
    #[inline(always)]
    fn o_content_tx_id(&self) -> usize {
        self.o_creator() + 32
    }
    #[inline(always)]
    fn o_version(&self) -> usize {
        self.o_content_tx_id() + 32
    }
    #[inline(always)]
    fn o_active_lessons(&self) -> usize {
        self.o_version() + 2
    }
    #[inline(always)]
    fn o_difficulty(&self) -> usize {
        self.o_active_lessons() + 32
    }
    #[inline(always)]
    fn o_xp_per_lesson(&self) -> usize {
        self.o_difficulty() + 1
    }
    #[inline(always)]
    fn o_track_id(&self) -> usize {
        self.o_xp_per_lesson() + 4
    }
    #[inline(always)]
    fn o_track_level(&self) -> usize {
        self.o_track_id() + 2
    }
    #[inline(always)]
    fn o_prereq_tag(&self) -> usize {
        self.o_track_level() + 1
    }
    #[inline(always)]
    fn o_creator_reward_xp(&self) -> usize {
        self.o_prereq_tag() + 1 + if self.has_prereq { 32 } else { 0 }
    }
    #[inline(always)]
    fn o_total_completions(&self) -> usize {
        self.o_creator_reward_xp() + 4
    }
    #[inline(always)]
    fn o_total_enrollments(&self) -> usize {
        self.o_total_completions() + 4
    }
    #[inline(always)]
    fn o_is_active(&self) -> usize {
        self.o_total_enrollments() + 4
    }
    #[inline(always)]
    fn o_created_at(&self) -> usize {
        self.o_is_active() + 1
    }
    #[inline(always)]
    fn o_updated_at(&self) -> usize {
        self.o_created_at() + 8
    }
    #[inline(always)]
    fn o_collection(&self) -> usize {
        self.o_updated_at() + 8
    }
    #[inline(always)]
    fn o_generation(&self) -> usize {
        self.o_collection() + 32
    }
    #[inline(always)]
    fn o_bump(&self) -> usize {
        self.o_generation() + 4 + 4
    }

    #[inline(always)]
    pub fn course_id<'d>(&self, data: &'d [u8]) -> &'d [u8] {
        &data[12..12 + self.id_len as usize]
    }
    #[inline(always)]
    pub fn creator(&self, data: &[u8]) -> Address {
        read_address(data, self.o_creator())
    }
    #[inline(always)]
    pub fn version(&self, data: &[u8]) -> u16 {
        read_u16(data, self.o_version())
    }
    #[inline(always)]
    pub fn active_lesson_word(&self, data: &[u8], word: usize) -> u64 {
        read_u64(data, self.o_active_lessons() + word * 8)
    }
    /// True if lesson `slot` is a live lesson (its bit set in `active_lessons`).
    /// `slot: u8` spans 0..=255, mapping to a valid word/bit — no bounds check.
    #[inline(always)]
    pub fn is_active_slot(&self, data: &[u8], slot: u8) -> bool {
        let word = (slot / 64) as usize;
        let bit = slot % 64;
        (self.active_lesson_word(data, word) >> bit) & 1 == 1
    }
    /// Live lesson count = popcount of `active_lessons`. Replaces the v1
    /// `lesson_count` for XP math and the completion gate.
    #[inline(always)]
    pub fn live_lesson_count(&self, data: &[u8]) -> u32 {
        (0..4)
            .map(|w| self.active_lesson_word(data, w).count_ones())
            .sum()
    }
    #[inline(always)]
    pub fn xp_per_lesson(&self, data: &[u8]) -> u32 {
        read_u32(data, self.o_xp_per_lesson())
    }
    #[inline(always)]
    pub fn track_id(&self, data: &[u8]) -> u16 {
        read_u16(data, self.o_track_id())
    }
    #[inline(always)]
    pub fn track_level(&self, data: &[u8]) -> u8 {
        data[self.o_track_level()]
    }
    #[inline(always)]
    pub fn prerequisite(&self, data: &[u8]) -> Option<Address> {
        if self.has_prereq {
            Some(read_address(data, self.o_prereq_tag() + 1))
        } else {
            None
        }
    }
    #[inline(always)]
    pub fn creator_reward_xp(&self, data: &[u8]) -> u32 {
        read_u32(data, self.o_creator_reward_xp())
    }
    #[inline(always)]
    pub fn total_completions(&self, data: &[u8]) -> u32 {
        read_u32(data, self.o_total_completions())
    }
    #[inline(always)]
    pub fn total_enrollments(&self, data: &[u8]) -> u32 {
        read_u32(data, self.o_total_enrollments())
    }
    #[inline(always)]
    pub fn is_active(&self, data: &[u8]) -> bool {
        data[self.o_is_active()] == 1
    }
    #[inline(always)]
    pub fn collection(&self, data: &[u8]) -> Address {
        read_address(data, self.o_collection())
    }
    #[inline(always)]
    pub fn generation(&self, data: &[u8]) -> u32 {
        read_u32(data, self.o_generation())
    }
    #[inline(always)]
    pub fn bump(&self, data: &[u8]) -> u8 {
        data[self.o_bump()]
    }

    #[inline(always)]
    pub fn set_content_tx_id(&self, data: &mut [u8], value: &[u8; 32]) {
        let o = self.o_content_tx_id();
        data[o..o + 32].copy_from_slice(value);
    }
    #[inline(always)]
    pub fn set_version(&self, data: &mut [u8], value: u16) {
        let o = self.o_version();
        data[o..o + 2].copy_from_slice(&value.to_le_bytes());
    }
    #[inline(always)]
    pub fn set_xp_per_lesson(&self, data: &mut [u8], value: u32) {
        let o = self.o_xp_per_lesson();
        data[o..o + 4].copy_from_slice(&value.to_le_bytes());
    }
    #[inline(always)]
    pub fn set_creator_reward_xp(&self, data: &mut [u8], value: u32) {
        let o = self.o_creator_reward_xp();
        data[o..o + 4].copy_from_slice(&value.to_le_bytes());
    }
    #[inline(always)]
    pub fn set_active_lessons(&self, data: &mut [u8], value: &[u64; 4]) {
        let o = self.o_active_lessons();
        for (w, word) in value.iter().enumerate() {
            data[o + w * 8..o + w * 8 + 8].copy_from_slice(&word.to_le_bytes());
        }
    }
    #[inline(always)]
    pub fn set_total_completions(&self, data: &mut [u8], value: u32) {
        let o = self.o_total_completions();
        data[o..o + 4].copy_from_slice(&value.to_le_bytes());
    }
    #[inline(always)]
    pub fn set_total_enrollments(&self, data: &mut [u8], value: u32) {
        let o = self.o_total_enrollments();
        data[o..o + 4].copy_from_slice(&value.to_le_bytes());
    }
    #[inline(always)]
    pub fn set_is_active(&self, data: &mut [u8], value: bool) {
        data[self.o_is_active()] = value as u8;
    }
    #[inline(always)]
    pub fn set_updated_at(&self, data: &mut [u8], value: i64) {
        let o = self.o_updated_at();
        data[o..o + 8].copy_from_slice(&value.to_le_bytes());
    }
    #[inline(always)]
    pub fn set_collection(&self, data: &mut [u8], value: &Address) {
        write_address(data, self.o_collection(), value);
    }
}

/// Dense mask for a course's initial `lesson_count` lessons: bits
/// `0..lesson_count` set. New courses are always dense; slots are retired later
/// via `update_course(new_active_lessons)`, never at creation. `lesson_count` is
/// u8 (<= 255), so `i` maps to a valid word (0..=3) / bit (0..=63).
pub fn dense_mask(lesson_count: u8) -> [u64; 4] {
    let mut mask = [0u64; 4];
    for i in 0..lesson_count {
        let word = (i / 64) as usize;
        let bit = i % 64;
        mask[word] |= 1u64 << bit;
    }
    mask
}

pub struct InitCourse<'a> {
    pub course_id: &'a [u8],
    pub creator: &'a Address,
    pub content_tx_id: &'a [u8; 32],
    pub active_lessons: [u64; 4],
    pub difficulty: u8,
    pub xp_per_lesson: u32,
    pub track_id: u16,
    pub track_level: u8,
    pub prerequisite: Option<&'a Address>,
    pub creator_reward_xp: u32,
    pub collection: &'a Address,
    pub generation: u32,
    pub now: i64,
    pub bump: u8,
}

/// Writes a fresh `Course` (version=1, counters=0, is_active=true) into a
/// zeroed account buffer, matching Anchor's create_course serialization.
pub fn init(data: &mut [u8], p: &InitCourse) -> CourseOffsets {
    debug_assert_eq!(data.len(), COURSE_SIZE);
    data[0..8].copy_from_slice(&crate::consts::ACC_COURSE);
    data[8..12].copy_from_slice(&(p.course_id.len() as u32).to_le_bytes());
    data[12..12 + p.course_id.len()].copy_from_slice(p.course_id);

    let off = CourseOffsets {
        id_len: p.course_id.len() as u16,
        has_prereq: p.prerequisite.is_some(),
    };
    write_address(data, off.o_creator(), p.creator);
    data[off.o_content_tx_id()..off.o_content_tx_id() + 32].copy_from_slice(p.content_tx_id);
    off.set_version(data, 1);
    off.set_active_lessons(data, &p.active_lessons);
    data[off.o_difficulty()] = p.difficulty;
    off.set_xp_per_lesson(data, p.xp_per_lesson);
    data[off.o_track_id()..off.o_track_id() + 2].copy_from_slice(&p.track_id.to_le_bytes());
    data[off.o_track_level()] = p.track_level;
    if let Some(prereq) = p.prerequisite {
        data[off.o_prereq_tag()] = 1;
        write_address(data, off.o_prereq_tag() + 1, prereq);
    }
    off.set_creator_reward_xp(data, p.creator_reward_xp);
    // total_completions / total_enrollments stay zero
    off.set_is_active(data, true);
    let o = off.o_created_at();
    data[o..o + 8].copy_from_slice(&p.now.to_le_bytes());
    off.set_updated_at(data, p.now);
    off.set_collection(data, p.collection);
    let o_gen = off.o_generation();
    data[o_gen..o_gen + 4].copy_from_slice(&p.generation.to_le_bytes());
    // _reserved stays zero
    data[off.o_bump()] = p.bump;
    off
}
