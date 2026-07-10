//! Gate 1b — account byte-layout, asserted STRUCTURALLY against the documented
//! offset map (see each `src/state/*.rs` module doc-comment) rather than against
//! the deleted Anchor crate's `try_serialize`. For every state account and every
//! mutation the program performs, we drive the pinocchio init/setter and check:
//!   * the 8-byte discriminator at `[0..8]`,
//!   * each field at its known byte offset (raw LE decode) AND via the public
//!     reader (accessor + raw offset must agree),
//!   * the fixed allocation is zero-padded where the layout reserves bytes,
//!   * the post-Anchor fields land correctly: Config `course_nonce`,
//!     Course `generation`, Enrollment `course_gen` — the last of which must
//!     SURVIVE both Enrollment grow transitions (the fix this gate guards).

use onchain_academy_pinocchio::consts as c;
use onchain_academy_pinocchio::state as pstate;
use pinocchio::Address;
use solana_program::pubkey::Pubkey;

fn addr(p: Pubkey) -> Address {
    Address::new_from_array(p.to_bytes())
}

// Integration tests only see the crate's public API, so re-implement the tiny
// LE decoders used to check raw byte offsets.
fn rd_u32(d: &[u8], o: usize) -> u32 {
    u32::from_le_bytes(d[o..o + 4].try_into().unwrap())
}
fn rd_u64(d: &[u8], o: usize) -> u64 {
    u64::from_le_bytes(d[o..o + 8].try_into().unwrap())
}
fn rd_i64(d: &[u8], o: usize) -> i64 {
    rd_u64(d, o) as i64
}
fn rd_addr(d: &[u8], o: usize) -> [u8; 32] {
    d[o..o + 32].try_into().unwrap()
}

#[test]
fn config_layout() {
    // 0..8 disc | 8..40 authority | 40..72 backend | 72..104 xp_mint
    // 104 paused | 105..109 course_nonce | 109..112 reserved | 112 bump
    let authority = Pubkey::new_unique();
    let backend = Pubkey::new_unique();
    let mint = Pubkey::new_unique();

    let mut d = vec![0u8; c::CONFIG_SIZE];
    pstate::config::init(&mut d, &addr(authority), &addr(backend), &addr(mint), 254);

    assert_eq!(&d[0..8], &c::ACC_CONFIG[..], "discriminator");
    assert_eq!(rd_addr(&d, 8), authority.to_bytes(), "authority @8");
    assert_eq!(rd_addr(&d, 40), backend.to_bytes(), "backend @40");
    assert_eq!(rd_addr(&d, 72), mint.to_bytes(), "xp_mint @72");
    assert_eq!(d[104], 0, "paused @104 = false");
    assert_eq!(rd_u32(&d, 105), 0, "course_nonce @105 starts 0");
    assert_eq!(&d[109..112], &[0u8; 3], "reserved @109 zero");
    assert_eq!(d[112], 254, "bump @112");
    // readers agree with the raw offsets.
    assert_eq!(
        pstate::config::authority(&d).as_array(),
        &authority.to_bytes()
    );
    assert_eq!(
        pstate::config::backend_signer(&d).as_array(),
        &backend.to_bytes()
    );
    assert_eq!(pstate::config::xp_mint(&d).as_array(), &mint.to_bytes());
    assert!(!pstate::config::paused(&d));
    assert_eq!(pstate::config::course_nonce(&d), 0);

    // Mutations: pause, rotate backend, rotate authority, bump course_nonce.
    let new_backend = Pubkey::new_unique();
    let new_authority = Pubkey::new_unique();
    pstate::config::set_paused(&mut d, true);
    pstate::config::set_backend_signer(&mut d, &addr(new_backend));
    pstate::config::set_authority(&mut d, &addr(new_authority));
    pstate::config::set_course_nonce(&mut d, 0x0102_0304);

    assert_eq!(
        rd_addr(&d, 8),
        new_authority.to_bytes(),
        "authority rotated"
    );
    assert_eq!(rd_addr(&d, 40), new_backend.to_bytes(), "backend rotated");
    assert_eq!(rd_addr(&d, 72), mint.to_bytes(), "xp_mint untouched");
    assert_eq!(d[104], 1, "paused = true");
    assert_eq!(rd_u32(&d, 105), 0x0102_0304, "course_nonce raw @105");
    assert_eq!(&d[109..112], &[0u8; 3], "reserved stays zero");
    assert_eq!(d[112], 254, "bump untouched");
    // The new field round-trips through its accessor.
    assert_eq!(pstate::config::course_nonce(&d), 0x0102_0304);
    assert_eq!(
        pstate::config::authority(&d).as_array(),
        &new_authority.to_bytes()
    );
    assert_eq!(
        pstate::config::backend_signer(&d).as_array(),
        &new_backend.to_bytes()
    );
    assert!(pstate::config::paused(&d));
}

fn course_case(course_id: &str, prerequisite: Option<Pubkey>) {
    let creator = Pubkey::new_unique();
    let collection = Pubkey::new_unique();
    let content = [7u8; 32];
    let generation = 0x00AB_CDEFu32;

    let mut d = vec![0u8; c::COURSE_SIZE];
    let prereq_addr = prerequisite.map(addr);
    let off = pstate::course::init(
        &mut d,
        &pstate::course::InitCourse {
            course_id: course_id.as_bytes(),
            creator: &addr(creator),
            content_tx_id: &content,
            lesson_count: 12,
            difficulty: 2,
            xp_per_lesson: 50,
            track_id: 3,
            track_level: 1,
            prerequisite: prereq_addr.as_ref(),
            creator_reward_xp: 250,
            min_completions_for_reward: 10,
            collection: &addr(collection),
            generation,
            now: 1_700_000_000,
            bump: 253,
        },
    );

    // Discriminator + Borsh string header, then read every field via the parser.
    assert_eq!(&d[0..8], &c::ACC_COURSE[..], "discriminator");
    assert_eq!(rd_u32(&d, 8) as usize, course_id.len(), "id_len header @8");
    assert_eq!(
        &d[12..12 + course_id.len()],
        course_id.as_bytes(),
        "id bytes"
    );

    let parsed = pstate::course::CourseOffsets::parse(&d).unwrap();
    assert_eq!(parsed.course_id(&d), course_id.as_bytes());
    assert_eq!(parsed.creator(&d).as_array(), &creator.to_bytes());
    assert_eq!(parsed.version(&d), 1, "init version = 1");
    assert_eq!(parsed.lesson_count(&d), 12);
    assert_eq!(parsed.xp_per_lesson(&d), 50);
    assert_eq!(parsed.track_id(&d), 3);
    assert_eq!(parsed.track_level(&d), 1);
    assert_eq!(
        parsed.prerequisite(&d).map(|a| *a.as_array()),
        prerequisite.map(|p| p.to_bytes())
    );
    assert_eq!(parsed.creator_reward_xp(&d), 250);
    assert_eq!(parsed.min_completions_for_reward(&d), 10);
    assert_eq!(parsed.total_completions(&d), 0, "init counters = 0");
    assert_eq!(parsed.total_enrollments(&d), 0);
    assert!(parsed.is_active(&d), "init is_active = true");
    assert_eq!(parsed.collection(&d).as_array(), &collection.to_bytes());
    // New field: generation lands right after collection (o_collection + 32).
    // o_collection = 12 + id_len + prereq + [creator..collection fixed run].
    // Fixed run creator..=updated_at (exclusive of collection) after the id:
    //   creator..=track_level = 75, prereq_tag = 1, then
    //   creator_reward_xp..=updated_at = 4+2+4+4+1+8+8 = 31  →  107 total.
    let prereq_bytes = if prerequisite.is_some() { 32 } else { 0 };
    let o_collection = 12 + course_id.len() + 107 + prereq_bytes;
    let o_generation = o_collection + 32;
    // Pin the hand-computed offset to the reader: collection at o_collection.
    assert_eq!(
        rd_addr(&d, o_collection),
        collection.to_bytes(),
        "collection raw offset"
    );
    assert_eq!(parsed.generation(&d), generation, "generation reader");
    assert_eq!(
        rd_u32(&d, o_generation),
        generation,
        "generation raw offset"
    );
    assert_eq!(
        &d[o_generation + 4..o_generation + 8],
        &[0u8; 4],
        "reserved zero"
    );
    assert_eq!(parsed.bump(&d), 253);
    assert_eq!(d[o_generation + 8], 253, "bump raw @generation+8");

    // Every mutation update_course/enroll/finalize_course performs.
    let new_content = [9u8; 32];
    let new_collection = Pubkey::new_unique();
    off.set_content_tx_id(&mut d, &new_content);
    off.set_version(&mut d, 2);
    off.set_xp_per_lesson(&mut d, 75);
    off.set_creator_reward_xp(&mut d, 300);
    off.set_min_completions_for_reward(&mut d, 5);
    off.set_is_active(&mut d, false);
    off.set_updated_at(&mut d, 1_800_000_000);
    off.set_collection(&mut d, &addr(new_collection));
    off.set_total_enrollments(&mut d, 41);
    off.set_total_completions(&mut d, 17);

    let parsed = pstate::course::CourseOffsets::parse(&d).unwrap();
    assert_eq!(parsed.course_id(&d), course_id.as_bytes(), "id write-once");
    assert_eq!(parsed.creator(&d).as_array(), &creator.to_bytes());
    assert_eq!(parsed.version(&d), 2);
    assert_eq!(parsed.xp_per_lesson(&d), 75);
    assert_eq!(parsed.creator_reward_xp(&d), 300);
    assert_eq!(parsed.min_completions_for_reward(&d), 5);
    assert_eq!(parsed.total_completions(&d), 17);
    assert_eq!(parsed.total_enrollments(&d), 41);
    assert!(!parsed.is_active(&d));
    assert_eq!(parsed.collection(&d).as_array(), &new_collection.to_bytes());
    assert_eq!(parsed.bump(&d), 253);
    // generation is not touched by any setter — it must survive every mutation.
    assert_eq!(
        parsed.generation(&d),
        generation,
        "generation survives mutations"
    );
    assert_eq!(
        rd_u32(&d, o_generation),
        generation,
        "generation raw survives"
    );
}

#[test]
fn course_layout() {
    course_case("x", None);
    course_case("rust-fundamentals", Some(Pubkey::new_unique()));
    course_case(&"c".repeat(32), Some(Pubkey::new_unique()));
}

#[test]
fn enrollment_layout_and_grow_transitions() {
    // Fresh (both options None): 0..8 disc | 8..40 course | 40..48 enrolled_at
    // | 48 completed_tag(0) | 49..81 flags | 81 cred_tag(0) | 82..86 course_gen
    // | 86 bump
    let course = Pubkey::new_unique();
    let asset = Pubkey::new_unique();
    let course_gen = 0x1122_3344u32;

    let mut d = vec![0u8; c::ENROLLMENT_SIZE];
    pstate::enrollment::init(&mut d, &addr(course), 1_700_000_100, course_gen, 252);

    assert_eq!(&d[0..8], &c::ACC_ENROLLMENT[..], "discriminator");
    assert_eq!(rd_addr(&d, 8), course.to_bytes(), "course @8");
    assert_eq!(rd_i64(&d, 40), 1_700_000_100, "enrolled_at @40");
    assert_eq!(d[48], 0, "completed_tag @48 = None");
    assert_eq!(&d[49..81], &[0u8; 32], "flags @49 empty");
    assert_eq!(d[81], 0, "cred_tag @81 = None");
    assert_eq!(rd_u32(&d, 82), course_gen, "course_gen @82");
    assert_eq!(d[86], 252, "bump @86");

    let mut off = pstate::enrollment::EnrollmentOffsets::parse(&d).unwrap();
    assert_eq!(off.course(&d).as_array(), &course.to_bytes());
    assert_eq!(off.enrolled_at(&d), 1_700_000_100);
    assert_eq!(off.completed_at(&d), None);
    assert_eq!(off.credential_asset(&d), None);
    assert_eq!(off.course_gen(&d), course_gen);
    assert_eq!(off.bump(&d), 252);
    assert_eq!(off.completed_lessons(&d), 0);

    // Lesson bitmap writes (incl. boundary words/bits).
    let mut expected = [0u64; 4];
    for lesson in [0u8, 63, 64, 200, 255] {
        let word = (lesson / 64) as usize;
        let mask = 1u64 << (lesson % 64);
        expected[word] |= mask;
        let val = off.lesson_flag_word(&d, word) | mask;
        off.set_lesson_flag_word(&mut d, word, val);
    }
    for (w, ew) in expected.iter().enumerate() {
        assert_eq!(off.lesson_flag_word(&d, w), *ew, "bitmap word {w}");
        assert_eq!(rd_u64(&d, 49 + w * 8), *ew, "bitmap raw word {w}");
    }
    assert_eq!(off.completed_lessons(&d), 5);
    // course_gen unaffected by bitmap writes.
    assert_eq!(off.course_gen(&d), course_gen, "course_gen after bitmap");

    // Grow transition 1: completed_at None -> Some (finalize_course). Inserts 8
    // bytes at offset 49; course_gen rides the tail-shift and must be preserved.
    off.set_completed_at(&mut d, 1_700_500_000);
    assert_eq!(d[48], 1, "completed_tag now Some");
    assert_eq!(rd_i64(&d, 49), 1_700_500_000, "completed_at @49");
    assert_eq!(off.completed_at(&d), Some(1_700_500_000));
    assert_eq!(
        off.course_gen(&d),
        course_gen,
        "course_gen survives completed grow"
    );
    // flags shifted right by 8; verify they moved intact.
    for (w, ew) in expected.iter().enumerate() {
        assert_eq!(
            off.lesson_flag_word(&d, w),
            *ew,
            "flags after completed grow, word {w}"
        );
    }

    // Grow transition 2: credential_asset None -> Some (issue_credential).
    // Inserts 32 bytes before course_gen; the setter re-plants course_gen (the
    // pre-course_gen version zeroed this word) — THIS is the fix under test.
    off.set_credential_asset(&mut d, &addr(asset));
    assert_eq!(
        off.credential_asset(&d).map(|a| *a.as_array()),
        Some(asset.to_bytes())
    );
    assert_eq!(
        off.course_gen(&d),
        course_gen,
        "course_gen survives credential grow"
    );
    assert_eq!(off.bump(&d), 252, "bump survives credential grow");

    // Readers on the final grown state.
    let parsed = pstate::enrollment::EnrollmentOffsets::parse(&d).unwrap();
    assert_eq!(parsed.course(&d).as_array(), &course.to_bytes());
    assert_eq!(parsed.enrolled_at(&d), 1_700_000_100);
    assert_eq!(parsed.completed_at(&d), Some(1_700_500_000));
    assert_eq!(
        parsed.credential_asset(&d).map(|a| *a.as_array()),
        Some(asset.to_bytes())
    );
    assert_eq!(parsed.course_gen(&d), course_gen);
    assert_eq!(parsed.bump(&d), 252);
    assert_eq!(parsed.completed_lessons(&d), 5);
}

#[test]
fn enrollment_credential_before_completed() {
    // Not a path the program takes (issue requires completion) but the setter
    // must stay layout-correct regardless of option order — and course_gen must
    // still survive the credential grow when completed_at is still None.
    let course = Pubkey::new_unique();
    let asset = Pubkey::new_unique();
    let course_gen = 0xDEAD_BEEFu32;

    let mut d = vec![0u8; c::ENROLLMENT_SIZE];
    pstate::enrollment::init(&mut d, &addr(course), 42, course_gen, 9);
    let mut off = pstate::enrollment::EnrollmentOffsets::parse(&d).unwrap();
    off.set_lesson_flag_word(&mut d, 0, u64::MAX);
    off.set_lesson_flag_word(&mut d, 2, 3);

    off.set_credential_asset(&mut d, &addr(asset));
    assert_eq!(
        off.credential_asset(&d).map(|a| *a.as_array()),
        Some(asset.to_bytes())
    );
    assert_eq!(off.completed_at(&d), None, "completed still None");
    assert_eq!(
        off.course_gen(&d),
        course_gen,
        "course_gen survives cred-first grow"
    );
    assert_eq!(off.lesson_flag_word(&d, 0), u64::MAX);
    assert_eq!(off.lesson_flag_word(&d, 2), 3);
    assert_eq!(off.bump(&d), 9);

    off.set_completed_at(&mut d, 77);
    let parsed = pstate::enrollment::EnrollmentOffsets::parse(&d).unwrap();
    assert_eq!(parsed.completed_at(&d), Some(77));
    assert_eq!(
        parsed.credential_asset(&d).map(|a| *a.as_array()),
        Some(asset.to_bytes())
    );
    assert_eq!(
        parsed.course_gen(&d),
        course_gen,
        "course_gen survives both grows (cred-first)"
    );
    assert_eq!(parsed.lesson_flag_word(&d, 0), u64::MAX);
    assert_eq!(parsed.lesson_flag_word(&d, 2), 3);
    assert_eq!(parsed.bump(&d), 9);
}

fn minter_role_case(label: &str) {
    // 0..8 disc | 8..40 minter | 40..44 label_len | 44..44+n label | then
    // max_xp_per_call | total_xp_minted | is_active | created_at | max_total_xp
    // | bump.
    let minter = Pubkey::new_unique();

    let mut d = vec![0u8; c::MINTER_ROLE_SIZE];
    let off = pstate::minter_role::init(
        &mut d,
        &addr(minter),
        label.as_bytes(),
        500,
        100_000,
        1_690_000_000,
        251,
    );

    assert_eq!(&d[0..8], &c::ACC_MINTER_ROLE[..], "discriminator");
    assert_eq!(rd_addr(&d, 8), minter.to_bytes(), "minter @8");
    assert_eq!(rd_u32(&d, 40) as usize, label.len(), "label_len @40");
    assert_eq!(&d[44..44 + label.len()], label.as_bytes(), "label bytes");

    let parsed = pstate::minter_role::MinterRoleOffsets::parse(&d).unwrap();
    assert_eq!(parsed.minter(&d).as_array(), &minter.to_bytes());
    assert_eq!(parsed.max_xp_per_call(&d), 500);
    assert_eq!(parsed.total_xp_minted(&d), 0, "init total = 0");
    assert!(parsed.is_active(&d), "init is_active = true");
    assert_eq!(parsed.max_total_xp(&d), 100_000);
    assert_eq!(parsed.bump(&d), 251);

    off.set_total_xp_minted(&mut d, 4_999);
    off.set_is_active(&mut d, false);
    off.set_max_xp_per_call(&mut d, 0);
    off.set_max_total_xp(&mut d, 0);

    let parsed = pstate::minter_role::MinterRoleOffsets::parse(&d).unwrap();
    assert_eq!(parsed.minter(&d).as_array(), &minter.to_bytes());
    assert_eq!(parsed.total_xp_minted(&d), 4_999);
    assert!(!parsed.is_active(&d));
    assert_eq!(parsed.max_xp_per_call(&d), 0);
    assert_eq!(parsed.max_total_xp(&d), 0);
    assert_eq!(parsed.bump(&d), 251);
}

#[test]
fn minter_role_layout() {
    minter_role_case("");
    minter_role_case("backend");
    minter_role_case(&"m".repeat(32));
}

fn achievement_case(id: &str, name: &str, uri: &str) {
    let collection = Pubkey::new_unique();
    let creator = Pubkey::new_unique();

    let mut d = vec![0u8; c::ACHIEVEMENT_TYPE_SIZE];
    pstate::achievement::init_achievement_type(
        &mut d,
        &pstate::achievement::InitAchievementType {
            achievement_id: id.as_bytes(),
            name: name.as_bytes(),
            metadata_uri: uri.as_bytes(),
            collection: &addr(collection),
            creator: &addr(creator),
            max_supply: 100,
            xp_reward: 25,
            now: 1_695_000_000,
            bump: 250,
        },
    );

    // Discriminator + the three Borsh string headers, then read via the parser.
    assert_eq!(&d[0..8], &c::ACC_ACHIEVEMENT_TYPE[..], "discriminator");
    assert_eq!(rd_u32(&d, 8) as usize, id.len(), "id_len header @8");
    let o_name = 12 + id.len();
    assert_eq!(rd_u32(&d, o_name) as usize, name.len(), "name_len header");
    let o_uri = o_name + 4 + name.len();
    assert_eq!(rd_u32(&d, o_uri) as usize, uri.len(), "uri_len header");
    // trailing _reserved (8 bytes before bump) must be zero.
    let o_collection = o_uri + 4 + uri.len();
    let o_reserved = o_collection + 32 + 32 + 4 + 4 + 4 + 1 + 8;
    assert_eq!(&d[o_reserved..o_reserved + 8], &[0u8; 8], "reserved zero");

    let parsed = pstate::achievement::AchievementTypeOffsets::parse(&d).unwrap();
    assert_eq!(parsed.achievement_id(&d), id.as_bytes());
    assert_eq!(parsed.name(&d), name.as_bytes());
    assert_eq!(parsed.metadata_uri(&d), uri.as_bytes());
    assert_eq!(parsed.collection(&d).as_array(), &collection.to_bytes());
    assert_eq!(parsed.max_supply(&d), 100);
    assert_eq!(parsed.current_supply(&d), 0, "init supply = 0");
    assert_eq!(parsed.xp_reward(&d), 25);
    assert!(parsed.is_active(&d), "init is_active = true");
    assert_eq!(parsed.bump(&d), 250);

    parsed.set_current_supply(&mut d, 7);
    parsed.set_is_active(&mut d, false);

    let parsed = pstate::achievement::AchievementTypeOffsets::parse(&d).unwrap();
    assert_eq!(parsed.achievement_id(&d), id.as_bytes());
    assert_eq!(parsed.name(&d), name.as_bytes());
    assert_eq!(parsed.metadata_uri(&d), uri.as_bytes());
    assert_eq!(parsed.current_supply(&d), 7);
    assert!(!parsed.is_active(&d));
    assert_eq!(parsed.max_supply(&d), 100);
    assert_eq!(parsed.xp_reward(&d), 25);
    assert_eq!(parsed.bump(&d), 250);
}

#[test]
fn achievement_type_layout() {
    achievement_case("a", "N", "u");
    achievement_case("early-adopter", "Early Adopter", "https://arweave.net/xyz");
    achievement_case(&"i".repeat(32), &"n".repeat(64), &"u".repeat(128));
}

#[test]
fn achievement_receipt_layout() {
    // 8 disc | 32 asset | 8 awarded_at | 1 bump
    let asset = Pubkey::new_unique();
    let mut d = vec![0u8; c::ACHIEVEMENT_RECEIPT_SIZE];
    pstate::achievement::init_receipt(&mut d, &addr(asset), 1_699_999_999, 249);

    assert_eq!(&d[0..8], &c::ACC_ACHIEVEMENT_RECEIPT[..], "discriminator");
    assert_eq!(rd_addr(&d, 8), asset.to_bytes(), "asset @8");
    assert_eq!(rd_i64(&d, 40), 1_699_999_999, "awarded_at @40");
    assert_eq!(d[48], 249, "bump @48");
    assert_eq!(d.len(), 49, "receipt is exactly 49 bytes");
}
