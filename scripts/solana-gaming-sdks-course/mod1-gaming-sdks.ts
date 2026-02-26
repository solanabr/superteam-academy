import { CourseModule } from "../anchor-course/types";

export const MODULE_GAMING_SDKS: CourseModule = {
  title: "Solana Gaming SDKs",
  description:
    "Integrate Solana into games using Unity, Unreal Engine, and other gaming frameworks",
  lessons: [
    {
      title: "Gaming on Solana",
      description: "Overview of the Solana gaming ecosystem and available SDKs",
      type: "content",
      content: `<h2>Gaming on Solana</h2><p>Solana's low fees and fast finality make it ideal for blockchain gaming. Several community SDKs enable integration with popular game engines.</p><h3>Available Gaming SDKs</h3><ul><li><strong>Solana.Unity-SDK</strong> — full Unity integration (C#)</li><li><strong>Solana SDK for Unreal</strong> — Unreal Engine plugin (C++/Blueprints)</li><li><strong>Honeycomb Protocol</strong> — game state compression and player profiles</li><li><strong>Gameshift</strong> — managed API for game studios (by Solana Labs)</li></ul><h3>Why Solana for Games?</h3><ul><li><strong>400ms block times</strong> — near real-time on-chain actions</li><li><strong>Low fees</strong> — micro-transactions at fractions of a cent</li><li><strong>Compressed NFTs</strong> — mint millions of items cheaply</li><li><strong>Ecosystem</strong> — marketplaces, wallets, and DeFi integrations</li></ul><h3>Common Game Patterns</h3><ul><li>On-chain items as NFTs (Metaplex Core)</li><li>In-game currency as SPL tokens</li><li>Player profiles stored as PDAs</li><li>Leaderboards via on-chain state or indexers</li><li>Session keys for gasless UX</li></ul>`,
      xp: 30,
    },
    {
      title: "Solana Unity SDK",
      description: "Integrating Solana into Unity games with the C# SDK",
      type: "content",
      content: `<h2>Solana Unity SDK</h2><p>The <strong>Solana.Unity-SDK</strong> is a full-featured C# SDK for Unity that supports wallet connection, transaction signing, and NFT management.</p><h3>Installation</h3><p>Add via Unity Package Manager using the Git URL:</p><pre><code>https://github.com/magicblock-labs/Solana.Unity-SDK.git</code></pre><h3>Wallet Connection</h3><pre><code>using Solana.Unity.SDK;
using Solana.Unity.Wallet;

// Initialize wallet
var wallet = new PhantomWallet();
await wallet.Login();

// Get public key
string address = wallet.Account.PublicKey;</code></pre><h3>Sending Transactions</h3><pre><code>using Solana.Unity.Rpc;
using Solana.Unity.Programs;

var rpcClient = ClientFactory.GetClient(Cluster.DevNet);

// Transfer SOL
var tx = new TransactionBuilder()
    .SetRecentBlockHash(await rpcClient.GetLatestBlockhashAsync())
    .SetFeePayer(wallet.Account)
    .AddInstruction(SystemProgram.Transfer(
        wallet.Account.PublicKey,
        recipientPubkey,
        1_000_000_000 // 1 SOL
    ))
    .Build(wallet.Account);

var result = await rpcClient.SendTransactionAsync(tx);</code></pre><h3>NFT Integration</h3><pre><code>// Fetch NFTs owned by player
var nfts = await Nft.TryGetNftData(
    wallet.Account.PublicKey, rpcClient
);

foreach (var nft in nfts) {
    Debug.Log($"NFT: {nft.metadata.name}");
}</code></pre>`,
      xp: 30,
    },
    {
      title: "Unreal Engine & Other Frameworks",
      description: "Solana integration with Unreal Engine, Godot, and web-based game frameworks",
      type: "content",
      content: `<h2>Unreal Engine &amp; Other Frameworks</h2><h3>Unreal Engine SDK</h3><p>The Solana SDK for Unreal provides C++ and Blueprint nodes for wallet connection and transaction signing.</p><pre><code>// C++ - Get balance
#include "SolanaSDK.h"

void AMyActor::CheckBalance()
{
    USolanaRpc* Rpc = USolanaRpc::Create("https://api.devnet.solana.com");
    Rpc->GetBalance(PlayerPublicKey, [](int64 Lamports) {
        UE_LOG(LogTemp, Log, TEXT("Balance: %lld"), Lamports);
    });
}</code></pre><h3>Gameshift API</h3><p>Gameshift provides a managed REST API, abstracting blockchain complexity for game studios.</p><pre><code>// REST API (any language)
POST https://api.gameshift.dev/v1/items
{
  "collectionId": "your-collection",
  "destinationUserReferenceId": "player-123",
  "attributes": {
    "name": "Legendary Sword",
    "imageUrl": "https://..."
  }
}</code></pre><h3>Web-Based Games</h3><p>For browser games (Phaser, PixiJS, Three.js), use the standard TypeScript SDK:</p><pre><code>import { Connection, PublicKey } from "@solana/web3.js";

// Same web3.js or @solana/kit patterns
// Wallet adapter handles connection in-browser
// Session keys enable gasless gameplay</code></pre><h3>Choosing a Framework</h3><table><tr><th>Engine</th><th>SDK</th><th>Best For</th></tr><tr><td>Unity</td><td>Solana.Unity-SDK</td><td>Mobile, PC, WebGL</td></tr><tr><td>Unreal</td><td>Solana UE SDK</td><td>AAA, PC, Console</td></tr><tr><td>Web</td><td>@solana/web3.js</td><td>Browser games</td></tr><tr><td>Any</td><td>Gameshift API</td><td>Managed, REST-based</td></tr></table>`,
      xp: 30,
    },
  ],
};
