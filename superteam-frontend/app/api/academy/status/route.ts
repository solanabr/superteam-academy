import { NextResponse } from "next/server"
import { ACADEMY_CLUSTER, ACADEMY_PROGRAM_ID, ACADEMY_RPC_URL } from "@/lib/generated/academy-program"
import { getAcademyConfigOnChain } from "@/lib/server/academy-chain-read"

export async function GET() {
  const config = await getAcademyConfigOnChain().catch(() => null)
  return NextResponse.json(
    {
      ok: true,
      cluster: ACADEMY_CLUSTER,
      rpcUrl: ACADEMY_RPC_URL,
      programId: ACADEMY_PROGRAM_ID,
      configExists: Boolean(config),
      config,
    },
    { status: 200 },
  )
}
