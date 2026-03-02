import { PublicKey } from "@solana/web3.js";
import { PROGRAM_ID } from "./constants";

export const getConfigPda = (): PublicKey => {
   const [configPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('config')],
      PROGRAM_ID
   )
   return configPda
}

export const getCoursePda = (courseId: string): PublicKey => {
   const [coursePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("course"), Buffer.from(courseId)],
      PROGRAM_ID
   )
   return coursePda
}

export const getEnrollmentPda = (courseId: string, learner: PublicKey): PublicKey => {
   const [enrollmentPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("enrollment"), Buffer.from(courseId), learner.toBuffer()],
      PROGRAM_ID
   )
   return enrollmentPda
}

export const getMinterRolePda = (minter: PublicKey): PublicKey => {
   const [minterRolePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("minter"), minter.toBuffer()],
      PROGRAM_ID
   )
   return minterRolePda
}

export const getAchievementTypePda = (achievementId: string): PublicKey => {
   const [achievementTypePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("achievement"), Buffer.from(achievementId)],
      PROGRAM_ID
   )
   return achievementTypePda
}

export const getReeiptPda = (achievementId: string, recipient: PublicKey): PublicKey => {
   const [receiptPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("achievement_receipt"), Buffer.from(achievementId), recipient.toBuffer()],
      PROGRAM_ID
   )
   return receiptPda
}
