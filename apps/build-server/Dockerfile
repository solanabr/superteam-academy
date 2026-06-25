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

# Non-root user with a fixed numeric UID so Cloud Run / Kubernetes
# `runAsNonRoot` and `--no-allow-unauthenticated` policies can pin it.
RUN useradd --uid 10001 --create-home --shell /usr/sbin/nologin academy
USER 10001
WORKDIR /home/academy

# Install Rust toolchain (cargo is needed by cargo-build-sbf)
ENV RUSTUP_HOME="/home/academy/.rustup"
ENV CARGO_HOME="/home/academy/.cargo"
ENV PATH="${CARGO_HOME}/bin:/home/academy/.local/share/solana/install/active_release/bin:${PATH}"
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --default-toolchain 1.85.0

# Install Agave toolchain (includes cargo-build-sbf)
RUN sh -c "$(curl -sSfL https://release.anza.xyz/v${AGAVE_VERSION}/install)"

# Verify both cargo and solana tools
RUN cargo --version && cargo-build-sbf --version && solana --version

# Copy template programs and pre-cache all crates
COPY --chown=academy:academy programs/ programs/
RUN cargo-build-sbf --manifest-path programs/Cargo.toml

# Copy server binary LAST (code changes don't bust toolchain cache)
COPY --chown=academy:academy --from=builder /build/target/release/academy-build-server .

# Create builds directory.
# NOTE: /tmp is the ONLY path the server writes to at runtime (BUILDS_DIR).
# When the container runs with a read-only root filesystem (recommended — see
# deploy/cloudbuild.yaml), /tmp must be mounted as a writable in-memory volume.
RUN mkdir -p /tmp/academy-builds

# Defense-in-depth: strip every setuid/setgid bit baked into the image so a
# read-only root FS + no-new-privileges sandbox cannot be escalated through a
# stray privileged binary. Runs as root via a transient stage, then drops back.
USER root
RUN find / -xdev -perm /6000 -type f -exec chmod a-s {} + 2>/dev/null || true
# Verify the strip actually worked: fail the image build if any setuid/setgid
# binary remains, so a future base-image change that breaks the strip above
# cannot pass unnoticed. Runs as root so the FS walk can traverse every dir.
RUN test -z "$(find / -xdev -type f -perm /6000 2>/dev/null)" \
    || (echo 'ERROR: setuid/setgid binaries remain after strip:' \
        && find / -xdev -type f -perm /6000 2>/dev/null && exit 1)
USER 10001

EXPOSE 8080

CMD ["./academy-build-server"]
