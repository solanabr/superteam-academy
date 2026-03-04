"use client";

import bs58 from "bs58";
import { supabase } from "@/lib/supabase";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/use-wallet";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight02Icon, CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import { Connection, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { useStandardWallets } from "@privy-io/react-auth/solana";

const PROGRAM_ID = new PublicKey("ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf");
const RPC_URL = process.env.NEXT_PUBLIC_HELIUS_RPC || "https://api.devnet.solana.com";

interface EnrollButtonProps {
  courseSlug: string;
  t: (key: string) => string;
}

export function EnrollButton({ courseSlug, t }: EnrollButtonProps) {
  const { address, authenticated, login } = useWallet();
  const { wallets } = useStandardWallets();
  const [enrolling, setEnrolling] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEnroll = async () => {
    if (!authenticated || !address) {
      login();
      return;
    }

    const solanaWallet = wallets.find(w => w.accounts[0]?.address === address);
    if (!solanaWallet) {
      setError("No Solana wallet found");
      return;
    }

    setEnrolling(true);
    setError(null);

    try {
      const connection = new Connection(RPC_URL, "confirmed");
      const learner = new PublicKey(address);

      const [coursePDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("course"), Buffer.from(courseSlug)],
        PROGRAM_ID
      );

      const [enrollmentPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("enrollment"), Buffer.from(courseSlug), learner.toBuffer()],
        PROGRAM_ID
      );

      const existingEnrollment = await connection.getAccountInfo(enrollmentPDA);
      if (existingEnrollment) {
        setEnrolled(true);
        return;
      }

      const discriminator = Buffer.from([58, 12, 36, 3, 142, 28, 1, 43]);
      const courseIdBytes = Buffer.from(courseSlug, "utf8");
      const courseIdLength = Buffer.alloc(4);
      courseIdLength.writeUInt32LE(courseIdBytes.length, 0);
      const data = Buffer.concat([discriminator, courseIdLength, courseIdBytes]);

      const transaction = new Transaction();
      transaction.add({
        programId: PROGRAM_ID,
        keys: [
          { pubkey: coursePDA, isSigner: false, isWritable: true },
          { pubkey: enrollmentPDA, isSigner: false, isWritable: true },
          { pubkey: learner, isSigner: true, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        data,
      });

      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = learner;

      const serialized = transaction.serialize({ requireAllSignatures: false });
      const signAndSend = solanaWallet.features['solana:signAndSendTransaction'];
      if (!signAndSend) throw new Error('No signAndSendTransaction support');
      const results = await signAndSend.signAndSendTransaction({ account: solanaWallet.accounts[0], transaction: serialized, chain: 'solana:devnet' });
      const signature = bs58.encode(results[0].signature);
      await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, "confirmed");

      await supabase.from("enrollments").upsert({
        user_wallet: address,
        course_id: courseSlug,
        tx_signature: signature,
        progress: 0,
      }, { onConflict: "user_wallet,course_id" });
      setEnrolled(true);
    } catch (err) {
      console.error("Enrollment failed:", err);
      setError(err instanceof Error ? err.message : "Enrollment failed");
    } finally {
      setEnrolling(false);
    }
  };

  if (enrolled) {
    return (
      <Button size="lg" className="w-full" disabled>
        <HugeiconsIcon icon={CheckmarkCircle02Icon} size={14} className="mr-2" />
        {t("common.enrolled")}
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Button size="lg" className="w-full" onClick={handleEnroll} disabled={enrolling}>
        {enrolling ? t("common.enrolling") : t("common.enrollNow")}
        <HugeiconsIcon icon={ArrowRight02Icon} size={14} data-icon="inline-end" />
      </Button>
      {error && <p className="text-xs text-destructive text-center">{error}</p>}
    </div>
  );
}