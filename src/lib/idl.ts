/**
 * IDL derived from onchain-academy/programs/onchain-academy/src/
 * Matches program ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf
 */
export const IDL = {
  address: "ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf",
  metadata: {
    name: "onchain_academy",
    version: "0.1.0",
    spec: "0.1.0",
  },
  instructions: [
    {
      name: "enroll",
      discriminator: [58, 12, 36, 3, 142, 28, 1, 43],
      accounts: [
        {
          name: "course",
          writable: true,
          pda: {
            seeds: [
              { kind: "const", value: [99, 111, 117, 114, 115, 101] },
              { kind: "arg", path: "course_id" },
            ],
          },
        },
        {
          name: "enrollment",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [101, 110, 114, 111, 108, 108, 109, 101, 110, 116],
              },
              { kind: "arg", path: "course_id" },
              { kind: "account", path: "learner" },
            ],
          },
        },
        { name: "learner", writable: true, signer: true },
        { name: "system_program", address: "11111111111111111111111111111111" },
      ],
      args: [{ name: "course_id", type: "string" }],
    },
    {
      name: "close_enrollment",
      discriminator: [236, 137, 133, 253, 91, 138, 217, 91],
      accounts: [
        {
          name: "course",
          pda: {
            seeds: [
              { kind: "const", value: [99, 111, 117, 114, 115, 101] },
              { kind: "account", path: "enrollment.course" },
            ],
          },
        },
        {
          name: "enrollment",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [101, 110, 114, 111, 108, 108, 109, 101, 110, 116],
              },
              { kind: "account", path: "course.course_id" },
              { kind: "account", path: "learner" },
            ],
          },
        },
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
  types: [
    {
      name: "Config",
      type: {
        kind: "struct",
        fields: [
          { name: "authority", type: "pubkey" },
          { name: "backend_signer", type: "pubkey" },
          { name: "xp_mint", type: "pubkey" },
          { name: "_reserved", type: { array: ["u8", 8] } },
          { name: "bump", type: "u8" },
        ],
      },
    },
    {
      name: "Course",
      type: {
        kind: "struct",
        fields: [
          { name: "course_id", type: "string" },
          { name: "creator", type: "pubkey" },
          { name: "content_tx_id", type: { array: ["u8", 32] } },
          { name: "version", type: "u16" },
          { name: "lesson_count", type: "u8" },
          { name: "difficulty", type: "u8" },
          { name: "xp_per_lesson", type: "u32" },
          { name: "track_id", type: "u16" },
          { name: "track_level", type: "u8" },
          { name: "prerequisite", type: { option: "pubkey" } },
          { name: "creator_reward_xp", type: "u32" },
          { name: "min_completions_for_reward", type: "u16" },
          { name: "total_completions", type: "u32" },
          { name: "total_enrollments", type: "u32" },
          { name: "is_active", type: "bool" },
          { name: "created_at", type: "i64" },
          { name: "updated_at", type: "i64" },
          { name: "_reserved", type: { array: ["u8", 8] } },
          { name: "bump", type: "u8" },
        ],
      },
    },
    {
      name: "Enrollment",
      type: {
        kind: "struct",
        fields: [
          { name: "course", type: "pubkey" },
          { name: "enrolled_at", type: "i64" },
          { name: "completed_at", type: { option: "i64" } },
          { name: "lesson_flags", type: { array: ["u64", 4] } },
          { name: "credential_asset", type: { option: "pubkey" } },
          { name: "_reserved", type: { array: ["u8", 4] } },
          { name: "bump", type: "u8" },
        ],
      },
    },
  ],
  errors: [
    { code: 6000, name: "Unauthorized", msg: "Unauthorized signer" },
    { code: 6001, name: "CourseNotActive", msg: "Course not active" },
    {
      code: 6002,
      name: "LessonOutOfBounds",
      msg: "Lesson index out of bounds",
    },
    {
      code: 6003,
      name: "LessonAlreadyCompleted",
      msg: "Lesson already completed",
    },
    {
      code: 6004,
      name: "CourseNotCompleted",
      msg: "Not all lessons completed",
    },
    {
      code: 6005,
      name: "CourseAlreadyFinalized",
      msg: "Course already finalized",
    },
    { code: 6006, name: "CourseNotFinalized", msg: "Course not finalized" },
    { code: 6007, name: "PrerequisiteNotMet", msg: "Prerequisite not met" },
    {
      code: 6008,
      name: "UnenrollCooldown",
      msg: "Close cooldown not met (24h)",
    },
    {
      code: 6009,
      name: "EnrollmentCourseMismatch",
      msg: "Enrollment/course mismatch",
    },
    { code: 6010, name: "Overflow", msg: "Arithmetic overflow" },
    { code: 6011, name: "CourseIdEmpty", msg: "Course ID is empty" },
    {
      code: 6012,
      name: "CourseIdTooLong",
      msg: "Course ID exceeds max length",
    },
    {
      code: 6013,
      name: "InvalidLessonCount",
      msg: "Lesson count must be at least 1",
    },
    {
      code: 6014,
      name: "InvalidDifficulty",
      msg: "Difficulty must be 1, 2, or 3",
    },
    {
      code: 6015,
      name: "CredentialAssetMismatch",
      msg: "Credential asset does not match enrollment record",
    },
    {
      code: 6016,
      name: "CredentialAlreadyIssued",
      msg: "Credential already issued for this enrollment",
    },
    { code: 6017, name: "MinterNotActive", msg: "Minter role is not active" },
    {
      code: 6018,
      name: "MinterAmountExceeded",
      msg: "Amount exceeds minter's per-call limit",
    },
    {
      code: 6019,
      name: "LabelTooLong",
      msg: "Minter label exceeds max length",
    },
    {
      code: 6020,
      name: "AchievementNotActive",
      msg: "Achievement type is not active",
    },
    {
      code: 6021,
      name: "AchievementSupplyExhausted",
      msg: "Achievement max supply reached",
    },
    {
      code: 6022,
      name: "AchievementIdTooLong",
      msg: "Achievement ID exceeds max length",
    },
    {
      code: 6023,
      name: "AchievementNameTooLong",
      msg: "Achievement name exceeds max length",
    },
    {
      code: 6024,
      name: "AchievementUriTooLong",
      msg: "Achievement URI exceeds max length",
    },
    {
      code: 6025,
      name: "InvalidAmount",
      msg: "Amount must be greater than zero",
    },
    {
      code: 6026,
      name: "InvalidXpReward",
      msg: "XP reward must be greater than zero",
    },
  ],
} as const;

export type OnchainAcademy = typeof IDL;
