import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { OnchainAcademy } from "../target/types/onchain_academy";
import { PublicKey, SystemProgram, Keypair } from "@solana/web3.js";

// КОНФИГУРАЦИЯ
const API_URL = "http://localhost:3000/api/admin/register-achievement";
// Секрет должен совпадать с тем, что в API (по дефолту dev-secret если нет env)
// ВАЖНО: Если у тебя в .env.local есть NEXTAUTH_SECRET, используй его здесь
const ADMIN_SECRET = "dev-secret"; 

const provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);
const program = anchor.workspace.onchainAcademy as Program<OnchainAcademy>;
const MPL_CORE_ID = new PublicKey("CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d");

const achievements = [
    // Progress
    { id: "first-steps", name: "First Steps", desc: "Complete your first lesson.", xp: 50, supply: 10000 },
    { id: "course-completer", name: "Course Completer", desc: "Complete a full course.", xp: 200, supply: 10000 },
    { id: "speed-runner", name: "Speed Runner", desc: "Complete 5 lessons in one day.", xp: 100, supply: 5000 },
    
    // Streaks
    { id: "week-warrior", name: "Week Warrior", desc: "7 day streak.", xp: 150, supply: 5000 },
    { id: "monthly-master", name: "Monthly Master", desc: "30 day streak.", xp: 500, supply: 1000 },
    { id: "consistency-king", name: "Consistency King", desc: "100 day streak.", xp: 2000, supply: 100 },

    // Skills
    { id: "rust-rookie", name: "Rust Rookie", desc: "Complete Rust module.", xp: 100, supply: 10000 },
    { id: "anchor-expert", name: "Anchor Expert", desc: "Complete Anchor advanced course.", xp: 300, supply: 5000 },
    { id: "full-stack-solana", name: "Full Stack Solana", desc: "Complete frontend & backend courses.", xp: 500, supply: 1000 },

    // Community
    { id: "helper", name: "Helper", desc: "Helped others in Discord.", xp: 100, supply: 1000 },
    { id: "early-adopter", name: "Early Adopter", desc: "Joined during beta.", xp: 50, supply: 1000 },
];

async function main() {
    const [configPda] = PublicKey.findProgramAddressSync([Buffer.from("config")], program.programId);

    console.log("🚀 Starting Achievement Registration via API...");

    for (const ach of achievements) {
        const [achTypePda] = PublicKey.findProgramAddressSync(
            [Buffer.from("achievement"), Buffer.from(ach.id)],
            program.programId
        );

        // Генерируем новую коллекцию
        const achievementCollection = Keypair.generate();
        let collectionAddress = "";
        console.log(`\nProcessing: ${ach.name} (${ach.id})`);
        
        let successOnChain = false;

        try {
            const newCollection = Keypair.generate();
            // 1. Регистрируем в блокчейне
            await program.methods.createAchievementType({
                achievementId: ach.id,
                name: ach.name,
                metadataUri: `https://arweave.net/placeholder_${ach.id}`,
                maxSupply: ach.supply, 
                xpReward: ach.xp
            })
            .accountsPartial({
                config: configPda,
                achievementType: achTypePda,
                collection: achievementCollection.publicKey, 
                authority: provider.wallet.publicKey,
                payer: provider.wallet.publicKey,
                mplCoreProgram: MPL_CORE_ID,
                systemProgram: SystemProgram.programId,
            })
            .signers([achievementCollection])
            .rpc();
            
            collectionAddress = newCollection.publicKey.toString();
            console.log(`✅ On-Chain Registered. Collection: ${collectionAddress}`);
            successOnChain = true;

        } catch (e: any) {
            // Если ошибка "уже существует"
            if (e.message.includes("already in use")) {
                console.log(`⚠️  Already registered on-chain. Fetching existing data...`);
                try {
                    // ИСПРАВЛЕНИЕ: Читаем аккаунт из блокчейна
                    const existingAchType = await program.account.achievementType.fetch(achTypePda);
                    collectionAddress = existingAchType.collection.toString();
                    console.log(`   Found existing collection: ${collectionAddress}`);
                    successOnChain = true; // Считаем успехом, так как данные есть
                } catch (fetchErr) {
                    console.error(`❌ Failed to fetch existing achievement data:`, fetchErr);
                }
            } else {
                console.error(`❌ On-Chain Error: ${e.message}`);
                continue; // Пропускаем, если критическая ошибка
            }
        }

        // 2. Отправляем в API (БД)
        // Если была ошибка "already in use", мы не знаем старый адрес коллекции.
        // Мы отправляем новый адрес ТОЛЬКО если успешно создали.
        const payload = {
            id: ach.id,
            name: ach.name,
            description: ach.desc,
            image: `https://api.dicebear.com/7.x/icons/svg?seed=${ach.id}`,
            xpReward: ach.xp,
            collectionAddress: successOnChain ? achievementCollection.publicKey.toString() : undefined
        };

        try {
            const res = await fetch(API_URL, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "x-admin-secret": ADMIN_SECRET
                },
                body: JSON.stringify(payload)
            });

            const data: any = await res.json();
            if (res.ok) {
                console.log(`💾 Saved to Database via API`);
            } else {
                console.error(`❌ API Error: ${data.error || 'Unknown error'}`);
            }
        } catch (apiErr) {
            console.error(`❌ API Connection Failed`, apiErr);
        }
    }

    console.log("\n✨ All Done!");
}

main().catch(console.error);