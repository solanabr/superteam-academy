import type {
  ThreadListParams,
  ThreadListResponse,
  ThreadDetail,
  CommentNode,
  CreateThreadPayload,
  CreateCommentPayload,
} from "@/types";

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `API error: ${res.status}`);
  }
  return res.json();
}

class DiscussionApiService {
  // ── Threads ─────────────────────────────────────────────────────────────────

  async listThreads(params: ThreadListParams): Promise<ThreadListResponse> {
    const qs = new URLSearchParams();
    if (params.scope) qs.set("scope", params.scope);
    if (params.category) qs.set("category", params.category);
    if (params.lessonId) qs.set("lessonId", params.lessonId);
    if (params.sort) qs.set("sort", params.sort);
    if (params.search) qs.set("search", params.search);
    if (params.cursor) qs.set("cursor", params.cursor);
    if (params.limit) qs.set("limit", String(params.limit));
    return apiFetch<ThreadListResponse>(`/api/discussions/threads?${qs}`);
  }

  async getThread(threadId: string): Promise<ThreadDetail> {
    return apiFetch<ThreadDetail>(`/api/discussions/threads/${threadId}`);
  }

  async createThread(data: CreateThreadPayload): Promise<{ id: string }> {
    return apiFetch<{ id: string }>("/api/discussions/threads", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateThread(
    threadId: string,
    data: Record<string, unknown>,
  ): Promise<void> {
    await apiFetch(`/api/discussions/threads/${threadId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteThread(threadId: string): Promise<void> {
    await apiFetch(`/api/discussions/threads/${threadId}`, {
      method: "DELETE",
    });
  }

  // ── Comments ────────────────────────────────────────────────────────────────

  async createComment(
    threadId: string,
    data: CreateCommentPayload,
  ): Promise<CommentNode> {
    return apiFetch<CommentNode>(
      `/api/discussions/threads/${threadId}/comments`,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
    );
  }

  async updateComment(
    threadId: string,
    commentId: string,
    body: string,
  ): Promise<void> {
    await apiFetch(
      `/api/discussions/threads/${threadId}/comments/${commentId}`,
      {
        method: "PATCH",
        body: JSON.stringify({ body }),
      },
    );
  }

  async deleteComment(threadId: string, commentId: string): Promise<void> {
    await apiFetch(
      `/api/discussions/threads/${threadId}/comments/${commentId}`,
      {
        method: "DELETE",
      },
    );
  }

  // ── Voting ──────────────────────────────────────────────────────────────────

  async voteThread(
    threadId: string,
    value: number,
  ): Promise<{ voteScore: number }> {
    return apiFetch<{ voteScore: number }>(
      `/api/discussions/threads/${threadId}/vote`,
      {
        method: "POST",
        body: JSON.stringify({ value }),
      },
    );
  }

  async voteComment(
    threadId: string,
    commentId: string,
    value: number,
  ): Promise<{ voteScore: number }> {
    return apiFetch<{ voteScore: number }>(
      `/api/discussions/threads/${threadId}/comments/${commentId}/vote`,
      { method: "POST", body: JSON.stringify({ value }) },
    );
  }

  // ── Views ───────────────────────────────────────────────────────────────────

  async recordView(threadId: string): Promise<void> {
    await apiFetch(`/api/discussions/threads/${threadId}/view`, {
      method: "POST",
    });
  }
}

export const discussionApi = new DiscussionApiService();
