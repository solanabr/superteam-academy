// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { Keypair, SystemProgram, Transaction } from "@solana/web3.js";
import nacl from "tweetnacl";
import {
  createLabKeypair,
  labKeypairStorageKey,
  readLabKeypair,
} from "@/lib/solana/lab-keypair";
import { LabNotDevnetError } from "@/lib/solana/lab-signer";
import { useLabKey } from "../use-lab-key";

const h = vi.hoisted(() => ({
  userId: null as string | null,
  isLoading: false,
  devnet: true,
  labConnection: { name: "lab" },
  verifyLabDevnet: vi.fn<(connection: unknown) => Promise<boolean>>(),
}));

vi.mock("@/lib/auth/auth-provider", () => ({
  useAuth: () => ({ userId: h.userId, isLoading: h.isLoading }),
}));

vi.mock("@/lib/solana/lab-connection", () => ({
  useLabConnection: () => ({ connection: h.labConnection }),
}));

vi.mock("@/lib/solana/lab-guard", () => ({
  verifyLabDevnet: h.verifyLabDevnet,
}));

function transfer(from: Keypair): Transaction {
  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: from.publicKey,
      toPubkey: Keypair.generate().publicKey,
      lamports: 1,
    })
  );
  tx.feePayer = from.publicKey;
  tx.recentBlockhash = Keypair.generate().publicKey.toBase58();
  return tx;
}

beforeEach(() => {
  localStorage.clear();
  h.userId = "user-1";
  h.isLoading = false;
  h.devnet = true;
  h.verifyLabDevnet.mockReset();
  h.verifyLabDevnet.mockImplementation(async () => h.devnet);
});

afterEach(() => {
  vi.restoreAllMocks();
  // A forget is remembered for the page load, which here is the whole file.
  // A create clears it, and `beforeEach` then empties storage.
  for (const id of ["user-1", "user-2"]) createLabKeypair(id);
});

describe("useLabKey", () => {
  it("creates no key for a signed-out visitor", () => {
    h.userId = null;
    const { result } = renderHook(() => useLabKey());
    expect(result.current.status).toBe("signed-out");
    expect(result.current.signer).toBeNull();
    expect(result.current.address).toBeNull();
    expect(localStorage.length).toBe(0);
  });

  it("creates no key while sign-in is still resolving", () => {
    h.userId = null;
    h.isLoading = true;
    const { result } = renderHook(() => useLabKey());
    expect(result.current.status).toBe("resolving");
    expect(localStorage.length).toBe(0);
  });

  it("creates the signed-in user's key on first use and stores it", async () => {
    const { result } = renderHook(() => useLabKey());
    await waitFor(() => expect(result.current.status).toBe("ready"));
    const stored = readLabKeypair("user-1");
    expect(stored).not.toBeNull();
    expect(result.current.address).toBe(stored?.publicKey.toBase58());
    expect(result.current.signer?.publicKey.toBase58()).toBe(
      result.current.address
    );
  });

  it("gives the same key after a reload", async () => {
    const first = renderHook(() => useLabKey());
    await waitFor(() => expect(first.result.current.status).toBe("ready"));
    const address = first.result.current.address;
    first.unmount();

    const second = renderHook(() => useLabKey());
    await waitFor(() => expect(second.result.current.status).toBe("ready"));
    expect(second.result.current.address).toBe(address);
  });

  it("gives a second account on the same browser its own key", async () => {
    const first = renderHook(() => useLabKey());
    await waitFor(() => expect(first.result.current.status).toBe("ready"));
    const firstAddress = first.result.current.address;
    first.unmount();

    h.userId = "user-2";
    const second = renderHook(() => useLabKey());
    await waitFor(() => expect(second.result.current.status).toBe("ready"));
    expect(second.result.current.address).not.toBe(firstAddress);
    expect(readLabKeypair("user-1")?.publicKey.toBase58()).toBe(firstAddress);
  });

  it("keeps one signer object across renders", async () => {
    const { result, rerender } = renderHook(() => useLabKey());
    await waitFor(() => expect(result.current.status).toBe("ready"));
    const signer = result.current.signer;
    rerender();
    expect(result.current.signer).toBe(signer);
  });

  it("signs a transaction once the lab connection is known to be on devnet", async () => {
    const { result } = renderHook(() => useLabKey());
    await waitFor(() => expect(result.current.status).toBe("ready"));
    const key = readLabKeypair("user-1") as Keypair;

    const signed = await result.current.signer?.signTransaction(transfer(key));

    expect(h.verifyLabDevnet).toHaveBeenCalledWith(h.labConnection);
    expect(signed?.verifySignatures()).toBe(true);
  });

  it("signs nothing when the devnet check refuses", async () => {
    h.devnet = false;
    const { result } = renderHook(() => useLabKey());
    await waitFor(() => expect(result.current.status).toBe("ready"));
    const key = readLabKeypair("user-1") as Keypair;
    const signer = result.current.signer;
    const one = transfer(key);
    const batch = [transfer(key), transfer(key)];

    await expect(signer?.signTransaction(one)).rejects.toBeInstanceOf(
      LabNotDevnetError
    );
    await expect(signer?.signAllTransactions(batch)).rejects.toBeInstanceOf(
      LabNotDevnetError
    );
    await expect(
      signer?.signMessage(new Uint8Array([1, 2, 3]))
    ).rejects.toBeInstanceOf(LabNotDevnetError);

    for (const tx of [one, ...batch]) {
      expect(tx.signatures.every((s) => s.signature === null)).toBe(true);
    }
  });

  it("signs nothing when the devnet check fails", async () => {
    h.verifyLabDevnet.mockRejectedValue(new Error("rpc down"));
    const { result } = renderHook(() => useLabKey());
    await waitFor(() => expect(result.current.status).toBe("ready"));
    const tx = transfer(readLabKeypair("user-1") as Keypair);

    await expect(result.current.signer?.signTransaction(tx)).rejects.toThrow();
    expect(tx.signatures.every((s) => s.signature === null)).toBe(true);
  });

  it("signs a message with the lab key after the devnet check", async () => {
    const { result } = renderHook(() => useLabKey());
    await waitFor(() => expect(result.current.status).toBe("ready"));
    const key = readLabKeypair("user-1") as Keypair;
    const message = new TextEncoder().encode("hello");

    const signature = await result.current.signer?.signMessage(message);

    expect(
      nacl.sign.detached.verify(
        message,
        signature as Uint8Array,
        key.publicKey.toBytes()
      )
    ).toBe(true);
  });

  it("forgets the key and does not make a new one by itself", async () => {
    const { result } = renderHook(() => useLabKey());
    await waitFor(() => expect(result.current.status).toBe("ready"));

    act(() => result.current.forget());

    await waitFor(() => expect(result.current.status).toBe("missing"));
    expect(result.current.signer).toBeNull();
    expect(result.current.address).toBeNull();
    expect(localStorage.getItem(labKeypairStorageKey("user-1"))).toBeNull();
  });

  it("creates a new, different key on the next lab action after a forget", async () => {
    const { result } = renderHook(() => useLabKey());
    await waitFor(() => expect(result.current.status).toBe("ready"));
    const before = result.current.address;
    act(() => result.current.forget());
    await waitFor(() => expect(result.current.status).toBe("missing"));

    act(() => result.current.create());

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.address).not.toBe(before);
    expect(readLabKeypair("user-1")?.publicKey.toBase58()).toBe(
      result.current.address
    );
  });

  it("shows every reader of the key the same change", async () => {
    const a = renderHook(() => useLabKey());
    const b = renderHook(() => useLabKey());
    await waitFor(() => expect(a.result.current.status).toBe("ready"));
    await waitFor(() => expect(b.result.current.status).toBe("ready"));
    expect(b.result.current.address).toBe(a.result.current.address);

    act(() => a.result.current.forget());

    await waitFor(() => expect(b.result.current.status).toBe("missing"));
  });

  it("reports storage it cannot write to and hands out no key", async () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    const { result } = renderHook(() => useLabKey());
    await waitFor(() => expect(result.current.status).toBe("unavailable"));
    expect(result.current.signer).toBeNull();
  });
});
