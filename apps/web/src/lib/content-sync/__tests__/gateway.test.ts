import { describe, it, expect } from "vitest";
import { InMemoryGateway } from "../gateway";
import type { SanityDoc } from "../types";

describe("InMemoryGateway (test double)", () => {
  it("records writes, deletes, asset uploads and the singleton", async () => {
    const gw = new InMemoryGateway([{ _id: "lesson-a", _type: "lesson" }]);
    expect((await gw.readManaged()).map((d) => d._id)).toEqual(["lesson-a"]);

    await gw.writeDocs([{ _id: "lesson-b", _type: "lesson" } as SanityDoc]);
    await gw.deleteDocs(["lesson-a"]);
    const id = await gw.uploadAsset(new Uint8Array([1]), "x.png");
    await gw.writeSingleton("sha1", { lesson: 1 });

    expect(gw.written.map((d) => d._id)).toEqual(["lesson-b"]);
    expect(gw.deleted).toEqual(["lesson-a"]);
    expect(await gw.assetExists(id)).toBe(true);
    expect(gw.singleton).toEqual({ sha: "sha1", counts: { lesson: 1 } });
  });
});
