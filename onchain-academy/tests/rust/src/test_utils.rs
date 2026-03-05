/// Pure unit tests for bitmap math used in lesson completion tracking.
///
/// The bitmap logic in `complete_lesson` uses [u64; 4] to track up to 256 lessons.
/// These tests verify the arithmetic independently of the runtime.

fn bitmap_set(flags: &mut [u64; 4], index: u8) {
    let word = (index / 64) as usize;
    let bit = index % 64;
    flags[word] |= 1u64 << bit;
}

fn bitmap_is_set(flags: &[u64; 4], index: u8) -> bool {
    let word = (index / 64) as usize;
    let bit = index % 64;
    flags[word] & (1u64 << bit) != 0
}

fn bitmap_count_ones(flags: &[u64; 4]) -> u32 {
    flags.iter().map(|w| w.count_ones()).sum()
}

#[test]
fn bitmap_set_and_check() {
    let mut flags = [0u64; 4];
    bitmap_set(&mut flags, 0);
    assert!(bitmap_is_set(&flags, 0));
    assert!(!bitmap_is_set(&flags, 1));
    assert_eq!(bitmap_count_ones(&flags), 1);
}

#[test]
fn bitmap_set_multiple_bits() {
    let mut flags = [0u64; 4];
    bitmap_set(&mut flags, 0);
    bitmap_set(&mut flags, 63);
    bitmap_set(&mut flags, 64);
    bitmap_set(&mut flags, 127);
    bitmap_set(&mut flags, 128);
    bitmap_set(&mut flags, 255);

    assert!(bitmap_is_set(&flags, 0));
    assert!(bitmap_is_set(&flags, 63));
    assert!(bitmap_is_set(&flags, 64));
    assert!(bitmap_is_set(&flags, 127));
    assert!(bitmap_is_set(&flags, 128));
    assert!(bitmap_is_set(&flags, 255));
    assert!(!bitmap_is_set(&flags, 1));
    assert!(!bitmap_is_set(&flags, 254));
    assert_eq!(bitmap_count_ones(&flags), 6);
}

#[test]
fn bitmap_idempotent_set() {
    let mut flags = [0u64; 4];
    bitmap_set(&mut flags, 42);
    let snapshot = flags;
    bitmap_set(&mut flags, 42);
    assert_eq!(flags, snapshot);
    assert_eq!(bitmap_count_ones(&flags), 1);
}

#[test]
fn bitmap_boundary_index_255() {
    let mut flags = [0u64; 4];
    bitmap_set(&mut flags, 255);
    assert!(bitmap_is_set(&flags, 255));
    assert_eq!(flags[3], 1u64 << 63);
    assert_eq!(bitmap_count_ones(&flags), 1);
}

#[test]
fn bitmap_fill_all_256() {
    let mut flags = [0u64; 4];
    for i in 0..=255u8 {
        bitmap_set(&mut flags, i);
    }
    assert_eq!(bitmap_count_ones(&flags), 256);
    assert_eq!(flags, [u64::MAX; 4]);
}

#[test]
fn bitmap_word_boundaries() {
    let mut flags = [0u64; 4];
    bitmap_set(&mut flags, 63);
    assert_eq!(flags[0], 1u64 << 63);
    bitmap_set(&mut flags, 64);
    assert_eq!(flags[1], 1u64 << 0);
    bitmap_set(&mut flags, 127);
    assert_eq!(flags[1], (1u64 << 0) | (1u64 << 63));
    bitmap_set(&mut flags, 128);
    assert_eq!(flags[2], 1u64 << 0);
}

#[test]
fn bitmap_count_partial_fill() {
    let mut flags = [0u64; 4];
    for i in 0..10u8 {
        bitmap_set(&mut flags, i);
    }
    assert_eq!(bitmap_count_ones(&flags), 10);
    assert_eq!(flags[0], (1u64 << 10) - 1);
    assert_eq!(flags[1], 0);
    assert_eq!(flags[2], 0);
    assert_eq!(flags[3], 0);
}

#[test]
fn bitmap_completion_check_mirrors_finalize() {
    let mut flags = [0u64; 4];
    let lesson_count: u8 = 7;

    for i in 0..lesson_count {
        bitmap_set(&mut flags, i);
    }

    let completed: u32 = flags.iter().map(|w| w.count_ones()).sum();
    assert_eq!(completed, lesson_count as u32);
}

#[test]
fn bitmap_unset_bits_remain_zero() {
    let mut flags = [0u64; 4];
    bitmap_set(&mut flags, 5);
    bitmap_set(&mut flags, 100);

    for i in 0..=255u8 {
        if i == 5 || i == 100 {
            assert!(bitmap_is_set(&flags, i));
        } else {
            assert!(!bitmap_is_set(&flags, i));
        }
    }
}
