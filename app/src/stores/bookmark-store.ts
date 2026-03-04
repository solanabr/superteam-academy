import { create } from "zustand";
import { persist } from "zustand/middleware";

interface BookmarkState {
  bookmarkedCourses: string[];
  toggleBookmark: (slug: string) => void;
  isBookmarked: (slug: string) => boolean;
}

export const useBookmarkStore = create<BookmarkState>()(
  persist(
    (set, get) => ({
      bookmarkedCourses: [],
      toggleBookmark: (slug: string) =>
        set((state) => ({
          bookmarkedCourses: state.bookmarkedCourses.includes(slug)
            ? state.bookmarkedCourses.filter((s) => s !== slug)
            : [...state.bookmarkedCourses, slug],
        })),
      isBookmarked: (slug: string) => get().bookmarkedCourses.includes(slug),
    }),
    { name: "superteam-bookmarks" }
  )
);
