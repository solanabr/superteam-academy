import { courses } from "./courses";
import { tracks } from "./tracks";
import type { Course, FilterParams, Track } from "./types";

export function getAllCourses(): Course[] {
  return courses;
}

export function getActiveCourses(): Course[] {
  return courses.filter((c) => c.isActive);
}

export function getCourseBySlug(slug: string): Course | undefined {
  return courses.find((c) => c.slug === slug);
}

export function getCoursesByTrack(trackId: string): Course[] {
  return courses.filter((c) => c.trackId === trackId && c.isActive);
}

export function filterCourses(params: FilterParams): Course[] {
  let filtered = getActiveCourses();

  if (params.track) {
    filtered = filtered.filter((c) => c.trackId === params.track);
  }

  if (params.difficulty) {
    filtered = filtered.filter((c) => c.difficulty === params.difficulty);
  }

  if (params.q) {
    const query = params.q.toLowerCase();
    filtered = filtered.filter(
      (c) =>
        c.title.toLowerCase().includes(query) ||
        c.shortDescription.toLowerCase().includes(query) ||
        c.tags.some((tag) => tag.includes(query)),
    );
  }

  switch (params.sort) {
    case "xp-high":
      filtered.sort((a, b) => b.xpReward - a.xpReward);
      break;
    case "xp-low":
      filtered.sort((a, b) => a.xpReward - b.xpReward);
      break;
    case "newest":
      filtered.reverse();
      break;
    case "popular":
    default:
      filtered.sort((a, b) => b.enrollmentCount - a.enrollmentCount);
      break;
  }

  return filtered;
}

export function getAllTracks(): Track[] {
  return tracks;
}

export function getTrackById(id: string): Track | undefined {
  return tracks.find((t) => t.id === id);
}
