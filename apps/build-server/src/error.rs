use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde_json::json;
use tracing::error;

pub type Result<T> = std::result::Result<T, AppError>;

#[derive(Debug)]
#[allow(dead_code)]
pub enum AppError {
    InvalidRequest(String),
    Unauthorized,
    NotFound(String),
    QueueFull,
    Internal(anyhow::Error),
}

impl std::fmt::Display for AppError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::InvalidRequest(msg) => write!(f, "Bad request: {msg}"),
            Self::Unauthorized => write!(f, "Unauthorized"),
            Self::NotFound(msg) => write!(f, "Not found: {msg}"),
            Self::QueueFull => write!(f, "Build queue full"),
            Self::Internal(e) => write!(f, "Internal error: {e}"),
        }
    }
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, message) = match &self {
            AppError::InvalidRequest(msg) => (StatusCode::BAD_REQUEST, msg.clone()),
            AppError::Unauthorized => (
                StatusCode::UNAUTHORIZED,
                "Invalid or missing API key".into(),
            ),
            AppError::NotFound(msg) => (StatusCode::NOT_FOUND, msg.clone()),
            AppError::QueueFull => (
                StatusCode::SERVICE_UNAVAILABLE,
                "Build queue is full, try again later".into(),
            ),
            AppError::Internal(e) => {
                error!(error = %e, "Internal server error");
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "Internal server error".into(),
                )
            }
        };

        (status, Json(json!({ "error": message }))).into_response()
    }
}

impl From<anyhow::Error> for AppError {
    fn from(e: anyhow::Error) -> Self {
        AppError::Internal(e)
    }
}

impl From<std::io::Error> for AppError {
    fn from(e: std::io::Error) -> Self {
        AppError::Internal(e.into())
    }
}
