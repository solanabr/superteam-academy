use crate::cache::BuildCache;
use std::fs;
use std::path::Path;
use std::sync::Arc;
use std::time::{Duration, SystemTime};
use tokio::time;
use tracing::{info, warn};

const SWEEP_INTERVAL_SECS: u64 = 300; // 5 minutes

pub fn spawn_cleanup_task(builds_dir: String, cache: Arc<BuildCache>, ttl_secs: u64) {
    tokio::spawn(async move {
        let mut interval = time::interval(Duration::from_secs(SWEEP_INTERVAL_SECS));
        let ttl = Duration::from_secs(ttl_secs);

        loop {
            interval.tick().await;
            let evicted = cache.evict_expired();
            let dirs_removed = clean_old_dirs(&builds_dir, ttl);

            if evicted > 0 || dirs_removed > 0 {
                info!(
                    cache_evicted = evicted,
                    dirs_removed = dirs_removed,
                    "Cleanup sweep completed"
                );
            }
        }
    });
}

fn clean_old_dirs(builds_dir: &str, ttl: Duration) -> usize {
    let dir = Path::new(builds_dir);
    if !dir.exists() {
        return 0;
    }

    let entries = match fs::read_dir(dir) {
        Ok(e) => e,
        Err(e) => {
            warn!(error = %e, "Failed to read builds directory");
            return 0;
        }
    };

    let mut removed = 0;
    for entry in entries.flatten() {
        let path = entry.path();
        if !path.is_dir() {
            continue;
        }

        let age = entry
            .metadata()
            .ok()
            .and_then(|m| m.modified().ok())
            .and_then(|t| SystemTime::now().duration_since(t).ok());

        if let Some(age) = age {
            if age > ttl {
                if let Err(e) = fs::remove_dir_all(&path) {
                    warn!(path = %path.display(), error = %e, "Failed to remove build dir");
                } else {
                    removed += 1;
                }
            }
        }
    }

    removed
}
