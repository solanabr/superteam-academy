import { z } from "zod";
import { InstructorId } from "./ids";

export const Instructor = z.object({
  id: InstructorId,
  name: z.string().min(1),
  bio: z.string().optional(),
  avatar: z.string().optional(),
  socialLinks: z
    .object({ twitter: z.string().optional(), github: z.string().optional() })
    .default({}),
});

export type InstructorT = z.infer<typeof Instructor>;
