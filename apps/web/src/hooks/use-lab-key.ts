"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { useAuth } from "@/lib/auth/auth-provider";
import { useLabConnection } from "@/lib/solana/lab-connection";
import {
  createLabKeypair,
  forgetLabKeypair,
  parseLabSecret,
  readStoredLabSecret,
  subscribeLabKeypair,
  wasLabKeypairForgotten,
} from "@/lib/solana/lab-keypair";
import { createLabSigner, type LabSigner } from "@/lib/solana/lab-signer";

/**
 * - `resolving`: sign-in is not known yet, or the key is being created.
 * - `signed-out`: nobody is signed in, so there is no key.
 * - `missing`: the learner forgot the key; `create()` makes a new one.
 * - `unavailable`: this browser's storage cannot keep a key.
 * - `ready`: `signer` and `address` are set.
 */
export type LabKeyStatus =
  | "resolving"
  | "signed-out"
  | "missing"
  | "unavailable"
  | "ready";

export interface LabKeyState {
  status: LabKeyStatus;
  /** Non-null exactly when `status` is `ready`. */
  signer: LabSigner | null;
  /** The lab key's full address. Non-null exactly when `status` is `ready`. */
  address: string | null;
  /** Makes the key if the signed-in user has none. A lab action calls it. */
  create: () => void;
  /** Deletes the key from this browser. It cannot be recovered. */
  forget: () => void;
}

const noSecret = () => null;

/**
 * The signed-in learner's lab keypair (`lib/solana/lab-keypair.ts`): the key
 * that pays for and signs the lab's devnet transactions. It is created the
 * first time a lab card mounts for a signed-in user, and read back from
 * browser storage after that. Mount it only for an enrolled learner.
 *
 * The signer signs only for the lab connection and only after its devnet
 * check. The secret key is not returned.
 */
export function useLabKey(): LabKeyState {
  const { userId, isLoading } = useAuth();
  const { connection } = useLabConnection();
  const [unavailable, setUnavailable] = useState(false);

  // The stored text is the snapshot: it is the same string until the key
  // changes, so the keypair and the signer below keep their identity.
  const stored = useSyncExternalStore(
    subscribeLabKeypair,
    () => (userId ? readStoredLabSecret(userId) : null),
    noSecret
  );
  const keypair = useMemo(() => parseLabSecret(stored), [stored]);

  const create = useCallback(() => {
    if (!userId) return;
    try {
      createLabKeypair(userId);
      setUnavailable(false);
    } catch {
      setUnavailable(true);
    }
  }, [userId]);

  const forget = useCallback(() => {
    if (userId) forgetLabKeypair(userId);
  }, [userId]);

  // First use. Not after a forget: the next lab action makes the new key.
  useEffect(() => {
    if (!userId || keypair || wasLabKeypairForgotten(userId)) return;
    create();
  }, [userId, keypair, create]);

  const signer = useMemo(
    () => (keypair ? createLabSigner(keypair, connection) : null),
    [keypair, connection]
  );

  const status: LabKeyStatus = isLoading
    ? "resolving"
    : !userId
      ? "signed-out"
      : signer
        ? "ready"
        : unavailable
          ? "unavailable"
          : wasLabKeypairForgotten(userId)
            ? "missing"
            : "resolving";

  return {
    status,
    signer: status === "ready" ? signer : null,
    address: status === "ready" && signer ? signer.publicKey.toBase58() : null,
    create,
    forget,
  };
}
