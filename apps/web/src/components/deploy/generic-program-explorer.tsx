"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import type { WalletName } from "@solana/wallet-adapter-base";
import {
  Transaction,
  TransactionInstruction,
  PublicKey,
} from "@solana/web3.js";
import { BorshInstructionCoder, BorshCoder, BN } from "@coral-xyz/anchor";
import type { Idl } from "@coral-xyz/anchor";
import { useTranslations } from "next-intl";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  isWalletKeyringError,
  isUserRejection,
} from "@/lib/solana/wallet-errors";
import {
  extractCustomErrorCode,
  resolveIdlError,
  type ProgramError,
} from "@/lib/solana/parse-program-error";
import {
  resolveAllAccounts,
  type IdlAccountDef,
  type ResolvedAccount,
} from "@/lib/solana/account-resolver";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GenericProgramExplorerProps {
  /** Raw IDL JSON string from Sanity */
  idlJson: string;
  courseSlug: string;
  courseId: string;
}

interface TxHistoryEntry {
  instruction: string;
  signature: string;
  logs: string[];
  success: boolean;
  timestamp: number;
}

interface ArgValue {
  name: string;
  type: string;
  value: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const EXPLORER_BASE = "https://explorer.solana.com";

function truncateAddress(addr: string): string {
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

/** Convert camelCase to Title Case: "initializeCounter" → "Initialize Counter" */
function formatInstructionName(name: string): string {
  const spaced = name.replace(/([A-Z])/g, " $1");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/**
 * Convert a string arg value to the appropriate type for BorshInstructionCoder.
 * Handles u64/i64/u128/i128 as BN, smaller ints as number, booleans, PublicKeys.
 */
function coerceArgValue(
  value: string,
  idlType: string
): number | BN | boolean | PublicKey | string {
  switch (idlType) {
    case "u8":
    case "u16":
    case "u32":
    case "i8":
    case "i16":
    case "i32":
      return Number(value);
    case "u64":
    case "i64":
    case "u128":
    case "i128":
      return new BN(value);
    case "bool":
      return value === "true";
    case "publicKey":
      return new PublicKey(value);
    default:
      return value;
  }
}

/** Check if an IDL arg type is numeric */
function isNumericType(t: string): boolean {
  return /^[ui](8|16|32|64|128)$/.test(t);
}

/** Check if an IDL arg type needs BN (> 32 bits) */
function isBigNumType(t: string): boolean {
  return /^[ui](64|128)$/.test(t);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function GenericProgramExplorer({
  idlJson,
  courseSlug,
  courseId,
}: GenericProgramExplorerProps) {
  const t = useTranslations("deploy.explorer");
  const { publicKey, signTransaction, disconnect, wallet, select } =
    useWallet();
  const { connection } = useConnection();
  const { setVisible: openWalletModal } = useWalletModal();
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [pendingReconnectWallet, setPendingReconnectWallet] =
    useState<WalletName | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const executingRef = useRef(false);
  const MAX_RECONNECT_ATTEMPTS = 3;

  // Parse IDL
  const idl = useMemo<Idl | null>(() => {
    try {
      const parsed = JSON.parse(idlJson);
      if (!Array.isArray(parsed.instructions) || !parsed.metadata?.name) {
        return null;
      }
      return parsed as Idl;
    } catch {
      return null;
    }
  }, [idlJson]);

  const programName = useMemo(
    () =>
      (idl as { metadata?: { name?: string } } | null)?.metadata?.name ?? "",
    [idl]
  );
  const storagePrefix = `${programName}-${courseSlug}`;

  // Instruction coder (singleton per IDL)
  const instructionCoder = useMemo(() => {
    if (!idl) return null;
    try {
      return new BorshInstructionCoder(
        idl as unknown as ConstructorParameters<typeof BorshInstructionCoder>[0]
      );
    } catch {
      return null;
    }
  }, [idl]);

  // Account coder for deserialization
  const accountCoder = useMemo(() => {
    if (!idl) return null;
    try {
      return new BorshCoder(
        idl as unknown as ConstructorParameters<typeof BorshCoder>[0]
      );
    } catch {
      return null;
    }
  }, [idl]);

  // State
  const [programId, setProgramId] = useState<string | null>(null);
  const [txHistory, setTxHistory] = useState<TxHistoryEntry[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [activeInstruction, setActiveInstruction] = useState<string | null>(
    null
  );
  const [argValues, setArgValues] = useState<Record<string, ArgValue[]>>({});
  const [manualAccounts, setManualAccounts] = useState<
    Record<string, Record<string, string>>
  >({});
  const [programError, setProgramError] = useState<ProgramError | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [walletError, setWalletError] = useState(false);
  // Account data display
  const [accountData, setAccountData] = useState<Record<
    string,
    Record<string, unknown>
  > | null>(null);
  const [accountDataLoading, setAccountDataLoading] = useState(false);
  const [lastFetchedAt, setLastFetchedAt] = useState(0);
  const [expandedTx, setExpandedTx] = useState<string | null>(null);

  const txEndRef = useRef<HTMLDivElement>(null);

  // Clear stale errors when wallet reconnects (covers external reconnection
  // through browser extension, not just our handleReconnectWallet button)
  useEffect(() => {
    if (publicKey) {
      setWalletError(false);
      setErrorMessage(null);
      setProgramError(null);
      reconnectAttemptsRef.current = 0;
    }
  }, [publicKey]);

  // State-driven reconnection: after select(null) deselects the adapter,
  // re-select the remembered wallet once the provider reflects the change.
  useEffect(() => {
    if (pendingReconnectWallet && !wallet) {
      select(pendingReconnectWallet);
      setPendingReconnectWallet(null);
      setIsReconnecting(false);
    }
  }, [pendingReconnectWallet, wallet, select]);

  // Safety timeout: if reconnection doesn't complete within 5s, give up
  // and let the user trigger it manually.
  useEffect(() => {
    if (!pendingReconnectWallet) return;
    const timeout = setTimeout(() => {
      setPendingReconnectWallet(null);
      setIsReconnecting(false);
      setWalletError(true);
    }, 5000);
    return () => clearTimeout(timeout);
  }, [pendingReconnectWallet]);

  // ---------------------------------------------------------------------------
  // Load program ID
  // ---------------------------------------------------------------------------

  useEffect(() => {
    try {
      const stored = localStorage.getItem(`program-${courseSlug}`);
      if (stored) setProgramId(stored);
    } catch {
      // non-critical
    }

    async function checkServer() {
      try {
        const res = await fetch(
          `/api/deploy/save?courseId=${encodeURIComponent(courseId)}`
        );
        if (!res.ok) return;
        const data = await res.json();
        if (data.deployed && data.programId) {
          setProgramId(data.programId);
          try {
            localStorage.setItem(`program-${courseSlug}`, data.programId);
          } catch {
            // non-critical
          }
        }
      } catch {
        // non-critical
      }
    }
    checkServer();
  }, [courseSlug, courseId]);

  // Auto-scroll tx history
  useEffect(() => {
    txEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [txHistory]);

  // ---------------------------------------------------------------------------
  // Fetch account data (generic — uses BorshCoder)
  // ---------------------------------------------------------------------------

  const fetchAccountData = useCallback(
    async (accountPubkey: PublicKey, accountTypeName: string) => {
      if (!connection || !accountCoder) return;

      setAccountDataLoading(true);
      try {
        const info = await connection.getAccountInfo(accountPubkey);
        if (!info) {
          setAccountData(null);
          return;
        }

        try {
          const decoded = accountCoder.accounts.decode(
            accountTypeName,
            Buffer.from(info.data)
          );
          // Convert BN values to strings for display
          const displayData: Record<string, unknown> = {};
          for (const [key, val] of Object.entries(
            decoded as Record<string, unknown>
          )) {
            if (
              val !== null &&
              typeof val === "object" &&
              "toString" in val &&
              val instanceof BN
            ) {
              displayData[key] = (val as BN).toString();
            } else if (
              val !== null &&
              typeof val === "object" &&
              val instanceof PublicKey
            ) {
              displayData[key] = (val as PublicKey).toBase58();
            } else {
              displayData[key] = val;
            }
          }
          setAccountData({ [accountTypeName]: displayData });
        } catch {
          // If BorshCoder fails, show raw hex
          setAccountData(null);
        }
        setLastFetchedAt(Date.now());
      } catch {
        // fetch failed
      } finally {
        setAccountDataLoading(false);
      }
    },
    [connection, accountCoder]
  );

  // ---------------------------------------------------------------------------
  // Wallet reconnect handler
  // ---------------------------------------------------------------------------

  // Fully reset the adapter to clear Phantom's stale keyring session.
  // select(null) drops the stale adapter; the state-driven useEffect
  // on pendingReconnectWallet re-selects it once the provider reflects
  // the deselection, triggering a fresh autoConnect with a new keyring.
  const handleReconnectWallet = useCallback(async () => {
    if (isReconnecting) return;
    setIsReconnecting(true);

    const walletName = wallet?.adapter.name ?? null;

    // Clear transaction-related errors; walletError is managed by
    // reconnection outcome (publicKey useEffect clears it on success).
    setErrorMessage(null);
    setProgramError(null);

    try {
      await disconnect();
    } catch {
      // ignore — adapter may already be disconnected
    }

    // Fully deselect the adapter so the provider drops the stale instance.
    select(null);

    if (walletName) {
      setPendingReconnectWallet(walletName);
    } else {
      // No wallet was previously selected — fall back to the modal
      setIsReconnecting(false);
      openWalletModal(true);
    }
  }, [disconnect, wallet, select, openWalletModal, isReconnecting]);

  // ---------------------------------------------------------------------------
  // Execute instruction
  // ---------------------------------------------------------------------------

  const executeInstruction = useCallback(
    async (ixName: string) => {
      if (
        !publicKey ||
        !signTransaction ||
        !programId ||
        !idl ||
        !instructionCoder
      )
        return;

      if (executingRef.current) return;
      executingRef.current = true;

      setIsExecuting(true);
      setErrorMessage(null);
      setProgramError(null);

      try {
        // Find the instruction definition in the IDL
        const ixDef = (
          idl as {
            instructions: {
              name: string;
              accounts: IdlAccountDef[];
              args: { name: string; type: string }[];
            }[];
          }
        ).instructions.find((ix) => ix.name === ixName);
        if (!ixDef) throw new Error(`Unknown instruction: ${ixName}`);

        // Build args object
        const args: Record<string, unknown> = {};
        const currentArgs = argValues[ixName] ?? [];
        for (const argDef of ixDef.args) {
          const argVal = currentArgs.find((a) => a.name === argDef.name);
          const rawType =
            typeof argDef.type === "string" ? argDef.type : "string";
          args[argDef.name] = argVal
            ? coerceArgValue(argVal.value, rawType)
            : rawType === "bool"
              ? false
              : isNumericType(rawType)
                ? isBigNumType(rawType)
                  ? new BN(0)
                  : 0
                : "";
        }

        // Encode instruction data
        const data = instructionCoder.encode(ixName, args);

        // Resolve accounts (pass programId for PDA derivation)
        const resolutions = resolveAllAccounts(
          ixDef.accounts,
          publicKey,
          storagePrefix,
          programId
        );

        // Check for manual overrides
        const manual = manualAccounts[ixName] ?? {};
        const keys: {
          pubkey: PublicKey;
          isSigner: boolean;
          isWritable: boolean;
        }[] = [];
        const extraSigners: import("@solana/web3.js").Keypair[] = [];

        for (let i = 0; i < resolutions.length; i++) {
          const r = resolutions[i]!;
          const accDef = ixDef.accounts[i]!;
          const accName = accDef.name;

          if (r.resolved) {
            const acct = r.account;
            // Check for manual override
            if (manual[accName]) {
              keys.push({
                pubkey: new PublicKey(manual[accName]),
                isSigner: acct.isSigner,
                isWritable: acct.isWritable,
              });
            } else {
              keys.push({
                pubkey: acct.pubkey,
                isSigner: acct.isSigner,
                isWritable: acct.isWritable,
              });
              if (acct.keypair) {
                extraSigners.push(acct.keypair);
              }
            }
          } else {
            const unresolved = r.unresolved;
            // Must have manual entry
            if (!manual[accName]) {
              throw new Error(
                `Account "${accName}" is not resolved. Please provide a public key.`
              );
            }
            keys.push({
              pubkey: new PublicKey(manual[accName]),
              isSigner: unresolved.isSigner,
              isWritable: unresolved.isWritable,
            });
          }
        }

        // Build and send transaction
        const ix = new TransactionInstruction({
          keys,
          programId: new PublicKey(programId),
          data,
        });

        const tx = new Transaction().add(ix);
        tx.feePayer = publicKey;
        const latestBlockhash = await connection.getLatestBlockhash();
        tx.recentBlockhash = latestBlockhash.blockhash;

        if (extraSigners.length > 0) {
          tx.partialSign(...extraSigners);
        }

        const signed = await signTransaction(tx);
        const signature = await connection.sendRawTransaction(
          signed.serialize()
        );

        await connection.confirmTransaction(
          { signature, ...latestBlockhash },
          "confirmed"
        );

        // Fetch logs
        let logs: string[] = [];
        let success = true;
        try {
          const txResult = await connection.getTransaction(signature, {
            commitment: "confirmed",
            maxSupportedTransactionVersion: 0,
          });
          if (txResult?.meta?.logMessages) logs = txResult.meta.logMessages;
          if (txResult?.meta?.err) success = false;
        } catch {
          // non-critical
        }

        setTxHistory((prev) => [
          ...prev,
          {
            instruction: ixName,
            signature,
            logs,
            success,
            timestamp: Date.now(),
          },
        ]);

        // Auto-refresh account data after confirmed tx (1.5s delay)
        const mutAccount = resolutions.find(
          (r): r is { resolved: true; account: ResolvedAccount } =>
            r.resolved && r.account.isWritable && !r.account.isSigner
        );
        if (mutAccount) {
          const types = (idl as { types?: { name: string }[] }).types;
          if (types && types.length > 0) {
            const pubkey = mutAccount.account.pubkey;
            const typeName = types[0]!.name;
            setTimeout(() => {
              fetchAccountData(pubkey, typeName);
            }, 1500);
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);

        // User pressed "Reject" in wallet popup — not an error, just a cancel
        if (isUserRejection(msg)) {
          return;
        }

        if (isWalletKeyringError(msg)) {
          reconnectAttemptsRef.current += 1;
          setWalletError(true);
          if (reconnectAttemptsRef.current <= MAX_RECONNECT_ATTEMPTS) {
            handleReconnectWallet();
          }
          return;
        }

        // Try to extract custom error from message
        const code = extractCustomErrorCode(
          msg.includes("custom program error") ? [msg] : []
        );
        if (code !== null && idl) {
          const resolved = resolveIdlError(code, idl);
          if (resolved) {
            setProgramError(resolved);
            setTxHistory((prev) => [
              ...prev,
              {
                instruction: ixName,
                signature: "failed",
                logs: [msg],
                success: false,
                timestamp: Date.now(),
              },
            ]);
            return;
          }
        }

        setErrorMessage(msg);
      } finally {
        executingRef.current = false;
        setIsExecuting(false);
      }
    },
    [
      publicKey,
      signTransaction,
      programId,
      idl,
      instructionCoder,
      argValues,
      manualAccounts,
      connection,
      storagePrefix,
      fetchAccountData,
      handleReconnectWallet,
    ]
  );

  // ---------------------------------------------------------------------------
  // Render: Error states
  // ---------------------------------------------------------------------------

  if (!idl || !instructionCoder) {
    return (
      <Card className="border-red-500/30 bg-red-500/5">
        <CardContent className="py-8 text-center">
          <p className="text-sm text-red-400">
            {t("invalidIdl") || "Invalid or missing program IDL."}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!programId) {
    return (
      <Card className="border-yellow-500/30 bg-yellow-500/5">
        <CardContent className="py-8 text-center">
          <p className="text-sm text-muted-foreground">{t("deployFirst")}</p>
        </CardContent>
      </Card>
    );
  }

  if (walletError) {
    return (
      <Card className="border-yellow-500/30 bg-yellow-500/5">
        <CardContent className="space-y-4 py-8 text-center">
          <p className="text-sm text-muted-foreground">
            {t("walletSessionExpired")}
          </p>
          <div className="flex items-center justify-center gap-2">
            <Button
              onClick={handleReconnectWallet}
              size="sm"
              disabled={isReconnecting}
            >
              {isReconnecting ? t("executing") + "..." : t("reconnectWallet")}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!publicKey) {
    return (
      <Card className="border-yellow-500/30 bg-yellow-500/5">
        <CardContent className="space-y-4 py-8 text-center">
          <p className="text-sm text-muted-foreground">
            {t("walletDisconnected")}
          </p>
          <Button
            onClick={() => openWalletModal(true)}
            variant="outline"
            size="sm"
          >
            {t("connectWallet")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // ---------------------------------------------------------------------------
  // Render: Main UI
  // ---------------------------------------------------------------------------

  const instructions = (
    idl as {
      instructions: {
        name: string;
        accounts: IdlAccountDef[];
        args: { name: string; type: string }[];
      }[];
    }
  ).instructions;

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m6.75 7.5 3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0 0 21 18V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v12a2.25 2.25 0 0 0 2.25 2.25z"
            />
          </svg>
          {t("title")} — {formatInstructionName(programName)}
        </CardTitle>
        <p className="font-mono text-xs text-muted-foreground">
          {truncateAddress(programId)}
          <span className="ml-2 rounded bg-green-500/10 px-1.5 py-0.5 text-[10px] text-green-500">
            devnet
          </span>
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Instruction cards */}
        {instructions.map((ix) => {
          const isActive = activeInstruction === ix.name;
          const currentArgs = argValues[ix.name] ?? [];
          const resolutions = publicKey
            ? resolveAllAccounts(
                ix.accounts,
                publicKey,
                storagePrefix,
                programId ?? undefined
              )
            : [];
          const hasUnresolved = resolutions.some((r) => {
            if (!r.resolved) {
              const manual = manualAccounts[ix.name];
              return !manual?.[r.unresolved.name];
            }
            return false;
          });

          return (
            <div
              key={ix.name}
              className="border-border/50 bg-muted/10 rounded-lg border"
            >
              {/* Instruction header — clickable */}
              <button
                type="button"
                onClick={() => setActiveInstruction(isActive ? null : ix.name)}
                className="flex w-full items-center justify-between px-4 py-3 text-left"
              >
                <span className="text-sm font-semibold">
                  {formatInstructionName(ix.name)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {ix.args.length > 0
                    ? `${ix.args.length} arg${ix.args.length > 1 ? "s" : ""}`
                    : t("noArgs") || "no args"}
                  {" · "}
                  {ix.accounts.length} account
                  {ix.accounts.length > 1 ? "s" : ""}
                </span>
              </button>

              {/* Expanded content */}
              {isActive && (
                <div className="border-border/30 space-y-3 border-t px-4 py-3">
                  {/* Arg inputs */}
                  {ix.args.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold uppercase text-muted-foreground">
                        {t("arguments") || "Arguments"}
                      </h4>
                      {ix.args.map((arg) => {
                        const rawType =
                          typeof arg.type === "string" ? arg.type : "string";
                        const currentVal =
                          currentArgs.find((a) => a.name === arg.name)?.value ??
                          "";

                        return (
                          <div
                            key={arg.name}
                            className="flex items-center gap-2"
                          >
                            <label className="w-24 shrink-0 text-xs text-muted-foreground">
                              {arg.name}
                              <span className="text-muted-foreground/60 ml-1 text-[10px]">
                                ({rawType})
                              </span>
                            </label>
                            {rawType === "bool" ? (
                              <button
                                type="button"
                                onClick={() => {
                                  const newVal =
                                    currentVal === "true" ? "false" : "true";
                                  setArgValues((prev) => ({
                                    ...prev,
                                    [ix.name]: [
                                      ...(prev[ix.name] ?? []).filter(
                                        (a) => a.name !== arg.name
                                      ),
                                      {
                                        name: arg.name,
                                        type: rawType,
                                        value: newVal,
                                      },
                                    ],
                                  }));
                                }}
                                className={cn(
                                  "rounded-md px-3 py-1 text-xs font-medium",
                                  currentVal === "true"
                                    ? "bg-green-500/20 text-green-400"
                                    : "bg-muted text-muted-foreground"
                                )}
                              >
                                {currentVal === "true" ? "true" : "false"}
                              </button>
                            ) : (
                              <input
                                type="text"
                                value={currentVal}
                                onChange={(e) => {
                                  setArgValues((prev) => ({
                                    ...prev,
                                    [ix.name]: [
                                      ...(prev[ix.name] ?? []).filter(
                                        (a) => a.name !== arg.name
                                      ),
                                      {
                                        name: arg.name,
                                        type: rawType,
                                        value: e.target.value,
                                      },
                                    ],
                                  }));
                                }}
                                placeholder={
                                  rawType === "publicKey"
                                    ? "Base58 address..."
                                    : isBigNumType(rawType)
                                      ? "0 (string-backed BN)"
                                      : rawType
                                }
                                className="flex-1 rounded-md border border-border bg-background px-2 py-1 font-mono text-xs"
                              />
                            )}
                            {rawType === "publicKey" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-[10px]"
                                onClick={() => {
                                  setArgValues((prev) => ({
                                    ...prev,
                                    [ix.name]: [
                                      ...(prev[ix.name] ?? []).filter(
                                        (a) => a.name !== arg.name
                                      ),
                                      {
                                        name: arg.name,
                                        type: rawType,
                                        value: publicKey.toBase58(),
                                      },
                                    ],
                                  }));
                                }}
                              >
                                My wallet
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Account chips */}
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-semibold uppercase text-muted-foreground">
                      {t("accounts") || "Accounts"}
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {resolutions.map((r, i) => {
                        const accName = ix.accounts[i]!.name;
                        if (r.resolved) {
                          return (
                            <span
                              key={accName}
                              className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground"
                              title={r.account.pubkey.toBase58()}
                            >
                              {r.account.label}
                            </span>
                          );
                        }
                        // Unresolved — editable input
                        return (
                          <div
                            key={accName}
                            className="flex items-center gap-1"
                          >
                            <span className="text-[10px] text-orange-400">
                              {accName}:
                            </span>
                            <input
                              type="text"
                              value={manualAccounts[ix.name]?.[accName] ?? ""}
                              onChange={(e) => {
                                setManualAccounts((prev) => ({
                                  ...prev,
                                  [ix.name]: {
                                    ...(prev[ix.name] ?? {}),
                                    [accName]: e.target.value,
                                  },
                                }));
                              }}
                              placeholder="PublicKey..."
                              className="w-32 rounded border border-orange-500/30 bg-background px-1 py-0.5 font-mono text-[10px]"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Execute button */}
                  <Button
                    onClick={() => executeInstruction(ix.name)}
                    disabled={isExecuting || hasUnresolved}
                    size="sm"
                    className="w-full bg-gradient-to-r from-solana-purple to-solana-green font-semibold text-white hover:opacity-90"
                  >
                    {isExecuting
                      ? t("executing") + "..."
                      : `Execute ${formatInstructionName(ix.name)}`}
                  </Button>
                </div>
              )}
            </div>
          );
        })}

        {/* Spinner */}
        {isExecuting && (
          <div className="flex items-center justify-center gap-2 py-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span className="text-sm text-muted-foreground">
              {t("executing")}...
            </span>
          </div>
        )}

        {/* Program error callout */}
        {programError && (
          <div className="rounded-lg border-2 border-orange-500/40 bg-orange-500/10 px-4 py-3">
            <p className="text-sm font-semibold text-orange-400">
              {programError.name} ({programError.code}): {programError.msg}
            </p>
          </div>
        )}

        {/* Generic error */}
        {errorMessage && !programError && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3">
            <p className="text-sm text-red-400">{errorMessage}</p>
          </div>
        )}

        {/* Account data display */}
        {accountData && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">
                {t("accountData") || "Account Data"}
              </h3>
              {lastFetchedAt > 0 && (
                <span className="text-[10px] text-muted-foreground">
                  {t("lastFetched", {
                    seconds: String(
                      Math.floor((Date.now() - lastFetchedAt) / 1000)
                    ),
                  })}
                </span>
              )}
            </div>
            {accountDataLoading ? (
              <div className="bg-muted/30 h-16 animate-pulse rounded-lg" />
            ) : (
              Object.entries(accountData).map(([typeName, fields]) => (
                <div
                  key={typeName}
                  className="bg-muted/30 rounded-lg p-3 text-xs"
                >
                  <h4 className="mb-2 font-semibold text-foreground">
                    {typeName}
                  </h4>
                  <div className="space-y-1">
                    {Object.entries(fields).map(([field, value]) => (
                      <div
                        key={field}
                        className="flex items-center justify-between"
                      >
                        <span className="text-muted-foreground">{field}</span>
                        <span className="font-mono">
                          {typeof value === "string" && value.length > 20
                            ? truncateAddress(value)
                            : String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Transaction history */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">{t("txHistory")}</h3>
          {txHistory.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              {t("noTxYet") || "No transactions yet."}
            </p>
          ) : (
            <div className="max-h-48 space-y-1.5 overflow-y-auto">
              {txHistory.slice(-5).map((entry, idx) => (
                <div
                  key={`${entry.signature}-${idx}`}
                  className="bg-muted/30 rounded-md px-3 py-2"
                >
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="rounded bg-muted px-1 py-0.5 text-[10px] text-muted-foreground">
                      {formatInstructionName(entry.instruction)}
                    </span>
                    {entry.signature !== "failed" ? (
                      <a
                        href={`${EXPLORER_BASE}/tx/${entry.signature}?cluster=devnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 font-mono text-primary hover:underline"
                      >
                        {entry.signature.slice(0, 8)}...
                      </a>
                    ) : (
                      <span className="font-mono text-red-400">
                        {t("failed")}
                      </span>
                    )}
                    <span
                      className={cn(
                        "text-[10px] font-medium",
                        entry.success ? "text-green-500" : "text-red-500"
                      )}
                    >
                      {entry.success ? t("confirmed") : t("failed")}
                    </span>
                    {entry.logs.length > 0 && (
                      <button
                        onClick={() =>
                          setExpandedTx(
                            expandedTx === `${entry.signature}-${idx}`
                              ? null
                              : `${entry.signature}-${idx}`
                          )
                        }
                        className="ml-auto text-[10px] text-muted-foreground hover:text-foreground"
                      >
                        {t("programLogs")}{" "}
                        {expandedTx === `${entry.signature}-${idx}`
                          ? "[-]"
                          : "[+]"}
                      </button>
                    )}
                  </div>
                  {expandedTx === `${entry.signature}-${idx}` && (
                    <div className="mt-2 max-h-32 overflow-y-auto rounded bg-zinc-900 p-2 font-mono text-[10px] text-zinc-400">
                      {entry.logs.map((log, logIdx) => (
                        <div key={logIdx} className="break-all">
                          {log}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <div ref={txEndRef} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
