import { NextRequest, NextResponse } from 'next/server';

interface Challenge {
  id: string;
  title: Record<string, string>;
  description: Record<string, string>;
  difficulty: 'easy' | 'medium' | 'hard';
  xpReward: number;
  track: string;
  type: 'code' | 'quiz' | 'project';
  timeLimit: number; // minutes
}

const CHALLENGES: Challenge[] = [
  {
    id: 'ch-001',
    title: { 'pt-BR': 'Hello Solana', en: 'Hello Solana', es: 'Hola Solana' },
    description: { 'pt-BR': 'Crie um programa simples que imprime "Hello Solana"', en: 'Create a simple program that prints "Hello Solana"', es: 'Crea un programa simple que imprima "Hello Solana"' },
    difficulty: 'easy',
    xpReward: 50,
    track: 'solana',
    type: 'code',
    timeLimit: 30,
  },
  {
    id: 'ch-002',
    title: { 'pt-BR': 'Transferencia de Tokens', en: 'Token Transfer', es: 'Transferencia de Tokens' },
    description: { 'pt-BR': 'Implemente uma transferencia SPL Token entre duas carteiras', en: 'Implement an SPL Token transfer between two wallets', es: 'Implementa una transferencia SPL Token entre dos wallets' },
    difficulty: 'medium',
    xpReward: 100,
    track: 'solana',
    type: 'code',
    timeLimit: 45,
  },
  {
    id: 'ch-003',
    title: { 'pt-BR': 'Quiz: Contas Solana', en: 'Quiz: Solana Accounts', es: 'Quiz: Cuentas Solana' },
    description: { 'pt-BR': 'Teste seus conhecimentos sobre o modelo de contas', en: 'Test your knowledge of the account model', es: 'Pon a prueba tus conocimientos sobre el modelo de cuentas' },
    difficulty: 'easy',
    xpReward: 25,
    track: 'solana',
    type: 'quiz',
    timeLimit: 15,
  },
  {
    id: 'ch-004',
    title: { 'pt-BR': 'AMM Simples', en: 'Simple AMM', es: 'AMM Simple' },
    description: { 'pt-BR': 'Construa um AMM basico com constant product', en: 'Build a basic constant-product AMM', es: 'Construye un AMM basico con constant product' },
    difficulty: 'hard',
    xpReward: 200,
    track: 'defi',
    type: 'project',
    timeLimit: 120,
  },
  {
    id: 'ch-005',
    title: { 'pt-BR': 'Mint NFT', en: 'Mint NFT', es: 'Mint NFT' },
    description: { 'pt-BR': 'Crie um NFT usando Metaplex', en: 'Create an NFT using Metaplex', es: 'Crea un NFT usando Metaplex' },
    difficulty: 'medium',
    xpReward: 75,
    track: 'nft',
    type: 'code',
    timeLimit: 60,
  },
];

export async function GET(request: NextRequest) {
  const track = request.nextUrl.searchParams.get('track');
  const difficulty = request.nextUrl.searchParams.get('difficulty');
  const locale = request.nextUrl.searchParams.get('locale') ?? 'en';

  let challenges = [...CHALLENGES];
  if (track) challenges = challenges.filter(c => c.track === track);
  if (difficulty) challenges = challenges.filter(c => c.difficulty === difficulty);

  const localized = challenges.map(c => ({
    ...c,
    title: c.title[locale] ?? c.title['en'],
    description: c.description[locale] ?? c.description['en'],
  }));

  return NextResponse.json({ challenges: localized, total: localized.length });
}
