# XP Metadata Instructions

Two instructions were added to the onchain program to manage Token-2022 metadata on the XP mint.

## Why

The original program creates the XP mint as a Token-2022 token with `NonTransferable` and `PermanentDelegate` extensions but **without on-chain metadata**. Without metadata, wallets like Phantom and Backpack display the token as an unknown asset with no name, symbol, or image. These instructions solve that.

## New Instructions

### `init_xp_metadata`

Initializes metadata on the XP mint using the SPL Token Metadata Interface (`spl_token_metadata_interface::initialize`).

**Parameters:**
- `name` — Token display name (e.g. "Academy XP")
- `symbol` — Token symbol (e.g. "AXP")
- `uri` — URI pointing to off-chain JSON metadata (e.g. Arweave link with image, description)

**What it does:**
1. Calculates extra space needed for the metadata TLV entry on the mint account
2. Transfers lamports from the authority to cover the additional rent
3. Invokes the Token Metadata Interface `initialize` instruction via CPI, signed by the Config PDA

**Access control:** Authority must match `config.authority`.

### `update_xp_metadata`

Updates individual metadata fields on the XP mint after initialization.

**Parameters:**
- `field` — Field to update: `"name"`, `"symbol"`, `"uri"`, or any custom key
- `value` — New value for the field

**What it does:**
1. Funds additional rent if the new value requires more space
2. Invokes the Token Metadata Interface `update_field` instruction via CPI, signed by the Config PDA

**Access control:** Authority must match `config.authority`.

## Dependency Added

```toml
spl-token-metadata-interface = "0.5"
```

## Impact

Non-breaking, additive change. All existing instructions and account structures remain identical. The program went from 16 to 18 instructions.
