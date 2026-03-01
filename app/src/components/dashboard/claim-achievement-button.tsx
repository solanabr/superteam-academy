'use client';

import { useCallback, useState } from 'react';
import {
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';
import { useConnection } from '@solana/wallet-adapter-react';
import { Award, Loader2, ExternalLink, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  buildClaimAchievementInstruction,
  explorerTxUrl,
} from '@/lib/solana/claim-achievement';
import { CLUSTER } from '@/lib/solana/constants';

interface ClaimAchievementButtonProps {
  achievementId: string;
  earned: boolean;
}

/**
 * Button for claiming an earned achievement on-chain.
 *
 * Renders nothing when:
 * - The achievement is not earned
 * - No wallet is connected
 *
 * States:
 * - Idle: "Claim On-Chain" with Award icon
 * - Loading: spinner while transaction is in-flight
 * - Claimed: "Claimed" badge with Explorer link
 * - Error: toast notification with error details
 */
export function ClaimAchievementButton({
  achievementId,
  earned,
}: ClaimAchievementButtonProps) {
  const { publicKey, signTransaction, connected } = useWallet();
  const { connection } = useConnection();
  const t = useTranslations('dashboard');

  const [isLoading, setIsLoading] = useState(false);
  const [txSignature, setTxSignature] = useState<string | null>(null);

  const handleClaim = useCallback(async () => {
    if (!publicKey || !signTransaction) return;

    setIsLoading(true);

    try {
      const instruction = buildClaimAchievementInstruction(
        achievementId,
        publicKey,
      );

      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash('confirmed');

      const messageV0 = new TransactionMessage({
        payerKey: publicKey,
        recentBlockhash: blockhash,
        instructions: [instruction],
      }).compileToV0Message();

      const transaction = new VersionedTransaction(messageV0);
      const signed = await signTransaction(transaction);

      const signature = await connection.sendRawTransaction(
        signed.serialize(),
        { skipPreflight: false, preflightCommitment: 'confirmed' },
      );

      await connection.confirmTransaction(
        { signature, blockhash, lastValidBlockHeight },
        'confirmed',
      );

      setTxSignature(signature);
      toast.success(t('achievement_claimed'), {
        description: achievementId,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Transaction failed';
      toast.error('Claim failed', { description: message });
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, signTransaction, connection, achievementId, t]);

  if (!earned || !connected) return null;

  if (txSignature) {
    return (
      <a
        href={explorerTxUrl(txSignature, CLUSTER)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 hover:text-emerald-700 transition-colors dark:text-emerald-400 dark:hover:text-emerald-300"
      >
        <CheckCircle2 className="size-3" />
        {t('achievement_claimed')}
        <ExternalLink className="size-2.5" />
      </a>
    );
  }

  return (
    <Button
      variant="ghost"
      size="xs"
      onClick={handleClaim}
      disabled={isLoading}
      className="h-5 gap-1 px-1.5 text-[10px]"
    >
      {isLoading ? (
        <Loader2 className="size-3 animate-spin" />
      ) : (
        <Award className="size-3" />
      )}
      {isLoading ? '...' : t('claim_onchain')}
    </Button>
  );
}
