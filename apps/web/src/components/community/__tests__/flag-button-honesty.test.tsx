// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/en.json";
import { FlagButton } from "../flag-button";

/**
 * #1139. The modal used to ignore the response entirely — every 401/429/409/500
 * rendered "Report submitted. Thank you.". These tests pin that each failure now
 * names itself, and that "Other" cannot be submitted with no explanation (the
 * empty `other` card was exactly what reached moderators).
 */

const c = messages.community;

function respond(status: number, body: unknown = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

async function openModal(user: ReturnType<typeof userEvent.setup>) {
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <FlagButton threadId="t1" />
    </NextIntlClientProvider>
  );
  await user.click(screen.getByRole("button", { name: c.report }));
}

const submit = () => screen.getByRole("button", { name: c.submitReport });

describe("FlagButton — failures no longer render success (#1139)", () => {
  it.each([
    [401, {}, c.reportErrorSignedOut],
    [429, {}, c.reportErrorRateLimited],
    [409, { error: "alreadyReported" }, c.reportErrorAlreadyReported],
    [403, { error: "ownContent" }, c.reportErrorOwnContent],
    [400, { error: "detailsRequired" }, c.reportErrorDetailsRequired],
    [500, { error: "Failed to submit flag" }, c.reportErrorFailed],
  ])(
    "status %i surfaces its own message, not success",
    async (status, body, expected) => {
      const user = userEvent.setup();
      fetchMock.mockResolvedValue(respond(status, body));
      await openModal(user);

      await user.click(screen.getByRole("radio", { name: c.reasonSpam }));
      await user.click(submit());

      expect(await screen.findByRole("alert")).toHaveTextContent(expected);
      expect(screen.queryByText(c.reportSubmitted)).not.toBeInTheDocument();
    }
  );

  it("a thrown fetch surfaces the generic failure instead of silence", async () => {
    const user = userEvent.setup();
    fetchMock.mockRejectedValue(new Error("offline"));
    await openModal(user);

    await user.click(screen.getByRole("radio", { name: c.reasonSpam }));
    await user.click(submit());

    expect(await screen.findByRole("alert")).toHaveTextContent(
      c.reportErrorFailed
    );
  });

  it("a 201 shows success plus what happens next", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue(respond(201, { success: true }));
    await openModal(user);

    await user.click(screen.getByRole("radio", { name: c.reasonSpam }));
    await user.click(submit());

    expect(await screen.findByText(c.reportSubmitted)).toBeInTheDocument();
    expect(screen.getByText(c.reportWhatHappensNext)).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});

describe('FlagButton — "Other" requires an explanation (#1139)', () => {
  it("keeps submit disabled until Other has 10+ non-whitespace characters", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue(respond(201, { success: true }));
    await openModal(user);

    await user.click(screen.getByRole("radio", { name: c.reasonOther }));
    expect(submit()).toBeDisabled();

    const box = screen.getByLabelText(c.reportDetailsRequired);
    await user.type(box, "   short   ");
    expect(submit()).toBeDisabled();

    await user.clear(box);
    await user.type(box, "posts the same referral link everywhere");
    expect(submit()).toBeEnabled();

    await user.click(submit());
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("leaves details optional for the other reasons", async () => {
    const user = userEvent.setup();
    await openModal(user);

    await user.click(screen.getByRole("radio", { name: c.reasonOffensive }));
    expect(submit()).toBeEnabled();
    expect(screen.getByLabelText(c.additionalDetails)).toBeInTheDocument();
  });

  it("trims details before sending", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue(respond(201, { success: true }));
    await openModal(user);

    await user.click(screen.getByRole("radio", { name: c.reasonSpam }));
    await user.type(screen.getByLabelText(c.additionalDetails), "  spammy  ");
    await user.click(submit());

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const body = JSON.parse(String(init.body));
    expect(body.details).toBe("spammy");
  });
});

describe("FlagButton — reason group a11y (#1139)", () => {
  it("exposes the reasons as a labelled radiogroup", async () => {
    const user = userEvent.setup();
    await openModal(user);

    const group = screen.getByRole("radiogroup");
    expect(group.tagName).toBe("FIELDSET");
    expect(group).toHaveAccessibleName(c.reportReasonLegend);
    expect(screen.getAllByRole("radio")).toHaveLength(4);
  });
});
