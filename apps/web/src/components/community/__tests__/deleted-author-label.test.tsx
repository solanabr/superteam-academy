// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import en from "@/messages/en.json";
import es from "@/messages/es.json";
import ptBR from "@/messages/pt-BR.json";
import { DangerTab } from "@/app/[locale]/(platform)/settings/_components/danger-tab";
import { AnswerCard } from "../answer-card";
import { ThreadCard } from "../thread-card";

vi.mock("@/i18n/routing", () => ({
  Link: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/lib/analytics", () => ({ resetUser: vi.fn() }));
vi.mock("@/lib/supabase/client", () => ({ createClient: vi.fn() }));

afterEach(cleanup);

const withMessages = (node: ReactNode) => (
  <NextIntlClientProvider locale="en" messages={en}>
    {node}
  </NextIntlClientProvider>
);

const author = (deleted: boolean) => ({
  username: null,
  avatar_url: null,
  level: 0,
  deleted,
});

const threadCard = (deleted: boolean) => (
  <ThreadCard
    title="A thread"
    slug="a-thread"
    type="discussion"
    isSolved={false}
    isPinned={false}
    voteScore={0}
    userVote={null}
    answerCount={0}
    author={author(deleted)}
    createdAt="2026-01-01T00:00:00Z"
    categorySlug="general"
    onVote={vi.fn()}
  />
);

const answerCard = (deleted: boolean) => (
  <AnswerCard
    answer={{
      id: "a1",
      body: "An answer",
      is_accepted: false,
      vote_score: 0,
      userVote: null,
      author_id: "someone",
      author: author(deleted),
      created_at: "2026-01-01T00:00:00Z",
    }}
    isThreadAuthor={false}
    onVote={vi.fn()}
    onAccept={vi.fn()}
  />
);

describe("the forum's deleted-user label", () => {
  it("is its own string in every locale, separate from Anonymous", () => {
    for (const messages of [en, es, ptBR]) {
      expect(messages.community.deletedUser).toBeTruthy();
      expect(messages.community.deletedUser).not.toBe(
        messages.community.anonymous
      );
    }
    expect(en.community.deletedUser).toBe("Deleted user");
    expect(ptBR.community.deletedUser).toBe("Usuário excluído");
    expect(es.community.deletedUser).toBe("Usuario eliminado");
  });

  it.each([
    ["ThreadCard", threadCard],
    ["AnswerCard", answerCard],
  ])("%s shows it for a deleted author", (_name, card) => {
    render(withMessages(card(true)));

    expect(screen.getByText(en.community.deletedUser)).toBeTruthy();
    expect(screen.queryByText(en.community.anonymous)).toBeNull();
  });

  it.each([
    ["ThreadCard", threadCard],
    ["AnswerCard", answerCard],
  ])("%s keeps Anonymous for a private profile", (_name, card) => {
    render(withMessages(card(false)));

    expect(screen.getByText(en.community.anonymous)).toBeTruthy();
    expect(screen.queryByText(en.community.deletedUser)).toBeNull();
  });
});

describe("the delete dialog on a short screen", () => {
  it("scrolls, so its buttons stay reachable with the longer copy", async () => {
    render(withMessages(<DangerTab />));
    fireEvent.click(
      screen.getByRole("button", { name: en.settings.deleteAccountButton })
    );

    const dialog = await screen.findByRole("dialog");
    expect(dialog.className).toContain("overflow-y-auto");
    expect(dialog.className).toContain("max-h-[90dvh]");
  });
});

describe("the delete dialog says what really happens", () => {
  const cases = [
    {
      name: "en",
      s: en.settings,
      forum: /forum posts stay/i,
      label: en.community.deletedUser,
      chain: /on-chain XP and credentials/i,
    },
    {
      name: "pt-BR",
      s: ptBR.settings,
      forum: /posts no fórum permanecem/i,
      label: ptBR.community.deletedUser,
      chain: /XP on-chain e suas credenciais/i,
    },
    {
      name: "es",
      s: es.settings,
      forum: /publicaciones en el foro permanecen/i,
      label: es.community.deletedUser,
      chain: /XP on-chain y tus credenciales/i,
    },
  ];

  it.each(cases)("$name: forum posts stay", ({ s, forum, label }) => {
    expect(s.deleteAccountConfirmBody).toMatch(forum);
    expect(s.deleteAccountConfirmBody).toContain(label);
  });

  it.each(cases)("$name: on-chain records stay", ({ s, chain }) => {
    expect(s.deleteAccountConfirmBody).toMatch(chain);
  });

  it("no longer promises permanent deletion in the button", () => {
    expect(en.settings.deleteAccountConfirmButton).not.toMatch(/permanent/i);
    expect(ptBR.settings.deleteAccountConfirmButton).not.toMatch(/permanent/i);
    expect(es.settings.deleteAccountConfirmButton).not.toMatch(/permanent/i);
  });
});
