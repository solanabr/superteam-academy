//! Integration tests for the Superteam Academy build server.
//!
//! These tests run against a live server instance.
//! All tests are #[ignore]d by default — run with:
//!   BASE_URL=http://localhost:8080 cargo test --test integration_test -- --ignored

const API_KEY: &str = "test-api-key-for-integration-tests";

fn base_url() -> String {
    std::env::var("BASE_URL").unwrap_or_else(|_| "http://localhost:8080".into())
}

fn client() -> reqwest::blocking::Client {
    reqwest::blocking::Client::new()
}

#[test]
#[ignore]
fn test_health_no_auth() {
    let resp = client()
        .get(format!("{}/health", base_url()))
        .send()
        .unwrap();
    assert_eq!(resp.status(), 200);
    let body: serde_json::Value = resp.json().unwrap();
    assert_eq!(body["status"], "ok");
}

#[test]
#[ignore]
fn test_build_without_auth_returns_401() {
    let resp = client()
        .post(format!("{}/build", base_url()))
        .json(&serde_json::json!({
            "files": [["/src/lib.rs", "fn main() {}"]]
        }))
        .send()
        .unwrap();
    assert_eq!(resp.status(), 401);
}

#[test]
#[ignore]
fn test_build_rejects_blocked_pattern() {
    let resp = client()
        .post(format!("{}/build", base_url()))
        .header("x-api-key", API_KEY)
        .json(&serde_json::json!({
            "files": [["/src/lib.rs", "use std::process::Command;\nfn main() { Command::new(\"ls\"); }"]]
        }))
        .send()
        .unwrap();
    assert_eq!(resp.status(), 400);
    let body: serde_json::Value = resp.json().unwrap();
    assert!(body["error"].as_str().unwrap().contains("std::process"));
}

#[test]
#[ignore]
fn test_build_rejects_path_traversal() {
    let resp = client()
        .post(format!("{}/build", base_url()))
        .header("x-api-key", API_KEY)
        .json(&serde_json::json!({
            "files": [["/src/../etc/passwd", "bad"]]
        }))
        .send()
        .unwrap();
    assert_eq!(resp.status(), 400);
}

#[test]
#[ignore]
fn test_build_native_program() {
    let code = include_str!("fixtures/hello_world.rs");
    let resp = client()
        .post(format!("{}/build", base_url()))
        .header("x-api-key", API_KEY)
        .json(&serde_json::json!({
            "files": [["/src/lib.rs", code]]
        }))
        .send()
        .unwrap();
    assert_eq!(resp.status(), 200);
    let body: serde_json::Value = resp.json().unwrap();
    assert_eq!(body["success"], true);
    assert!(body["uuid"].is_string());
}

#[test]
#[ignore]
fn test_build_anchor_program() {
    let code = include_str!("fixtures/anchor_counter.rs");
    let resp = client()
        .post(format!("{}/build", base_url()))
        .header("x-api-key", API_KEY)
        .json(&serde_json::json!({
            "files": [["/src/lib.rs", code]]
        }))
        .send()
        .unwrap();
    assert_eq!(resp.status(), 200);
    let body: serde_json::Value = resp.json().unwrap();
    assert_eq!(body["success"], true);
}

#[test]
#[ignore]
fn test_build_compile_error() {
    let resp = client()
        .post(format!("{}/build", base_url()))
        .header("x-api-key", API_KEY)
        .json(&serde_json::json!({
            "files": [["/src/lib.rs", "fn main() { let x: i32 = \"not a number\"; }"]]
        }))
        .send()
        .unwrap();
    assert_eq!(resp.status(), 200);
    let body: serde_json::Value = resp.json().unwrap();
    assert_eq!(body["success"], false);
    assert!(body["stderr"].as_str().unwrap().contains("error"));
}

#[test]
#[ignore]
fn test_deploy_returns_binary() {
    let code = include_str!("fixtures/hello_world.rs");
    let build_resp = client()
        .post(format!("{}/build", base_url()))
        .header("x-api-key", API_KEY)
        .json(&serde_json::json!({
            "files": [["/src/lib.rs", code]]
        }))
        .send()
        .unwrap();
    let build_body: serde_json::Value = build_resp.json().unwrap();
    let uuid = build_body["uuid"].as_str().unwrap();

    let deploy_resp = client()
        .get(format!("{}/deploy/{}", base_url(), uuid))
        .header("x-api-key", API_KEY)
        .send()
        .unwrap();
    assert_eq!(deploy_resp.status(), 200);
    let binary = deploy_resp.bytes().unwrap();
    assert!(!binary.is_empty());
    assert_eq!(&binary[..4], b"\x7fELF");
}

#[test]
#[ignore]
fn test_deploy_not_found() {
    let resp = client()
        .get(format!(
            "{}/deploy/00000000-0000-0000-0000-000000000000",
            base_url()
        ))
        .header("x-api-key", API_KEY)
        .send()
        .unwrap();
    assert_eq!(resp.status(), 404);
}

#[test]
#[ignore]
fn test_metrics_endpoint() {
    let resp = client()
        .get(format!("{}/metrics", base_url()))
        .send()
        .unwrap();
    assert_eq!(resp.status(), 200);
    let body = resp.text().unwrap();
    assert!(body.contains("academy_builds_total"));
}
