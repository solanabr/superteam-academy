/**
 * IDL stub for the Superteam Academy Anchor program.
 * Updated to Anchor 0.32 format with discriminators.
 *
 * To replace with the real IDL:
 *   cd ../onchain-academy && anchor build
 *   cp target/idl/onchain_academy.json ../app/src/lib/onchain_academy.json
 * Then import from that JSON file instead.
 */

export const IDL = {
  address: "ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf",
  metadata: { name: "onchain_academy", version: "0.1.0", spec: "0.1.0" },
  instructions: [
    {
      name: "enroll",
      discriminator: [58, 12, 36, 3, 142, 28, 1, 43],
      accounts: [
        { name: "course", writable: false, signer: false },
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
      type: {
        kind: "struct",
        fields: [
          { name: "authority", type: "pubkey" },
          { name: "backendSigner", type: "pubkey" },
          { name: "xpMint", type: "pubkey" },
        ],
      },
    },
    {
      name: "Course",
      discriminator: [206, 6, 78, 228, 163, 138, 241, 106],
      type: {
        kind: "struct",
        fields: [
          { name: "courseId", type: "string" },
          { name: "creator", type: "pubkey" },
          { name: "lessonCount", type: "u8" },
          { name: "difficulty", type: "u8" },
          { name: "xpPerLesson", type: "u64" },
          { name: "trackId", type: "u8" },
          { name: "isActive", type: "bool" },
          { name: "completionCount", type: "u64" },
        ],
      },
    },
    {
      name: "Enrollment",
      discriminator: [249, 210, 64, 145, 197, 241, 57, 51],
      type: {
        kind: "struct",
        fields: [
          { name: "courseId", type: "string" },
          { name: "learner", type: "pubkey" },
          { name: "lessonFlags", type: { array: ["u64", 4] } },
          { name: "enrolledAt", type: "i64" },
          { name: "completedAt", type: { option: "i64" } },
          { name: "credentialAsset", type: { option: "pubkey" } },
        ],
      },
    },
  ],
  errors: [],
} as const;

export type OnchainAcademy = typeof IDL;
