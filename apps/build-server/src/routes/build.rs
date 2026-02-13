use axum::{extract::State, response::IntoResponse, Json};
use serde::Deserialize;
use std::sync::Arc;

use crate::build::BuildService;
use crate::cache::Files;
use crate::error::Result;

#[derive(Deserialize)]
pub struct BuildRequest {
    pub files: Files,
    pub uuid: Option<String>,
    #[allow(dead_code)]
    pub flags: Option<BuildFlags>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
#[allow(dead_code)]
pub struct BuildFlags {
    pub seeds_feature: Option<bool>,
    pub no_docs: Option<bool>,
    pub safety_checks: Option<bool>,
}

pub async fn handle_build(
    State(build_service): State<Arc<BuildService>>,
    Json(payload): Json<BuildRequest>,
) -> Result<impl IntoResponse> {
    let result = build_service.build(payload.files, payload.uuid).await?;
    Ok(Json(result))
}
