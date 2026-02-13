mod build;
mod cache;
mod cleanup;
mod config;
mod error;
mod metrics;
mod middlewares;
mod routes;

use std::net::{Ipv4Addr, SocketAddr};
use std::sync::Arc;

use axum::{
    extract::Extension,
    middleware,
    routing::{get, post},
    Router,
};
use config::LogFormat;
use tokio::net::TcpListener;
use tokio::signal;
use tower_governor::{
    governor::GovernorConfigBuilder, key_extractor::SmartIpKeyExtractor, GovernorLayer,
};
use tower_http::{
    compression::CompressionLayer,
    cors::{AllowOrigin, CorsLayer},
    limit::RequestBodyLimitLayer,
};
use tracing::info;

use crate::build::BuildService;
use crate::cache::BuildCache;
use crate::metrics::Metrics;
use crate::routes::health::HealthState;

#[tokio::main]
async fn main() {
    let config = config::Config::from_env();

    // Initialize tracing
    match config.log_format {
        LogFormat::Json => {
            tracing_subscriber::fmt()
                .json()
                .with_env_filter(tracing_subscriber::EnvFilter::from_default_env())
                .init();
        }
        LogFormat::Pretty => {
            tracing_subscriber::fmt()
                .pretty()
                .with_env_filter(tracing_subscriber::EnvFilter::from_default_env())
                .init();
        }
    }

    let config = Arc::new(config);

    // Shared state
    let cache = Arc::new(BuildCache::new(config.cache_ttl_secs));
    let metrics = Arc::new(Metrics::new());
    let build_service = Arc::new(BuildService::new(
        config.clone(),
        cache.clone(),
        metrics.clone(),
    ));
    let health_state = Arc::new(HealthState {
        cache: cache.clone(),
        metrics: metrics.clone(),
    });

    // Spawn cleanup background task
    cleanup::spawn_cleanup_task(
        config.builds_dir.clone(),
        cache.clone(),
        config.cache_ttl_secs,
    );

    // Rate limiting: per-IP via tower-governor with SmartIpKeyExtractor
    // (reads X-Forwarded-For/X-Real-Ip headers from Cloud Run's proxy, falls back to peer IP)
    // /build: 5 req/min (period = 12s between requests, burst = 5)
    let build_governor = GovernorConfigBuilder::default()
        .key_extractor(SmartIpKeyExtractor)
        .per_second(12)
        .burst_size(5)
        .finish()
        .expect("Invalid build rate limit config");

    // /deploy: 20 req/min (period = 3s between requests, burst = 20)
    let deploy_governor = GovernorConfigBuilder::default()
        .key_extractor(SmartIpKeyExtractor)
        .per_second(3)
        .burst_size(20)
        .finish()
        .expect("Invalid deploy rate limit config");

    // Build sub-routers with their own state types and rate limits.
    // Each sub-router is finalized with .with_state() so it becomes Router<()>.
    let build_routes = Router::new()
        .route("/build", post(routes::build::handle_build))
        .layer(GovernorLayer {
            config: build_governor.into(),
        })
        .with_state(build_service.clone());

    let deploy_routes = Router::new()
        .route("/deploy/{uuid}", get(routes::deploy::handle_deploy))
        .layer(GovernorLayer {
            config: deploy_governor.into(),
        })
        .with_state(build_service);

    let health_routes = Router::new()
        .route("/health", get(routes::health::handle_health))
        .with_state(health_state);

    let metrics_routes = Router::new()
        .route("/metrics", get(routes::metrics::handle_metrics))
        .with_state(metrics);

    // Merge all sub-routers into one Router<()>, then apply middleware layers.
    //
    // Axum applies layers in REVERSE order of declaration.
    // The last .layer() call runs FIRST on the request.
    // So we declare: auth → logging → request_id → compression → limit → cors
    // Which means request flow is: cors → limit → compression → request_id → logging → auth → handler
    let app = Router::new()
        .merge(build_routes)
        .merge(deploy_routes)
        .merge(health_routes)
        .merge(metrics_routes)
        .layer(middleware::from_fn(middlewares::auth::require_api_key))
        .layer(Extension(config.api_key.clone()))
        .layer(middleware::from_fn(middlewares::logging::log_request))
        .layer(middleware::from_fn(
            middlewares::request_id::inject_request_id,
        ))
        .layer(CompressionLayer::new())
        .layer(RequestBodyLimitLayer::new(512 * 1024))
        .layer(
            CorsLayer::new()
                .allow_origin(AllowOrigin::exact(
                    config
                        .allowed_origin
                        .parse()
                        .expect("Invalid ALLOWED_ORIGIN"),
                ))
                .allow_methods([
                    axum::http::Method::GET,
                    axum::http::Method::POST,
                    axum::http::Method::OPTIONS,
                ])
                .allow_headers([
                    axum::http::header::CONTENT_TYPE,
                    axum::http::header::HeaderName::from_static("x-api-key"),
                ]),
        );

    let addr = SocketAddr::from((Ipv4Addr::UNSPECIFIED, config.port));
    let listener = TcpListener::bind(addr).await.expect("Failed to bind");
    info!(port = config.port, "Solarium build server starting");

    axum::serve(
        listener,
        app.into_make_service_with_connect_info::<SocketAddr>(),
    )
    .with_graceful_shutdown(shutdown_signal())
    .await
    .expect("Server error");

    info!("Server shut down gracefully");
}

async fn shutdown_signal() {
    let ctrl_c = async {
        signal::ctrl_c()
            .await
            .expect("Failed to install Ctrl+C handler");
    };

    #[cfg(unix)]
    let terminate = async {
        signal::unix::signal(signal::unix::SignalKind::terminate())
            .expect("Failed to install SIGTERM handler")
            .recv()
            .await;
    };

    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();

    tokio::select! {
        _ = ctrl_c => info!("Received Ctrl+C, shutting down"),
        _ = terminate => info!("Received SIGTERM, shutting down"),
    }
}
