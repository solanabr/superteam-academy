#!/bin/bash
# DEPRECATED. The program is now Pinocchio-only (the Anchor crate and Anchor.toml
# were deleted). This script used to patch `declare_id!()` in the Anchor crate
# and the `Anchor.toml` programs table — both gone.
#
# Under Pinocchio the program id is baked into the binary at
#   onchain-academy/programs/onchain-academy-pinocchio/src/consts.rs
# For a self-owned instance, it is selected by the `fresh-id` cargo feature,
# which also carries the matching CONFIG_PDA + CONFIG_BUMP (a program-id-derived
# constant, so it must be recomputed whenever the id changes).
#
# To deploy your own instance, follow:
#   docs/DEPLOY-PROGRAM.md  §  "Fresh devnet instance (self-owned id)"
# which covers generating the program keypair, updating the three `fresh-id`
# constants in consts.rs, and building with `pnpm build:pinocchio:fresh`.
set -euo pipefail

cat >&2 <<'EOF'
update-program-id.sh is DEPRECATED — the program is Pinocchio-only now.

The Anchor crate and Anchor.toml this script patched no longer exist. The
Pinocchio program id lives in consts.rs and is selected via the `fresh-id`
cargo feature (with its own CONFIG_PDA/CONFIG_BUMP).

Deploy your own instance with the runbook in:
  docs/DEPLOY-PROGRAM.md  §  "Fresh devnet instance (self-owned id)"
EOF
exit 1
