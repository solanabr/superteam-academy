use axum::{
    extract::{Path, State},
    http::header,
    response::IntoResponse,
};
use std::sync::Arc;

use crate::build::BuildService;
use crate::error::Result;

pub async fn handle_deploy(
    State(build_service): State<Arc<BuildService>>,
    Path(uuid): Path<String>,
) -> Result<impl IntoResponse> {
    let binary = build_service.get_binary(&uuid).await?;
    Ok(([(header::CONTENT_TYPE, "application/octet-stream")], binary))
}
