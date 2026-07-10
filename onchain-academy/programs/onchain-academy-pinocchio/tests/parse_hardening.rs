//! Regression tests for audit findings F-B (u16 length truncation) and F-C
//! (missing UTF-8 validation) in the zero-copy state parsers. Each corrupt
//! account is one Anchor `Account<T>::try_from` would reject with
//! AccountDidNotDeserialize (3003); the parsers must now reject it too.

use onchain_academy_pinocchio::consts::{ACC_ACHIEVEMENT_TYPE, ACC_COURSE, ACC_MINTER_ROLE};
use onchain_academy_pinocchio::state::{achievement, course, minter_role};

fn minter_role_with_label_len(label_len: u32, label_bytes: &[u8]) -> Vec<u8> {
    let mut d = vec![0u8; 110];
    d[0..8].copy_from_slice(&ACC_MINTER_ROLE);
    d[40..44].copy_from_slice(&label_len.to_le_bytes());
    d[44..44 + label_bytes.len()].copy_from_slice(label_bytes);
    d
}

#[test]
fn minter_role_rejects_truncating_length() {
    // F-B: 65536 truncates to 0 as u16; must be rejected (overruns the account).
    let d = minter_role_with_label_len(65536, &[]);
    assert!(minter_role::MinterRoleOffsets::parse(&d).is_err());
    // A length that merely overruns the 110-byte account is also rejected.
    let d = minter_role_with_label_len(200, &[]);
    assert!(minter_role::MinterRoleOffsets::parse(&d).is_err());
}

#[test]
fn minter_role_rejects_invalid_utf8() {
    // F-C: label bytes 0xFF 0xFF are not valid UTF-8.
    let d = minter_role_with_label_len(2, &[0xFF, 0xFF]);
    assert!(minter_role::MinterRoleOffsets::parse(&d).is_err());
}

#[test]
fn minter_role_accepts_valid() {
    let d = minter_role_with_label_len(7, b"backend");
    assert!(minter_role::MinterRoleOffsets::parse(&d).is_ok());
    // Empty label is valid.
    let d = minter_role_with_label_len(0, &[]);
    assert!(minter_role::MinterRoleOffsets::parse(&d).is_ok());
}

#[test]
fn course_rejects_truncating_and_invalid_utf8() {
    let mut d = vec![0u8; 224];
    d[0..8].copy_from_slice(&ACC_COURSE);
    // truncating course_id length
    d[8..12].copy_from_slice(&65536u32.to_le_bytes());
    assert!(course::CourseOffsets::parse(&d).is_err());
    // invalid UTF-8 course_id
    let mut d = vec![0u8; 224];
    d[0..8].copy_from_slice(&ACC_COURSE);
    d[8..12].copy_from_slice(&2u32.to_le_bytes());
    d[12] = 0xFF;
    d[13] = 0xFF;
    assert!(course::CourseOffsets::parse(&d).is_err());
}

#[test]
fn achievement_rejects_truncating_and_invalid_utf8() {
    // truncating uri length (the last string — the one previously unchecked)
    let mut d = vec![0u8; 338];
    d[0..8].copy_from_slice(&ACC_ACHIEVEMENT_TYPE);
    d[8..12].copy_from_slice(&2u32.to_le_bytes()); // id_len
    d[12..14].copy_from_slice(b"id");
    d[14..18].copy_from_slice(&2u32.to_le_bytes()); // name_len
    d[18..20].copy_from_slice(b"nm");
    d[20..24].copy_from_slice(&65536u32.to_le_bytes()); // uri_len — truncates to 0 as u16
    assert!(achievement::AchievementTypeOffsets::parse(&d).is_err());
    // invalid UTF-8 in the name string
    let mut d = vec![0u8; 338];
    d[0..8].copy_from_slice(&ACC_ACHIEVEMENT_TYPE);
    d[8..12].copy_from_slice(&1u32.to_le_bytes());
    d[12] = b'a';
    d[13..17].copy_from_slice(&2u32.to_le_bytes());
    d[17] = 0xFF;
    d[18] = 0xFE;
    d[19..23].copy_from_slice(&3u32.to_le_bytes());
    d[23..26].copy_from_slice(b"uri");
    assert!(achievement::AchievementTypeOffsets::parse(&d).is_err());
}
