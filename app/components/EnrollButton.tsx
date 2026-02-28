'use client';

import { useState, useCallback, useEffect } from 'react';
import { useWalletSafe as useWallet } from '@/lib/use-wallet-safe';
import { useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Play, Loader2, CheckCircle2, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  useAnchorProgram,
  enrollInCourse,
  getEnrollmentPDA,
  explorerUrl,
} from '@/lib/use-program';

interface EnrollButtonProps {
  courseId: string;
  lessonPath: string;
  startText: string;
  enrollingText: string;
  enrolledText: string;
  connectText: string;
  viewTxText: string;
}

export default function EnrollButton({
  courseId,
  lessonPath,
  startText,
  enrollingText,
  enrolledText,
  connectText,
  viewTxText,
}: EnrollButtonProps) {
  const { connected, publicKey } = useWallet();
  const { connection } = useConnection();
  const program = useAnchorProgram();
  const router = useRouter();

  const [status, setStatus] = useState<
    'idle' | 'enrolling' | 'enrolled' | 'error'
  >('idle');
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [alreadyEnrolled, setAlreadyEnrolled] = useState(false);

  // Check if user is already enrolled
  useEffect(() => {
    if (!publicKey || !connection) return;

    const enrollmentPDA = getEnrollmentPDA(courseId, publicKey);
    connection.getAccountInfo(enrollmentPDA).then((info) => {
      if (info) {
        setAlreadyEnrolled(true);
        setStatus('enrolled');
      }
    }).catch(() => {
      // Silently ignore — enrollment check is non-critical
    });
  }, [publicKey, connection, courseId]);

  const handleEnroll = useCallback(async () => {
    if (!program || !publicKey) return;

    // Already enrolled — go to lesson
    if (alreadyEnrolled) {
      router.push(lessonPath);
      return;
    }

    setStatus('enrolling');
    setErrorMsg(null);

    try {
      const result = await enrollInCourse(program, courseId, publicKey);
      setTxSignature(result.signature);
      setStatus('enrolled');
      setAlreadyEnrolled(true);

      // Navigate to first lesson after a brief delay
      setTimeout(() => router.push(lessonPath), 2000);
    } catch (err: unknown) {
      setStatus('error');
      const message =
        err instanceof Error ? err.message : 'Transaction failed';
      // Clean up Anchor error messages
      if (message.includes('already in use')) {
        setAlreadyEnrolled(true);
        setStatus('enrolled');
      } else {
        setErrorMsg(message.slice(0, 120));
      }
    }
  }, [program, publicKey, courseId, lessonPath, alreadyEnrolled, router]);

  if (!connected) {
    return (
      <div className="flex flex-col items-center gap-2">
        <WalletMultiButton
          style={{
            width: '100%',
            justifyContent: 'center',
            borderRadius: '0.75rem',
            background: 'linear-gradient(to right, #7c3aed, #4f46e5)',
            padding: '0.875rem',
            fontSize: '0.875rem',
            fontWeight: 700,
          }}
        />
        <span className="text-xs text-gray-400">{connectText}</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleEnroll}
        disabled={status === 'enrolling'}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 py-3.5 text-sm font-bold text-white hover:from-purple-500 hover:to-indigo-500 transition-all hover:scale-[1.02] disabled:opacity-60 disabled:cursor-wait disabled:hover:scale-100"
      >
        {status === 'enrolling' && (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {enrollingText}
          </>
        )}
        {status === 'enrolled' && (
          <>
            <CheckCircle2 className="h-4 w-4" />
            {enrolledText}
          </>
        )}
        {(status === 'idle' || status === 'error') && (
          <>
            <Play className="h-4 w-4" />
            {startText}
          </>
        )}
      </button>

      {txSignature && (
        <a
          href={explorerUrl(txSignature)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 transition-colors"
        >
          <ExternalLink className="h-3 w-3" />
          {viewTxText}
        </a>
      )}

      {errorMsg && (
        <p className="text-xs text-red-400 text-center">{errorMsg}</p>
      )}
    </div>
  );
}
