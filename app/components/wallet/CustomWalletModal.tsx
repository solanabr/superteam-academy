"use client";

import { WalletReadyState } from "@solana/wallet-adapter-base";
import type { Wallet } from "@solana/wallet-adapter-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import type { MouseEvent } from "react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

function WalletListItemRow({
  wallet,
  onClick,
  tabIndex,
}: {
  wallet: Wallet;
  onClick: (e: MouseEvent<HTMLButtonElement>) => void;
  tabIndex?: number;
}) {
  const isDetected = wallet.readyState === WalletReadyState.Installed;
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        tabIndex={tabIndex}
        className={cn(
          "group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left font-game text-lg transition-colors",
          "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        )}
      >
        {wallet.adapter.icon && (
          <Image
            src={wallet.adapter.icon}
            alt=""
            width={24}
            height={24}
            unoptimized
            className="h-7 w-7 shrink-0 rounded"
          />
        )}
        <span className="flex-1 font-game font-medium">{wallet.adapter.name}</span>
        {isDetected && (
          <span className="font-game text-base text-muted-foreground group-hover:text-accent-foreground">
            Detected
          </span>
        )}
      </button>
    </li>
  );
}

function CollapseSection({
  expanded,
  id,
  children,
}: {
  expanded: boolean;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <div
      id={id}
      className={cn(
        "grid transition-[grid-template-rows] duration-200 ease-out",
        expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
      )}
      role="region"
    >
      <div className="min-h-0 overflow-hidden">{children}</div>
    </div>
  );
}

export function CustomWalletModal() {
  const ref = useRef<HTMLDivElement>(null);
  const { wallets, select } = useWallet();
  const { setVisible } = useWalletModal();
  const [expanded, setExpanded] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [installed, notInstalled] = useMemo(() => {
    const a: Wallet[] = [];
    const b: Wallet[] = [];
    for (const w of wallets) {
      if (w.readyState === WalletReadyState.Installed) a.push(w);
      else b.push(w);
    }
    return a.length ? [a, b] : [b, []];
  }, [wallets]);

  const hide = useCallback(() => {
    setMounted(false);
    setTimeout(() => setVisible(false), 200);
  }, [setVisible]);

  const handleWalletClick = useCallback(
    (e: MouseEvent<HTMLButtonElement>, name: Wallet["adapter"]["name"]) => {
      select(name);
      hide();
    },
    [select, hide]
  );

  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(t);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") hide();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [hide]);

  useLayoutEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const portal =
    typeof document !== "undefined" ? document.querySelector("body") : null;

  if (!portal) return null;

  return createPortal(
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-labelledby="wallet-modal-title"
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-200",
        mounted ? "opacity-100" : "opacity-0"
      )}
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        aria-hidden
        onClick={hide}
        onMouseDown={hide}
      />
      <div
        className={cn(
          "relative z-10 w-full max-w-[440px] rounded-2xl border-4 border-border bg-card text-card-foreground shadow-xl transition-[transform,opacity] duration-200",
          mounted ? "scale-100 opacity-100" : "scale-95 opacity-0"
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2
            id="wallet-modal-title"
            className="font-game text-3xl font-semibold text-foreground"
          >
            Connect wallet
          </h2>
          <button
            type="button"
            onClick={hide}
            className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 14 14" fill="currentColor" aria-hidden>
              <path d="M14 12.461 8.3 6.772l5.234-5.233L12.006 0 6.772 5.234 1.54 0 0 1.539l5.234 5.233L0 12.006l1.539 1.528L6.772 8.3l5.69 5.7L14 12.461z" />
            </svg>
          </button>
        </div>

        <div className="max-h-[min(70vh,420px)] overflow-y-auto px-5 py-4">
          {installed.length > 0 ? (
            <>
              <p className="mb-3 font-game text-lg text-muted-foreground">
                Choose a wallet to connect to this app.
              </p>
              <ul className="space-y-0.5">
                {installed.map((wallet) => (
                  <WalletListItemRow
                    key={wallet.adapter.name}
                    wallet={wallet}
                    onClick={(e) => handleWalletClick(e, wallet.adapter.name)}
                  />
                ))}
              </ul>
              {notInstalled.length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={() => setExpanded((e) => !e)}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg py-2.5 font-game text-lg font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    {expanded ? "Less options" : "More options"}
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 13 7"
                      className={cn("transition-transform", expanded && "rotate-180")}
                      fill="currentColor"
                    >
                      <path d="M0.71418 1.626L5.83323 6.26188 12.2868 1.626C12.7753 1.1835 12.3703 0.5 11.6195 0.5H1.37997C0.629216 0.5 0.224175 1.1835 0.71418 1.626Z" />
                    </svg>
                  </button>
                  <CollapseSection expanded={expanded} id="more-wallets">
                    <ul className="mt-1 space-y-0.5 border-t border-border pt-3">
                      {notInstalled.map((wallet) => (
                        <WalletListItemRow
                          key={wallet.adapter.name}
                          wallet={wallet}
                          onClick={(e) => handleWalletClick(e, wallet.adapter.name)}
                          tabIndex={expanded ? 0 : -1}
                        />
                      ))}
                    </ul>
                  </CollapseSection>
                </>
              )}
            </>
          ) : (
            <>
              <p className="mb-4 text-center font-game text-lg text-muted-foreground">
                You’ll need a Solana wallet to continue.
              </p>
              {notInstalled.length > 0 ? (
                <>
                  <button
                    type="button"
                    onClick={() => setExpanded((e) => !e)}
                    className="mb-3 flex w-full items-center justify-center gap-2 rounded-lg py-2.5 font-game text-lg font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    {expanded ? "Hide options" : "Already have a wallet? View options"}
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 13 7"
                      className={cn("transition-transform", expanded && "rotate-180")}
                      fill="currentColor"
                    >
                      <path d="M0.71418 1.626L5.83323 6.26188 12.2868 1.626C12.7753 1.1835 12.3703 0.5 11.6195 0.5H1.37997C0.629216 0.5 0.224175 1.1835 0.71418 1.626Z" />
                    </svg>
                  </button>
                  <CollapseSection expanded={expanded} id="more-wallets-empty">
                    <ul className="space-y-0.5">
                      {notInstalled.map((wallet) => (
                        <WalletListItemRow
                          key={wallet.adapter.name}
                          wallet={wallet}
                          onClick={(e) => handleWalletClick(e, wallet.adapter.name)}
                          tabIndex={expanded ? 0 : -1}
                        />
                      ))}
                    </ul>
                  </CollapseSection>
                </>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>,
    portal
  );
}
