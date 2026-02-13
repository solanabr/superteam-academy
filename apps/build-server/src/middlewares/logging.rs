use axum::{extract::Request, middleware::Next, response::Response};
use std::time::Instant;
use tracing::info;

use super::request_id::REQUEST_ID_HEADER;

pub async fn log_request(request: Request, next: Next) -> Response {
    let method = request.method().clone();
    let path = request.uri().path().to_string();
    let request_id = request
        .headers()
        .get(REQUEST_ID_HEADER)
        .and_then(|v| v.to_str().ok())
        .unwrap_or("-")
        .to_string();

    let start = Instant::now();
    let response = next.run(request).await;
    let duration_ms = start.elapsed().as_millis();

    info!(
        method = %method,
        path = %path,
        status = response.status().as_u16(),
        duration_ms = duration_ms,
        request_id = %request_id,
        "Request completed"
    );

    response
}
