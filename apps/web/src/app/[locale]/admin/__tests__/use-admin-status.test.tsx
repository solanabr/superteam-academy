// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import type { AdminStatus } from "../admin-status-types";
import { useAdminStatus } from "../use-admin-status";

const status: AdminStatus = {
  program: {
    deployed: true,
    programId: "AcademyProgram1111111111111111111111111111",
    configPda: "Config11111111111111111111111111111111111",
    minterRegistered: true,
    authorityMatch: { matches: true },
  },
  courses: [],
  achievements: [],
};

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("useAdminStatus", () => {
  it("fetches /api/admin/status on mount and exposes the payload", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => status } as Response);
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useAdminStatus());
    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.status).toEqual(status);
    expect(result.current.error).toBeNull();
    expect(fetchMock).toHaveBeenCalledWith("/api/admin/status");
  });

  it("surfaces a 'fetch' error kind on a non-ok response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false } as Response)
    );

    const { result } = renderHook(() => useAdminStatus());
    await waitFor(() => expect(result.current.error).toBe("fetch"));
    expect(result.current.status).toBeNull();
  });

  it("surfaces a 'network' error kind when fetch throws", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("boom")));

    const { result } = renderHook(() => useAdminStatus());
    await waitFor(() => expect(result.current.error).toBe("network"));
  });

  it("refetches and clears a prior error", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false } as Response)
      .mockResolvedValue({ ok: true, json: async () => status } as Response);
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useAdminStatus());
    await waitFor(() => expect(result.current.error).toBe("fetch"));

    act(() => result.current.refetch());
    await waitFor(() => expect(result.current.status).toEqual(status));
    expect(result.current.error).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("returns a referentially stable refetch across re-renders", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue({ ok: true, json: async () => status } as Response)
    );

    const { result, rerender } = renderHook(() => useAdminStatus());
    const first = result.current.refetch;
    await waitFor(() => expect(result.current.loading).toBe(false));
    rerender();
    expect(result.current.refetch).toBe(first);
  });
});
