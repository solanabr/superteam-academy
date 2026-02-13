use axum::{extract::State, http::header, response::IntoResponse};
use std::sync::Arc;

use crate::metrics::Metrics;

pub async fn handle_metrics(State(metrics): State<Arc<Metrics>>) -> impl IntoResponse {
    (
        [(header::CONTENT_TYPE, "text/plain; charset=utf-8")],
        metrics.to_prometheus(),
    )
}
