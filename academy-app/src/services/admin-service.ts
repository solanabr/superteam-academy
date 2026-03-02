import { BN, Program } from "@coral-xyz/anchor"
import { AnchorWallet } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { uploadCourseContent } from "~/lib/arweave";
import { getConfigPda, getCoursePda, getMinterRolePda } from "~/lib/derive-pda";
import { buildCreateCourseInterface, ICourse, IUpdateCourse } from "~/types/course"
import { OnchainAcademy } from "~/types/onchain_academy"


class AdminService {
   async createCourse(program: Program<OnchainAcademy>, authority: AnchorWallet, courseContent: ICourse) { 
      const contentTxId = uploadCourseContent(courseContent)
      const course = buildCreateCourseInterface(courseContent, contentTxId)
      const coursePda = getCoursePda(course.courseId)
      const configPda = getConfigPda()
      return await program.methods
         .createCourse({
           ...course
         })
         .accountsPartial({
            course: coursePda,
            config: configPda,
            authority: authority.publicKey,
            systemProgram: SystemProgram.programId,
         })
         .rpc();

   }

   async updateCourse(program: Program<OnchainAcademy>, authority: AnchorWallet, courseId: string, updateCourseParam: IUpdateCourse) { 
      const coursePda = getCoursePda(courseId)
      const configPda = getConfigPda()
      return await program.methods
         .updateCourse({
            ...updateCourseParam
         })
         .accountsPartial({
            config: configPda,
            course: coursePda,
            authority: authority.publicKey,
         })
         .rpc();
   }

   async updateConfig(program: Program<OnchainAcademy>, authority: AnchorWallet, newBackendSigner: string, oldMinter?: string) {
      const configPda = getConfigPda()
      const minterPda = oldMinter ? getMinterRolePda(new PublicKey(oldMinter)) : null
      return await program.methods
         .updateConfig({ newBackendSigner })
         .accountsPartial({
            config: configPda,
            authority: authority.publicKey,
         })
         .remainingAccounts(minterPda ? [
            { pubkey: minterPda, isWritable: true, isSigner: false },
         ] : [])
         .rpc();
    }

   async registerMinter(program: Program<OnchainAcademy>, authority: AnchorWallet, minterPubkey: string) {
      const configPda = getConfigPda()
      const minterPda = getMinterRolePda(new PublicKey(minterPubkey))
      return await program.methods
         .registerMinter({
            minter: minterPubkey,
            label: "irl-events",
            maxXpPerCall: new BN(1000),
         })
         .accountsPartial({
            config: configPda,
            minterRole: minterPda,
            authority: authority.publicKey,
            payer: authority.publicKey,
            systemProgram: SystemProgram.programId,
         })
         .rpc();
    }

   async revokeMinter(program: Program<OnchainAcademy>, authority: AnchorWallet, minterPubkey: string) {
      const configPda = getConfigPda()
      const minterRolePda = getMinterRolePda(new PublicKey(minterPubkey))
      return await program.methods
         .revokeMinter()
         .accountsPartial({
            config: configPda,
            minterRole: minterRolePda,
            authority: authority.publicKey,
         })
         .rpc();
    }

   async createArchievement() { }

   async deactivateArchievement() { }


}

export const adminService = new AdminService()