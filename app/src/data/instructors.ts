export interface Instructor {
  slug: string;
  name: string;
  role: string;
  /** Especialidades (ex.: Rust, DeFi) - exibidas como badges, sem "Instrutor/Instrutora" */
  specialties?: string[];
  avatar: string;
  bio: string;
  /** Link para perfil principal (X, site, etc.) */
  profileUrl: string;
  /** Links adicionais por plataforma */
  links?: { label: string; url: string }[];
}

export const instructors: Instructor[] = [
  {
    slug: "superteam-br",
    name: "Kuka",
    role: "Instrutor",
    specialties: ["Fundamentos", "DeFi", "Full Stack"],
    avatar: "/instructors/kuka.png",
    bio: "Instrutor no ecossistema Solana. Cursos de fundamentos, DeFi e full stack.",
    profileUrl: "https://x.com/superteambr",
    links: [
      { label: "X (Twitter)", url: "https://x.com/superteambr" },
      { label: "LinkedIn", url: "https://linkedin.com/company/superteambr" },
      { label: "Telegram", url: "https://t.me/superteambr" },
      { label: "Discord", url: "https://discord.gg/superteam" },
      { label: "GitHub", url: "https://github.com/superteambr" },
    ],
  },
  {
    slug: "ana-silva",
    name: "Ana Silva",
    role: "Instrutora · Rust & Solana",
    specialties: ["Rust", "Solana"],
    avatar: "https://i.pravatar.cc/400?img=22",
    bio: "Engenheira de software. Focada em programas Solana em Rust e educação para devs.",
    profileUrl: "https://x.com",
    links: [
      { label: "X (Twitter)", url: "https://x.com" },
      { label: "LinkedIn", url: "https://linkedin.com" },
      { label: "Telegram", url: "https://t.me" },
      { label: "Discord", url: "https://discord.gg" },
      { label: "GitHub", url: "https://github.com" },
    ],
  },
  {
    slug: "kaue",
    name: "Kauê",
    role: "Instrutor",
    specialties: ["Rust", "Solana", "DeFi"],
    avatar: "/instructors/kaue.png",
    bio: "Builder no ecossistema Solana. Focado em educação e desenvolvimento de programas.",
    profileUrl: "https://x.com/superteambr",
    links: [
      { label: "X (Twitter)", url: "https://x.com/superteambr" },
      { label: "LinkedIn", url: "https://linkedin.com/company/superteambr" },
      { label: "Telegram", url: "https://t.me/superteambr" },
      { label: "Discord", url: "https://discord.gg/superteam" },
      { label: "GitHub", url: "https://github.com/superteambr" },
    ],
  },
];

export function getInstructorBySlug(slug: string): Instructor | undefined {
  return instructors.find((i) => i.slug === slug);
}

export function getAllInstructors(): Instructor[] {
  return instructors;
}
