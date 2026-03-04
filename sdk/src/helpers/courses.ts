import type { Address } from "@solana/kit";
import {
  COURSE_DISCRIMINATOR,
  fetchAllMaybeCourse,
} from "../generated/accounts/course";
import { ONCHAIN_ACADEMY_PROGRAM_ADDRESS } from "../generated/programs";

/**
 * Fetches all course accounts from the program using discriminator filter.
 */
export async function fetchAllCoursesByProgram(
  rpc: Parameters<typeof fetchAllMaybeCourse>[0] & {
    getProgramAccounts: (
      program: Address,
      config?: {
        commitment?: string;
        filters?: Array<{ memcmp: { offset: bigint; bytes: string } }>;
      },
    ) => { send: () => Promise<{ value: Array<{ pubkey: Address }> }> };
  },
  programAddress: Address = ONCHAIN_ACADEMY_PROGRAM_ADDRESS,
) {
  const discriminatorB64 = Buffer.from(COURSE_DISCRIMINATOR).toString("base64");
  const { value: accounts } = await rpc
    .getProgramAccounts(programAddress, {
      commitment: "confirmed",
      filters: [
        {
          memcmp: {
            offset: 0n,
            bytes: `base64:${discriminatorB64}`,
          },
        },
      ],
    })
    .send();

  if (!accounts || accounts.length === 0) {
    return [];
  }

  const addresses = accounts.map((a) => a.pubkey);
  return fetchAllMaybeCourse(rpc, addresses);
}
