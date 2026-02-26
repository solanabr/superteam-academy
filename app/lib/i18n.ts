export type Language = "en" | "pt" | "es";

export const translations = {
  en: {
    nav: {
      courses: "COURSES",
      leaderboard: "LEADERBOARD",
      dashboard: "DASHBOARD",
    },
    home: {
      hero_title_1: "LEARN",
      hero_title_2: "BUILD",
      hero_title_3: "EARN.",
      hero_desc: "The most advanced on-chain learning platform for Solana builders.",
      cta_start: "START LEARNING FREE",
      cta_leaderboard: "VIEW LEADERBOARD",
      stats_learners: "Active learners",
      stats_courses: "Courses available",
      stats_xp: "XP distributed",
      stats_credentials: "Credentials issued",
    },
    courses: {
      title: "ALL COURSES",
      search: "SEARCH_COURSES...",
      results: "RESULTS",
      enroll: "ENROLL_NOW",
      continue: "CONTINUE_LEARNING",
    },
    dashboard: {
      title: "GM, BUILDER",
      active_courses: "ACTIVE_COURSES",
      achievements: "ACHIEVEMENTS",
      recommended: "RECOMMENDED_COURSES",
    },
    common: {
      connect_wallet: "CONNECT WALLET",
      select_wallet: "SELECT WALLET",
      xp: "XP",
      level: "LVL",
    },
  },
  pt: {
    nav: {
      courses: "CURSOS",
      leaderboard: "CLASSIFICAÇÃO",
      dashboard: "PAINEL",
    },
    home: {
      hero_title_1: "APRENDER",
      hero_title_2: "CONSTRUIR",
      hero_title_3: "GANHAR.",
      hero_desc: "A plataforma de aprendizado on-chain mais avançada para desenvolvedores Solana.",
      cta_start: "COMEÇAR GRÁTIS",
      cta_leaderboard: "VER CLASSIFICAÇÃO",
      stats_learners: "Alunos ativos",
      stats_courses: "Cursos disponíveis",
      stats_xp: "XP distribuído",
      stats_credentials: "Credenciais emitidas",
    },
    courses: {
      title: "TODOS OS CURSOS",
      search: "BUSCAR_CURSOS...",
      results: "RESULTADOS",
      enroll: "INSCREVER_AGORA",
      continue: "CONTINUAR_APRENDENDO",
    },
    dashboard: {
      title: "OLÁ, CONSTRUTOR",
      active_courses: "CURSOS_ATIVOS",
      achievements: "CONQUISTAS",
      recommended: "CURSOS_RECOMENDADOS",
    },
    common: {
      connect_wallet: "CONECTAR CARTEIRA",
      select_wallet: "SELECIONAR CARTEIRA",
      xp: "XP",
      level: "NVL",
    },
  },
  es: {
    nav: {
      courses: "CURSOS",
      leaderboard: "CLASIFICACIÓN",
      dashboard: "PANEL",
    },
    home: {
      hero_title_1: "APRENDER",
      hero_title_2: "CONSTRUIR",
      hero_title_3: "GANAR.",
      hero_desc: "La plataforma de aprendizaje on-chain más avanzada para desarrolladores de Solana.",
      cta_start: "EMPEZAR GRATIS",
      cta_leaderboard: "VER CLASIFICACIÓN",
      stats_learners: "Alumnos activos",
      stats_courses: "Cursos disponibles",
      stats_xp: "XP distribuido",
      stats_credentials: "Credenciales emitidas",
    },
    courses: {
      title: "TODOS LOS CURSOS",
      search: "BUSCAR_CURSOS...",
      results: "RESULTADOS",
      enroll: "INSCRIBIRSE_AHORA",
      continue: "CONTINUAR_APRENDIENDO",
    },
    dashboard: {
      title: "HOLA, CONSTRUCTOR",
      active_courses: "CURSOS_ACTIVOS",
      achievements: "LOGROS",
      recommended: "CURSOS_RECOMENDADOS",
    },
    common: {
      connect_wallet: "CONECTAR BILLETERA",
      select_wallet: "SELECCIONAR BILLETERA",
      xp: "XP",
      level: "NVL",
    },
  },
};

export function t(lang: Language, path: string): string {
  const keys = path.split(".");
  let result: any = translations[lang];
  for (const key of keys) {
    result = result?.[key];
  }
  return result || path;
}