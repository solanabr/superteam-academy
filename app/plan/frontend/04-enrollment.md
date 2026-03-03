# Enrollment Service

**Status**: Frontend implementation. Integrates with deployed devnet program.

## Devnet Program

| | Address |
|---|---|
| **Program ID** | `ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf` |

---

## Overview

The Enrollment Service manages learner enrollment, progress tracking, and course completion.

## Data Types

```typescript
interface Enrollment {
  enrollmentPda: string;
  course: string;
  learner: string;
  lessonFlags: BN[];         // [u64; 4] - 256 bits
  completedAt: number | null;
  credentialAsset: string | null;
  enrolledAt: number;
  bump: number;
}

interface EnrollmentWithCourse extends Enrollment {
  courseData: Course;
  progress: number;          // percentage
  completedLessons: number;
  isComplete: boolean;
}
```

## Functions

### Fetch Enrollment

```typescript
// hooks/useEnrollment.ts
import { useQuery } from '@tanstack/react-query';
import { useProgram } from './useProgram';
import { deriveEnrollmentPda } from '@/lib/pda';
import { PROGRAM_ID } from '@/lib/constants';
import { countCompletedLessons, getProgressPercentage } from '@/lib/bitmap';

export function useEnrollment(courseId: string, learner: PublicKey | null) {
  const { program } = useProgram();
  
  return useQuery({
    queryKey: ['enrollment', courseId, learner?.toBase58()],
    queryFn: async () => {
      if (!learner) return null;
      
      const enrollmentPda = deriveEnrollmentPda(courseId, learner, PROGRAM_ID);
      const enrollment = await program.account.enrollment.fetchNullable(enrollmentPda);
      
      if (!enrollment) return null;
      
      return {
        ...enrollment,
        enrollmentPda: enrollmentPda.toBase58(),
        completedLessons: countCompletedLessons(enrollment.lessonFlags, 0), // Need course data for lesson count
      };
    },
    enabled: !!courseId && !!learner,
  });
}
```

### Fetch User's Enrollments

```typescript
export function useUserEnrollments(learner: PublicKey | null) {
  const { program } = useProgram();
  
  return useQuery({
    queryKey: ['enrollments', learner?.toBase58()],
    queryFn: async () => {
      if (!learner) return [];
      
      const allEnrollments = await program.account.enrollment.all();
      
      return allEnrollments
        .filter(e => e.account.learner.equals(learner))
        .map(e => ({
          ...e.account,
          enrollmentPda: e.publicKey.toBase58(),
        }));
    },
    enabled: !!learner,
  });
}
```

### Enroll in Course

```typescript
// hooks/useEnroll.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { Transaction, PublicKey, SystemProgram } from '@solana/web3.js';
import { useProgram } from './useProgram';
import { deriveCoursePda, deriveEnrollmentPda } from '@/lib/pda';
import { PROGRAM_ID } from '@/lib/constants';

export function useEnroll() {
  const { publicKey, signTransaction } = useWallet();
  const { connection } = useConnection();
  const { program } = useProgram();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (courseId: string) => {
      if (!publicKey || !signTransaction) {
        throw new Error('Wallet not connected');
      }
      
      const coursePda = deriveCoursePda(courseId, PROGRAM_ID);
      const enrollmentPda = deriveEnrollmentPda(courseId, publicKey, PROGRAM_ID);
      
      // Check if course has prerequisite
      const course = await program.account.course.fetch(coursePda);
      let hasPrerequisite = false;
      let prereqCoursePda: PublicKey | undefined;
      let prereqEnrollmentPda: PublicKey | undefined;
      
      if (course.prerequisite && course.prerequisite.length > 0) {
        const prereqId = course.prerequisite.toString().trim();
        if (prereqId) {
          hasPrerequisite = true;
          prereqCoursePda = deriveCoursePda(prereqId, PROGRAM_ID);
          prereqEnrollmentPda = deriveEnrollmentPda(prereqId, publicKey, PROGRAM_ID);
        }
      }
      
      const tx = await program.methods
        .enroll(courseId)
        .accountsPartial({
          course: coursePda,
          enrollment: enrollmentPda,
          learner: publicKey,
          systemProgram: SystemProgram.programId,
        })
        .transaction();
      
      if (hasPrerequisite && prereqCoursePda && prereqEnrollmentPda) {
        tx.addRemainingAccounts([
          { pubkey: prereqCoursePda, isWritable: false, isSigner: false },
          { pubkey: prereqEnrollmentPda, isWritable: false, isSigner: false },
        ]);
      }
      
      const signedTx = await signTransaction(tx);
      const txHash = await connection.sendRawTransaction(signedTx.serialize());
      await connection.confirmTransaction(txHash);
      
      return { txHash, enrollmentPda: enrollmentPda.toBase58() };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
    },
  });
}
```

### Close Enrollment

```typescript
// hooks/useCloseEnrollment.ts
export function useCloseEnrollment() {
  const { publicKey, signTransaction } = useWallet();
  const { connection } = useConnection();
  const { program } = useProgram();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (courseId: string) => {
      if (!publicKey || !signTransaction) {
        throw new Error('Wallet not connected');
      }
      
      const coursePda = deriveCoursePda(courseId, PROGRAM_ID);
      const enrollmentPda = deriveEnrollmentPda(courseId, publicKey, PROGRAM_ID);
      
      const tx = await program.methods
        .closeEnrollment()
        .accountsPartial({
          course: coursePda,
          enrollment: enrollmentPda,
          learner: publicKey,
        })
        .transaction();
      
      const signedTx = await signTransaction(tx);
      const txHash = await connection.sendRawTransaction(signedTx.serialize());
      await connection.confirmTransaction(txHash);
      
      return { txHash };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
    },
  });
}
```

## Enrollment Progress Component

```typescript
// components/enrollment/EnrollmentProgress.tsx
interface EnrollmentProgressProps {
  enrollment: Enrollment;
  course: Course;
}

export function EnrollmentProgress({ enrollment, course }: EnrollmentProgressProps) {
  const progress = getProgressPercentage(enrollment.lessonFlags, course.lessonCount);
  const completedLessons = countCompletedLessons(enrollment.lessonFlags, course.lessonCount);
  
  return (
    <div className="enrollment-progress">
      <div className="progress-header">
        <span className="completed">{completedLessons}/{course.lessonCount} lessons</span>
        <span className="percentage">{progress}%</span>
      </div>
      
      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${progress}%` }}
        />
      </div>
      
      {enrollment.completedAt && (
        <div className="completed-badge">
          <CheckCircleIcon />
          Completed
        </div>
      )}
      
      {enrollment.credentialAsset && (
        <div className="credential-badge">
          <CredentialIcon />
          Credential Issued
        </div>
      )}
    </div>
  );
}
```

## Lesson List Component

```typescript
// components/enrollment/LessonList.tsx
interface LessonListProps {
  lessons: Lesson[];
  lessonFlags: BN[];
  onLessonClick?: (index: number) => void;
}

export function LessonList({ lessons, lessonFlags, onLessonClick }: LessonListProps) {
  return (
    <div className="lesson-list">
      {lessons.map((lesson, index) => {
        const isComplete = isLessonComplete(lessonFlags, index);
        
        return (
          <div 
            key={index}
            className={`lesson-item ${isComplete ? 'completed' : ''}`}
            onClick={() => onLessonClick?.(index)}
          >
            <div className="lesson-status">
              {isComplete ? <CheckCircleIcon /> : <CircleIcon />}
            </div>
            <div className="lesson-info">
              <span className="lesson-number">Lesson {index + 1}</span>
              <span className="lesson-title">{lesson.title}</span>
              <span className="lesson-duration">{lesson.duration} min</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
```
