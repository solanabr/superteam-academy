/* eslint-disable import/order -- vi.mock must be hoisted above the route import,
   which forces the module-under-test import to sit after non-import code. */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// The route's two collaborators are mocked so no real Sanity client (or its env)
// is ever constructed. authorizeTeacher is the auth/role gate; the mutations
// module supplies ownership + the upload. Asserting on `uploadMock` lets us
// prove uploads only happen on the fully-authorized happy path.
const authorizeMock = vi.fn();
const getAuthorshipMock = vi.fn();
const uploadMock = vi.fn();

// The route (and its deps) are `server-only`; stub the guard so the module can
// be imported in the node test environment (same pattern as arweave.test.ts).
vi.mock("server-only", () => ({}));

vi.mock("@/lib/teacher/authorize", () => ({
  authorizeTeacher: () => authorizeMock(),
}));

vi.mock("@/lib/sanity/teacher-mutations", () => ({
  getCourseAuthorship: (id: string) => getAuthorshipMock(id),
  uploadCourseThumbnail: (
    id: string,
    bytes: Buffer,
    meta: { filename: string; contentType: string }
  ) => uploadMock(id, bytes, meta),
}));

import { POST } from "../route";

const COURSE_ID = "course-abc";
const OWNER_ID = "user-owner";

/** Build a NextRequest carrying a multipart body with a single `file` field. */
function makeRequest(file: File | null): NextRequest {
  const form = new FormData();
  if (file) form.append("file", file);
  return new NextRequest(
    "http://test/api/teacher/courses/course-abc/thumbnail",
    {
      method: "POST",
      body: form,
    }
  );
}

/** A minimal in-memory image file of `size` bytes with the given MIME type. */
function makeFile(size: number, type: string, name = "pic.png"): File {
  return new File([new Uint8Array(size)], name, { type });
}

const params = Promise.resolve({ id: COURSE_ID });

function asOwnerTeacher() {
  authorizeMock.mockResolvedValue({
    ok: true,
    caller: { userId: OWNER_ID, role: "teacher" },
  });
  getAuthorshipMock.mockResolvedValue({
    _id: COURSE_ID,
    author: OWNER_ID,
    title: "T",
    slug: "t",
    difficulty: "beginner",
    authoringStatus: "draft",
    onChainStatus: null,
  });
}

beforeEach(() => {
  authorizeMock.mockReset();
  getAuthorshipMock.mockReset();
  uploadMock.mockReset();
  uploadMock.mockResolvedValue({
    assetRef: "image-deadbeef-800x450-png",
    url: "https://cdn.sanity.io/images/p/d/image-deadbeef-800x450-png.png",
  });
});

describe("POST /api/teacher/courses/[id]/thumbnail", () => {
  it("401 when unauthenticated", async () => {
    authorizeMock.mockResolvedValue({ ok: false, status: 401 });

    const res = await POST(makeRequest(makeFile(10, "image/png")), { params });

    expect(res.status).toBe(401);
    expect(getAuthorshipMock).not.toHaveBeenCalled();
    expect(uploadMock).not.toHaveBeenCalled();
  });

  it("403 when authenticated but not a teacher/admin", async () => {
    authorizeMock.mockResolvedValue({ ok: false, status: 403 });

    const res = await POST(makeRequest(makeFile(10, "image/png")), { params });

    expect(res.status).toBe(403);
    expect(uploadMock).not.toHaveBeenCalled();
  });

  it("403 when the caller does not own the course (no upload)", async () => {
    authorizeMock.mockResolvedValue({
      ok: true,
      caller: { userId: "someone-else", role: "teacher" },
    });
    getAuthorshipMock.mockResolvedValue({
      _id: COURSE_ID,
      author: OWNER_ID,
      title: "T",
      slug: "t",
      difficulty: "beginner",
      authoringStatus: "draft",
      onChainStatus: null,
    });

    const res = await POST(makeRequest(makeFile(10, "image/png")), { params });

    expect(res.status).toBe(403);
    expect(uploadMock).not.toHaveBeenCalled();
  });

  it("404 when the course does not exist", async () => {
    authorizeMock.mockResolvedValue({
      ok: true,
      caller: { userId: OWNER_ID, role: "teacher" },
    });
    getAuthorshipMock.mockResolvedValue(null);

    const res = await POST(makeRequest(makeFile(10, "image/png")), { params });

    expect(res.status).toBe(404);
    expect(uploadMock).not.toHaveBeenCalled();
  });

  it("400 when the file is not an image", async () => {
    asOwnerTeacher();

    const res = await POST(
      makeRequest(makeFile(10, "application/pdf", "doc.pdf")),
      { params }
    );

    expect(res.status).toBe(400);
    expect(uploadMock).not.toHaveBeenCalled();
  });

  it("400 when no file field is present", async () => {
    asOwnerTeacher();

    const res = await POST(makeRequest(null), { params });

    expect(res.status).toBe(400);
    expect(uploadMock).not.toHaveBeenCalled();
  });

  it("413 when the image exceeds the size cap", async () => {
    asOwnerTeacher();
    // 5 MB + 1 byte.
    const tooBig = makeFile(5 * 1024 * 1024 + 1, "image/png");

    const res = await POST(makeRequest(tooBig), { params });

    expect(res.status).toBe(413);
    expect(uploadMock).not.toHaveBeenCalled();
  });

  it("happy path: uploads, patches the course, returns assetRef + url", async () => {
    asOwnerTeacher();

    const res = await POST(
      makeRequest(makeFile(2048, "image/png", "cover.png")),
      { params }
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as { assetRef: string; url: string };
    expect(body.assetRef).toBe("image-deadbeef-800x450-png");
    expect(body.url).toContain("cdn.sanity.io");

    expect(uploadMock).toHaveBeenCalledTimes(1);
    const [calledId, calledBytes, calledMeta] = uploadMock.mock.calls[0] as [
      string,
      Buffer,
      { filename: string; contentType: string },
    ];
    expect(calledId).toBe(COURSE_ID);
    expect(calledBytes.byteLength).toBe(2048);
    expect(calledMeta.contentType).toBe("image/png");
    expect(calledMeta.filename).toBe("cover.png");
  });

  it("admin may upload for a course they do not author", async () => {
    authorizeMock.mockResolvedValue({
      ok: true,
      caller: { userId: "an-admin", role: "admin" },
    });
    getAuthorshipMock.mockResolvedValue({
      _id: COURSE_ID,
      author: OWNER_ID,
      title: "T",
      slug: "t",
      difficulty: "beginner",
      authoringStatus: "draft",
      onChainStatus: null,
    });

    const res = await POST(makeRequest(makeFile(64, "image/jpeg")), { params });

    expect(res.status).toBe(200);
    expect(uploadMock).toHaveBeenCalledTimes(1);
  });

  it("normalizes a content-type with params (image/png; charset=utf-8)", async () => {
    asOwnerTeacher();

    const res = await POST(
      makeRequest(makeFile(32, "image/png; charset=utf-8")),
      { params }
    );

    expect(res.status).toBe(200);
    const [, , meta] = uploadMock.mock.calls[0] as [
      string,
      Buffer,
      { contentType: string },
    ];
    expect(meta.contentType).toBe("image/png");
  });

  it("500 (safe message) when the upload throws", async () => {
    asOwnerTeacher();
    uploadMock.mockRejectedValue(new Error("boom internal detail"));

    const res = await POST(makeRequest(makeFile(16, "image/png")), { params });

    expect(res.status).toBe(500);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("Failed to upload thumbnail");
  });
});
