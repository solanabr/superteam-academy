"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type {
  UserProfile,
  UserStats,
  Enrollment,
  ProfileUpdateData,
} from "@/types/user";

interface ProfileData {
  profile: UserProfile | null;
  stats: UserStats | null;
  completedCourses: Enrollment[];
  loading: boolean;
  error: string | null;
}

export function useProfile(username: string | null): ProfileData {
  const [data, setData] = useState<ProfileData>({
    profile: null,
    stats: null,
    completedCourses: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!username) {
      setData((prev) => ({ ...prev, loading: false }));
      return;
    }

    let cancelled = false;
    setData((prev) => ({ ...prev, loading: true, error: null }));

    fetch(`/api/profile?username=${encodeURIComponent(username)}`)
      .then(async (res) => {
        if (cancelled) return;
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error ?? `HTTP ${res.status}`);
        }
        return res.json();
      })
      .then((json) => {
        if (cancelled || !json) return;
        setData({
          profile: json.profile,
          stats: json.stats,
          completedCourses: json.completedCourses ?? [],
          loading: false,
          error: null,
        });
      })
      .catch((err) => {
        if (cancelled) return;
        setData({
          profile: null,
          stats: null,
          completedCourses: [],
          loading: false,
          error: err.message,
        });
      });

    return () => {
      cancelled = true;
    };
  }, [username]);

  return data;
}

interface ProfileMutation {
  updateProfile: (data: ProfileUpdateData) => Promise<UserProfile | null>;
  updating: boolean;
  error: string | null;
}

export function useProfileMutation(): ProfileMutation {
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateProfile = useCallback(
    async (data: ProfileUpdateData): Promise<UserProfile | null> => {
      setUpdating(true);
      setError(null);
      try {
        const res = await fetch("/api/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error ?? `HTTP ${res.status}`);
        }
        const json = await res.json();
        return json.profile;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to update profile";
        setError(message);
        return null;
      } finally {
        setUpdating(false);
      }
    },
    [],
  );

  return { updateProfile, updating, error };
}

interface UsernameCheck {
  available: boolean | null;
  checking: boolean;
}

export function useUsernameCheck(
  username: string,
  currentUsername: string,
): UsernameCheck {
  const [state, setState] = useState<UsernameCheck>({
    available: null,
    checking: false,
  });
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (!username || username.length < 3 || username === currentUsername) {
      setState({ available: null, checking: false });
      return;
    }

    // Validate format client-side first
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      setState({ available: false, checking: false });
      return;
    }

    setState({ available: null, checking: true });
    clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      fetch(`/api/profile/username?username=${encodeURIComponent(username)}`)
        .then((res) => res.json())
        .then((json) => {
          setState({ available: json.available ?? false, checking: false });
        })
        .catch(() => {
          setState({ available: null, checking: false });
        });
    }, 400);

    return () => clearTimeout(timerRef.current);
  }, [username, currentUsername]);

  return state;
}
