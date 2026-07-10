import { z } from "zod";
import { InstructorId } from "./ids";
import { SolanaAddress } from "./wallet";

export const Instructor = z.object({
  id: InstructorId,
  name: z.string().min(1),
  /**
   * The instructor's on-curve wallet. Required: it becomes `Course.creator`
   * on-chain (the creator XP recipient) for every course this instructor teaches,
   * and it is the platform-identity key (`profiles.wallet_address`). A course's
   * creator is resolved as `course.instructor -> instructor.wallet` at sync time;
   * an instructor with no wallet could never receive rewards, so it is invalid.
   */
  wallet: SolanaAddress,
  bio: z.string().optional(),
  avatar: z.string().optional(),
  socialLinks: z
    .object({ twitter: z.string().optional(), github: z.string().optional() })
    .default({}),
});

export type InstructorT = z.infer<typeof Instructor>;
