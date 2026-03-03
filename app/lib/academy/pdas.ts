import {
  type Address,
  getAddressEncoder,
  getBytesEncoder,
  getProgramDerivedAddress,
  getUtf8Encoder,
} from "@solana/kit";
import { ONCHAIN_ACADEMY_PROGRAM_ADDRESS } from "@superteam/academy-sdk";

export async function getCoursePda(courseId: string): Promise<Address> {
  const [coursePda] = await getProgramDerivedAddress({
    programAddress: ONCHAIN_ACADEMY_PROGRAM_ADDRESS,
    seeds: [
      getBytesEncoder().encode(new Uint8Array([99, 111, 117, 114, 115, 101])),
      getUtf8Encoder().encode(courseId),
    ],
  });

  return coursePda;
}

export async function getEnrollmentPda(
  courseId: string,
  learnerAddress: Address
): Promise<Address> {
  const [enrollmentPda] = await getProgramDerivedAddress({
    programAddress: ONCHAIN_ACADEMY_PROGRAM_ADDRESS,
    seeds: [
      getBytesEncoder().encode(
        new Uint8Array([101, 110, 114, 111, 108, 108, 109, 101, 110, 116])
      ),
      getUtf8Encoder().encode(courseId),
      getAddressEncoder().encode(learnerAddress),
    ],
  });

  return enrollmentPda;
}
