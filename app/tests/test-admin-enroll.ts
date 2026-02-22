import { Connection, Keypair, PublicKey, Transaction, SystemProgram } from "@solana/web3.js";
import { Program, AnchorProvider } from "@coral-xyz/anchor";
import bs58 from "bs58";
import * as fs from "fs";

// Load IDL
const onchainAcademyIdl = JSON.parse(fs.readFileSync("./src/lib/idl/onchain_academy.json", "utf8"));

// Constants
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "https://api.devnet.solana.com";
const WALLET = "ERmu8Twv3ZwG3gx4TVcmRV17ZLDrvqthB4Jg6qsmrG46";
const COURSE_ID = "T3rRAhXlRSZcnoSVf83sCW";

async function main() {
    const env = fs.readFileSync(".env", "utf8");
    const match = env.match(/BACKEND_WALLET_PRIVATE_KEY="([^"]+)"/);
    if (!match) throw new Error("Key not found");

    const backendWallet = Keypair.fromSecretKey(bs58.decode(match[1]));
    const connection = new Connection(RPC_URL, "confirmed");

    const provider = new AnchorProvider(
        connection,
        // @ts-ignore
        { publicKey: backendWallet.publicKey, signTransaction: async (tx) => { tx.sign(backendWallet); return tx; }, signAllTransactions: async (txs) => { txs.forEach(t => t.sign(backendWallet)); return txs; } },
        AnchorProvider.defaultOptions()
    );

    const program = new Program(onchainAcademyIdl as any, provider);

    const learner = new PublicKey(WALLET);
    const [coursePda] = PublicKey.findProgramAddressSync([Buffer.from("course"), Buffer.from(COURSE_ID)], program.programId);
    const [enrollmentPda] = PublicKey.findProgramAddressSync([Buffer.from("enrollment"), Buffer.from(COURSE_ID), learner.toBuffer()], program.programId);
    const [configPda] = PublicKey.findProgramAddressSync([Buffer.from("config")], program.programId);

    console.log("Config:", configPda.toBase58());
    console.log("Course:", coursePda.toBase58());
    console.log("Enrollment:", enrollmentPda.toBase58());
    console.log("Learner:", learner.toBase58());
    console.log("Authority:", backendWallet.publicKey.toBase58());

    try {
        const tx = await program.methods
            .adminEnroll(COURSE_ID)
            .accounts({
                config: configPda,
                course: coursePda,
                enrollment: enrollmentPda,
                learner: learner,
                authority: backendWallet.publicKey,
                systemProgram: SystemProgram.programId,
            } as any)
            .transaction();

        tx.feePayer = backendWallet.publicKey;
        tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
        tx.sign(backendWallet);

        console.log("Sending transaction...");
        const sig = await connection.sendRawTransaction(tx.serialize());
        console.log("Sent admin-enroll tx:", sig);

        const confirmation = await connection.confirmTransaction(sig, "confirmed");
        if (confirmation.value.err) {
            console.error("Admin-enroll tx failed:", confirmation.value.err);
        } else {
            console.log("Admin-enroll tx confirmed!");
        }
    } catch (err: any) {
        if (err.logs) {
            console.error("Simulation logs:", err.logs);
        } else {
            console.error("Error executing admin_enroll:", err);
        }
    }
}

main().catch(console.error);
