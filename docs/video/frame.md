<!-- HyperFrames design spec ("frame.md"): the platform's design system inverted for the
     camera. Copy this file into the root of a HyperFrames project (or point the
     /hyperframes-creative skill at it) and every scene is composed from these tokens.
     Regenerate the token block from apps/web/src/styles/globals.css when the app changes;
     the code is the source of truth, this file is the video-facing view of it. -->

---

version: 1
name: Superteam Academy (video frame layer)
description: >
Not a brand-pack system: this is the PRODUCT's own design system, lifted by value from
apps/web. Light theme, paper-white ground, ink-outlined white plates with hard offset
shadows, one amber emphasis bar, deep-green primary. Nothing here was invented that the
platform does not already ship.
unit: the frame - 1920×1080
source-of-truth: apps/web (globals.css, src/fonts, landing/hero-showcase.tsx, gamification/achievement-patch-3d.tsx)

tokens: # apps/web/src/styles/globals.css, `:root` (light theme)
bg: "#fafaf7"
card: "#ffffff"
card-alt: "rgba(0,0,0,.02)"
text: "#1c1917"
text-2: "#57534e"
text-3: "#a8a29e"
primary: "#0a7055"
primary-hover: "#08604a"
accent: "#f59e0b"
ink-line: "#19231b"
xpbar-fill: "#2ecc8e"
lv-band-learner: "#fde68a"
sol-grad: "linear-gradient(135deg,#9945ff,#00c2ff 50%,#14f195)"

typography: # apps/web/src/fonts/\*.woff2, inlined base64
display: { family: Nunito, weight: 800-900 } # headings
body: { family: Plus Jakarta Sans, weight: 400-800 }
mono: { family: JetBrains Mono, weight: 500-800 } # micro-labels, terminal chips

constructions:
plate: "background --card · 2px solid --ink-line · 0 3px 0 0 --ink-line" # .btn-ink
press: "translateY(2px) on land" # .btn-ink:active
chip-alt: "the plate with a --card-alt fill"
chip-primary: "--primary fill, white label, --primary-hover outline + hard shadow"
micro-label: "JetBrains Mono, uppercase, 0.22em tracking, --text-2"
underline: "one --accent bar under a headline - the ONLY emphasis mark; never a coloured word"
level-badge: "two clipped hexagons + drop-shadow filter" # level-badge.tsx
xp-bar: "4px ink border, --xpbar-track ground, mint fill" # .dash-xp-track
ground: "--bg + the .grid-bg fractal-noise tile + the hero's code rain at watermark contrast"

3d:
scene: "perspective 1000px on a stable parent, transform-style: preserve-3d on the body"
footage-card: "the hero card idle: rotateX 2°→-1.5°, rotateY -4°→4°, 9s ease-in-out, 1.6s delay, infinite - .hero-card-idle (globals.css); a video may widen the range for legibility, but the product's own values are these"
builder-id: "both faces authored, back pre-rotated 180°, one 0→360 pose ladder" # achievement-patch-3d.tsx

---

# Superteam Academy - Platform frame

Read the source files, not this file, when they disagree. `hero-showcase.tsx` owns the
Builder ID card, the loot chips and the code rain; `achievement-patch-3d.tsx` owns the
two-faced 3D construction; `globals.css` owns every token, `.btn-ink`, `.lv-badge`,
`.dash-xp-track` and `.grid-bg`; `layout.tsx` + `src/fonts/` own the three faces.

## Rules

- **Ground** - `#fafaf7` everywhere. No blobs. No brand-pack cream. No pure black; ink is `#1c1917`.
- **Depth is real** - CSS `perspective` + `preserve-3d`, never a scale fake. Every card
  carries the ink system's hard `0 3px 0 0` offset, which is the platform's own flat depth.
- **Emphasis** - the amber bar, once. Never a coloured headline word.
- **Type** - display Nunito 900; body/labels Plus Jakarta Sans; micro-labels and terminal
  chips JetBrains Mono, uppercase, wide-tracked.
- **No text over any shape or card edge** - the frame is audited by `hyperframes check`
  and every remaining collision is an explicit, justified opt-out.
- **Ragged left, off-grid** - the right rail carries the words; nothing is centred.
- **Micro-labels run at `--text-2`, not `--text-3`.** The platform's own `--text-3` on
  white is 2.5:1 and fails the render gate's WCAG AA check at video scale.
