import {
  type Address,
  getAddressEncoder,
  getProgramDerivedAddress,
  getUtf8Encoder,
} from "@solana/kit";
import { ONCHAIN_ACADEMY_PROGRAM_ADDRESS } from "../generated/programs";

export async function getConfigPda(
  programAddress: Address = ONCHAIN_ACADEMY_PROGRAM_ADDRESS,
): Promise<Address> {
  const [configPda] = await getProgramDerivedAddress({
    programAddress,
    seeds: [getUtf8Encoder().encode("config")],
  });
  return configPda;
}

export async function getCoursePda(
  courseId: string,
  programAddress: Address = ONCHAIN_ACADEMY_PROGRAM_ADDRESS,
): Promise<Address> {
  const [coursePda] = await getProgramDerivedAddress({
    programAddress,
    seeds: [
      getUtf8Encoder().encode("course"),
      getUtf8Encoder().encode(courseId),
    ],
  });
  return coursePda;
}

export async function getEnrollmentPda(
  courseId: string,
  learner: Address,
  programAddress: Address = ONCHAIN_ACADEMY_PROGRAM_ADDRESS,
): Promise<Address> {
  const [enrollmentPda] = await getProgramDerivedAddress({
    programAddress,
    seeds: [
      getUtf8Encoder().encode("enrollment"),
      getUtf8Encoder().encode(courseId),
      getAddressEncoder().encode(learner),
    ],
  });
  return enrollmentPda;
}

export async function getAchievementReceiptPda(
  achievementId: string,
  recipient: Address,
  programAddress: Address = ONCHAIN_ACADEMY_PROGRAM_ADDRESS,
): Promise<Address> {
  const [pda] = await getProgramDerivedAddress({
    programAddress,
    seeds: [
      getUtf8Encoder().encode("achievement_receipt"),
      getUtf8Encoder().encode(achievementId),
      getAddressEncoder().encode(recipient),
    ],
  });
  return pda;
}
