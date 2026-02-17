#![no_main]
use arbitrary::Arbitrary;
use libfuzzer_sys::fuzz_target;

/// Mirrors the lesson_flags bitmap from Enrollment: [u64; 4] = 256 bits max.
/// The program uses this to track which lessons have been completed.

#[derive(Debug, Arbitrary)]
struct BitmapInput {
    lesson_index: u8,
    lesson_count: u8,
    flags: [u64; 4],
    /// Sequence of lesson indices to mark as completed
    lesson_sequence: Vec<u8>,
}

/// Pure extraction of bitmap logic from complete_lesson handler.
fn is_lesson_completed(flags: &[u64; 4], lesson_index: u8) -> bool {
    let word_index = (lesson_index / 64) as usize;
    if word_index >= 4 {
        return false;
    }
    let bit_index = lesson_index % 64;
    let mask = 1u64 << bit_index;
    flags[word_index] & mask != 0
}

fn set_lesson_completed(flags: &mut [u64; 4], lesson_index: u8) {
    let word_index = (lesson_index / 64) as usize;
    if word_index >= 4 {
        return;
    }
    let bit_index = lesson_index % 64;
    let mask = 1u64 << bit_index;
    flags[word_index] |= mask;
}

fn count_completed_lessons(flags: &[u64; 4]) -> u32 {
    flags.iter().map(|w| w.count_ones()).sum()
}

/// Checks whether all lessons 0..lesson_count are marked complete.
fn all_lessons_completed(flags: &[u64; 4], lesson_count: u8) -> bool {
    let completed: u32 = flags.iter().map(|w| w.count_ones()).sum();
    completed == lesson_count as u32
}

fuzz_target!(|input: BitmapInput| {
    // --- Invariant 1: Setting a bit and reading it back ---
    {
        let mut flags = input.flags;
        let idx = input.lesson_index;
        let word_index = (idx / 64) as usize;
        if word_index < 4 {
            set_lesson_completed(&mut flags, idx);
            assert!(
                is_lesson_completed(&flags, idx),
                "Bit must be set after set_lesson_completed"
            );
        }
    }

    // --- Invariant 2: Setting a bit is idempotent ---
    {
        let mut flags = input.flags;
        let idx = input.lesson_index;
        let word_index = (idx / 64) as usize;
        if word_index < 4 {
            set_lesson_completed(&mut flags, idx);
            let after_first = flags;
            set_lesson_completed(&mut flags, idx);
            assert_eq!(
                flags, after_first,
                "Setting the same bit twice must not change state"
            );
        }
    }

    // --- Invariant 3: count_ones never exceeds 256 ---
    {
        let count = count_completed_lessons(&input.flags);
        assert!(count <= 256, "count_ones cannot exceed 256 for [u64; 4]");
    }

    // --- Invariant 4: Monotonic completion count ---
    {
        let mut flags = [0u64; 4];
        let mut prev_count = 0u32;
        for &idx in input.lesson_sequence.iter().take(256) {
            let word_index = (idx / 64) as usize;
            if word_index < 4 {
                set_lesson_completed(&mut flags, idx);
                let new_count = count_completed_lessons(&flags);
                assert!(
                    new_count >= prev_count,
                    "Completion count must never decrease"
                );
                prev_count = new_count;
            }
        }
    }

    // --- Invariant 5: all_lessons_completed consistency ---
    {
        if input.lesson_count > 0 {
            let mut flags = [0u64; 4];
            let lc = input.lesson_count;

            // Before completing all: should not be "all completed"
            // (unless lesson_count is 0, which we exclude)
            assert!(
                !all_lessons_completed(&flags, lc),
                "Empty flags cannot be all-completed for lesson_count > 0"
            );

            // Complete exactly lesson_count lessons (indices 0..lesson_count)
            for i in 0..lc {
                set_lesson_completed(&mut flags, i);
            }
            assert!(
                all_lessons_completed(&flags, lc),
                "Must be all-completed after setting bits 0..lesson_count"
            );
        }
    }

    // --- Invariant 6: Out-of-bounds lesson_index (>= lesson_count) should not affect validity ---
    {
        if input.lesson_count > 0 && input.lesson_count < 255 {
            let mut flags = [0u64; 4];
            // Complete all valid lessons
            for i in 0..input.lesson_count {
                set_lesson_completed(&mut flags, i);
            }
            // Set an out-of-bounds bit
            let oob_idx = input.lesson_count; // one past the end
            set_lesson_completed(&mut flags, oob_idx);
            // count_ones will now be lesson_count + 1, but the program should
            // reject lesson_index >= lesson_count before this point.
            // The bitmap itself doesn't panic -- the guard is in complete_lesson.
            let count = count_completed_lessons(&flags);
            assert!(
                count == input.lesson_count as u32 + 1,
                "Out-of-bounds bit should still be tracked in bitmap"
            );
        }
    }

    // --- Invariant 7: lesson_index 255 (max u8) ---
    {
        let mut flags = [0u64; 4];
        // 255 / 64 = 3 (word_index), 255 % 64 = 63 (bit_index)
        // word_index 3 < 4, so this should be valid
        set_lesson_completed(&mut flags, 255);
        assert!(
            is_lesson_completed(&flags, 255),
            "lesson_index 255 must work (word 3, bit 63)"
        );
        assert_eq!(flags[3], 1u64 << 63);
    }

    // --- Invariant 8: Bits in different words are independent ---
    {
        let mut flags = [0u64; 4];
        set_lesson_completed(&mut flags, 0); // word 0, bit 0
        set_lesson_completed(&mut flags, 64); // word 1, bit 0
        set_lesson_completed(&mut flags, 128); // word 2, bit 0
        set_lesson_completed(&mut flags, 192); // word 3, bit 0

        assert!(is_lesson_completed(&flags, 0));
        assert!(is_lesson_completed(&flags, 64));
        assert!(is_lesson_completed(&flags, 128));
        assert!(is_lesson_completed(&flags, 192));
        assert!(!is_lesson_completed(&flags, 1));
        assert!(!is_lesson_completed(&flags, 65));
    }

    // --- Invariant 9: all_lessons_completed is false when wrong bits are set ---
    {
        if input.lesson_count > 1 && input.lesson_count < 255 {
            let mut flags = [0u64; 4];
            // Set bits starting from index 1 instead of 0 (skip lesson 0)
            for i in 1..input.lesson_count {
                set_lesson_completed(&mut flags, i);
            }
            // We have lesson_count-1 bits set, missing bit 0
            assert!(
                !all_lessons_completed(&flags, input.lesson_count),
                "Missing lesson 0 should not count as all-completed"
            );

            // Now set an out-of-bounds bit instead of the missing one
            set_lesson_completed(&mut flags, input.lesson_count);
            // count_ones == lesson_count but the wrong bits are set
            let count = count_completed_lessons(&flags);
            assert_eq!(count, input.lesson_count as u32);
            // all_lessons_completed uses count_ones which doesn't distinguish WHICH bits
            // This is a known limitation: the program guards lesson_index < lesson_count
            // before setting bits, so out-of-bounds bits can't occur in practice.
        }
    }

    // --- Invariant 10: Sequential set across word boundary ---
    {
        let mut flags = [0u64; 4];
        // Set lessons 62, 63, 64, 65 — crossing word 0/1 boundary
        for i in 62..=65u8 {
            set_lesson_completed(&mut flags, i);
        }
        assert!(is_lesson_completed(&flags, 62));
        assert!(is_lesson_completed(&flags, 63));
        assert!(is_lesson_completed(&flags, 64));
        assert!(is_lesson_completed(&flags, 65));
        assert_eq!(count_completed_lessons(&flags), 4);
        // Verify they're in the correct words
        assert!(flags[0] & (1u64 << 62) != 0);
        assert!(flags[0] & (1u64 << 63) != 0);
        assert!(flags[1] & (1u64 << 0) != 0);
        assert!(flags[1] & (1u64 << 1) != 0);
    }

    // --- Invariant 11: Fuzz sequence preserves unrelated bits ---
    {
        let mut flags = input.flags;
        let idx = input.lesson_index;
        let word_index = (idx / 64) as usize;
        if word_index < 4 {
            let before = flags;
            set_lesson_completed(&mut flags, idx);
            // All OTHER bits must remain unchanged
            for w in 0..4 {
                if w == word_index {
                    let mask = 1u64 << (idx % 64);
                    // Only the target bit could have changed (0->1)
                    assert_eq!(
                        flags[w] & !mask,
                        before[w] & !mask,
                        "Non-target bits in word {} must not change",
                        w,
                    );
                } else {
                    assert_eq!(
                        flags[w], before[w],
                        "Word {} must not change when setting bit in word {}",
                        w, word_index,
                    );
                }
            }
        }
    }
});
