import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const SYSTEM_PROMPT = `You are "Academy AI", the Solana learning assistant for Superteam Academy.
You help developers learn Solana blockchain development. You are friendly, concise, and technically accurate.

Guidelines:
- Answer questions about Solana, Anchor, Rust, SPL tokens, PDAs, CPIs, Token-2022, Metaplex, and related topics.
- Provide code examples when helpful, using TypeScript (@solana/web3.js) or Rust (Anchor framework).
- Keep answers concise but thorough — aim for 2-4 paragraphs max unless the user asks for more detail.
- If a question is outside Solana/blockchain scope, politely redirect: "I specialize in Solana development! Try asking about PDAs, tokens, or Anchor."
- Use markdown formatting: bold for key terms, code blocks for code, bullet points for lists.
- When explaining concepts, start with a one-line summary, then dive deeper.`;

// Built-in knowledge base for when no API key is configured
const KNOWLEDGE_BASE: Record<string, string> = {
    "pda": `**Program Derived Addresses (PDAs)** are special addresses on Solana that are derived deterministically from a program ID and a set of seeds, without a corresponding private key.

**Key points:**
- PDAs are generated using \`Pubkey::find_program_address(seeds, program_id)\`
- They enable programs to "sign" transactions on behalf of the PDA
- Common use cases: storing program state, creating associated token accounts, escrow accounts

\`\`\`rust
// Anchor example
#[account(
    init,
    payer = user,
    space = 8 + 32,
    seeds = [b"user-stats", user.key().as_ref()],
    bump
)]
pub user_stats: Account<'info, UserStats>,
\`\`\``,
    "cpi": `**Cross-Program Invocations (CPIs)** allow one Solana program to call another program's instructions.

**Key points:**
- CPIs enable composability — programs can build on top of each other
- Use \`invoke()\` for unsigned CPIs or \`invoke_signed()\` when a PDA needs to sign
- The calling program passes its remaining compute budget to the invoked program

\`\`\`rust
// Anchor CPI example — transferring SOL
let cpi_ctx = CpiContext::new(
    ctx.accounts.system_program.to_account_info(),
    system_program::Transfer {
        from: ctx.accounts.user.to_account_info(),
        to: ctx.accounts.vault.to_account_info(),
    },
);
system_program::transfer(cpi_ctx, amount)?;
\`\`\``,
    "token-2022": `**Token-2022** (also called Token Extensions) is Solana's next-gen token program that adds powerful features to SPL tokens.

**Key extensions:**
- **Transfer Fees** — charge a fee on every transfer
- **Confidential Transfers** — hide transfer amounts using zero-knowledge proofs
- **Transfer Hooks** — execute custom logic on every transfer
- **Metadata** — store token metadata directly on the mint account
- **Non-Transferable** — create soulbound tokens
- **Interest-Bearing** — tokens that accrue interest over time

Works alongside the original SPL Token program — both are supported across the ecosystem.`,
    "anchor": `**Anchor** is the most popular framework for building Solana programs (smart contracts) in Rust.

**Why Anchor?**
- Dramatically reduces boilerplate code
- Automatic account serialization/deserialization
- Built-in security checks (owner, signer, etc.)
- IDL generation for client-side type safety

\`\`\`rust
use anchor_lang::prelude::*;

declare_id!("YourProgramId11111111111111111111111111111");

#[program]
pub mod my_program {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        ctx.accounts.data.authority = ctx.accounts.user.key();
        Ok(())
    }
}
\`\`\``,
};

function getKnowledgeBaseAnswer(message: string): string | null {
    const lower = message.toLowerCase();
    if (lower.includes("pda") || lower.includes("program derived")) return KNOWLEDGE_BASE["pda"]!;
    if (lower.includes("cpi") || lower.includes("cross-program") || lower.includes("cross program")) return KNOWLEDGE_BASE["cpi"]!;
    if (lower.includes("token-2022") || lower.includes("token extension") || lower.includes("token 2022")) return KNOWLEDGE_BASE["token-2022"]!;
    if (lower.includes("anchor")) return KNOWLEDGE_BASE["anchor"]!;
    if (lower.includes("solana")) {
        return `**Solana** is a high-performance blockchain designed for speed and low costs.

**Key stats:** ~400ms block times, ~$0.00025 per transaction, parallel transaction processing via Sealevel.

**Core concepts to learn:**
- **Accounts** — Solana's storage model (everything is an account)
- **Programs** — Smart contracts deployed on-chain
- **PDAs** — Program Derived Addresses for deterministic account creation
- **CPIs** — Cross-Program Invocations for composability
- **SPL Tokens** — Solana's token standard

Ask me about any of these topics! 🚀`;
    }
    return null;
}

export async function POST(req: NextRequest) {
    try {
        const { messages } = await req.json();

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return NextResponse.json({ error: "Messages are required" }, { status: 400 });
        }

        const lastMessage = messages[messages.length - 1]?.content || "";
        const apiKey = process.env.ANTHROPIC_API_KEY;

        // If no API key, use built-in knowledge base
        if (!apiKey) {
            const kbAnswer = getKnowledgeBaseAnswer(lastMessage);
            const fallback = kbAnswer || "I'm currently running in offline mode without my AI engine. I can still help with common Solana topics like **PDAs**, **CPIs**, **Token-2022**, and **Anchor**. Try asking about one of those!";
            return NextResponse.json({ content: fallback });
        }

        // Use Anthropic Claude
        const client = new Anthropic({ apiKey });

        const anthropicMessages = messages.map((msg: { role: string; content: string }) => ({
            role: msg.role as "user" | "assistant",
            content: msg.content,
        }));

        const response = await client.messages.create({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1024,
            system: SYSTEM_PROMPT,
            messages: anthropicMessages,
        });

        const textContent = response.content.find((block) => block.type === "text");
        const content = textContent && "text" in textContent ? textContent.text : "I couldn't generate a response. Please try again.";

        return NextResponse.json({ content });
    } catch (error) {
        console.error("[Chat API Error]", error);
        return NextResponse.json(
            { error: "Failed to process your question. Please try again." },
            { status: 500 }
        );
    }
}
