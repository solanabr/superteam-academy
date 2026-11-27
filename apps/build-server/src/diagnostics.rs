//! Compiler diagnostics read from the text rustc prints to stderr.
//!
//! `cargo-build-sbf` keeps cargo's stdout to itself and drops it when the build
//! fails, so cargo's JSON messages never reach this process. The rendered text
//! is the only form of a diagnostic the server gets.

use crate::cache::Files;

use regex::Regex;
use serde::Serialize;
use std::sync::OnceLock;

pub const MAX_DIAGNOSTICS: usize = 20;
pub const MAX_MESSAGE_CHARS: usize = 300;

#[derive(Serialize, Clone, Copy, Debug, PartialEq, Eq, PartialOrd, Ord)]
#[serde(rename_all = "lowercase")]
pub enum Level {
    Error,
    Warning,
}

/// One compiler error or warning in a submitted file.
///
/// Lines and columns are rustc's own: 1-based, columns counted in characters.
/// `end_col` is exclusive, like rustc's `column_end`. The end equals the start
/// when the rendered text does not show where the span ends.
#[derive(Serialize, Clone, Debug, PartialEq, Eq)]
pub struct Diagnostic {
    /// The path as submitted, e.g. `/src/lib.rs`.
    pub file: String,
    pub line: u32,
    pub col: u32,
    pub end_line: u32,
    pub end_col: u32,
    pub level: Level,
    /// The error code, e.g. `E0425`. Warnings usually have none.
    pub code: Option<String>,
    pub message: String,
}

/// `stderr` without the server's build directory, so a compiled file reads as
/// `/src/lib.rs` wherever the compiler printed its full path.
pub fn strip_build_dir(stderr: &str, build_dirs: &[&str]) -> String {
    // Longest first: one spelling of the directory can contain another.
    let mut dirs: Vec<&str> = build_dirs
        .iter()
        .copied()
        .filter(|d| !d.is_empty())
        .collect();
    dirs.sort_by_key(|d| std::cmp::Reverse(d.len()));
    dirs.iter()
        .fold(stderr.to_string(), |text, dir| text.replace(dir, ""))
}

/// The diagnostics rustc reported in the submitted `files`: errors first, then
/// warnings, each group in the compiler's order. Diagnostics located anywhere
/// else (a dependency, the standard library) are left out, and so are cargo's
/// own summary lines, which have no location.
pub fn parse_diagnostics(stderr: &str, files: &Files) -> Vec<Diagnostic> {
    let lines: Vec<&str> = stderr.lines().collect();
    let mut found = Vec::new();

    for (i, text) in lines.iter().enumerate() {
        let Some(header) = header_regex().captures(text) else {
            continue;
        };
        // A diagnostic runs to the next blank line or the next header.
        let block: Vec<&str> = lines[i + 1..]
            .iter()
            .copied()
            .take_while(|l| !l.trim().is_empty() && !header_regex().is_match(l))
            .collect();
        let Some((at, location)) = block
            .iter()
            .enumerate()
            .find_map(|(at, l)| Some((at, location_regex().captures(l)?)))
        else {
            continue;
        };

        // rustc prints a compiled file relative to the build directory.
        let printed = location[1].trim_start_matches("./");
        let path = format!("/{}", printed.trim_start_matches('/'));
        let Some([file, source]) = files.iter().find(|[p, _]| *p == path) else {
            continue;
        };
        let (Ok(line), Ok(col)) = (location[2].parse::<u32>(), location[3].parse::<u32>()) else {
            continue;
        };

        found.push(Diagnostic {
            file: file.clone(),
            line,
            col,
            end_line: line,
            end_col: span_end_col(&block[at + 1..], source, line, col).unwrap_or(col),
            level: if &header[1] == "error" {
                Level::Error
            } else {
                Level::Warning
            },
            code: header.get(2).map(|code| code.as_str().to_string()),
            message: header[3].chars().take(MAX_MESSAGE_CHARS).collect(),
        });
    }

    found.sort_by_key(|d| d.level);
    found.truncate(MAX_DIAGNOSTICS);
    found
}

/// One line of a rendered source snippet: its line number, if it shows a source
/// line, and the text after the `|` gutter.
fn snippet_row(line: &str) -> Option<(Option<u32>, &str)> {
    let line = line.trim_start();
    if line == "..." {
        return Some((None, ""));
    }
    let digits = line.len() - line.trim_start_matches(|c: char| c.is_ascii_digit()).len();
    let text = line[digits..].trim_start().strip_prefix('|')?;
    Some((
        line[..digits].parse().ok(),
        text.strip_prefix(' ').unwrap_or(text),
    ))
}

/// The exclusive end column of a span that starts at `line:col`, read from the
/// `^^^` underline rustc draws below the source line.
///
/// `None` unless the underline is certain to cover the whole span, one column
/// per character: it must start under `col`, stand apart from other labels, and
/// the source up to its end must be plain text (a tab or a wide character is
/// drawn wider than one column). A span over several lines has no such underline.
fn span_end_col(snippet: &[&str], source: &str, line: u32, col: u32) -> Option<u32> {
    let mut rows = snippet.iter().map_while(|l| snippet_row(l));
    rows.find(|(number, _)| *number == Some(line))?;
    let (None, marks) = rows.next()? else {
        return None;
    };

    let marks: Vec<char> = marks.chars().collect();
    let start = (col as usize).checked_sub(1)?;
    let len = marks
        .get(start..)?
        .iter()
        .take_while(|c| **c == '^')
        .count();
    let apart = |at: Option<&char>| matches!(at, None | Some(' '));
    let before = start.checked_sub(1).and_then(|i| marks.get(i));
    if len == 0 || !apart(before) || !apart(marks.get(start + len)) {
        return None;
    }

    let covered: Vec<char> = source
        .lines()
        .nth((line as usize).checked_sub(1)?)?
        .chars()
        .take(start + len)
        .collect();
    let plain = |c: &char| matches!(c, ' '..='~' | '\u{C0}'..='\u{24F}');
    (covered.len() == start + len && covered.iter().all(plain)).then_some(col + len as u32)
}

fn header_regex() -> &'static Regex {
    static HEADER: OnceLock<Regex> = OnceLock::new();
    HEADER.get_or_init(|| Regex::new(r"^(error|warning)(?:\[([^\]]+)\])?: (.+)$").unwrap())
}

fn location_regex() -> &'static Regex {
    static LOCATION: OnceLock<Regex> = OnceLock::new();
    LOCATION.get_or_init(|| Regex::new(r"^\s*--> (.+):(\d+):(\d+)$").unwrap())
}

#[cfg(test)]
mod tests {
    use super::*;

    // The fixtures are the unedited stderr of `cargo-build-sbf --tools-version
    // v1.54 --offline` for the small crates stored next to them.
    macro_rules! fixture {
        ($case:literal, $file:literal) => {
            include_str!(concat!("../tests/fixtures/diagnostics/", $case, "/", $file))
        };
    }

    fn lib(source: &str) -> Files {
        vec![["/src/lib.rs".to_string(), source.to_string()]]
    }

    fn diagnostic(
        file: &str,
        (line, col): (u32, u32),
        (end_line, end_col): (u32, u32),
        level: Level,
        code: Option<&str>,
        message: &str,
    ) -> Diagnostic {
        Diagnostic {
            file: file.to_string(),
            line,
            col,
            end_line,
            end_col,
            level,
            code: code.map(str::to_string),
            message: message.to_string(),
        }
    }

    #[test]
    fn missing_item_is_located_with_its_span() {
        let found = parse_diagnostics(
            fixture!("missing_item", "stderr.txt"),
            &lib(fixture!("missing_item", "lib.rs")),
        );
        assert_eq!(
            found,
            [diagnostic(
                "/src/lib.rs",
                (2, 5),
                (2, 9),
                Level::Error,
                Some("E0425"),
                "cannot find function `ping` in this scope",
            )]
        );
    }

    #[test]
    fn type_mismatch_and_a_span_over_several_lines() {
        let found = parse_diagnostics(
            fixture!("type_mismatch", "stderr.txt"),
            &lib(fixture!("type_mismatch", "lib.rs")),
        );
        assert_eq!(
            found,
            [
                diagnostic(
                    "/src/lib.rs",
                    (2, 22),
                    (2, 27),
                    Level::Error,
                    Some("E0308"),
                    "mismatched types",
                ),
                // The rendered text shows only where this span starts.
                diagnostic(
                    "/src/lib.rs",
                    (7, 5),
                    (7, 5),
                    Level::Error,
                    Some("E0317"),
                    "`if` may be missing an `else` clause",
                ),
            ]
        );
    }

    #[test]
    fn error_inside_a_macro_expansion_points_at_the_macro_body() {
        let found = parse_diagnostics(
            fixture!("macro_expansion", "stderr.txt"),
            &lib(fixture!("macro_expansion", "lib.rs")),
        );
        assert_eq!(
            found,
            [
                diagnostic(
                    "/src/lib.rs",
                    (9, 19),
                    (9, 24),
                    Level::Error,
                    Some("E0308"),
                    "mismatched types",
                ),
                diagnostic(
                    "/src/lib.rs",
                    (3, 16),
                    (3, 17),
                    Level::Error,
                    Some("E0277"),
                    "cannot add `&str` to `u64`",
                ),
            ]
        );
    }

    #[test]
    fn error_in_a_second_file_carries_that_file() {
        let files = vec![
            [
                "/src/lib.rs".to_string(),
                fixture!("second_file", "lib.rs").to_string(),
            ],
            [
                "/src/_verify.rs".to_string(),
                fixture!("second_file", "_verify.rs").to_string(),
            ],
        ];
        let found = parse_diagnostics(fixture!("second_file", "stderr.txt"), &files);
        assert_eq!(
            found,
            [diagnostic(
                "/src/_verify.rs",
                (2, 28),
                (2, 32),
                Level::Error,
                Some("E0425"),
                "cannot find function `pong` in the crate root",
            )]
        );
    }

    #[test]
    fn warning_only_build_reports_warnings_without_a_code() {
        let found = parse_diagnostics(
            fixture!("warning_only", "stderr.txt"),
            &lib(fixture!("warning_only", "lib.rs")),
        );
        assert_eq!(
            found,
            [
                diagnostic(
                    "/src/lib.rs",
                    (2, 9),
                    (2, 15),
                    Level::Warning,
                    None,
                    "unused variable: `unused`",
                ),
                // Another label covers part of the span, so its end is not shown.
                diagnostic(
                    "/src/lib.rs",
                    (3, 9),
                    (3, 9),
                    Level::Warning,
                    None,
                    "variable does not need to be mutable",
                ),
            ]
        );
    }

    #[test]
    fn non_ascii_text_keeps_character_columns() {
        let found = parse_diagnostics(
            fixture!("non_ascii", "stderr.txt"),
            &lib(fixture!("non_ascii", "lib.rs")),
        );
        assert_eq!(
            found,
            [
                // Wide characters come before the span: the underline is not
                // aligned with character columns, so the end is not read.
                diagnostic(
                    "/src/lib.rs",
                    (2, 24),
                    (2, 24),
                    Level::Error,
                    Some("E0425"),
                    "cannot find value `valor_não_existe` in this scope",
                ),
                diagnostic(
                    "/src/lib.rs",
                    (6, 19),
                    (6, 24),
                    Level::Error,
                    Some("E0425"),
                    "cannot find value `preço` in this scope",
                ),
            ]
        );
    }

    #[test]
    fn label_next_to_the_span_leaves_the_end_at_the_start() {
        let found = parse_diagnostics(
            fixture!("overlapping_labels", "stderr.txt"),
            &lib(fixture!("overlapping_labels", "lib.rs")),
        );
        assert_eq!(
            found,
            [diagnostic(
                "/src/lib.rs",
                (6, 5),
                (6, 5),
                Level::Error,
                Some("E0061"),
                "this function takes 2 arguments but 1 argument was supplied",
            )]
        );
    }

    #[test]
    fn errors_come_before_warnings() {
        let found = parse_diagnostics(
            fixture!("warning_then_error", "stderr.txt"),
            &lib(fixture!("warning_then_error", "lib.rs")),
        );
        assert_eq!(
            found,
            [
                diagnostic(
                    "/src/lib.rs",
                    (4, 22),
                    (4, 27),
                    Level::Error,
                    Some("E0308"),
                    "mismatched types",
                ),
                diagnostic(
                    "/src/lib.rs",
                    (1, 5),
                    (1, 20),
                    Level::Warning,
                    None,
                    "unused import: `core::mem::swap`",
                ),
            ]
        );
    }

    fn rendered(level: &str, message: &str, path: &str, line: usize) -> String {
        format!("{level}: {message}\n --> {path}:{line}:1\n  |\n\n")
    }

    #[test]
    fn at_most_twenty_diagnostics_and_errors_are_kept_first() {
        let mut stderr = String::new();
        for line in 1..=25 {
            stderr += &rendered("warning", &format!("w{line}"), "src/lib.rs", line);
        }
        for line in 26..=28 {
            stderr += &rendered("error[E0001]", &format!("e{line}"), "src/lib.rs", line);
        }
        let found = parse_diagnostics(&stderr, &lib(""));
        let messages: Vec<&str> = found.iter().map(|d| d.message.as_str()).collect();

        assert_eq!(found.len(), MAX_DIAGNOSTICS);
        assert_eq!(messages[..4], ["e26", "e27", "e28", "w1"]);
        assert_eq!(messages[19], "w17");
    }

    #[test]
    fn long_message_is_cut_at_300_characters() {
        let stderr = rendered("error", &"é".repeat(400), "src/lib.rs", 1);
        let found = parse_diagnostics(&stderr, &lib(""));
        assert_eq!(found[0].message, "é".repeat(MAX_MESSAGE_CHARS));
    }

    #[test]
    fn diagnostics_outside_the_submitted_files_are_left_out() {
        let registry = "/home/academy/.cargo/registry/src/index.crates.io-0/anchor-lang-1.1.2";
        let stderr = [
            rendered(
                "warning",
                "in a dependency",
                &format!("{registry}/src/lib.rs"),
                3,
            ),
            rendered("error", "in a file nobody sent", "src/other.rs", 1),
            rendered("error", "in the learner's file", "src/lib.rs", 1),
        ]
        .concat();
        let found = parse_diagnostics(&stderr, &lib(""));
        assert_eq!(found.len(), 1);
        assert_eq!(found[0].message, "in the learner's file");
    }

    #[test]
    fn build_dir_is_stripped_from_stderr() {
        let dir = "/tmp/academy-builds/00000000-0000-4000-8000-000000000001";
        let real = format!("/private{dir}");
        let raw = fixture!("missing_item", "stderr.txt");
        assert!(raw.contains(&real));

        // The shorter path is part of the longer one: the order must not matter.
        for dirs in [[dir, real.as_str()], [real.as_str(), dir]] {
            let stripped = strip_build_dir(raw, &dirs);
            assert!(!stripped.contains("academy-builds"), "{stripped}");
            assert!(!stripped.contains("/private"), "{stripped}");
            assert!(stripped.contains("Compiling academy-program v0.1.0 ()"));
            assert!(stripped.contains(" --> src/lib.rs:2:5"));
        }
    }

    #[test]
    fn absolute_path_under_the_build_dir_reads_as_the_submitted_path() {
        let dir = "/tmp/academy-builds/00000000-0000-4000-8000-000000000001";
        let raw = rendered("error", "boom", &format!("{dir}/src/lib.rs"), 4);
        let stripped = strip_build_dir(&raw, &[dir]);
        assert!(stripped.contains(" --> /src/lib.rs:4:1"));

        let found = parse_diagnostics(&stripped, &lib(""));
        assert_eq!(found[0].file, "/src/lib.rs");
        assert_eq!((found[0].line, found[0].col), (4, 1));
    }

    #[test]
    fn output_without_compiler_diagnostics_gives_none() {
        let own = "Build timed out after 120 seconds. \
                   Your program may be too complex or have circular dependencies.";
        assert!(parse_diagnostics(own, &lib("")).is_empty());
        assert!(parse_diagnostics("", &lib("")).is_empty());
    }

    #[test]
    fn serializes_with_snake_case_names_and_a_lowercase_level() {
        let error = diagnostic(
            "/src/lib.rs",
            (2, 5),
            (2, 9),
            Level::Error,
            Some("E0425"),
            "m",
        );
        assert_eq!(
            serde_json::to_value(&error).unwrap(),
            serde_json::json!({
                "file": "/src/lib.rs",
                "line": 2,
                "col": 5,
                "end_line": 2,
                "end_col": 9,
                "level": "error",
                "code": "E0425",
                "message": "m",
            })
        );

        let warning = diagnostic("/src/lib.rs", (1, 1), (1, 1), Level::Warning, None, "m");
        let json = serde_json::to_value(&warning).unwrap();
        assert_eq!(json["level"], "warning");
        assert!(json["code"].is_null());
    }
}
