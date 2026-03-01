export interface QuizQuestion {
    id: string;
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
}

export interface CourseQuiz {
    courseId: string;
    /** Slug of the next recommended course, or null if it's the last one */
    nextCourseSlug: string | null;
    nextCourseTitle: string | null;
    questions: QuizQuestion[];
}

const QUIZZES: CourseQuiz[] = [
    {
        courseId: "solana-fundamentals",
        nextCourseSlug: "anchor-development",
        nextCourseTitle: "Anchor Program Development",
        questions: [
            {
                id: "sf-q1",
                question: "What makes Solana different from most other blockchains at the consensus layer?",
                options: [
                    "It uses only Proof of Work (PoW) for block production",
                    "It combines Proof of History (PoH) with Proof of Stake (PoS)",
                    "It relies on a central validator with rotating keys",
                    "It uses a DAG-based structure instead of a chain",
                ],
                correctIndex: 1,
                explanation:
                    "Solana uniquely pairs Proof of History (a verifiable delay function that timestamps events) with Proof of Stake, enabling validators to agree on event ordering without expensive messaging rounds.",
            },
            {
                id: "sf-q2",
                question: "On Solana, programs are …",
                options: [
                    "Stateful accounts that own their own data storage",
                    "Stateless executable accounts — all state lives in separate data accounts",
                    "Smart contracts stored in a global key-value store",
                    "Off-chain services that write proofs on-chain",
                ],
                correctIndex: 1,
                explanation:
                    "Solana programs are stateless: they contain only executable code. Any state they need is stored in separate data accounts that the program reads from and writes to during execution.",
            },
            {
                id: "sf-q3",
                question: "What is the purpose of a recent blockhash in a Solana transaction?",
                options: [
                    "To specify which validator will process the transaction",
                    "To prevent transaction replay and set an expiry window",
                    "To prove the fee-payer owns the sending account",
                    "To compress the transaction for lower fees",
                ],
                correctIndex: 1,
                explanation:
                    "A recent blockhash acts as a lifetime: validators reject transactions with a blockhash older than ~150 slots (~1 min 20 s), preventing replay attacks and stale submissions.",
            },
            {
                id: "sf-q4",
                question: "Which @solana/web3.js class is the entry point for all RPC calls to a Solana cluster?",
                options: ["PublicKey", "Keypair", "Connection", "Transaction"],
                correctIndex: 2,
                explanation:
                    "Connection represents an HTTP/WebSocket connection to a Solana JSON-RPC endpoint. It exposes methods like getBalance, sendTransaction, and confirmTransaction.",
            },
            {
                id: "sf-q5",
                question: "Versioned Transactions (v0) were introduced primarily to …",
                options: [
                    "Reduce compute unit prices by batching instructions",
                    "Support Address Lookup Tables (ALTs) and increase the accounts-per-transaction limit",
                    "Enable confidential transfers natively",
                    "Replace blockhashes with slot numbers",
                ],
                correctIndex: 1,
                explanation:
                    "v0 transactions introduced Address Lookup Tables, allowing a transaction to reference up to 256 accounts via compact table lookups instead of embedding full 32-byte public keys.",
            },
        ],
    },
    {
        courseId: "anchor-development",
        nextCourseSlug: "token-extensions",
        nextCourseTitle: "Token Extensions (Token-2022)",
        questions: [
            {
                id: "an-q1",
                question: "What does the `#[program]` attribute do in an Anchor program?",
                options: [
                    "Marks a struct as a PDA seed source",
                    "Declares the module containing the program's instruction handlers",
                    "Generates a new keypair for the program deployment",
                    "Defines on-chain storage layout",
                ],
                correctIndex: 1,
                explanation:
                    "#[program] annotates the Rust module that contains all instruction handlers. Anchor uses it to route incoming instructions by discriminator.",
            },
            {
                id: "an-q2",
                question: "Which account constraint ensures an account is created and rent-exempt in a single instruction?",
                options: [
                    "#[account(mut)]",
                    "#[account(close = target)]",
                    "#[account(init, payer = payer, space = N)]",
                    "#[account(zero)]",
                ],
                correctIndex: 2,
                explanation:
                    "#[account(init, payer = payer, space = N)] creates the account, transfers lamports for rent exemption from payer, and calls the system program's create_account instruction automatically.",
            },
            {
                id: "an-q3",
                question: "What is an IDL in the context of Anchor?",
                options: [
                    "An Instruction Dispatch Layer for routing CPIs",
                    "An Interface Description Language file describing program instructions, accounts, and error codes",
                    "An on-chain governance proposal format",
                    "A Rust macro that replaces the Anchor CLI",
                ],
                correctIndex: 1,
                explanation:
                    "The IDL is a JSON artifact Anchor generates from your program source. Clients use it to know exactly how to call instructions, what accounts to pass, and how to decode errors.",
            },
            {
                id: "an-q4",
                question: "PDAs (Program Derived Addresses) are special because …",
                options: [
                    "They have private keys that only the program knows",
                    "They fall off the Ed25519 curve and can be signed for by programs using seeds + bump",
                    "They are funded automatically by Solana validators",
                    "They bypass compute unit limits",
                ],
                correctIndex: 1,
                explanation:
                    "PDAs are deterministically derived public keys that intentionally lie off the Ed25519 curve. This means no private key exists; only the owning program can sign for them using `invoke_signed`.",
            },
        ],
    },
    {
        courseId: "token-extensions",
        nextCourseSlug: "metaplex-core",
        nextCourseTitle: "Metaplex Core NFTs",
        questions: [
            {
                id: "te-q1",
                question: "Token-2022 (Token Extensions) differs from legacy SPL Token in that …",
                options: [
                    "It uses a different consensus algorithm",
                    "Extensions are built into the mint/token account natively, removing need for wrapper programs",
                    "It requires all mints to be non-transferable",
                    "Token-2022 accounts are off-chain by default",
                ],
                correctIndex: 1,
                explanation:
                    "Token-2022 packs extension data directly into mint and token accounts, eliminating the overhead of separate wrapper programs and keeping everything composable at the protocol level.",
            },
            {
                id: "te-q2",
                question: "What does the `NonTransferable` extension do?",
                options: [
                    "Prevents the mint authority from burning tokens",
                    "Makes the token soulbound — it cannot be transferred from the recipient wallet",
                    "Stops the token from being used in DeFi protocols",
                    "Limits transfers to once per epoch",
                ],
                correctIndex: 1,
                explanation:
                    "NonTransferable makes a token 'soulbound': once minted to a wallet it cannot be moved. This is ideal for credentials, memberships, and reputation tokens.",
            },
            {
                id: "te-q3",
                question: "Transfer Hooks allow …",
                options: [
                    "A user-defined Anchor program to run custom logic on every token transfer",
                    "Validators to charge extra fees on high-value transfers",
                    "The mint authority to intercept and cancel transfers before settlement",
                    "Wallets to batch multiple transfers into a single instruction",
                ],
                correctIndex: 0,
                explanation:
                    "The TransferHook extension specifies a program address. Every time a token transfer occurs, the runtime calls that program, enabling royalties, KYC checks, allowlists, and more.",
            },
        ],
    },
    {
        courseId: "metaplex-core",
        nextCourseSlug: null,
        nextCourseTitle: null,
        questions: [
            {
                id: "mpx-q1",
                question: "How does Metaplex Core differ from legacy Metaplex Token Metadata?",
                options: [
                    "Core uses a separate blockchain sidechain for NFT data",
                    "Core stores the NFT and all metadata in a single account, reducing cost and complexity",
                    "Core requires SPL Token mint accounts for every NFT",
                    "Core NFTs cannot be transferred between wallets",
                ],
                correctIndex: 1,
                explanation:
                    "Metaplex Core consolidates NFT data into a single account (no separate mint, token, or metadata accounts). This cuts creation cost by ~80% vs legacy Token Metadata.",
            },
            {
                id: "mpx-q2",
                question: "The FreezeDelegate plugin is used to …",
                options: [
                    "Grant a third-party permission to burn the asset",
                    "Lock the asset so it cannot be transferred — ideal for soulbound credentials",
                    "Block the collection authority from updating metadata",
                    "Prevent the asset from appearing in DAS API queries",
                ],
                correctIndex: 1,
                explanation:
                    "FreezeDelegate allows a specified authority (or the program itself) to freeze an asset, preventing transfers. Combined with PermanentFreezeDelegate, this creates truly soulbound NFTs.",
            },
            {
                id: "mpx-q3",
                question: "What is the Helius DAS API primarily used for in Metaplex Core workflows?",
                options: [
                    "To deploy new Metaplex Core programs on devnet",
                    "To efficiently query assets by owner, collection, or attributes without scanning the entire chain",
                    "To update NFT metadata off-chain before committing",
                    "To generate keypairs for collection authorities",
                ],
                correctIndex: 1,
                explanation:
                    "DAS (Digital Asset Standard) API from Helius indexes compressed and Core NFTs, supporting getAssetsByOwner/Collection/Group calls — far faster than raw RPC account scanning.",
            },
        ],
    },
];

export function getQuizForCourse(courseId: string): CourseQuiz | undefined {
    return QUIZZES.find((q) => q.courseId === courseId);
}
