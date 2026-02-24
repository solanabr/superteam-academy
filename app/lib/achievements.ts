export interface Achievement {
  id: string;
  name: Record<string, string>;
  description: Record<string, string>;
  icon: string;
  unlocked: boolean;
}

// Mock data — replace with on-chain integration via getAchievementReceipt PDA
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function getMockAchievements(locale: string): Achievement[] {
  return [
    {
      id: "first-enrollment",
      name: { en: "First Steps", "pt-BR": "Primeiros Passos", es: "Primeros Pasos" },
      description: {
        en: "Enroll in your first course",
        "pt-BR": "Matricule-se no primeiro curso",
        es: "Inscríbete en tu primer curso",
      },
      icon: "🎓",
      unlocked: true,
    },
    {
      id: "first-completion",
      name: { en: "Graduate", "pt-BR": "Formado", es: "Graduado" },
      description: {
        en: "Complete your first course",
        "pt-BR": "Conclua seu primeiro curso",
        es: "Completa tu primer curso",
      },
      icon: "🏆",
      unlocked: false,
    },
    {
      id: "xp-1000",
      name: { en: "XP Hunter", "pt-BR": "Caçador de XP", es: "Cazador de XP" },
      description: {
        en: "Earn 1,000 XP total",
        "pt-BR": "Ganhe 1.000 XP no total",
        es: "Gana 1.000 XP en total",
      },
      icon: "⚡",
      unlocked: false,
    },
    {
      id: "streak-7",
      name: { en: "On Fire", "pt-BR": "Em Chamas", es: "En Llamas" },
      description: {
        en: "Maintain a 7-day streak",
        "pt-BR": "Mantenha uma sequência de 7 dias",
        es: "Mantén una racha de 7 días",
      },
      icon: "🔥",
      unlocked: false,
    },
    {
      id: "multi-track",
      name: { en: "Explorer", "pt-BR": "Explorador", es: "Explorador" },
      description: {
        en: "Complete courses in 2 different tracks",
        "pt-BR": "Complete cursos em 2 trilhas diferentes",
        es: "Completa cursos en 2 pistas diferentes",
      },
      icon: "🧭",
      unlocked: false,
    },
    {
      id: "perfect-quiz",
      name: { en: "Perfectionist", "pt-BR": "Perfeccionista", es: "Perfeccionista" },
      description: {
        en: "Score 100% on a quiz on first attempt",
        "pt-BR": "Acerte 100% de um quiz na primeira tentativa",
        es: "Obtén 100% en un quiz en el primer intento",
      },
      icon: "💎",
      unlocked: false,
    },
  ];
}
