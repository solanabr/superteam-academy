export type CourseLevel = 'beginner' | 'intermediate' | 'advanced';
export type CourseTrack = 'solana' | 'defi' | 'nft' | 'web3' | 'anchor';

export interface CourseTitle {
  'pt-BR': string;
  en: string;
  es: string;
}

export interface Course {
  id: string;
  slug: string;
  title: CourseTitle;
  description: CourseTitle;
  level: CourseLevel;
  track: CourseTrack;
  xp_reward: number;
  lesson_count: number;
  duration: string;
  thumbnail_color: string;
  thumbnail_icon: string;
  enrollments: number;
  tags: string[];
}

export const MOCK_COURSES: Course[] = [
  {
    id: 'solana-101',
    slug: 'solana-101',
    title: {
      'pt-BR': 'Solana 101: Fundamentos',
      en: 'Solana 101: Fundamentals',
      es: 'Solana 101: Fundamentos',
    },
    description: {
      'pt-BR':
        'Aprenda os conceitos fundamentais da blockchain Solana, incluindo contas, transações e programas.',
      en: 'Learn the fundamental concepts of the Solana blockchain, including accounts, transactions and programs.',
      es: 'Aprende los conceptos fundamentales de la blockchain Solana, incluyendo cuentas, transacciones y programas.',
    },
    level: 'beginner',
    track: 'solana',
    xp_reward: 500,
    lesson_count: 12,
    duration: '6h',
    thumbnail_color: 'from-purple-600 to-blue-600',
    thumbnail_icon: '⚡',
    enrollments: 1247,
    tags: ['solana', 'blockchain', 'web3', 'iniciante'],
  },
  {
    id: 'anchor-framework',
    slug: 'anchor-framework',
    title: {
      'pt-BR': 'Desenvolvimento com Anchor',
      en: 'Development with Anchor',
      es: 'Desarrollo con Anchor',
    },
    description: {
      'pt-BR':
        'Domine o framework Anchor para criar smart contracts Solana de forma eficiente e segura.',
      en: 'Master the Anchor framework to create Solana smart contracts efficiently and securely.',
      es: 'Domina el framework Anchor para crear smart contracts de Solana de forma eficiente y segura.',
    },
    level: 'intermediate',
    track: 'anchor',
    xp_reward: 1200,
    lesson_count: 20,
    duration: '12h',
    thumbnail_color: 'from-orange-500 to-red-600',
    thumbnail_icon: '⚓',
    enrollments: 876,
    tags: ['anchor', 'solana', 'rust', 'smart-contracts'],
  },
  {
    id: 'defi-solana',
    slug: 'defi-solana',
    title: {
      'pt-BR': 'DeFi na Solana',
      en: 'DeFi on Solana',
      es: 'DeFi en Solana',
    },
    description: {
      'pt-BR':
        'Entenda os protocolos DeFi na Solana: AMMs, lending, yield farming e como construir seu próprio protocolo.',
      en: 'Understand DeFi protocols on Solana: AMMs, lending, yield farming and how to build your own protocol.',
      es: 'Comprende los protocolos DeFi en Solana: AMMs, lending, yield farming y cómo construir tu propio protocolo.',
    },
    level: 'advanced',
    track: 'defi',
    xp_reward: 2000,
    lesson_count: 28,
    duration: '20h',
    thumbnail_color: 'from-green-500 to-emerald-700',
    thumbnail_icon: '💰',
    enrollments: 543,
    tags: ['defi', 'amm', 'lending', 'solana'],
  },
  {
    id: 'nft-solana',
    slug: 'nft-solana',
    title: {
      'pt-BR': 'Criando NFTs na Solana',
      en: 'Creating NFTs on Solana',
      es: 'Creando NFTs en Solana',
    },
    description: {
      'pt-BR':
        'Aprenda a criar, mintar e vender NFTs na Solana usando Metaplex e os padrões mais recentes.',
      en: 'Learn to create, mint and sell NFTs on Solana using Metaplex and the latest standards.',
      es: 'Aprende a crear, mintear y vender NFTs en Solana usando Metaplex y los estándares más recientes.',
    },
    level: 'intermediate',
    track: 'nft',
    xp_reward: 1000,
    lesson_count: 16,
    duration: '10h',
    thumbnail_color: 'from-pink-500 to-purple-700',
    thumbnail_icon: '🎨',
    enrollments: 982,
    tags: ['nft', 'metaplex', 'solana', 'arte-digital'],
  },
  {
    id: 'web3-wallet',
    slug: 'web3-wallet',
    title: {
      'pt-BR': 'Integrando Wallets Web3',
      en: 'Integrating Web3 Wallets',
      es: 'Integrando Wallets Web3',
    },
    description: {
      'pt-BR':
        'Integre wallets Solana em aplicações React/Next.js com Wallet Adapter e autenticação descentralizada.',
      en: 'Integrate Solana wallets in React/Next.js applications with Wallet Adapter and decentralized authentication.',
      es: 'Integra wallets de Solana en aplicaciones React/Next.js con Wallet Adapter y autenticación descentralizada.',
    },
    level: 'beginner',
    track: 'web3',
    xp_reward: 600,
    lesson_count: 10,
    duration: '5h',
    thumbnail_color: 'from-cyan-500 to-blue-700',
    thumbnail_icon: '👛',
    enrollments: 1534,
    tags: ['wallet', 'react', 'nextjs', 'web3'],
  },
  {
    id: 'token-program',
    slug: 'token-program',
    title: {
      'pt-BR': 'Token Program da Solana',
      en: "Solana's Token Program",
      es: 'Token Program de Solana',
    },
    description: {
      'pt-BR':
        'Crie e gerencie tokens fungíveis na Solana usando o SPL Token Program e Token-2022.',
      en: 'Create and manage fungible tokens on Solana using the SPL Token Program and Token-2022.',
      es: 'Crea y gestiona tokens fungibles en Solana usando el SPL Token Program y Token-2022.',
    },
    level: 'intermediate',
    track: 'solana',
    xp_reward: 900,
    lesson_count: 14,
    duration: '8h',
    thumbnail_color: 'from-yellow-500 to-orange-600',
    thumbnail_icon: '🪙',
    enrollments: 721,
    tags: ['spl-token', 'token-2022', 'solana', 'fungible'],
  },
  {
    id: 'solana-security',
    slug: 'solana-security',
    title: {
      'pt-BR': 'Segurança em Contratos Solana',
      en: 'Solana Contract Security',
      es: 'Seguridad en Contratos Solana',
    },
    description: {
      'pt-BR':
        'Aprenda as vulnerabilidades mais comuns em programas Solana e como auditá-los e corrigi-los.',
      en: 'Learn the most common vulnerabilities in Solana programs and how to audit and fix them.',
      es: 'Aprende las vulnerabilidades más comunes en programas Solana y cómo auditarlos y corregirlos.',
    },
    level: 'advanced',
    track: 'anchor',
    xp_reward: 1800,
    lesson_count: 22,
    duration: '16h',
    thumbnail_color: 'from-red-600 to-rose-800',
    thumbnail_icon: '🔒',
    enrollments: 389,
    tags: ['segurança', 'auditoria', 'solana', 'vulnerabilidades'],
  },
  {
    id: 'solana-mobile',
    slug: 'solana-mobile',
    title: {
      'pt-BR': 'Mobile dApps com Solana',
      en: 'Mobile dApps with Solana',
      es: 'Mobile dApps con Solana',
    },
    description: {
      'pt-BR':
        'Construa aplicativos móveis Web3 com React Native e o Solana Mobile Stack (SMS).',
      en: 'Build Web3 mobile applications with React Native and the Solana Mobile Stack (SMS).',
      es: 'Construye aplicaciones móviles Web3 con React Native y el Solana Mobile Stack (SMS).',
    },
    level: 'advanced',
    track: 'web3',
    xp_reward: 1600,
    lesson_count: 18,
    duration: '14h',
    thumbnail_color: 'from-indigo-500 to-violet-700',
    thumbnail_icon: '📱',
    enrollments: 298,
    tags: ['mobile', 'react-native', 'sms', 'solana'],
  },
];

export interface MockLearner {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  walletAddress: string;
  totalXP: number;
  level: number;
  streakDays: number;
  weeklyXP: number;
  completedCourses: number;
  country: string;
}

export const MOCK_LEADERBOARD: MockLearner[] = [
  {
    id: '1',
    username: 'solana_dev_br',
    displayName: 'Carlos Silva',
    avatar: '🧑‍💻',
    walletAddress: 'A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q7r8S9t0',
    totalXP: 18500,
    level: 13,
    streakDays: 45,
    weeklyXP: 1250,
    completedCourses: 6,
    country: 'BR',
  },
  {
    id: '2',
    username: 'web3_ana',
    displayName: 'Ana Beatriz',
    avatar: '👩‍🔬',
    walletAddress: 'B2c3D4e5F6g7H8i9J0k1L2m3N4o5P6q7R8s9T0a1',
    totalXP: 15200,
    level: 12,
    streakDays: 30,
    weeklyXP: 980,
    completedCourses: 5,
    country: 'BR',
  },
  {
    id: '3',
    username: 'rust_hacker',
    displayName: 'Pedro Oliveira',
    avatar: '🦀',
    walletAddress: 'C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q7r8S9t0A1b2',
    totalXP: 12750,
    level: 11,
    streakDays: 22,
    weeklyXP: 875,
    completedCourses: 4,
    country: 'BR',
  },
  {
    id: '4',
    username: 'defi_queen',
    displayName: 'Maria Fernanda',
    avatar: '👸',
    walletAddress: 'D4e5F6g7H8i9J0k1L2m3N4o5P6q7R8s9T0a1B2c3',
    totalXP: 9800,
    level: 9,
    streakDays: 15,
    weeklyXP: 720,
    completedCourses: 3,
    country: 'MX',
  },
  {
    id: '5',
    username: 'nft_artist_sp',
    displayName: 'Lucas Mendes',
    avatar: '🎨',
    walletAddress: 'E5f6G7h8I9j0K1l2M3n4O5p6Q7r8S9t0A1b2C3d4',
    totalXP: 7300,
    level: 8,
    streakDays: 8,
    weeklyXP: 560,
    completedCourses: 3,
    country: 'BR',
  },
];

export interface MockCertificate {
  id: string;
  courseId: string;
  courseName: CourseTitle;
  issuedDate: string;
  credentialId: string;
  txSignature: string;
  skills: string[];
}

export const MOCK_CERTIFICATES: MockCertificate[] = [
  {
    id: 'cert-001',
    courseId: 'solana-101',
    courseName: {
      'pt-BR': 'Solana 101: Fundamentos',
      en: 'Solana 101: Fundamentals',
      es: 'Solana 101: Fundamentos',
    },
    issuedDate: '2024-01-15',
    credentialId: 'SAC-2024-001-SOL101',
    txSignature:
      '5J7mWxKp3nRqT8vY2bLdX9fQzNcAeGhIoJuPlSrVtBw4CmDEkFgHi6',
    skills: ['Solana', 'Blockchain', 'Web3', 'Wallets'],
  },
  {
    id: 'cert-002',
    courseId: 'web3-wallet',
    courseName: {
      'pt-BR': 'Integrando Wallets Web3',
      en: 'Integrating Web3 Wallets',
      es: 'Integrando Wallets Web3',
    },
    issuedDate: '2024-02-20',
    credentialId: 'SAC-2024-002-W3W',
    txSignature:
      '3K8pRtYu1vZcXwBnMqLsA7gEhFiOjNdPeTbCmVxIy5JkU2lGHoDQ4r',
    skills: ['React', 'Next.js', 'Wallet Adapter', 'dApps'],
  },
  {
    id: 'cert-003',
    courseId: 'nft-solana',
    courseName: {
      'pt-BR': 'Criando NFTs na Solana',
      en: 'Creating NFTs on Solana',
      es: 'Creando NFTs en Solana',
    },
    issuedDate: '2024-03-10',
    credentialId: 'SAC-2024-003-NFT',
    txSignature:
      '9T4fHgKl2vNpQsYw6aRcZxBmUeJoDi8nPbLtVyXCqA3kF7Ej1GhMIS5',
    skills: ['NFT', 'Metaplex', 'Token Metadata', 'Minting'],
  },
];
