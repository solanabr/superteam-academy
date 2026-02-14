import type { CmsCourse } from "@/lib/cms/types";

export const fallbackCourses: CmsCourse[] = [
  {
    _id: "course-solana-foundations",
    slug: "solana-foundations",
    title: "Solana Foundations",
    description: "Core blockchain concepts, wallets, accounts, transactions, and token standards on Solana.",
    topic: "Core",
    difficulty: "beginner",
    durationHours: 8,
    xpReward: 300,
    modules: [
      {
        _id: "mod-sf-accounts",
        title: "Accounts & Data",
        order: 1,
        lessons: [
          {
            _id: "les-sf-1-1",
            title: "Understanding Solana Accounts",
            order: 1,
            content: "Every piece of data on Solana lives inside an account. Unlike Ethereum's key-value storage model, Solana accounts are standalone data containers that hold both lamports (SOL) and arbitrary program data. Each account has an owner — only the owning program can modify the account's data, while anyone can credit lamports.\n\nAccounts require rent to remain on-chain, calculated as a factor of the stored data size. The runtime exempts accounts that hold at least two years' worth of rent. Understanding this model is fundamental: your programs will create, read, and close accounts constantly.\n\nProgram Derived Addresses (PDAs) allow programs to deterministically generate account addresses without a private key, enabling trustless state management. PDAs are found using `PublicKey.findProgramAddressSync` with seed bytes and a program ID.",
            challengePrompt: "Create a function that derives a PDA for a user profile account using the user's public key as a seed."
          },
          {
            _id: "les-sf-1-2",
            title: "Rent and Account Lifecycle",
            order: 2,
            content: "Solana's rent mechanism ensures the network doesn't store stale data forever. Accounts that fall below the rent-exempt threshold are garbage-collected by the runtime. When you create an account via `SystemProgram.createAccount`, you specify the lamports and space parameters.\n\nThe minimum rent-exempt balance is calculated by `getMinimumBalanceForRentExemption(dataLength)`. For a typical PDA holding 100 bytes of data, this is roughly 0.001 SOL. Production programs should always make accounts rent-exempt to prevent unexpected data loss.\n\nWhen an account is no longer needed, close it by transferring all lamports back to a designated wallet and zeroing the data. This reclaims storage and returns the SOL deposit to the user."
          }
        ]
      },
      {
        _id: "mod-sf-transactions",
        title: "Transactions & Instructions",
        order: 2,
        lessons: [
          {
            _id: "les-sf-2-1",
            title: "Composing Transactions",
            order: 1,
            content: "A Solana transaction is a bundle of one or more instructions executed atomically — they all succeed or all fail. Each instruction targets a specific program and includes the accounts it reads or writes, along with serialized instruction data.\n\nTransactions are signed by one or more wallets (signers) and submitted to an RPC node. The runtime processes them in parallel when their account sets don't overlap, which is how Solana achieves its high throughput.\n\nYou build transactions with `new Transaction().add(instruction)`, sign with `wallet.signTransaction(tx)`, and send via `connection.sendRawTransaction`. Always set a recent blockhash with `connection.getLatestBlockhash()` — stale blockhashes cause transactions to expire.",
            challengePrompt: "Build a transaction that transfers SOL from one wallet to another using SystemProgram.transfer."
          },
          {
            _id: "les-sf-2-2",
            title: "Versioned Transactions and Lookup Tables",
            order: 2,
            content: "Solana v0 transactions support Address Lookup Tables (ALTs), which compress the account list by replacing 32-byte public keys with 1-byte indices. This lets you include more accounts per transaction, bypassing the 1232-byte packet limit.\n\nLookup tables are created on-chain and extended with addresses over time. Once active (after a warmup period), any transaction can reference them. This is critical for DeFi composability where a single swap might touch 15+ accounts.\n\nTo use versioned transactions, create a `TransactionMessage`, compile it with `compileToV0Message(lookupTables)`, and wrap it in `new VersionedTransaction(message)`. Most modern wallets support v0 signing out of the box."
          }
        ]
      },
      {
        _id: "mod-sf-programs",
        title: "Programs & Runtime",
        order: 3,
        lessons: [
          {
            _id: "les-sf-3-1",
            title: "How Solana Programs Work",
            order: 1,
            content: "Solana programs are stateless executables deployed on-chain as BPF bytecode. They process instructions by reading from and writing to accounts passed in by the transaction. The program itself is stored in an executable account owned by the BPF Loader.\n\nWhen a transaction arrives, the runtime deserializes the instruction data, loads the referenced accounts, and invokes the target program's entrypoint. The program validates inputs, performs logic, and modifies account data. If any check fails, the entire transaction reverts.\n\nNative programs like SystemProgram, TokenProgram, and AssociatedTokenProgram handle common operations. Your custom programs build on top of these by making Cross-Program Invocations (CPIs) to delegate work to other programs.",
            challengePrompt: "Write a function that calls SystemProgram.createAccount to allocate space for a new data account."
          },
          {
            _id: "les-sf-3-2",
            title: "SPL Tokens and Token Extensions",
            order: 2,
            content: "The SPL Token program is Solana's standard for fungible and non-fungible tokens. A mint account defines the token's supply and decimals. Token accounts hold balances for specific wallets. Associated Token Accounts (ATAs) provide deterministic addresses per wallet-mint pair.\n\nToken-2022 (Token Extensions) adds features like transfer fees, interest-bearing tokens, confidential transfers, and permanent delegates. These extensions are opt-in per mint and composable — you can combine multiple extensions on a single token.\n\nTo mint tokens, you call `mintTo` with the mint authority. To transfer, use `transfer` or `transferChecked` (which validates decimals). Always prefer ATAs over arbitrary token accounts for better wallet compatibility and UX."
          }
        ]
      },
      {
        _id: "mod-sf-tokens",
        title: "Wallets & Client SDKs",
        order: 4,
        lessons: [
          {
            _id: "les-sf-4-1",
            title: "Wallet Adapter Integration",
            order: 1,
            content: "The Solana Wallet Adapter provides a unified interface for connecting to Phantom, Solflare, Backpack, and dozens of other wallets. In React, wrap your app with `ConnectionProvider`, `WalletProvider`, and `WalletModalProvider`.\n\nThe `useWallet` hook gives you `publicKey`, `signTransaction`, `signMessage`, and connection state. Always check `connected` before making RPC calls. Use `useConnection` separately to get the `Connection` object for reads.\n\nFor a polished UX, handle wallet disconnection gracefully, show the connected wallet address truncated (first 4 and last 4 characters), and provide a clear disconnect button. Auto-connect returning users by passing `autoConnect` to `WalletProvider`.",
            challengePrompt: "Implement a React hook that returns the connected wallet's SOL balance, refreshing every 10 seconds."
          },
          {
            _id: "les-sf-4-2",
            title: "RPC Methods and Connection",
            order: 2,
            content: "The `Connection` class from `@solana/web3.js` is your gateway to the Solana network. Key methods include `getAccountInfo` (fetch raw account data), `getBalance` (SOL balance), `getTokenAccountsByOwner` (all token holdings), and `getProgramAccounts` (query accounts by program).\n\nFor production apps, use a dedicated RPC provider like Helius, QuickNode, or Triton. Public endpoints are rate-limited. Pass the RPC URL via environment variables and never expose private RPCs in client-side code.\n\nWebSocket subscriptions via `onAccountChange` and `onProgramAccountChange` enable real-time updates. Use these for live balance displays and transaction confirmations. Always clean up subscriptions in your component's unmount lifecycle."
          }
        ]
      }
    ]
  },
  {
    _id: "course-anchor-development",
    slug: "anchor-development",
    title: "Anchor Development",
    description: "Build, test, and deploy secure Solana programs using the Anchor framework.",
    topic: "Programs",
    difficulty: "intermediate",
    durationHours: 12,
    xpReward: 450,
    modules: [
      {
        _id: "mod-ad-setup",
        title: "Anchor Setup & Architecture",
        order: 1,
        lessons: [
          {
            _id: "les-ad-1-1",
            title: "Project Initialization",
            order: 1,
            content: "Anchor is the dominant framework for Solana program development, providing a Rust macro system that eliminates boilerplate for account deserialization, instruction dispatch, and error handling. Install it with `avm install latest` and create a project with `anchor init my-project`.\n\nThe generated workspace contains `programs/` (Rust source), `tests/` (TypeScript integration tests), `app/` (optional frontend), and `Anchor.toml` (configuration). The `programs/my-project/src/lib.rs` file is your entry point.\n\nAnchor's `declare_id!` macro sets your program's public key. The `#[program]` module defines your instruction handlers, while `#[derive(Accounts)]` structs declare the accounts each instruction expects. This declarative approach makes programs more readable and secure by default.",
            challengePrompt: "Define an Anchor program skeleton with a single 'initialize' instruction that creates a state account."
          },
          {
            _id: "les-ad-1-2",
            title: "Account Constraints and Validation",
            order: 2,
            content: "Anchor's account validation system uses Rust attributes to enforce constraints declaratively. The `#[account(init, payer = user, space = 8 + 32)]` attribute creates a new account, charges the payer, and allocates the specified bytes (8-byte discriminator + your data).\n\nCommon constraints include `#[account(mut)]` for writable accounts, `#[account(has_one = authority)]` to verify ownership, `#[account(seeds = [...], bump)]` for PDA derivation, and `#[account(close = destination)]` to close and reclaim rent.\n\nConstraints compose naturally: `#[account(mut, has_one = authority, constraint = vault.amount > 0)]` ensures the account is writable, owned by the signer, and holds a positive balance — all before your instruction logic runs. This is Anchor's core value: security checks are declarative, not buried in imperative code."
          }
        ]
      },
      {
        _id: "mod-ad-instructions",
        title: "Instructions & State",
        order: 2,
        lessons: [
          {
            _id: "les-ad-2-1",
            title: "Writing Instructions",
            order: 1,
            content: "Anchor instruction handlers are async Rust functions inside the `#[program]` module. They receive a `Context<T>` (where T is your Accounts struct) and any additional instruction data as parameters. The context provides access to validated accounts via `ctx.accounts`.\n\nInstruction data is automatically deserialized from the transaction using Borsh serialization. Define your parameters as function arguments: `pub fn create_post(ctx: Context<CreatePost>, title: String, body: String) -> Result<()>`. Anchor generates the IDL and client-side types from these signatures.\n\nReturn `Ok(())` for success or `Err(error)` for failures. Use `#[error_code]` enums for custom errors: `#[msg(\"Title too long\")] TitleTooLong`. These errors propagate cleanly to the frontend with human-readable messages.",
            challengePrompt: "Write an Anchor instruction that increments a counter stored in a PDA account."
          },
          {
            _id: "les-ad-2-2",
            title: "Managing Program State",
            order: 2,
            content: "Program state in Anchor is defined using `#[account]` structs. These are Rust structs that Anchor automatically serializes/deserializes using Borsh. Each struct gets an 8-byte discriminator prepended to distinguish account types.\n\nDesign your state carefully: Solana accounts have a fixed size after creation. If you need dynamic-length data (like vectors or strings), allocate enough space upfront or use realloc. A common pattern is `space = 8 + 4 + MAX_TITLE_LEN + 4 + MAX_BODY_LEN` where 4 bytes are the Borsh length prefix.\n\nFor global state, use a PDA with known seeds (e.g., `[b\"global-config\"]`). For per-user state, include the user's pubkey in the seeds: `[b\"user-profile\", user.key().as_ref()]`. This pattern makes accounts discoverable without off-chain indexing.",
            challengePrompt: "Define an Anchor account struct for a blog post with title, body, author, and timestamp fields."
          },
          {
            _id: "les-ad-2-3",
            title: "Cross-Program Invocations",
            order: 3,
            content: "Cross-Program Invocations (CPIs) let your program call other programs on-chain. Anchor provides typed CPI helpers via the `CpiContext` pattern. For example, to transfer SOL: `system_program::transfer(cpi_ctx, amount)`.\n\nBuild CPI contexts with `CpiContext::new(program, accounts)` for unsigned calls or `CpiContext::new_with_signer(program, accounts, signer_seeds)` when the PDA needs to sign. The signer seeds must match the PDA derivation exactly.\n\nCommon CPIs include token transfers (`token::transfer`), minting (`token::mint_to`), and creating associated token accounts (`associated_token::create`). Always pass the correct program IDs and verify the target program in your accounts struct to prevent substitution attacks."
          }
        ]
      },
      {
        _id: "mod-ad-testing",
        title: "Testing & Debugging",
        order: 3,
        lessons: [
          {
            _id: "les-ad-3-1",
            title: "Integration Testing with Bankrun",
            order: 1,
            content: "Anchor generates a TypeScript client from your IDL, enabling integration tests that closely mirror real transactions. The test runner uses `anchor test` which starts a local validator, deploys your program, and executes tests.\n\nBankrun (`solana-bankrun`) provides a faster alternative to the local validator by running the Solana runtime in-process. Tests execute in milliseconds instead of seconds, with full transaction simulation including CPIs and compute limits.\n\nStructure tests around user stories: `describe('initialize', () => { it('creates a profile account', ...) })`. Use `program.methods.initialize().accounts({...}).rpc()` to send transactions. Assert on-chain state by fetching accounts: `const state = await program.account.userProfile.fetch(pda)`.",
            challengePrompt: "Write a test that initializes an account and verifies its data matches expected values."
          },
          {
            _id: "les-ad-3-2",
            title: "Error Handling and Debugging",
            order: 2,
            content: "Anchor errors include the custom error code and message, making debugging straightforward. Catch them in tests with `try/catch` and assert the error code: `expect(err.error.errorCode.code).toEqual('TitleTooLong')`.\n\nCommon issues include: wrong account order (Anchor is position-sensitive), missing signers, insufficient lamports for rent, and compute budget overflows. Use `solana logs` during `anchor test` to see runtime traces.\n\nFor compute-intensive operations, request additional compute units with `ComputeBudgetProgram.setComputeUnitLimit`. The default is 200K units per instruction. Complex DeFi operations may need 400K-1M units. Profile your program's compute usage early — it's a hard limit."
          }
        ]
      },
      {
        _id: "mod-ad-deploy",
        title: "Deployment & Security",
        order: 4,
        lessons: [
          {
            _id: "les-ad-4-1",
            title: "Deploying to Devnet and Mainnet",
            order: 1,
            content: "Deploy to devnet with `anchor deploy --provider.cluster devnet`. The CLI compiles your program to BPF bytecode, uploads it in chunks, and finalizes the deployment. Devnet SOL is free via `solana airdrop 2`.\n\nFor mainnet, update `Anchor.toml` with your mainnet wallet and RPC. Use `anchor deploy --provider.cluster mainnet-beta`. Mainnet deployments require real SOL for rent (typically 2-5 SOL depending on program size). Always deploy to devnet first and run your full test suite.\n\nAfter deployment, verify your program source on-chain using `anchor verify` or through explorer tools. Verified programs build user trust. Consider using a multisig upgrade authority for mainnet programs to prevent single points of failure.",
            challengePrompt: "Write a deployment script that deploys to devnet and logs the program ID."
          },
          {
            _id: "les-ad-4-2",
            title: "Security Best Practices",
            order: 2,
            content: "Solana programs are high-value targets. Common vulnerabilities include missing signer checks, incorrect PDA validation, integer overflow, and re-initialization attacks. Anchor mitigates many of these through its constraint system, but you must use them correctly.\n\nAlways validate that accounts are owned by the expected program. Use `#[account(constraint = account.owner == expected_program::ID)]` or Anchor's built-in checks. Never trust account data without verifying the discriminator and owner.\n\nAdditional hardening: use `#[account(init_if_needed)]` sparingly (it can mask re-init bugs), close unused accounts to reclaim rent, and implement access control with authority patterns. Consider professional audits for any program handling user funds."
          }
        ]
      }
    ]
  },
  {
    _id: "course-defi-solana",
    slug: "defi-on-solana",
    title: "DeFi on Solana",
    description: "Build decentralized finance protocols — AMMs, lending pools, oracles, and composable DeFi.",
    topic: "DeFi",
    difficulty: "advanced",
    durationHours: 14,
    xpReward: 600,
    modules: [
      {
        _id: "mod-defi-amm",
        title: "Automated Market Makers",
        order: 1,
        lessons: [
          {
            _id: "les-defi-1-1",
            title: "Constant Product AMM Design",
            order: 1,
            content: "Automated Market Makers replace traditional order books with mathematical pricing curves. The constant product formula `x * y = k` (popularized by Uniswap) ensures that as one token is bought, the other becomes more expensive, maintaining liquidity at all price points.\n\nOn Solana, AMM pools hold two token vaults (SPL token accounts) and a pool state account tracking reserves and LP token supply. When a user swaps Token A for Token B, the program calculates the output amount using `dy = (y * dx) / (x + dx)`, applies a fee, and executes the transfer.\n\nSolana's speed makes AMMs particularly powerful — trades settle in 400ms with sub-cent fees. Concentrated liquidity (like Orca Whirlpools) improves capital efficiency by letting LPs focus liquidity in specific price ranges, earning more fees per dollar deposited.",
            challengePrompt: "Implement a constant product swap calculation that computes output amount given input amount and pool reserves."
          },
          {
            _id: "les-defi-1-2",
            title: "Liquidity Provision and LP Tokens",
            order: 2,
            content: "Liquidity providers deposit equal values of both tokens into a pool and receive LP tokens representing their share. When they withdraw, they burn LP tokens and receive proportional amounts of both tokens, plus accumulated fees.\n\nThe LP token mint amount for a new deposit is calculated as `lp_amount = min(dx/x, dy/y) * total_lp_supply`. This ensures providers can't manipulate the pool ratio. The first depositor sets the initial ratio and receives LP tokens equal to `sqrt(dx * dy)`.\n\nImpermanent loss occurs when the price ratio of deposited tokens changes — LPs would have been better off holding the tokens directly. Understanding this tradeoff is critical for building LP-facing UIs that display real PnL including fees earned versus impermanent loss suffered."
          }
        ]
      },
      {
        _id: "mod-defi-lending",
        title: "Lending Protocols",
        order: 2,
        lessons: [
          {
            _id: "les-defi-2-1",
            title: "Supply, Borrow, and Interest Rates",
            order: 1,
            content: "Lending protocols like Solend and MarginFi allow users to supply assets to earn yield and borrow against their collateral. Interest rates are determined algorithmically based on pool utilization: `utilization = total_borrowed / total_supplied`.\n\nA typical rate curve has a gentle slope at low utilization and a steep kink at 80-90% to incentivize repayment. Suppliers earn a share of borrower interest proportional to their deposit. Rates compound per slot (Solana's ~400ms block time), making Solana lending especially responsive.\n\nOn-chain, each user has a position account tracking their supplies and borrows. The protocol stores global state with cumulative interest indices. When a user interacts, the protocol first updates the global indices, then applies the accrued interest to the user's position.",
            challengePrompt: "Write a utilization-based interest rate function with a kink at 80% utilization."
          },
          {
            _id: "les-defi-2-2",
            title: "Liquidation Mechanics",
            order: 2,
            content: "When a borrower's collateral value drops below the required ratio (typically 125-150%), their position becomes liquidatable. Liquidators repay part of the debt and receive the equivalent collateral at a discount (usually 5-10%).\n\nThe health factor `h = (collateral_value * liquidation_threshold) / borrowed_value` determines position safety. When h < 1, liquidation is permitted. Solana's speed enables real-time liquidation bots that monitor positions every slot.\n\nBuilding a liquidation bot requires: subscribing to oracle price feeds, computing health factors for all positions, and executing liquidation transactions within the same slot as the price update. Efficient bots use `getProgramAccounts` with `memcmp` filters to find underwater positions."
          },
          {
            _id: "les-defi-2-3",
            title: "Flash Loans on Solana",
            order: 3,
            content: "Flash loans let you borrow any amount without collateral, as long as you repay within the same transaction. On Solana, a flash loan is a sequence of instructions: borrow, use funds (arbitrage, liquidation, collateral swap), and repay — all atomic.\n\nImplementing flash loans requires a program instruction that lends from the pool vault and records the expected repayment. A separate `repay_flash_loan` instruction verifies the pool received back the principal plus fee. If the repay instruction isn't called, the transaction fails.\n\nFlash loans enable powerful DeFi strategies: arbitrage between AMMs, self-liquidation to avoid penalty fees, and collateral swaps without intermediate liquidation. They're a building block for composable DeFi on Solana."
          }
        ]
      },
      {
        _id: "mod-defi-oracles",
        title: "Oracles & Price Feeds",
        order: 3,
        lessons: [
          {
            _id: "les-defi-3-1",
            title: "Integrating Pyth and Switchboard",
            order: 1,
            content: "Oracles bring real-world data on-chain. Pyth Network provides high-frequency price feeds for crypto assets, updated every 400ms on Solana. Switchboard offers customizable data feeds using a decentralized oracle network with economic incentives for accuracy.\n\nTo use Pyth, pass the price feed account into your instruction and deserialize it with the Pyth SDK: `let price = PriceFeed::from_account_info(price_account)?`. Always check the price confidence interval and staleness — reject prices older than a few slots or with confidence wider than 1%.\n\nSwitchboard feeds work similarly but use an aggregator account pattern. Multiple oracles submit values, and the aggregator computes a weighted median. Your program reads the aggregator's `latest_confirmed_round` for the current value.",
            challengePrompt: "Write a function that reads a Pyth price feed and validates the price is fresh (within 30 slots)."
          },
          {
            _id: "les-defi-3-2",
            title: "Oracle Manipulation and Safeguards",
            order: 2,
            content: "Oracle manipulation is one of DeFi's biggest attack vectors. Flash loan attacks can temporarily move AMM-based prices, causing protocols that use on-chain TWAP oracles to misprice assets. Always prefer Pyth or Switchboard over AMM spot prices for any collateral valuation.\n\nImplement safeguards: enforce maximum price deviation between updates, use time-weighted average prices (TWAPs) for critical operations, and add circuit breakers that pause the protocol if prices move beyond expected bounds.\n\nFor custom feeds, consider running your own Switchboard oracle with data from multiple CEX APIs. Aggregate prices using the median (more robust than mean against outliers). Test your oracle integration extensively with simulated price shocks before deploying to mainnet."
          }
        ]
      },
      {
        _id: "mod-defi-composability",
        title: "DeFi Composability",
        order: 4,
        lessons: [
          {
            _id: "les-defi-4-1",
            title: "Building Composable Protocols",
            order: 1,
            content: "Composability is DeFi's superpower — protocols that interoperate create value greater than the sum of parts. On Solana, composability happens through CPIs and shared account standards. Your lending protocol can integrate with any AMM by calling its swap instruction.\n\nDesign for composability: use standard SPL Token accounts for vaults, emit events with `msg!()` for indexers, and expose simple instruction interfaces. A vault program that accepts deposits, tracks shares, and allows withdrawals can be composed into yield aggregators, strategy vaults, and structured products.\n\nJupiter's aggregator is the gold standard for Solana composability — it routes swaps across dozens of AMMs in a single transaction. Study its integration pattern: a shared `SwapParams` interface that each AMM adapter implements, enabling plug-and-play liquidity sources.",
            challengePrompt: "Design a CPI call that swaps tokens through an AMM pool before depositing into a lending protocol."
          },
          {
            _id: "les-defi-4-2",
            title: "MEV and Transaction Ordering",
            order: 2,
            content: "Maximal Extractable Value (MEV) on Solana differs from Ethereum due to continuous block production and the lack of a public mempool. Jito provides a partial block auction system where searchers submit bundles of transactions with tips to validators.\n\nCommon MEV strategies include: arbitrage between AMMs (buy low on Orca, sell high on Raydium), liquidation racing (monitoring health factors and being first to liquidate), and sandwich attacks (front-running and back-running large swaps).\n\nProtect your users from MEV: implement slippage checks in your swap instructions, use Jupiter's exact-out mode for predictable outputs, and consider integrating with Jito's bundle system for time-sensitive operations. As a protocol builder, your design choices directly impact how much value is extractable from your users."
          }
        ]
      }
    ]
  },
  {
    _id: "course-nft-development",
    slug: "nft-development",
    title: "NFT Development",
    description: "Build NFT experiences with Metaplex, compressed NFTs, and custom marketplace programs.",
    topic: "NFTs",
    difficulty: "intermediate",
    durationHours: 10,
    xpReward: 400,
    modules: [
      {
        _id: "mod-nft-metaplex",
        title: "Metaplex Fundamentals",
        order: 1,
        lessons: [
          {
            _id: "les-nft-1-1",
            title: "Token Metadata Standard",
            order: 1,
            content: "Metaplex Token Metadata is the canonical standard for NFTs on Solana. It extends SPL Tokens with a metadata account containing name, symbol, URI (pointing to off-chain JSON), creators, and royalty configuration. The metadata account is a PDA derived from `['metadata', token_metadata_program_id, mint]`.\n\nThe off-chain JSON follows the Metaplex standard: `{ name, symbol, description, image, attributes, properties }`. Host JSON and images on Arweave (permanent) or IPFS (content-addressed). Use Bundlr/Irys for affordable Arweave uploads via Solana wallet payments.\n\nThe Umi library from Metaplex provides a modern TypeScript client for all Metaplex programs. Create NFTs with `createNft(umi, { mint, name, uri, sellerFeeBasisPoints })`. Umi handles the complex multi-instruction transaction including mint creation, metadata, and master edition.",
            challengePrompt: "Write a function using Umi to create an NFT with metadata, specifying name, URI, and 5% royalties."
          },
          {
            _id: "les-nft-1-2",
            title: "Collections and Verification",
            order: 2,
            content: "Metaplex Collections group related NFTs under a parent collection NFT. The collection field on each NFT's metadata links it to the parent. Verification is handled by the collection authority signing a `verify_collection` instruction, which sets the `verified` flag.\n\nCollections enable marketplace filtering, rarity calculations, and on-chain provenance. When creating a collection, first mint the collection NFT, then set each item's collection field during creation or via `verify_sized_collection_item`.\n\nSized collections track the current number of items and enforce a maximum. Unsized collections have no cap. For large drops, use sized collections to give minters confidence in supply limits. The collection NFT's metadata URI typically contains project-level branding and description."
          },
          {
            _id: "les-nft-1-3",
            title: "Programmable NFTs and Rules",
            order: 3,
            content: "Programmable NFTs (pNFTs) introduce on-chain rule enforcement for transfers, listings, and burns. Unlike standard NFTs that can be freely transferred, pNFTs require authorization from a rule set that defines allowed programs and conditions.\n\nRule sets are created using the Token Auth Rules program. Common rules include: restricting transfers to specific marketplace programs, enforcing royalty payments, and blocking transfers to known wash-trading addresses. This enables creator-enforced royalties.\n\nImplement pNFT transfers using `transferV1` from the Metaplex Token Metadata program, passing the authorization rules account. Your marketplace program must be registered in the rule set to facilitate trades. Test pNFT integration thoroughly — the authorization flow adds complexity compared to standard NFTs."
          }
        ]
      },
      {
        _id: "mod-nft-compressed",
        title: "Compressed NFTs",
        order: 2,
        lessons: [
          {
            _id: "les-nft-2-1",
            title: "State Compression and Merkle Trees",
            order: 1,
            content: "Compressed NFTs (cNFTs) use state compression to store NFT data in a concurrent Merkle tree instead of individual accounts. This reduces minting costs by 1000x — you can mint a million cNFTs for a few SOL instead of thousands.\n\nThe Merkle tree stores hashes of NFT data, while the full data is emitted as transaction logs and indexed by RPC providers using the Digital Asset Standard (DAS) API. To prove ownership, you provide a Merkle proof path from your leaf to the root.\n\nCreate a tree with `createTree(umi, { merkleTree, maxDepth, maxBufferSize })`. Depth determines capacity (2^depth leaves) and buffer size affects concurrent writes. A depth-20 tree holds ~1M NFTs. Mint cNFTs with `mintToCollectionV1(umi, { leafOwner, merkleTree, ... })`.",
            challengePrompt: "Create a Merkle tree configuration for minting 10,000 compressed NFTs with appropriate depth and buffer."
          },
          {
            _id: "les-nft-2-2",
            title: "Reading and Transferring cNFTs",
            order: 2,
            content: "Since cNFTs don't have individual accounts, you read them through the DAS API: `umi.rpc.getAsset(assetId)` returns the full NFT data including owner, metadata, and compression info. Use `getAssetsByOwner` to list all cNFTs owned by a wallet.\n\nTransferring cNFTs requires a Merkle proof. Fetch it with `getAssetProof(assetId)`, then call `transfer(umi, { leafOwner, newLeafOwner, merkleTree, root, dataHash, creatorHash, nonce, index, proof })`. The program verifies the proof before updating the leaf.\n\nBurn cNFTs similarly with a proof. For marketplaces, delegate the cNFT to a program PDA so it can transfer on the owner's behalf. cNFTs are ideal for credentials, membership passes, gaming items, and any use case requiring high-volume, low-cost minting."
          }
        ]
      },
      {
        _id: "mod-nft-marketplace",
        title: "Marketplace Development",
        order: 3,
        lessons: [
          {
            _id: "les-nft-3-1",
            title: "Listing and Escrow Patterns",
            order: 1,
            content: "NFT marketplaces use escrow patterns to secure trades. When a seller lists an NFT, they transfer it to a program-owned PDA (escrow vault). The listing account stores the price, seller, and mint. When a buyer pays, the program atomically sends SOL to the seller and the NFT to the buyer.\n\nAn alternative is the delegate pattern: the seller approves the marketplace program as a delegate on their token account. The NFT stays in the seller's wallet until sale. This provides better UX (the NFT still appears in the seller's wallet) but requires the seller to maintain the delegation.\n\nFor both patterns, implement royalty distribution by reading the creators array from token metadata and splitting the fee proportionally. Most marketplaces charge 1-2.5% platform fees plus creator royalties (typically 5-10%).",
            challengePrompt: "Write listing and purchase instruction handlers that escrow an NFT and handle SOL payment with royalties."
          },
          {
            _id: "les-nft-3-2",
            title: "Auction and Bidding Systems",
            order: 2,
            content: "On-chain auctions require careful state management. An auction account tracks the current highest bid, bidder, end time, and the escrowed NFT. Bidders submit transactions that check and exceed the current bid, refunding the previous bidder atomically.\n\nEnglish auctions (ascending bids) are most common. Implement a minimum bid increment (e.g., 5%) to prevent dust-bid spam. Use Solana's `Clock::get()?.unix_timestamp` for time checks — block timestamps on Solana are reliable to within a few seconds.\n\nDutch auctions (descending price) work well for NFT drops. Set a start price and end price with a duration. The current price is linearly interpolated based on elapsed time. Buyers can purchase at any point at the current price, creating urgency without gas wars."
          },
          {
            _id: "les-nft-3-3",
            title: "Indexing and Frontend Integration",
            order: 3,
            content: "A marketplace frontend needs real-time data about listings, bids, and transaction history. The DAS API provides NFT metadata, but you'll need custom indexing for marketplace-specific data like listings and sales history.\n\nUse Helius webhooks to listen for transactions involving your program. Parse instruction data and account changes to update your off-chain database. This enables fast queries, sorting, and filtering that would be impractical on-chain.\n\nFor the frontend, display NFT images from the metadata URI, show listing prices in SOL, and integrate wallet adapter for one-click purchases. Implement optimistic updates — show the purchased state immediately while the transaction confirms in the background. Use websocket subscriptions to update listings in real-time as new transactions land."
          }
        ]
      }
    ]
  }
];
