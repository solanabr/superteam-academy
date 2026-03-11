use axum::{extract::Request, http::StatusCode, middleware::Next, response::Response, Json};
use serde_json::json;
use subtle::ConstantTimeEq;

/// API key middleware. Checks X-API-Key header against the key stored in request extensions.
/// Skips auth for /health and /metrics endpoints.
pub async fn require_api_key(
    request: Request,
    next: Next,
) -> Result<Response, (StatusCode, Json<serde_json::Value>)> {
    let path = request.uri().path();

    if path == "/health" || path == "/metrics" {
        return Ok(next.run(request).await);
    }

    let expected_key = request
        .extensions()
        .get::<String>()
        .cloned()
        .unwrap_or_default();

    let provided_key = request
        .headers()
        .get("x-api-key")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("");

    let keys_match = provided_key.len() == expected_key.len()
        && bool::from(provided_key.as_bytes().ct_eq(expected_key.as_bytes()));

    if provided_key.is_empty() || !keys_match {
        return Err((
            StatusCode::UNAUTHORIZED,
            Json(json!({ "error": "Invalid or missing API key" })),
        ));
    }

    Ok(next.run(request).await)
}
