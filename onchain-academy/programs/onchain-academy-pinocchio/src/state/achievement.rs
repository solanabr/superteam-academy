//! `AchievementType` (three write-once strings) and `AchievementReceipt`
//! (fixed thin PDA for double-award prevention).
//!
//! AchievementType:
//! ```text
//! 0..8 discriminator
//! +4+n achievement_id | +4+n name | +4+n metadata_uri
//! +32  collection | +32 creator
//! +4   max_supply | +4 current_supply | +4 xp_reward | +1 is_active
//! +8   created_at | +8 _reserved | +1 bump
//! ```
//! AchievementReceipt: `8 disc | 32 asset | 8 awarded_at | 1 bump`

use pinocchio::{error::ProgramError, Address};

use super::*;
use crate::consts::{
    ACC_ACHIEVEMENT_RECEIPT, ACC_ACHIEVEMENT_TYPE, ACHIEVEMENT_RECEIPT_SIZE, ACHIEVEMENT_TYPE_SIZE,
};
use crate::errors::{fw, ACCOUNT_DID_NOT_DESERIALIZE};

#[derive(Clone, Copy)]
pub struct AchievementTypeOffsets {
    id_len: u16,
    name_len: u16,
    uri_len: u16,
}

impl AchievementTypeOffsets {
    pub fn parse(data: &[u8]) -> Result<Self, ProgramError> {
        let id_len = read_str_len(data, 8)?;
        validate_utf8(data, 12, id_len)?;
        let o_name = 12 + id_len;
        let name_len = read_str_len(data, o_name)?;
        validate_utf8(data, o_name + 4, name_len)?;
        let o_uri = o_name + 4 + name_len;
        let uri_len = read_str_len(data, o_uri)?;
        validate_utf8(data, o_uri + 4, uri_len)?;
        let this = Self {
            id_len: id_len as u16,
            name_len: name_len as u16,
            uri_len: uri_len as u16,
        };
        // trailing fixed run = 32+32+4+4+4+1+8+8+1 = 94 bytes
        if this.o_collection() + 94 > data.len() {
            return Err(fw(ACCOUNT_DID_NOT_DESERIALIZE));
        }
        Ok(this)
    }

    #[inline(always)]
    fn o_name(&self) -> usize {
        12 + self.id_len as usize
    }
    #[inline(always)]
    fn o_uri(&self) -> usize {
        self.o_name() + 4 + self.name_len as usize
    }
    #[inline(always)]
    fn o_collection(&self) -> usize {
        self.o_uri() + 4 + self.uri_len as usize
    }
    #[inline(always)]
    fn o_creator(&self) -> usize {
        self.o_collection() + 32
    }
    #[inline(always)]
    fn o_max_supply(&self) -> usize {
        self.o_creator() + 32
    }
    #[inline(always)]
    fn o_current_supply(&self) -> usize {
        self.o_max_supply() + 4
    }
    #[inline(always)]
    fn o_xp_reward(&self) -> usize {
        self.o_current_supply() + 4
    }
    #[inline(always)]
    fn o_is_active(&self) -> usize {
        self.o_xp_reward() + 4
    }
    #[inline(always)]
    fn o_created_at(&self) -> usize {
        self.o_is_active() + 1
    }
    #[inline(always)]
    fn o_bump(&self) -> usize {
        self.o_created_at() + 8 + 8
    }

    #[inline(always)]
    pub fn achievement_id<'d>(&self, data: &'d [u8]) -> &'d [u8] {
        &data[12..12 + self.id_len as usize]
    }
    #[inline(always)]
    pub fn name<'d>(&self, data: &'d [u8]) -> &'d [u8] {
        let o = self.o_name() + 4;
        &data[o..o + self.name_len as usize]
    }
    #[inline(always)]
    pub fn metadata_uri<'d>(&self, data: &'d [u8]) -> &'d [u8] {
        let o = self.o_uri() + 4;
        &data[o..o + self.uri_len as usize]
    }
    #[inline(always)]
    pub fn collection(&self, data: &[u8]) -> Address {
        read_address(data, self.o_collection())
    }
    #[inline(always)]
    pub fn max_supply(&self, data: &[u8]) -> u32 {
        read_u32(data, self.o_max_supply())
    }
    #[inline(always)]
    pub fn current_supply(&self, data: &[u8]) -> u32 {
        read_u32(data, self.o_current_supply())
    }
    #[inline(always)]
    pub fn xp_reward(&self, data: &[u8]) -> u32 {
        read_u32(data, self.o_xp_reward())
    }
    #[inline(always)]
    pub fn is_active(&self, data: &[u8]) -> bool {
        data[self.o_is_active()] == 1
    }
    #[inline(always)]
    pub fn bump(&self, data: &[u8]) -> u8 {
        data[self.o_bump()]
    }

    #[inline(always)]
    pub fn set_current_supply(&self, data: &mut [u8], value: u32) {
        let o = self.o_current_supply();
        data[o..o + 4].copy_from_slice(&value.to_le_bytes());
    }
    #[inline(always)]
    pub fn set_is_active(&self, data: &mut [u8], value: bool) {
        data[self.o_is_active()] = value as u8;
    }
}

pub struct InitAchievementType<'a> {
    pub achievement_id: &'a [u8],
    pub name: &'a [u8],
    pub metadata_uri: &'a [u8],
    pub collection: &'a Address,
    pub creator: &'a Address,
    pub max_supply: u32,
    pub xp_reward: u32,
    pub now: i64,
    pub bump: u8,
}

/// Writes a fresh `AchievementType` (current_supply=0, is_active=true) into a
/// zeroed account buffer.
pub fn init_achievement_type(data: &mut [u8], p: &InitAchievementType) {
    debug_assert_eq!(data.len(), ACHIEVEMENT_TYPE_SIZE);
    data[0..8].copy_from_slice(&ACC_ACHIEVEMENT_TYPE);
    let mut o = 8;
    for s in [p.achievement_id, p.name, p.metadata_uri] {
        data[o..o + 4].copy_from_slice(&(s.len() as u32).to_le_bytes());
        o += 4;
        data[o..o + s.len()].copy_from_slice(s);
        o += s.len();
    }
    write_address(data, o, p.collection);
    o += 32;
    write_address(data, o, p.creator);
    o += 32;
    data[o..o + 4].copy_from_slice(&p.max_supply.to_le_bytes());
    o += 4;
    // current_supply stays zero
    o += 4;
    data[o..o + 4].copy_from_slice(&p.xp_reward.to_le_bytes());
    o += 4;
    data[o] = 1; // is_active
    o += 1;
    data[o..o + 8].copy_from_slice(&p.now.to_le_bytes());
    o += 8;
    // _reserved stays zero
    o += 8;
    data[o] = p.bump;
}

const O_RECEIPT_ASSET: usize = 8;
const O_RECEIPT_AWARDED_AT: usize = 40;
const O_RECEIPT_BUMP: usize = 48;

/// Writes a fresh `AchievementReceipt` into a zeroed account buffer.
pub fn init_receipt(data: &mut [u8], asset: &Address, awarded_at: i64, bump: u8) {
    debug_assert_eq!(data.len(), ACHIEVEMENT_RECEIPT_SIZE);
    data[0..8].copy_from_slice(&ACC_ACHIEVEMENT_RECEIPT);
    write_address(data, O_RECEIPT_ASSET, asset);
    data[O_RECEIPT_AWARDED_AT..O_RECEIPT_AWARDED_AT + 8].copy_from_slice(&awarded_at.to_le_bytes());
    data[O_RECEIPT_BUMP] = bump;
}
