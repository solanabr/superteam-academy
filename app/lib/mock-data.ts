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
  {
    id: 'token-extensions',
    slug: 'token-extensions',
    title: {
      'pt-BR': 'Token Extensions (Token-2022)',
      en: 'Token Extensions (Token-2022)',
      es: 'Token Extensions (Token-2022)',
    },
    description: {
      'pt-BR': 'Domine as extensões do Token-2022: transfer hooks, transfer fees, confidential transfers e mais.',
      en: 'Master Token-2022 extensions: transfer hooks, transfer fees, confidential transfers and more.',
      es: 'Domina las extensiones de Token-2022: transfer hooks, transfer fees, confidential transfers y más.',
    },
    level: 'intermediate' as const,
    track: 'solana' as const,
    xp_reward: 1100,
    lesson_count: 16,
    duration: '10h',
    thumbnail_color: 'from-teal-500 to-emerald-600',
    thumbnail_icon: '🔧',
    enrollments: 412,
    tags: ['token-2022', 'extensions', 'transfer-hooks', 'solana'],
  },
  {
    id: 'dao-governance',
    slug: 'dao-governance',
    title: {
      'pt-BR': 'Governança DAO na Solana',
      en: 'DAO Governance on Solana',
      es: 'Gobernanza DAO en Solana',
    },
    description: {
      'pt-BR': 'Construa DAOs com SPL Governance e Realms, incluindo votação, propostas e tesouraria.',
      en: 'Build DAOs with SPL Governance and Realms, including voting, proposals and treasury management.',
      es: 'Construye DAOs con SPL Governance y Realms, incluyendo votación, propuestas y tesorería.',
    },
    level: 'advanced' as const,
    track: 'web3' as const,
    xp_reward: 1500,
    lesson_count: 14,
    duration: '11h',
    thumbnail_color: 'from-violet-600 to-purple-800',
    thumbnail_icon: '🏛️',
    enrollments: 267,
    tags: ['dao', 'governance', 'realms', 'spl-governance'],
  },
  {
    id: 'solana-pay',
    slug: 'solana-pay',
    title: {
      'pt-BR': 'Integração com Solana Pay',
      en: 'Solana Pay Integration',
      es: 'Integración con Solana Pay',
    },
    description: {
      'pt-BR': 'Implemente pagamentos instantâneos com Solana Pay: QR codes, transaction requests e integração POS.',
      en: 'Implement instant payments with Solana Pay: QR codes, transaction requests and POS integration.',
      es: 'Implementa pagos instantáneos con Solana Pay: códigos QR, transaction requests e integración POS.',
    },
    level: 'beginner' as const,
    track: 'web3' as const,
    xp_reward: 700,
    lesson_count: 12,
    duration: '7h',
    thumbnail_color: 'from-green-400 to-teal-600',
    thumbnail_icon: '💳',
    enrollments: 589,
    tags: ['solana-pay', 'payments', 'qr-code', 'pos'],
  },
  {
    id: 'compressed-nfts',
    slug: 'compressed-nfts',
    title: {
      'pt-BR': 'NFTs Comprimidos (cNFTs)',
      en: 'Compressed NFTs (cNFTs)',
      es: 'NFTs Comprimidos (cNFTs)',
    },
    description: {
      'pt-BR': 'Crie milhões de NFTs por uma fração do custo usando Bubblegum e Merkle trees comprimidas.',
      en: 'Create millions of NFTs at a fraction of the cost using Bubblegum and compressed Merkle trees.',
      es: 'Crea millones de NFTs a una fracción del costo usando Bubblegum y Merkle trees comprimidos.',
    },
    level: 'intermediate' as const,
    track: 'nft' as const,
    xp_reward: 1000,
    lesson_count: 14,
    duration: '9h',
    thumbnail_color: 'from-fuchsia-500 to-pink-700',
    thumbnail_icon: '🗜️',
    enrollments: 334,
    tags: ['cnft', 'bubblegum', 'merkle-tree', 'compression'],
  },
  {
    id: 'cross-program-invocations',
    slug: 'cross-program-invocations',
    title: {
      'pt-BR': 'Cross-Program Invocations (CPI)',
      en: 'Cross-Program Invocations (CPI)',
      es: 'Cross-Program Invocations (CPI)',
    },
    description: {
      'pt-BR': 'Aprenda a compor programas Solana usando CPIs, PDAs com signers e invocações seguras.',
      en: 'Learn to compose Solana programs using CPIs, PDA signers and secure invocations.',
      es: 'Aprende a componer programas Solana usando CPIs, PDA signers e invocaciones seguras.',
    },
    level: 'advanced' as const,
    track: 'anchor' as const,
    xp_reward: 1400,
    lesson_count: 16,
    duration: '12h',
    thumbnail_color: 'from-amber-500 to-orange-700',
    thumbnail_icon: '🔗',
    enrollments: 198,
    tags: ['cpi', 'composability', 'pda-signer', 'anchor'],
  },
  {
    id: 'blinks-actions',
    slug: 'blinks-actions',
    title: {
      'pt-BR': 'Blinks & Actions na Solana',
      en: 'Blinks & Actions on Solana',
      es: 'Blinks & Actions en Solana',
    },
    description: {
      'pt-BR': 'Crie Blockchain Links (Blinks) e Solana Actions para transações diretamente de URLs e redes sociais.',
      en: 'Create Blockchain Links (Blinks) and Solana Actions for transactions directly from URLs and social media.',
      es: 'Crea Blockchain Links (Blinks) y Solana Actions para transacciones directamente desde URLs y redes sociales.',
    },
    level: 'beginner' as const,
    track: 'web3' as const,
    xp_reward: 600,
    lesson_count: 10,
    duration: '5h',
    thumbnail_color: 'from-sky-500 to-blue-700',
    thumbnail_icon: '⚡',
    enrollments: 743,
    tags: ['blinks', 'actions', 'url-transactions', 'social'],
  },
  {
    id: 'zk-compression',
    slug: 'zk-compression',
    title: {
      'pt-BR': 'ZK Compression na Solana',
      en: 'ZK Compression on Solana',
      es: 'ZK Compression en Solana',
    },
    description: {
      'pt-BR': 'Reduza custos de armazenamento on-chain com ZK Compression usando Light Protocol e provas zero-knowledge.',
      en: 'Reduce on-chain storage costs with ZK Compression using Light Protocol and zero-knowledge proofs.',
      es: 'Reduce costos de almacenamiento on-chain con ZK Compression usando Light Protocol y pruebas zero-knowledge.',
    },
    level: 'advanced' as const,
    track: 'solana' as const,
    xp_reward: 1800,
    lesson_count: 18,
    duration: '14h',
    thumbnail_color: 'from-slate-600 to-zinc-800',
    thumbnail_icon: '🔐',
    enrollments: 156,
    tags: ['zk-compression', 'light-protocol', 'zero-knowledge', 'storage'],
  },
  {
    id: 'metaplex-core',
    slug: 'metaplex-core',
    title: {
      'pt-BR': 'Metaplex Core: Nova Geração de NFTs',
      en: 'Metaplex Core: Next-Gen NFTs',
      es: 'Metaplex Core: NFTs de Nueva Generación',
    },
    description: {
      'pt-BR': 'Explore o Metaplex Core para criar NFTs eficientes com plugins, royalties enforced e collections.',
      en: 'Explore Metaplex Core to create efficient NFTs with plugins, enforced royalties and collections.',
      es: 'Explora Metaplex Core para crear NFTs eficientes con plugins, royalties enforced y collections.',
    },
    level: 'intermediate' as const,
    track: 'nft' as const,
    xp_reward: 1100,
    lesson_count: 16,
    duration: '10h',
    thumbnail_color: 'from-rose-500 to-red-700',
    thumbnail_icon: '💎',
    enrollments: 421,
    tags: ['metaplex-core', 'nft', 'plugins', 'royalties'],
  },
  {
    id: 'solana-gaming',
    slug: 'solana-gaming',
    title: {
      'pt-BR': 'Jogos na Solana com Unity SDK',
      en: 'Solana Gaming with Unity SDK',
      es: 'Juegos en Solana con Unity SDK',
    },
    description: {
      'pt-BR': 'Integre a blockchain Solana em jogos Unity: wallets in-game, NFT items e economia de tokens.',
      en: 'Integrate Solana blockchain into Unity games: in-game wallets, NFT items and token economies.',
      es: 'Integra la blockchain Solana en juegos Unity: wallets in-game, NFT items y economía de tokens.',
    },
    level: 'intermediate' as const,
    track: 'web3' as const,
    xp_reward: 1200,
    lesson_count: 14,
    duration: '11h',
    thumbnail_color: 'from-lime-500 to-green-700',
    thumbnail_icon: '🎮',
    enrollments: 312,
    tags: ['gaming', 'unity', 'nft-items', 'token-economy'],
  },
  {
    id: 'account-abstraction',
    slug: 'account-abstraction',
    title: {
      'pt-BR': 'Account Abstraction na Solana',
      en: 'Account Abstraction on Solana',
      es: 'Account Abstraction en Solana',
    },
    description: {
      'pt-BR': 'Implemente account abstraction para melhorar UX: gasless transactions, session keys e social login.',
      en: 'Implement account abstraction for better UX: gasless transactions, session keys and social login.',
      es: 'Implementa account abstraction para mejor UX: gasless transactions, session keys y social login.',
    },
    level: 'advanced' as const,
    track: 'solana' as const,
    xp_reward: 1600,
    lesson_count: 16,
    duration: '13h',
    thumbnail_color: 'from-blue-600 to-indigo-800',
    thumbnail_icon: '🔑',
    enrollments: 187,
    tags: ['account-abstraction', 'gasless', 'session-keys', 'social-login'],
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
