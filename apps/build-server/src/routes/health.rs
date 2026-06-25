use axum::{extract::State, response::IntoResponse, Json};
use serde_json::json;
use std::sync::Arc;

use crate::metrics::Metrics;

pub struct HealthState {
    pub metrics: Arc<Metrics>,
}

/// Liveness probe. Intentionally PUBLIC (no API key) for Cloud Run / load-balancer
/// health checks, so it deliberately omits build telemetry (cache size, active /
/// total build counts) — those live on the API-key-gated `/metrics` endpoint.
pub async fn handle_health(State(health): State<Arc<HealthState>>) -> impl IntoResponse {
    Json(json!({
        "status": "ok",
        "version": env!("CARGO_PKG_VERSION"),
        "solana_version": option_env!("SOLANA_VERSION").unwrap_or("unknown"),
        "uptime_secs": health.metrics.start_time.elapsed().as_secs(),
    }))
}
