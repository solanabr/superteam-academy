export interface NavItem {
  title: string;
  href: string;
  icon?: string;
  items?: NavItem[];
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const userDocsNav: NavSection[] = [
  {
    title: "Getting Started",
    items: [
      { title: "Introduction", href: "/docs" },
      { title: "Getting Started", href: "/docs/getting-started" },
      { title: "Creating an Account", href: "/docs/account" },
      { title: "Create a Solana Wallet", href: "/docs/create-wallet" },
    ],
  },
  {
    title: "Your Profile",
    items: [
      { title: "Profile Setup", href: "/docs/profile" },
      { title: "Connecting a Wallet", href: "/docs/wallet" },
      { title: "Settings & Preferences", href: "/docs/preferences" },
    ],
  },
  {
    title: "Learning",
    items: [
      { title: "Browsing Courses", href: "/docs/courses" },
      { title: "Enrolling in Courses", href: "/docs/enrollment" },
      { title: "Completing Lessons", href: "/docs/lessons" },
      { title: "Course Reviews", href: "/docs/course-reviews" },
    ],
  },
  {
    title: "Rewards & Progress",
    items: [
      { title: "XP & Leveling", href: "/docs/xp-and-levels" },
      { title: "Credentials & Achievements", href: "/docs/credentials" },
      { title: "Dashboard", href: "/docs/dashboard-guide" },
    ],
  },
  {
    title: "Community",
    items: [
      { title: "Community & Forum", href: "/docs/community-forum" },
      { title: "FAQ", href: "/docs/faq" },
    ],
  },
];

export const adminDocsNav: NavSection[] = [
  {
    title: "Overview",
    items: [
      { title: "Admin Manual", href: "/docs/admin" },
      { title: "Architecture", href: "/docs/admin/architecture" },
    ],
  },
  {
    title: "Setup & Deploy",
    items: [
      { title: "Project Setup", href: "/docs/admin/setup" },
      { title: "Environment Variables", href: "/docs/admin/env-variables" },
      { title: "Deployment", href: "/docs/admin/deployment" },
    ],
  },
  {
    title: "Services & Integrations",
    items: [
      { title: "Supabase", href: "/docs/admin/supabase" },
      { title: "Sanity CMS", href: "/docs/admin/sanity" },
      { title: "Sentry Monitoring", href: "/docs/admin/sentry" },
      { title: "Analytics", href: "/docs/admin/analytics" },
    ],
  },
  {
    title: "Solana & Web3",
    items: [
      { title: "Solana Program", href: "/docs/admin/solana" },
      { title: "Authentication", href: "/docs/admin/auth" },
    ],
  },
  {
    title: "Content & Management",
    items: [
      { title: "Course Management", href: "/docs/admin/courses" },
      { title: "Internationalization", href: "/docs/admin/i18n" },
    ],
  },
  {
    title: "Reference",
    items: [
      { title: "API Reference", href: "/docs/admin/api" },
      { title: "Troubleshooting", href: "/docs/admin/troubleshooting" },
    ],
  },
];

export function getAllDocsPages(): { title: string; href: string }[] {
  const pages: { title: string; href: string }[] = [];
  for (const section of [...userDocsNav, ...adminDocsNav]) {
    for (const item of section.items) {
      pages.push({ title: item.title, href: item.href });
    }
  }
  return pages;
}

export function getPrevNext(currentPath: string) {
  const pages = getAllDocsPages();
  const index = pages.findIndex((p) => p.href === currentPath);
  return {
    prev: index > 0 ? pages[index - 1] : null,
    next: index < pages.length - 1 ? pages[index + 1] : null,
  };
}
