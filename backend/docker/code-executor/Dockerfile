FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive

# Base and Rust
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    build-essential \
    pkg-config \
    libssl-dev \
    && curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --default-toolchain stable \
    && . "$HOME/.cargo/env" \
    && rustup default stable

# Node.js LTS
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs

# TypeScript runner
RUN npm install -g tsx

WORKDIR /workspace

# Rust project
RUN mkdir -p /workspace/rust/src
COPY rust/Cargo.toml /workspace/rust/
COPY rust/src/main.rs /workspace/rust/src/

# TypeScript project (deps pre-installed; worker overwrites run.ts with user code)
RUN mkdir -p /workspace/typescript
COPY typescript/package.json /workspace/typescript/
COPY typescript/tsconfig.json /workspace/typescript/
COPY typescript/run.ts /workspace/typescript/

# Pre-build Rust (deps cached; only main.rs recompiles when worker overwrites it)
RUN cd /workspace/rust && . "$HOME/.cargo/env" && cargo build --release
# Pre-install TS deps (@solana/web3.js, anchor, etc.)
RUN cd /workspace/typescript && npm install

ENV PATH="/root/.cargo/bin:${PATH}"

CMD ["sleep", "infinity"]
