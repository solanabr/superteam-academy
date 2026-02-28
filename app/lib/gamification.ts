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

export interface AchievementI18n {
  id: string;
  name: Record<string, string>;
  description: Record<string, string>;
  xp: number;
  icon: string;
}

export const ACHIEVEMENTS_I18N: AchievementI18n[] = [
  { id: 'first_lesson', name: { 'pt-BR': 'Primeira Licao', en: 'First Lesson', es: 'Primera Leccion' }, description: { 'pt-BR': 'Completou a primeira licao', en: 'Completed your first lesson', es: 'Completo la primera leccion' }, xp: 50, icon: '\u{1F3AF}' },
  { id: 'first_course', name: { 'pt-BR': 'Primeiro Curso', en: 'First Course', es: 'Primer Curso' }, description: { 'pt-BR': 'Completou o primeiro curso', en: 'Completed your first course', es: 'Completo el primer curso' }, xp: 200, icon: '\u{1F393}' },
  { id: 'streak_7', name: { 'pt-BR': 'Sequencia de 7 Dias', en: '7-Day Streak', es: 'Racha de 7 Dias' }, description: { 'pt-BR': '7 dias seguidos aprendendo', en: '7 consecutive days learning', es: '7 dias seguidos aprendiendo' }, xp: 100, icon: '\u{1F525}' },
  { id: 'streak_30', name: { 'pt-BR': 'Mes de Fogo', en: 'Month on Fire', es: 'Mes en Llamas' }, description: { 'pt-BR': '30 dias seguidos aprendendo', en: '30 consecutive days learning', es: '30 dias seguidos aprendiendo' }, xp: 500, icon: '\u{1F48E}' },
  { id: 'streak_100', name: { 'pt-BR': 'Centenario', en: 'Centurion', es: 'Centenario' }, description: { 'pt-BR': '100 dias seguidos aprendendo', en: '100 consecutive days learning', es: '100 dias seguidos aprendiendo' }, xp: 2000, icon: '\u{1F451}' },
  { id: 'solana_dev', name: { 'pt-BR': 'Desenvolvedor Solana', en: 'Solana Developer', es: 'Desarrollador Solana' }, description: { 'pt-BR': 'Completou todos os cursos Solana', en: 'Completed all Solana courses', es: 'Completo todos los cursos Solana' }, xp: 1000, icon: '\u26A1' },
  { id: 'early_adopter', name: { 'pt-BR': 'Pioneiro', en: 'Early Adopter', es: 'Pionero' }, description: { 'pt-BR': 'Um dos primeiros 100 usuarios', en: 'One of the first 100 users', es: 'Uno de los primeros 100 usuarios' }, xp: 300, icon: '\u{1F680}' },
  { id: 'challenge_master', name: { 'pt-BR': 'Mestre dos Desafios', en: 'Challenge Master', es: 'Maestro de Desafios' }, description: { 'pt-BR': 'Completou 50 desafios de codigo', en: 'Completed 50 code challenges', es: 'Completo 50 desafios de codigo' }, xp: 750, icon: '\u{1F4BB}' },
  { id: 'top_10', name: { 'pt-BR': 'Top 10', en: 'Top 10', es: 'Top 10' }, description: { 'pt-BR': 'Entrou no top 10 do placar', en: 'Entered the top 10 leaderboard', es: 'Entro en el top 10 del ranking' }, xp: 500, icon: '\u{1F3C6}' },
  { id: 'credential_earner', name: { 'pt-BR': 'Credencial On-Chain', en: 'On-Chain Credential', es: 'Credencial On-Chain' }, description: { 'pt-BR': 'Recebeu primeira credencial NFT', en: 'Earned first NFT credential', es: 'Recibio primera credencial NFT' }, xp: 400, icon: '\u{1F517}' },
];

// Backward-compatible wrapper that returns pt-BR names (default)
export const ACHIEVEMENTS: Achievement[] = ACHIEVEMENTS_I18N.map(a => ({
  id: a.id,
  name: a.name['pt-BR'],
  description: a.description['pt-BR'],
  xp: a.xp,
  icon: a.icon,
}));

const LEVEL_TITLES: Record<string, Record<string, string>> = {
  '50': { 'pt-BR': 'Mestre Solana', en: 'Solana Master', es: 'Maestro Solana' },
  '30': { 'pt-BR': 'Expert Blockchain', en: 'Blockchain Expert', es: 'Experto Blockchain' },
  '20': { 'pt-BR': 'Desenvolvedor Senior', en: 'Senior Developer', es: 'Desarrollador Senior' },
  '10': { 'pt-BR': 'Desenvolvedor', en: 'Developer', es: 'Desarrollador' },
  '5': { 'pt-BR': 'Aprendiz Avancado', en: 'Advanced Learner', es: 'Aprendiz Avanzado' },
  '2': { 'pt-BR': 'Aprendiz', en: 'Learner', es: 'Aprendiz' },
  '0': { 'pt-BR': 'Iniciante', en: 'Beginner', es: 'Principiante' },
};

export function getLevelTitle(level: number, locale: string = 'pt-BR'): string {
  const thresholds = [50, 30, 20, 10, 5, 2, 0];
  for (const t of thresholds) {
    if (level >= t) return LEVEL_TITLES[String(t)][locale] ?? LEVEL_TITLES[String(t)]['pt-BR'];
  }
  return LEVEL_TITLES['0'][locale] ?? LEVEL_TITLES['0']['pt-BR'];
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
  // Note: solana_dev achievement requires checking all Solana courses completed
  // which needs course data — checked separately in the content layer

  return unlocked;
}
