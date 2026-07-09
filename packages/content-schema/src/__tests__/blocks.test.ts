import { describe, it, expect } from "vitest";
import { ProseBlock } from "../blocks/prose";
import { VideoBlock } from "../blocks/video";

describe("ProseBlock", () => {
  it("accepts a markdown source path", () => {
    const b = ProseBlock.parse({
      type: "prose",
      key: "intro",
      src: "intro.md",
    });
    expect(b.src).toBe("intro.md");
  });

  it("rejects a non-markdown source", () => {
    expect(
      ProseBlock.safeParse({ type: "prose", key: "intro", src: "intro.txt" })
        .success
    ).toBe(false);
  });

  it("rejects an absolute or escaping path", () => {
    expect(
      ProseBlock.safeParse({ type: "prose", key: "i", src: "/etc/passwd.md" })
        .success
    ).toBe(false);
    expect(
      ProseBlock.safeParse({ type: "prose", key: "i", src: "../other.md" })
        .success
    ).toBe(false);
  });

  it("rejects an unknown discriminator", () => {
    expect(
      ProseBlock.safeParse({ type: "prosé", key: "i", src: "i.md" }).success
    ).toBe(false);
  });
});

describe("VideoBlock", () => {
  it("accepts an https url", () => {
    const b = VideoBlock.parse({
      type: "video",
      key: "v",
      url: "https://youtu.be/abc",
    });
    expect(b.url).toContain("youtu.be");
  });

  it("rejects http", () => {
    expect(
      VideoBlock.safeParse({
        type: "video",
        key: "v",
        url: "http://youtu.be/abc",
      }).success
    ).toBe(false);
  });
});

describe("capability keys", () => {
  it("are a closed set", () => {
    const ok = ProseBlock.safeParse({
      type: "prose",
      key: "i",
      src: "i.md",
      consumes: ["funded-wallet"],
    });
    expect(ok.success).toBe(true);

    const bad = ProseBlock.safeParse({
      type: "prose",
      key: "i",
      src: "i.md",
      consumes: ["made-up"],
    });
    expect(bad.success).toBe(false);
  });
});
