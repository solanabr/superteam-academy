'use client'

import * as anchor from '@coral-xyz/anchor'
import { useAnchorWallet, useConnection, useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { PublicKey } from "@solana/web3.js"
import { Button } from '~/components/ui/button'
import { useEffect } from 'react'
import { redirect } from 'next/navigation'
import { getConfigPda } from '~/lib/derive-pda'
import IDL from "~/types/idl/onchain_academy.json"
import { useRouter } from 'next/navigation'

export default function ConnectWallet({ title }: { title?: string }) {
   //    const { sdkHasLoaded, primaryWallet, handleLogOut, setShowAuthFlow } = useDynamicContext()
   //    const isLoggedIn = useIsLoggedIn()

   //    if (isLoggedIn && primaryWallet) return (
   //       <>
   //          <DynamicWidget />
   //          <Button onClick={handleLogOut} variant="outline" className="rounded-full" >
   //             {primaryWallet.address.slice(0, 4)}...{primaryWallet.address.slice(-4)}
   //          </Button>
   //       </>
   //    )

   //    return (
   //       <Button
   //          onClick={() => setShowAuthFlow(true)}
   //          disabled={!sdkHasLoaded}
   //          className="
   //           bg-sol-green hover:bg-sol-forest text-sol-bg font-extrabold uppercase tracking-wide
   //             text-md w-64 rounded-lg px-8 py-6 shadow-sol-yellow shadow-md active:shadow-none
   //             hover:shadow-sol-yellow hover:translate-y-0.5 
   //             active:translate-y-1 transition-all duration-100
   //       ">
   //          {title}
   //       </Button>
   //    )
   // }

   // export default function ConnectButton() {
   const { push } = useRouter()
   const { setVisible } = useWalletModal()
   const { connected, disconnect, publicKey } = useWallet()
   const { connection } = useConnection()
   const wallet = useAnchorWallet()

   useEffect(() => {
      (async () => {
         if (connected)
            if (!(await isAdmin())) push("/dashboard")
            else push("/admin")
         if (!connected) push("/")
      })()

   }, [connected])

   const isAdmin = async () => {
      if (!wallet) return

      const provider = new anchor.AnchorProvider(connection, wallet)
      anchor.setProvider(provider)

      const configPda = getConfigPda()

      const program = new anchor.Program(IDL as any)
      // @ts-ignore
      const config = await program?.account.config.fetch(configPda)
      const admin: PublicKey = config.authority

      return admin.equals(wallet.publicKey)
   }


   return connected ? (
      <Button onClick={disconnect} variant="outline" className="rounded-full">
         {publicKey?.toBase58().slice(0, 4)}...{publicKey?.toBase58().slice(-4)}
      </Button>
   ) : (
      <Button
         onClick={() => setVisible(true)}
         className="
         bg-sol-green hover:bg-sol-forest text-sol-bg font-extrabold uppercase tracking-wide
         text-md w-64 rounded-lg px-8 py-6 shadow-sol-yellow shadow-md active:shadow-none
         hover:shadow-sol-yellow hover:translate-y-0.5 
         active:translate-y-1 transition-all duration-100
      ">
         {title}
      </Button>
   )
}