# Celebration Popups Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add clickable celebration popups for achievement unlocks (→ profile#achievements) and certificate mints (→ /certificates/:id) using the Solarium design system `popup` pattern.

**Architecture:** Two new event-driven components (`AchievementPopup`, `CertificatePopup`) are mounted inside a shared fixed container in `GamificationOverlays`. They listen for `window.dispatchEvent` events fired from `lesson-client.tsx` after the `/api/lessons/complete` response. The API route is updated to return the new certificate's Supabase UUID so the popup can navigate to the correct page.

**Tech Stack:** Next.js 14 App Router, React, Tailwind CSS, TypeScript strict mode, `canvas-confetti` (already installed), `@phosphor-icons/react` (already installed).

---

### Task 1: API route — return `certificateId` on mint

**Files:**

- Modify: `apps/web/src/app/api/lessons/complete/route.ts:139` (add variable)
- Modify: `apps/web/src/app/api/lessons/complete/route.ts:292-303` (change insert)
- Modify: `apps/web/src/app/api/lessons/complete/route.ts:499-524` (add to response)

This is a pure server-side data change, no UI involved. There are no automated tests for this route — verify by TypeScript compilation passing.

**Step 1: Declare `newCertificateId` variable alongside `credentialMinted`**

Find line ~139 in `route.ts` (the `let credentialMinted = false;` line) and add one line after it:

```ts
let credentialMinted = false;
let newCertificateId: string | undefined;
```

**Step 2: Change the certificate insert to capture the new row ID**

Find the `.from("certificates").insert({...})` block (lines ~292-303). The current code is:

```ts
const { error: certInsertError } = await supabaseAdmin
  .from("certificates")
  .insert({
    user_id: user.id,
    course_id: courseId,
    course_title: courseName,
    mint_address: mintAddress.toBase58(),
    metadata_uri: metadataUri,
    minted_at: new Date().toISOString(),
    tx_signature: credSig,
    credential_type: "core",
  });

if (certInsertError) {
  logError({
    errorId: ERROR_IDS.CREDENTIAL_ISSUE_FAILED,
    error: new Error(certInsertError.message),
    context: {
      route: "/api/lessons/complete",
      note: "On-chain credential minted but Supabase insert failed",
      mintAddress: mintAddress.toBase58(),
      signature: credSig,
    },
  });
} else {
  credentialMinted = true;
}
```

Replace with:

```ts
const { data: certRow, error: certInsertError } = await supabaseAdmin
  .from("certificates")
  .insert({
    user_id: user.id,
    course_id: courseId,
    course_title: courseName,
    mint_address: mintAddress.toBase58(),
    metadata_uri: metadataUri,
    minted_at: new Date().toISOString(),
    tx_signature: credSig,
    credential_type: "core",
  })
  .select("id")
  .single();

if (certInsertError) {
  logError({
    errorId: ERROR_IDS.CREDENTIAL_ISSUE_FAILED,
    error: new Error(certInsertError.message),
    context: {
      route: "/api/lessons/complete",
      note: "On-chain credential minted but Supabase insert failed",
      mintAddress: mintAddress.toBase58(),
      signature: credSig,
    },
  });
} else {
  credentialMinted = true;
  newCertificateId = certRow.id as string;
}
```

**Step 3: Add `certificateId` to the JSON response**

Find the `return NextResponse.json({...})` at the bottom of the route (lines ~499-524). Add `certificateId` after `credentialMinted`:

```ts
return NextResponse.json({
  success: true,
  alreadyCompleted: false,
  xpEarned: xpReward,
  signature: onChainSignature,
  finalized,
  finalizationSignature: finalizeSig,
  credentialMinted,
  certificateId: newCertificateId, // ← ADD THIS LINE
  newAchievements: successfullyUnlocked.map((a) => ({
    id: a.id,
    name: a.name,
    description: a.description,
    icon: a.icon,
  })),
  failedAchievements:
    achievementErrors.length > 0
      ? achievementErrors.map((e) => e.id)
      : undefined,
  streakData: xpData
    ? {
        currentStreak: xpData.current_streak,
        longestStreak: xpData.longest_streak,
        lastActivityDate: xpData.last_activity_date,
      }
    : null,
});
```

**Step 4: Verify TypeScript compiles**

```bash
cd apps/web && pnpm tsc --noEmit 2>&1 | head -30
```

Expected: no errors (or only pre-existing unrelated errors).

**Step 5: Commit**

```bash
git add apps/web/src/app/api/lessons/complete/route.ts
git commit -m "feat: return certificateId in lesson complete response"
```

---

### Task 2: Create `achievement-popup.tsx`

**Files:**

- Create: `apps/web/src/components/gamification/achievement-popup.tsx`

**Context:** Follow the exact same pattern as `xp-popup.tsx` in the same directory. Key differences:

- Events carry `{ id, name, eventId }` instead of `{ amount, id }`
- Uses `animate-pop` (not `animate-xp-pop`) — this keyframe is already in `tailwind.config.ts`
- Pills are `pointer-events-auto` + `cursor-pointer` (unlike XP popup which is `pointer-events-none`)
- Uses `useRouter` + `useParams` from `next/navigation` for locale-aware navigation
- Clicks navigate to `/{locale}/profile#achievements` and immediately dismiss

**Step 1: Create the file**

```tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { cn } from "@/lib/utils";

interface AchievementEvent {
  id: string;
  name: string;
  eventId: number;
}

let eventCounter = 0;

export function dispatchAchievementUnlock(id: string, name: string): void {
  if (typeof window === "undefined") return;
  eventCounter++;
  window.dispatchEvent(
    new CustomEvent("superteam:achievement-unlock", {
      detail: { id, name, eventId: eventCounter },
    })
  );
}

export function AchievementPopup({ className }: { className?: string }) {
  const [events, setEvents] = useState<AchievementEvent[]>([]);
  const router = useRouter();
  const params = useParams();
  const locale = typeof params?.locale === "string" ? params.locale : "en";

  const handleUnlock = useCallback((e: Event) => {
    const detail = (e as CustomEvent<AchievementEvent>).detail;
    setEvents((prev) => [...prev, detail]);
    setTimeout(() => {
      setEvents((prev) => prev.filter((ev) => ev.eventId !== detail.eventId));
    }, 4000);
  }, []);

  useEffect(() => {
    window.addEventListener("superteam:achievement-unlock", handleUnlock);
    return () =>
      window.removeEventListener("superteam:achievement-unlock", handleUnlock);
  }, [handleUnlock]);

  if (events.length === 0) return null;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {events.map((ev) => (
        <button
          key={ev.eventId}
          onClick={() => {
            setEvents((prev) => prev.filter((e) => e.eventId !== ev.eventId));
            router.push(`/${locale}/profile#achievements`);
          }}
          className="animate-pop bg-primary font-display shadow-push inline-flex items-center gap-1.5 rounded-full px-6 py-3 text-[17px] font-black text-white transition-transform hover:scale-105 dark:shadow-[0_4px_0_0_rgba(0,0,0,0.4)]"
          aria-label={`Achievement unlocked: ${ev.name}. Click to view your achievements.`}
        >
          🏆 {ev.name}
        </button>
      ))}
    </div>
  );
}
```

**Step 2: Verify TypeScript compiles**

```bash
cd apps/web && pnpm tsc --noEmit 2>&1 | head -30
```

Expected: no new errors.

**Step 3: Commit**

```bash
git add apps/web/src/components/gamification/achievement-popup.tsx
git commit -m "feat: add AchievementPopup component with click-to-profile navigation"
```

---

### Task 3: Create `certificate-popup.tsx`

**Files:**

- Create: `apps/web/src/components/gamification/certificate-popup.tsx`

**Context:** Same pattern as `achievement-popup.tsx` but for certificate mints. Uses the `bg-success` (green) variant from the design system. Navigates to `/{locale}/certificates/{certificateId}`. There's only ever one certificate per lesson completion, so state is a single event (not an array).

**Step 1: Create the file**

```tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { cn } from "@/lib/utils";

interface CertificateEvent {
  certificateId: string;
  eventId: number;
}

let eventCounter = 0;

export function dispatchCertificateMinted(certificateId: string): void {
  if (typeof window === "undefined") return;
  eventCounter++;
  window.dispatchEvent(
    new CustomEvent("superteam:certificate-minted", {
      detail: { certificateId, eventId: eventCounter },
    })
  );
}

export function CertificatePopup({ className }: { className?: string }) {
  const [event, setEvent] = useState<CertificateEvent | null>(null);
  const router = useRouter();
  const params = useParams();
  const locale = typeof params?.locale === "string" ? params.locale : "en";

  const handleMinted = useCallback((e: Event) => {
    const detail = (e as CustomEvent<CertificateEvent>).detail;
    setEvent(detail);
    setTimeout(() => {
      setEvent(null);
    }, 5000);
  }, []);

  useEffect(() => {
    window.addEventListener("superteam:certificate-minted", handleMinted);
    return () =>
      window.removeEventListener("superteam:certificate-minted", handleMinted);
  }, [handleMinted]);

  if (!event) return null;

  return (
    <button
      onClick={() => {
        const id = event.certificateId;
        setEvent(null);
        router.push(`/${locale}/certificates/${id}`);
      }}
      className={cn(
        "animate-pop bg-success font-display shadow-push inline-flex items-center gap-1.5 rounded-full px-6 py-3 text-[17px] font-black text-white transition-transform hover:scale-105 dark:shadow-[0_4px_0_0_rgba(0,0,0,0.4)]",
        className
      )}
      aria-label="Certificate earned! Click to view your certificate."
    >
      🎓 Certificate Earned!
    </button>
  );
}
```

**Step 2: Verify TypeScript compiles**

```bash
cd apps/web && pnpm tsc --noEmit 2>&1 | head -30
```

Expected: no new errors.

**Step 3: Commit**

```bash
git add apps/web/src/components/gamification/certificate-popup.tsx
git commit -m "feat: add CertificatePopup component with click-to-certificate navigation"
```

---

### Task 4: Mount popups in `GamificationOverlays`

**Files:**

- Modify: `apps/web/src/components/gamification/gamification-overlays.tsx`

**Context:** The file currently renders `<XpPopup />` and `<LevelUpOverlay />`. Add a shared `fixed` container at `bottom-28 left-6 z-50` (above XpPopup's `bottom-20`) for the two new popups. `CertificatePopup` goes first (top of stack), `AchievementPopup` goes below it. Neither new component has its own fixed positioning — the container here provides it.

The `aria-live` on the container handles screen reader announcements for both popups. Remove the `aria-live` from the individual components since the container handles it.

**Step 1: Replace the entire file content**

```tsx
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { XpPopup } from "@/components/gamification/xp-popup";
import { LevelUpOverlay } from "@/components/gamification/level-up-overlay";
import { AchievementPopup } from "@/components/gamification/achievement-popup";
import { CertificatePopup } from "@/components/gamification/certificate-popup";

export function GamificationOverlays() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(({ data: { session } }) => {
      setShow(!!session?.user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setShow(!!session?.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!show) return null;

  return (
    <>
      <XpPopup />
      <div
        className="pointer-events-none fixed bottom-28 left-6 z-50 flex flex-col gap-2"
        aria-live="polite"
      >
        <CertificatePopup className="pointer-events-auto" />
        <AchievementPopup className="pointer-events-auto" />
      </div>
      <LevelUpOverlay />
    </>
  );
}
```

Note: The outer container is `pointer-events-none` so it doesn't block clicks on the page. Each interactive child overrides to `pointer-events-auto` via the `className` prop.

**Step 2: Verify TypeScript compiles**

```bash
cd apps/web && pnpm tsc --noEmit 2>&1 | head -30
```

Expected: no new errors.

**Step 3: Commit**

```bash
git add apps/web/src/components/gamification/gamification-overlays.tsx
git commit -m "feat: mount AchievementPopup and CertificatePopup in GamificationOverlays"
```

---

### Task 5: Wire dispatch calls in `lesson-client.tsx`

**Files:**

- Modify: `apps/web/src/app/[locale]/(platform)/courses/[slug]/lessons/[id]/lesson-client.tsx`

This is the final wiring step. Three changes:

1. Add `credentialMinted?: boolean` and `certificateId?: string` to the `CompletionResponse` interface
2. Import the two dispatch helpers
3. Call them in `handleComplete` after the API returns

**Step 1: Add to the `CompletionResponse` interface**

Find the interface (lines ~149-168):

```ts
interface CompletionResponse {
  success: boolean;
  alreadyCompleted: boolean;
  xpEarned: number;
  signature?: string;
  finalized?: boolean;
  finalizationSignature?: string | null;
  newAchievements: {
    id: string;
    name: string;
    description: string;
    icon: string;
  }[];
  failedAchievements?: string[];
  streakData: {
    currentStreak: number;
    longestStreak: number;
    lastActivityDate: string;
  } | null;
}
```

Add two fields after `finalizationSignature`:

```ts
interface CompletionResponse {
  success: boolean;
  alreadyCompleted: boolean;
  xpEarned: number;
  signature?: string;
  finalized?: boolean;
  finalizationSignature?: string | null;
  credentialMinted?: boolean;
  certificateId?: string;
  newAchievements: {
    id: string;
    name: string;
    description: string;
    icon: string;
  }[];
  failedAchievements?: string[];
  streakData: {
    currentStreak: number;
    longestStreak: number;
    lastActivityDate: string;
  } | null;
}
```

**Step 2: Add imports**

Find the existing import of `dispatchXpGain` (line ~22):

```ts
import { dispatchXpGain } from "@/components/gamification/xp-popup";
```

Add two lines after it:

```ts
import { dispatchXpGain } from "@/components/gamification/xp-popup";
import { dispatchAchievementUnlock } from "@/components/gamification/achievement-popup";
import { dispatchCertificateMinted } from "@/components/gamification/certificate-popup";
```

**Step 3: Add dispatch calls in `handleComplete`**

Find the `for (const achievement of result.newAchievements)` loop (lines ~348-353):

```ts
for (const achievement of result.newAchievements) {
  trackEvent("achievement_unlocked", {
    achievementId: achievement.id,
    achievementName: achievement.name,
  });
}
```

Replace with (adds `dispatchAchievementUnlock` call and the certificate dispatch below the loop):

```ts
for (const achievement of result.newAchievements) {
  trackEvent("achievement_unlocked", {
    achievementId: achievement.id,
    achievementName: achievement.name,
  });
  dispatchAchievementUnlock(achievement.id, achievement.name);
}

if (result.credentialMinted && result.certificateId) {
  dispatchCertificateMinted(result.certificateId);
}
```

**Step 4: Verify TypeScript compiles**

```bash
cd apps/web && pnpm tsc --noEmit 2>&1 | head -30
```

Expected: no new errors.

**Step 5: Build check**

```bash
cd apps/web && pnpm build 2>&1 | tail -20
```

Expected: build completes successfully (or same pre-existing errors as before).

**Step 6: Commit**

```bash
git add apps/web/src/app/[locale]/\(platform\)/courses/\[slug\]/lessons/\[id\]/lesson-client.tsx
git commit -m "feat: dispatch achievement and certificate celebration popups on lesson complete"
```

---

## Manual Verification Checklist

After all tasks are complete, verify visually in the dev server:

```bash
cd apps/web && pnpm dev
```

1. Complete a lesson that triggers a new achievement → pill `🏆 {name}` appears bottom-left, clicking navigates to `/profile#achievements`
2. Complete the final lesson of a course (with an NFT credential configured) → `🎓 Certificate Earned!` pill appears, clicking navigates to `/certificates/{id}`
3. Multiple achievements stacking → pills stack upward in a column
4. XP popup (`+N XP ⚡`) still works and floats upward from below the pills (it's at `bottom-20`, pills are at `bottom-28`)
5. Level-up overlay still works (fullscreen takeover, confetti)
6. Dark mode: pills have correct dark push shadow (`rgba(0,0,0,0.4)`)
7. Popups auto-dismiss (achievement 4s, certificate 5s)
