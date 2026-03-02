'use client'

import { useEffect, useState } from "react"

import { useWallet } from "@solana/wallet-adapter-react"
import { PublicKey } from "@solana/web3.js"

import { PROGRAM_ID } from "~/lib/constants"
import { getProgram } from "~/lib/program-config"
import { useProgram } from "./use-program"


export function useIsAdmin() {
   const { publicKey } = useWallet()
   const [isAdmin, setIsAdmin] = useState(false)
   const [loading, setLoading] = useState(true)
   const [admin, setAdmin] = useState<any>()

   useEffect(() => {
      if (!publicKey) {
         setIsAdmin(false)
         setLoading(false)
         return
      }

      const checkAdmin = async () => {
         try {
            const program = useProgram()
            console.log(program)
            const [configPda] = PublicKey.findProgramAddressSync(
               [Buffer.from('config')],
               PROGRAM_ID
            )
            const config = await program?.account.config.fetch(configPda)
            setAdmin(program)
            setIsAdmin(config ? config.authority.equals(publicKey) : false)
         } catch (e) {
            setIsAdmin(false)
         } finally {
            setLoading(false)
         }
      }

      checkAdmin()
   }, [publicKey])

   return { isAdmin, admin, loading }
}