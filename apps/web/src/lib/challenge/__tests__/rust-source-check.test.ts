import { describe, expect, it } from "vitest";
import { hasDisallowedRustConstruct, rustCodeOnly } from "../rust-source-check";

describe("hasDisallowedRustConstruct", () => {
  it.each([
    'const K: &str = env ! ("K");',
    'const K: &str = env /* gap */ ! ("K");',
    'const K: &str = core::env!["K"];',
    "use std::env::var as e;",
    "use std::include_str as s;",
    "use std::{include_str as s};",
    "use std::env;",
    "use std::{env};",
    "use std::{io, process};",
    "use std as s;",
    "let me = std::env::current_exe();",
    'const K: &str = r#env!("K");',
    "use std::fs;",
    "use std::{fs};",
    "macro_rules! m { () => {} }",
    'extern "C" { fn f(); }',
    "extern crate core as std;",
    "impl PartialEq for Y { }",
    "impl core::cmp::PartialEq<i64> for Y { }",
    "use std::cmp::PartialEq as Q;",
    "impl<T> std::cmp::PartialEq<T> for Y { }",
    "impl<T: Clone> PartialEq<T> for Y<T> { }",
    "use std::*;",
    "use std::{self as s};",
    "use std::{io, *};",
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
    "fn contains<T: PartialEq>(v: &[T], x: &T) -> bool { v.iter().any(|y| y == x) }",
    "fn same<T>(a: T, b: T) -> bool where T: PartialEq { a == b }",
    "enum Entry { File, Dir }",
    "fn total(fs: u64) -> u64 { fs * 2 }",
    "fn idx(file: u8) -> usize { file as usize }",
    "fn f() -> u8 { C::env() }",
    "#[cfg_attr(all(), derive(PartialEq))] struct A;",
    "use std::fmt::Display;",
    "fn f(file: u8) -> bool { file != 0 }",
    "fn f(env: u8, prod: u8) -> bool { env != prod }",
    "fn f(include: bool, x: bool) -> bool { include != x }",
    "trait Has<T> { fn has(&self, x: &T) -> bool; } impl<T: PartialEq> Has<T> for Vec<T> { fn has(&self, x: &T) -> bool { self.contains(x) } }",
    "impl<T: PartialEq<Vec<u8>>> Has<T> for S { }",
    "impl<T> std::fmt::Display for P<T> where T: PartialEq { }",
    "impl<T: PartialEq> S<T> { fn eq_all(&self) -> bool { true } }",
    "fn f() -> impl Iterator<Item = u8> { 0..1 }",
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
