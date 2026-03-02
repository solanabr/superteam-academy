import * as anchor from "@coral-xyz/anchor"

import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react'
import { useMemo } from 'react'
import IDL from '~/types/idl/onchain_academy.json'
import { OnchainAcademy } from "~/types/onchain_academy"

// const PROGRAM_ID = new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID!)

export function useProgram() {
   const { connection } = useConnection()
   const wallet = useAnchorWallet()

   const program = useMemo(() => {
      if (!wallet) return
      const provider = new anchor.AnchorProvider(connection, wallet)
      anchor.setProvider(provider)
      const program = new anchor.Program<OnchainAcademy>(IDL as any)
      return program
   }, [connection, wallet])

   return program
}