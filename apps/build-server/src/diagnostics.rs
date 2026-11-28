//! Compiler diagnostics read from the text rustc prints to stderr.
//!
//! `cargo-build-sbf` keeps cargo's stdout to itself and drops it when the build
//! fails, so cargo's JSON messages never reach this process. The rendered text
//! is the only form of a diagnostic the server gets.

use crate::cache::Files;

use regex::Regex;
use serde::Serialize;
use std::collections::HashMap;
use std::sync::OnceLock;

pub const MAX_DIAGNOSTICS: usize = 20;
pub const MAX_MESSAGE_CHARS: usize = 300;
/// Real codes look like `E0425`.
pub const MAX_CODE_CHARS: usize = 16;
/// How much of stderr is parsed. A full set of 20 rendered diagnostics is a few
/// tens of kilobytes, so a real build stays far below this. Output past the cap
/// is still returned in `stderr`; it only gives no diagnostics.
pub const MAX_PARSED_BYTES: usize = 256 * 1024;

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
///
/// Only the first `MAX_PARSED_BYTES` of `stderr` are read.
pub fn parse_diagnostics(stderr: &str, files: &Files) -> Vec<Diagnostic> {
    parse(stderr, files).0
}

/// `raw` compiler stderr as the caller gets it, and its diagnostics. The parse
/// runs off the async runtime. If it does not finish, the build keeps its
/// result and gets no diagnostics.
pub async fn read_compiler_output(
    raw: &str,
    build_dirs: &[&str],
    files: &Files,
) -> (String, Vec<Diagnostic>) {
    let stderr = strip_build_dir(raw, build_dirs);
    let parsed = parsed_part(&stderr).to_owned();
    let files = files.clone();
    let diagnostics = blocking_or_none(move || parse_diagnostics(&parsed, &files)).await;
    (stderr, diagnostics)
}

async fn blocking_or_none<F>(work: F) -> Vec<Diagnostic>
where
    F: FnOnce() -> Vec<Diagnostic> + Send + 'static,
{
    tokio::task::spawn_blocking(work)
        .await
        .unwrap_or_else(|error| {
            tracing::warn!(%error, "Diagnostics parse did not finish");
            Vec::new()
        })
}

/// The start of `stderr` that is parsed: at most `MAX_PARSED_BYTES`, ending
/// after a complete line.
fn parsed_part(stderr: &str) -> &str {
    if stderr.len() <= MAX_PARSED_BYTES {
        return stderr;
    }
    let mut end = MAX_PARSED_BYTES;
    while !stderr.is_char_boundary(end) {
        end -= 1;
    }
    let end = stderr[..end].rfind('\n').map_or(0, |at| at + 1);
    &stderr[..end]
}

/// Where each line of one source file starts, so a line is found without a scan.
struct SourceLines<'a> {
    text: &'a str,
    starts: Vec<usize>,
}

impl<'a> SourceLines<'a> {
    fn new(text: &'a str) -> Self {
        let starts = std::iter::once(0)
            .chain(text.match_indices('\n').map(|(at, _)| at + 1))
            .collect();
        Self { text, starts }
    }

    /// Line `number` (1-based) without its line ending, as `str::lines` gives it.
    fn line(&self, number: u32) -> Option<&'a str> {
        let at = (number as usize).checked_sub(1)?;
        let start = *self.starts.get(at)?;
        if start == self.text.len() {
            return None;
        }
        Some(match self.starts.get(at + 1) {
            Some(next) => {
                let line = &self.text[start..next - 1];
                line.strip_suffix('\r').unwrap_or(line)
            }
            None => &self.text[start..],
        })
    }
}

/// What one parse did. The tests use it to bound the cost of hostile output.
#[cfg_attr(not(test), allow(dead_code))]
#[derive(Debug, Default)]
struct Work {
    parsed_bytes: usize,
    files_indexed: usize,
    spans_read: usize,
}

fn parse(stderr: &str, files: &Files) -> (Vec<Diagnostic>, Work) {
    let stderr = parsed_part(stderr);
    let mut work = Work {
        parsed_bytes: stderr.len(),
        ..Work::default()
    };
    let lines: Vec<&str> = stderr.lines().collect();
    let by_path: HashMap<&str, usize> = files
        .iter()
        .enumerate()
        .map(|(at, [path, _])| (path.as_str(), at))
        .collect();
    let mut sources: Vec<Option<SourceLines>> = files.iter().map(|_| None).collect();
    let (mut errors, mut warnings) = (Vec::new(), Vec::new());

    for (i, text) in lines.iter().enumerate() {
        // Twenty errors fill the result: nothing after them can change it.
        if errors.len() == MAX_DIAGNOSTICS {
            break;
        }
        let Some(header) = header_regex().captures(text) else {
            continue;
        };
        let level = match &header[1] {
            "error" => Level::Error,
            _ => Level::Warning,
        };
        // A warning after the twentieth can never be in the result.
        if level == Level::Warning && warnings.len() == MAX_DIAGNOSTICS {
            continue;
        }
        // A diagnostic runs to the next blank line or the next header.
        let Some((at, location)) = lines[i + 1..]
            .iter()
            .take_while(|l| !l.trim().is_empty() && !header_regex().is_match(l))
            .enumerate()
            .find_map(|(at, l)| Some((at, location_regex().captures(l)?)))
        else {
            continue;
        };

        // rustc prints a compiled file relative to the build directory.
        let printed = location[1].trim_start_matches("./");
        let path = format!("/{}", printed.trim_start_matches('/'));
        let Some(&file) = by_path.get(path.as_str()) else {
            continue;
        };
        let (Ok(line), Ok(col)) = (location[2].parse::<u32>(), location[3].parse::<u32>()) else {
            continue;
        };

        let source = sources[file].get_or_insert_with(|| {
            work.files_indexed += 1;
            SourceLines::new(&files[file][1])
        });
        work.spans_read += 1;
        let end_col = span_end_col(&lines[i + at + 2..], source.line(line), line, col);

        let kept = match level {
            Level::Error => &mut errors,
            Level::Warning => &mut warnings,
        };
        kept.push(Diagnostic {
            file: path,
            line,
            col,
            end_line: line,
            end_col: end_col.unwrap_or(col),
            level,
            code: header
                .get(2)
                .map(|code| code.as_str().chars().take(MAX_CODE_CHARS).collect()),
            message: header[3].chars().take(MAX_MESSAGE_CHARS).collect(),
        });
    }

    errors.append(&mut warnings);
    errors.truncate(MAX_DIAGNOSTICS);
    (errors, work)
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
fn span_end_col(snippet: &[&str], source_line: Option<&str>, line: u32, col: u32) -> Option<u32> {
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

    let covered: Vec<char> = source_line?.chars().take(start + len).collect();
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

    /// A source just under the per-file limit, and `bytes` of forged warnings
    /// that all point at its last line.
    fn hostile(bytes: usize) -> (String, Files) {
        let source = "    let a = 1;\n".repeat(6_500) + "    ping()\n";
        assert!(source.len() > 95 * 1024 && source.len() < 100 * 1024);
        let last = source.lines().count();
        let block = format!(
            "warning: forged\n --> src/lib.rs:{last}:5\n  |\n{last} |     ping()\n  |     ^^^^ here\n\n"
        );
        (block.repeat(bytes / block.len() + 1), lib(&source))
    }

    #[test]
    fn hostile_output_is_parsed_within_a_fixed_budget() {
        let (stderr, files) = hostile(3 * 1024 * 1024);
        let started = std::time::Instant::now();
        let (found, work) = parse(&stderr, &files);
        let elapsed = started.elapsed();

        assert_eq!(found.len(), MAX_DIAGNOSTICS);
        assert_eq!((found[0].line, found[0].end_col), (6_501, 9));
        // The cost does not grow with the output: a capped read, one index of
        // the source, and one span for each entry that is kept.
        assert!(work.parsed_bytes <= MAX_PARSED_BYTES, "{work:?}");
        assert_eq!(work.files_indexed, 1);
        assert_eq!(work.spans_read, MAX_DIAGNOSTICS);
        // The real cost is a few milliseconds. The guard is wide for a slow runner.
        assert!(elapsed.as_secs() < 2, "parse took {elapsed:?}");
    }

    #[test]
    fn span_work_stops_when_the_result_is_full() {
        let mut stderr = String::new();
        for line in 1..=30 {
            stderr += &rendered("warning", &format!("w{line}"), "src/lib.rs", line);
        }
        for line in 31..=55 {
            stderr += &rendered("error", &format!("e{line}"), "src/lib.rs", line);
        }
        let (found, work) = parse(&stderr, &lib(""));
        let messages: Vec<&str> = found.iter().map(|d| d.message.as_str()).collect();
        let first_twenty_errors: Vec<String> = (31..=50).map(|n| format!("e{n}")).collect();

        assert_eq!(messages, first_twenty_errors);
        // Twenty warnings and twenty errors: the rest is not looked at.
        assert_eq!(work.spans_read, 2 * MAX_DIAGNOSTICS);
    }

    #[test]
    fn errors_among_many_warnings_come_first_in_their_order() {
        let mut stderr = String::new();
        for line in 1..=40 {
            stderr += &rendered("warning", &format!("w{line}"), "src/lib.rs", line);
            if line % 8 == 0 {
                stderr += &rendered("error", &format!("e{line}"), "src/lib.rs", line);
            }
        }
        let found = parse_diagnostics(&stderr, &lib(""));
        let messages: Vec<&str> = found.iter().map(|d| d.message.as_str()).collect();

        assert_eq!(found.len(), MAX_DIAGNOSTICS);
        assert_eq!(messages[..6], ["e8", "e16", "e24", "e32", "e40", "w1"]);
        assert_eq!(messages[19], "w15");
    }

    #[test]
    fn source_lines_are_the_lines_str_gives() {
        for text in ["", "a", "a\n", "a\n\nb", "a\r\nb\r\n", "é\nb\r", "\n\n"] {
            let index = SourceLines::new(text);
            let lines: Vec<&str> = text.lines().collect();
            for number in 1..=lines.len() + 2 {
                assert_eq!(
                    index.line(number as u32),
                    lines.get(number - 1).copied(),
                    "line {number} of {text:?}"
                );
            }
            assert_eq!(index.line(0), None);
        }
    }

    #[test]
    fn parsed_part_ends_on_a_line_and_a_character() {
        assert_eq!(parsed_part("short\nno newline"), "short\nno newline");

        // A 2-byte character sits across the cap, in the middle of a line.
        let line = format!("{}\n", "é".repeat(50));
        let long = format!("xx{}", line.repeat(MAX_PARSED_BYTES / line.len() + 2));
        assert!(!long.is_char_boundary(MAX_PARSED_BYTES));
        let part = parsed_part(&long);
        assert!(part.len() <= MAX_PARSED_BYTES && part.len() > MAX_PARSED_BYTES - line.len());
        assert!(long.starts_with(part) && part.ends_with('\n'));

        assert_eq!(parsed_part(&"x".repeat(MAX_PARSED_BYTES + 1)), "");
    }

    #[tokio::test]
    async fn returned_stderr_is_not_cut_by_the_parse_cap() {
        let dir = "/tmp/academy-builds/00000000-0000-4000-8000-000000000001";
        let filler = format!("   Compiling some-crate v1.0.0 ({dir})\n").repeat(8_000);
        let raw = [
            rendered("error", "early", "src/lib.rs", 1),
            filler,
            rendered("error", "late", &format!("{dir}/src/lib.rs"), 2),
        ]
        .concat();

        let (stderr, found) = read_compiler_output(&raw, &[dir], &lib("")).await;
        let messages: Vec<&str> = found.iter().map(|d| d.message.as_str()).collect();

        assert_eq!(stderr, strip_build_dir(&raw, &[dir]));
        assert!(stderr.len() > MAX_PARSED_BYTES);
        assert!(stderr.ends_with("error: late\n --> /src/lib.rs:2:1\n  |\n\n"));
        assert_eq!(messages, ["early"]);
    }

    #[tokio::test]
    async fn parse_that_does_not_finish_gives_no_diagnostics() {
        let found = blocking_or_none(|| panic!("parse stopped")).await;
        assert!(found.is_empty());
    }

    #[test]
    fn diagnostic_past_the_parse_cap_is_not_read() {
        let filler = "   Compiling some-crate v1.0.0\n".repeat(MAX_PARSED_BYTES / 30 + 1);
        let early = rendered("error", "early", "src/lib.rs", 1);
        let late = rendered("error", "late", "src/lib.rs", 2);
        let stderr = [early.as_str(), filler.as_str(), late.as_str()].concat();

        let found = parse_diagnostics(&stderr, &lib(""));
        let messages: Vec<&str> = found.iter().map(|d| d.message.as_str()).collect();
        assert_eq!(messages, ["early"]);
    }

    #[test]
    fn long_code_is_cut() {
        let header = format!("error[{}]", "E".repeat(500));
        let found = parse_diagnostics(&rendered(&header, "m", "src/lib.rs", 1), &lib(""));
        assert_eq!(
            found[0].code.as_deref(),
            Some("E".repeat(MAX_CODE_CHARS).as_str())
        );
    }
}
