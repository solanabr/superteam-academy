/**
 * Solarium Design System v5 — Centralized Style Classes
 *
 * All components MUST import styles from this file.
 * Never hardcode colors, typography, or shadows in components.
 *
 * Colors are driven by CSS custom properties defined in globals.css,
 * mapped through tailwind.config.ts. Toggle light/dark via `.dark` class.
 *
 * Source of truth: apps/web/src/styles/globals.css + tailwind.config.ts
 */

// ─── Utility ────────────────────────────────────────────────────────────────

/** Concatenate class names, filtering out falsy values. */
export function cx(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ─── TRANSITIONS ────────────────────────────────────────────────────────────

export const TRANSITIONS = {
  /** General interactive elements — 150ms */
  base: "transition-all duration-150",
  /** Color/opacity only — 100ms */
  fast: "transition-colors duration-100",
  /** Progress bar fills — 600ms cubic-bezier */
  progress: "transition-[width] duration-600 ease-smooth",
} as const;

// ─── BORDER RADIUS ──────────────────────────────────────────────────────────

export const BORDER_RADIUS = {
  sm: "rounded-sm", // 10px
  md: "rounded-md", // 14px
  lg: "rounded-lg", // 18px
  xl: "rounded-xl", // 24px
  full: "rounded-full",
} as const;

// ─── SPACING ────────────────────────────────────────────────────────────────

export const SPACING = {
  /** Page-level section gap */
  section: "mb-16",
  /** Between major content blocks */
  block: "mb-10",
  /** Standard component gap */
  component: "mb-6",
  /** Inner component padding */
  card: "p-6",
  /** Small inner padding */
  cardCompact: "p-4",
  /** Section title margin */
  sectionTitle: "mb-6",
  /** Inline gap between items */
  inlineGap: "gap-3",
  /** Grid gap */
  gridGap: "gap-4",
} as const;

// ─── ICON SIZES ─────────────────────────────────────────────────────────────

export const ICON_SIZES = {
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6",
  xl: "w-8 h-8",
} as const;

// ─── TYPOGRAPHY ─────────────────────────────────────────────────────────────
//
// Nunito (font-display) = all headings + display text
// Plus Jakarta Sans (font-body/font-sans) = body text + captions
//

export const TYPOGRAPHY = {
  /** Nunito 900 / 44px — hero headlines */
  displayXl: "font-display font-black text-[44px] leading-[1.1] text-text",
  /** Nunito 800 / 30px — page titles */
  displayLg: "font-display font-extrabold text-[30px] leading-[1.2] text-text",
  /** Nunito 800 / 22px — section titles */
  displayMd: "font-display font-extrabold text-[22px] text-text",
  /** Nunito 800 / 17px — card titles */
  displaySm: "font-display font-extrabold text-[17px] text-text",
  /** Jakarta 500 / 17px — lead body */
  bodyLg: "font-body font-medium text-[17px] text-text",
  /** Jakarta 400 / 15px — standard body */
  body: "font-body text-[15px] text-text-2",
  /** Jakarta 600 / 12px — captions, labels, metadata */
  caption:
    "font-body font-semibold text-xs uppercase tracking-wide text-text-3",
  /** JetBrains Mono 400 / 13px — code */
  mono: "font-mono text-[13px] text-primary",
  /** Nunito 700 / 14px — stat/progress labels */
  label: "font-display font-bold text-sm",
  /** Nunito 900 / varies — large stat numbers */
  stat: "font-display font-black text-4xl leading-none text-text",
  /** Nunito 900 / 14px — XP badge text */
  xpBadge: "font-display font-black text-sm",
} as const;

// ─── BUTTONS — 3D Push Style ────────────────────────────────────────────────
//
// All buttons have a visible bottom shadow that compresses on active.
// Push depth: 4px idle → 1px active + translateY(3px).
//

const BUTTON_BASE =
  "inline-flex items-center justify-center gap-2 font-display font-extrabold border-none cursor-pointer transition-all duration-100 active:translate-y-[3px] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

export const BUTTON_STYLES = {
  base: BUTTON_BASE,
  /** Teal CTA */
  primary: cx(
    BUTTON_BASE,
    "bg-primary text-white rounded-md shadow-push active:shadow-push-active hover:bg-primary-hover"
  ),
  /** Warm Amber for rewards/XP */
  accent: cx(
    BUTTON_BASE,
    "bg-accent text-white rounded-md shadow-push active:shadow-push-active hover:bg-accent-hover"
  ),
  /** Botanical green for success/complete */
  success: cx(
    BUTTON_BASE,
    "bg-success text-white rounded-md shadow-push active:shadow-push-active hover:bg-success-dark"
  ),
  /** Ink Teal for structural/secondary actions */
  secondary: cx(
    BUTTON_BASE,
    "bg-secondary text-white rounded-md shadow-push active:shadow-push-active hover:bg-secondary-light"
  ),
  /** Outlined — card bg with border */
  outline: cx(
    BUTTON_BASE,
    "bg-card text-text border-[2.5px] border-border rounded-md shadow-push active:shadow-push-active hover:bg-subtle"
  ),
  /** Ghost — no border, no shadow */
  ghost: cx(
    BUTTON_BASE,
    "bg-transparent text-text-2 shadow-none hover:bg-subtle hover:text-text"
  ),
  /** Danger — warm coral for destructive actions */
  danger: cx(
    BUTTON_BASE,
    "bg-danger text-white rounded-md shadow-push active:shadow-push-active"
  ),
  /** Link style */
  link: "inline-flex items-center gap-1 font-display font-bold text-primary underline-offset-4 hover:underline transition-colors duration-100",
} as const;

export const BUTTON_SIZES = {
  sm: "text-[13px] px-[18px] py-2 rounded-sm",
  md: "text-[15px] px-7 py-3 rounded-md",
  lg: "text-[17px] px-9 py-4 rounded-lg",
  icon: "w-10 h-10 p-0 rounded-md",
} as const;

// ─── CARDS — Chunky border, push shadow ─────────────────────────────────────

export const CARD_STYLES = {
  /** Full card container with chunky border + shadow */
  container:
    "bg-card border-[2.5px] border-border rounded-lg shadow-card transition-all duration-150",
  /** Hover state for interactive cards */
  containerHover:
    "hover:-translate-y-0.5 hover:shadow-card-hover hover:border-border-hover cursor-pointer",
  /** Card body padding */
  body: "p-5",
  /** Card header zone */
  header: "flex flex-col space-y-1.5 p-6",
  /** Card footer zone */
  footer: "flex items-center p-6 pt-0",
  /** Card title — Nunito */
  title: "font-display text-[17px] font-extrabold text-text",
  /** Card description — Jakarta */
  description: "text-sm text-text-2 leading-relaxed",
  /** Stat card variant — larger padding */
  stat: "bg-card border-[2.5px] border-border rounded-lg shadow-card transition-all duration-150 p-6 hover:-translate-y-0.5 hover:shadow-card-hover",
  /** Feature card variant — landing page */
  feature:
    "bg-card border-[2.5px] border-border rounded-lg shadow-card transition-all duration-150 p-7 hover:-translate-y-0.5 hover:shadow-card-hover",
} as const;

// ─── PROGRESS BARS — 16px, inner glow ───────────────────────────────────────

export const PROGRESS_STYLES = {
  /** Track container — fat 16px with chunky border */
  track:
    "w-full h-4 bg-subtle rounded-full border-[2.5px] border-border overflow-hidden",
  /** Fill base — gradient + inner highlight pseudo-element */
  fillBase: "h-full rounded-full relative progress-fat-fill",
  /** Teal fill — course progress */
  fillTeal: "h-full rounded-full relative progress-fat-fill progress-fill-teal",
  /** Amber fill — XP/level progress */
  fillAmber:
    "h-full rounded-full relative progress-fat-fill progress-fill-amber",
  /** Green fill — completed */
  fillGreen:
    "h-full rounded-full relative progress-fat-fill progress-fill-green",
  /** Label above progress bar */
  label: "font-display font-bold text-sm text-text",
  /** Value text beside label */
  value: "font-display font-extrabold text-sm",
  /** Progress wrapper with top label row */
  wrapper: "w-full",
  /** Top row with label + value */
  topRow: "flex justify-between mb-1.5",
} as const;

// ─── GAMIFICATION ───────────────────────────────────────────────────────────

export const GAMIFICATION_STYLES = {
  /** XP value — large teal number */
  xpValue: "font-display font-black text-[44px] leading-none text-primary",
  /** XP label above value */
  xpLabel: "font-display font-bold text-[13px] text-text-3",
  /** Level circle */
  levelCircle:
    "w-14 h-14 rounded-full border-[3px] border-primary flex items-center justify-center font-display font-black text-[22px] text-primary bg-primary-bg shrink-0",
  /** Streak container card */
  streakBox: "bg-card border-[2.5px] border-border rounded-lg p-6 shadow-card",
  /** Streak icon wrapper — breathing animation */
  streakIcon:
    "w-12 h-12 bg-streak-light rounded-md flex items-center justify-center text-2xl animate-breathe",
  /** Streak count text */
  streakCount: "font-display font-black text-[26px] text-text",
  /** Streak day circle — inactive */
  streakDayOff:
    "w-10 h-10 rounded-full border-[2.5px] border-border flex items-center justify-center font-display font-extrabold text-[13px] text-text-3 bg-subtle",
  /** Streak day circle — completed */
  streakDayOn:
    "w-10 h-10 rounded-full border-[2.5px] border-success flex items-center justify-center font-display font-extrabold text-[13px] text-success-dark bg-success-light shadow-push",
  /** Streak day circle — today (pulsing) */
  streakDayNow:
    "w-10 h-10 rounded-full border-[2.5px] border-primary-dark flex items-center justify-center font-display font-extrabold text-[13px] text-white bg-primary shadow-push animate-pulse-ring",
  /** Achievement badge — earned (amber glow) */
  achievementEarned:
    "w-[68px] h-[68px] rounded-full border-[3px] border-accent flex items-center justify-center font-display font-black text-sm uppercase text-accent-dark bg-gradient-to-br from-accent-light to-[#FDE68A] shadow-push transition-transform duration-200 hover:scale-[1.08]",
  /** Achievement badge — locked (muted) */
  achievementLocked:
    "w-[68px] h-[68px] rounded-full border-[3px] border-border flex items-center justify-center font-display font-black text-sm uppercase text-text-3 bg-subtle opacity-40",
  /** Achievement name label */
  achievementName: "font-display font-bold text-[11px] text-text-2",
  /** Leaderboard row — base */
  leaderboardRow:
    "flex items-center gap-3.5 px-[18px] py-3.5 bg-card border-[2.5px] border-border rounded-md shadow-card transition-all duration-150 hover:-translate-y-0.5 hover:shadow-card-hover",
  /** Leaderboard row — #1 (amber) */
  leaderboardFirst:
    "flex items-center gap-3.5 px-[18px] py-3.5 bg-accent-bg border-[2.5px] border-accent rounded-md shadow-card transition-all duration-150 hover:-translate-y-0.5 hover:shadow-card-hover",
  /** Leaderboard row — current user (teal) */
  leaderboardMe:
    "flex items-center gap-3.5 px-[18px] py-3.5 bg-primary-bg border-[2.5px] border-primary rounded-md shadow-card transition-all duration-150 hover:-translate-y-0.5 hover:shadow-card-hover",
  /** Rank number */
  leaderboardRank: "font-display font-black text-lg w-7 text-text-3",
  /** XP display in leaderboard */
  leaderboardXp:
    "font-display font-black text-base text-accent-dark dark:text-accent",
  /** Avatar circle */
  avatar:
    "w-10 h-10 rounded-full flex items-center justify-center font-display font-extrabold text-sm text-white",
} as const;

// ─── LEVEL BADGES ───────────────────────────────────────────────────────────

export const LEVEL_STYLES = {
  /** Seed (Level 1) */
  seed: "w-14 h-14 rounded-full border-[3px] border-primary bg-primary-light flex items-center justify-center font-display font-black text-[22px] text-primary",
  /** Sprout (Level 5) */
  sprout:
    "w-14 h-14 rounded-full border-[3px] border-secondary-light bg-secondary-bg flex items-center justify-center font-display font-black text-[22px] text-secondary",
  /** Sapling (Level 10) — subtle amber glow */
  sapling:
    "w-14 h-14 rounded-full border-[3px] border-accent bg-accent-light flex items-center justify-center font-display font-black text-[22px] text-accent-dark shadow-[0_0_14px_rgba(245,158,11,0.2)]",
  /** Canopy (Level 20) — gold gradient + glow */
  canopy:
    "w-14 h-14 rounded-full border-[3px] border-accent-dark bg-gradient-to-br from-[#FDE68A] to-accent flex items-center justify-center font-display font-black text-[22px] text-[#78350F] shadow-[0_0_20px_rgba(245,158,11,0.3)]",
  /** Level name label */
  name: "font-display font-bold text-xs text-text-3",
} as const;

// ─── DIFFICULTY PILLS ───────────────────────────────────────────────────────

const PILL_BASE =
  "px-[18px] py-[7px] rounded-full font-display font-bold text-[13px] border-[2.5px] cursor-pointer transition-all duration-150 active:translate-y-[1px]";

export const DIFFICULTY_STYLES = {
  base: PILL_BASE,
  beginner: cx(
    PILL_BASE,
    "bg-primary-bg border-primary text-primary-dark dark:text-primary"
  ),
  intermediate: cx(
    PILL_BASE,
    "bg-secondary-bg border-secondary-light text-secondary dark:text-secondary-light"
  ),
  advanced: cx(
    PILL_BASE,
    "bg-streak-light border-streak text-[#9A3412] dark:text-streak"
  ),
} as const;

// ─── CARD BANNERS — difficulty-based course card banners ────────────────────

export const BANNER_STYLES = {
  /** Beginner gradient */
  beginner: "banner-beginner",
  /** Intermediate gradient */
  intermediate: "banner-intermediate",
  /** Advanced gradient */
  advanced: "banner-advanced",
  /** Badge on banner — base */
  badgeBase:
    "absolute top-3 left-3 px-3.5 py-1 rounded-full font-display font-extrabold text-[11px] border-2",
  /** Badge — beginner */
  badgeBeginner:
    "absolute top-3 left-3 px-3.5 py-1 rounded-full font-display font-extrabold text-[11px] border-2 bg-card/90 text-primary border-primary/20",
  /** Badge — intermediate */
  badgeIntermediate:
    "absolute top-3 left-3 px-3.5 py-1 rounded-full font-display font-extrabold text-[11px] border-2 bg-card/90 text-secondary border-secondary/20",
  /** Badge — advanced */
  badgeAdvanced:
    "absolute top-3 left-3 px-3.5 py-1 rounded-full font-display font-extrabold text-[11px] border-2 bg-card/90 text-streak border-streak/20",
} as const;

// ─── FORM ELEMENTS ──────────────────────────────────────────────────────────

export const FORM_STYLES = {
  /** Form group wrapper */
  group: "mb-4",
  /** Label — Nunito bold */
  label: "font-display font-bold text-[13px] text-text-2 mb-1.5 block",
  /** Input field */
  input:
    "w-full px-4 py-3 bg-card border-[2.5px] border-border rounded-md font-body text-[15px] text-text transition-all duration-150 outline-none placeholder:text-text-3 focus:border-primary focus:shadow-[0_0_0_3px_var(--primary-bg)]",
  /** Select dropdown */
  select:
    "w-full px-4 py-3 bg-card border-[2.5px] border-border rounded-md font-body text-[15px] text-text transition-all duration-150 outline-none cursor-pointer appearance-none focus:border-primary focus:shadow-[0_0_0_3px_var(--primary-bg)]",
  /** Helper text below input */
  helper: "text-xs text-text-3 mt-1",
  /** Error text below input */
  error: "text-xs text-danger font-semibold mt-1",
  /** Textarea */
  textarea:
    "w-full px-4 py-3 bg-card border-[2.5px] border-border rounded-md font-body text-[15px] text-text transition-all duration-150 outline-none resize-y min-h-[100px] placeholder:text-text-3 focus:border-primary focus:shadow-[0_0_0_3px_var(--primary-bg)]",
} as const;

// ─── TOAST / NOTIFICATIONS ──────────────────────────────────────────────────

const TOAST_BASE =
  "flex items-center gap-2.5 px-5 py-3.5 rounded-md border-[2.5px] font-body text-sm font-semibold";

export const TOAST_STYLES = {
  base: TOAST_BASE,
  success: cx(
    TOAST_BASE,
    "bg-success-bg border-success text-success-dark dark:text-success"
  ),
  warning: cx(
    TOAST_BASE,
    "bg-accent-bg border-accent text-accent-dark dark:text-accent"
  ),
  error: cx(TOAST_BASE, "bg-danger-light border-danger text-danger"),
  info: cx(
    TOAST_BASE,
    "bg-primary-bg border-primary text-primary-dark dark:text-primary"
  ),
} as const;

// ─── MODAL ──────────────────────────────────────────────────────────────────

export const MODAL_STYLES = {
  /** Overlay backdrop */
  overlay: "fixed inset-0 bg-black/50 z-50",
  /** Modal container */
  container:
    "bg-card border-[2.5px] border-border rounded-xl shadow-[0_24px_48px_rgba(0,0,0,0.12)] overflow-hidden max-w-[500px] w-full",
  /** Modal header */
  header: "px-7 pt-6 pb-4 border-b border-border",
  /** Modal title */
  title: "font-display font-black text-[22px] text-text",
  /** Modal subtitle */
  subtitle: "text-sm text-text-2 mt-1",
  /** Modal body */
  body: "px-7 py-6",
  /** Modal footer */
  footer: "px-7 py-4 border-t border-border bg-subtle flex justify-end gap-2.5",
} as const;

// ─── CHIPS / BADGES ─────────────────────────────────────────────────────────

export const CHIP_STYLES = {
  /** Base chip */
  base: "inline-flex items-center gap-1 px-3 py-1 rounded-full font-display font-bold text-[11px] uppercase tracking-wide border-2",
  /** Primary teal chip */
  primary: "bg-primary-bg border-primary text-primary",
  /** Accent amber chip */
  accent: "bg-accent-bg border-accent text-accent-dark dark:text-accent",
  /** Success chip */
  success: "bg-success-bg border-success text-success-dark dark:text-success",
  /** Muted chip */
  muted: "bg-subtle border-border text-text-3",
  /** You tag in leaderboard */
  you: "text-[11px] text-primary font-extrabold",
} as const;

// ─── XP POPUP CELEBRATIONS ──────────────────────────────────────────────────

const POPUP_BASE =
  "inline-flex items-center gap-1.5 px-6 py-3 rounded-full font-display font-black text-[17px] shadow-push";

export const POPUP_STYLES = {
  base: POPUP_BASE,
  /** XP gained — amber */
  xp: cx(POPUP_BASE, "bg-accent text-white animate-pop"),
  /** Lesson complete — green */
  complete: cx(POPUP_BASE, "bg-success text-white animate-pop"),
  /** Badge/achievement unlocked — teal */
  badge: cx(POPUP_BASE, "bg-primary text-white animate-pop"),
} as const;

// ─── ANIMATION STYLES ───────────────────────────────────────────────────────

export const ANIMATION_STYLES = {
  /** Streak flame breathing */
  breathe: "animate-breathe",
  /** Today dot pulsing */
  pulseRing: "animate-pulse-ring",
  /** XP/celebration popup */
  pop: "animate-pop",
  /** Achievement unlock bounce */
  bounceIn: "animate-bounce-in",
  /** XP counter fly-up */
  xpPop: "animate-xp-pop",
  /** Shimmer skeleton loading */
  shimmer: "animate-shimmer",
} as const;

// ─── LAYOUT ─────────────────────────────────────────────────────────────────

export const LAYOUT_STYLES = {
  /** Main page container */
  page: "min-h-screen bg-bg",
  /** Content area with max width */
  content: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",
  /** Narrow content area */
  contentNarrow: "max-w-3xl mx-auto px-4 sm:px-6",
  /** Section wrapper */
  section: "py-12",
  /** Section title */
  sectionTitle: "font-display font-extrabold text-2xl text-text mb-6",
  /** Section description */
  sectionDesc: "text-[15px] text-text-2 max-w-[650px] leading-relaxed mb-6",
  /** 3-column card grid */
  grid3: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4",
  /** 4-column stat grid */
  grid4: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5",
  /** 2-column feature grid */
  grid2: "grid grid-cols-1 md:grid-cols-2 gap-3.5",
  /** Flex row with gap */
  row: "flex items-center gap-3",
  /** Sidebar layout */
  sidebar: "bg-card border-r-[2.5px] border-border min-h-screen",
  /** Header bar */
  header: "bg-card border-b-[2.5px] border-border",
  /** Footer */
  footer: "bg-card border-t-[2.5px] border-border",
  /** Divider line */
  divider: "border-t-[2.5px] border-border my-12",
} as const;

// ─── INTERACTIVE STATES ─────────────────────────────────────────────────────

export const INTERACTIVE_STATES = {
  /** Hover lift for cards */
  hoverLift:
    "hover:-translate-y-0.5 hover:shadow-card-hover hover:border-border-hover",
  /** Push down on click */
  pushDown: "active:translate-y-[3px] active:shadow-push-active",
  /** Focus ring for keyboard nav */
  focusRing:
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
  /** Disabled state */
  disabled: "disabled:pointer-events-none disabled:opacity-50",
} as const;

// ─── CERTIFICATE-SPECIFIC (Solana gradient) ─────────────────────────────────
//
// Certificates are the ONLY place in the design system where the Solana
// gradient border (purple #9945FF → teal #14F195) appears.
// Three variants: compact (profile), full (my certificates), verify (public).

export const CERTIFICATE_STYLES = {
  /** Solana gradient background — ONLY certificates */
  gradient: "bg-cert-gradient",

  // ── Shared: gradient outer / inner shell ──
  /** Gradient border wrapper (2.5px via padding trick) */
  outer:
    "relative rounded-lg p-[2.5px] bg-cert-gradient shadow-cert transition-all duration-150",
  /** Interactive outer — lifts on hover */
  outerClickable:
    "cursor-pointer hover:-translate-y-0.5 hover:shadow-cert-hover",
  /** Static outer — verification page (no lift) */
  outerStatic: "cursor-default shadow-cert-lg",
  /** White/dark inner card */
  inner: "bg-card rounded-[calc(var(--r-lg)-2.5px)]",

  // ── 1. Compact — profile grid (tight, thumbnail-sized) ──
  compact: {
    inner: "px-3.5 pt-4 pb-3",
    icon: "w-7 h-7 mx-auto mb-2 flex items-center justify-center",
    iconSvg: "w-5 h-5",
    title: "font-display font-extrabold text-[13px] text-center text-text",
    course: "text-[11px] text-center text-text-3 mb-2.5",
    details: "flex flex-col gap-1",
    row: "flex justify-between items-center",
    label: "text-[10px] text-text-3 font-medium",
    value: "font-display font-bold text-[11px] text-text",
    valueMono: "font-mono text-[10px] font-medium text-text-2",
    grid: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3",
  },

  // ── 2. Full — my certificates page (medium, with actions) ──
  full: {
    inner: "px-5 pt-5 pb-4",
    icon: "w-9 h-9 mx-auto mb-3 flex items-center justify-center",
    iconSvg: "w-7 h-7",
    title: "font-display font-extrabold text-[15px] text-center text-text",
    course: "text-[13px] text-center text-text-3 mb-4",
    details: "flex flex-col gap-1.5 mb-4",
    row: "flex justify-between items-center",
    label: "text-xs text-text-3 font-medium",
    value: "font-display font-bold text-[13px] text-text",
    valueMono: "font-mono text-[11px] font-medium text-text-2",
    actions: "flex items-center gap-2 pt-3 border-t-[2.5px] border-border",
    grid: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4",
  },

  // ── 3. Verification — /certificates/[id] ──
  verify: {
    page: "max-w-[520px] mx-auto",
    pageTitle: "font-display font-black text-[26px] text-center mb-6",
    inner: "px-9 py-10 text-center",
    icon: "w-14 h-14 mx-auto mb-5 flex items-center justify-center",
    iconSvg: "w-12 h-12",
    heading:
      "font-display font-extrabold text-xs uppercase tracking-[2px] text-text-3 mb-3",
    gradientBar: "h-1.5 rounded-full bg-cert-gradient w-4/5 mx-auto mb-6",
    label: "text-[13px] text-text-3 mb-0.5",
    recipient: "font-display font-black text-[22px] text-text mb-1",
    wallet: "font-mono text-[13px] text-text-2 mb-6",
    date: "text-sm text-text-3 mb-4",
    verifyLink:
      "font-display font-bold text-sm text-primary hover:underline cursor-pointer",
    actions: "flex items-center justify-center gap-2.5 mt-5 flex-wrap",
    nftCard:
      "bg-card border-[2.5px] border-border rounded-lg p-5 shadow-card mt-5",
    nftTitle: "font-display font-extrabold text-[15px] mb-3",
    nftRow:
      "flex justify-between items-center py-2 border-b border-border last:border-b-0",
    nftLabel: "text-[13px] text-text-3 font-medium",
    nftValue:
      "text-[13px] text-text font-semibold text-right max-w-[60%] truncate",
    nftValueMono: "font-mono text-xs font-medium text-text-2",
  },

  /** Status badge — minted */
  minted:
    "inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-success-bg border border-success text-success-dark dark:text-success",
  /** Status badge — pending */
  pending:
    "inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-accent-bg border border-accent text-accent-dark dark:text-accent",
} as const;

// ─── COMPOSABLE STYLES OBJECT ───────────────────────────────────────────────

export const styles = {
  button: BUTTON_STYLES,
  buttonSize: BUTTON_SIZES,
  card: CARD_STYLES,
  typography: TYPOGRAPHY,
  layout: LAYOUT_STYLES,
  progress: PROGRESS_STYLES,
  gamification: GAMIFICATION_STYLES,
  level: LEVEL_STYLES,
  difficulty: DIFFICULTY_STYLES,
  banner: BANNER_STYLES,
  form: FORM_STYLES,
  toast: TOAST_STYLES,
  modal: MODAL_STYLES,
  chip: CHIP_STYLES,
  popup: POPUP_STYLES,
  animation: ANIMATION_STYLES,
  interactive: INTERACTIVE_STATES,
  certificate: CERTIFICATE_STYLES,
  spacing: SPACING,
  radius: BORDER_RADIUS,
  transition: TRANSITIONS,
  icon: ICON_SIZES,
} as const;

export type Styles = typeof styles;
