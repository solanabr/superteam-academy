import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { OnchainAcademy } from "../target/types/onchain_academy";
import { PublicKey, SystemProgram, Keypair } from "@solana/web3.js";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { generateSigner, keypairIdentity } from "@metaplex-foundation/umi";
import { fromWeb3JsKeypair, fromWeb3JsPublicKey } from "@metaplex-foundation/umi-web3js-adapters";
import { createCollectionV2 } from "@metaplex-foundation/mpl-core";

// КОНФИГУРАЦИЯ
const API_URL = "http://localhost:3000/api/admin/register-achievement";
// Вставь свой секрет из .env.local
const ADMIN_SECRET = "dev-secret"; 

const provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);
const program = anchor.workspace.onchainAcademy as Program<OnchainAcademy>;
const MPL_CORE_ID = new PublicKey("CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d");

const achievements = [
    { id: "first-steps", name: "First Steps", desc: "Complete your first lesson.", xp: 50, supply: 10000, image: "/images/achievements/first-steps.png" },
    { id: "course-completer", name: "Course Completer", desc: "Complete a full course.", xp: 200, supply: 10000, image: "/images/achievements/course-completer.png" },
    { id: "speed-runner", name: "Speed Runner", desc: "Complete 5 lessons in one day.", xp: 100, supply: 5000, image: "/images/achievements/speed-runner.png" },
    
    { id: "week-warrior", name: "Week Warrior", desc: "7 day streak.", xp: 150, supply: 5000, image: "/images/achievements/week-warrior.png" },
    { id: "monthly-master", name: "Monthly Master", desc: "30 day streak.", xp: 500, supply: 1000, image: "/images/achievements/monthly-master.png" },
    { id: "consistency-king", name: "Consistency King", desc: "100 day streak.", xp: 2000, supply: 100, image: "/images/achievements/consistency-king.png" },

    { id: "rust-rookie", name: "Rust Rookie", desc: "Complete Rust module.", xp: 100, supply: 10000, image: "/images/achievements/rust-rookie.png" },
    { id: "anchor-expert", name: "Anchor Expert", desc: "Complete Anchor advanced course.", xp: 300, supply: 5000, image: "/images/achievements/anchor-expert.png" },
    { id: "full-stack-solana", name: "Full Stack Solana", desc: "Complete frontend & backend courses.", xp: 500, supply: 1000, image: "/images/achievements/full-stack-solana.png" },

    { id: "helper", name: "Helper", desc: "Helped others in Discord.", xp: 100, supply: 1000, image: "/images/achievements/helper.png" },
    { id: "early-adopter", name: "Early Adopter", desc: "Joined during beta.", xp: 50, supply: 1000, image: "/images/achievements/early-adopter.png" },
];

async function main() {
    const [configPda] = PublicKey.findProgramAddressSync([Buffer.from("config")], program.programId);

    console.log("🚀 Starting Achievement Registration via API...");

    for (const ach of achievements) {
        const [achTypePda] = PublicKey.findProgramAddressSync(
            [Buffer.from("achievement"), Buffer.from(ach.id)],
            program.programId
        );

        let collectionAddress = "";
        let successOnChain = false;
        
        console.log(`\nProcessing: ${ach.name} (${ach.id})`);

        try {
            // 1. Генерируем просто пустой Keypair для будущей коллекции
            const collectionKeypair = Keypair.generate();
            const DOMAIN = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
            
            // 2. Смарт-контракт сделает всю магию сам
            await program.methods.createAchievementType({
                achievementId: ach.id,
                name: ach.name,
                metadataUri: `${DOMAIN}/api/metadata/badge/${ach.id}`, // <-- ДИНАМИЧЕСКИЙ URI
                maxSupply: ach.supply,
                xpReward: ach.xp
            })
            .accountsPartial({
                config: configPda,
                achievementType: achTypePda,
                collection: collectionKeypair.publicKey, 
                authority: provider.wallet.publicKey,
                payer: provider.wallet.publicKey,
                mplCoreProgram: MPL_CORE_ID,
                systemProgram: SystemProgram.programId,
            })
            .signers([collectionKeypair]) // Подписываем пустым Keypair, как в тестах
            .rpc();
            
            console.log(`   ✅ On-Chain Registered.`);
            collectionAddress = collectionKeypair.publicKey.toString();
            successOnChain = true;

        } catch (e: any) {
            if (e.message.includes("already in use")) {
                console.log(`   ⚠️  Already registered on-chain. Fetching existing...`);
                try {
                    const existingAchType = await program.account.achievementType.fetch(achTypePda);
                    collectionAddress = existingAchType.collection.toString();
                    console.log(`   Found existing collection: ${collectionAddress}`);
                    successOnChain = true;
                } catch (fetchErr) {
                    console.error(`   ❌ Failed to fetch existing:`, fetchErr);
                }
            } else {
                console.error(`   ❌ Error: ${e.message}`);
                continue; 
            }
        }

        // 3. Отправляем в API
        if (successOnChain && collectionAddress) {
            const payload = {
                id: ach.id,
                name: ach.name,
                description: ach.desc,
                image: ach.image, // <-- Берем из массива
                xpReward: ach.xp,
                collectionAddress: collectionAddress
            };

            try {
                const res = await fetch(API_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "x-admin-secret": ADMIN_SECRET },
                    body: JSON.stringify(payload)
                });
                if (res.ok) console.log(`   💾 Saved to DB`);
                else {
                    const errData: any = await res.json();
                    console.error(`   ❌ API Error: ${errData.error}`);
                }
            } catch (apiErr) {
                console.error(`   ❌ API Failed`, apiErr);
            }
        }
    }

    console.log("\n✨ All Done!");
}

main().catch(console.error);