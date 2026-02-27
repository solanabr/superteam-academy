"use client";

import { PageHeader } from "@/components/app";
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
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Minters"
        subtitle="Register or revoke XP minter roles"
      />

      {isAuthority ? (
        <>
          <div className="p-4 sm:p-6 rounded-2xl border-4 border-border bg-card">
            <h2 className="font-game text-xl mb-1">Register minter</h2>
            <p className="font-game text-muted-foreground text-sm mb-4">
              Create a MinterRole PDA. Minters can call reward_xp and award_achievement.
            </p>
            <div className="flex flex-wrap gap-3 sm:gap-4">
              <div className="space-y-2 w-full min-w-0 sm:min-w-[200px] sm:max-w-[280px]">
                <Label className="font-game">minter (pubkey)</Label>
                <Input
                  placeholder="Pubkey..."
                  value={registerForm.minter}
                  onChange={(e) =>
                    setRegisterForm((f) => ({ ...f, minter: e.target.value }))
                  }
                  className="font-mono"
                />
              </div>
              <div className="space-y-2 w-full min-w-0 sm:w-auto sm:min-w-[120px]">
                <Label className="font-game">label</Label>
                <Input
                  placeholder="e.g. events-bot"
                  value={registerForm.label}
                  onChange={(e) =>
                    setRegisterForm((f) => ({ ...f, label: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label className="font-game">maxXpPerCall (0=unlimited)</Label>
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
                  variant="pixel"
                  className="font-game"
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
          </div>

          <div className="p-4 sm:p-6 rounded-2xl border-4 border-border bg-card">
            <h2 className="font-game text-xl mb-1">Revoke minter</h2>
            <p className="font-game text-muted-foreground text-sm mb-4">
              Close the MinterRole PDA. Revoked minter can no longer mint XP.
            </p>
            <div className="flex flex-wrap gap-3 sm:gap-4">
              <div className="space-y-2 w-full min-w-0 sm:min-w-[200px] sm:max-w-[280px]">
                <Label className="font-game">Minter</Label>
                <Select
                  value={revokeForm.minter}
                  onValueChange={(v) => setRevokeForm({ minter: v })}
                >
                  <SelectTrigger className="w-full font-game">
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
                  variant="pixel"
                  className="font-game"
                  disabled={!revokeForm.minter || revoking}
                  onClick={() => revokeMinter({ minter: revokeForm.minter })}
                >
                  {revoking ? "Revoking…" : "Revoke"}
                </Button>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="p-4 sm:p-6 rounded-2xl border-4 border-border bg-card">
          <p className="font-game text-muted-foreground text-sm">
            Only the authority can register or revoke minters.
          </p>
        </div>
      )}

      <p className="font-game text-sm text-muted-foreground">
        Full test playground: <Link href="/test" className="text-yellow-400 hover:underline">/test</Link>
      </p>
    </div>
  );
}
