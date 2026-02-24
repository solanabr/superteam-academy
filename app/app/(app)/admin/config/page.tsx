"use client";

import { PageHeader } from "@/components/app";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    <div className="space-y-6">
      <PageHeader
        title="Config"
        subtitle="Platform configuration and backend signer"
      />

      {config && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Current config</CardTitle>
            <CardDescription>On-chain Config PDA</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 font-mono text-sm">
            <div>
              <Label className="text-muted-foreground">Authority</Label>
              <p className="break-all">{config.authority.toBase58()}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Backend signer</Label>
              <p className="break-all">{config.backendSigner.toBase58()}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">XP mint</Label>
              <p className="break-all">{config.xpMint.toBase58()}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {isAuthority ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Rotate backend signer</CardTitle>
            <CardDescription>
              Update the backend signer pubkey. Requires authority wallet. Backend
              must use the new keypair.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 max-w-md">
              <Label htmlFor="new-backend-signer">New backend signer pubkey</Label>
              <Input
                id="new-backend-signer"
                placeholder="Pubkey..."
                value={newBackendSigner}
                onChange={(e) => setNewBackendSigner(e.target.value)}
              />
            </div>
            <Button
              disabled={!newBackendSigner || isPending}
              onClick={() => updateConfig({ newBackendSigner })}
            >
              {isPending ? "Updating…" : "Update config"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-6">
            <p className="text-muted-foreground text-sm">
              Only the authority wallet can rotate the backend signer. Connect
              with the authority wallet to update config.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
