import 'server-only'

import { Program } from '@coral-xyz/anchor'
import { SystemProgram } from '@solana/web3.js'
import { OnchainAcademy } from '~/types/onchain_academy'
import { AnchorWallet } from '@solana/wallet-adapter-react';
import { getCoursePda, getEnrollmentPda } from '~/lib/derive-pda';

class CourseService {

   async enrollCourse(program: Program<OnchainAcademy>, wallet: AnchorWallet, courseId: string) {
      const coursePda = getCoursePda(courseId)
      const enrollmentPda = getEnrollmentPda(courseId, wallet.publicKey)
      return await program.methods
         .enroll(courseId)
         .accountsPartial({
            course: coursePda,
            enrollment: enrollmentPda,
            learner: wallet.publicKey,
            systemProgram: SystemProgram.programId,
         })
         // If course has prerequisite:
         .remainingAccounts([
            // { pubkey: prereqCoursePda, isWritable: false, isSigner: false },
            // { pubkey: prereqEnrollmentPda, isWritable: false, isSigner: false },
         ])
         .rpc();
   }

   async closeEnrollment(program: Program<OnchainAcademy>, wallet: AnchorWallet, courseId: string) {
      const coursePda = getCoursePda(courseId)
      const enrollmentPda = getEnrollmentPda(courseId, wallet.publicKey)
      await program.methods
         .closeEnrollment()
         .accountsPartial({
            course: coursePda,
            enrollment: enrollmentPda,
            learner: wallet.publicKey,
         })
         .rpc();
   }

}

export const cousreService = new CourseService()