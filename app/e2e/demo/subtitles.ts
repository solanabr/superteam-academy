export interface Subtitle {
  id: string;
  startTime: number;
  duration: number;
  text: {
    en: string;
    "pt-BR": string;
  };
}

export const SUBTITLES: Subtitle[] = [
  {
    id: "hero",
    startTime: 0,
    duration: 5,
    text: {
      en: "Welcome to Superteam Academy — the first on-chain learning platform on Solana. Every lesson, every credential, verified on the blockchain.",
      "pt-BR":
        "Bem-vindo à Superteam Academy — a primeira plataforma de aprendizado on-chain na Solana. Cada lição, cada credencial, verificada na blockchain.",
    },
  },
  {
    id: "features",
    startTime: 5,
    duration: 4,
    text: {
      en: "Four pillars: on-chain verification, XP tokens via Token-2022, soulbound credential NFTs, and a community leaderboard.",
      "pt-BR":
        "Quatro pilares: verificação on-chain, tokens XP via Token-2022, NFTs de credenciais soulbound e um leaderboard comunitário.",
    },
  },
  {
    id: "catalog",
    startTime: 9,
    duration: 5,
    text: {
      en: "Browse courses by track and difficulty. Each course is created on-chain with immutable content stored on Arweave.",
      "pt-BR":
        "Navegue pelos cursos por trilha e dificuldade. Cada curso é criado on-chain com conteúdo imutável armazenado no Arweave.",
    },
  },
  {
    id: "course-detail",
    startTime: 14,
    duration: 6,
    text: {
      en: "Dive into course details with enrollment stats, XP rewards, and expandable lesson modules showing your progress.",
      "pt-BR":
        "Explore os detalhes do curso com estatísticas de inscrição, recompensas XP e módulos de lições expansíveis mostrando seu progresso.",
    },
  },
  {
    id: "lesson",
    startTime: 20,
    duration: 6,
    text: {
      en: "Interactive lessons feature a split-pane layout with content and a built-in code editor. Complete quizzes to earn XP on-chain.",
      "pt-BR":
        "Lições interativas com layout dividido entre conteúdo e editor de código integrado. Complete quizzes para ganhar XP on-chain.",
    },
  },
  {
    id: "dashboard",
    startTime: 26,
    duration: 5,
    text: {
      en: "Your dashboard shows total XP, level progression, daily streaks, leaderboard rank, and available courses.",
      "pt-BR":
        "Seu painel mostra XP total, progressão de nível, sequências diárias, ranking no leaderboard e cursos disponíveis.",
    },
  },
  {
    id: "profile",
    startTime: 31,
    duration: 5,
    text: {
      en: "Your profile showcases skills on a radar chart, on-chain credential NFTs, and achievement badges.",
      "pt-BR":
        "Seu perfil exibe habilidades em um gráfico radar, NFTs de credenciais on-chain e badges de conquistas.",
    },
  },
  {
    id: "leaderboard",
    startTime: 36,
    duration: 4,
    text: {
      en: "Compete on the XP leaderboard with time-based and course-based filters. Gold, silver, bronze rank badges.",
      "pt-BR":
        "Compita no leaderboard de XP com filtros por tempo e curso. Badges de ouro, prata e bronze.",
    },
  },
  {
    id: "settings",
    startTime: 40,
    duration: 6,
    text: {
      en: "Customize your experience: dark and light themes, three languages, privacy controls, and OAuth connections.",
      "pt-BR":
        "Personalize sua experiência: temas claro e escuro, três idiomas, controles de privacidade e conexões OAuth.",
    },
  },
  {
    id: "responsive",
    startTime: 46,
    duration: 4,
    text: {
      en: "Fully responsive design with mobile navigation, optimized for every screen size.",
      "pt-BR":
        "Design totalmente responsivo com navegação mobile, otimizado para todos os tamanhos de tela.",
    },
  },
  {
    id: "i18n",
    startTime: 50,
    duration: 3,
    text: {
      en: "Full internationalization: English, Portuguese, and Spanish — real-time language switching.",
      "pt-BR":
        "Internacionalização completa: inglês, português e espanhol — troca de idioma em tempo real.",
    },
  },
];

export function getSubtitleByScene(sceneId: string): Subtitle | undefined {
  return SUBTITLES.find((s) => s.id === sceneId);
}

export function exportSRT(lang: "en" | "pt-BR"): string {
  return SUBTITLES.map((s, i) => {
    const start = formatSRTTime(s.startTime);
    const end = formatSRTTime(s.startTime + s.duration);
    return `${i + 1}\n${start} --> ${end}\n${s.text[lang]}\n`;
  }).join("\n");
}

function formatSRTTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${pad(h)}:${pad(m)}:${pad(s)},000`;
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}
