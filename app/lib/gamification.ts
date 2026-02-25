export const XP_CONFIG = {
  lesson: { min: 10, max: 50 },
  challenge: { min: 25, max: 100 },
  courseCompletion: { min: 500, max: 2000 },
  streak: { multiplier7: 1.25, multiplier30: 1.5, multiplier100: 2.0 },
} as const;

export function calcLevel(totalXP: number): number {
  return Math.floor(Math.sqrt(totalXP / 100));
}

export function xpToNextLevel(totalXP: number): {
  current: number;
  required: number;
  level: number;
} {
  const level = calcLevel(totalXP);
  const currentLevelXP = level * level * 100;
  const nextLevelXP = (level + 1) * (level + 1) * 100;
  return {
    current: totalXP - currentLevelXP,
    required: nextLevelXP - currentLevelXP,
    level,
  };
}

export function applyStreakMultiplier(baseXP: number, streakDays: number): number {
  if (streakDays >= 100) return Math.floor(baseXP * XP_CONFIG.streak.multiplier100);
  if (streakDays >= 30) return Math.floor(baseXP * XP_CONFIG.streak.multiplier30);
  if (streakDays >= 7) return Math.floor(baseXP * XP_CONFIG.streak.multiplier7);
  return baseXP;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  xp: number;
  icon: string;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_lesson',
    name: 'Primeira Lição',
    description: 'Completou a primeira lição',
    xp: 50,
    icon: '🎯',
  },
  {
    id: 'first_course',
    name: 'Primeiro Curso',
    description: 'Completou o primeiro curso',
    xp: 200,
    icon: '🎓',
  },
  {
    id: 'streak_7',
    name: 'Sequência de 7 Dias',
    description: '7 dias seguidos aprendendo',
    xp: 100,
    icon: '🔥',
  },
  {
    id: 'streak_30',
    name: 'Mês de Fogo',
    description: '30 dias seguidos aprendendo',
    xp: 500,
    icon: '💎',
  },
  {
    id: 'streak_100',
    name: 'Centenário',
    description: '100 dias seguidos aprendendo',
    xp: 2000,
    icon: '👑',
  },
  {
    id: 'solana_dev',
    name: 'Desenvolvedor Solana',
    description: 'Completou todos os cursos Solana',
    xp: 1000,
    icon: '⚡',
  },
  {
    id: 'early_adopter',
    name: 'Pioneiro',
    description: 'Um dos primeiros 100 usuários',
    xp: 300,
    icon: '🚀',
  },
  {
    id: 'challenge_master',
    name: 'Mestre dos Desafios',
    description: 'Completou 50 desafios de código',
    xp: 750,
    icon: '💻',
  },
  {
    id: 'top_10',
    name: 'Top 10',
    description: 'Entrou no top 10 do placar',
    xp: 500,
    icon: '🏆',
  },
  {
    id: 'credential_earner',
    name: 'Credencial On-Chain',
    description: 'Recebeu primeira credencial NFT',
    xp: 400,
    icon: '🔗',
  },
];

export function getLevelTitle(level: number): string {
  if (level >= 50) return 'Mestre Solana';
  if (level >= 30) return 'Expert Blockchain';
  if (level >= 20) return 'Desenvolvedor Sênior';
  if (level >= 10) return 'Desenvolvedor';
  if (level >= 5) return 'Aprendiz Avançado';
  if (level >= 2) return 'Aprendiz';
  return 'Iniciante';
}

export function getStreakBonus(streakDays: number): string {
  if (streakDays >= 100) return '2x XP';
  if (streakDays >= 30) return '1.5x XP';
  if (streakDays >= 7) return '1.25x XP';
  return '1x XP';
}

export function checkAchievements(
  completedLessons: number,
  completedCourses: number,
  streakDays: number,
  challengesCompleted: number,
  rank: number,
  credentialsEarned: number,
  isEarlyAdopter: boolean,
): string[] {
  const unlocked: string[] = [];

  if (completedLessons >= 1) unlocked.push('first_lesson');
  if (completedCourses >= 1) unlocked.push('first_course');
  if (streakDays >= 7) unlocked.push('streak_7');
  if (streakDays >= 30) unlocked.push('streak_30');
  if (streakDays >= 100) unlocked.push('streak_100');
  if (challengesCompleted >= 50) unlocked.push('challenge_master');
  if (rank <= 10 && rank > 0) unlocked.push('top_10');
  if (credentialsEarned >= 1) unlocked.push('credential_earner');
  if (isEarlyAdopter) unlocked.push('early_adopter');

  return unlocked;
}
