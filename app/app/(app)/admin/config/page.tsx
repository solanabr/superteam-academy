"use client";

import { PageHeader } from "@/components/app";
import { useConfig, useUpdateConfig, useIsAdmin } from "@/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

export default function AdminConfigPage() {
  const { role } = useIsAdmin();
  const { data: config } = useConfig();
  const { mutate: updateConfig, isPending } = useUpdateConfig();
  const [newBackendSigner, setNewBackendSigner] = useState("");

  const isAuthority = role === "authority";

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Config"
        subtitle="Platform configuration and backend signer"
      />

      {config && (
        <div className="p-4 sm:p-6 rounded-2xl border-4 border-border bg-card">
          <h2 className="font-game text-xl mb-1">Current config</h2>
          <p className="font-game text-muted-foreground text-sm mb-4">On-chain Config PDA</p>
          <div className="space-y-3 font-game font-mono text-sm">
            <div>
              <Label className="font-game text-muted-foreground">Authority</Label>
              <p className="break-all mt-1 rounded-lg bg-muted px-2 py-1.5 border border-border">{config.authority.toBase58()}</p>
            </div>
            <div>
              <Label className="font-game text-muted-foreground">Backend signer</Label>
              <p className="break-all mt-1 rounded-lg bg-muted px-2 py-1.5 border border-border">{config.backendSigner.toBase58()}</p>
            </div>
            <div>
              <Label className="font-game text-muted-foreground">XP mint</Label>
              <p className="break-all mt-1 rounded-lg bg-muted px-2 py-1.5 border border-border">{config.xpMint.toBase58()}</p>
            </div>
          </div>
        </div>
      )}

      {isAuthority ? (
        <div className="p-4 sm:p-6 rounded-2xl border-4 border-border bg-card">
          <h2 className="font-game text-xl mb-1">Rotate backend signer</h2>
          <p className="font-game text-muted-foreground text-sm mb-4">
            Update the backend signer pubkey. Requires authority wallet. Backend
            must use the new keypair.
          </p>
          <div className="space-y-4">
            <div className="space-y-2 w-full max-w-md min-w-0">
              <Label htmlFor="new-backend-signer" className="font-game">New backend signer pubkey</Label>
              <Input
                id="new-backend-signer"
                placeholder="Pubkey..."
                value={newBackendSigner}
                onChange={(e) => setNewBackendSigner(e.target.value)}
                className="font-mono"
              />
            </div>
            <Button
              variant="pixel"
              className="font-game"
              disabled={!newBackendSigner || isPending}
              onClick={() => updateConfig({ newBackendSigner })}
            >
              {isPending ? "Updating…" : "Update config"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="p-4 sm:p-6 rounded-2xl border-4 border-border bg-card">
          <p className="font-game text-muted-foreground text-sm">
            Only the authority wallet can rotate the backend signer. Connect
            with the authority wallet to update config.
          </p>
        </div>
      )}
    </div>
  );
}
