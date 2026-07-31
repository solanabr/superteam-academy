/**
 * Component gallery data for scripts/gen-design-system-doc.mjs.
 *
 * RULES FOR EDITING THIS FILE
 *  1. Every `class="…"` string is COPIED VERBATIM from the component named in
 *     `sources`. Never paraphrase, never merge, never invent a utility.
 *     `gen-design-system-doc.mjs` refuses to build if a class token does not
 *     exist anywhere in apps/web/src.
 *  2. `bespoke` lists the globals.css classes used. The generator inlines those
 *     rules verbatim, stamped with their source line, so the page stands alone.
 *  3. Images and icon components have no place in a static page: images become a
 *     token-coloured placeholder div, Phosphor icons become a text glyph. Both
 *     are marked in the section note where it matters.
 *  4. Text is the real English copy where the component hardcodes it, and a
 *     realistic sample where it comes from next-intl or from data.
 */

/* ── shared, resolved class strings ──────────────────────────────────────── */

/** apps/web/src/lib/styles/styleClasses.ts:366 (TOAST_BASE) */
const TOAST_BASE =
  "flex items-center gap-2 px-3.5 py-2.5 rounded-md border-[2px] bg-card font-body text-xs font-semibold";

/** apps/web/src/lib/styles/styleClasses.ts:369 (TOAST_STYLES) */
const TOAST_TONES = {
  success: "border-success text-success-dark dark:text-success",
  warning: "border-accent text-accent-dark dark:text-accent",
  error: "border-danger text-danger",
  info: "border-primary text-primary-dark dark:text-primary",
};

const toast = (variant, glyph, text) => `
      <div class="pointer-events-auto shadow-lg ${TOAST_BASE} ${TOAST_TONES[variant]}">
        <span aria-hidden="true">${glyph}</span>
        <span class="flex-1">${text}</span>
        <button class="ml-auto shrink-0 opacity-60 transition-opacity hover:opacity-100" aria-label="Dismiss">✕</button>
      </div>`;

/** apps/web/src/components/ui/button.tsx — cva base + variant + size, resolved */
const BTN_BASE =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-display font-extrabold border-none cursor-pointer no-underline transition-all duration-[120ms] ease rounded-md text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-50 active:translate-y-[2px]";
const BTN = {
  primary:
    "bg-primary text-white shadow-[0_4px_0_0_var(--primary-dark)] hover:bg-primary-hover active:shadow-[0_1px_0_0_var(--primary-dark)]",
  secondary:
    "bg-transparent text-text border-solid border-[1.5px] border-border-strong hover:border-primary hover:text-primary active:shadow-none",
  accent:
    "bg-xp text-white shadow-[0_4px_0_0_var(--xp-dark)] hover:opacity-[0.92] active:shadow-[0_1px_0_0_var(--xp-dark)]",
  ghost:
    "bg-transparent text-text-2 shadow-none hover:bg-subtle hover:text-text active:translate-y-0",
  link: "text-primary underline-offset-4 hover:underline shadow-none active:translate-y-0",
  destructive:
    "bg-danger text-white shadow-[0_4px_0_0_var(--danger-dark)] hover:opacity-[0.92] active:shadow-[0_1px_0_0_var(--danger-dark)] focus-visible:outline-danger",
  destructiveOutline:
    "bg-transparent text-danger border-solid border-[1.5px] [border-color:var(--danger-border)] hover:[border-color:var(--danger)] hover:bg-danger-light active:shadow-none focus-visible:outline-danger",
};
const SIZE = {
  default: "px-[22px] py-[11px] text-sm",
  sm: "px-[14px] py-[7px] text-xs rounded-sm",
  lg: "px-[30px] py-[14px] text-base",
  icon: "h-10 w-10 p-0",
};
const btn = (variant, label, size = "default", extra = "") =>
  `<button class="${BTN_BASE} ${BTN[variant]} ${SIZE[size]}${extra ? " " + extra : ""}">${label}</button>`;

/** apps/web/src/components/course/difficulty-badge.tsx:23 */
const CHIP_BASE =
  "inline-flex items-center rounded-full border px-3 py-0.5 text-[11px] font-display font-bold uppercase tracking-wider";
const DIFFICULTY = {
  beginner:
    "[border-color:var(--primary-border)] [background:var(--primary-dim)] text-primary-dark dark:text-primary",
  intermediate:
    "[border-color:var(--accent-border)] bg-xp-dim text-xp-dark dark:text-xp",
  advanced:
    "[border-color:var(--streak-border)] bg-streak-light text-streak dark:[background:var(--streak-dim)]",
};

/** apps/web/src/components/admin/admin-badge.tsx:14 */
const ADMIN_BADGE_BASE =
  "inline-flex items-center border px-2 py-0.5 text-xs font-medium";
const ADMIN_TONES = {
  success: "border-success bg-success-light text-success",
  danger: "border-danger bg-danger-light text-danger",
  warning: "border-streak bg-streak-light text-streak",
  info: "border-primary bg-primary-bg text-primary-dark dark:text-primary",
  accent: "border-accent bg-accent-bg text-accent-dark dark:text-accent",
  neutral: "border-border bg-subtle text-text-3",
};

/** apps/web/src/components/gamification/level-badge.tsx:19 */
const LEVEL_SIZE = {
  xs: "w-[20px] h-[20px] text-[10px] border-[1.5px]",
  sm: "w-[32px] h-[32px] text-[13px] border-[2px]",
  md: "w-[44px] h-[44px] text-[16px] border-[2.5px]",
  lg: "w-[64px] h-[64px] text-[28px] border-[2.5px]",
  xl: "w-[96px] h-[96px] text-[42px] border-[3px]",
};
const levelBadge = (tier, level, size = "md") =>
  `<div class="level-badge lv-${tier} ${LEVEL_SIZE[size]}" role="img" aria-label="Level ${level}">${level}</div>`;

/** apps/web/src/components/ui/dialog.tsx:36 — DialogContent, minus the
    data-[state] animation utilities (nothing toggles them in a static page). */
const DIALOG_CONTENT =
  "z-[300] grid w-full max-w-lg gap-4 rounded-xl border-[2.5px] border-border-strong bg-card p-6 shadow-card duration-200";

/* ── the gallery ─────────────────────────────────────────────────────────── */

export const GALLERY = [
  {
    id: "buttons",
    title: "Buttons",
    sources: ["apps/web/src/components/ui/button.tsx"],
    note: "The only cva primitive in the codebase. Three core variants, four utility variants, six backward-compat aliases, four sizes. Aliases render identically to the variant they point at, so only the distinct visuals are shown.",
    html: `
      <div class="gx-row">
        ${btn("primary", "Primary")}
        ${btn("secondary", "Secondary")}
        ${btn("accent", "Accent")}
        ${btn("ghost", "Ghost")}
        ${btn("link", "Link")}
      </div>
      <div class="gx-row">
        ${btn("destructive", "Destructive")}
        ${btn("destructiveOutline", "Destructive outline")}
      </div>
      <div class="gx-row">
        ${btn("primary", "Small", "sm")}
        ${btn("primary", "Default")}
        ${btn("primary", "Large", "lg")}
        ${btn("primary", "★", "icon")}
        <button class="${BTN_BASE} ${BTN.primary} ${SIZE.default}" disabled>Disabled</button>
      </div>`,
  },

  {
    id: "toasts",
    title: "Toasts",
    sources: [
      "apps/web/src/components/ui/toast-container.tsx",
      "apps/web/src/lib/styles/styleClasses.ts:366-380",
    ],
    note: 'The toast system supports exactly four variants — <code>success</code>, <code>error</code>, <code>warning</code>, <code>info</code> (<code>ToastVariant</code>, toast-container.tsx:14; default <code>info</code>). There is no XP toast: XP awards render as a <code>.popup-xp</code> pill, shown under “Celebration popups”. Dispatched with <code>dispatchToast(message, variant)</code>; auto-dismiss 5000&nbsp;ms; entry animation is inline <code>pop-spring 0.4s</code>. Phosphor icons are replaced with text glyphs here.',
    html: `
      <div class="pointer-events-none flex w-full max-w-xs flex-col gap-2" aria-live="polite">
        ${toast("success", "✓", "Enrolled successfully!")}
        ${toast("error", "✕", "Sign-in failed. Please try again.")}
        ${toast("warning", "!", "Could not reach the network. Retrying…")}
        ${toast("info", "i", "Your progress is saved on this device.")}
      </div>`,
  },

  {
    id: "popups",
    title: "Celebration popups",
    sources: [
      "apps/web/src/components/gamification/level-up-popup.tsx",
      "apps/web/src/components/gamification/certificate-popup.tsx",
      "apps/web/src/components/gamification/achievement-popup.tsx",
      "apps/web/src/components/gamification/gamification-overlays.tsx:35",
    ],
    bespoke: [
      "popup-grad",
      "popup-grad-inner",
      "popup-icon-ring",
      "popup-icon-inner",
      "popup-label",
      "popup-name",
      "popup-xp",
      "popup-xp-amount",
    ],
    note: "All three share <code>.popup-grad</code>; the gradient and glow come from the <code>.achievement</code> / <code>.cert</code> modifier, so a bare <code>.popup-grad</code> is a transparent 2px pad. Mounted bottom-right in a <code>pointer-events-none</code> stack. The entry animation is disabled here so the page is legible.",
    html: `
      <div class="flex flex-col gap-2">
        <div class="popup-grad achievement">
          <div class="popup-grad-inner">
            <div class="popup-icon-ring"><div class="popup-icon-inner" aria-hidden="true">↑</div></div>
            <div>
              <div class="popup-label">Level Up!</div>
              <div class="popup-name">You reached level 5!</div>
            </div>
          </div>
        </div>
        <div class="popup-grad cert cursor-pointer border-none bg-transparent p-0 text-left transition-opacity hover:opacity-90">
          <div class="popup-grad-inner">
            <div class="popup-icon-ring"><div class="popup-icon-inner" aria-hidden="true">◎</div></div>
            <div>
              <div class="popup-label">Certificate Earned!</div>
              <div class="popup-name">View Certificate →</div>
            </div>
          </div>
        </div>
        <div class="popup-grad achievement cursor-pointer border-none bg-transparent p-0 text-left transition-opacity hover:opacity-90">
          <div class="popup-grad-inner">
            <div class="popup-icon-ring"><div class="popup-icon-inner" aria-hidden="true">🏆</div></div>
            <div class="flex-1">
              <div class="popup-label">Achievement Unlocked!</div>
              <div class="popup-name">First Steps</div>
            </div>
            <div class="popup-xp ml-2 !animate-none"><span class="popup-xp-amount">+100 XP</span></div>
          </div>
        </div>
      </div>`,
  },

  {
    id: "dialog",
    title: "Dialog / modal",
    sources: [
      "apps/web/src/components/ui/dialog.tsx",
      "apps/web/src/components/auth/auth-modal.tsx",
    ],
    note: 'Radix wrappers. The overlay is <code>fixed inset-0 z-[300] bg-black/70</code>; the panel below is <code>DialogContent</code> with its <code>data-[state]</code> animation utilities and fixed centring removed so it sits in the page. The body shown is the auth modal (<code>sm:max-w-sm</code>), whose three provider buttons are <code>Button variant="outline"</code> + <code>h-12 w-full gap-3 text-sm font-medium</code>.',
    html: `
      <div class="${DIALOG_CONTENT}">
        <div class="flex flex-col space-y-1.5 text-center sm:text-left">
          <h2 class="font-display text-lg font-black leading-none tracking-tight text-center">Welcome to Superteam Academy</h2>
          <p class="text-sm text-text-2 text-center">Connect your wallet or sign in to start learning</p>
        </div>
        <div class="mt-6 space-y-3">
          ${btn("secondary", "Connect Solana Wallet", "default", "h-12 w-full gap-3 text-sm font-medium")}
          <div class="relative my-4">
            <div class="absolute inset-0 flex items-center"><span class="w-full border-t"></span></div>
            <div class="relative flex justify-center text-xs uppercase"><span class="bg-bg px-2 text-text-3">or</span></div>
          </div>
          ${btn("secondary", "Sign in with Google", "default", "h-12 w-full gap-3 text-sm font-medium")}
          ${btn("secondary", "Sign in with GitHub", "default", "h-12 w-full gap-3 text-sm font-medium")}
          <p class="text-center text-sm text-danger" role="alert">Could not start Google sign-in. Please try again.</p>
          <div class="space-y-3 pt-1">
            ${btn("ghost", "Later", "default", "h-10 w-full text-sm font-medium")}
            <p class="text-center text-xs text-text-3">No rush — your progress stays saved on this device.</p>
          </div>
        </div>
      </div>`,
  },

  {
    id: "pills",
    title: "Pills &amp; badges",
    sources: [
      "apps/web/src/styles/globals.css (.pill family)",
      "apps/web/src/components/course/difficulty-badge.tsx",
      "apps/web/src/components/admin/admin-badge.tsx",
      "apps/web/src/components/admin/status-badge.tsx",
      "apps/web/src/components/community/thread-status-badge.tsx",
    ],
    bespoke: [
      "pill",
      "pill-primary",
      "pill-beg",
      "pill-int",
      "pill-adv",
      "pill-xp",
      "pill-streak",
      "pill-level",
      "pill-sol",
      "pill-done",
    ],
    note: "Three parallel badge systems exist. <code>.pill-*</code> is the globals.css family; <code>DifficultyBadge</code> is the Tailwind-token one used on course detail pages; <code>AdminBadge</code> is admin-only. The bespoke course card carries its own <code>.course-card-diff</code> chip instead of <code>DifficultyBadge</code> — see the Course card section.",
    html: `
      <div class="gx-row">
        <span class="pill pill-beg">Beginner</span>
        <span class="pill pill-int">Intermediate</span>
        <span class="pill pill-adv">Advanced</span>
        <span class="pill pill-xp">1,250 XP</span>
        <span class="pill pill-streak">7 day</span>
        <span class="pill pill-level">Lv 12</span>
        <span class="pill pill-sol">Solana</span>
        <span class="pill pill-done">Done</span>
      </div>
      <div class="gx-caption">DifficultyBadge — difficulty-badge.tsx</div>
      <div class="gx-row">
        <span class="${CHIP_BASE} ${DIFFICULTY.beginner}">Beginner</span>
        <span class="${CHIP_BASE} ${DIFFICULTY.intermediate}">Intermediate</span>
        <span class="${CHIP_BASE} ${DIFFICULTY.advanced}">Advanced</span>
      </div>
      <div class="gx-caption">AdminBadge tones — admin-badge.tsx</div>
      <div class="gx-row">
        ${Object.entries(ADMIN_TONES)
          .map(
            ([tone, cls]) =>
              `<span class="${ADMIN_BADGE_BASE} rounded ${cls}">${tone}</span>`
          )
          .join("\n        ")}
        <span class="${ADMIN_BADGE_BASE} rounded-full ${ADMIN_TONES.info}">pill shape</span>
      </div>
      <div class="gx-caption">StatusBadge — status-badge.tsx</div>
      <div class="gx-row">
        <span class="${ADMIN_BADGE_BASE} rounded bg-success-bg border-success text-success">Synced</span>
        <span class="${ADMIN_BADGE_BASE} rounded bg-accent-bg border-accent text-accent-dark dark:text-accent">Out of sync</span>
        <span class="${ADMIN_BADGE_BASE} rounded bg-danger-light border-danger text-danger">Not deployed</span>
        <span class="${ADMIN_BADGE_BASE} rounded bg-subtle border-border text-text-3">Draft</span>
        <span class="${ADMIN_BADGE_BASE} rounded bg-streak-light border-streak text-streak">Missing fields</span>
        <span class="${ADMIN_BADGE_BASE} rounded bg-primary-bg border-primary text-primary-dark">Undecodable</span>
        <span class="${ADMIN_BADGE_BASE} rounded bg-subtle border-solana-purple text-solana-purple">DB unavailable</span>
      </div>
      <div class="gx-caption">ThreadStatusBadge — thread-status-badge.tsx</div>
      <div class="gx-row">
        <span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-[var(--primary-dim)] text-[var(--primary)]">Solved</span>
        <span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-[var(--xp-dim)] text-[var(--xp)]">Unanswered</span>
      </div>`,
  },

  {
    id: "level-badges",
    title: "Level badges",
    sources: ["apps/web/src/components/gamification/level-badge.tsx"],
    bespoke: [
      "level-badge",
      "lv-seed",
      "lv-sprout",
      "lv-sapling",
      "lv-canopy",
      "lv-legend",
    ],
    note: "Tier is derived from the level: <code>&lt;5</code> seed, <code>&ge;5</code> sprout, <code>&ge;10</code> sapling, <code>&ge;20</code> canopy, <code>&ge;50</code> legend. Canopy and legend carry looping glow animations (<code>lv-canopy-pulse</code>, <code>lv-legend-pulse</code>).",
    html: `
      <div class="gx-row">
        ${levelBadge("seed", 3)}
        ${levelBadge("sprout", 7)}
        ${levelBadge("sapling", 12)}
        ${levelBadge("canopy", 24)}
        ${levelBadge("legend", 52)}
      </div>
      <div class="gx-caption">sizes: xs / sm / md / lg / xl</div>
      <div class="gx-row">
        ${levelBadge("sapling", 12, "xs")}
        ${levelBadge("sapling", 12, "sm")}
        ${levelBadge("sapling", 12, "md")}
        ${levelBadge("sapling", 12, "lg")}
        ${levelBadge("sapling", 12, "xl")}
      </div>`,
  },

  {
    id: "xp-chip",
    title: "Header XP chip",
    sources: ["apps/web/src/components/layout/header.tsx:290"],
    bespoke: ["level-badge", "lv-sapling"],
    note: "Desktop-only (<code>lg:flex</code>), rendered when signed in. The <code>shadow-glow-xp</code> + <code>scale-105</code> pair is the transient state after an XP award; the float-up <code>+50 XP</code> pill below it is the <code>xpGainAmount</code> branch (its <code>xp-float</code> animation is disabled here).",
    html: `
      <div class="gx-row">
        <div class="group relative flex items-center gap-[8px] rounded-full border border-[var(--border)] bg-[var(--card)] py-[4px] pl-[4px] pr-[12px] transition-all duration-500">
          ${levelBadge("sapling", 12, "sm")}
          <span class="font-display text-[13px] font-black tabular-nums text-[var(--xp)] transition-transform duration-300">12,480<span class="ml-[2px] text-[10px] font-bold text-[var(--text-3)]">XP</span></span>
        </div>
        <div class="group relative flex items-center gap-[8px] rounded-full border border-[var(--border)] bg-[var(--card)] py-[4px] pl-[4px] pr-[12px] transition-all duration-500 shadow-glow-xp">
          ${levelBadge("sapling", 12, "sm")}
          <span class="font-display text-[13px] font-black tabular-nums text-[var(--xp)] transition-transform duration-300 scale-105">12,530<span class="ml-[2px] text-[10px] font-bold text-[var(--text-3)]">XP</span></span>
        </div>
        <span class="whitespace-nowrap rounded-full border border-[var(--xp-dim)] bg-[var(--card)] px-3 py-0.5 font-display text-[15px] font-black text-[var(--xp)] shadow-[0_2px_8px_var(--xp-dim)]">+50 XP</span>
      </div>`,
  },

  {
    id: "streak",
    title: "Streak panel &amp; freeze",
    sources: ["apps/web/src/components/gamification/streak-display.tsx"],
    bespoke: ["card-chunky"],
    note: "Day cells have four exclusive states in this order: today (pulsing primary), active (success), frozen (freeze blue + snowflake), idle. The freeze chip top-right only renders when freezes remain. Snowflakes are Phosphor icons, drawn here as ❄.",
    html: `
      <div class="card-chunky p-4 sm:p-6">
        <div class="mb-4 flex items-center gap-3.5">
          <div class="flex h-12 w-12 items-center justify-center rounded-[14px] bg-streak-light"><span class="text-streak">🔥</span></div>
          <div>
            <div class="font-display text-[26px] font-black leading-tight">7 day streak</div>
            <div class="font-body text-[13px] text-text-3">Active today</div>
          </div>
          <div class="ml-auto inline-flex items-center gap-1 rounded-full bg-freeze-bg px-2.5 py-1 font-display text-xs font-bold text-freeze" title="2 freezes left">❄ 2 freezes</div>
        </div>
        <div class="flex justify-between gap-1 sm:gap-1.5" role="img" aria-label="Streak">
          <div class="flex h-8 w-8 items-center justify-center rounded-full border-[2.5px] font-display text-[11px] font-extrabold transition-colors sm:h-10 sm:w-10 sm:text-[13px] border-success bg-success-light text-success-dark shadow-[0_2px_0_0_var(--success-dark)]">M</div>
          <div class="flex h-8 w-8 items-center justify-center rounded-full border-[2.5px] font-display text-[11px] font-extrabold transition-colors sm:h-10 sm:w-10 sm:text-[13px] border-success bg-success-light text-success-dark shadow-[0_2px_0_0_var(--success-dark)]">T</div>
          <div class="flex h-8 w-8 items-center justify-center rounded-full border-[2.5px] font-display text-[11px] font-extrabold transition-colors sm:h-10 sm:w-10 sm:text-[13px] border-freeze bg-freeze-bg text-freeze" title="Streak frozen">❄</div>
          <div class="flex h-8 w-8 items-center justify-center rounded-full border-[2.5px] font-display text-[11px] font-extrabold transition-colors sm:h-10 sm:w-10 sm:text-[13px] border-success bg-success-light text-success-dark shadow-[0_2px_0_0_var(--success-dark)]">T</div>
          <div class="flex h-8 w-8 items-center justify-center rounded-full border-[2.5px] font-display text-[11px] font-extrabold transition-colors sm:h-10 sm:w-10 sm:text-[13px] border-primary-dark bg-primary text-white shadow-[0_2px_0_0_var(--primary-dark)]">F</div>
          <div class="flex h-8 w-8 items-center justify-center rounded-full border-[2.5px] font-display text-[11px] font-extrabold transition-colors sm:h-10 sm:w-10 sm:text-[13px] border-border bg-subtle text-text-3">S</div>
          <div class="flex h-8 w-8 items-center justify-center rounded-full border-[2.5px] font-display text-[11px] font-extrabold transition-colors sm:h-10 sm:w-10 sm:text-[13px] border-border bg-subtle text-text-3">S</div>
        </div>
        <div class="mt-4 flex flex-wrap gap-2">
          <span class="inline-flex items-center gap-1 rounded-full bg-primary-bg px-2.5 py-1 font-display text-xs font-bold"><span class="text-streak">🔥</span> Week Warrior</span>
        </div>
      </div>`,
  },

  {
    id: "cards",
    title: "Cards",
    sources: [
      "apps/web/src/components/ui/card.tsx",
      "apps/web/src/styles/globals.css (.card-chunky)",
      "apps/web/src/components/course/course-card.tsx",
      "apps/web/src/components/dashboard/continue-card.tsx",
    ],
    bespoke: [
      "card-chunky",
      "course-card",
      "course-card-thumb",
      "course-num",
      "course-card-body",
      "course-card-top",
      "course-card-title",
      "course-card-desc",
      "course-card-foot",
      "course-card-stat",
      "course-card-xp",
      "course-card-path",
      "course-card-diff",
      "course-card-status",
    ],
    note: "Four card idioms coexist: the shadcn <code>Card</code> primitive (static, 1px <code>--border-default</code>), the chunky 2.5px <code>.card-chunky</code>, the fully bespoke <code>.course-card</code>, and the gradient-bordered continue card (a Tailwind-only composition with the Solana gradient as a 2.5px padding layer). The course-card thumbnail is a placeholder box here.",
    html: `
      <div class="gx-stack">
        <div class="rounded-[var(--r-lg)] border border-[var(--border-default)] bg-[var(--card)] text-[var(--text)] shadow-[var(--shadow-card)] transition-all duration-200 " style="max-width:320px">
          <div class="flex flex-col space-y-1.5 p-6">
            <h3 class="font-display text-2xl font-extrabold leading-none tracking-tight text-text">Card title</h3>
            <p class="text-sm text-text-2">CardDescription — text-sm text-text-2</p>
          </div>
          <div class="p-6 pt-0">CardContent — p-6 pt-0</div>
        </div>

        <div class="card-chunky p-6 " style="max-width:320px"><strong>.card-chunky</strong> — 2.5px border, shadow-card, hover lift</div>

        <div class="course-card " style="max-width:320px">
          <div class="course-card-thumb" aria-hidden="true">
            <div style="width:100%;height:100%;background:var(--subtle)"></div>
            <span class="course-num">03</span>
          </div>
          <div class="course-card-body">
            <div class="course-card-top">
              <span class="course-card-path">Anchor Development</span>
              <span class="course-card-status enrolled">3/12 Lessons</span>
            </div>
            <h3 class="course-card-title">Anchor Fundamentals</h3>
            <p class="course-card-desc">Build, test and deploy your first Anchor program on Solana devnet.</p>
            <div class="course-card-foot">
              <div class="course-card-stat">
                <span class="course-card-diff">Intermediate</span>
                <span class="text-[16px] leading-none text-text-3" aria-hidden="true">&middot;</span>
                <span>12 Lessons</span>
                <span class="text-[16px] leading-none text-text-3" aria-hidden="true">&middot;</span>
                <span>4 Hours</span>
              </div>
              <span class="course-card-xp" aria-label="500 XP"><span aria-hidden="true">⚡</span> 500</span>
            </div>
          </div>
        </div>

        <div class="group block rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
          <div class="rounded-xl p-[2.5px] shadow-card [background:linear-gradient(135deg,#9945FF,#14F195)]">
            <div class="relative flex items-center gap-4 overflow-hidden rounded-[10px] bg-card p-5 md:p-6">
              <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white [background:linear-gradient(135deg,#9945FF,#14F195)]" aria-hidden="true">▶</span>
              <div class="min-w-0 flex-1">
                <p class="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-primary">Continue learning</p>
                <p class="mt-1 truncate font-display text-base font-black tracking-[-0.25px] md:text-lg">Anchor Fundamentals<span class="mx-2 text-text-3" aria-hidden="true">&middot;</span><span class="text-text-2">Program Derived Addresses</span></p>
                <p class="mt-1 text-xs text-text-3">4 of 12 lessons done</p>
              </div>
              <span class="flex shrink-0 items-center gap-1.5 font-display text-sm font-extrabold text-primary transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true"><span class="hidden sm:inline">Resume lesson</span> →</span>
            </div>
          </div>
        </div>
      </div>`,
  },

  {
    id: "certificate",
    title: "Certificate card",
    sources: [
      "apps/web/src/components/certificates/certificate-card.tsx",
      "apps/web/src/lib/styles/styleClasses.ts:518-575",
      "apps/web/src/components/ui/proof-pill.tsx",
    ],
    bespoke: [
      "cert-wrap",
      "cert-inner",
      "cert-body",
      "cert-eyebrow",
      "cert-course",
      "cert-subtitle",
      "cert-divider",
      "cert-meta-row",
      "cert-meta-item",
      "cert-meta-key",
      "cert-meta-val",
      "cert-foot",
      "cert-network",
      "proof-pill",
      "proof-dot",
    ],
    note: "Entirely bespoke CSS, addressed through the <code>CERTIFICATE_STYLES</code> constant rather than inline strings — the closest thing in the codebase to a fully tokenised component. The proof pill is the shared on-chain-link primitive.",
    html: `
      <div class="cert-wrap " style="max-width:360px">
        <div class="cert-inner">
          <div class="cert-body">
            <div class="cert-eyebrow">Certificate of Completion</div>
            <div class="cert-course">Anchor Fundamentals</div>
            <div class="cert-subtitle">Anchor Development · Intermediate</div>
            <div class="cert-divider"></div>
            <div class="cert-meta-row">
              <div class="cert-meta-item">
                <div class="cert-meta-key">Recipient</div>
                <div class="cert-meta-val">quiet-otter-4821</div>
              </div>
              <div class="cert-meta-item">
                <div class="cert-meta-key">Completed</div>
                <div class="cert-meta-val">12 Jul 2026</div>
              </div>
              <div class="cert-meta-item">
                <div class="cert-meta-key">Mint address</div>
                <div class="cert-meta-val font-mono text-xs">7xKX…gAsU</div>
              </div>
            </div>
            <div class="cert-foot">
              <a class="proof-pill focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2"><span class="proof-dot" aria-hidden="true"></span>4NfW…kQ1z</a>
              <div class="cert-network">Verified on Solana Devnet</div>
            </div>
          </div>
        </div>
      </div>`,
  },

  {
    id: "leaderboard",
    title: "Leaderboard &amp; cohort",
    sources: [
      "apps/web/src/app/[locale]/(platform)/leaderboard/leaderboard-client.tsx",
      "apps/web/src/components/leaderboard/cohort-row.tsx",
      "apps/web/src/components/dashboard/cohort-strip.tsx",
    ],
    bespoke: [
      "lb-timeframe-tabs",
      "lb-tf-tab",
      "lb-board-tabs",
      "lb-board-tab",
      "lb-league-head",
      "lb-league-icon",
      "lb-league-tier",
      "lb-league-sub",
      "lb-league-info",
      "podium-grid",
      "podium-card",
      "podium-rank-icon",
      "podium-avatar",
      "podium-name",
      "podium-xp",
      "lb-list",
      "lb-list-compact",
      "lb-row",
      "lb-rank",
      "lb-av",
      "lb-info",
      "lb-name",
      "lb-me-tag",
      "lb-right",
      "lb-xp",
      "lb-wallet",
      "lb-empty",
    ],
    note: "Podium ranks 1–3 use the <code>gold</code>/<code>silver</code>/<code>bronze</code> modifiers (with the 1st-place card centred by DOM reordering, not CSS); rank 4+ falls back to <code>.lb-row</code>. The signed-in learner's row adds <code>.me</code>. The dashboard cohort strip reuses <code>.lb-list</code> with <code>.lb-list-compact</code>.",
    html: `
      <div class="gx-row">
        <div class="lb-timeframe-tabs">
          <button class="lb-tf-tab active">This week</button>
          <button class="lb-tf-tab">All time</button>
        </div>
        <div class="lb-board-tabs">
          <button class="lb-board-tab active">League</button>
          <button class="lb-board-tab">Global</button>
        </div>
      </div>
      <div class="lb-league-head">
        <span class="lb-league-icon">👥</span>
        <div class="min-w-0 flex-1">
          <p class="lb-league-tier">Sapphire League</p>
          <p class="lb-league-sub">This week · 24 members · Resets Monday</p>
        </div>
        <button type="button" class="lb-league-info">i</button>
      </div>
      <div class="podium-grid">
        <div class="podium-card silver">
          <div class="podium-rank-icon">🥈</div>
          <div class="podium-avatar"><span>AL</span></div>
          <div class="podium-name"><span class="truncate">alice.sol</span></div>
          <div class="podium-xp">11,020 XP</div>
          ${levelBadge("canopy", 22, "sm")}
        </div>
        <div class="podium-card gold">
          <div class="podium-rank-icon">👑</div>
          <div class="podium-avatar gold"><span>BQ</span></div>
          <div class="podium-name"><span class="truncate">builderqueen</span></div>
          <div class="podium-xp">12,480 XP</div>
          ${levelBadge("legend", 51, "sm")}
        </div>
        <div class="podium-card bronze">
          <div class="podium-rank-icon">⚡</div>
          <div class="podium-avatar"><span>CJ</span></div>
          <div class="podium-name"><span class="truncate">cj.eth</span></div>
          <div class="podium-xp">9,870 XP</div>
          ${levelBadge("canopy", 20, "sm")}
        </div>
      </div>
      <div class="lb-list">
        <div class="lb-row">
          <span class="lb-rank">4</span>
          <div class="lb-av" aria-hidden="true"><span>DM</span></div>
          <div class="lb-info"><div class="lb-name"><span class="truncate">devmage</span></div><div class="lb-wallet">8kQp…2Wct</div></div>
          <div class="lb-right">${levelBadge("sapling", 14, "sm")}<span class="lb-xp">8,240 XP</span></div>
        </div>
        <div class="lb-row me">
          <span class="lb-rank">5</span>
          <div class="lb-av" aria-hidden="true"><span>YO</span></div>
          <div class="lb-info"><div class="lb-name"><span class="truncate">quiet-otter-4821</span><span class="lb-me-tag">You</span></div><div class="lb-wallet">4NfW…kQ1z</div></div>
          <div class="lb-right">${levelBadge("sapling", 12, "sm")}<span class="lb-xp">7,905 XP</span></div>
        </div>
        <div class="lb-row">
          <span class="lb-rank">6</span>
          <div class="lb-av" aria-hidden="true"><span>?</span></div>
          <div class="lb-info"><div class="lb-name"><span class="truncate text-text-3">Anonymous learner</span></div></div>
          <div class="lb-right">${levelBadge("sprout", 8, "sm")}<span class="lb-xp">6,410 XP</span></div>
        </div>
      </div>
      <div class="gx-caption">Dashboard cohort strip — cohort-strip.tsx</div>
      <section aria-label="Your cohort" class="rounded-xl border border-border bg-card p-4 shadow-card">
        <div class="mb-3 flex items-center gap-3">
          <span class="bg-primary-dim flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-primary" aria-hidden="true">👥</span>
          <div class="min-w-0 flex-1">
            <p class="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Your cohort</p>
            <p class="truncate text-sm font-semibold text-text-2">Sapphire League · This week</p>
          </div>
          <span class="flex shrink-0 items-center gap-1.5 font-display text-sm font-extrabold text-primary transition-transform duration-200 hover:translate-x-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"><span class="hidden sm:inline">View all</span> →</span>
        </div>
        <div class="lb-list lb-list-compact">
          <div class="lb-row">
            <span class="lb-rank">4</span>
            <div class="lb-av" aria-hidden="true"><span>DM</span></div>
            <div class="lb-info"><div class="lb-name"><span class="truncate">devmage</span></div></div>
            <div class="lb-right"><span class="lb-xp">+1,240 XP</span></div>
          </div>
          <div class="lb-row me">
            <span class="lb-rank">5</span>
            <div class="lb-av" aria-hidden="true"><span>YO</span></div>
            <div class="lb-info"><div class="lb-name"><span class="truncate">quiet-otter-4821</span><span class="lb-me-tag">You</span></div></div>
            <div class="lb-right"><span class="lb-xp">+980 XP</span></div>
          </div>
        </div>
      </section>
      <div class="gx-caption">Empty state — .lb-empty</div>
      <div class="lb-empty"><span>👥</span><p>Sign in to join a league.</p></div>`,
  },

  {
    id: "navigation",
    title: "Navigation",
    sources: [
      "apps/web/src/components/layout/header.tsx",
      "apps/web/src/components/layout/mobile-bottom-nav.tsx",
      "apps/web/src/components/layout/theme-toggle.tsx",
      "apps/web/src/components/ui/tabs.tsx",
      "apps/web/src/app/[locale]/(platform)/courses/courses-client.tsx:187",
    ],
    bespoke: [
      "nav-bar",
      "nav-link",
      "mobile-bottom-nav",
      "mobile-bottom-nav-item",
      "catalog-tabs",
      "catalog-tab",
    ],
    note: 'The desktop nav is a floating pill bar (<code>.nav-bar</code>, absolutely centred in the header); the active link gets <code>.active</code>. The mobile bar is a separate bespoke component shown below <code>lg</code>. Three unrelated tab idioms exist: the Radix <code>Tabs</code> primitive, the bespoke <code>.catalog-tab</code> strip, and the leaderboard\'s <code>.lb-*-tab</code>s. The mobile nav is rendered here in flow rather than <code>fixed</code>.',
    html: `
      <div class="gx-row">
        <nav class="nav-bar">
          <a class="nav-link active" aria-current="page">Dashboard</a>
          <a class="nav-link">Courses</a>
          <a class="nav-link">Community</a>
          <a class="nav-link">Teach</a>
        </nav>
        <button class="inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-md border-[2.5px] border-border bg-card text-text-2 transition-colors hover:bg-subtle hover:text-text md:h-9 md:w-9" aria-label="Toggle theme">☾</button>
        <button class="group flex h-10 items-center gap-0 rounded-full border-[2.5px] border-border bg-card transition-all hover:border-border-hover hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <span class="-ml-px flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-subtle text-sm">TH</span>
          <span class="flex items-center pl-1.5 pr-3"><span class="font-mono text-xs font-medium text-text-2">7Xk9…3mQp</span></span>
        </button>
      </div>
      <div class="gx-caption">Radix Tabs primitive — ui/tabs.tsx</div>
      <div class="inline-flex h-10 items-center justify-center rounded-md bg-subtle p-1 text-text-3">
        <span class="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-bg transition-all data-[state=active]:bg-card data-[state=active]:text-text data-[state=active]:shadow-sm" data-state="active">Profile</span>
        <span class="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-bg transition-all data-[state=active]:bg-card data-[state=active]:text-text data-[state=active]:shadow-sm" data-state="inactive">Notifications</span>
        <span class="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-bg transition-all data-[state=active]:bg-card data-[state=active]:text-text data-[state=active]:shadow-sm" data-state="inactive">Danger zone</span>
      </div>
      <div class="gx-caption">Catalog tab strip — courses-client.tsx</div>
      <div class="catalog-tabs">
        <button class="catalog-tab active">All courses</button>
        <button class="catalog-tab">Learning paths</button>
      </div>
      <div class="gx-caption">Mobile bottom nav — mobile-bottom-nav.tsx (position:fixed neutralised here)</div>
      <nav class="mobile-bottom-nav" style="position:static">
        <a class="mobile-bottom-nav-item active" aria-current="page"><span>▦</span><span>Dashboard</span></a>
        <a class="mobile-bottom-nav-item"><span>▤</span><span>Courses</span></a>
        <a class="mobile-bottom-nav-item"><span>↻</span><span>Review</span></a>
        <a class="mobile-bottom-nav-item"><span>◇</span><span>Community</span></a>
      </nav>`,
  },

  {
    id: "forms",
    title: "Form elements",
    sources: [
      "apps/web/src/components/community/create-thread-modal.tsx:184",
      "apps/web/src/app/[locale]/(platform)/settings/_components/profile-tab.tsx:354",
      "apps/web/src/app/[locale]/(platform)/courses/courses-client.tsx:218",
      "apps/web/src/components/community/markdown-editor.tsx",
      "apps/web/src/components/community/thread-filters.tsx",
      "apps/web/src/components/dashboard/next-lesson-plan.tsx:217",
    ],
    note: "There is no shared input primitive — six distinct field recipes are in use, split between the CSS-variable flavour (<code>bg-[var(--input)]</code>, community) and the Tailwind-token flavour (<code>border-[2.5px] border-border bg-card</code>, settings/catalog). The most common are shown. Segmented button groups stand in for selects in the forum filters.",
    html: `
      <div class="gx-stack">
        <div class="gx-caption">Community field — create-thread-modal.tsx</div>
        <input type="text" class="w-full rounded-md border border-[var(--border-default)] bg-[var(--input)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-2)] focus:outline-none" placeholder="What's your question?" />
        <select class="w-full rounded-md border border-[var(--border-default)] bg-[var(--input)] px-3 py-2 text-sm text-[var(--text)] focus:outline-none"><option>Select a category</option></select>

        <div class="gx-caption">Settings field — profile-tab.tsx</div>
        <input type="text" class="h-10 w-full rounded-md border-[2.5px] border-border bg-card px-3 font-body text-sm text-text outline-none transition-all duration-150 placeholder:text-text-3 focus:border-primary focus:shadow-[0_0_0_3px_var(--primary-dim)]" placeholder="username" />

        <div class="gx-caption">Catalog search — courses-client.tsx</div>
        <input type="search" class="h-9 w-full rounded-[var(--r-md)] border-[2.5px] border-border bg-card pl-9 pr-4 text-sm text-text shadow-[var(--shadow-sm)] outline-none transition-[border-color] duration-150 placeholder:text-text-3 focus:border-primary" placeholder="Search courses" />

        <div class="gx-caption">Compact select / time input — next-lesson-plan.tsx</div>
        <div class="gx-row">
          <select class="rounded-md border border-border px-2.5 py-1.5 text-sm [background:var(--input)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"><option>Weekdays</option></select>
          <input type="time" value="19:30" class="rounded-md border border-border px-2.5 py-1.5 text-sm [background:var(--input)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" />
        </div>

        <div class="gx-caption">Checkbox / radio — accent-primary</div>
        <label class="flex items-start gap-2 text-sm text-text-3">
          <input type="checkbox" checked class="mt-0.5 size-4 shrink-0 accent-[var(--primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" />
          Remind me before my session
        </label>

        <div class="gx-caption">Segmented filter — thread-filters.tsx</div>
        <div class="flex gap-1 overflow-x-auto rounded-lg border border-[var(--border-default)] bg-[var(--surface)] p-1">
          <button class="whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors bg-[var(--primary)] text-white">Latest</button>
          <button class="whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors text-[var(--text-2)] hover:bg-[var(--card-hover)] hover:text-[var(--text)]">Top</button>
          <button class="whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors text-[var(--text-2)] hover:bg-[var(--card-hover)] hover:text-[var(--text)]">Unanswered</button>
        </div>

        <div class="gx-caption">Markdown editor — markdown-editor.tsx</div>
        <div class="overflow-hidden rounded-lg border border-[var(--border-default)]">
          <div class="flex border-b border-[var(--border-default)] bg-[var(--surface)]">
            <button class="px-4 py-2 text-sm font-medium transition-colors border-b-2 border-[var(--primary)] text-[var(--primary)]">Write</button>
            <button class="px-4 py-2 text-sm font-medium transition-colors text-[var(--text-2)] hover:text-[var(--text)]">Preview</button>
          </div>
          <textarea class="w-full resize-y bg-[var(--input)] p-4 font-mono text-sm text-[var(--text)] placeholder:text-[var(--text-2)] focus:outline-none" rows="3">Write your content using Markdown...</textarea>
          <div class="flex justify-end border-t border-[var(--border-default)] bg-[var(--surface)] px-4 py-1.5"><span class="text-xs text-[var(--text-2)]">0/10000</span></div>
        </div>
      </div>`,
  },

  {
    id: "quiz",
    title: "Quiz elements",
    sources: [
      "apps/web/src/app/[locale]/(platform)/courses/[slug]/lessons/[id]/blocks/quiz-block.tsx",
      "apps/web/src/components/review/review-quiz-item.tsx",
      "apps/web/src/components/courses/test-out-challenge.tsx:188",
    ],
    note: "Three quiz renderers share one option-row base string and disagree on the states. The lesson <code>QuizBlock</code> colours only the options the learner selected; <code>ReviewQuizItem</code> also reveals unselected correct answers; <code>test-out-challenge</code> is the only one that shows a pre-submit <code>border-primary</code> selection. Selection before grading is otherwise carried by the native control alone.",
    html: `
      <div class="rounded-[var(--r-lg)] border-[2.5px] border-border bg-card p-5 shadow-card">
        <p class="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Retrieval practice</p>
        <h2 class="mt-0.5 font-display text-base font-black tracking-[-0.25px]">Program Derived Addresses</h2>
        <fieldset class="space-y-2 gx-mt">
          <legend class="font-display font-bold text-text">Which seeds produce a canonical PDA?</legend>
          <div class="space-y-1.5">
            <label class="flex cursor-pointer items-center gap-2 rounded-md border p-2 text-sm transition-colors hover:bg-subtle border-border"><input type="radio" class="accent-primary" /><span>idle</span></label>
            <label class="flex cursor-pointer items-center gap-2 rounded-md border p-2 text-sm transition-colors hover:bg-subtle border-primary"><input type="radio" checked class="accent-primary" /><span>selected (test-out only)</span></label>
            <label class="flex cursor-pointer items-center gap-2 rounded-md border p-2 text-sm transition-colors hover:bg-subtle border-success cursor-default"><input type="radio" checked disabled class="accent-primary" /><span>graded — correct</span></label>
            <label class="flex cursor-pointer items-center gap-2 rounded-md border p-2 text-sm transition-colors hover:bg-subtle border-danger cursor-default"><input type="radio" checked disabled class="accent-primary" /><span>graded — chosen, wrong</span></label>
            <label class="flex cursor-pointer items-center gap-2 rounded-md border p-2 text-sm transition-colors hover:bg-subtle border-border cursor-default"><input type="radio" disabled class="accent-primary" /><span>graded — untouched</span></label>
          </div>
        </fieldset>
        <div class="space-y-1 rounded-md border border-border bg-subtle p-3 gx-mt">
          <p class="font-display text-xs font-bold uppercase tracking-wide text-text-3">Explanation</p>
          <p class="text-sm text-text">The canonical bump is the first one that falls off the curve.</p>
        </div>
        <div class="gx-row gx-mt" aria-live="polite">
          <p class="flex items-center gap-1.5 text-sm font-medium text-success">✓ Correct</p>
          <p class="flex items-center gap-1.5 text-sm font-medium text-danger">✕ Not quite</p>
        </div>
        <div class="gx-row gx-mt">
          ${btn("primary", "Check answer", "sm")}
          <button class="${BTN_BASE} ${BTN.primary} ${SIZE.sm}" disabled>Check answer (nothing selected)</button>
          ${btn("secondary", "Previous", "sm")}
          ${btn("secondary", "Next", "sm")}
        </div>
        <p class="flex items-start gap-2 rounded-md border border-border p-3 text-xs text-text-3 [background:var(--input)] gx-mt">Answer every question to unlock the AI assistant.</p>
      </div>`,
  },

  {
    id: "progress",
    title: "Progress elements",
    sources: [
      "apps/web/src/components/ui/progress.tsx",
      "apps/web/src/components/course/progress-bar.tsx",
      "apps/web/src/components/dashboard/mastery-panel.tsx",
      "apps/web/src/components/dashboard/current-courses-section.tsx:175",
    ],
    bespoke: [
      "prog-wrap",
      "prog-header",
      "prog-label",
      "prog-val",
      "prog-track",
      "prog-fill",
      "pf-primary",
      "pf-xp",
      "pf-success",
      "prog-thin-track",
      "prog-thin-fill",
      "cc-ring-wrap",
      "cc-ring",
      "cc-ring-track",
      "cc-ring-fill",
      "cc-ring-count",
      "cc-ring-done",
      "cc-ring-label",
    ],
    note: "<code>.prog-*</code> is the shared bar system (three fill variants × two thicknesses); the dashboard course ring is an SVG variant; the mastery bar deliberately opts out and paints the Solana gradient instead. Widths below are inline styles, exactly as the components set them.",
    html: `
      <div class="gx-stack">
        <div class="prog-wrap">
          <div class="prog-header"><span class="prog-label">Course progress</span><span class="prog-val">72%</span></div>
          <div class="prog-track"><div class="prog-fill pf-primary" style="width:72%"></div></div>
        </div>
        <div class="prog-track"><div class="prog-fill pf-xp" style="width:48%"></div></div>
        <div class="prog-track"><div class="prog-fill pf-success" style="width:96%"></div></div>
        <div class="prog-thin-track"><div class="prog-thin-fill pf-primary" style="width:48%"></div></div>
        <div class="flex items-center gap-3">
          <div class="prog-track w-full" role="progressbar" aria-valuenow="72" aria-valuemin="0" aria-valuemax="100"><div class="prog-fill pf-primary" style="width:72%"></div></div>
          <span class="text-sm font-medium tabular-nums text-text-3">72%</span>
        </div>
        <div class="gx-caption">Mastery bar — mastery-panel.tsx (Solana gradient, not .prog-fill)</div>
        <div class="flex items-baseline justify-between gap-2">
          <span class="text-sm font-semibold">Anchor accounts</span>
          <span class="text-xs tabular-nums text-text-3">4 / 9 lessons</span>
        </div>
        <div class="bg-surface-3 h-2 overflow-hidden rounded-full" role="progressbar" aria-valuenow="44" aria-valuemin="0" aria-valuemax="100">
          <div class="h-full rounded-full bg-gradient-to-r from-solana-purple to-solana-green transition-[width]" style="width:44%"></div>
        </div>
        <div class="gx-caption">Course ring — current-courses-section.tsx</div>
        <span class="cc-progress" role="img" aria-label="4 of 12 lessons">
          <span class="cc-ring-wrap">
            <svg class="cc-ring" viewBox="0 0 36 36"><circle class="cc-ring-track" cx="18" cy="18" r="16"></circle><circle class="cc-ring-fill" cx="18" cy="18" r="16" stroke-dasharray="100.5" stroke-dashoffset="67" transform="rotate(-90 18 18)"></circle></svg>
            <span class="cc-ring-count"><span class="cc-ring-done">4</span>/12</span>
          </span>
          <span class="cc-ring-label">Lessons</span>
        </span>
      </div>`,
  },

  {
    id: "code-surface",
    title: "Code surface chrome",
    sources: [
      "apps/web/src/components/editor/challenge-interface.tsx:537",
      "apps/web/src/components/editor/challenge-runner.tsx:871",
      "apps/web/src/components/editor/output-panel.tsx",
      "apps/web/src/components/editor/code-editor.tsx:275",
    ],
    note: "The editor toolbar, the output/tests/examples tab strip, and the pass/fail test rows. Test rows tint with <code>[background:var(--success-bg)]</code> / <code>[background:var(--danger-light)]</code> and matching <code>[border-color:…]</code> arbitrary values rather than named tokens — one of the few places the pipeline is bypassed by necessity (there is no <code>bg-success-bg</code>+<code>border-success-border</code> pair in the config).",
    html: `
      <div class="flex h-full flex-col overflow-hidden rounded-md border bg-card">
        <div class="shrink-0 border-b border-border bg-card px-3 py-2.5">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              ${btn("primary", "▶ Run code", "sm", "gap-1.5")}
              ${btn("primary", 'Submit solution <span class="ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold [background:rgba(255,255,255,0.20)]">+100 XP</span>', "sm", "gap-1.5")}
            </div>
            <div class="flex items-center gap-1">
              ${btn("ghost", "View solution", "sm", "gap-1 text-xs")}
              ${btn("ghost", "Reset code", "sm", "gap-1 text-xs")}
            </div>
          </div>
        </div>
        <div class="flex items-center justify-between border-b border-border px-3 py-1">
          <div class="inline-flex h-10 items-center justify-center rounded-md bg-subtle p-1 text-text-3 h-8 bg-transparent p-0">
            <span class="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-bg transition-all data-[state=active]:bg-card data-[state=active]:text-text data-[state=active]:shadow-sm h-7 rounded-sm px-2 text-xs data-[state=active]:[background:var(--input)]" data-state="active">Output</span>
            <span class="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-bg transition-all data-[state=active]:bg-card data-[state=active]:text-text data-[state=active]:shadow-sm h-7 rounded-sm px-2 text-xs data-[state=active]:[background:var(--input)]" data-state="inactive">Test cases<span class="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-success [background:var(--success-light)]">3/3</span></span>
            <span class="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-bg transition-all data-[state=active]:bg-card data-[state=active]:text-text data-[state=active]:shadow-sm h-7 rounded-sm px-2 text-xs data-[state=active]:[background:var(--input)]" data-state="inactive">Examples<span class="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-danger [background:var(--danger-light)]">1/3</span></span>
          </div>
          ${btn("ghost", "Clear", "sm", "h-6 px-2 text-xs")}
        </div>
        <div class="m-0 flex-1 overflow-auto p-3">
          <pre class="whitespace-pre-wrap break-words font-mono text-xs text-text">Hello, world!</pre>
          <div class="flex items-start gap-2 rounded-md border p-3 [background:var(--danger-light)] [border-color:var(--danger-border)] gx-mt">
            <span class="mt-0.5 shrink-0 text-danger">⚠</span>
            <pre class="whitespace-pre-wrap break-words font-mono text-xs text-danger">TypeError: x is not a function</pre>
          </div>
          <div class="mb-3 flex items-center gap-2 rounded-md border p-3 [background:var(--success-bg)] [border-color:var(--success-border)] gx-mt">
            <span class="text-success">✓</span><span class="text-sm font-semibold text-success">All tests passed</span>
          </div>
          <div class="rounded-md border [background:var(--success-bg)] [border-color:var(--success-border)]">
            <div class="flex w-full items-center gap-2 rounded-md p-3 text-left">
              <span class="shrink-0 text-success">✓</span>
              <span class="min-w-0 flex-1 truncate text-sm font-medium">sum(2, 3) returns 5</span>
              <span class="shrink-0 text-xs font-semibold text-success">Passed</span>
              <span class="shrink-0 text-text-3 transition-transform">⌄</span>
            </div>
          </div>
          <div class="rounded-md border [background:var(--danger-light)] [border-color:var(--danger-border)] gx-mt">
            <div class="flex w-full items-center gap-2 rounded-md p-3 text-left">
              <span class="shrink-0 text-danger">✕</span>
              <span class="min-w-0 flex-1 truncate text-sm font-medium">sum(-1, 1) returns 0</span>
              <span class="shrink-0 text-xs font-semibold text-danger">Failed</span>
              <span class="shrink-0 text-text-3 transition-transform rotate-180">⌄</span>
            </div>
            <div class="mx-3 mb-3 ml-9 rounded-md border p-3 [background:var(--danger-light)] [border-color:var(--danger-border)]">
              <div class="mb-1 text-xs font-semibold text-danger">Why this failed</div>
              <p class="text-xs leading-relaxed text-text">Check the loop bound.</p>
            </div>
            <div class="grid gap-3 px-3 pb-3 pl-9 text-xs sm:grid-cols-2">
              <div class="min-w-0 space-y-1">
                <div class="font-medium text-text-3">Test code</div>
                <div class="flex min-w-0 gap-2"><span class="shrink-0 font-medium text-text-3">Input:</span><code class="min-w-0 whitespace-pre-wrap break-words rounded bg-subtle px-1.5 py-0.5 font-mono">sum(-1, 1)</code></div>
                <div class="flex min-w-0 gap-2"><span class="shrink-0 font-medium text-text-3">Expected:</span><code class="min-w-0 whitespace-pre-wrap break-words rounded bg-subtle px-1.5 py-0.5 font-mono text-success">0</code></div>
              </div>
              <div class="min-w-0 space-y-1">
                <div class="font-medium text-text-3">Message</div>
                <pre class="max-h-40 min-w-0 overflow-auto whitespace-pre-wrap break-words rounded bg-subtle px-1.5 py-0.5 font-mono text-danger">expected 0, received -2</pre>
              </div>
            </div>
          </div>
        </div>
        <p class="min-h-7 shrink-0 border-t border-border bg-card px-3 py-1.5 text-xs text-text-3 transition-opacity motion-reduce:transition-none opacity-100">Press Ctrl+Shift+M to move focus out of the editor</p>
      </div>
      <div class="gx-caption">Pane resizer — challenge-interface.tsx:520</div>
      <div class="group w-1.5 shrink-0 cursor-col-resize border-x border-border transition-colors [background:var(--resizer-bg)] hover:[background:var(--primary-dim)]" style="height:40px"></div>`,
  },

  {
    id: "empty-states",
    title: "Empty states",
    sources: [
      "apps/web/src/app/[locale]/(platform)/courses/courses-client.tsx:312",
      "apps/web/src/components/course/paths-view.tsx:85",
      "apps/web/src/components/dashboard/current-courses-section.tsx:239",
      "apps/web/src/components/review/review-session.tsx:78",
    ],
    bespoke: ["cc-empty"],
    note: "The <code>py-16 text-center</code> + 64px rounded icon tile is the de-facto pattern; the dashboard uses the bespoke <code>.cc-empty</code> card instead, and the review session uses a bordered card with a CTA. Icons are Phosphor duotone at 32–48px, drawn as glyphs here.",
    html: `
      <div class="gx-stack">
        <div class="py-16 text-center">
          <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-subtle"><span class="text-text-3">🔍</span></div>
          <p class="text-text-3">No courses match your search.</p>
        </div>
        <div class="py-16 text-center">
          <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-subtle"><span class="text-text-3">📖</span></div>
          <p class="font-semibold">No learning paths yet</p>
          <p class="mt-1 text-sm text-text-3">Paths appear once courses are published.</p>
        </div>
        <div class="cc-empty">
          <span class="text-text-3" aria-hidden="true">📖</span>
          <p class="text-text-3">You are not enrolled in any course yet.</p>
          <a class="mt-2 inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:[background:var(--primary-hover)]">Browse courses</a>
        </div>
        <div class="flex flex-col items-center justify-center gap-4 rounded-[var(--r-lg)] border border-border bg-card px-6 py-16 text-center">
          <span class="flex h-12 w-12 items-center justify-center rounded-full text-success bg-success/10">✓</span>
          <div>
            <h2 class="font-display text-lg font-black">Nothing to review</h2>
            <p class="mt-1 text-sm text-text-3">Come back tomorrow — your next review is scheduled.</p>
          </div>
          <a class="inline-flex items-center gap-1.5 font-display text-sm font-extrabold text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Browse courses →</a>
        </div>
      </div>`,
  },
];

/**
 * Class strings that appear in the app but compile to NOTHING under
 * apps/web/tailwind.config.ts. The generator re-verifies this every build: if
 * one of them starts producing CSS (because the config gained the token), the
 * build fails so this table gets corrected instead of quietly lying.
 */
export const DEAD_CLASSES = [
  {
    cls: "bg-primary-dim",
    where: "apps/web/src/components/dashboard/cohort-strip.tsx:59",
    why: "the <code>primary</code> palette has no <code>dim</code> key — only <code>--primary-dim</code> the CSS variable. Other files write <code>[background:var(--primary-dim)]</code>.",
  },
  {
    cls: "bg-surface-3",
    where: "apps/web/src/components/dashboard/mastery-panel.tsx:52",
    why: "there is no <code>surface</code> colour in the Tailwind config at all, so the mastery bar has no track background.",
  },
  {
    cls: "bg-success/10",
    where: "apps/web/src/components/review/review-session.tsx:81",
    why: "opacity modifiers need an <code>&lt;alpha-value&gt;</code> placeholder; every colour here is a bare <code>var(--x)</code>, so <code>/10</code>, <code>/40</code>, <code>/5</code> and <code>/60</code> all drop out.",
  },
  {
    cls: "border-success/40",
    where: "apps/web/src/components/review/review-session.tsx:96",
    why: "same alpha-modifier limitation.",
  },
  {
    cls: "hover:bg-subtle/60",
    where: "apps/web/src/components/landing/paths-explorer.tsx:112",
    why: "same alpha-modifier limitation — the idle path tab has no hover background.",
  },
];

/** Bespoke classes referenced from TSX that have no rule in globals.css. */
export const MISSING_RULES = [
  {
    cls: "lb-header",
    where:
      "apps/web/src/app/[locale]/(platform)/leaderboard/leaderboard-client.tsx:386",
  },
  {
    cls: "sidebar-prog",
    where: "apps/web/src/components/layout/sidebar.tsx:248",
  },
];
