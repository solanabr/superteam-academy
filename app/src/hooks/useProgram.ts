'use client';

import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import BN from 'bn.js';
import {
  getConfigPda,
  getCoursePda,
  getEnrollmentPda,
  getXpAta,
  countCompletedLessons,
  isLessonComplete,
  calculateLevel,
} from '@/lib/program';
import { PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from '@/config/constants';
import type { CourseAccount, EnrollmentAccount, ConfigAccount, CourseWithKey, EnrollmentWithKey } from '@/types';

// Minimal IDL account decoder — we decode manually from raw account data
// In production you'd use the generated IDL. Here we use getProgramAccounts with discriminator filters.

export function useConfig() {
  const { connection } = useConnection();
  const [config, setConfig] = useState<ConfigAccount | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const configPda = getConfigPda();
    connection
      .getAccountInfo(configPda)
      .then((info) => {
        if (!info) return;
        // Decode: 8 discriminator + 32 authority + 32 backend_signer + 32 xp_mint + 8 reserved + 1 bump
        const data = info.data;
        const authority = new PublicKey(data.subarray(8, 40));
        const backendSigner = new PublicKey(data.subarray(40, 72));
        const xpMint = new PublicKey(data.subarray(72, 104));
        const bump = data[112];
        setConfig({ authority, backendSigner, xpMint, bump });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [connection]);

  return { config, loading };
}

export function useCourses() {
  const { connection } = useConnection();
  const [courses, setCourses] = useState<CourseWithKey[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Course discriminator: first 8 bytes of sha256("account:Course")
    // We'll use getProgramAccounts and decode
    connection
      .getProgramAccounts(PROGRAM_ID, {
        filters: [{ dataSize: 192 }], // Course account size
      })
      .then((accounts) => {
        const decoded = accounts.map((a) => ({
          publicKey: a.pubkey,
          account: decodeCourse(a.account.data),
        }));
        setCourses(decoded.filter((c) => c.account.isActive));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [connection]);

  return { courses, loading };
}

export function useCourse(courseId: string) {
  const { connection } = useConnection();
  const [course, setCourse] = useState<CourseAccount | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const pda = getCoursePda(courseId);
    connection
      .getAccountInfo(pda)
      .then((info) => {
        if (info) setCourse(decodeCourse(info.data));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [connection, courseId]);

  return { course, loading };
}

export function useEnrollment(courseId: string) {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [enrollment, setEnrollment] = useState<EnrollmentAccount | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    if (!publicKey) {
      setEnrollment(null);
      setLoading(false);
      return;
    }
    const pda = getEnrollmentPda(courseId, publicKey);
    setLoading(true);
    connection
      .getAccountInfo(pda)
      .then((info) => {
        if (info) {
          setEnrollment(decodeEnrollment(info.data));
        } else {
          setEnrollment(null);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [connection, courseId, publicKey]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { enrollment, loading, refresh };
}

export function useXpBalance() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const { config } = useConfig();
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!publicKey || !config) {
      setBalance(0);
      setLoading(false);
      return;
    }
    const ata = getXpAta(publicKey, config.xpMint);
    connection
      .getTokenAccountBalance(ata)
      .then((b) => setBalance(Number(b.value.amount)))
      .catch(() => setBalance(0))
      .finally(() => setLoading(false));
  }, [connection, publicKey, config]);

  return { balance, level: calculateLevel(balance), loading };
}

export function useEnroll() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [loading, setLoading] = useState(false);

  const enroll = useCallback(
    async (courseId: string) => {
      if (!publicKey || !sendTransaction) throw new Error('Wallet not connected');
      setLoading(true);
      try {
        const coursePda = getCoursePda(courseId);
        const enrollmentPda = getEnrollmentPda(courseId, publicKey);

        // Build instruction manually (Anchor instruction discriminator for "enroll")
        // sha256("global:enroll")[0..8]
        const discriminator = Buffer.from([0xb2, 0xb1, 0x9f, 0xdf, 0x6c, 0xba, 0x8e, 0xc7]);
        const courseIdBuf = Buffer.from(courseId);
        const lenBuf = Buffer.alloc(4);
        lenBuf.writeUInt32LE(courseIdBuf.length);
        const data = Buffer.concat([discriminator, lenBuf, courseIdBuf]);

        const ix = {
          programId: PROGRAM_ID,
          keys: [
            { pubkey: coursePda, isWritable: false, isSigner: false },
            { pubkey: enrollmentPda, isWritable: true, isSigner: false },
            { pubkey: publicKey, isWritable: true, isSigner: true },
            { pubkey: SystemProgram.programId, isWritable: false, isSigner: false },
          ],
          data,
        };

        const tx = new Transaction().add(ix);
        tx.feePayer = publicKey;
        tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

        const sig = await sendTransaction(tx, connection);
        await connection.confirmTransaction(sig);
        return sig;
      } finally {
        setLoading(false);
      }
    },
    [connection, publicKey, sendTransaction]
  );

  return { enroll, loading };
}

// --- Decoders (manual, no IDL needed) ---

function decodeCourse(data: Buffer): CourseAccount {
  let offset = 8; // skip discriminator

  // String: 4-byte length prefix + UTF-8
  const courseIdLen = data.readUInt32LE(offset);
  offset += 4;
  const courseId = data.subarray(offset, offset + courseIdLen).toString('utf-8');
  offset = 8 + 4 + 32; // skip to fixed offset after max course_id allocation (4 + MAX_COURSE_ID_LEN=32)

  const creator = new PublicKey(data.subarray(offset, offset + 32));
  offset += 32;
  const contentTxId = Array.from(data.subarray(offset, offset + 32));
  offset += 32;
  const version = data.readUInt16LE(offset);
  offset += 2;
  const lessonCount = data[offset++];
  const difficulty = data[offset++];
  const xpPerLesson = data.readUInt32LE(offset);
  offset += 4;
  const trackId = data.readUInt16LE(offset);
  offset += 2;
  const trackLevel = data[offset++];

  // Option<Pubkey>: 1 byte discriminator + 32 bytes
  const hasPrereq = data[offset++];
  const prerequisite = hasPrereq ? new PublicKey(data.subarray(offset, offset + 32)) : null;
  offset += 32;

  const creatorRewardXp = data.readUInt32LE(offset);
  offset += 4;
  const minCompletionsForReward = data.readUInt16LE(offset);
  offset += 2;
  const totalCompletions = data.readUInt32LE(offset);
  offset += 4;
  const totalEnrollments = data.readUInt32LE(offset);
  offset += 4;
  const isActive = data[offset++] !== 0;
  const createdAt = new BN(data.subarray(offset, offset + 8), 'le');
  offset += 8;
  const updatedAt = new BN(data.subarray(offset, offset + 8), 'le');
  offset += 8;
  offset += 8; // reserved
  const bump = data[offset];

  return {
    courseId,
    creator,
    contentTxId,
    version,
    lessonCount,
    difficulty,
    xpPerLesson,
    trackId,
    trackLevel,
    prerequisite,
    creatorRewardXp,
    minCompletionsForReward,
    totalCompletions,
    totalEnrollments,
    isActive,
    createdAt,
    updatedAt,
    bump,
  };
}

function decodeEnrollment(data: Buffer): EnrollmentAccount {
  let offset = 8; // skip discriminator

  const course = new PublicKey(data.subarray(offset, offset + 32));
  offset += 32;
  const enrolledAt = new BN(data.subarray(offset, offset + 8), 'le');
  offset += 8;

  // Option<i64>
  const hasCompleted = data[offset++];
  const completedAt = hasCompleted ? new BN(data.subarray(offset, offset + 8), 'le') : null;
  offset += 8;

  // [u64; 4]
  const lessonFlags: BN[] = [];
  for (let i = 0; i < 4; i++) {
    lessonFlags.push(new BN(data.subarray(offset, offset + 8), 'le'));
    offset += 8;
  }

  // Option<Pubkey>
  const hasCredential = data[offset++];
  const credentialAsset = hasCredential ? new PublicKey(data.subarray(offset, offset + 32)) : null;
  offset += 32;

  offset += 4; // reserved
  const bump = data[offset];

  return { course, enrolledAt, completedAt, lessonFlags, credentialAsset, bump };
}
