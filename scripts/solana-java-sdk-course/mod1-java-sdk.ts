import { CourseModule } from "../anchor-course/types";

export const MODULE_JAVA_SDK: CourseModule = {
  title: "Solana Java SDK",
  description:
    "Build Solana applications with the community SolanaJ (Solanaj) SDK",
  lessons: [
    {
      title: "Java SDK Overview",
      description: "Introduction to Solana development with Java using SolanaJ",
      type: "content",
      content: `<h2>Solana Java SDK (SolanaJ)</h2><p><strong>SolanaJ</strong> is a community-maintained Java SDK for interacting with the Solana blockchain. It's suitable for enterprise applications, Android development, and JVM-based backends.</p><h3>Add Dependency</h3><pre><code>&lt;!-- Maven --&gt;
&lt;dependency&gt;
    &lt;groupId&gt;com.mmorrell&lt;/groupId&gt;
    &lt;artifactId&gt;solanaj&lt;/artifactId&gt;
    &lt;version&gt;1.19.2&lt;/version&gt;
&lt;/dependency&gt;</code></pre><pre><code>// Gradle
implementation 'com.mmorrell:solanaj:1.19.2'</code></pre><h3>Quick Example</h3><pre><code>import org.p2p.solanaj.rpc.RpcClient;
import org.p2p.solanaj.core.PublicKey;

RpcClient client = new RpcClient("https://api.devnet.solana.com");

PublicKey pubkey = new PublicKey("YourPublicKeyHere");
long balance = client.getApi().getBalance(pubkey);
System.out.println("Balance: " + balance + " lamports");</code></pre><h3>Use Cases</h3><ul><li>Android wallets and dApps</li><li>Enterprise backend services</li><li>Microservices on Spring Boot / Quarkus</li><li>Cross-platform JVM applications (Kotlin, Scala)</li></ul>`,
      xp: 30,
    },
    {
      title: "Transactions in Java",
      description: "Building and sending Solana transactions with SolanaJ",
      type: "content",
      content: `<h2>Transactions in Java</h2><h3>SOL Transfer</h3><pre><code>import org.p2p.solanaj.core.*;
import org.p2p.solanaj.rpc.RpcClient;
import org.p2p.solanaj.programs.SystemProgram;

RpcClient client = new RpcClient("https://api.devnet.solana.com");

// Create or load keypair
Account sender = new Account(); // generates new keypair

PublicKey recipient = new PublicKey("RecipientAddressHere");

// Build transfer instruction
TransactionInstruction transferIx = SystemProgram.transfer(
    sender.getPublicKey(),
    recipient,
    1_000_000_000L // 1 SOL
);

// Create and send transaction
Transaction tx = new Transaction();
tx.addInstruction(transferIx);

String signature = client.getApi().sendTransaction(tx, sender);
System.out.println("Signature: " + signature);</code></pre><h3>Reading Account Data</h3><pre><code>import org.p2p.solanaj.rpc.types.AccountInfo;

AccountInfo accountInfo = client.getApi().getAccountInfo(pubkey);
byte[] data = accountInfo.getDecodedData();
System.out.println("Data length: " + data.length);</code></pre><h3>Working with SPL Tokens</h3><pre><code>import org.p2p.solanaj.programs.TokenProgram;

// Get token accounts by owner
var tokenAccounts = client.getApi()
    .getTokenAccountsByOwner(owner, mintPubkey);</code></pre>`,
      xp: 30,
    },
  ],
};
