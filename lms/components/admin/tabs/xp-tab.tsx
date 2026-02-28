"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Coins } from "lucide-react";
import { toast } from "sonner";
import { rewardXp } from "@/lib/admin/api";
import { TxResult } from "../shared/tx-result";

export function XpTab({ adminSecret }: { adminSecret: string }) {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [lastTx, setLastTx] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      rewardXp(adminSecret, {
        recipient,
        amount: Number(amount),
        memo: memo || undefined,
      }),
    onSuccess: (res) => {
      setLastTx(res.txSignature);
      toast.success(`${amount} XP sent to ${recipient.slice(0, 8)}...`);
      setRecipient("");
      setAmount("");
      setMemo("");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Coins className="h-4 w-4" />
            Reward XP
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="text-sm text-muted-foreground">
              Recipient Wallet Address
            </label>
            <Input
              placeholder="Pubkey..."
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Amount (XP)</label>
            <Input
              type="number"
              placeholder="e.g. 100"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">
              Memo (optional)
            </label>
            <Textarea
              placeholder="e.g. Bug bounty reward"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              rows={2}
            />
          </div>
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !recipient || !amount}
          >
            <Coins className="mr-2 h-4 w-4" />
            {mutation.isPending ? "Sending..." : "Send XP"}
          </Button>
        </CardContent>
      </Card>

      {lastTx && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Last tx:</span>
          <TxResult signature={lastTx} />
        </div>
      )}
    </div>
  );
}
