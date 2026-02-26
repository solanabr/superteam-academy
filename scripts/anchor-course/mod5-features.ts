import { CourseModule } from "./types";

export const MODULE_FEATURES: CourseModule = {
  title: "Additional Features",
  description:
    "Advanced Anchor features — declare_program for dependency-free composability, custom errors, events, and zero-copy accounts.",
  lessons: [
    // ─── Lesson 1: Dependency-Free Composability ────────
    {
      title: "Dependency-Free Composability (declare_program)",
      description:
        "Use declare_program! to invoke any Anchor program via CPI without depending on its crate.",
      type: "content",
      duration: "20 min",
      content: `
<h2>Dependency-Free Composability</h2>
<p>The <code>declare_program!</code> macro lets you invoke another Anchor program via CPI using only its IDL — no crate dependency required.</p>

<h3>Why declare_program?</h3>
<ul>
  <li>No need to add the target program's crate to your <code>Cargo.toml</code></li>
  <li>Avoids version conflicts and circular dependencies</li>
  <li>Works with any program that has an IDL (including non-Anchor programs with manual IDL)</li>
</ul>

<h3>Usage</h3>
<p>Place the target program's IDL JSON file in your project and reference it:</p>
<pre><code class="language-rust">declare_program!(my_other_program);

use my_other_program::cpi::accounts::DoSomething;
use my_other_program::cpi::do_something;

pub fn call_other_program(ctx: Context&lt;CallOther&gt;) -&gt; Result&lt;()&gt; {
    let cpi_ctx = CpiContext::new(
        ctx.accounts.other_program.to_account_info(),
        DoSomething {
            account: ctx.accounts.some_account.to_account_info(),
        },
    );
    do_something(cpi_ctx, args)?;
    Ok(())
}</code></pre>

<h3>IDL Resolution</h3>
<p>Anchor looks for the IDL in these locations:</p>
<ol>
  <li><code>idls/</code> directory in your workspace root</li>
  <li><code>/target/idl/</code> if the program is in the same workspace</li>
</ol>

<p>Reference: <a href="https://www.anchor-lang.com/docs/features/declare-program" target="_blank">declare_program Docs</a></p>
`,
    },
    // ─── Lesson 2: Custom Errors ────────────────────────
    {
      title: "Custom Errors",
      description:
        "Define and use custom error codes with #[error_code] for clear, descriptive error messages.",
      type: "content",
      duration: "15 min",
      content: `
<h2>Custom Errors</h2>
<p>Anchor provides the <code>#[error_code]</code> macro to define custom program errors with readable messages.</p>

<h3>Definition</h3>
<pre><code class="language-rust">#[error_code]
pub enum MyError {
    #[msg("The provided value is too large")]
    ValueTooLarge,

    #[msg("Account has already been initialized")]
    AlreadyInitialized,

    #[msg("Unauthorized access")]
    Unauthorized,

    #[msg("Insufficient funds for operation")]
    InsufficientFunds,
}</code></pre>

<h3>Usage with require!</h3>
<pre><code class="language-rust">pub fn update(ctx: Context&lt;Update&gt;, value: u64) -&gt; Result&lt;()&gt; {
    require!(value &lt;= 1000, MyError::ValueTooLarge);
    require!(
        ctx.accounts.authority.key() == ctx.accounts.config.authority,
        MyError::Unauthorized
    );
    ctx.accounts.config.value = value;
    Ok(())
}</code></pre>

<h3>Usage with err! and error!</h3>
<pre><code class="language-rust">// Return error directly
if value &gt; 1000 {
    return err!(MyError::ValueTooLarge);
}

// Return error with msg formatting
return Err(error!(MyError::ValueTooLarge));</code></pre>

<h3>Error Codes</h3>
<p>Anchor error codes start at <code>6000</code>. Custom errors are numbered sequentially from there. These codes appear in transaction logs and IDL for client-side error parsing.</p>

<h3>Client-Side Error Handling</h3>
<pre><code class="language-typescript">try {
  await program.methods.update(2000).rpc();
} catch (err) {
  if (err instanceof anchor.AnchorError) {
    console.log("Error code:", err.error.errorCode.number); // 6000
    console.log("Error msg:", err.error.errorMessage);
  }
}</code></pre>

<p>Reference: <a href="https://www.anchor-lang.com/docs/features/errors" target="_blank">Custom Errors Docs</a></p>
`,
    },
    // ─── Lesson 3: Emit Events ──────────────────────────
    {
      title: "Emit Events",
      description:
        "Define and emit program events for off-chain indexing and real-time monitoring.",
      type: "content",
      duration: "15 min",
      content: `
<h2>Emit Events</h2>
<p>Events let off-chain services react to on-chain state changes. Anchor provides the <code>#[event]</code> macro and <code>emit!</code> macro.</p>

<h3>Define an Event</h3>
<pre><code class="language-rust">#[event]
pub struct TransferEvent {
    pub from: Pubkey,
    pub to: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}</code></pre>

<h3>Emit in Instruction Handler</h3>
<pre><code class="language-rust">pub fn transfer(ctx: Context&lt;Transfer&gt;, amount: u64) -&gt; Result&lt;()&gt; {
    // ... transfer logic ...

    emit!(TransferEvent {
        from: ctx.accounts.sender.key(),
        to: ctx.accounts.recipient.key(),
        amount,
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}</code></pre>

<h3>Listen for Events (TypeScript)</h3>
<pre><code class="language-typescript">const listener = program.addEventListener(
  "transferEvent",
  (event, slot) =&gt; {
    console.log("From:", event.from.toString());
    console.log("To:", event.to.toString());
    console.log("Amount:", event.amount.toString());
    console.log("Slot:", slot);
  }
);

// Clean up
await program.removeEventListener(listener);</code></pre>

<h3>Events in the IDL</h3>
<p>Events are included in the IDL under the <code>events</code> array, enabling type-safe event handling in clients.</p>

<p>Reference: <a href="https://www.anchor-lang.com/docs/features/events" target="_blank">Events Docs</a></p>
`,
    },
    // ─── Lesson 4: Zero Copy ────────────────────────────
    {
      title: "Zero Copy Accounts",
      description:
        "Use zero-copy deserialization for large accounts to minimize compute and memory usage.",
      type: "content",
      duration: "20 min",
      content: `
<h2>Zero Copy Accounts</h2>
<p>For large accounts, standard Borsh deserialization copies all data into memory. Zero-copy deserialization maps the account data directly, avoiding copies.</p>

<h3>When to Use Zero Copy</h3>
<ul>
  <li>Accounts larger than ~1-2 KB</li>
  <li>When CU budget is tight</li>
  <li>Accounts with large arrays or fixed-size data</li>
</ul>

<h3>Definition</h3>
<pre><code class="language-rust">// Must use repr(C) for memory layout compatibility
#[account(zero_copy)]
#[repr(C)]
pub struct LargeData {
    pub authority: Pubkey,
    pub data: [u64; 512],  // 4KB of data
    pub counter: u64,
}</code></pre>

<h3>Account Constraint</h3>
<pre><code class="language-rust">#[derive(Accounts)]
pub struct UpdateData&lt;'info&gt; {
    #[account(mut)]
    pub authority: Signer&lt;'info&gt;,
    #[account(
        mut,
        has_one = authority,
    )]
    pub data_account: AccountLoader&lt;'info, LargeData&gt;,
}

pub fn update(ctx: Context&lt;UpdateData&gt;, index: u32, value: u64) -&gt; Result&lt;()&gt; {
    let data = &mut ctx.accounts.data_account.load_mut()?;
    data.data[index as usize] = value;
    data.counter = data.counter.checked_add(1).unwrap();
    Ok(())
}</code></pre>

<h3>Key Differences</h3>
<table>
  <thead><tr><th>Feature</th><th>Normal</th><th>Zero Copy</th></tr></thead>
  <tbody>
    <tr><td>Account type</td><td><code>Account&lt;'info, T&gt;</code></td><td><code>AccountLoader&lt;'info, T&gt;</code></td></tr>
    <tr><td>Read access</td><td>Direct field access</td><td><code>.load()?</code></td></tr>
    <tr><td>Write access</td><td>Direct field mutation</td><td><code>.load_mut()?</code></td></tr>
    <tr><td>Struct attribute</td><td><code>#[account]</code></td><td><code>#[account(zero_copy)]</code> + <code>#[repr(C)]</code></td></tr>
  </tbody>
</table>

<p>Reference: <a href="https://www.anchor-lang.com/docs/features/zero-copy" target="_blank">Zero Copy Docs</a></p>
`,
    },
  ],
};
