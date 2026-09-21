import { describe, it, expect } from "vitest";
import {
  embedUrlFor,
  parseVideoRef,
  youtubeOembedUrl,
  youtubeThumbnailUrl,
  youtubeWatchUrl,
} from "../youtube";
import { findSpotifyUrl } from "../spotify";

describe("parseVideoRef", () => {
  it("reads the id from every youtube url shape we author", () => {
    for (const url of [
      "https://www.youtube.com/watch?v=L65KvCbTqRo",
      "https://youtube.com/watch?v=L65KvCbTqRo&t=12",
      "https://youtu.be/L65KvCbTqRo",
      "https://www.youtube.com/embed/L65KvCbTqRo",
      "https://www.youtube-nocookie.com/embed/L65KvCbTqRo",
      "https://www.youtube.com/shorts/L65KvCbTqRo",
    ]) {
      expect(parseVideoRef(url)).toEqual({
        provider: "youtube",
        id: "L65KvCbTqRo",
      });
    }
  });

  it("reads vimeo, and refuses anything else", () => {
    expect(parseVideoRef("https://vimeo.com/123456")).toEqual({
      provider: "vimeo",
      id: "123456",
    });
    expect(parseVideoRef("https://example.com/video.mp4")).toBeNull();
    expect(parseVideoRef("https://www.youtube.com/")).toBeNull();
    expect(parseVideoRef("not a url")).toBeNull();
  });
});

describe("url builders", () => {
  it("builds the player, watch, poster and oembed urls off one id", () => {
    const ref = parseVideoRef("https://youtu.be/abc123")!;
    expect(embedUrlFor(ref)).toBe("https://www.youtube.com/embed/abc123");
    expect(embedUrlFor({ provider: "vimeo", id: "9" })).toBe(
      "https://player.vimeo.com/video/9"
    );
    expect(youtubeWatchUrl("abc123")).toBe(
      "https://www.youtube.com/watch?v=abc123"
    );
    expect(youtubeThumbnailUrl("abc123")).toBe(
      "https://i.ytimg.com/vi/abc123/hqdefault.jpg"
    );
    expect(youtubeOembedUrl("abc123")).toBe(
      "https://www.youtube.com/oembed?url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3Dabc123&format=json"
    );
  });
});

describe("findSpotifyUrl", () => {
  it("pulls the episode link out of a prose block's markdown", () => {
    expect(
      findSpotifyUrl([
        { _type: "video", src: undefined },
        {
          _type: "prose",
          src: "### Ouça também em áudio\n\n[Ouvir no Spotify](https://open.spotify.com/episode/0VWSbMDOLd160lDwN1k8Nw)\n",
        },
      ])
    ).toBe("https://open.spotify.com/episode/0VWSbMDOLd160lDwN1k8Nw");
  });

  it("is null when no prose block carries one", () => {
    expect(findSpotifyUrl([{ _type: "prose", src: "# Title" }])).toBeNull();
    expect(findSpotifyUrl([])).toBeNull();
  });
});
