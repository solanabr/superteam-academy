use std::sync::atomic::{AtomicU64, Ordering};
use std::time::Instant;

pub struct Metrics {
    pub builds_success: AtomicU64,
    pub builds_error: AtomicU64,
    pub builds_timeout: AtomicU64,
    pub active_builds: AtomicU64,
    pub cache_hits: AtomicU64,
    pub cache_misses: AtomicU64,
    pub duration_le_30: AtomicU64,
    pub duration_le_60: AtomicU64,
    pub duration_le_120: AtomicU64,
    pub duration_sum_ms: AtomicU64,
    pub start_time: Instant,
}

impl Metrics {
    pub fn new() -> Self {
        Self {
            builds_success: AtomicU64::new(0),
            builds_error: AtomicU64::new(0),
            builds_timeout: AtomicU64::new(0),
            active_builds: AtomicU64::new(0),
            cache_hits: AtomicU64::new(0),
            cache_misses: AtomicU64::new(0),
            duration_le_30: AtomicU64::new(0),
            duration_le_60: AtomicU64::new(0),
            duration_le_120: AtomicU64::new(0),
            duration_sum_ms: AtomicU64::new(0),
            start_time: Instant::now(),
        }
    }

    pub fn record_build_duration(&self, secs: f64) {
        let ms = (secs * 1000.0) as u64;
        self.duration_sum_ms.fetch_add(ms, Ordering::Relaxed);
        if secs <= 30.0 {
            self.duration_le_30.fetch_add(1, Ordering::Relaxed);
        }
        if secs <= 60.0 {
            self.duration_le_60.fetch_add(1, Ordering::Relaxed);
        }
        if secs <= 120.0 {
            self.duration_le_120.fetch_add(1, Ordering::Relaxed);
        }
    }

    pub fn to_prometheus(&self) -> String {
        let success = self.builds_success.load(Ordering::Relaxed);
        let error = self.builds_error.load(Ordering::Relaxed);
        let timeout = self.builds_timeout.load(Ordering::Relaxed);
        let total = success + error + timeout;
        let duration_sum = self.duration_sum_ms.load(Ordering::Relaxed) as f64 / 1000.0;

        format!(
            r#"# HELP solarium_builds_total Total number of builds
# TYPE solarium_builds_total counter
solarium_builds_total{{status="success"}} {success}
solarium_builds_total{{status="error"}} {error}
solarium_builds_total{{status="timeout"}} {timeout}
# HELP solarium_build_duration_seconds Build duration histogram
# TYPE solarium_build_duration_seconds histogram
solarium_build_duration_seconds_bucket{{le="30"}} {}
solarium_build_duration_seconds_bucket{{le="60"}} {}
solarium_build_duration_seconds_bucket{{le="120"}} {}
solarium_build_duration_seconds_bucket{{le="+Inf"}} {total}
solarium_build_duration_seconds_count {total}
solarium_build_duration_seconds_sum {duration_sum}
# HELP solarium_cache_hits_total Cache hit count
# TYPE solarium_cache_hits_total counter
solarium_cache_hits_total {}
# HELP solarium_cache_misses_total Cache miss count
# TYPE solarium_cache_misses_total counter
solarium_cache_misses_total {}
"#,
            self.duration_le_30.load(Ordering::Relaxed),
            self.duration_le_60.load(Ordering::Relaxed),
            self.duration_le_120.load(Ordering::Relaxed),
            self.cache_hits.load(Ordering::Relaxed),
            self.cache_misses.load(Ordering::Relaxed),
        )
    }
}
