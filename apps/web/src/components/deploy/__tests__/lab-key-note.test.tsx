// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import en from "@/messages/en.json";
import es from "@/messages/es.json";
import ptBR from "@/messages/pt-BR.json";
import {
  createLabKeypair,
  labKeypairStorageKey,
  readLabKeypair,
} from "@/lib/solana/lab-keypair";
import { LabEnrollNotice, LabKeyNote } from "../lab-key-note";

const h = vi.hoisted(() => ({
  userId: "user-1" as string | null,
  labConnection: {},
}));

vi.mock("@/lib/auth/auth-provider", () => ({
  useAuth: () => ({ userId: h.userId, isLoading: false }),
}));

vi.mock("@/lib/solana/lab-connection", () => ({
  useLabConnection: () => ({ connection: h.labConnection }),
}));

vi.mock("@/lib/solana/lab-guard", () => ({
  verifyLabDevnet: async () => true,
}));

const writeText = vi.fn<(text: string) => Promise<void>>();

function renderNote(messages: typeof en = en, locale = "en") {
  return render(
    <NextIntlClientProvider locale={locale} messages={messages}>
      <LabKeyNote />
    </NextIntlClientProvider>
  );
}

async function shownAddress(): Promise<string> {
  const node = await screen.findByTestId("lab-key-address");
  return node.textContent ?? "";
}

beforeEach(() => {
  localStorage.clear();
  h.userId = "user-1";
  writeText.mockReset();
  writeText.mockResolvedValue(undefined);
  Object.assign(navigator, { clipboard: { writeText } });
});

afterEach(() => {
  // A create clears the "forgotten on this page" mark for the next test.
  createLabKeypair("user-1");
});

describe("LabKeyNote", () => {
  it("shows the lab key's full address", async () => {
    renderNote();
    const address = await shownAddress();
    expect(address).toBe(readLabKeypair("user-1")?.publicKey.toBase58());
    expect(address.length).toBeGreaterThanOrEqual(32);
    expect(address).not.toContain("...");
  });

  it("copies the full address, not a shortened one", async () => {
    renderNote();
    const address = await shownAddress();

    fireEvent.click(screen.getByRole("button", { name: "Copy address" }));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith(address));
    expect(
      await screen.findByRole("button", { name: "Copied!" })
    ).toBeInTheDocument();
  });

  it.each([
    ["en", en],
    ["pt-BR", ptBR],
    ["es", es],
  ] as const)(
    "says in %s that the key is a throwaway devnet key",
    async (locale, messages) => {
      renderNote(messages, locale);
      await shownAddress();
      const line = screen.getByText(messages.deploy.labKey.throwaway);
      expect(line.textContent).toMatch(/devnet/i);
      expect(line.textContent).toMatch(/mainnet/i);
    }
  );

  it("never renders the secret key", async () => {
    const { container } = renderNote();
    await shownAddress();
    const secret = readLabKeypair("user-1")?.secretKey ?? new Uint8Array();
    expect(container.innerHTML).not.toContain(
      JSON.stringify(Array.from(secret))
    );
    expect(container.innerHTML).not.toContain(Array.from(secret).join(","));
  });

  it("asks before it forgets, and states what is lost", async () => {
    renderNote();
    await shownAddress();

    fireEvent.click(screen.getByRole("button", { name: "Forget this key" }));

    // Nothing is deleted yet.
    expect(readLabKeypair("user-1")).not.toBeNull();
    const dialog = screen.getByRole("alertdialog");
    expect(dialog.textContent).toMatch(/test SOL in it is lost/);
    expect(dialog.textContent).toMatch(
      /upgrade control of the programs it deployed/
    );
    expect(dialog.textContent).toMatch(/cannot undo/);
  });

  it("keeps the key when the learner cancels", async () => {
    renderNote();
    const address = await shownAddress();
    fireEvent.click(screen.getByRole("button", { name: "Forget this key" }));

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(readLabKeypair("user-1")?.publicKey.toBase58()).toBe(address);
    expect(await shownAddress()).toBe(address);
  });

  it("deletes the key from this browser on confirm", async () => {
    renderNote();
    await shownAddress();
    fireEvent.click(screen.getByRole("button", { name: "Forget this key" }));

    fireEvent.click(screen.getByRole("button", { name: "Forget key" }));

    expect(
      await screen.findByText("There is no lab key in this browser.")
    ).toBeInTheDocument();
    expect(localStorage.getItem(labKeypairStorageKey("user-1"))).toBeNull();
    expect(screen.queryByTestId("lab-key-address")).not.toBeInTheDocument();
  });

  it("creates a new key on the next lab action after a forget", async () => {
    renderNote();
    const before = await shownAddress();
    fireEvent.click(screen.getByRole("button", { name: "Forget this key" }));
    fireEvent.click(screen.getByRole("button", { name: "Forget key" }));

    fireEvent.click(
      await screen.findByRole("button", { name: "Create a new lab key" })
    );

    const after = await shownAddress();
    expect(after).not.toBe(before);
    expect(readLabKeypair("user-1")?.publicKey.toBase58()).toBe(after);
  });

  it("creates no key and shows no address for a signed-out visitor", () => {
    h.userId = null;
    renderNote();
    expect(screen.queryByTestId("lab-key-address")).not.toBeInTheDocument();
    expect(localStorage.length).toBe(0);
  });
});

describe("LabEnrollNotice", () => {
  it("tells a visitor to enroll to use the lab", () => {
    render(
      <NextIntlClientProvider locale="en" messages={en}>
        <LabEnrollNotice />
      </NextIntlClientProvider>
    );
    expect(
      screen.getByText("Enroll in this course to use the lab.")
    ).toBeInTheDocument();
  });
});
