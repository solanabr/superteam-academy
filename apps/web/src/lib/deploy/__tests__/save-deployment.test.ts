import { describe, it, expect, vi } from "vitest";
import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import nacl from "tweetnacl";
import {
  signLabDeployProof,
  verifyLabDeployProof,
  type LabDeployProof,
} from "../lab-deploy-proof";
import {
  classifySaveResponse,
  saveDeploymentWithRetry,
  type SaveStatus,
} from "../save-deployment";

const CLAIM = {
  lessonId: "lesson-1",
  courseId: "course-solana-101",
  programId: "B7o8NfV81HzjuZFWQTTx3Xdvh77Dqoajwib3kWEnvzJF",
};

const PROOF: LabDeployProof = {
  labPublicKey: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
  signature: "signature",
  timestamp: 1_800_000_000_000,
};

const PARAMS = { ...CLAIM, signProof: async () => PROOF };

// No real backoff in tests — the schedule length still governs how many
// retries happen, but each "delay" resolves immediately.
const NO_DELAY = { delaysMs: [0, 0, 0], sleep: () => Promise.resolve() };

function fetchReturning(...statuses: (number | "network-error")[]) {
  const queue = [...statuses];
  const last = statuses[statuses.length - 1] ?? 200;
  return vi.fn(async () => {
    const next = queue.shift() ?? last;
    if (next === "network-error") throw new Error("offline");
    return { status: next, ok: next >= 200 && next < 300 } as Response;
  });
}

describe("classifySaveResponse", () => {
  it("maps 2xx to saved", () => {
    expect(classifySaveResponse(200)).toBe("saved");
    expect(classifySaveResponse(201)).toBe("saved");
  });

  it("maps 429 and 5xx and network errors to retryable", () => {
    expect(classifySaveResponse(429)).toBe("retryable");
    expect(classifySaveResponse(500)).toBe("retryable");
    expect(classifySaveResponse(503)).toBe("retryable");
    expect(classifySaveResponse(null)).toBe("retryable");
  });

  it("maps other 4xx (verification / wallet mismatch) to rejected", () => {
    expect(classifySaveResponse(400)).toBe("rejected");
    expect(classifySaveResponse(401)).toBe("rejected");
  });
});

describe("saveDeploymentWithRetry", () => {
  it("returns saved on a first-try 200 and reports saving → saved", async () => {
    const fetchImpl = fetchReturning(200);
    const statuses: SaveStatus[] = [];
    const outcome = await saveDeploymentWithRetry(PARAMS, {
      ...NO_DELAY,
      fetchImpl,
      onStatus: (s) => statuses.push(s),
    });
    expect(outcome).toBe("saved");
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(statuses).toEqual(["saving", "saved"]);
  });

  it("retries transient failures then succeeds", async () => {
    const fetchImpl = fetchReturning(503, "network-error", 200);
    const statuses: SaveStatus[] = [];
    const outcome = await saveDeploymentWithRetry(PARAMS, {
      ...NO_DELAY,
      fetchImpl,
      onStatus: (s) => statuses.push(s),
    });
    expect(outcome).toBe("saved");
    expect(fetchImpl).toHaveBeenCalledTimes(3);
    expect(statuses).toEqual(["saving", "retrying", "retrying", "saved"]);
  });

  it("gives up as retryable after the backoff schedule is exhausted", async () => {
    const fetchImpl = fetchReturning(503);
    const outcome = await saveDeploymentWithRetry(PARAMS, {
      ...NO_DELAY,
      fetchImpl,
    });
    expect(outcome).toBe("retryable");
    // initial attempt + 3 scheduled retries
    expect(fetchImpl).toHaveBeenCalledTimes(4);
  });

  it("does NOT retry a 400 rejection — one attempt, terminal", async () => {
    const fetchImpl = fetchReturning(400);
    const statuses: SaveStatus[] = [];
    const outcome = await saveDeploymentWithRetry(PARAMS, {
      ...NO_DELAY,
      fetchImpl,
      onStatus: (s) => statuses.push(s),
    });
    expect(outcome).toBe("rejected");
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(statuses).toEqual(["saving", "rejected"]);
  });

  it("aborts before the first attempt when cancelled", async () => {
    const fetchImpl = fetchReturning(200);
    const outcome = await saveDeploymentWithRetry(PARAMS, {
      ...NO_DELAY,
      fetchImpl,
      isCancelled: () => true,
    });
    expect(outcome).toBe("retryable");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("POSTs the claim and the proof, and nothing else", async () => {
    const fetchImpl = fetchReturning(200);
    await saveDeploymentWithRetry(PARAMS, { ...NO_DELAY, fetchImpl });
    const [, init] = (fetchImpl.mock.calls[0] ?? []) as unknown as [
      string,
      RequestInit,
    ];
    expect(JSON.parse(init.body as string)).toEqual({ ...CLAIM, ...PROOF });
  });

  it("signs a new proof for each attempt, so a late retry is not stale", async () => {
    const fetchImpl = fetchReturning(503, 503, 200);
    let stamp = 0;
    const signProof = vi.fn(async () => ({ ...PROOF, timestamp: ++stamp }));
    await saveDeploymentWithRetry(
      { ...CLAIM, signProof },
      { ...NO_DELAY, fetchImpl }
    );
    expect(signProof).toHaveBeenCalledTimes(3);
    const stamps = fetchImpl.mock.calls.map((call) => {
      const [, init] = call as unknown as [string, RequestInit];
      return (JSON.parse(init.body as string) as LabDeployProof).timestamp;
    });
    expect(stamps).toEqual([1, 2, 3]);
  });

  it("sends nothing and stays retryable when the proof cannot be signed", async () => {
    const fetchImpl = fetchReturning(200);
    const statuses: SaveStatus[] = [];
    const outcome = await saveDeploymentWithRetry(
      {
        ...CLAIM,
        signProof: async () => {
          throw new Error("no lab key");
        },
      },
      { ...NO_DELAY, fetchImpl, onStatus: (s) => statuses.push(s) }
    );
    expect(outcome).toBe("retryable");
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(statuses).toEqual(["saving", "retryable"]);
  });
});

describe("what the save request sends", () => {
  const labKey = Keypair.generate();
  const secret = labKey.secretKey;
  const seed = secret.slice(0, 32);

  /** Every text form a leaked secret could take. */
  function secretForms(): string[] {
    const forms: string[] = [];
    for (const bytes of [secret, seed]) {
      forms.push(bs58.encode(bytes));
      forms.push(Buffer.from(bytes).toString("hex"));
      forms.push(Buffer.from(bytes).toString("base64"));
      forms.push(Buffer.from(bytes).toString("base64url"));
      forms.push(JSON.stringify(Array.from(bytes)));
      forms.push(Array.from(bytes).join(","));
    }
    return forms;
  }

  async function capture() {
    const fetchImpl = fetchReturning(200);
    await saveDeploymentWithRetry(
      {
        ...CLAIM,
        signProof: () =>
          signLabDeployProof(
            { userId: "user-1", ...CLAIM },
            {
              publicKey: labKey.publicKey,
              signMessage: async (message) =>
                nacl.sign.detached(message, labKey.secretKey),
            }
          ),
      },
      { ...NO_DELAY, fetchImpl }
    );
    const [url, init] = (fetchImpl.mock.calls[0] ?? []) as unknown as [
      string,
      RequestInit,
    ];
    return { url, init, body: init.body as string };
  }

  it("never carries the lab secret key in the URL, the headers or the body", async () => {
    const { url, init, body } = await capture();
    const sent = [url, JSON.stringify(init.headers), body].join("\n");
    for (const form of secretForms()) {
      expect(sent).not.toContain(form);
    }
  });

  it("carries only the claim, the public key, the signature and the timestamp", async () => {
    const { url, init, body } = await capture();
    expect(url).toBe("/api/deploy/save");
    expect(init.headers).toEqual({ "Content-Type": "application/json" });
    const parsed = JSON.parse(body) as Record<string, unknown>;
    expect(Object.keys(parsed).sort()).toEqual([
      "courseId",
      "labPublicKey",
      "lessonId",
      "programId",
      "signature",
      "timestamp",
    ]);
    expect(parsed.labPublicKey).toBe(labKey.publicKey.toBase58());
    // No field is long enough to hold the 64-byte secret except the
    // signature, and the signature verifies as a signature.
    expect(
      verifyLabDeployProof({ userId: "user-1", ...CLAIM }, parsed).ok
    ).toBe(true);
  });
});
