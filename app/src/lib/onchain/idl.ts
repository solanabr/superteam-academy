/**
 * IDL type for the on-chain Superteam Academy program.
 * Program ID: ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf
 *
 * Derived from the deployed Anchor program source at solanabr/superteam-academy.
 * This is a minimal IDL representation for the frontend — we only define what we
 * need for reads & learner-signed transactions.
 */
export type OnchainAcademy = {
  version: "0.1.0";
  name: "onchain_academy";
  instructions: [
    {
      name: "initialize";
      accounts: [
        { name: "config"; isMut: true; isSigner: false },
        { name: "xpMint"; isMut: true; isSigner: true },
        { name: "authority"; isMut: true; isSigner: true },
        { name: "backendMinterRole"; isMut: true; isSigner: false },
        { name: "systemProgram"; isMut: false; isSigner: false },
        { name: "tokenProgram"; isMut: false; isSigner: false },
      ];
      args: [];
    },
    {
      name: "updateConfig";
      accounts: [
        { name: "config"; isMut: true; isSigner: false },
        { name: "authority"; isMut: false; isSigner: true },
      ];
      args: [{ name: "params"; type: { defined: "UpdateConfigParams" } }];
    },
    {
      name: "createCourse";
      accounts: [
        { name: "course"; isMut: true; isSigner: false },
        { name: "config"; isMut: false; isSigner: false },
        { name: "authority"; isMut: true; isSigner: true },
        { name: "systemProgram"; isMut: false; isSigner: false },
      ];
      args: [{ name: "params"; type: { defined: "CreateCourseParams" } }];
    },
    {
      name: "updateCourse";
      accounts: [
        { name: "config"; isMut: false; isSigner: false },
        { name: "course"; isMut: true; isSigner: false },
        { name: "authority"; isMut: false; isSigner: true },
      ];
      args: [{ name: "params"; type: { defined: "UpdateCourseParams" } }];
    },
    {
      name: "enroll";
      accounts: [
        { name: "course"; isMut: true; isSigner: false },
        { name: "enrollment"; isMut: true; isSigner: false },
        { name: "learner"; isMut: true; isSigner: true },
        { name: "systemProgram"; isMut: false; isSigner: false },
      ];
      args: [{ name: "courseId"; type: "string" }];
    },
    {
      name: "closeEnrollment";
      accounts: [
        { name: "course"; isMut: false; isSigner: false },
        { name: "enrollment"; isMut: true; isSigner: false },
        { name: "learner"; isMut: true; isSigner: true },
      ];
      args: [];
    },
    {
      name: "completeLesson";
      accounts: [
        { name: "config"; isMut: false; isSigner: false },
        { name: "course"; isMut: false; isSigner: false },
        { name: "enrollment"; isMut: true; isSigner: false },
        { name: "learner"; isMut: false; isSigner: false },
        { name: "learnerTokenAccount"; isMut: true; isSigner: false },
        { name: "xpMint"; isMut: true; isSigner: false },
        { name: "backendSigner"; isMut: false; isSigner: true },
        { name: "tokenProgram"; isMut: false; isSigner: false },
      ];
      args: [{ name: "lessonIndex"; type: "u8" }];
    },
    {
      name: "finalizeCourse";
      accounts: [
        { name: "config"; isMut: false; isSigner: false },
        { name: "course"; isMut: true; isSigner: false },
        { name: "enrollment"; isMut: true; isSigner: false },
        { name: "learner"; isMut: false; isSigner: false },
        { name: "learnerTokenAccount"; isMut: true; isSigner: false },
        { name: "creatorTokenAccount"; isMut: true; isSigner: false },
        { name: "creator"; isMut: false; isSigner: false },
        { name: "xpMint"; isMut: true; isSigner: false },
        { name: "backendSigner"; isMut: false; isSigner: true },
        { name: "tokenProgram"; isMut: false; isSigner: false },
      ];
      args: [];
    },
    {
      name: "issueCredential";
      accounts: [
        { name: "config"; isMut: false; isSigner: false },
        { name: "course"; isMut: false; isSigner: false },
        { name: "enrollment"; isMut: true; isSigner: false },
        { name: "learner"; isMut: false; isSigner: false },
        { name: "credentialAsset"; isMut: true; isSigner: true },
        { name: "trackCollection"; isMut: true; isSigner: false },
        { name: "payer"; isMut: true; isSigner: true },
        { name: "backendSigner"; isMut: false; isSigner: true },
        { name: "mplCoreProgram"; isMut: false; isSigner: false },
        { name: "systemProgram"; isMut: false; isSigner: false },
      ];
      args: [
        { name: "name"; type: "string" },
        { name: "uri"; type: "string" },
        { name: "coursesCompleted"; type: "u8" },
        { name: "totalXp"; type: "u64" },
      ];
    },
    {
      name: "upgradeCredential";
      accounts: [
        { name: "config"; isMut: false; isSigner: false },
        { name: "course"; isMut: false; isSigner: false },
        { name: "enrollment"; isMut: false; isSigner: false },
        { name: "learner"; isMut: false; isSigner: false },
        { name: "credentialAsset"; isMut: true; isSigner: false },
        { name: "trackCollection"; isMut: true; isSigner: false },
        { name: "payer"; isMut: true; isSigner: true },
        { name: "backendSigner"; isMut: false; isSigner: true },
        { name: "mplCoreProgram"; isMut: false; isSigner: false },
        { name: "systemProgram"; isMut: false; isSigner: false },
      ];
      args: [
        { name: "name"; type: "string" },
        { name: "uri"; type: "string" },
        { name: "coursesCompleted"; type: "u8" },
        { name: "totalXp"; type: "u64" },
      ];
    },
    {
      name: "registerMinter";
      accounts: [
        { name: "config"; isMut: false; isSigner: false },
        { name: "minterRole"; isMut: true; isSigner: false },
        { name: "authority"; isMut: true; isSigner: true },
        { name: "payer"; isMut: true; isSigner: true },
        { name: "systemProgram"; isMut: false; isSigner: false },
      ];
      args: [{ name: "params"; type: { defined: "RegisterMinterParams" } }];
    },
    {
      name: "revokeMinter";
      accounts: [
        { name: "config"; isMut: false; isSigner: false },
        { name: "minterRole"; isMut: true; isSigner: false },
        { name: "authority"; isMut: true; isSigner: true },
      ];
      args: [];
    },
    {
      name: "rewardXp";
      accounts: [
        { name: "config"; isMut: false; isSigner: false },
        { name: "minterRole"; isMut: true; isSigner: false },
        { name: "xpMint"; isMut: true; isSigner: false },
        { name: "recipientTokenAccount"; isMut: true; isSigner: false },
        { name: "minter"; isMut: false; isSigner: true },
        { name: "tokenProgram"; isMut: false; isSigner: false },
      ];
      args: [
        { name: "amount"; type: "u64" },
        { name: "memo"; type: "string" },
      ];
    },
    {
      name: "createAchievementType";
      accounts: [
        { name: "config"; isMut: false; isSigner: false },
        { name: "achievementType"; isMut: true; isSigner: false },
        { name: "collection"; isMut: true; isSigner: true },
        { name: "authority"; isMut: false; isSigner: true },
        { name: "payer"; isMut: true; isSigner: true },
        { name: "mplCoreProgram"; isMut: false; isSigner: false },
        { name: "systemProgram"; isMut: false; isSigner: false },
      ];
      args: [
        {
          name: "params";
          type: { defined: "CreateAchievementTypeParams" };
        },
      ];
    },
    {
      name: "deactivateAchievementType";
      accounts: [
        { name: "config"; isMut: false; isSigner: false },
        { name: "achievementType"; isMut: true; isSigner: false },
        { name: "authority"; isMut: false; isSigner: true },
      ];
      args: [];
    },
    {
      name: "awardAchievement";
      accounts: [
        { name: "config"; isMut: false; isSigner: false },
        { name: "achievementType"; isMut: true; isSigner: false },
        { name: "achievementReceipt"; isMut: true; isSigner: false },
        { name: "minterRole"; isMut: true; isSigner: false },
        { name: "asset"; isMut: true; isSigner: true },
        { name: "collection"; isMut: true; isSigner: false },
        { name: "recipient"; isMut: false; isSigner: false },
        { name: "recipientTokenAccount"; isMut: true; isSigner: false },
        { name: "xpMint"; isMut: true; isSigner: false },
        { name: "payer"; isMut: true; isSigner: true },
        { name: "minter"; isMut: false; isSigner: true },
        { name: "mplCoreProgram"; isMut: false; isSigner: false },
        { name: "tokenProgram"; isMut: false; isSigner: false },
        { name: "systemProgram"; isMut: false; isSigner: false },
      ];
      args: [];
    },
  ];
  accounts: [
    {
      name: "config";
      type: {
        kind: "struct";
        fields: [
          { name: "authority"; type: "publicKey" },
          { name: "backendSigner"; type: "publicKey" },
          { name: "xpMint"; type: "publicKey" },
          { name: "bump"; type: "u8" },
        ];
      };
    },
    {
      name: "course";
      type: {
        kind: "struct";
        fields: [
          { name: "courseId"; type: "string" },
          { name: "creator"; type: "publicKey" },
          { name: "authority"; type: "publicKey" },
          { name: "contentTxId"; type: { array: ["u8", 32] } },
          { name: "version"; type: "u16" },
          { name: "lessonCount"; type: "u8" },
          { name: "difficulty"; type: "u8" },
          { name: "xpPerLesson"; type: "u32" },
          { name: "trackId"; type: "u16" },
          { name: "trackLevel"; type: "u8" },
          { name: "prerequisite"; type: { option: "publicKey" } },
          { name: "creatorRewardXp"; type: "u32" },
          { name: "minCompletionsForReward"; type: "u16" },
          { name: "totalCompletions"; type: "u32" },
          { name: "totalEnrollments"; type: "u32" },
          { name: "isActive"; type: "bool" },
          { name: "createdAt"; type: "i64" },
          { name: "updatedAt"; type: "i64" },
          { name: "bump"; type: "u8" },
        ];
      };
    },
    {
      name: "enrollment";
      type: {
        kind: "struct";
        fields: [
          { name: "course"; type: "publicKey" },
          { name: "enrolledVersion"; type: "u16" },
          { name: "enrolledAt"; type: "i64" },
          { name: "completedAt"; type: { option: "i64" } },
          { name: "lessonFlags"; type: { array: ["u64", 4] } },
          { name: "credentialAsset"; type: { option: "publicKey" } },
          { name: "bump"; type: "u8" },
        ];
      };
    },
    {
      name: "minterRole";
      type: {
        kind: "struct";
        fields: [
          { name: "minter"; type: "publicKey" },
          { name: "label"; type: "string" },
          { name: "maxXpPerCall"; type: "u64" },
          { name: "totalXpMinted"; type: "u64" },
          { name: "isActive"; type: "bool" },
          { name: "createdAt"; type: "i64" },
          { name: "bump"; type: "u8" },
        ];
      };
    },
    {
      name: "achievementType";
      type: {
        kind: "struct";
        fields: [
          { name: "achievementId"; type: "string" },
          { name: "name"; type: "string" },
          { name: "metadataUri"; type: "string" },
          { name: "collection"; type: "publicKey" },
          { name: "creator"; type: "publicKey" },
          { name: "maxSupply"; type: "u32" },
          { name: "currentSupply"; type: "u32" },
          { name: "xpReward"; type: "u32" },
          { name: "isActive"; type: "bool" },
          { name: "createdAt"; type: "i64" },
          { name: "bump"; type: "u8" },
        ];
      };
    },
    {
      name: "achievementReceipt";
      type: {
        kind: "struct";
        fields: [
          { name: "asset"; type: "publicKey" },
          { name: "awardedAt"; type: "i64" },
          { name: "bump"; type: "u8" },
        ];
      };
    },
  ];
  types: [
    {
      name: "UpdateConfigParams";
      type: {
        kind: "struct";
        fields: [
          { name: "newBackendSigner"; type: { option: "publicKey" } },
        ];
      };
    },
    {
      name: "CreateCourseParams";
      type: {
        kind: "struct";
        fields: [
          { name: "courseId"; type: "string" },
          { name: "creator"; type: "publicKey" },
          { name: "contentTxId"; type: { array: ["u8", 32] } },
          { name: "lessonCount"; type: "u8" },
          { name: "difficulty"; type: "u8" },
          { name: "xpPerLesson"; type: "u32" },
          { name: "trackId"; type: "u16" },
          { name: "trackLevel"; type: "u8" },
          { name: "prerequisite"; type: { option: "publicKey" } },
          { name: "creatorRewardXp"; type: "u32" },
          { name: "minCompletionsForReward"; type: "u16" },
        ];
      };
    },
    {
      name: "UpdateCourseParams";
      type: {
        kind: "struct";
        fields: [
          { name: "newContentTxId"; type: { option: { array: ["u8", 32] } } },
          { name: "newIsActive"; type: { option: "bool" } },
          { name: "newXpPerLesson"; type: { option: "u32" } },
          { name: "newCreatorRewardXp"; type: { option: "u32" } },
          { name: "newMinCompletionsForReward"; type: { option: "u16" } },
        ];
      };
    },
    {
      name: "RegisterMinterParams";
      type: {
        kind: "struct";
        fields: [
          { name: "minter"; type: "publicKey" },
          { name: "label"; type: "string" },
          { name: "maxXpPerCall"; type: "u64" },
        ];
      };
    },
    {
      name: "CreateAchievementTypeParams";
      type: {
        kind: "struct";
        fields: [
          { name: "achievementId"; type: "string" },
          { name: "name"; type: "string" },
          { name: "metadataUri"; type: "string" },
          { name: "maxSupply"; type: "u32" },
          { name: "xpReward"; type: "u32" },
        ];
      };
    },
  ];
  events: [
    { name: "ConfigUpdated"; fields: [{ name: "timestamp"; type: "i64" }] },
    {
      name: "CourseCreated";
      fields: [
        { name: "courseId"; type: "string" },
        { name: "creator"; type: "publicKey" },
        { name: "trackId"; type: "u16" },
        { name: "trackLevel"; type: "u8" },
        { name: "timestamp"; type: "i64" },
      ];
    },
    {
      name: "Enrolled";
      fields: [
        { name: "learner"; type: "publicKey" },
        { name: "course"; type: "publicKey" },
        { name: "courseVersion"; type: "u16" },
        { name: "timestamp"; type: "i64" },
      ];
    },
    {
      name: "LessonCompleted";
      fields: [
        { name: "learner"; type: "publicKey" },
        { name: "course"; type: "publicKey" },
        { name: "lessonIndex"; type: "u8" },
        { name: "xpEarned"; type: "u32" },
        { name: "timestamp"; type: "i64" },
      ];
    },
    {
      name: "CourseFinalized";
      fields: [
        { name: "learner"; type: "publicKey" },
        { name: "course"; type: "publicKey" },
        { name: "totalXp"; type: "u32" },
        { name: "bonusXp"; type: "u32" },
        { name: "creator"; type: "publicKey" },
        { name: "creatorXp"; type: "u32" },
        { name: "timestamp"; type: "i64" },
      ];
    },
    {
      name: "EnrollmentClosed";
      fields: [
        { name: "learner"; type: "publicKey" },
        { name: "course"; type: "publicKey" },
        { name: "rentReclaimed"; type: "u64" },
        { name: "timestamp"; type: "i64" },
      ];
    },
    {
      name: "CredentialIssued";
      fields: [
        { name: "learner"; type: "publicKey" },
        { name: "course"; type: "publicKey" },
        { name: "asset"; type: "publicKey" },
        { name: "trackId"; type: "u16" },
        { name: "timestamp"; type: "i64" },
      ];
    },
    {
      name: "CredentialUpgraded";
      fields: [
        { name: "learner"; type: "publicKey" },
        { name: "asset"; type: "publicKey" },
        { name: "coursesCompleted"; type: "u8" },
        { name: "totalXp"; type: "u64" },
        { name: "timestamp"; type: "i64" },
      ];
    },
    {
      name: "MinterRegistered";
      fields: [
        { name: "minter"; type: "publicKey" },
        { name: "label"; type: "string" },
        { name: "maxXpPerCall"; type: "u64" },
        { name: "timestamp"; type: "i64" },
      ];
    },
    {
      name: "MinterRevoked";
      fields: [
        { name: "minter"; type: "publicKey" },
        { name: "totalXpMinted"; type: "u64" },
        { name: "timestamp"; type: "i64" },
      ];
    },
    {
      name: "XpRewarded";
      fields: [
        { name: "minter"; type: "publicKey" },
        { name: "recipient"; type: "publicKey" },
        { name: "amount"; type: "u64" },
        { name: "memo"; type: "string" },
        { name: "timestamp"; type: "i64" },
      ];
    },
    {
      name: "AchievementAwarded";
      fields: [
        { name: "achievementId"; type: "string" },
        { name: "recipient"; type: "publicKey" },
        { name: "asset"; type: "publicKey" },
        { name: "xpReward"; type: "u32" },
        { name: "timestamp"; type: "i64" },
      ];
    },
    {
      name: "AchievementTypeCreated";
      fields: [
        { name: "achievementId"; type: "string" },
        { name: "collection"; type: "publicKey" },
        { name: "creator"; type: "publicKey" },
        { name: "maxSupply"; type: "u32" },
        { name: "xpReward"; type: "u32" },
        { name: "timestamp"; type: "i64" },
      ];
    },
    {
      name: "AchievementTypeDeactivated";
      fields: [
        { name: "achievementId"; type: "string" },
        { name: "timestamp"; type: "i64" },
      ];
    },
  ];
  errors: [
    { code: 6000; name: "Unauthorized"; msg: "Unauthorized signer" },
    { code: 6001; name: "CourseNotActive"; msg: "Course not active" },
    {
      code: 6002;
      name: "LessonOutOfBounds";
      msg: "Lesson index out of bounds";
    },
    {
      code: 6003;
      name: "LessonAlreadyCompleted";
      msg: "Lesson already completed";
    },
    {
      code: 6004;
      name: "CourseNotCompleted";
      msg: "Course not fully completed";
    },
    {
      code: 6005;
      name: "CourseAlreadyFinalized";
      msg: "Course already finalized";
    },
    {
      code: 6006;
      name: "CourseNotFinalized";
      msg: "Course not finalized; issue_credential requires finalize_course first";
    },
    {
      code: 6007;
      name: "PrerequisiteNotMet";
      msg: "Prerequisite not met";
    },
    {
      code: 6008;
      name: "UnenrollCooldown";
      msg: "Unenroll cooldown not met (24h)";
    },
    {
      code: 6009;
      name: "MinterNotActive";
      msg: "Minter not active";
    },
    {
      code: 6010;
      name: "MinterAmountExceeded";
      msg: "Minter amount exceeded";
    },
    {
      code: 6011;
      name: "AchievementNotActive";
      msg: "Achievement not active";
    },
    {
      code: 6012;
      name: "AchievementSupplyExhausted";
      msg: "Achievement supply exhausted";
    },
    { code: 6013; name: "InvalidAmount"; msg: "Invalid amount" },
    { code: 6014; name: "Overflow"; msg: "Arithmetic overflow" },
    {
      code: 6015;
      name: "LabelTooLong";
      msg: "Label too long";
    },
    {
      code: 6016;
      name: "AchievementIdTooLong";
      msg: "Achievement ID too long";
    },
    {
      code: 6017;
      name: "AchievementNameTooLong";
      msg: "Achievement name too long";
    },
    {
      code: 6018;
      name: "AchievementUriTooLong";
      msg: "Achievement URI too long";
    },
    {
      code: 6019;
      name: "InvalidXpReward";
      msg: "Invalid XP reward";
    },
  ];
};

/** The IDL JSON object for use with `new Program(IDL, ...)` */
export const IDL: OnchainAcademy = {
  version: "0.1.0",
  name: "onchain_academy",
  instructions: [
    {
      name: "initialize",
      accounts: [
        { name: "config", isMut: true, isSigner: false },
        { name: "xpMint", isMut: true, isSigner: true },
        { name: "authority", isMut: true, isSigner: true },
        { name: "backendMinterRole", isMut: true, isSigner: false },
        { name: "systemProgram", isMut: false, isSigner: false },
        { name: "tokenProgram", isMut: false, isSigner: false },
      ],
      args: [],
    },
    {
      name: "updateConfig",
      accounts: [
        { name: "config", isMut: true, isSigner: false },
        { name: "authority", isMut: false, isSigner: true },
      ],
      args: [{ name: "params", type: { defined: "UpdateConfigParams" } }],
    },
    {
      name: "createCourse",
      accounts: [
        { name: "course", isMut: true, isSigner: false },
        { name: "config", isMut: false, isSigner: false },
        { name: "authority", isMut: true, isSigner: true },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [{ name: "params", type: { defined: "CreateCourseParams" } }],
    },
    {
      name: "updateCourse",
      accounts: [
        { name: "config", isMut: false, isSigner: false },
        { name: "course", isMut: true, isSigner: false },
        { name: "authority", isMut: false, isSigner: true },
      ],
      args: [{ name: "params", type: { defined: "UpdateCourseParams" } }],
    },
    {
      name: "enroll",
      accounts: [
        { name: "course", isMut: true, isSigner: false },
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
    {
      name: "completeLesson",
      accounts: [
        { name: "config", isMut: false, isSigner: false },
        { name: "course", isMut: false, isSigner: false },
        { name: "enrollment", isMut: true, isSigner: false },
        { name: "learner", isMut: false, isSigner: false },
        { name: "learnerTokenAccount", isMut: true, isSigner: false },
        { name: "xpMint", isMut: true, isSigner: false },
        { name: "backendSigner", isMut: false, isSigner: true },
        { name: "tokenProgram", isMut: false, isSigner: false },
      ],
      args: [{ name: "lessonIndex", type: "u8" }],
    },
    {
      name: "finalizeCourse",
      accounts: [
        { name: "config", isMut: false, isSigner: false },
        { name: "course", isMut: true, isSigner: false },
        { name: "enrollment", isMut: true, isSigner: false },
        { name: "learner", isMut: false, isSigner: false },
        { name: "learnerTokenAccount", isMut: true, isSigner: false },
        { name: "creatorTokenAccount", isMut: true, isSigner: false },
        { name: "creator", isMut: false, isSigner: false },
        { name: "xpMint", isMut: true, isSigner: false },
        { name: "backendSigner", isMut: false, isSigner: true },
        { name: "tokenProgram", isMut: false, isSigner: false },
      ],
      args: [],
    },
    {
      name: "issueCredential",
      accounts: [
        { name: "config", isMut: false, isSigner: false },
        { name: "course", isMut: false, isSigner: false },
        { name: "enrollment", isMut: true, isSigner: false },
        { name: "learner", isMut: false, isSigner: false },
        { name: "credentialAsset", isMut: true, isSigner: true },
        { name: "trackCollection", isMut: true, isSigner: false },
        { name: "payer", isMut: true, isSigner: true },
        { name: "backendSigner", isMut: false, isSigner: true },
        { name: "mplCoreProgram", isMut: false, isSigner: false },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [
        { name: "name", type: "string" },
        { name: "uri", type: "string" },
        { name: "coursesCompleted", type: "u8" },
        { name: "totalXp", type: "u64" },
      ],
    },
    {
      name: "upgradeCredential",
      accounts: [
        { name: "config", isMut: false, isSigner: false },
        { name: "course", isMut: false, isSigner: false },
        { name: "enrollment", isMut: false, isSigner: false },
        { name: "learner", isMut: false, isSigner: false },
        { name: "credentialAsset", isMut: true, isSigner: false },
        { name: "trackCollection", isMut: true, isSigner: false },
        { name: "payer", isMut: true, isSigner: true },
        { name: "backendSigner", isMut: false, isSigner: true },
        { name: "mplCoreProgram", isMut: false, isSigner: false },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [
        { name: "name", type: "string" },
        { name: "uri", type: "string" },
        { name: "coursesCompleted", type: "u8" },
        { name: "totalXp", type: "u64" },
      ],
    },
    {
      name: "registerMinter",
      accounts: [
        { name: "config", isMut: false, isSigner: false },
        { name: "minterRole", isMut: true, isSigner: false },
        { name: "authority", isMut: true, isSigner: true },
        { name: "payer", isMut: true, isSigner: true },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [{ name: "params", type: { defined: "RegisterMinterParams" } }],
    },
    {
      name: "revokeMinter",
      accounts: [
        { name: "config", isMut: false, isSigner: false },
        { name: "minterRole", isMut: true, isSigner: false },
        { name: "authority", isMut: true, isSigner: true },
      ],
      args: [],
    },
    {
      name: "rewardXp",
      accounts: [
        { name: "config", isMut: false, isSigner: false },
        { name: "minterRole", isMut: true, isSigner: false },
        { name: "xpMint", isMut: true, isSigner: false },
        { name: "recipientTokenAccount", isMut: true, isSigner: false },
        { name: "minter", isMut: false, isSigner: true },
        { name: "tokenProgram", isMut: false, isSigner: false },
      ],
      args: [
        { name: "amount", type: "u64" },
        { name: "memo", type: "string" },
      ],
    },
    {
      name: "createAchievementType",
      accounts: [
        { name: "config", isMut: false, isSigner: false },
        { name: "achievementType", isMut: true, isSigner: false },
        { name: "collection", isMut: true, isSigner: true },
        { name: "authority", isMut: false, isSigner: true },
        { name: "payer", isMut: true, isSigner: true },
        { name: "mplCoreProgram", isMut: false, isSigner: false },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [
        {
          name: "params",
          type: { defined: "CreateAchievementTypeParams" },
        },
      ],
    },
    {
      name: "deactivateAchievementType",
      accounts: [
        { name: "config", isMut: false, isSigner: false },
        { name: "achievementType", isMut: true, isSigner: false },
        { name: "authority", isMut: false, isSigner: true },
      ],
      args: [],
    },
    {
      name: "awardAchievement",
      accounts: [
        { name: "config", isMut: false, isSigner: false },
        { name: "achievementType", isMut: true, isSigner: false },
        { name: "achievementReceipt", isMut: true, isSigner: false },
        { name: "minterRole", isMut: true, isSigner: false },
        { name: "asset", isMut: true, isSigner: true },
        { name: "collection", isMut: true, isSigner: false },
        { name: "recipient", isMut: false, isSigner: false },
        { name: "recipientTokenAccount", isMut: true, isSigner: false },
        { name: "xpMint", isMut: true, isSigner: false },
        { name: "payer", isMut: true, isSigner: true },
        { name: "minter", isMut: false, isSigner: true },
        { name: "mplCoreProgram", isMut: false, isSigner: false },
        { name: "tokenProgram", isMut: false, isSigner: false },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [],
    },
  ],
  accounts: [
    {
      name: "config",
      type: {
        kind: "struct",
        fields: [
          { name: "authority", type: "publicKey" },
          { name: "backendSigner", type: "publicKey" },
          { name: "xpMint", type: "publicKey" },
          { name: "bump", type: "u8" },
        ],
      },
    },
    {
      name: "course",
      type: {
        kind: "struct",
        fields: [
          { name: "courseId", type: "string" },
          { name: "creator", type: "publicKey" },
          { name: "authority", type: "publicKey" },
          { name: "contentTxId", type: { array: ["u8", 32] } },
          { name: "version", type: "u16" },
          { name: "lessonCount", type: "u8" },
          { name: "difficulty", type: "u8" },
          { name: "xpPerLesson", type: "u32" },
          { name: "trackId", type: "u16" },
          { name: "trackLevel", type: "u8" },
          { name: "prerequisite", type: { option: "publicKey" } },
          { name: "creatorRewardXp", type: "u32" },
          { name: "minCompletionsForReward", type: "u16" },
          { name: "totalCompletions", type: "u32" },
          { name: "totalEnrollments", type: "u32" },
          { name: "isActive", type: "bool" },
          { name: "createdAt", type: "i64" },
          { name: "updatedAt", type: "i64" },
          { name: "bump", type: "u8" },
        ],
      },
    },
    {
      name: "enrollment",
      type: {
        kind: "struct",
        fields: [
          { name: "course", type: "publicKey" },
          { name: "enrolledVersion", type: "u16" },
          { name: "enrolledAt", type: "i64" },
          { name: "completedAt", type: { option: "i64" } },
          { name: "lessonFlags", type: { array: ["u64", 4] } },
          { name: "credentialAsset", type: { option: "publicKey" } },
          { name: "bump", type: "u8" },
        ],
      },
    },
    {
      name: "minterRole",
      type: {
        kind: "struct",
        fields: [
          { name: "minter", type: "publicKey" },
          { name: "label", type: "string" },
          { name: "maxXpPerCall", type: "u64" },
          { name: "totalXpMinted", type: "u64" },
          { name: "isActive", type: "bool" },
          { name: "createdAt", type: "i64" },
          { name: "bump", type: "u8" },
        ],
      },
    },
    {
      name: "achievementType",
      type: {
        kind: "struct",
        fields: [
          { name: "achievementId", type: "string" },
          { name: "name", type: "string" },
          { name: "metadataUri", type: "string" },
          { name: "collection", type: "publicKey" },
          { name: "creator", type: "publicKey" },
          { name: "maxSupply", type: "u32" },
          { name: "currentSupply", type: "u32" },
          { name: "xpReward", type: "u32" },
          { name: "isActive", type: "bool" },
          { name: "createdAt", type: "i64" },
          { name: "bump", type: "u8" },
        ],
      },
    },
    {
      name: "achievementReceipt",
      type: {
        kind: "struct",
        fields: [
          { name: "asset", type: "publicKey" },
          { name: "awardedAt", type: "i64" },
          { name: "bump", type: "u8" },
        ],
      },
    },
  ],
  types: [
    {
      name: "UpdateConfigParams",
      type: {
        kind: "struct",
        fields: [
          { name: "newBackendSigner", type: { option: "publicKey" } },
        ],
      },
    },
    {
      name: "CreateCourseParams",
      type: {
        kind: "struct",
        fields: [
          { name: "courseId", type: "string" },
          { name: "creator", type: "publicKey" },
          { name: "contentTxId", type: { array: ["u8", 32] } },
          { name: "lessonCount", type: "u8" },
          { name: "difficulty", type: "u8" },
          { name: "xpPerLesson", type: "u32" },
          { name: "trackId", type: "u16" },
          { name: "trackLevel", type: "u8" },
          { name: "prerequisite", type: { option: "publicKey" } },
          { name: "creatorRewardXp", type: "u32" },
          { name: "minCompletionsForReward", type: "u16" },
        ],
      },
    },
    {
      name: "UpdateCourseParams",
      type: {
        kind: "struct",
        fields: [
          {
            name: "newContentTxId",
            type: { option: { array: ["u8", 32] } },
          },
          { name: "newIsActive", type: { option: "bool" } },
          { name: "newXpPerLesson", type: { option: "u32" } },
          { name: "newCreatorRewardXp", type: { option: "u32" } },
          { name: "newMinCompletionsForReward", type: { option: "u16" } },
        ],
      },
    },
    {
      name: "RegisterMinterParams",
      type: {
        kind: "struct",
        fields: [
          { name: "minter", type: "publicKey" },
          { name: "label", type: "string" },
          { name: "maxXpPerCall", type: "u64" },
        ],
      },
    },
    {
      name: "CreateAchievementTypeParams",
      type: {
        kind: "struct",
        fields: [
          { name: "achievementId", type: "string" },
          { name: "name", type: "string" },
          { name: "metadataUri", type: "string" },
          { name: "maxSupply", type: "u32" },
          { name: "xpReward", type: "u32" },
        ],
      },
    },
  ],
  events: [
    { name: "ConfigUpdated", fields: [{ name: "timestamp", type: "i64" }] },
    {
      name: "CourseCreated",
      fields: [
        { name: "courseId", type: "string" },
        { name: "creator", type: "publicKey" },
        { name: "trackId", type: "u16" },
        { name: "trackLevel", type: "u8" },
        { name: "timestamp", type: "i64" },
      ],
    },
    {
      name: "Enrolled",
      fields: [
        { name: "learner", type: "publicKey" },
        { name: "course", type: "publicKey" },
        { name: "courseVersion", type: "u16" },
        { name: "timestamp", type: "i64" },
      ],
    },
    {
      name: "LessonCompleted",
      fields: [
        { name: "learner", type: "publicKey" },
        { name: "course", type: "publicKey" },
        { name: "lessonIndex", type: "u8" },
        { name: "xpEarned", type: "u32" },
        { name: "timestamp", type: "i64" },
      ],
    },
    {
      name: "CourseFinalized",
      fields: [
        { name: "learner", type: "publicKey" },
        { name: "course", type: "publicKey" },
        { name: "totalXp", type: "u32" },
        { name: "bonusXp", type: "u32" },
        { name: "creator", type: "publicKey" },
        { name: "creatorXp", type: "u32" },
        { name: "timestamp", type: "i64" },
      ],
    },
    {
      name: "EnrollmentClosed",
      fields: [
        { name: "learner", type: "publicKey" },
        { name: "course", type: "publicKey" },
        { name: "rentReclaimed", type: "u64" },
        { name: "timestamp", type: "i64" },
      ],
    },
    {
      name: "CredentialIssued",
      fields: [
        { name: "learner", type: "publicKey" },
        { name: "course", type: "publicKey" },
        { name: "asset", type: "publicKey" },
        { name: "trackId", type: "u16" },
        { name: "timestamp", type: "i64" },
      ],
    },
    {
      name: "CredentialUpgraded",
      fields: [
        { name: "learner", type: "publicKey" },
        { name: "asset", type: "publicKey" },
        { name: "coursesCompleted", type: "u8" },
        { name: "totalXp", type: "u64" },
        { name: "timestamp", type: "i64" },
      ],
    },
    {
      name: "MinterRegistered",
      fields: [
        { name: "minter", type: "publicKey" },
        { name: "label", type: "string" },
        { name: "maxXpPerCall", type: "u64" },
        { name: "timestamp", type: "i64" },
      ],
    },
    {
      name: "MinterRevoked",
      fields: [
        { name: "minter", type: "publicKey" },
        { name: "totalXpMinted", type: "u64" },
        { name: "timestamp", type: "i64" },
      ],
    },
    {
      name: "XpRewarded",
      fields: [
        { name: "minter", type: "publicKey" },
        { name: "recipient", type: "publicKey" },
        { name: "amount", type: "u64" },
        { name: "memo", type: "string" },
        { name: "timestamp", type: "i64" },
      ],
    },
    {
      name: "AchievementAwarded",
      fields: [
        { name: "achievementId", type: "string" },
        { name: "recipient", type: "publicKey" },
        { name: "asset", type: "publicKey" },
        { name: "xpReward", type: "u32" },
        { name: "timestamp", type: "i64" },
      ],
    },
    {
      name: "AchievementTypeCreated",
      fields: [
        { name: "achievementId", type: "string" },
        { name: "collection", type: "publicKey" },
        { name: "creator", type: "publicKey" },
        { name: "maxSupply", type: "u32" },
        { name: "xpReward", type: "u32" },
        { name: "timestamp", type: "i64" },
      ],
    },
    {
      name: "AchievementTypeDeactivated",
      fields: [
        { name: "achievementId", type: "string" },
        { name: "timestamp", type: "i64" },
      ],
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
      msg: "Course not fully completed",
    },
    {
      code: 6005,
      name: "CourseAlreadyFinalized",
      msg: "Course already finalized",
    },
    {
      code: 6006,
      name: "CourseNotFinalized",
      msg: "Course not finalized; issue_credential requires finalize_course first",
    },
    {
      code: 6007,
      name: "PrerequisiteNotMet",
      msg: "Prerequisite not met",
    },
    {
      code: 6008,
      name: "UnenrollCooldown",
      msg: "Unenroll cooldown not met (24h)",
    },
    { code: 6009, name: "MinterNotActive", msg: "Minter not active" },
    {
      code: 6010,
      name: "MinterAmountExceeded",
      msg: "Minter amount exceeded",
    },
    {
      code: 6011,
      name: "AchievementNotActive",
      msg: "Achievement not active",
    },
    {
      code: 6012,
      name: "AchievementSupplyExhausted",
      msg: "Achievement supply exhausted",
    },
    { code: 6013, name: "InvalidAmount", msg: "Invalid amount" },
    { code: 6014, name: "Overflow", msg: "Arithmetic overflow" },
    { code: 6015, name: "LabelTooLong", msg: "Label too long" },
    {
      code: 6016,
      name: "AchievementIdTooLong",
      msg: "Achievement ID too long",
    },
    {
      code: 6017,
      name: "AchievementNameTooLong",
      msg: "Achievement name too long",
    },
    {
      code: 6018,
      name: "AchievementUriTooLong",
      msg: "Achievement URI too long",
    },
    { code: 6019, name: "InvalidXpReward", msg: "Invalid XP reward" },
  ],
};
