/**
 * The tab is on its way out because of an auth change it made itself, such as
 * the user menu's sign-out, which navigates away once it's done.
 *
 * A lesson page reloads when the signed-in learner changes under it, which is
 * how a sign-out or sign-in in another tab reaches it. The tab that signs out
 * hears the same change, and a reload there would cancel its own navigation.
 * So that code marks the tab first, and the lesson page leaves a marked tab
 * alone.
 *
 * The mark lasts for the page. A page restored from the back/forward cache
 * starts unmarked, since the navigation it was making has already happened.
 */
let leaving = false;

if (typeof window !== "undefined") {
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) leaving = false;
  });
}

export function markTabLeaving(): void {
  leaving = true;
}

export function isTabLeaving(): boolean {
  return leaving;
}
