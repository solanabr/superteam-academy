/* eslint-disable import/order -- vi.mock/vi.hoisted must precede importing ../admin-mutations. */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

// Hoisted mocks so the next-sanity factory can reference them safely.
const { fetchMock, commitMock, createOrReplaceMock, deleteMock } = vi.hoisted(
  () => ({
    fetchMock: vi.fn(),
    commitMock: vi.fn(),
    createOrReplaceMock: vi.fn(),
    deleteMock: vi.fn(),
  })
);

vi.mock("next-sanity", () => {
  const tx = {
    createOrReplace: (doc: unknown) => {
      createOrReplaceMock(doc);
      return tx;
    },
    delete: (id: string) => {
      deleteMock(id);
      return tx;
    },
    commit: (opts: unknown) => {
      commitMock(opts);
      return Promise.resolve();
    },
  };
  return {
    createClient: () => ({ fetch: fetchMock, transaction: () => tx }),
  };
});

import {
  readManagedDocuments,
  writeDocuments,
  deleteDocuments,
} from "../admin-mutations";

beforeEach(() => {
  fetchMock.mockReset();
  commitMock.mockReset();
  createOrReplaceMock.mockReset();
  deleteMock.mockReset();
});

describe("admin-mutations content-sync surface", () => {
  it("reads managed docs pinned to the published perspective (drafts excluded)", async () => {
    fetchMock.mockResolvedValue([]);
    await readManagedDocuments();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const options = fetchMock.mock.calls[0]![2];
    expect(options).toEqual({ perspective: "published" });
  });

  it("commits the write batch with read-your-writes (sync) visibility", async () => {
    await writeDocuments([{ _id: "course-a", _type: "course" }]);
    expect(createOrReplaceMock).toHaveBeenCalledTimes(1);
    expect(commitMock).toHaveBeenCalledWith({ visibility: "sync" });
  });

  it("commits the delete batch with sync visibility", async () => {
    await deleteDocuments(["course-a"]);
    expect(deleteMock).toHaveBeenCalledWith("course-a");
    expect(commitMock).toHaveBeenCalledWith({ visibility: "sync" });
  });

  it("is a no-op (no transaction commit) on an empty batch", async () => {
    await writeDocuments([]);
    await deleteDocuments([]);
    expect(commitMock).not.toHaveBeenCalled();
  });
});
