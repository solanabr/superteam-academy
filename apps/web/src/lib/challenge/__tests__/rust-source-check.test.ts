import { describe, expect, it } from "vitest";
import { hasDisallowedRustConstruct, rustCodeOnly } from "../rust-source-check";

describe("hasDisallowedRustConstruct", () => {
  it.each([
    'const K: &str = env ! ("K");',
    'const K: &str = env /* gap */ ! ("K");',
    'const K: &str = core::env!["K"];',
    "use std::env as e;",
    "use std::{env as e};",
    'const K: &str = r#env!("K");',
    "use std::fs;",
    "use std::{fs};",
    "macro_rules! m { () => {} }",
    'extern "C" { fn f(); }',
    "extern crate core as std;",
    "impl PartialEq for Y { }",
    "impl core::cmp::PartialEq<i64> for Y { }",
    "use std::cmp::PartialEq as Q;",
    // a literal or comment that looks open doesn't hide what follows it
    "const Q: char = '\"'; use std::fs;",
    'const S: &str = "//"; use std::fs;',
    'const S: &str = "/*"; use std::fs;',
    'const S: &str = r#"a"#; use std::fs;',
    'const S: &[u8] = b"a\\""; use std::fs;',
    "const N: u8 = b'\"'; use std::fs;",
    "fn f<'a>(x: &'a str) -> &'a str { x } use std::fs;",
    "/* a /* nested */ b */ use std::fs;",
    "/* never closed",
    'const S: &str = "never closed',
  ])("rejects %s", (source) => {
    expect(hasDisallowedRustConstruct(source)).toBe(true);
  });

  it.each([
    "// macro_rules, std::fs, File and env! are fine in a comment\nstruct A;",
    '/* extern PartialEq */ const S: &str = "fs File env!(\\"x\\") macro_rules";',
    "#[derive(Debug, Clone, PartialEq, Eq)]\nenum Dir { Up, Down }",
    "# [ derive ( PartialEq ) ] struct A;",
    "let env = 1; let file = 2; let filename = 3; let net_fs_total = 4;",
    "fn f<'a>(x: &'a str) -> &'a str { x } const Q: char = '\\''; const N: u8 = b'x';",
    "use std::collections::HashMap; use std::fmt;",
    "if a == b { return a.max(b); }",
  ])("allows %s", (source) => {
    expect(hasDisallowedRustConstruct(source)).toBe(false);
  });
});

describe("rustCodeOnly", () => {
  it("keeps code and removes comments and literals", () => {
    expect(rustCodeOnly("let a = \"x\"; // note\nlet b = 'y';")).toBe(
      "let a =  ;  \nlet b =  ;"
    );
  });
});
