// app/src/lib/server.ts
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { Program, AnchorProvider, Wallet, Idl } from "@coral-xyz/anchor";
import fs from "fs";
import path from "path";
import { PROGRAM_ID } from "@/lib/constants";
import idl from "@/lib/idl/onchain_academy.json";
import type { OnchainAcademy } from "@/types/onchain_academy";

// 1. Настройка соединения (используем Helius или Devnet)
const RPC_URL = process.env.NEXT_PUBLIC_CLUSTER === 'devnet' 
  ? "https://api.devnet.solana.com" 
  : "https://api.mainnet-beta.solana.com";

// Если есть Helius ключ в env, лучше использовать его и на бэкенде
// const CONNECTION = new Connection(process.env.HELIUS_RPC || RPC_URL);
export const connection = new Connection(process.env.HELIUS_RPC || RPC_URL, "confirmed");

// 2. Загрузка кошелька бэкенда (Backend Signer)
const loadBackendWallet = (): Wallet => {
  try {
    // Путь к ключу. В продакшене лучше использовать переменную окружения с самим ключом, 
    // но для хакатона чтение файла допустимо.
    // Мы ищем файл относительно корня проекта (где лежит package.json)
    // В .env.local у нас: BACKEND_SIGNER_KEYPAIR="../wallets/signer.json"
    
    const keyPath = process.env.BACKEND_SIGNER_KEYPAIR;
    
    if (!keyPath) {
        throw new Error("BACKEND_SIGNER_KEYPAIR not set in .env.local");
    }

    // Резолвим путь. process.cwd() в Next.js указывает на корень app/
    const fullPath = path.resolve(process.cwd(), keyPath);
    
    const keypairFile = JSON.parse(fs.readFileSync(fullPath, "utf-8"));
    const keypair = Keypair.fromSecretKey(new Uint8Array(keypairFile));
    
    return new Wallet(keypair);
  } catch (error) {
    console.error("Failed to load backend wallet:", error);
    throw new Error("Backend wallet configuration error");
  }
};

// 3. Инициализация Программы (Server-Side)
export const getServerProgram = () => {
  const wallet = loadBackendWallet();
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  
  // @ts-ignore - игнорируем несовпадение типов JSON IDL
  return new Program<OnchainAcademy>(idl, provider);
};

// Экспортируем кошелек отдельно, если понадобится подписать транзакцию
export const getBackendWallet = () => loadBackendWallet();