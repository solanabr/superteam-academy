use crate::cache::{BuildCache, CachedBuild, Files};
use crate::config::Config;
use crate::error::AppError;
use crate::metrics::Metrics;

use anyhow::anyhow;
use base64::{engine::general_purpose::STANDARD, Engine};
use regex::Regex;
use serde::Serialize;
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::{Arc, OnceLock};
use std::time::{Duration, Instant};
use tokio::process::Command;
use tokio::sync::Semaphore;
use tracing::info;
use uuid::Uuid;

const MAX_FILE_COUNT: usize = 64;
const MAX_FILE_SIZE: usize = 100 * 1024; // 100KB
const MAX_TOTAL_SIZE: usize = 500 * 1024; // 500KB
const MAX_PATH_LENGTH: usize = 128;

const BLOCKED_PATTERNS: &[&str] = &[
    "std::process",
    "std::fs::",
    "std::net::",
    "std::env::",
    "Command::new",
    "include_bytes!",
    "include_str!",
    "env!(",
    "option_env!",
    "proc_macro",
];

#[derive(Serialize, Clone, Debug)]
pub struct BuildResult {
    pub success: bool,
    pub stderr: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub uuid: Option<String>,
    pub idl: Option<serde_json::Value>,
    /// Base64-encoded .so binary, included in the build response to avoid
    /// Cloud Run multi-instance routing issues with separate /deploy requests.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub binary_b64: Option<String>,
}

/// RAII guard that decrements active_builds counter on drop.
struct ActiveBuildGuard<'a>(&'a AtomicU64);

impl<'a> ActiveBuildGuard<'a> {
    fn new(counter: &'a AtomicU64) -> Self {
        counter.fetch_add(1, Ordering::Relaxed);
        Self(counter)
    }
}

impl Drop for ActiveBuildGuard<'_> {
    fn drop(&mut self) {
        self.0.fetch_sub(1, Ordering::Relaxed);
    }
}

pub struct BuildService {
    config: Arc<Config>,
    cache: Arc<BuildCache>,
    metrics: Arc<Metrics>,
    semaphore: Arc<Semaphore>,
}

impl BuildService {
    pub fn new(config: Arc<Config>, cache: Arc<BuildCache>, metrics: Arc<Metrics>) -> Self {
        let semaphore = Arc::new(Semaphore::new(config.max_concurrent_builds));
        Self {
            config,
            cache,
            metrics,
            semaphore,
        }
    }

    /// Validate file paths and contents.
    fn validate_files(files: &Files) -> Result<(), AppError> {
        if files.is_empty() {
            return Err(AppError::InvalidRequest("No files provided".into()));
        }
        if files.len() > MAX_FILE_COUNT {
            return Err(AppError::InvalidRequest(format!(
                "Exceeded maximum file count ({MAX_FILE_COUNT})"
            )));
        }

        static ALLOWED_REGEX: OnceLock<Regex> = OnceLock::new();
        let allowed_regex =
            ALLOWED_REGEX.get_or_init(|| Regex::new(r"^/src/[\w/-]+\.rs$").unwrap());

        let mut total_size: usize = 0;

        for [path, content] in files {
            if path.len() > MAX_PATH_LENGTH {
                return Err(AppError::InvalidRequest(format!(
                    "Path too long: {path} ({} chars, max {MAX_PATH_LENGTH})",
                    path.len()
                )));
            }
            if !allowed_regex.is_match(path) {
                return Err(AppError::InvalidRequest(format!(
                    "Invalid path: {path} (must match /src/<name>.rs)"
                )));
            }
            if path.contains("..") || path.contains("//") {
                return Err(AppError::InvalidRequest(format!(
                    "Path contains forbidden sequence: {path}"
                )));
            }
            if content.len() > MAX_FILE_SIZE {
                return Err(AppError::InvalidRequest(format!(
                    "File too large: {path} ({}KB, max {}KB)",
                    content.len() / 1024,
                    MAX_FILE_SIZE / 1024
                )));
            }
            total_size += content.len();
        }

        if total_size > MAX_TOTAL_SIZE {
            return Err(AppError::InvalidRequest(format!(
                "Total payload too large ({}KB, max {}KB)",
                total_size / 1024,
                MAX_TOTAL_SIZE / 1024
            )));
        }

        Ok(())
    }

    /// Best-effort content filter. The SBF target is the real sandbox.
    fn check_blocked_patterns(files: &Files) -> Result<(), AppError> {
        for [path, content] in files {
            for pattern in BLOCKED_PATTERNS {
                if content.contains(pattern) {
                    return Err(AppError::InvalidRequest(format!(
                        "Blocked pattern '{}' found in {}. \
                         Solana programs cannot use host system APIs.",
                        pattern,
                        path.trim_start_matches('/')
                    )));
                }
            }
        }
        Ok(())
    }

    /// Set up build directory with template Cargo.toml, pre-built target/, and student files.
    fn setup_build_dir(config: &Config, uuid: &str, files: &Files) -> Result<PathBuf, AppError> {
        let build_dir = Path::new(&config.builds_dir).join(uuid);
        let src_dir = build_dir.join("src");
        fs::create_dir_all(&src_dir)
            .map_err(|e| AppError::Internal(anyhow!("Failed to create build dir: {e}")))?;

        // Copy Cargo.toml verbatim — the template already uses path = "src/lib.rs"
        // so the copied file is byte-identical to the pre-built one, preserving
        // all cargo fingerprints for dependency crates.
        let template_manifest = Path::new(&config.programs_dir).join("Cargo.toml");
        fs::copy(&template_manifest, build_dir.join("Cargo.toml"))
            .map_err(|e| AppError::Internal(anyhow!("Failed to copy template Cargo.toml: {e}")))?;

        // Copy Cargo.lock for --offline
        let template_lock = Path::new(&config.programs_dir).join("Cargo.lock");
        if template_lock.exists() {
            fs::copy(&template_lock, build_dir.join("Cargo.lock"))?;
        }

        // Copy pre-built target/ from the template so dependency crates are
        // already compiled. Uses --reflink=auto for CoW on supported FS,
        // falling back to regular copy on tmpfs. This turns a ~180s full
        // rebuild into a ~10-15s incremental compile of just the student crate.
        let template_target = Path::new(&config.programs_dir).join("target");
        if template_target.is_dir() {
            let build_target = build_dir.join("target");
            let status = std::process::Command::new("cp")
                .args(["--reflink=auto", "-a"])
                .arg(&template_target)
                .arg(&build_target)
                .status()
                .map_err(|e| AppError::Internal(anyhow!("Failed to run cp: {e}")))?;
            if !status.success() {
                return Err(AppError::Internal(anyhow!(
                    "Failed to copy template target directory (exit {})",
                    status.code().unwrap_or(-1)
                )));
            }
        }

        // Write student files
        for [path, content] in files {
            let relative_path = path.trim_start_matches('/');
            let file_path = build_dir.join(relative_path);
            if let Some(parent) = file_path.parent() {
                fs::create_dir_all(parent)?;
            }
            fs::write(&file_path, content)?;
        }

        Ok(build_dir)
    }

    /// Run cargo-build-sbf with timeout. Returns (success, stderr).
    async fn run_cargo_build_sbf(config: &Config, build_dir: &Path) -> (bool, String) {
        use tokio::io::AsyncReadExt;

        let manifest_path = build_dir.join("Cargo.toml");
        let manifest_str = match manifest_path.to_str() {
            Some(s) => s.to_owned(),
            None => return (false, "Build path contains non-UTF8 characters".into()),
        };
        let build_dir_str = match build_dir.to_str() {
            Some(s) => s.to_owned(),
            None => return (false, "Build path contains non-UTF8 characters".into()),
        };

        let mut child = match Command::new("cargo-build-sbf")
            .args([
                "--manifest-path",
                &manifest_str,
                "--sbf-out-dir",
                &build_dir_str,
                "--offline",
            ])
            .stdout(std::process::Stdio::piped())
            .stderr(std::process::Stdio::piped())
            .spawn()
        {
            Ok(c) => c,
            Err(e) => return (false, format!("Failed to start cargo-build-sbf: {e}")),
        };

        // Read stderr concurrently to prevent pipe buffer deadlock
        let stderr_pipe = child.stderr.take();
        let stderr_task = tokio::spawn(async move {
            let mut buf = Vec::new();
            if let Some(mut pipe) = stderr_pipe {
                let _ = pipe.read_to_end(&mut buf).await;
            }
            String::from_utf8_lossy(&buf).to_string()
        });

        let timeout_duration = Duration::from_secs(config.build_timeout_secs);

        match tokio::time::timeout(timeout_duration, child.wait()).await {
            Ok(Ok(_status)) => {
                let stderr = stderr_task.await.unwrap_or_default();
                let has_error =
                    stderr.contains("error: could not compile") || stderr.contains("error[");
                (!has_error, stderr)
            }
            Ok(Err(e)) => (false, format!("Error waiting for build: {e}")),
            Err(_) => {
                let _ = child.kill().await;
                let _ = stderr_task.await;
                (
                    false,
                    format!(
                        "Build timed out after {} seconds. \
                         Your program may be too complex or have circular dependencies.",
                        config.build_timeout_secs
                    ),
                )
            }
        }
    }

    /// Main build entry point.
    pub async fn build(
        &self,
        files: Files,
        existing_uuid: Option<String>,
    ) -> Result<BuildResult, AppError> {
        // 1. Validate
        Self::validate_files(&files)?;
        Self::check_blocked_patterns(&files)?;

        // 2. Check cache
        let file_hash = BuildCache::hash_files(&files);
        if let Some(cached) = self.cache.get(&file_hash, &self.config.builds_dir) {
            self.metrics.cache_hits.fetch_add(1, Ordering::Relaxed);
            info!(uuid = %cached.uuid, "Cache hit");
            // Include binary for cache hits too (binary is on the same instance)
            let binary_b64 = if cached.success {
                let so_path = Path::new(&self.config.builds_dir)
                    .join(&cached.uuid)
                    .join("academy_program.so");
                tokio::fs::read(&so_path)
                    .await
                    .ok()
                    .map(|bytes| STANDARD.encode(&bytes))
            } else {
                None
            };
            return Ok(BuildResult {
                success: cached.success,
                stderr: cached.stderr,
                uuid: Some(cached.uuid),
                idl: None,
                binary_b64,
            });
        }
        self.metrics.cache_misses.fetch_add(1, Ordering::Relaxed);

        // 3. Resolve UUID
        let (uuid, respond_with_uuid) = match existing_uuid {
            Some(ref u) => {
                Uuid::try_parse(u).map_err(|_| AppError::InvalidRequest("Invalid UUID".into()))?;
                (u.clone(), false)
            }
            None => (Uuid::new_v4().to_string(), true),
        };

        // 4. Acquire semaphore
        let _permit = self
            .semaphore
            .clone()
            .try_acquire_owned()
            .map_err(|_| AppError::QueueFull)?;

        // 5. Setup build directory (synchronous FS work in spawn_blocking)
        let config = self.config.clone();
        let files_clone = files.clone();
        let uuid_clone = uuid.clone();
        let builds_dir = config.builds_dir.clone();
        let build_dir = tokio::task::spawn_blocking(move || {
            match Self::setup_build_dir(&config, &uuid_clone, &files_clone) {
                Ok(dir) => Ok(dir),
                Err(e) => {
                    // Clean up partial directory on setup failure
                    let partial = Path::new(&builds_dir).join(&uuid_clone);
                    let _ = fs::remove_dir_all(&partial);
                    Err(e)
                }
            }
        })
        .await
        .map_err(|e| AppError::Internal(anyhow!("Setup task panicked: {e}")))??;

        // 6. Run build (async subprocess — no spawn_blocking needed)
        let _active_guard = ActiveBuildGuard::new(&self.metrics.active_builds);
        let start = Instant::now();

        let (success, stderr) = Self::run_cargo_build_sbf(&self.config, &build_dir).await;
        let duration = start.elapsed().as_secs_f64();

        // 7. Record metrics
        self.metrics.record_build_duration(duration);
        if success {
            self.metrics.builds_success.fetch_add(1, Ordering::Relaxed);
        } else if stderr.contains("timed out") {
            self.metrics.builds_timeout.fetch_add(1, Ordering::Relaxed);
        } else {
            self.metrics.builds_error.fetch_add(1, Ordering::Relaxed);
        }

        info!(uuid = %uuid, success, duration_secs = duration, "Build completed");

        // 8. Read binary before any cleanup (same instance has the file)
        let binary_b64 = if success {
            let so_path = build_dir.join("academy_program.so");
            match tokio::fs::read(&so_path).await {
                Ok(bytes) => Some(STANDARD.encode(&bytes)),
                Err(e) => {
                    tracing::warn!(uuid = %uuid, error = %e, "Failed to read .so for inline response");
                    None
                }
            }
        } else {
            None
        };

        // 9. Clean up build directory on failure
        if !success {
            let dir = build_dir.clone();
            let _ = tokio::task::spawn_blocking(move || fs::remove_dir_all(&dir)).await;
        }

        // 10. Cache result
        self.cache.insert(
            file_hash,
            CachedBuild {
                uuid: uuid.clone(),
                success,
                stderr: stderr.clone(),
                created_at: Instant::now(),
            },
        );

        Ok(BuildResult {
            success,
            stderr,
            uuid: if respond_with_uuid { Some(uuid) } else { None },
            idl: None, // IDL parsing deferred (no anchor-syn)
            binary_b64,
        })
    }

    /// Read compiled .so binary for deployment.
    pub async fn get_binary(&self, uuid: &str) -> Result<Vec<u8>, AppError> {
        Uuid::try_parse(uuid).map_err(|_| AppError::InvalidRequest("Invalid UUID".into()))?;

        let binary_path = Path::new(&self.config.builds_dir)
            .join(uuid)
            .join("academy_program.so");

        tokio::fs::read(&binary_path)
            .await
            .map_err(|e| match e.kind() {
                std::io::ErrorKind::NotFound => {
                    AppError::NotFound("Program not built or build artifacts expired".into())
                }
                _ => AppError::Internal(e.into()),
            })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn make_files(paths_and_contents: &[(&str, &str)]) -> Files {
        paths_and_contents
            .iter()
            .map(|(p, c)| [p.to_string(), c.to_string()])
            .collect()
    }

    #[test]
    fn validate_rejects_empty_files() {
        assert!(BuildService::validate_files(&vec![]).is_err());
    }

    #[test]
    fn validate_rejects_too_many_files() {
        let files: Files = (0..65)
            .map(|i| [format!("/src/f{i}.rs"), "// ok".into()])
            .collect();
        assert!(BuildService::validate_files(&files).is_err());
    }

    #[test]
    fn validate_rejects_path_traversal() {
        assert!(
            BuildService::validate_files(&make_files(&[("/src/../etc/passwd", "bad")])).is_err()
        );
    }

    #[test]
    fn validate_rejects_double_slash() {
        assert!(BuildService::validate_files(&make_files(&[("/src//lib.rs", "ok")])).is_err());
    }

    #[test]
    fn validate_rejects_non_rs_files() {
        assert!(BuildService::validate_files(&make_files(&[("/src/lib.toml", "ok")])).is_err());
    }

    #[test]
    fn validate_rejects_oversized_file() {
        let big = "x".repeat(MAX_FILE_SIZE + 1);
        assert!(BuildService::validate_files(&make_files(&[("/src/lib.rs", &big)])).is_err());
    }

    #[test]
    fn validate_accepts_valid_files() {
        let files = make_files(&[
            ("/src/lib.rs", "use solana_program;"),
            ("/src/state.rs", "struct Foo;"),
        ]);
        assert!(BuildService::validate_files(&files).is_ok());
    }

    #[test]
    fn blocked_pattern_std_process() {
        let files = make_files(&[("/src/lib.rs", "use std::process::Command;")]);
        let result = BuildService::check_blocked_patterns(&files);
        assert!(result.is_err());
        assert!(format!("{}", result.unwrap_err()).contains("std::process"));
    }

    #[test]
    fn blocked_pattern_std_fs() {
        assert!(BuildService::check_blocked_patterns(&make_files(&[(
            "/src/lib.rs",
            "use std::fs::read;"
        )]))
        .is_err());
    }

    #[test]
    fn allowed_content_passes() {
        let files = make_files(&[(
            "/src/lib.rs",
            "use anchor_lang::prelude::*;\ndeclare_id!(\"...\");",
        )]);
        assert!(BuildService::check_blocked_patterns(&files).is_ok());
    }
}
