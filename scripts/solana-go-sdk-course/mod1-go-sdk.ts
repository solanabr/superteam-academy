import { CourseModule } from "../anchor-course/types";

export const MODULE_GO_SDK: CourseModule = {
  title: "Solana Go SDK",
  description:
    "Build Solana clients with the community Go SDK (gagliardetto/solana-go)",
  lessons: [
    {
      title: "Go SDK Overview",
      description: "Introduction to Solana development with Go",
      type: "content",
      content: `<h2>Solana Go SDK</h2><p>The community Go SDK (<code>gagliardetto/solana-go</code>) provides a comprehensive client library for interacting with Solana from Go applications.</p><h3>Installation</h3><pre><code>go get github.com/gagliardetto/solana-go
go get github.com/gagliardetto/solana-go/rpc</code></pre><h3>Quick Example</h3><pre><code>package main

import (
    "context"
    "fmt"
    "github.com/gagliardetto/solana-go"
    "github.com/gagliardetto/solana-go/rpc"
)

func main() {
    client := rpc.New("https://api.devnet.solana.com")

    pubkey := solana.MustPublicKeyFromBase58("YourPublicKeyHere")
    balance, err := client.GetBalance(context.Background(), pubkey, rpc.CommitmentConfirmed)
    if err != nil {
        panic(err)
    }
    fmt.Printf("Balance: %d lamports\\n", balance.Value)
}</code></pre><h3>Use Cases</h3><ul><li>High-performance trading bots and MEV searchers</li><li>Backend services and APIs</li><li>Blockchain indexers and data pipelines</li><li>CLI tools and automation</li></ul>`,
      xp: 30,
    },
    {
      title: "Transactions in Go",
      description: "Building and sending Solana transactions with the Go SDK",
      type: "content",
      content: `<h2>Transactions in Go</h2><h3>SOL Transfer</h3><pre><code>package main

import (
    "context"
    "fmt"
    "github.com/gagliardetto/solana-go"
    "github.com/gagliardetto/solana-go/programs/system"
    "github.com/gagliardetto/solana-go/rpc"
    confirm "github.com/gagliardetto/solana-go/rpc/sendAndConfirmTransaction"
    "github.com/gagliardetto/solana-go/rpc/ws"
)

func main() {
    client := rpc.New("https://api.devnet.solana.com")
    wsClient, _ := ws.Connect(context.Background(), "wss://api.devnet.solana.com")

    // Load or generate keypair
    sender := solana.MustPrivateKeyFromBase58("YourPrivateKeyHere")
    recipient := solana.MustPublicKeyFromBase58("RecipientHere")

    // Build transfer instruction
    transferIx := system.NewTransferInstruction(
        1_000_000_000, // 1 SOL
        sender.PublicKey(),
        recipient,
    ).Build()

    // Get recent blockhash
    recent, _ := client.GetLatestBlockhash(context.Background(), rpc.CommitmentFinalized)

    // Build transaction
    tx, _ := solana.NewTransaction(
        []solana.Instruction{transferIx},
        recent.Value.Blockhash,
        solana.TransactionPayer(sender.PublicKey()),
    )

    // Sign and send
    tx.Sign(func(key solana.PublicKey) *solana.PrivateKey {
        if sender.PublicKey().Equals(key) {
            return &sender
        }
        return nil
    })

    sig, _ := confirm.SendAndConfirmTransaction(
        context.Background(), client, wsClient, tx,
    )
    fmt.Printf("Signature: %s\\n", sig)
}</code></pre><h3>Reading Accounts</h3><pre><code>accountInfo, err := client.GetAccountInfo(context.Background(), pubkey)
if err == nil {
    fmt.Printf("Owner: %s\\n", accountInfo.Value.Owner)
    fmt.Printf("Data: %v\\n", accountInfo.Value.Data)
}</code></pre>`,
      xp: 30,
    },
  ],
};
