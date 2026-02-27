/**
 * IDL stub for the Superteam Academy Anchor program.
 * Replace with the generated IDL from `anchor build` in onchain-academy/.
 *
 * To get the real IDL:
 *   cd ../onchain-academy
 *   anchor build
 *   cp target/idl/onchain_academy.json ../app/src/lib/onchain_academy.json
 * Then update this file to import from that JSON.
 */

// Minimal IDL stub — enough for frontend type safety until real IDL is generated
export const IDL = {
  version: "0.1.0",
  name: "onchain_academy",
  instructions: [
    {
      name: "enroll",
      accounts: [
        { name: "course", isMut: false, isSigner: false },
        { name: "enrollment", isMut: true, isSigner: false },
        { name: "learner", isMut: true, isSigner: true },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [{ name: "courseId", type: "string" }],
    },
    {
      name: "closeEnrollment",
      accounts: [
        { name: "course", isMut: false, isSigner: false },
        { name: "enrollment", isMut: true, isSigner: false },
        { name: "learner", isMut: true, isSigner: true },
      ],
      args: [],
    },
  ],
  accounts: [
    {
      name: "Config",
      type: {
        kind: "struct",
        fields: [
          { name: "authority", type: "publicKey" },
          { name: "backendSigner", type: "publicKey" },
          { name: "xpMint", type: "publicKey" },
        ],
      },
    },
    {
      name: "Course",
      type: {
        kind: "struct",
        fields: [
          { name: "courseId", type: "string" },
          { name: "creator", type: "publicKey" },
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
      type: {
        kind: "struct",
        fields: [
          { name: "courseId", type: "string" },
          { name: "learner", type: "publicKey" },
          { name: "lessonFlags", type: { array: ["u64", 4] } },
          { name: "enrolledAt", type: "i64" },
          { name: "completedAt", type: { option: "i64" } },
          { name: "credentialAsset", type: { option: "publicKey" } },
        ],
      },
    },
  ],
  errors: [],
} as const;

export type OnchainAcademy = typeof IDL;
