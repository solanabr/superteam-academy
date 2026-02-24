"use client";

import { PageHeader } from "@/components/app";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  useRegisterMinter,
  useRevokeMinter,
  useIsAdmin,
  useAllMinters,
} from "@/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import Link from "next/link";

export default function AdminMintersPage() {
  const { role } = useIsAdmin();
  const { data: minters } = useAllMinters();
  const { mutate: registerMinter, isPending: registering } = useRegisterMinter();
  const { mutate: revokeMinter, isPending: revoking } = useRevokeMinter();
  const [registerForm, setRegisterForm] = useState({
    minter: "",
    label: "",
    maxXpPerCall: 0,
  });
  const [revokeForm, setRevokeForm] = useState({ minter: "" });

  const isAuthority = role === "authority";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Minters"
        subtitle="Register or revoke XP minter roles"
      />

      {isAuthority ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Register minter</CardTitle>
              <CardDescription>
                Create a MinterRole PDA. Minters can call reward_xp and
                award_achievement.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-4">
                <div className="space-y-2 min-w-[280px]">
                  <Label>minter (pubkey)</Label>
                  <Input
                    placeholder="Pubkey..."
                    value={registerForm.minter}
                    onChange={(e) =>
                      setRegisterForm((f) => ({ ...f, minter: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2 min-w-[160px]">
                  <Label>label</Label>
                  <Input
                    placeholder="e.g. events-bot"
                    value={registerForm.label}
                    onChange={(e) =>
                      setRegisterForm((f) => ({ ...f, label: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>maxXpPerCall (0=unlimited)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={registerForm.maxXpPerCall}
                    onChange={(e) =>
                      setRegisterForm((f) => ({
                        ...f,
                        maxXpPerCall: +e.target.value || 0,
                      }))
                    }
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    disabled={!registerForm.minter || registering}
                    onClick={() =>
                      registerMinter({
                        minter: registerForm.minter,
                        label: registerForm.label || undefined,
                        maxXpPerCall:
                          registerForm.maxXpPerCall > 0
                            ? registerForm.maxXpPerCall
                            : undefined,
                      })
                    }
                  >
                    {registering ? "Registering…" : "Register"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Revoke minter</CardTitle>
              <CardDescription>
                Close the MinterRole PDA. Revoked minter can no longer mint XP.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-4">
                <div className="space-y-2 min-w-[280px]">
                  <Label>Minter</Label>
                  <Select
                    value={revokeForm.minter}
                    onValueChange={(v) => setRevokeForm({ minter: v })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select minter" />
                    </SelectTrigger>
                    <SelectContent>
                      {(minters ?? []).map((m) => {
                        const acc = m.account as {
                          minter: { toBase58(): string };
                          label?: string;
                        };
                        const pubkey =
                          typeof acc.minter?.toBase58 === "function"
                            ? acc.minter.toBase58()
                            : String(acc.minter ?? m.publicKey.toBase58());
                        const label = acc.label ?? `${pubkey.slice(0, 4)}…${pubkey.slice(-4)}`;
                        return (
                          <SelectItem key={pubkey} value={pubkey}>
                            {label}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button
                    disabled={!revokeForm.minter || revoking}
                    onClick={() => revokeMinter({ minter: revokeForm.minter })}
                  >
                    {revoking ? "Revoking…" : "Revoke"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="py-6">
            <p className="text-muted-foreground text-sm">
              Only the authority can register or revoke minters.
            </p>
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-muted-foreground">
        Full test playground: <Link href="/test" className="text-primary hover:underline">/test</Link>
      </p>
    </div>
  );
}
