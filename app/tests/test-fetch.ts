import { Connection, PublicKey } from "@solana/web3.js";
import { Program, AnchorProvider } from "@coral-xyz/anchor";
import * as fs from "fs";

// Load IDL
const onchainAcademyIdl = JSON.parse(fs.readFileSync("./src/lib/idl/onchain_academy.json", "utf8"));

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "https://api.devnet.solana.com";
const WALLET = "ERmu8Twv3ZwG3gx4TVcmRV17ZLDrvqthB4Jg6qsmrG46";
const COURSE_ID = "T3rRAhXlRSZcnoSVf83sCW";

async function main() {
    const connection = new Connection(RPC_URL, "confirmed");

    const provider = new AnchorProvider(
        connection,
        // @ts-ignore
        { publicKey: PublicKey.default, signTransaction: async () => { throw new Error("Read-only") }, signAllTransactions: async () => { throw new Error("Read-only") } },
        AnchorProvider.defaultOptions()
    );

    const program = new Program(onchainAcademyIdl as any, provider);

    const learner = new PublicKey(WALLET);
    const [enrollmentPda] = PublicKey.findProgramAddressSync([Buffer.from("enrollment"), Buffer.from(COURSE_ID), learner.toBuffer()], program.programId);

    console.log("Fetching PDA:", enrollmentPda.toBase58());
    try {
        const enrollment = await (program.account as any).enrollment.fetchNullable(enrollmentPda);
        console.log("Enrollment Data:", enrollment);
    } catch (e) {
        console.error("Fetch failed", e);
    }
}
main().catch(console.error);
