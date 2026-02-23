"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  PublicKey,
  Transaction,
  TransactionInstruction,
  SystemProgram,
} from "@solana/web3.js";
import {
  TOKEN_2022_PROGRAM_ID,
  PROGRAM_ID,
  getConfigPda,
  getCoursePda,
  getEnrollmentPda,
} from "@/lib/solana/program";
import { toast } from "sonner";
import { trackEvent } from "@/components/providers/analytics-provider";

/**
 * Read XP balance from Token-2022 ATA (soulbound).
 * Uses the provided wallet address for reads — NOT the connected wallet.
 */
export function useOnChainXP(walletAddress?: string | null) {
  const { connection } = useConnection();
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const owner = useMemo(
    () => (walletAddress ? new PublicKey(walletAddress) : null),
    [walletAddress]
  );

  const xpMint = useMemo(
    () =>
      new PublicKey(
        process.env.NEXT_PUBLIC_XP_MINT ??
          "XPTkMWRRH1QLbAYGSkwNmmHF8Q75RURmC269nHVhUoe"
      ),
    []
  );

  const ata = useMemo(() => {
    if (!owner) return null;
    const [addr] = PublicKey.findProgramAddressSync(
      [
        owner.toBuffer(),
        TOKEN_2022_PROGRAM_ID.toBuffer(),
        xpMint.toBuffer(),
      ],
      new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL")
    );
    return addr;
  }, [owner, xpMint]);

  const refresh = useCallback(async () => {
    if (!ata) {
      setBalance(0);
      setLoading(false);
      return;
    }
    try {
      const info = await connection.getTokenAccountBalance(ata);
      setBalance(Number(info.value.amount));
    } catch {
      setBalance(0);
    } finally {
      setLoading(false);
    }
  }, [connection, ata]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { balance, loading, refresh };
}

/**
 * Read on-chain enrollment status for a course.
 * Uses the provided wallet address for reads — NOT the connected wallet.
 */
export function useOnChainEnrollment(courseId: string, walletAddress?: string | null) {
  const { connection } = useConnection();
  const [enrolled, setEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);

  const owner = useMemo(
    () => (walletAddress ? new PublicKey(walletAddress) : null),
    [walletAddress]
  );

  useEffect(() => {
    if (!owner || !courseId) {
      setEnrolled(false);
      setLoading(false);
      return;
    }

    const enrollmentPda = getEnrollmentPda(courseId, owner);
    connection
      .getAccountInfo(enrollmentPda)
      .then((info) => {
        setEnrolled(info !== null);
      })
      .catch(() => setEnrolled(false))
      .finally(() => setLoading(false));
  }, [connection, owner, courseId]);

  return { enrolled, loading };
}

/**
 * Send and confirm a transaction with wallet
 */
export function useSendTransaction() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();

  const send = useCallback(
    async (
      instructions: TransactionInstruction[],
      opts?: { description?: string }
    ) => {
      if (!publicKey) throw new Error("Wallet not connected");

      const tx = new Transaction().add(...instructions);
      tx.feePayer = publicKey;
      tx.recentBlockhash = (
        await connection.getLatestBlockhash()
      ).blockhash;

      const sig = await sendTransaction(tx, connection);

      // Confirm
      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash();
      await connection.confirmTransaction(
        { signature: sig, blockhash, lastValidBlockHeight },
        "confirmed"
      );

      toast.success(opts?.description ?? "Transaction confirmed", {
        description: `${sig.slice(0, 8)}...`,
        action: {
          label: "View",
          onClick: () =>
            window.open(
              `https://explorer.solana.com/tx/${sig}?cluster=devnet`,
              "_blank"
            ),
        },
      });

      return sig;
    },
    [connection, publicKey, sendTransaction]
  );

  return { send, ready: !!publicKey };
}

/**
 * Build and send on-chain enrollment transaction
 */
export function useEnrollOnChain() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [enrolling, setEnrolling] = useState(false);

  const enrollOnChain = useCallback(
    async (courseId: string) => {
      if (!publicKey) throw new Error("Wallet not connected");

      setEnrolling(true);
      try {
        const coursePda = getCoursePda(courseId);
        const enrollmentPda = getEnrollmentPda(courseId, publicKey);

        // Anchor discriminator for "enroll" from IDL
        const discriminator = Buffer.from([
          58, 12, 36, 3, 142, 28, 1, 43,
        ]);

        // Encode course_id as Borsh string: 4-byte LE length + UTF-8 bytes
        const courseIdBytes = Buffer.from(courseId, "utf-8");
        const lenBuf = Buffer.alloc(4);
        lenBuf.writeUInt32LE(courseIdBytes.length);
        const data = Buffer.concat([discriminator, lenBuf, courseIdBytes]);

        const ix = new TransactionInstruction({
          programId: PROGRAM_ID,
          keys: [
            { pubkey: coursePda, isSigner: false, isWritable: true },
            { pubkey: enrollmentPda, isSigner: false, isWritable: true },
            { pubkey: publicKey, isSigner: true, isWritable: true },
            {
              pubkey: SystemProgram.programId,
              isSigner: false,
              isWritable: false,
            },
          ],
          data,
        });

        const tx = new Transaction().add(ix);
        tx.feePayer = publicKey;
        tx.recentBlockhash = (
          await connection.getLatestBlockhash()
        ).blockhash;

        const sig = await sendTransaction(tx, connection);

        const { blockhash, lastValidBlockHeight } =
          await connection.getLatestBlockhash();
        await connection.confirmTransaction(
          { signature: sig, blockhash, lastValidBlockHeight },
          "confirmed"
        );

        trackEvent("enrollment_onchain", { courseId });

        toast.success("Enrolled on-chain!", {
          description: `${sig.slice(0, 8)}...`,
          action: {
            label: "View",
            onClick: () =>
              window.open(
                `https://explorer.solana.com/tx/${sig}?cluster=devnet`,
                "_blank"
              ),
          },
        });

        return sig;
      } finally {
        setEnrolling(false);
      }
    },
    [connection, publicKey, sendTransaction]
  );

  return { enrollOnChain, enrolling, ready: !!publicKey };
}

/**
 * Fetch Metaplex Core credential NFTs via Helius DAS API.
 * Uses the provided wallet address for reads — NOT the connected wallet.
 */
export function useOnChainCredentials(walletAddress?: string | null) {
  const [credentials, setCredentials] = useState<
    Array<{
      id: string;
      name: string;
      image: string;
      uri: string;
      attributes: Record<string, string>;
    }>
  >([]);
  const [loading, setLoading] = useState(true);

  const heliusUrl =
    process.env.NEXT_PUBLIC_HELIUS_RPC ??
    `https://devnet.helius-rpc.com/?api-key=${process.env.NEXT_PUBLIC_HELIUS_API_KEY ?? ""}`;

  useEffect(() => {
    if (!walletAddress) {
      setCredentials([]);
      setLoading(false);
      return;
    }

    const collectionAddress =
      process.env.NEXT_PUBLIC_CREDENTIAL_COLLECTION ?? "";
    if (!collectionAddress) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const res = await fetch(heliusUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: "credentials",
            method: "getAssetsByOwner",
            params: {
              ownerAddress: walletAddress,
              page: 1,
              limit: 50,
            },
          }),
        });

        const data = await res.json();
        const items = data.result?.items ?? [];

        const creds = items
          .filter(
            (item: { grouping?: Array<{ group_value?: string }> }) =>
              item.grouping?.[0]?.group_value === collectionAddress
          )
          .map(
            (item: {
              id: string;
              content: {
                metadata?: { name?: string; attributes?: Array<{ trait_type: string; value: string | number }> };
                links?: { image?: string };
                json_uri?: string;
              };
              plugins?: {
                attributes?: {
                  data?: {
                    attribute_list?: Array<{ key: string; value: string }>;
                  };
                };
              };
            }) => {
              // On-chain plugin attributes (canonical source)
              const pluginAttrs = Object.fromEntries(
                (item.plugins?.attributes?.data?.attribute_list ?? []).map(
                  (a: { key: string; value: string }) => [a.key, a.value]
                )
              );

              // Image: filter out broken og.png URLs cached by DAS
              let image = item.content?.links?.image ?? "";
              if (!image || image.endsWith("/og.png")) {
                const jsonUri = item.content?.json_uri ?? "";
                const match = jsonUri.match(/\/api\/metadata\/credential\/([^/?]+)/);
                if (match) {
                  image = `/api/metadata/credential/${match[1]}?imageOnly=true`;
                } else {
                  image = "";
                }
              }

              return {
                id: item.id,
                name: item.content?.metadata?.name ?? "Credential",
                image,
                uri: item.content?.json_uri ?? "",
                attributes: pluginAttrs,
              };
            }
          );

        setCredentials(creds);
      } catch {
        setCredentials([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [walletAddress, heliusUrl]);

  return { credentials, loading };
}

/**
 * Read program Config account
 */
export function useOnChainConfig() {
  const { connection } = useConnection();
  const [config, setConfig] = useState<{
    authority: string;
    xpMint: string;
    backendSigner: string;
    courseCount: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const configPda = getConfigPda();
    connection
      .getAccountInfo(configPda)
      .then((info) => {
        if (!info?.data) {
          setConfig(null);
          return;
        }
        // Parse config (skip 8-byte discriminator)
        const data = info.data;
        if (data.length < 8 + 32 * 3 + 4) {
          setConfig(null);
          return;
        }
        const authority = new PublicKey(data.subarray(8, 40)).toBase58();
        const xpMint = new PublicKey(data.subarray(40, 72)).toBase58();
        const backendSigner = new PublicKey(data.subarray(72, 104)).toBase58();
        const courseCount = data.readUInt32LE(104);
        setConfig({ authority, xpMint, backendSigner, courseCount });
      })
      .catch(() => setConfig(null))
      .finally(() => setLoading(false));
  }, [connection]);

  return { config, loading };
}
