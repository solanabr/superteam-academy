# -- Stage 1: Build the Axum server binary --
FROM --platform=linux/amd64 rust:1.85-bookworm AS builder

ARG AGAVE_VERSION="3.0.14"

WORKDIR /build
COPY Cargo.toml Cargo.lock ./
COPY src/ src/

ENV SOLANA_VERSION=${AGAVE_VERSION}
RUN cargo build --release

# -- Stage 2: Final image with Solana toolchain --
FROM --platform=linux/amd64 ubuntu:24.04

ARG AGAVE_VERSION="3.0.14"
ARG DEBIAN_FRONTEND="noninteractive"

# System dependencies for cargo-build-sbf
RUN apt-get update -qq && apt-get install -y -qq \
    curl build-essential pkg-config libssl-dev libudev-dev ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Non-root user
RUN useradd -m -s /bin/bash solarium
USER solarium
WORKDIR /home/solarium

# Install Rust toolchain (cargo is needed by cargo-build-sbf)
ENV RUSTUP_HOME="/home/solarium/.rustup"
ENV CARGO_HOME="/home/solarium/.cargo"
ENV PATH="${CARGO_HOME}/bin:/home/solarium/.local/share/solana/install/active_release/bin:${PATH}"
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --default-toolchain 1.85.0

# Install Agave toolchain (includes cargo-build-sbf)
RUN sh -c "$(curl -sSfL https://release.anza.xyz/v${AGAVE_VERSION}/install)"

# Verify both cargo and solana tools
RUN cargo --version && cargo-build-sbf --version && solana --version

# Copy template programs and pre-cache all crates
COPY --chown=solarium:solarium programs/ programs/
RUN cargo-build-sbf --manifest-path programs/Cargo.toml

# Copy server binary LAST (code changes don't bust toolchain cache)
COPY --from=builder /build/target/release/solarium-build-server .

# Create builds directory
RUN mkdir -p /tmp/solarium-builds

EXPOSE 8080

CMD ["./solarium-build-server"]
