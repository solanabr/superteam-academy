---
name: ux-principles
description: Enforces 18 battle-tested UX principles when building any interface, app, component, or product UI. Use this skill whenever building web apps, dashboards, SaaS products, admin panels, onboarding flows, forms, navigation systems, design systems, or any interactive UI — even if the user doesn't explicitly mention UX. Trigger whenever the user asks to build, design, or improve an interface. These are non-negotiable constraints that get applied before writing a single line of code.
---

# UX Principles Skill

When building any interface, treat these 18 principles as **hard constraints**, not suggestions. Check every output against this list before delivering. If a principle is violated, fix it.

---

## The 18 Principles

### 1. Every interaction must resolve in ≤100ms

Perceived-instant feedback is non-negotiable. If data loads async, show a **skeleton** immediately — never a blank state or spinner blocking interaction. Debounce inputs, optimistically update UI, and defer non-critical work.

```js
// Optimistic update pattern
setItems(prev => [...prev, newItem]); // update UI first
await api.save(newItem);              // persist after
```

No skeleton = broken. No optimistic update where appropriate = broken.

---

### 2. No product tours

Never build: intro modals, coach marks, tooltip sequences, "welcome" overlays, step-by-step walkthroughs, or feature spotlights. The interface must explain itself through good design. If something needs a tour, redesign it.

Allowed: a single persistent empty state with one clear CTA. That's it.

---

### 3. URLs use short slug — never UIDs

```
✅ /projects/annual-report
✅ /settings/billing
❌ /projects/a3f9b2c1-4d5e-6f7a-8b9c
❌ /u/8472910
```

Routes must be human-readable and memorable. Use slugs derived from content names. If collision is a concern, append a short 4-char disambiguator max: `/projects/annual-report-3a9f`.

---

### 4. Persistent, resumable state

Users must never lose work. Implement auto-save to localStorage or backend on every meaningful change. On return, restore last state silently — no "do you want to resume?" prompt, just resume. Show a subtle "saved" indicator, never a blocking save dialog.

```js
// Auto-save pattern
useEffect(() => {
  const timer = setTimeout(() => {
    localStorage.setItem('draft', JSON.stringify(state));
  }, 500);
  return () => clearTimeout(timer);
}, [state]);
```

---

### 5. Maximum 3 colors

A strict palette of: 1 neutral (background/text), 1 primary action color, 1 accent or semantic color (for errors/success). No rainbow dashboards, no gradient soup.

```css
:root {
  --color-base: #0f0f0f;      /* neutral */
  --color-primary: #2563eb;   /* actions */
  --color-accent: #16a34a;    /* success/state */
}
```

Every new color added requires removing one. Enforce this at the variable level.

---

### 6. No visible scrollbars

Hide scrollbars while keeping content scrollable. Always.

```css
.scrollable {
  overflow-y: auto;
  scrollbar-width: none;       /* Firefox */
  -ms-overflow-style: none;    /* IE/Edge */
}
.scrollable::-webkit-scrollbar {
  display: none;               /* Chrome/Safari */
}
```

---

### 7. All navigation is ≤3 steps from anywhere

From any screen, users reach any destination in 3 clicks/taps max. Enforce this in architecture. If a page requires more than 3 navigations to reach, it needs to be surfaced differently (search, pinning, recents).

Test: can a user reach the deepest screen in 3 steps from home? If not, flatten the hierarchy.

---

### 8. Copyable SVG logo + brand kit

When building any product UI, provide the SVG logo as an inline copyable element. Brand kit = logo SVG + 3 color hex values + 1 font name. No PNGs in UI code. SVGs only.

```jsx
// Always provide copy button on logo
<button onClick={() => navigator.clipboard.writeText(logoSVGString)}>
  Copy SVG
</button>
```

---

### 9. Skeleton loading states

Every data-dependent surface gets a skeleton, not a spinner. Skeletons must:
- Match the approximate shape of real content
- Use a shimmer animation
- Appear in <16ms (synchronous render)
- Be replaced by real content without layout shift

```css
.skeleton {
  background: linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
@keyframes shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }
```

---

### 10. Copy-paste from clipboard

Every text field, code block, and sharable value must be copyable with one click. Use `navigator.clipboard.writeText()`. Show inline confirmation (checkmark icon for 1.5s) — never a toast or modal.

```jsx
const [copied, setCopied] = useState(false);
const copy = async (text) => {
  await navigator.clipboard.writeText(text);
  setCopied(true);
  setTimeout(() => setCopied(false), 1500);
};
```

---

### 11. Large hit targets

Minimum touch target: **44×44px** (Apple HIG) / **48×48dp** (Material). This applies to:
- All buttons
- All form inputs (min height 44px)
- All checkboxes and radios (pad to 44px)
- All navigation items
- All icon-only controls (wrap in 44px container)

```css
button, input, select, textarea, [role="button"] {
  min-height: 44px;
  min-width: 44px;
}
```

---

### 12. Honest one-click cancel

Every subscription, plan, trial, or paid feature must have a cancel/downgrade path that is:
- Reachable in ≤2 clicks
- Labeled honestly: "Cancel plan" not "Manage subscription"
- No dark patterns: no fake-difficulty flows, no guilt screens ("Are you sure you want to lose all your data?"), no hidden buttons

Cancel must be as prominent as Subscribe.

---

### 13. Cmd+K command palette

Any app with more than 5 distinct actions or destinations must implement a command palette triggered by `Cmd+K` (Mac) / `Ctrl+K` (Win/Linux). The palette:
- Opens in <50ms
- Searches all actions, pages, and recent items
- Supports keyboard navigation (↑↓ arrows, Enter, Esc)
- Shows keyboard shortcuts inline

```js
useEffect(() => {
  const handler = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setCommandPaletteOpen(true);
    }
  };
  window.addEventListener('keydown', handler);
  return () => window.removeEventListener('keydown', handler);
}, []);
```

---

### 14. Minimal tooltips

Tooltips are only allowed for **icon-only controls with no visible label**. Rules:
- Max 5 words
- Appear after 600ms hover delay (not instant)
- Never on elements that already have a visible label
- Never on mobile (use labels instead)
- Never as the only way to discover a feature

```css
[data-tooltip]:hover::after {
  content: attr(data-tooltip);
  /* ... */
  transition-delay: 600ms;
}
```

---

### 15. Active voice copy, ≤7 words per sentence

All UI text — labels, empty states, errors, CTAs, confirmations — follows these rules:

```
✅ "Save your changes"          (imperative, active)
✅ "File uploaded."             (past tense, active)
✅ "Delete this project?"       (direct question)
❌ "Your changes have been saved successfully."  (passive, wordy)
❌ "Are you sure you would like to proceed with deleting?" (passive, long)
❌ "Loading your content..."    (gerund, vague)
```

Count the words. If >7, cut. If passive, flip it.

---

### 16. Optical alignment over geometric alignment

Elements should *look* centered/aligned, not just mathematically be so. Apply corrections:

- Icon inside a button: nudge icon 1px right (optical center ≠ mathematical center)
- Text next to an icon: align to cap height, not bounding box
- Headings with descenders: add 1–2px extra top padding
- Circular avatars next to text: align circle center to cap-height midpoint
- All-caps labels: add `letter-spacing: 0.05em`

Validate visually, not just with DevTools rulers.

---

### 17. Optimized for left-to-right reading

Information hierarchy follows F-pattern and Z-pattern reading:
- Primary actions: top-right or bottom-right
- Destructive actions: always bottom-left, never right of primary CTA
- Labels: left-aligned above their inputs (not inline, not right-aligned)
- Tables: left-align text columns, right-align number columns
- Modals: title top-left, dismiss top-right, primary CTA bottom-right
- Error messages: immediately below the offending field, left-aligned

---

### 18. Reassurance about data loss

Whenever a user might lose work, reassure them proactively — don't wait for them to ask. Rules:

- Auto-save: show "Saved" timestamp in a subtle corner position
- Destructive actions: one clear sentence about what is and isn't deleted ("Your files are not deleted. Only the project is removed.")
- Before navigation away from unsaved changes: `beforeunload` browser prompt OR in-app modal with explicit "Save first" button
- After deletion: show undo option for ≥5 seconds ("Undo" toast)
- Form abandonment: if >2 fields filled, persist draft silently

```js
window.addEventListener('beforeunload', (e) => {
  if (hasUnsavedChanges) e.preventDefault();
});
```

Never let users wonder "did that save?" or "what did I just delete?"

---

## Pre-flight Checklist

Before delivering any interface, verify:

- [ ] Interactions feel instant (skeleton or optimistic update in place)
- [ ] No tours, walkthroughs, or onboarding overlays
- [ ] All URLs are slug-based, human-readable
- [ ] State persists and resumes automatically
- [ ] Palette is exactly 3 colors (check `:root` variables)
- [ ] Scrollbars are hidden on all scroll containers
- [ ] Deepest page is reachable in ≤3 navigation steps
- [ ] SVG logo is present and copyable (if branding is in scope)
- [ ] Every async surface has a skeleton (not a spinner)
- [ ] Every copyable value has a one-click copy with icon feedback
- [ ] All interactive elements are ≥44px hit target
- [ ] Cancel/destructive paths are honest and ≤2 clicks
- [ ] Cmd+K implemented if app has >5 actions
- [ ] Tooltips only on unlabeled icon controls, max 5 words
- [ ] All copy is active voice, ≤7 words per sentence
- [ ] Optical alignment applied to icons, type, and avatars
- [ ] Layout follows LTR reading order (primary CTA bottom-right)
- [ ] Auto-save timestamp visible; undo available after destructive actions

If any box is unchecked, fix it before delivery.