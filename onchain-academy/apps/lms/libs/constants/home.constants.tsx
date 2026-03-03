import {
  Award,
  BarChart2,
  Code,
  Code2,
  LineChart,
  ListOrdered,
  Presentation,
  Users,
  Wallet,
} from 'lucide-react'
import type { ReactNode } from 'react'
import type {
  FeatureItem,
  LanguageOption,
  PartnerItem,
  PathItem,
  StatItem,
  TestimonialItem,
} from '../../app/components/home/home.types'

const ACCENT = '#ffd23f'
const PRIMARY = '#008c4c'
const MINT = '#52dda0'

export const LANGUAGES: LanguageOption[] = [
  {
    code: 'en',
    label: 'English',
    short: 'EN',
    flag: (
      <svg
        width='16'
        height='12'
        viewBox='0 0 16 12'
        fill='none'
        className='shrink-0 rounded-sm overflow-hidden'
      >
        <rect width='16' height='12' rx='2' fill='#012169' />
        <path d='M0 0l16 12M16 0L0 12' stroke='white' strokeWidth='2.4' />
        <path d='M0 0l16 12M16 0L0 12' stroke='#C8102E' strokeWidth='1.2' />
        <path d='M8 0v12M0 6h16' stroke='white' strokeWidth='3' />
        <path d='M8 0v12M0 6h16' stroke='#C8102E' strokeWidth='1.8' />
      </svg>
    ),
  },
  {
    code: 'es',
    label: 'Español',
    short: 'ES',
    flag: (
      <svg
        width='16'
        height='12'
        viewBox='0 0 16 12'
        fill='none'
        className='shrink-0 rounded-sm overflow-hidden'
      >
        <rect width='16' height='12' rx='2' fill='#AA151B' />
        <rect y='2.5' width='16' height='7' fill='#F1BF00' />
      </svg>
    ),
  },
  {
    code: 'pt',
    label: 'Português',
    short: 'PT',
    flag: (
      <svg
        width='16'
        height='12'
        viewBox='0 0 16 12'
        fill='none'
        className='shrink-0 rounded-sm overflow-hidden'
      >
        <rect width='16' height='12' rx='2' fill='#006600' />
        <rect x='5' width='11' height='12' fill='#FF0000' />
        <circle
          cx='5'
          cy='6'
          r='2.8'
          fill='#FFD700'
          stroke='#003380'
          strokeWidth='0.8'
        />
      </svg>
    ),
  },
]

export const STATS: StatItem[] = [
  { value: '34,891', label: 'Builders Enrolled' },
  { value: '120+', label: 'Courses & Modules' },
  { value: '92%', label: 'Completion Rate' },
  { value: '35+', label: 'Countries Represented' },
]

const pathIconClass = 'shrink-0'
const pathIconStyle = { color: MINT }
export const PathSVGs: Record<string, ReactNode> = {
  foundations: (
    <BarChart2 size={28} className={pathIconClass} style={pathIconStyle} />
  ),
  programs: <Code2 size={28} className={pathIconClass} style={pathIconStyle} />,
  defi: <Wallet size={28} className={pathIconClass} style={pathIconStyle} />,
}

export const PATHS: PathItem[] = [
  {
    svgKey: 'foundations',
    slug: 'solana-foundations',
    tag: 'Beginner',
    tagColor: 'rgba(82,221,160,0.15)',
    tagText: '#52dda0',
    level: 1,
    title: 'Solana Foundations',
    desc: 'Master the core architecture — accounts, programs, PDAs, and the Sealevel runtime. The base everything else is built on.',
    modules: [
      { label: 'Blockchain Basics', done: true },
      { label: 'Solana Architecture', done: true },
      { label: 'Wallets & Keypairs', done: true },
      { label: 'Accounts Model', active: true },
      { label: 'Your First Transaction', done: false },
    ],
    progress: 68,
    xp: '450 XP',
    duration: '6 hrs',
    lessons: 14,
    featured: false,
  },
  {
    svgKey: 'programs',
    slug: 'on-chain-programs',
    tag: 'Intermediate',
    tagColor: 'rgba(255,210,63,0.15)',
    tagText: ACCENT,
    level: 2,
    title: 'Build On-chain Programs',
    desc: 'Write, deploy, and test Rust-based Solana programs using the Anchor framework. Go from local validator to mainnet.',
    modules: [
      { label: 'Rust for Solana', done: true },
      { label: 'Anchor Framework', done: true },
      { label: 'State Management', active: true },
      { label: 'CPIs & Composability', done: false },
      { label: 'Testing & Deployment', done: false },
    ],
    progress: 42,
    xp: '900 XP',
    duration: '12 hrs',
    lessons: 22,
    featured: true,
  },
  {
    svgKey: 'defi',
    slug: 'defi-token-programs',
    tag: 'Advanced',
    tagColor: 'rgba(163,217,184,0.12)',
    tagText: '#a3d9b8',
    level: 3,
    title: 'DeFi & Token Programs',
    desc: 'Create SPL tokens, liquidity pools, and integrate with major Solana DeFi protocols. Build the infrastructure others build on.',
    modules: [
      { label: 'SPL Token Standard', done: false },
      { label: 'Token Metadata', done: false },
      { label: 'AMM Mechanics', done: false },
      { label: 'Protocol Integration', done: false },
      { label: 'Security Auditing', done: false },
    ],
    progress: 0,
    xp: '1,400 XP',
    duration: '18 hrs',
    lessons: 31,
    featured: false,
  },
]

const featureIconStyle = { color: MINT }
export const FeatureSVGs: Record<string, ReactNode> = {
  paths: (
    <ListOrdered
      size={26}
      strokeWidth={2}
      className='shrink-0'
      style={featureIconStyle}
    />
  ),
  credential: (
    <Award
      size={26}
      strokeWidth={2}
      className='shrink-0'
      style={featureIconStyle}
    />
  ),
  code: (
    <Code
      size={26}
      strokeWidth={2}
      className='shrink-0'
      style={featureIconStyle}
    />
  ),
  community: (
    <Users
      size={26}
      strokeWidth={2}
      className='shrink-0'
      style={featureIconStyle}
    />
  ),
  workshops: (
    <Presentation
      size={26}
      strokeWidth={2}
      className='shrink-0'
      style={featureIconStyle}
    />
  ),
  analytics: (
    <LineChart
      size={26}
      strokeWidth={2}
      className='shrink-0'
      style={featureIconStyle}
    />
  ),
}

export const FEATURES: FeatureItem[] = [
  {
    key: 'paths',
    num: '01',
    title: 'Structured Learning Paths',
    desc: 'Curated sequences that take you from zero to deploying on mainnet. No guesswork, no rabbit holes — a clear road from concept to shipped code.',
    meta: '120+ modules',
  },
  {
    key: 'credential',
    num: '02',
    title: 'On-chain Credentials',
    desc: 'Earn verifiable certificates minted as Solana NFTs. Your achievements live permanently on-chain — not in a PDF someone can fake.',
    meta: 'Verified on Solana',
    accent: true,
  },
  {
    key: 'code',
    num: '03',
    title: 'Live Coding Challenges',
    desc: 'Weekly challenges tied to real ecosystem problems. Ship working code, get reviewed by top contributors, and build a public track record.',
    meta: 'New challenge weekly',
  },
  {
    key: 'community',
    num: '04',
    title: 'Superteam Community',
    desc: 'Direct access to 8,000+ Solana builders, founders, and contributors across 35+ countries. Find collaborators, get feedback, get hired.',
    meta: '35+ countries',
  },
  {
    key: 'workshops',
    num: '05',
    title: 'Expert-Led Workshops',
    desc: "Live sessions with core Solana contributors, protocol engineers, and founders who've shipped. Real war stories, not polished slide decks.",
    meta: 'Live every week',
  },
  {
    key: 'analytics',
    num: '06',
    title: 'Progress Analytics',
    desc: 'A personal dashboard tracks your XP, streak, skill graph, and course velocity — so you always know where you stand and what to tackle next.',
    meta: 'Full skill graph',
  },
]

export const TESTIMONIALS: TestimonialItem[] = [
  {
    name: 'Maria S.',
    role: 'Smart Contract Dev · São Paulo',
    initials: 'MS',
    avatarBg: PRIMARY,
    stars: 5,
    quote:
      'Six months ago I had zero blockchain experience. After completing the Foundations path I landed a full-time role at a Solana-native startup. The quality here is unmatched.',
    highlight: false,
  },
  {
    name: 'Diego Martínez',
    role: 'Protocol Engineer · Barcelona',
    initials: 'DM',
    avatarBg: '#1d5c35',
    stars: 5,
    quote:
      "The Anchor course is the most thorough resource I've found anywhere — better than the official docs. The live challenges pushed me to actually ship, not just watch.",
    highlight: true,
  },
  {
    name: 'João F.',
    role: 'Founder, NFT Studio · Lisbon',
    initials: 'JF',
    avatarBg: '#3a7a50',
    stars: 5,
    quote:
      'Superteam Academy connected me to the exact people who became my co-founders. The community alone is worth 10x the course cost.',
    highlight: false,
  },
]

export const PARTNERS: PartnerItem[] = [
  { name: 'Solana Foundation', abbr: 'SF' },
  { name: 'Helius', abbr: 'He' },
  { name: 'Metaplex', abbr: 'Mx' },
  { name: 'Jupiter', abbr: 'Jup' },
  { name: 'Drift Protocol', abbr: 'Dr' },
  { name: 'Tensor', abbr: 'Tn' },
  { name: 'Squads', abbr: 'Sq' },
  { name: 'Magic Eden', abbr: 'ME' },
]

export const FOOTER_LINKS: Record<string, string[]> = {
  Learn: [
    'All Courses',
    'Learning Paths',
    'Challenges',
    'Workshops',
    'Certifications',
  ],
  Community: ['Discord', 'Forum', 'Leaderboard', 'Superteam DAO', 'Events'],
  Company: ['About', 'Blog', 'Careers', 'Press Kit', 'Brand Assets'],
  Support: ['Help Center', 'FAQs', 'Contact', 'Privacy Policy', 'Terms'],
}
