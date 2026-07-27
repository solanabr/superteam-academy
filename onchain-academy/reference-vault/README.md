# Devnet Reference Vault — frozen curriculum artifact (#599 / spec item 10, PB-4)

A minimal, **frozen** (upgrade authority = none) devnet deployment of the canonical
`VaultState` program that C2 (struct/bytes lessons) and C3 (PDA lessons) teach and C4
reads. Its account layout is a **curriculum-wide decision** — courses may rely on these
exact bytes and this fixed address. Deployed and frozen 2026-07-27.

## Coordinates

| Field                   | Value                                                                                           |
| ----------------------- | ----------------------------------------------------------------------------------------------- |
| Program ID (fixed)      | `D7ZFoWvEG5NBnkJy6iC98rhwj2qhgq8xhSD42cdTRAQd`                                                  |
| Network                 | devnet                                                                                          |
| Deployed `.so` sha256   | `486367e21cbaa88b254e0ea78ed427070569cb25f1237f72210359d660b62ca8`                              |
| Upgrade authority       | **none (frozen, irreversible)**                                                                 |
| Reference vault PDA     | `FY86s1fAwUiFQTjVFYprsiV6fwNH7e955MSUBo73FP4j`                                                  |
| Vault `owner` field     | `6JFH1dxqiw6Dc81CbWdx4TUT8CvAfgwZg33wQrSytZsU`                                                  |
| Vault `balance`         | `100000000` (0.1 SOL, recorded)                                                                 |
| On-chain IDL (metadata) | `AUAPj7TdS9LXfdkLQC7eaW4aSXLLPScSqEF6Zn325PQX` (seed `idl`)                                     |
| IDL (this repo)         | [`vault_program.idl.json`](./vault_program.idl.json) — field-identical to the on-chain metadata |

## Account layout (`VaultState`, 49 bytes)

```
offset 0  len 8  : discriminator = [228,196,82,165,98,210,235,152] = sha256("account:VaultState")[..8]
offset 8  len 32 : owner   (Pubkey)
offset 40 len 8  : balance (u64 LE)
offset 48 len 1  : bump    (u8, canonical)
```

`INIT_SPACE == 41` (data, no discriminator); `space == 49`. PDA seeds:
`[b"vault", owner_pubkey]`.

## Instructions

`initialize_vault()`, `deposit(amount: u64)`, `withdraw(amount: u64)` — accounts in IDL
order `[vault, user, system_program]` (**vault first**). Errors: `6000 Overflow`,
`6001 InsufficientFunds`, `6002 ZeroAmount`, `6003 NotOwner`.

> **Client authors:** honor the IDL account order (`[vault, user, system_program]`).
> See #821 for a C4 mock stand-in that had this inverted.

## Provenance / verification (all before freeze)

- Program source byte-identical to C3's canonical `deploy-and-publish-the-idl` solution;
  independent adversarial review verdict **FREEZE-SAFE** (layout fidelity, financial
  safety of the direct-PDA-debit withdraw, init safety, exclusions all verified).
- On-chain program dump sha256 **matched** the local build byte-for-byte.
- Vault account decoded field-for-field against this IDL (owner/balance/bump).
- Behavioral: `deposit(0)` returns `6002` (ZeroAmount) on-chain.
- Deployed via the Helius devnet RPC only. Then upgrade authority set `--final`.

Transactions: deploy `49AVAMkWNvu351R15qgrrrpsxmEMdagWdkQDQEfFb613fDFb9XY4sNoeM1TTkWGMqA3TPjrUtXZ4RxSsSqHEWeqS`,
init+deposit `3EhspCQr1UiamUn6UbpXnk1VP1KLQTSzXmd8Mu99m5m4bzMU2kNvVnMVvgtBz1zCwaF26fPbwa388oiBtZEXDHwm`,
freeze `cE2s7WGb3EvXj2Jw3BukBKoeLpSANk49ztBz9g7UDoitESeQLY6ehgPLC6cBic2hmQDt7cXBiHAxC9CfUiz1FYa`.
