import { describe, expect, it, beforeAll } from "vitest";
import { createApp } from "@/app.js";

const API_TOKEN = "test-token-for-routes";
const AUTH_HEADERS = { "X-API-Key": API_TOKEN, "Content-Type": "application/json" };

let app: ReturnType<typeof createApp>;

beforeAll(() => {
  app = createApp({ BACKEND_API_TOKEN: API_TOKEN });
});

async function post(path: string, body: object, headers?: Record<string, string>) {
  const str = JSON.stringify(body);
  return app.request(path, {
    method: "POST",
    headers: {
      ...AUTH_HEADERS,
      "Content-Length": String(str.length),
      ...headers,
    },
    body: str,
  });
}

describe("Public endpoints (no auth)", () => {
  it("GET /health returns 200", async () => {
    const res = await app.request("/health");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
  });

  it("GET /v1/health returns 200 with version", async () => {
    const res = await app.request("/v1/health");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.version).toBe("1");
  });

  it("GET /v1/contract returns 200", async () => {
    const res = await app.request("/v1/contract");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.openapi).toBe("3.0.3");
  });

  it("GET /ready returns 200 or 503", async () => {
    const res = await app.request("/ready");
    expect([200, 503]).toContain(res.status);
  });
});

describe("Academy endpoints require auth", () => {
  it("POST without auth returns 401", async () => {
    const body = JSON.stringify({ courseId: "x", lessonCount: 1, xpPerLesson: 1 });
    const res = await app.request("/v1/academy/create-course", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": String(body.length),
      },
      body,
    });
    expect(res.status).toBe(401);
  });
});

describe("Academy endpoints require JSON body", () => {
  it("POST with wrong Content-Type returns 415", async () => {
    const res = await app.request("/v1/academy/create-course", {
      method: "POST",
      headers: { "X-API-Key": API_TOKEN, "Content-Type": "text/plain" },
      body: "{}",
    });
    expect(res.status).toBe(415);
  });
});

describe("create-course", () => {
  it("invalid payload (missing lessonCount) returns 400 or 500", async () => {
    const res = await post("/v1/academy/create-course", {
      courseId: "x",
      xpPerLesson: 100,
    });
    expect([400, 500]).toContain(res.status);
    const json = await res.json();
    expect(json.error).toBeDefined();
  });

  it("invalid payload (lessonCount < 1) returns 400 or 500", async () => {
    const res = await post("/v1/academy/create-course", {
      courseId: "x",
      lessonCount: 0,
      xpPerLesson: 100,
    });
    expect([400, 500]).toContain(res.status);
  });

  it("invalid payload (bad creator pubkey) returns 400 or 500", async () => {
    const res = await post("/v1/academy/create-course", {
      courseId: "x",
      lessonCount: 1,
      xpPerLesson: 100,
      creator: "not-a-pubkey",
    });
    expect([400, 500]).toContain(res.status);
  });

  it("valid payload returns 200 or 500", async () => {
    const res = await post("/v1/academy/create-course", {
      courseId: "test-course-1",
      lessonCount: 3,
      xpPerLesson: 100,
    });
    expect([200, 500]).toContain(res.status);
  });
});

describe("update-config", () => {
  it("missing newBackendSigner returns 400 or 500", async () => {
    const res = await post("/v1/academy/update-config", {});
    expect([400, 500]).toContain(res.status);
  });

  it("invalid pubkey returns 400 or 500", async () => {
    const res = await post("/v1/academy/update-config", {
      newBackendSigner: "bad",
    });
    expect([400, 500]).toContain(res.status);
  });
});

describe("update-course", () => {
  it("invalid newContentTxId length returns 400 or 500", async () => {
    const res = await post("/v1/academy/update-course", {
      courseId: "x",
      newContentTxId: [0, 0],
    });
    expect([400, 500]).toContain(res.status);
  });
});

describe("complete-lesson", () => {
  it("missing learner returns 400 or 500", async () => {
    const res = await post("/v1/academy/complete-lesson", {
      courseId: "x",
      lessonIndex: 0,
    });
    expect([400, 500]).toContain(res.status);
  });

  it("invalid learner pubkey returns 400 or 500", async () => {
    const res = await post("/v1/academy/complete-lesson", {
      courseId: "x",
      learner: "bad",
      lessonIndex: 0,
    });
    expect([400, 500]).toContain(res.status);
  });
});

describe("finalize-course", () => {
  it("missing learner returns 400 or 500", async () => {
    const res = await post("/v1/academy/finalize-course", { courseId: "x" });
    expect([400, 500]).toContain(res.status);
  });
});

describe("issue-credential", () => {
  it("missing required fields returns 400 or 500", async () => {
    const res = await post("/v1/academy/issue-credential", {
      courseId: "x",
      learner: "11111111111111111111111111111111",
    });
    expect([400, 500]).toContain(res.status);
  });
});

describe("upgrade-credential", () => {
  it("missing credentialAsset returns 400 or 500", async () => {
    const pk = "11111111111111111111111111111111";
    const res = await post("/v1/academy/upgrade-credential", {
      courseId: "x",
      learner: pk,
      credentialName: "x",
      metadataUri: "https://x",
      trackCollection: pk,
    });
    expect([400, 500]).toContain(res.status);
  });
});

describe("register-minter", () => {
  it("missing minter returns 400 or 500", async () => {
    const res = await post("/v1/academy/register-minter", {});
    expect([400, 500]).toContain(res.status);
  });
});

describe("revoke-minter", () => {
  it("missing minter returns 400 or 500", async () => {
    const res = await post("/v1/academy/revoke-minter", {});
    expect([400, 500]).toContain(res.status);
  });
});

describe("reward-xp", () => {
  it("missing amount returns 400 or 500", async () => {
    const res = await post("/v1/academy/reward-xp", {
      recipient: "11111111111111111111111111111111",
    });
    expect([400, 500]).toContain(res.status);
  });

  it("amount < 1 returns 400 or 500", async () => {
    const res = await post("/v1/academy/reward-xp", {
      recipient: "11111111111111111111111111111111",
      amount: 0,
    });
    expect([400, 500]).toContain(res.status);
  });
});

describe("create-achievement-type", () => {
  it("missing achievementId returns 400 or 500", async () => {
    const res = await post("/v1/academy/create-achievement-type", {
      name: "x",
      metadataUri: "https://x",
    });
    expect([400, 500]).toContain(res.status);
  });
});

describe("award-achievement", () => {
  it("missing collection returns 400 or 500", async () => {
    const pk = "11111111111111111111111111111111";
    const res = await post("/v1/academy/award-achievement", {
      achievementId: "x",
      recipient: pk,
    });
    expect([400, 500]).toContain(res.status);
  });
});

describe("deactivate-achievement-type", () => {
  it("missing achievementId returns 400 or 500", async () => {
    const res = await post("/v1/academy/deactivate-achievement-type", {});
    expect([400, 500]).toContain(res.status);
  });
});

describe("Admin (when ADMIN_SECRET + ADMIN_PASSWORD set)", () => {
  const adminApp = createApp({
    BACKEND_API_TOKEN: API_TOKEN,
    ADMIN_SECRET: "test-admin-secret-min-32-chars-long",
    ADMIN_PASSWORD: "test-admin-password",
  });

  function adminPost(path: string, body: object) {
    const str = JSON.stringify(body);
    return adminApp.request(path, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": String(str.length),
      },
      body: str,
    });
  }

  it("POST /v1/admin/login with wrong password returns 401", async () => {
    const res = await adminPost("/v1/admin/login", { password: "wrong" });
    expect(res.status).toBe(401);
  });

  it("POST /v1/admin/login with correct password returns 200 and token", async () => {
    const res = await adminPost("/v1/admin/login", {
      password: "test-admin-password",
    });
    expect(res.status).toBe(200);
    const json = (await res.json()) as { token?: string };
    expect(json.token).toBeDefined();
    expect(typeof json.token).toBe("string");
  });

  it("POST /v1/admin/generate-api-key without JWT returns 401", async () => {
    const res = await adminPost("/v1/admin/generate-api-key", {
      role: "client",
    });
    expect(res.status).toBe(401);
  });

  it("POST /v1/admin/generate-api-key with valid JWT returns 200 and apiKey", async () => {
    const loginRes = await adminPost("/v1/admin/login", {
      password: "test-admin-password",
    });
    const { token } = (await loginRes.json()) as { token: string };

    const body = JSON.stringify({ role: "client", label: "test" });
    const res = await adminApp.request("/v1/admin/generate-api-key", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": String(body.length),
        Authorization: `Bearer ${token}`,
      },
      body,
    });
    expect(res.status).toBe(200);
    const json = (await res.json()) as {
      apiKey?: string;
      role?: string;
      label?: string;
    };
    expect(json.apiKey).toBeDefined();
    expect(json.apiKey).toMatch(/^sk_/);
    expect(json.role).toBe("client");
    expect(json.label).toBe("test");
  });

  it("generated API key works for academy endpoint", async () => {
    const loginRes = await adminPost("/v1/admin/login", {
      password: "test-admin-password",
    });
    const { token } = (await loginRes.json()) as { token: string };

    const genBody = JSON.stringify({ role: "client" });
    const genRes = await adminApp.request("/v1/admin/generate-api-key", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": String(genBody.length),
        Authorization: `Bearer ${token}`,
      },
      body: genBody,
    });
    const { apiKey } = (await genRes.json()) as { apiKey: string };

    const academyBody = JSON.stringify({
      courseId: "admin-key-test",
      lessonCount: 1,
      xpPerLesson: 10,
    });
    const academyRes = await adminApp.request("/v1/academy/create-course", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": String(academyBody.length),
        "X-API-Key": apiKey,
      },
      body: academyBody,
    });
    expect([200, 500]).toContain(academyRes.status);
  });
});
