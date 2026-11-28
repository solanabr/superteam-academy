// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { isTabLeaving, markTabLeaving } from "../tab-leaving";

function pageshow(persisted: boolean) {
  window.dispatchEvent(Object.assign(new Event("pageshow"), { persisted }));
}

describe("tab leaving", () => {
  it("is set by the mark and cleared when the page comes back from the back/forward cache", () => {
    expect(isTabLeaving()).toBe(false);
    markTabLeaving();
    expect(isTabLeaving()).toBe(true);

    pageshow(false);
    expect(isTabLeaving()).toBe(true);
    pageshow(true);
    expect(isTabLeaving()).toBe(false);
  });
});
