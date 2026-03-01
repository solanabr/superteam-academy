"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Language = "en" | "pt-BR" | "es";

interface Translations {
  [key: string]: string | Translations;
}

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  languages: { code: Language; label: string; name: string }[];
}

const translations: Record<Language, Translations> = {
  en: {
    "nav.courses": "Courses",
    "nav.dashboard": "Dashboard",
    "nav.profile": "Profile",
    "nav.leaderboard": "Leaderboard",
    "nav.settings": "Settings",
    "nav.achievements": "Achievements",
    "nav.connectWallet": "Connect Wallet",
    "courses.title": "Courses",
    "courses.subtitle": "Curated learning paths from beginner to expert",
    "courses.searchPlaceholder": "Search courses...",
    "courses.enroll": "Enroll Now",
    "courses.continue": "Continue",
    "courses.preview": "Preview",
    "courses.lessons": "lessons",
    "courses.xp": "XP",
    "courses.beginner": "Beginner",
    "courses.intermediate": "Intermediate",
    "courses.advanced": "Advanced",
    "lesson.lesson": "Lesson",
    "lesson.of": "of",
    "lesson.completed": "Completed",
    "lesson.preview": "Preview",
    "lesson.challenge": "Challenge",
    "lesson.video": "Video",
    "lesson.reading": "Reading",
    "lesson.markComplete": "Mark as Complete",
    "lesson.xpReward": "+{{xp}} XP reward",
    "lesson.runTests": "Run Tests",
    "lesson.showSolution": "Show Solution",
    "lesson.hideSolution": "Hide Solution",
    "lesson.resetCode": "Reset Code",
    "lesson.testResults": "Test Results",
    "lesson.console": "Console",
    "lesson.allTestsPassed": "All tests passed!",
    "lesson.locked": "Lesson Locked",
    "lesson.enrollToUnlock": "Enroll in this course to unlock all lessons",
    "lesson.backToCourse": "Back to course",
    "dashboard.title": "Dashboard",
    "dashboard.welcome": "Welcome back!",
    "dashboard.totalXP": "Total XP",
    "dashboard.level": "Level",
    "dashboard.rank": "Rank",
    "dashboard.streak": "Streak",
    "dashboard.achievements": "Achievements",
    "leaderboard.title": "Leaderboard",
    "leaderboard.subtitle": "Top learners by XP",
    "leaderboard.allTime": "All Time",
    "leaderboard.monthly": "Monthly",
    "leaderboard.weekly": "Weekly",
    "leaderboard.rank": "Rank",
    "leaderboard.user": "User",
    "profile.title": "Profile",
    "profile.memberSince": "Member since",
    "profile.completedCourses": "Completed Courses",
    "settings.title": "Settings",
    "home.hero.title": "Master Solana Development",
    "home.hero.subtitle": "The decentralized learning platform where developers earn soulbound XP tokens and verifiable credentials.",
    "home.hero.cta": "Start Learning",
    "home.hero.explore": "Explore Courses",
  },
  "pt-BR": {
    "nav.courses": "Cursos",
    "nav.dashboard": "Painel",
    "nav.profile": "Perfil",
    "nav.leaderboard": "Ranking",
    "nav.settings": "Configurações",
    "nav.achievements": "Conquistas",
    "nav.connectWallet": "Conectar Carteira",
    "courses.title": "Cursos",
    "courses.subtitle": "Trilhas de aprendizado do iniciante ao expert",
    "courses.searchPlaceholder": "Buscar cursos...",
    "courses.enroll": "Matricular-se",
    "courses.continue": "Continuar",
    "courses.preview": "Preview",
    "courses.lessons": "lições",
    "courses.xp": "XP",
    "courses.beginner": "Iniciante",
    "courses.intermediate": "Intermediário",
    "courses.advanced": "Avançado",
    "lesson.lesson": "Lição",
    "lesson.of": "de",
    "lesson.completed": "Concluído",
    "lesson.preview": "Preview",
    "lesson.challenge": "Desafio",
    "lesson.video": "Vídeo",
    "lesson.reading": "Leitura",
    "lesson.markComplete": "Marcar como Concluído",
    "lesson.xpReward": "+{{xp}} XP de recompensa",
    "lesson.runTests": "Executar Testes",
    "lesson.showSolution": "Mostrar Solução",
    "lesson.hideSolution": "Ocultar Solução",
    "lesson.resetCode": "Resetar Código",
    "lesson.testResults": "Resultados dos Testes",
    "lesson.console": "Console",
    "lesson.allTestsPassed": "Todos os testes passaram!",
    "lesson.locked": "Lição Bloqueada",
    "lesson.enrollToUnlock": "Matcule-se no curso para desbloquear todas as lições",
    "lesson.backToCourse": "Voltar ao curso",
    "dashboard.title": "Painel",
    "dashboard.welcome": "Bem-vindo de volta!",
    "dashboard.totalXP": "XP Total",
    "dashboard.level": "Nível",
    "dashboard.rank": "Ranking",
    "dashboard.streak": "Sequência",
    "dashboard.achievements": "Conquistas",
    "leaderboard.title": "Ranking",
    "leaderboard.subtitle": "Principais aprendizes por XP",
    "leaderboard.allTime": "Todo o Tempo",
    "leaderboard.monthly": "Mensal",
    "leaderboard.weekly": "Semanal",
    "leaderboard.rank": "Posição",
    "leaderboard.user": "Usuário",
    "profile.title": "Perfil",
    "profile.memberSince": "Membro desde",
    "profile.completedCourses": "Cursos Concluídos",
    "settings.title": "Configurações",
    "home.hero.title": "Domine o Desenvolvimento Solana",
    "home.hero.subtitle": "A plataforma de aprendizado descentralizada onde desenvolvedores ganham tokens XP soulbound e credenciais verificáveis.",
    "home.hero.cta": "Começar a Aprender",
    "home.hero.explore": "Explorar Cursos",
  },
  es: {
    "nav.courses": "Cursos",
    "nav.dashboard": "Panel",
    "nav.profile": "Perfil",
    "nav.leaderboard": "Clasificación",
    "nav.settings": "Configuración",
    "nav.achievements": "Logros",
    "nav.connectWallet": "Conectar Billetera",
    "courses.title": "Cursos",
    "courses.subtitle": "Rutas de aprendizaje desde principiante hasta experto",
    "courses.searchPlaceholder": "Buscar cursos...",
    "courses.enroll": "Inscribirse",
    "courses.continue": "Continuar",
    "courses.preview": "Vista Previa",
    "courses.lessons": "lecciones",
    "courses.xp": "XP",
    "courses.beginner": "Principiante",
    "courses.intermediate": "Intermedio",
    "courses.advanced": "Avanzado",
    "lesson.lesson": "Lección",
    "lesson.of": "de",
    "lesson.completed": "Completado",
    "lesson.preview": "Vista Previa",
    "lesson.challenge": "Desafío",
    "lesson.video": "Video",
    "lesson.reading": "Lectura",
    "lesson.markComplete": "Marcar como Completado",
    "lesson.xpReward": "+{{xp}} XP de recompensa",
    "lesson.runTests": "Ejecutar Pruebas",
    "lesson.showSolution": "Mostrar Solución",
    "lesson.hideSolution": "Ocultar Solución",
    "lesson.resetCode": "Reiniciar Código",
    "lesson.testResults": "Resultados de Pruebas",
    "lesson.console": "Consola",
    "lesson.allTestsPassed": "¡Todas las pruebas pasaron!",
    "lesson.locked": "Lección Bloqueada",
    "lesson.enrollToUnlock": "Inscríbete en el curso para desbloquear todas las lecciones",
    "lesson.backToCourse": "Volver al curso",
    "dashboard.title": "Panel",
    "dashboard.welcome": "¡Bienvenido de nuevo!",
    "dashboard.totalXP": "XP Total",
    "dashboard.level": "Nivel",
    "dashboard.rank": "Rango",
    "dashboard.streak": "Racha",
    "dashboard.achievements": "Logros",
    "leaderboard.title": "Clasificación",
    "leaderboard.subtitle": "Mejores aprendices por XP",
    "leaderboard.allTime": "Todo el Tiempo",
    "leaderboard.monthly": "Mensual",
    "leaderboard.weekly": "Semanal",
    "leaderboard.rank": "Posición",
    "leaderboard.user": "Usuario",
    "profile.title": "Perfil",
    "profile.memberSince": "Miembro desde",
    "profile.completedCourses": "Cursos Completados",
    "settings.title": "Configuración",
    "home.hero.title": "Domina el Desarrollo en Solana",
    "home.hero.subtitle": "La plataforma de aprendizaje descentralizada donde los desarrolladores ganan tokens XP soulbound y credenciales verificables.",
    "home.hero.cta": "Comenzar a Aprender",
    "home.hero.explore": "Explorar Cursos",
  },
};

const languages = [
  { code: "en" as Language, label: "EN", name: "English" },
  { code: "pt-BR" as Language, label: "PT", name: "Português" },
  { code: "es" as Language, label: "ES", name: "Español" },
];

const validLanguages: Language[] = ["en", "pt-BR", "es"];

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem("language") as Language;
    if (saved && validLanguages.includes(saved)) {
      setLanguageState(saved);
    } else {
      setLanguageState("en");
      localStorage.setItem("language", "en");
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("language", lang);
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    const keys = key.split(".");
    let value: any = translations[language];

    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = value[k];
      } else {
        return key;
      }
    }

    if (typeof value !== "string") return key;

    if (params) {
      return value.replace(/\{\{(\w+)\}\}/g, (_, k) => String(params[k] ?? `{{${k}}}`));
    }

    return value;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t, languages }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return context;
}

export { languages };
export type { Language };
