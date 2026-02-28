/**
 * IDL for the Superteam Academy Anchor program (onchain_academy).
 * Matches the deployed program at ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf
 *
 * To refresh from a local build:
 *   cd ../onchain-academy && anchor build
 *   cp target/idl/onchain_academy.json ../app/src/lib/onchain_academy.json
 */

export const IDL = {
  address: "ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf",
  metadata: { name: "onchain_academy", version: "0.1.0", spec: "0.1.0" },
  instructions: [
    {
      name: "enroll",
      discriminator: [58, 12, 36, 3, 142, 28, 1, 43],
      accounts: [
        { name: "course", writable: true, signer: false },
        { name: "enrollment", writable: true, signer: false },
        { name: "learner", writable: true, signer: true },
        { name: "systemProgram", writable: false, signer: false },
      ],
      args: [{ name: "courseId", type: "string" }],
    },
    {
      name: "closeEnrollment",
      discriminator: [118, 125, 226, 183, 184, 185, 94, 54],
      accounts: [
        { name: "course", writable: false, signer: false },
        { name: "enrollment", writable: true, signer: false },
        { name: "learner", writable: true, signer: true },
      ],
      args: [],
    },
  ],
  accounts: [
    {
      name: "Config",
      discriminator: [155, 12, 170, 224, 30, 250, 204, 130],
    },
    {
      name: "Course",
      discriminator: [206, 6, 78, 228, 163, 138, 241, 106],
    },
    {
      name: "Enrollment",
      discriminator: [249, 210, 64, 145, 197, 241, 57, 51],
    },
  ],
  types: [],
  events: [],
  errors: [
    { code: 6000, name: "CourseNotActive", msg: "Course is not active" },
    { code: 6001, name: "PrerequisiteNotMet", msg: "Prerequisite course not completed" },
    { code: 6002, name: "AlreadyEnrolled", msg: "Learner is already enrolled" },
  ],
} as const;

export type OnchainAcademy = typeof IDL;
