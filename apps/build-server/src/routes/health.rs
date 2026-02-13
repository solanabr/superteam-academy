use axum::{extract::State, response::IntoResponse, Json};
use serde_json::json;
use std::sync::atomic::Ordering;
use std::sync::Arc;

use crate::cache::BuildCache;
use crate::metrics::Metrics;

pub struct HealthState {
    pub cache: Arc<BuildCache>,
    pub metrics: Arc<Metrics>,
}

pub async fn handle_health(State(health): State<Arc<HealthState>>) -> impl IntoResponse {
    let active = health.metrics.active_builds.load(Ordering::Relaxed);
    Json(json!({
        "status": "ok",
        "version": env!("CARGO_PKG_VERSION"),
        "solana_version": option_env!("SOLANA_VERSION").unwrap_or("unknown"),
        "uptime_secs": health.metrics.start_time.elapsed().as_secs(),
        "cache_entries": health.cache.len(),
        "active_builds": active,
        "total_builds": health.metrics.builds_success.load(Ordering::Relaxed)
            + health.metrics.builds_error.load(Ordering::Relaxed)
            + health.metrics.builds_timeout.load(Ordering::Relaxed),
    }))
}
