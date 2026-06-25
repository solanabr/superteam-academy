use crate::helpers::*;
use anchor_lang::solana_program::hash::hash;
use anchor_lang::Discriminator;
use onchain_academy::state::Course;
use solana_sdk::pubkey::Pubkey;

#[test]
fn course_discriminator_is_eight_bytes() {
    // close_course reads the first 8 bytes of a stale (pre-resize) account and
    // compares them to this constant, so it must be exactly 8 bytes.
    assert_eq!(Course::DISCRIMINATOR.len(), 8);
}

#[test]
fn course_discriminator_matches_account_name_hash() {
    // The discriminator is sha256("account:Course")[..8] — derived from the
    // account name, not the byte layout. It is therefore identical for the
    // legacy 192-byte account and the resized account, which is the invariant
    // the defensive discriminator check in close_course relies on.
    let h = hash(b"account:Course");
    assert_eq!(Course::DISCRIMINATOR, &h.to_bytes()[..8]);
}

#[test]
fn close_course_uses_same_pda_seeds_as_create() {
    // The close instruction must target the identical PDA that create_course
    // allocated for a given course_id; otherwise stale accounts can't be freed.
    let course_id = "close-course-mig";
    let (pda, bump) = course_pda(course_id);
    let derived =
        Pubkey::create_program_address(&[b"course", course_id.as_bytes(), &[bump]], &PROGRAM_ID);
    assert!(derived.is_ok());
    assert_eq!(derived.unwrap(), pda);
}

#[test]
fn different_course_ids_close_distinct_pdas() {
    let (a, _) = course_pda("course-a");
    let (b, _) = course_pda("course-b");
    assert_ne!(a, b);
}
