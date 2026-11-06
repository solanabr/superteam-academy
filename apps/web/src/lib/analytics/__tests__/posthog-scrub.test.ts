// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import {
  scrubPersistedPostHogState,
  scrubPostHogEvent,
  type PostHogEvent,
} from "../posthog-scrub";

function event(overrides: Partial<PostHogEvent>): PostHogEvent {
  return { event: "$pageview", properties: {}, ...overrides };
}

const ORIGIN = window.location.origin;

describe("scrubPostHogEvent", () => {
  it("strips auth params and fragments from the current URL, keeping host and path", () => {
    const out = scrubPostHogEvent(
      event({
        properties: {
          $current_url: `${ORIGIN}/en/courses?dynamicOauthCode=abc&dynamicOauthState=def&deviceRegistrationToken=ghi#access_token=jkl`,
          $host: window.location.host,
          $pathname: "/en/courses",
        },
      })
    );

    expect(out?.properties).toEqual({
      $current_url: `${ORIGIN}/en/courses`,
      $host: window.location.host,
      $pathname: "/en/courses",
    });
  });

  it("keeps campaign and referral params, which aren't secrets", () => {
    const out = scrubPostHogEvent(
      event({
        properties: {
          $current_url: `${ORIGIN}/en?utm_source=x&utm_campaign=y&ref=abc123&token=secret`,
        },
      })
    );

    expect(out?.properties?.$current_url).toBe(
      `${ORIGIN}/en?utm_source=x&utm_campaign=y&ref=abc123`
    );
  });

  it("reduces third-party referrers to their origin", () => {
    const out = scrubPostHogEvent(
      event({
        properties: {
          $referrer: "https://accounts.google.com/o/oauth2/auth?code=abc",
          $referring_domain: "accounts.google.com",
          $session_entry_referrer: "$direct",
        },
      })
    );

    expect(out?.properties).toEqual({
      $referrer: "https://accounts.google.com",
      $referring_domain: "accounts.google.com",
      $session_entry_referrer: "$direct",
    });
  });

  it("covers initial-URL person properties and session entry URLs", () => {
    const out = scrubPostHogEvent(
      event({
        properties: { $session_entry_url: `${ORIGIN}/en?sessionToken=abc` },
        $set: { $current_url: `${ORIGIN}/en?sessionToken=abc` },
        $set_once: {
          $initial_current_url: `${ORIGIN}/en?sessionToken=abc`,
          $initial_referrer: "https://evil.example/?code=abc",
          $initial_utm_source: "x",
        },
      })
    );

    expect(JSON.stringify(out)).not.toContain("sessionToken");
    expect(JSON.stringify(out)).not.toContain("code=abc");
    expect(out?.$set_once?.$initial_utm_source).toBe("x");
  });

  it("covers autocapture element chains and nested web vitals", () => {
    const out = scrubPostHogEvent(
      event({
        event: "$autocapture",
        properties: {
          $elements_chain: `a:attr__href="/en/x?token=abc"nth-child="1"`,
          $elements: [
            { attr__href: `${ORIGIN}/en/x?token=abc`, tag_name: "a" },
          ],
          $web_vitals_LCP_event: {
            $current_url: `${ORIGIN}/en/x?token=abc`,
            value: 12,
          },
        },
      })
    );

    expect(JSON.stringify(out)).not.toContain("token=abc");
    expect(JSON.stringify(out)).toContain('"value":12');
    expect(JSON.stringify(out)).toContain("/en/x");
  });

  it("strips URLs used as heatmap keys", () => {
    const out = scrubPostHogEvent(
      event({
        event: "$$heatmap",
        properties: {
          $heatmap_data: { [`${ORIGIN}/en/x?token=abc`]: [{ x: 1, y: 2 }] },
        },
      })
    );

    expect(out?.properties?.$heatmap_data).toEqual({
      [`${ORIGIN}/en/x`]: [{ x: 1, y: 2 }],
    });
  });

  it("drops email and wallet wherever they are set", () => {
    const out = scrubPostHogEvent(
      event({
        event: "$identify",
        properties: {
          email: "learner@example.com",
          walletAddress: "7xK",
          $set: { email: "learner@example.com", wallet_address: "7xK" },
          courseId: "c1",
        },
        $set: { email: "learner@example.com", walletAddress: "7xK", plan: "x" },
        $set_once: { Email: "learner@example.com", wallet: "7xK" },
      })
    );

    expect(JSON.stringify(out)).not.toContain("learner@example.com");
    expect(JSON.stringify(out)).not.toContain("7xK");
    expect(out?.properties?.courseId).toBe("c1");
    expect(out?.$set?.plan).toBe("x");
  });

  it("leaves ordinary event payloads alone", () => {
    const properties = {
      lessonId: "l1",
      courseId: "c1",
      correct: true,
      attempt: 2,
      $session_id: "s1",
    };

    expect(
      scrubPostHogEvent(event({ event: "quiz_checked", properties }))
        ?.properties
    ).toEqual(properties);
  });

  it("removes credentials from exception text", () => {
    const out = scrubPostHogEvent(
      event({
        event: "$exception",
        properties: {
          $exception_list: [
            { value: "failed https://rpc.example/?api-key=abc key=def" },
          ],
        },
      })
    );

    expect(JSON.stringify(out)).not.toContain("abc");
    expect(JSON.stringify(out)).not.toContain("key=def");
  });

  it("passes null through (an earlier hook rejected the event)", () => {
    expect(scrubPostHogEvent(null)).toBeNull();
  });

  it("truncates past the depth limit rather than passing values through", () => {
    let deep: unknown = `${ORIGIN}/en?token=deep-secret`;
    for (let i = 0; i < 20; i++) deep = { deep };

    const out = scrubPostHogEvent(event({ properties: { deep } }));

    expect(JSON.stringify(out)).not.toContain("deep-secret");
    expect(JSON.stringify(out)).toContain("[truncated]");
  });

  it("clips long strings", () => {
    const out = scrubPostHogEvent(
      event({ properties: { $elements_chain: "a".repeat(100_000) } })
    );

    expect(
      (out?.properties?.$elements_chain as string).length
    ).toBeLessThanOrEqual(8_192);
  });
});

describe("scrubPersistedPostHogState", () => {
  function instance(props: Record<string, unknown>) {
    return {
      persistence: {
        props,
        register(next: Record<string, unknown>) {
          Object.assign(this.props, next);
        },
        set_initial_person_info: vi.fn(),
      },
      sessionPersistence: {
        props: {
          $client_session_props: {
            sessionId: "s1",
            props: {
              u: `${ORIGIN}/en?sessionToken=session-secret`,
              r: "$direct",
            },
          },
        } as Record<string, unknown>,
        register(next: Record<string, unknown>) {
          Object.assign(this.props, next);
        },
      },
      get_session_id: vi.fn(),
      resetPersonPropertiesForFlags: vi.fn(function (this: {
        persistence: { props: Record<string, unknown> };
      }) {
        delete this.persistence.props.$stored_person_properties;
      }),
    };
  }

  it("clears stored person properties and sanitizes stored URLs", () => {
    const ph = instance({
      distinct_id: "user-1",
      $stored_person_properties: { email: "learner@example.com" },
      $initial_person_info: {
        u: `${ORIGIN}/en?dynamicOauthCode=oauth-secret&utm_source=x`,
        r: "https://accounts.google.com/?code=oauth-secret",
      },
    });

    scrubPersistedPostHogState(ph);

    expect(ph.persistence.props).toEqual({
      distinct_id: "user-1",
      $initial_person_info: {
        u: `${ORIGIN}/en?utm_source=x`,
        r: "https://accounts.google.com",
      },
    });
    expect(JSON.stringify(ph.sessionPersistence.props)).not.toContain(
      "session-secret"
    );
  });

  it("writes initial URLs first, so a later capture can't store a raw one", () => {
    const ph = instance({});

    scrubPersistedPostHogState(ph);

    expect(ph.persistence.set_initial_person_info).toHaveBeenCalledTimes(1);
    expect(ph.get_session_id).toHaveBeenCalledTimes(1);
  });

  it("does nothing on an instance with no persistence", () => {
    expect(() => scrubPersistedPostHogState({})).not.toThrow();
  });
});
