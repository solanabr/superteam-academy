use std::env;

#[derive(Debug, Clone)]
pub struct Config {
    pub api_key: String,
    pub allowed_origin: String,
    pub port: u16,
    pub max_concurrent_builds: usize,
    pub build_timeout_secs: u64,
    pub cache_ttl_secs: u64,
    pub log_format: LogFormat,
    pub programs_dir: String,
    pub builds_dir: String,
}

#[derive(Debug, Clone, PartialEq)]
pub enum LogFormat {
    Json,
    Pretty,
}

impl Config {
    pub fn from_env() -> Self {
        let api_key = env::var("ACADEMY_API_KEY").expect("ACADEMY_API_KEY must be set");
        assert!(!api_key.is_empty(), "ACADEMY_API_KEY must not be empty");

        Self {
            api_key,
            allowed_origin: env::var("ALLOWED_ORIGIN")
                .unwrap_or_else(|_| "https://solarium.courses".into()),
            port: env::var("PORT")
                .unwrap_or_else(|_| "8080".into())
                .parse()
                .expect("PORT must be a valid u16"),
            max_concurrent_builds: env::var("MAX_CONCURRENT_BUILDS")
                .unwrap_or_else(|_| "2".into())
                .parse()
                .expect("MAX_CONCURRENT_BUILDS must be a valid usize"),
            build_timeout_secs: env::var("BUILD_TIMEOUT_SECS")
                .unwrap_or_else(|_| "120".into())
                .parse()
                .expect("BUILD_TIMEOUT_SECS must be a valid u64"),
            cache_ttl_secs: env::var("CACHE_TTL_SECS")
                .unwrap_or_else(|_| "1800".into())
                .parse()
                .expect("CACHE_TTL_SECS must be a valid u64"),
            log_format: match env::var("LOG_FORMAT").unwrap_or_default().as_str() {
                "pretty" => LogFormat::Pretty,
                _ => LogFormat::Json,
            },
            programs_dir: env::var("PROGRAMS_DIR").unwrap_or_else(|_| "programs".into()),
            builds_dir: env::var("BUILDS_DIR").unwrap_or_else(|_| "/tmp/academy-builds".into()),
        }
    }
}
