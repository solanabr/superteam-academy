use parking_lot::RwLock;
use serde::Serialize;
use sha2::{Digest, Sha256};
use std::collections::HashMap;
use std::path::Path;
use std::time::{Duration, Instant};

pub type Files = Vec<[String; 2]>;

#[derive(Clone, Debug, Serialize)]
pub struct CachedBuild {
    pub uuid: String,
    pub success: bool,
    pub stderr: String,
    #[serde(skip)]
    pub created_at: Instant,
}

pub struct BuildCache {
    inner: RwLock<HashMap<[u8; 32], CachedBuild>>,
    ttl: Duration,
}

impl BuildCache {
    pub fn new(ttl_secs: u64) -> Self {
        Self {
            inner: RwLock::new(HashMap::new()),
            ttl: Duration::from_secs(ttl_secs),
        }
    }

    pub fn hash_files(files: &Files) -> [u8; 32] {
        let mut sorted: Vec<_> = files.iter().collect();
        sorted.sort_by(|a, b| a[0].cmp(&b[0]));

        let mut hasher = Sha256::new();
        for [path, content] in &sorted {
            hasher.update(path.as_bytes());
            hasher.update(b"\0");
            hasher.update(content.as_bytes());
            hasher.update(b"\0");
        }
        hasher.finalize().into()
    }

    pub fn get(&self, hash: &[u8; 32], builds_dir: &str) -> Option<CachedBuild> {
        let inner = self.inner.read();
        let entry = inner.get(hash)?;

        if entry.created_at.elapsed() > self.ttl {
            return None;
        }

        if entry.success {
            let so_path = Path::new(builds_dir).join(&entry.uuid).join("academy_program.so");
            if !so_path.exists() {
                return None;
            }
        }

        Some(entry.clone())
    }

    pub fn insert(&self, hash: [u8; 32], build: CachedBuild) {
        self.inner.write().insert(hash, build);
    }

    pub fn evict_expired(&self) -> usize {
        let mut inner = self.inner.write();
        let before = inner.len();
        inner.retain(|_, v| v.created_at.elapsed() <= self.ttl);
        before - inner.len()
    }

    pub fn len(&self) -> usize {
        self.inner.read().len()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn hash_is_deterministic() {
        let files = vec![
            ["/src/lib.rs".into(), "fn main() {}".into()],
            ["/src/state.rs".into(), "struct Foo;".into()],
        ];
        let h1 = BuildCache::hash_files(&files);
        let h2 = BuildCache::hash_files(&files);
        assert_eq!(h1, h2);
    }

    #[test]
    fn hash_is_order_independent() {
        let files_a = vec![
            ["/src/lib.rs".into(), "fn main() {}".into()],
            ["/src/state.rs".into(), "struct Foo;".into()],
        ];
        let files_b = vec![
            ["/src/state.rs".into(), "struct Foo;".into()],
            ["/src/lib.rs".into(), "fn main() {}".into()],
        ];
        assert_eq!(
            BuildCache::hash_files(&files_a),
            BuildCache::hash_files(&files_b)
        );
    }

    #[test]
    fn hash_changes_with_content() {
        let files_a = vec![["/src/lib.rs".into(), "v1".into()]];
        let files_b = vec![["/src/lib.rs".into(), "v2".into()]];
        assert_ne!(
            BuildCache::hash_files(&files_a),
            BuildCache::hash_files(&files_b)
        );
    }

    #[test]
    fn cache_insert_and_get() {
        let cache = BuildCache::new(60);
        let hash = [0u8; 32];
        let build = CachedBuild {
            uuid: "test".into(),
            success: false,
            stderr: "error".into(),
            created_at: Instant::now(),
        };
        cache.insert(hash, build);
        let result = cache.get(&hash, "/nonexistent");
        assert!(result.is_some());
        assert_eq!(result.unwrap().uuid, "test");
    }

    #[test]
    fn evict_expired_entries() {
        let cache = BuildCache::new(0);
        let hash = [0u8; 32];
        cache.insert(
            hash,
            CachedBuild {
                uuid: "old".into(),
                success: false,
                stderr: "".into(),
                created_at: Instant::now() - Duration::from_secs(1),
            },
        );
        let evicted = cache.evict_expired();
        assert_eq!(evicted, 1);
        assert_eq!(cache.len(), 0);
    }
}
