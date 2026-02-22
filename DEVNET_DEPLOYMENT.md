# Superteam Academy — Devnet Deployment Details

**Deployed:** 2026-02-20
**Network:** Solana Devnet
**Cluster:** https://api.devnet.solana.com

---

## Program

| Field | Value |
|-------|-------|
| **Program ID** | `GuBhF6hk5yKhnvU5712LZwUPaoAmoxtJf9GTh4CHTxsF` |
| **Upgrade Authority** | `DdNtpckCVAKDPv6nxB7xZKNix1NCasZYyKy7TM5JBTPA` |
| **IDL Account** | `3Yx41c74eS8XQaywxRBy1h9ScErLnKQ88f4GB8CecKXk` |
| **Binary Size** | 634,016 bytes |
| **Explorer** | https://explorer.solana.com/address/GuBhF6hk5yKhnvU5712LZwUPaoAmoxtJf9GTh4CHTxsF?cluster=devnet |

---

## Keypairs (in `wallets/`, gitignored)

| File | Pubkey | Purpose |
|------|--------|---------|
| `signer.json` | `DdNtpckCVAKDPv6nxB7xZKNix1NCasZYyKy7TM5JBTPA` | Authority / payer / upgrade authority |
| `program-keypair.json` | `GuBhF6hk5yKhnvU5712LZwUPaoAmoxtJf9GTh4CHTxsF` | Program deploy keypair |
| `xp-mint-keypair.json` | `F1PbQKRkn3UXnhCJErDSAtNmiScKPdMpwJxLLR7F3JQM` | XP Token-2022 mint |
| `backend-signer.json` | `BwyN2dcSGsAK7kx71oLw1GMm28gQFUjCbbHm9pewDXEA` | Backend signer for lesson completion/credentials |

---

## PDAs

| PDA | Address | Seeds |
|-----|---------|-------|
| **Config** | `FvzbSPTx3WDtuMvQ72UErzEua6nqnvESvR8JGc3UG9Ps` | `["config"]` |
| **Authority MinterRole** | Derived from `["minter", authority]` | Deactivated (replaced by backend-signer) |
| **Backend MinterRole** | Derived from `["minter", backend_signer]` | Active, unlimited XP |

---

## Config PDA State

| Field | Value |
|-------|-------|
| Authority | `DdNtpckCVAKDPv6nxB7xZKNix1NCasZYyKy7TM5JBTPA` |
| Backend Signer | `BwyN2dcSGsAK7kx71oLw1GMm28gQFUjCbbHm9pewDXEA` |
| XP Mint | `F1PbQKRkn3UXnhCJErDSAtNmiScKPdMpwJxLLR7F3JQM` |

---

## XP Mint (Token-2022)

| Property | Value |
|----------|-------|
| **Address** | `F1PbQKRkn3UXnhCJErDSAtNmiScKPdMpwJxLLR7F3JQM` |
| **Decimals** | 0 |
| **Mint Authority** | Config PDA (`FvzbSPTx3WDtuMvQ72UErzEua6nqnvESvR8JGc3UG9Ps`) |
| **Extensions** | NonTransferable, PermanentDelegate (Config PDA), MetadataPointer |
| **Explorer** | https://explorer.solana.com/address/F1PbQKRkn3UXnhCJErDSAtNmiScKPdMpwJxLLR7F3JQM?cluster=devnet |

---

## Courses On-Chain

| Course ID | PDA | Lessons | Difficulty | XP/Lesson | Track |
|-----------|-----|---------|------------|-----------|-------|
| `intro-to-solana` | `9pKP2MdrXfJdKXiX5A8wkeJvbwrLVDVUckpp81bmuYQL` | 10 | Beginner (1) | 25 | 1 |
| `anchor-fundamentals` | `DXYGRvKXY93x1pTJU3BFPHF7UzFKHUVZoYYezMs3LUhK` | 8 | Intermediate (2) | 30 | 4 |
| `defi-on-solana` | `8iy9x3NuvcJqkd77cn1DE6X6ePm8pUDaGyRDovc4urH` | 6 | Advanced (3) | 40 | 2 |
| `nft-development` | `2nmYnfYvHhp4SD3pwXC3xy7Jt2DkYwtyfHkkwpFEvDRn` | 7 | Intermediate (2) | 30 | 3 |
| `web3-frontend` | `H6mcftYyRDoLDLf6WCr7HkyeAa2k311N67E9UUpHZwna` | 8 | Beginner (1) | 25 | 5 |
| `solana-mock-test` | `FRggvX2wrpnpyXWir8RjfaiPmAZnm9JMfhEPyP1y1j2x` | 5 | Intermediate (2) | 100 | 1 |

---

## Track Collection (Metaplex Core)

| Field | Value |
|-------|-------|
| **Collection Address** | `GyTUPBnidX3fWPwAJq7VpQRx5tMhQe3TXk5hbRo8wZS7` |
| **Update Authority** | Config PDA (`FvzbSPTx3WDtuMvQ72UErzEua6nqnvESvR8JGc3UG9Ps`) |
| **Name** | Superteam Academy Track 1 |
| **Explorer** | https://explorer.solana.com/address/GyTUPBnidX3fWPwAJq7VpQRx5tMhQe3TXk5hbRo8wZS7?cluster=devnet |

---

## Signer Balance

| Wallet | Balance |
|--------|---------|
| Authority (signer.json) | ~17.5 SOL remaining |

---

## Environment Variables (app/.env.local)

```
NEXT_PUBLIC_PROGRAM_ID=GuBhF6hk5yKhnvU5712LZwUPaoAmoxtJf9GTh4CHTxsF
NEXT_PUBLIC_XP_MINT=F1PbQKRkn3UXnhCJErDSAtNmiScKPdMpwJxLLR7F3JQM
NEXT_PUBLIC_BACKEND_SIGNER=BwyN2dcSGsAK7kx71oLw1GMm28gQFUjCbbHm9pewDXEA
NEXT_PUBLIC_SOLANA_RPC_URL=https://devnet.helius-rpc.com/?api-key=<key>
```

---

## Initialization Steps Completed

1. Generated keypairs (signer, program, xp-mint, backend-signer)
2. Funded signer with 22 SOL
3. Built program (`anchor build`)
4. Deployed to devnet (`anchor deploy`)
5. Initialized Config PDA + XP Mint (`scripts/initialize.ts`)
6. Created 6 courses on-chain (5 real + 1 test)
7. Created Metaplex Core track collection
8. Registered backend-signer as minter
9. Updated Config to use backend-signer
10. Updated `.env.local` with all addresses
