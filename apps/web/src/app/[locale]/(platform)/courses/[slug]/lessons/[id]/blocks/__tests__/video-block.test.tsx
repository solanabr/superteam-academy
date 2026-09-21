// @vitest-environment jsdom
import type { ReactElement } from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { Lesson, VideoBlockData } from "@superteam-lms/types";
import en from "@/messages/en.json";
import ptBR from "@/messages/pt-BR.json";
import es from "@/messages/es.json";
import { VideoBlock } from "../video-block";
import type { BlockContext } from "../types";

afterEach(cleanup);

const RESTRICTED_ID = "40KvouUtgbc";
const videoBlock: VideoBlockData = {
  _type: "video",
  key: "video",
  url: `https://www.youtube.com/watch?v=${RESTRICTED_ID}`,
};

const spotifyProse = {
  _type: "prose" as const,
  key: "content",
  src: "### Ouça também em áudio\n\n[Ouvir no Spotify](https://open.spotify.com/episode/0VWSbMDOLd160lDwN1k8Nw)\n",
};

function makeLesson(blocks: Lesson["blocks"]): Lesson {
  return {
    _id: "lesson-vgs-origens-fundacao",
    title: "Origins and Founding Story",
    slug: "origens-e-historia-da-fundacao",
    blocks,
  };
}

function makeCtx(overrides: Partial<BlockContext> = {}): BlockContext {
  return {
    lesson: makeLesson([videoBlock]),
    courseSlug: "visao-geral-solana",
    courseId: "course-visao-geral-solana",
    locale: "en",
    isEnrolled: true,
    isCompleted: false,
    lessonNumber: 1,
    xpReward: 30,
    earnedXp: null,
    onEnroll: vi.fn(),
    setProof: vi.fn(),
    setQuizAnswered: vi.fn(),
    setBlockDone: vi.fn(),
    aiSuppressed: false,
    capstoneAiOff: false,
    buildUuid: null,
    programKeypairSecret: null,
    resetBuild: vi.fn(),
    canSubmit: true,
    ...overrides,
  };
}

function renderWithIntl(
  ui: ReactElement,
  locale = "en",
  messages: Record<string, unknown> = en
) {
  return render(
    <NextIntlClientProvider locale={locale} messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
}

describe("VideoBlock — embeddable", () => {
  it("renders the player when the server says embeddable", () => {
    const { container } = renderWithIntl(
      <VideoBlock
        block={videoBlock}
        ctx={makeCtx({
          videoEmbeds: { video: { embeddable: true, title: null } },
        })}
      />
    );
    const iframe = container.querySelector("iframe")!;
    expect(iframe.getAttribute("src")).toBe(
      `https://www.youtube.com/embed/${RESTRICTED_ID}?enablejsapi=1`
    );
  });

  it("renders the player when there is no verdict at all (probe skipped/failed)", () => {
    const { container } = renderWithIntl(
      <VideoBlock block={videoBlock} ctx={makeCtx()} />
    );
    expect(container.querySelector("iframe")).toBeTruthy();
  });

  it("renders nothing for an unparseable url, as before", () => {
    const bad: VideoBlockData = { _type: "video", key: "video", url: "nope" };
    const { container } = renderWithIntl(
      <VideoBlock block={bad} ctx={makeCtx()} />
    );
    expect(container.firstChild).toBeNull();
  });
});

describe("VideoBlock — not embeddable", () => {
  const notEmbeddable = { video: { embeddable: false, title: null } };

  it("swaps the player for the card, with the poster and the watch link", () => {
    const { container } = renderWithIntl(
      <VideoBlock
        block={videoBlock}
        ctx={makeCtx({ videoEmbeds: notEmbeddable })}
      />
    );
    expect(container.querySelector("iframe")).toBeNull();

    const link = screen.getByRole("link", { name: "Watch on YouTube" });
    expect(link.getAttribute("href")).toBe(
      `https://www.youtube.com/watch?v=${RESTRICTED_ID}`
    );
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toContain("noopener");

    expect(container.querySelector("img")!.getAttribute("src")).toBe(
      `https://i.ytimg.com/vi/${RESTRICTED_ID}/hqdefault.jpg`
    );
    expect(
      screen.getByText("This video can only be watched on YouTube.")
    ).toBeTruthy();
  });

  it("keeps the player's 16:9 footprint so nothing shifts", () => {
    const { container } = renderWithIntl(
      <VideoBlock
        block={videoBlock}
        ctx={makeCtx({ videoEmbeds: notEmbeddable })}
      />
    );
    expect(container.querySelector(".pb-\\[56\\.25\\%\\]")).toBeTruthy();
  });

  it("prefers the oembed title and falls back to the lesson title", () => {
    const { unmount } = renderWithIntl(
      <VideoBlock
        block={videoBlock}
        ctx={makeCtx({
          videoEmbeds: {
            video: { embeddable: false, title: "Forge College — Origens" },
          },
        })}
      />
    );
    expect(screen.getByText("Forge College — Origens")).toBeTruthy();
    unmount();

    renderWithIntl(
      <VideoBlock
        block={videoBlock}
        ctx={makeCtx({ videoEmbeds: notEmbeddable })}
      />
    );
    expect(screen.getByText("Origins and Founding Story")).toBeTruthy();
  });

  it("offers the lesson's Spotify audio as the secondary action", () => {
    renderWithIntl(
      <VideoBlock
        block={videoBlock}
        ctx={makeCtx({
          lesson: makeLesson([videoBlock, spotifyProse]),
          videoEmbeds: notEmbeddable,
        })}
      />
    );
    const spotify = screen.getByRole("link", { name: /Listen on Spotify/ });
    expect(spotify.getAttribute("href")).toBe(
      "https://open.spotify.com/episode/0VWSbMDOLd160lDwN1k8Nw"
    );
  });

  it("omits the Spotify button when the lesson has no audio version", () => {
    renderWithIntl(
      <VideoBlock
        block={videoBlock}
        ctx={makeCtx({ videoEmbeds: notEmbeddable })}
      />
    );
    expect(screen.queryByRole("link", { name: /Spotify/ })).toBeNull();
  });

  it("localises the card in pt-BR and es", () => {
    const { unmount } = renderWithIntl(
      <VideoBlock
        block={videoBlock}
        ctx={makeCtx({ videoEmbeds: notEmbeddable })}
      />,
      "pt-BR",
      ptBR
    );
    expect(
      screen.getByRole("link", { name: "Assistir no YouTube" })
    ).toBeTruthy();
    expect(
      screen.getByText("Este vídeo só pode ser assistido no YouTube.")
    ).toBeTruthy();
    unmount();

    renderWithIntl(
      <VideoBlock
        block={videoBlock}
        ctx={makeCtx({ videoEmbeds: notEmbeddable })}
      />,
      "es",
      es
    );
    expect(screen.getByRole("link", { name: "Ver en YouTube" })).toBeTruthy();
  });
});

describe("VideoBlock — runtime embed failure", () => {
  it("swaps to the card on a YouTube onError 150 posted by the player", async () => {
    const { container } = renderWithIntl(
      <VideoBlock
        block={videoBlock}
        ctx={makeCtx({
          videoEmbeds: { video: { embeddable: true, title: null } },
        })}
      />
    );
    expect(container.querySelector("iframe")).toBeTruthy();

    window.dispatchEvent(
      new MessageEvent("message", {
        origin: "https://www.youtube.com",
        data: JSON.stringify({ event: "onError", info: 150 }),
      })
    );

    expect(
      await screen.findByRole("link", { name: "Watch on YouTube" })
    ).toBeTruthy();
    expect(container.querySelector("iframe")).toBeNull();
  });

  it("ignores messages from another origin and unrelated player events", () => {
    const { container } = renderWithIntl(
      <VideoBlock
        block={videoBlock}
        ctx={makeCtx({
          videoEmbeds: { video: { embeddable: true, title: null } },
        })}
      />
    );
    for (const event of [
      new MessageEvent("message", {
        origin: "https://evil.example",
        data: JSON.stringify({ event: "onError", info: 150 }),
      }),
      new MessageEvent("message", {
        origin: "https://www.youtube.com",
        data: JSON.stringify({ event: "onStateChange", info: 1 }),
      }),
      new MessageEvent("message", {
        origin: "https://www.youtube.com",
        // 2 = bad parameter, 5 = HTML5 error: NOT an embedding refusal.
        data: JSON.stringify({ event: "onError", info: 5 }),
      }),
      new MessageEvent("message", {
        origin: "https://www.youtube.com",
        data: "not json",
      }),
    ]) {
      window.dispatchEvent(event);
    }
    expect(container.querySelector("iframe")).toBeTruthy();
  });
});
