import 'server-only'

import { AnchorProvider, Program } from '@coral-xyz/anchor'
import { PublicKey } from '@solana/web3.js'
import { OnchainAcademy } from '~/types/onchain_academy'

import IDL from '~/types/idl/onchain_academy.json'

export async function enrollUserInCourse(_courseID: string, _userPubkey: string) {

}

export async function closeEnrollment(_userPubkey: string) {

}

// export async function getCourses() {

// }
class IntegrationService {

   // private programId: PublicKey
   // private token2020ProgramId: PublicKey
   // private MLPCoreProgramId: PublicKey

   private program: Program<OnchainAcademy>

   constructor() {
      const provider = AnchorProvider.env()
      // this.programId = new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID!)
      // this.token2020ProgramId = new PublicKey(process.env.NEXT_PUBLIC_TOKEN_2020_PROGRAM_ID!)
      // this.MLPCoreProgramId = new PublicKey(process.env.NEXT_PUBLIC_MLP_CORE_PROGRAM_ID!)

      this.program = new Program<OnchainAcademy>(IDL, provider)
   }

   async getCourses() {
      return await this.program.account.course.all()
   }
}

export const integrationService = new IntegrationService()