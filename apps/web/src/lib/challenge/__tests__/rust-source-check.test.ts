import { describe, expect, it } from "vitest";
import { hasDisallowedRustConstruct, rustCodeOnly } from "../rust-source-check";

describe("hasDisallowedRustConstruct", () => {
  it.each([
    'const K: &str = env ! ("K");',
    'const K: &str = env /* gap */ ! ("K");',
    'const K: &str = core::env!["K"];',
    "use std::include_str as s;",
    "use std::{include_str as s};",
    'const K: &str = r#env!("K");',
    "macro_rules! m { () => {} }",
    "macro_rules! m { () => {} }",
    'extern "C" { fn f(); }',
    "extern crate core as std;",
    "impl PartialEq for Y { }",
    "impl core::cmp::PartialEq<i64> for Y { }",
    "use std::cmp::PartialEq as Q;",
    "impl<T> std::cmp::PartialEq<T> for Y { }",
    "impl<T: Clone> PartialEq<T> for Y<T> { }",
    // a literal or comment that looks open doesn't hide what follows it
    "const Q: char = '\"'; macro_rules! m { () => {} }",
    'const S: &str = "//"; macro_rules! m { () => {} }',
    'const S: &str = "/*"; macro_rules! m { () => {} }',
    'const S: &str = r#"a"#; macro_rules! m { () => {} }',
    'const S: &[u8] = b"a\\""; macro_rules! m { () => {} }',
    "const N: u8 = b'\"'; macro_rules! m { () => {} }",
    "fn f<'a>(x: &'a str) -> &'a str { x } macro_rules! m { () => {} }",
    "/* a /* nested */ b */ macro_rules! m { () => {} }",
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
    "use std::{fmt, io::{self, Write}};",
    "use std::io::{self, Read};",
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
