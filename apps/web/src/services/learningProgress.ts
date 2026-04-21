// Este arquivo serve como ponte para os jogos do Arcade
import { createClient } from "@/lib/supabase/client";
import { HybridProgressService } from "@/lib/services/hybrid-progress-service";

const supabase = createClient();

// Criamos uma instância única para ser usada nos componentes "use client"
export const learningProgressService = {
  /**
   * Ponte para o serviço real.
   * Os jogos antigos passavam 'wallet', mas agora usamos 'userId'.
   * Como o serviço de arcade apenas salva no localStorage, podemos usar o endereço da wallet como ID.
   */
  completeArcadeGame: async (params: {
    wallet: string;
    gameId: string;
    xp: number;
    score?: number;
  }) => {
    const service = new HybridProgressService(supabase);
    return service.completeArcadeGame({
      userId: params.wallet, // Usamos a wallet como identificador para o cache local do jogo
      gameId: params.gameId,
      xp: params.xp,
      score: params.score,
    });
  },
};
