"use client";

import { useState, useEffect, useCallback } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { useAuth } from "@/components/providers/auth-provider";

/**
 * Returns true if the authenticated user has created at least one course.
 * Result is cached per session and refreshed when the auth state changes.
 */
export function useHasCreatedCourses() {
  const { isAuthenticated } = useAuth();
  const [hasCreatedCourses, setHasCreatedCourses] = useState(false);
  const [checked, setChecked] = useState(false);

  const check = useCallback(async () => {
    if (!isAuthenticated) {
      setHasCreatedCourses(false);
      setChecked(true);
      return;
    }

    try {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setHasCreatedCourses(false);
        setChecked(true);
        return;
      }

      const res = await fetch("/api/courses/my", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (res.ok) {
        const { courses } = await res.json();
        setHasCreatedCourses(Array.isArray(courses) && courses.length > 0);
      }
    } catch {
      // silent
    } finally {
      setChecked(true);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    check();
  }, [check]);

  return { hasCreatedCourses, checked };
}
