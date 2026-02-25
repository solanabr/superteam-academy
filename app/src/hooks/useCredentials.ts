import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

// Интерфейс для cNFT
export interface CredentialNFT {
  id: string;
  name: string;
  image: string;
  description: string;
  attributes: { trait_type: string; value: string }[];
}

export function useCredentials(walletAddress?: string) {
  const [credentials, setCredentials] = useState<CredentialNFT[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!walletAddress) {
        setLoading(false);
        return;
    }

    const fetchAssets = async () => {
      try {
        // Вызываем Helius DAS API через наш прокси или напрямую
        // Для скорости сделаем fetch через наш API-роут (нужно создать универсальный)
        // Или используем прямой fetch, если ключ не жалко светить (но лучше через API)
        
        // Создадим API роут /api/user/assets
        const res = await fetch(`/api/user/assets?wallet=${walletAddress}`);
        const data = await res.json();
        setCredentials(data);
      } catch (e) {
        console.error("Failed to fetch credentials", e);
      } finally {
        setLoading(false);
      }
    };

    fetchAssets();
  }, [walletAddress]);

  return { credentials, loading };
}