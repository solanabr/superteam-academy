/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/onchain_academy.json`.
 */
export type OnchainAcademy = {
  address: "7NeJaSRyb4Wxay3Tcd9bdpD7T3GWYUQSFyrhG8SgwE8V";
  metadata: {
    name: "onchainAcademy";
    version: "0.1.0";
    spec: "0.1.0";
    description: "Superteam Academy on-chain program — courses, XP, credentials, achievements";
  };
  instructions: [
    {
      name: "awardAchievement";
      discriminator: [75, 47, 156, 253, 124, 231, 84, 12];
      accounts: [
        {
          name: "config";
          pda: {
            seeds: [
              {
                kind: "const";
                value: [99, 111, 110, 102, 105, 103];
              },
            ];
          };
        },
        {
          name: "achievementType";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [97, 99, 104, 105, 101, 118, 101, 109, 101, 110, 116];
              },
              {
                kind: "account";
                path: "achievement_type.achievement_id";
                account: "achievementType";
              },
            ];
          };
        },
        {
          name: "achievementReceipt";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  97,
                  99,
                  104,
                  105,
                  101,
                  118,
                  101,
                  109,
                  101,
                  110,
                  116,
                  95,
                  114,
                  101,
                  99,
                  101,
                  105,
                  112,
                  116,
                ];
              },
              {
                kind: "account";
                path: "achievement_type.achievement_id";
                account: "achievementType";
              },
              {
                kind: "account";
                path: "recipient";
              },
            ];
          };
        },
        {
          name: "minterRole";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [109, 105, 110, 116, 101, 114];
              },
              {
                kind: "account";
                path: "minter";
              },
            ];
          };
        },
        {
          name: "asset";
          docs: ["New achievement NFT keypair"];
          writable: true;
          signer: true;
        },
        {
          name: "collection";
          writable: true;
        },
        {
          name: "recipient";
        },
        {
          name: "recipientTokenAccount";
          docs: [
            "its base mint (== Config.xp_mint) and token-account owner (== recipient)",
            "are asserted in the handler via `require_xp_recipient` before minting.",
          ];
          writable: true;
        },
        {
          name: "xpMint";
          writable: true;
        },
        {
          name: "payer";
          writable: true;
          signer: true;
        },
        {
          name: "minter";
          signer: true;
        },
        {
          name: "backendSigner";
          docs: [
            "Rotatable backend signer that authorizes the award. Eligibility is",
            "proven off-chain (achievement criteria have no on-chain qualifying",
            "receipt to validate against), so this co-signature is the authorization",
            "boundary: an active minter alone cannot mint arbitrary achievements.",
          ];
          signer: true;
        },
        {
          name: "mplCoreProgram";
          address: "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d";
        },
        {
          name: "tokenProgram";
          address: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
      ];
      args: [];
    },
    {
      name: "closeCourse";
      discriminator: [157, 252, 239, 166, 213, 174, 160, 34];
      accounts: [
        {
          name: "config";
          pda: {
            seeds: [
              {
                kind: "const";
                value: [99, 111, 110, 102, 105, 103];
              },
            ];
          };
        },
        {
          name: "course";
          docs: [
            "for `course_id`) and `owner = crate::ID` (program-owned). Loaded as",
            "`UncheckedAccount` rather than `Account<Course>` so a stale, size-mismatched",
            "(pre-resize, 192-byte) account can still be closed. The handler also",
            "verifies the `Course` discriminator before draining/freeing it.",
          ];
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [99, 111, 117, 114, 115, 101];
              },
              {
                kind: "arg";
                path: "courseId";
              },
            ];
          };
        },
        {
          name: "authority";
          signer: true;
          relations: ["config"];
        },
      ];
      args: [
        {
          name: "courseId";
          type: "string";
        },
      ];
    },
    {
      name: "closeEnrollment";
      discriminator: [236, 137, 133, 253, 91, 138, 217, 91];
      accounts: [
        {
          name: "course";
          pda: {
            seeds: [
              {
                kind: "const";
                value: [99, 111, 117, 114, 115, 101];
              },
              {
                kind: "account";
                path: "course.course_id";
                account: "course";
              },
            ];
          };
        },
        {
          name: "enrollment";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [101, 110, 114, 111, 108, 108, 109, 101, 110, 116];
              },
              {
                kind: "account";
                path: "course.course_id";
                account: "course";
              },
              {
                kind: "account";
                path: "learner";
              },
            ];
          };
        },
        {
          name: "learner";
          writable: true;
          signer: true;
        },
      ];
      args: [];
    },
    {
      name: "completeLesson";
      discriminator: [77, 217, 53, 132, 204, 150, 169, 58];
      accounts: [
        {
          name: "config";
          pda: {
            seeds: [
              {
                kind: "const";
                value: [99, 111, 110, 102, 105, 103];
              },
            ];
          };
        },
        {
          name: "course";
          pda: {
            seeds: [
              {
                kind: "const";
                value: [99, 111, 117, 114, 115, 101];
              },
              {
                kind: "account";
                path: "course.course_id";
                account: "course";
              },
            ];
          };
        },
        {
          name: "enrollment";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [101, 110, 114, 111, 108, 108, 109, 101, 110, 116];
              },
              {
                kind: "account";
                path: "course.course_id";
                account: "course";
              },
              {
                kind: "account";
                path: "learner";
              },
            ];
          };
        },
        {
          name: "learner";
        },
        {
          name: "learnerTokenAccount";
          docs: [
            "base mint (== Config.xp_mint) and token-account owner (== learner) are",
            "asserted in the handler via `require_xp_recipient` before minting.",
          ];
          writable: true;
        },
        {
          name: "xpMint";
          writable: true;
        },
        {
          name: "backendSigner";
          signer: true;
        },
        {
          name: "tokenProgram";
          address: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
        },
      ];
      args: [
        {
          name: "lessonIndex";
          type: "u8";
        },
      ];
    },
    {
      name: "createAchievementType";
      discriminator: [231, 38, 39, 228, 103, 4, 229, 19];
      accounts: [
        {
          name: "config";
          pda: {
            seeds: [
              {
                kind: "const";
                value: [99, 111, 110, 102, 105, 103];
              },
            ];
          };
        },
        {
          name: "achievementType";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [97, 99, 104, 105, 101, 118, 101, 109, 101, 110, 116];
              },
              {
                kind: "arg";
                path: "params.achievement_id";
              },
            ];
          };
        },
        {
          name: "collection";
          docs: ["New Metaplex Core collection keypair"];
          writable: true;
          signer: true;
        },
        {
          name: "authority";
          signer: true;
        },
        {
          name: "payer";
          writable: true;
          signer: true;
        },
        {
          name: "mplCoreProgram";
          address: "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d";
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
      ];
      args: [
        {
          name: "params";
          type: {
            defined: {
              name: "createAchievementTypeParams";
            };
          };
        },
      ];
    },
    {
      name: "createCourse";
      discriminator: [120, 121, 154, 164, 107, 180, 167, 241];
      accounts: [
        {
          name: "course";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [99, 111, 117, 114, 115, 101];
              },
              {
                kind: "arg";
                path: "params.course_id";
              },
            ];
          };
        },
        {
          name: "config";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [99, 111, 110, 102, 105, 103];
              },
            ];
          };
        },
        {
          name: "authority";
          writable: true;
          signer: true;
          relations: ["config"];
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
      ];
      args: [
        {
          name: "params";
          type: {
            defined: {
              name: "createCourseParams";
            };
          };
        },
      ];
    },
    {
      name: "deactivateAchievementType";
      discriminator: [185, 21, 222, 243, 192, 118, 71, 191];
      accounts: [
        {
          name: "config";
          pda: {
            seeds: [
              {
                kind: "const";
                value: [99, 111, 110, 102, 105, 103];
              },
            ];
          };
        },
        {
          name: "achievementType";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [97, 99, 104, 105, 101, 118, 101, 109, 101, 110, 116];
              },
              {
                kind: "account";
                path: "achievement_type.achievement_id";
                account: "achievementType";
              },
            ];
          };
        },
        {
          name: "authority";
          signer: true;
        },
      ];
      args: [];
    },
    {
      name: "enroll";
      discriminator: [58, 12, 36, 3, 142, 28, 1, 43];
      accounts: [
        {
          name: "course";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [99, 111, 117, 114, 115, 101];
              },
              {
                kind: "arg";
                path: "courseId";
              },
            ];
          };
        },
        {
          name: "enrollment";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [101, 110, 114, 111, 108, 108, 109, 101, 110, 116];
              },
              {
                kind: "arg";
                path: "courseId";
              },
              {
                kind: "account";
                path: "learner";
              },
            ];
          };
        },
        {
          name: "learner";
          writable: true;
          signer: true;
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
      ];
      args: [
        {
          name: "courseId";
          type: "string";
        },
      ];
    },
    {
      name: "finalizeCourse";
      discriminator: [68, 189, 122, 239, 39, 121, 16, 218];
      accounts: [
        {
          name: "config";
          pda: {
            seeds: [
              {
                kind: "const";
                value: [99, 111, 110, 102, 105, 103];
              },
            ];
          };
        },
        {
          name: "course";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [99, 111, 117, 114, 115, 101];
              },
              {
                kind: "account";
                path: "course.course_id";
                account: "course";
              },
            ];
          };
        },
        {
          name: "enrollment";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [101, 110, 114, 111, 108, 108, 109, 101, 110, 116];
              },
              {
                kind: "account";
                path: "course.course_id";
                account: "course";
              },
              {
                kind: "account";
                path: "learner";
              },
            ];
          };
        },
        {
          name: "learner";
        },
        {
          name: "learnerTokenAccount";
          docs: [
            "its base mint (== Config.xp_mint) and token-account owner (== learner) are",
            "asserted in the handler via `require_xp_recipient` before minting.",
          ];
          writable: true;
        },
        {
          name: "creatorTokenAccount";
          docs: [
            "its base mint (== Config.xp_mint) and token-account owner (== creator) are",
            "asserted in the handler via `require_xp_recipient` before minting.",
          ];
          writable: true;
        },
        {
          name: "creator";
        },
        {
          name: "xpMint";
          writable: true;
        },
        {
          name: "backendSigner";
          signer: true;
        },
        {
          name: "tokenProgram";
          address: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
        },
      ];
      args: [];
    },
    {
      name: "initialize";
      discriminator: [175, 175, 109, 31, 13, 152, 155, 237];
      accounts: [
        {
          name: "config";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [99, 111, 110, 102, 105, 103];
              },
            ];
          };
        },
        {
          name: "xpMint";
          docs: [
            "Passed as a signer (new keypair) so create_account can assign ownership",
            "to the Token-2022 program.",
          ];
          writable: true;
          signer: true;
        },
        {
          name: "authority";
          writable: true;
          signer: true;
        },
        {
          name: "backendMinterRole";
          docs: [
            "Auto-registered MinterRole for the backend signer (defaults to authority)",
          ];
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [109, 105, 110, 116, 101, 114];
              },
              {
                kind: "account";
                path: "authority";
              },
            ];
          };
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
        {
          name: "tokenProgram";
          address: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
        },
      ];
      args: [];
    },
    {
      name: "issueCredential";
      discriminator: [255, 193, 171, 224, 68, 171, 194, 87];
      accounts: [
        {
          name: "config";
          pda: {
            seeds: [
              {
                kind: "const";
                value: [99, 111, 110, 102, 105, 103];
              },
            ];
          };
        },
        {
          name: "course";
          pda: {
            seeds: [
              {
                kind: "const";
                value: [99, 111, 117, 114, 115, 101];
              },
              {
                kind: "account";
                path: "course.course_id";
                account: "course";
              },
            ];
          };
        },
        {
          name: "enrollment";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [101, 110, 114, 111, 108, 108, 109, 101, 110, 116];
              },
              {
                kind: "account";
                path: "course.course_id";
                account: "course";
              },
              {
                kind: "account";
                path: "learner";
              },
            ];
          };
        },
        {
          name: "learner";
        },
        {
          name: "credentialAsset";
          docs: [
            "New credential NFT asset keypair — must sign the transaction.",
          ];
          writable: true;
          signer: true;
        },
        {
          name: "trackCollection";
          writable: true;
        },
        {
          name: "payer";
          writable: true;
          signer: true;
        },
        {
          name: "backendSigner";
          signer: true;
        },
        {
          name: "mplCoreProgram";
          address: "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d";
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
      ];
      args: [
        {
          name: "credentialName";
          type: "string";
        },
        {
          name: "metadataUri";
          type: "string";
        },
        {
          name: "coursesCompleted";
          type: "u32";
        },
        {
          name: "totalXp";
          type: "u64";
        },
      ];
    },
    {
      name: "registerMinter";
      discriminator: [58, 224, 74, 142, 170, 95, 116, 191];
      accounts: [
        {
          name: "config";
          pda: {
            seeds: [
              {
                kind: "const";
                value: [99, 111, 110, 102, 105, 103];
              },
            ];
          };
        },
        {
          name: "minterRole";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [109, 105, 110, 116, 101, 114];
              },
              {
                kind: "arg";
                path: "params.minter";
              },
            ];
          };
        },
        {
          name: "authority";
          writable: true;
          signer: true;
        },
        {
          name: "payer";
          writable: true;
          signer: true;
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
      ];
      args: [
        {
          name: "params";
          type: {
            defined: {
              name: "registerMinterParams";
            };
          };
        },
      ];
    },
    {
      name: "revokeMinter";
      discriminator: [33, 91, 131, 167, 62, 37, 38, 105];
      accounts: [
        {
          name: "config";
          pda: {
            seeds: [
              {
                kind: "const";
                value: [99, 111, 110, 102, 105, 103];
              },
            ];
          };
        },
        {
          name: "minterRole";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [109, 105, 110, 116, 101, 114];
              },
              {
                kind: "account";
                path: "minter_role.minter";
                account: "minterRole";
              },
            ];
          };
        },
        {
          name: "authority";
          writable: true;
          signer: true;
        },
      ];
      args: [];
    },
    {
      name: "rewardXp";
      discriminator: [144, 187, 117, 238, 89, 118, 224, 145];
      accounts: [
        {
          name: "config";
          pda: {
            seeds: [
              {
                kind: "const";
                value: [99, 111, 110, 102, 105, 103];
              },
            ];
          };
        },
        {
          name: "minterRole";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [109, 105, 110, 116, 101, 114];
              },
              {
                kind: "account";
                path: "minter";
              },
            ];
          };
        },
        {
          name: "xpMint";
          docs: ["Token-2022 XP mint"];
          writable: true;
        },
        {
          name: "recipientTokenAccount";
          docs: [
            "Recipient's Token-2022 ATA for XP.",
            "",
            "reward_xp is address-based by design: the minter passes the destination",
            "ATA directly and there is no on-chain recipient-identity account to bind",
            "its owner against (unlike complete_lesson/finalize_course/award_achievement,",
            "which each own a learner/creator/recipient key). The mint is still pinned",
            "via `require_xp_mint` (== Config.xp_mint) and the amount is bounded by",
            "MAX_XP_PER_MINT + the per-minter cap, so the account cannot be an ATA of an",
            "unrelated mint and the per-call blast radius is bounded.",
          ];
          writable: true;
        },
        {
          name: "minter";
          signer: true;
        },
        {
          name: "backendSigner";
          signer: true;
        },
        {
          name: "tokenProgram";
          address: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
        },
      ];
      args: [
        {
          name: "amount";
          type: "u64";
        },
        {
          name: "memo";
          type: "string";
        },
      ];
    },
    {
      name: "updateConfig";
      discriminator: [29, 158, 252, 191, 10, 83, 219, 99];
      accounts: [
        {
          name: "config";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [99, 111, 110, 102, 105, 103];
              },
            ];
          };
        },
        {
          name: "authority";
          signer: true;
          relations: ["config"];
        },
      ];
      args: [
        {
          name: "params";
          type: {
            defined: {
              name: "updateConfigParams";
            };
          };
        },
      ];
    },
    {
      name: "updateCourse";
      discriminator: [81, 217, 18, 192, 129, 233, 129, 231];
      accounts: [
        {
          name: "config";
          pda: {
            seeds: [
              {
                kind: "const";
                value: [99, 111, 110, 102, 105, 103];
              },
            ];
          };
        },
        {
          name: "course";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [99, 111, 117, 114, 115, 101];
              },
              {
                kind: "account";
                path: "course.course_id";
                account: "course";
              },
            ];
          };
        },
        {
          name: "authority";
          signer: true;
          relations: ["config"];
        },
      ];
      args: [
        {
          name: "params";
          type: {
            defined: {
              name: "updateCourseParams";
            };
          };
        },
      ];
    },
    {
      name: "updateMinter";
      discriminator: [164, 129, 164, 88, 75, 29, 91, 38];
      accounts: [
        {
          name: "config";
          pda: {
            seeds: [
              {
                kind: "const";
                value: [99, 111, 110, 102, 105, 103];
              },
            ];
          };
        },
        {
          name: "minterRole";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [109, 105, 110, 116, 101, 114];
              },
              {
                kind: "account";
                path: "minter_role.minter";
                account: "minterRole";
              },
            ];
          };
        },
        {
          name: "authority";
          signer: true;
        },
      ];
      args: [
        {
          name: "params";
          type: {
            defined: {
              name: "updateMinterParams";
            };
          };
        },
      ];
    },
    {
      name: "upgradeCredential";
      discriminator: [2, 121, 77, 255, 103, 187, 252, 169];
      accounts: [
        {
          name: "config";
          pda: {
            seeds: [
              {
                kind: "const";
                value: [99, 111, 110, 102, 105, 103];
              },
            ];
          };
        },
        {
          name: "course";
          pda: {
            seeds: [
              {
                kind: "const";
                value: [99, 111, 117, 114, 115, 101];
              },
              {
                kind: "account";
                path: "course.course_id";
                account: "course";
              },
            ];
          };
        },
        {
          name: "enrollment";
          pda: {
            seeds: [
              {
                kind: "const";
                value: [101, 110, 114, 111, 108, 108, 109, 101, 110, 116];
              },
              {
                kind: "account";
                path: "course.course_id";
                account: "course";
              },
              {
                kind: "account";
                path: "learner";
              },
            ];
          };
        },
        {
          name: "learner";
        },
        {
          name: "credentialAsset";
          docs: [
            "Existing credential NFT asset — not a signer, validated against enrollment record.",
          ];
          writable: true;
        },
        {
          name: "trackCollection";
          writable: true;
        },
        {
          name: "payer";
          writable: true;
          signer: true;
        },
        {
          name: "backendSigner";
          signer: true;
        },
        {
          name: "mplCoreProgram";
          address: "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d";
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
      ];
      args: [
        {
          name: "credentialName";
          type: "string";
        },
        {
          name: "metadataUri";
          type: "string";
        },
        {
          name: "coursesCompleted";
          type: "u32";
        },
        {
          name: "totalXp";
          type: "u64";
        },
      ];
    },
  ];
  accounts: [
    {
      name: "achievementReceipt";
      discriminator: [149, 5, 79, 178, 116, 231, 43, 248];
    },
    {
      name: "achievementType";
      discriminator: [13, 187, 114, 66, 217, 154, 85, 137];
    },
    {
      name: "config";
      discriminator: [155, 12, 170, 224, 30, 250, 204, 130];
    },
    {
      name: "course";
      discriminator: [206, 6, 78, 228, 163, 138, 241, 106];
    },
    {
      name: "enrollment";
      discriminator: [249, 210, 64, 145, 197, 241, 57, 51];
    },
    {
      name: "minterRole";
      discriminator: [21, 246, 6, 133, 142, 211, 33, 193];
    },
  ];
  events: [
    {
      name: "achievementAwarded";
      discriminator: [127, 212, 93, 231, 175, 0, 69, 150];
    },
    {
      name: "achievementTypeCreated";
      discriminator: [189, 36, 173, 243, 25, 232, 198, 153];
    },
    {
      name: "achievementTypeDeactivated";
      discriminator: [133, 12, 218, 127, 151, 28, 1, 222];
    },
    {
      name: "configUpdated";
      discriminator: [40, 241, 230, 122, 11, 19, 198, 194];
    },
    {
      name: "courseClosed";
      discriminator: [35, 195, 37, 254, 25, 107, 100, 12];
    },
    {
      name: "courseCreated";
      discriminator: [205, 144, 55, 47, 150, 170, 123, 214];
    },
    {
      name: "courseFinalized";
      discriminator: [18, 195, 195, 25, 165, 189, 194, 56];
    },
    {
      name: "courseUpdated";
      discriminator: [124, 141, 110, 224, 149, 124, 26, 141];
    },
    {
      name: "credentialIssued";
      discriminator: [194, 216, 28, 159, 89, 29, 72, 177];
    },
    {
      name: "credentialUpgraded";
      discriminator: [198, 142, 252, 191, 210, 200, 253, 133];
    },
    {
      name: "enrolled";
      discriminator: [129, 156, 102, 214, 94, 196, 220, 127];
    },
    {
      name: "enrollmentClosed";
      discriminator: [197, 4, 145, 238, 217, 4, 175, 77];
    },
    {
      name: "lessonCompleted";
      discriminator: [248, 174, 148, 235, 186, 49, 11, 163];
    },
    {
      name: "minterRegistered";
      discriminator: [104, 203, 87, 105, 23, 33, 231, 1];
    },
    {
      name: "minterRevoked";
      discriminator: [138, 76, 227, 247, 141, 92, 77, 127];
    },
    {
      name: "minterUpdated";
      discriminator: [8, 124, 66, 45, 176, 53, 49, 153];
    },
    {
      name: "mintingPauseSet";
      discriminator: [232, 11, 219, 8, 116, 65, 178, 74];
    },
    {
      name: "xpRewarded";
      discriminator: [140, 182, 232, 144, 16, 155, 237, 182];
    },
  ];
  errors: [
    {
      code: 6000;
      name: "unauthorized";
      msg: "Unauthorized signer";
    },
    {
      code: 6001;
      name: "courseNotActive";
      msg: "Course not active";
    },
    {
      code: 6002;
      name: "lessonOutOfBounds";
      msg: "Lesson index out of bounds";
    },
    {
      code: 6003;
      name: "lessonAlreadyCompleted";
      msg: "Lesson already completed";
    },
    {
      code: 6004;
      name: "courseNotCompleted";
      msg: "Not all lessons completed";
    },
    {
      code: 6005;
      name: "courseAlreadyFinalized";
      msg: "Course already finalized";
    },
    {
      code: 6006;
      name: "courseNotFinalized";
      msg: "Course not finalized";
    },
    {
      code: 6007;
      name: "prerequisiteNotMet";
      msg: "Prerequisite not met";
    },
    {
      code: 6008;
      name: "unenrollCooldown";
      msg: "Close cooldown not met (24h)";
    },
    {
      code: 6009;
      name: "enrollmentCourseMismatch";
      msg: "Enrollment/course mismatch";
    },
    {
      code: 6010;
      name: "overflow";
      msg: "Arithmetic overflow";
    },
    {
      code: 6011;
      name: "courseIdEmpty";
      msg: "Course ID is empty";
    },
    {
      code: 6012;
      name: "courseIdTooLong";
      msg: "Course ID exceeds max length";
    },
    {
      code: 6013;
      name: "invalidLessonCount";
      msg: "Lesson count must be at least 1";
    },
    {
      code: 6014;
      name: "invalidDifficulty";
      msg: "Difficulty must be 1, 2, or 3";
    },
    {
      code: 6015;
      name: "credentialAssetMismatch";
      msg: "Credential asset does not match enrollment record";
    },
    {
      code: 6016;
      name: "collectionMismatch";
      msg: "Collection does not match the course's credential collection";
    },
    {
      code: 6017;
      name: "credentialAlreadyIssued";
      msg: "Credential already issued for this enrollment";
    },
    {
      code: 6018;
      name: "minterNotActive";
      msg: "Minter role is not active";
    },
    {
      code: 6019;
      name: "minterAmountExceeded";
      msg: "Amount exceeds minter's per-call limit";
    },
    {
      code: 6020;
      name: "minterCapExceeded";
      msg: "Cumulative minted XP would exceed minter's total cap";
    },
    {
      code: 6021;
      name: "labelTooLong";
      msg: "Minter label exceeds max length";
    },
    {
      code: 6022;
      name: "achievementNotActive";
      msg: "Achievement type is not active";
    },
    {
      code: 6023;
      name: "achievementSupplyExhausted";
      msg: "Achievement max supply reached";
    },
    {
      code: 6024;
      name: "achievementIdTooLong";
      msg: "Achievement ID exceeds max length";
    },
    {
      code: 6025;
      name: "achievementNameTooLong";
      msg: "Achievement name exceeds max length";
    },
    {
      code: 6026;
      name: "achievementUriTooLong";
      msg: "Achievement URI exceeds max length";
    },
    {
      code: 6027;
      name: "invalidAmount";
      msg: "Amount must be greater than zero";
    },
    {
      code: 6028;
      name: "invalidXpReward";
      msg: "XP reward must be greater than zero";
    },
    {
      code: 6029;
      name: "enrollmentFinalized";
      msg: "Finalized or credentialed enrollment cannot be closed";
    },
    {
      code: 6030;
      name: "invalidCourseAccount";
      msg: "Account is not a valid Course PDA";
    },
    {
      code: 6031;
      name: "mintingPaused";
      msg: "Minting is paused";
    },
    {
      code: 6032;
      name: "wrongXpMint";
      msg: "Recipient token account mint does not match Config.xp_mint";
    },
    {
      code: 6033;
      name: "xpAmountExceedsMax";
      msg: "XP amount exceeds the per-mint ceiling";
    },
    {
      code: 6034;
      name: "staleEnrollment";
      msg: "Enrollment belongs to a superseded course generation";
    },
    {
      code: 6035;
      name: "oldMinterRoleMissing";
      msg: "Backend rotation requires the previous backend minter role account";
    },
    {
      code: 6036;
      name: "enrollmentInProgress";
      msg: "Enrollment with completed lessons cannot be closed";
    },
  ];
  types: [
    {
      name: "achievementAwarded";
      type: {
        kind: "struct";
        fields: [
          {
            name: "achievementId";
            type: "string";
          },
          {
            name: "recipient";
            type: "pubkey";
          },
          {
            name: "asset";
            type: "pubkey";
          },
          {
            name: "xpReward";
            type: "u32";
          },
          {
            name: "timestamp";
            type: "i64";
          },
        ];
      };
    },
    {
      name: "achievementReceipt";
      docs: [
        "Thin PDA for on-chain double-award prevention.",
        'Seeds: ["achievement_receipt", achievement_id.as_bytes(), recipient.key()]',
      ];
      type: {
        kind: "struct";
        fields: [
          {
            name: "asset";
            docs: ["Metaplex Core NFT address"];
            type: "pubkey";
          },
          {
            name: "awardedAt";
            type: "i64";
          },
          {
            name: "bump";
            type: "u8";
          },
        ];
      };
    },
    {
      name: "achievementType";
      type: {
        kind: "struct";
        fields: [
          {
            name: "achievementId";
            type: "string";
          },
          {
            name: "name";
            type: "string";
          },
          {
            name: "metadataUri";
            docs: ["Default metadata URI for minted NFTs"];
            type: "string";
          },
          {
            name: "collection";
            docs: ["Metaplex Core collection for this achievement"];
            type: "pubkey";
          },
          {
            name: "creator";
            type: "pubkey";
          },
          {
            name: "maxSupply";
            docs: ["0 = unlimited supply"];
            type: "u32";
          },
          {
            name: "currentSupply";
            type: "u32";
          },
          {
            name: "xpReward";
            docs: ["XP awarded alongside the NFT (0 = no XP)"];
            type: "u32";
          },
          {
            name: "isActive";
            type: "bool";
          },
          {
            name: "createdAt";
            type: "i64";
          },
          {
            name: "reserved";
            type: {
              array: ["u8", 8];
            };
          },
          {
            name: "bump";
            type: "u8";
          },
        ];
      };
    },
    {
      name: "achievementTypeCreated";
      type: {
        kind: "struct";
        fields: [
          {
            name: "achievementId";
            type: "string";
          },
          {
            name: "collection";
            type: "pubkey";
          },
          {
            name: "creator";
            type: "pubkey";
          },
          {
            name: "maxSupply";
            type: "u32";
          },
          {
            name: "xpReward";
            type: "u32";
          },
          {
            name: "timestamp";
            type: "i64";
          },
        ];
      };
    },
    {
      name: "achievementTypeDeactivated";
      type: {
        kind: "struct";
        fields: [
          {
            name: "achievementId";
            type: "string";
          },
          {
            name: "timestamp";
            type: "i64";
          },
        ];
      };
    },
    {
      name: "config";
      type: {
        kind: "struct";
        fields: [
          {
            name: "authority";
            docs: ["Platform multisig (Squads)"];
            type: "pubkey";
          },
          {
            name: "backendSigner";
            docs: ["Rotatable backend signer for completions"];
            type: "pubkey";
          },
          {
            name: "xpMint";
            docs: ["Token-2022 mint for XP"];
            type: "pubkey";
          },
          {
            name: "paused";
            docs: [
              "Global minting kill-switch. When true, every XP-minting / credential",
              "instruction is blocked: complete_lesson, finalize_course, reward_xp,",
              "award_achievement, and issue_credential. Occupies the first former",
              "`_reserved` byte; legacy accounts (reserved zeroed) deserialize as `false`.",
            ];
            type: "bool";
          },
          {
            name: "reserved";
            docs: ["Reserved for future use"];
            type: {
              array: ["u8", 7];
            };
          },
          {
            name: "bump";
            docs: ["PDA bump"];
            type: "u8";
          },
        ];
      };
    },
    {
      name: "configUpdated";
      type: {
        kind: "struct";
        fields: [
          {
            name: "field";
            type: "string";
          },
          {
            name: "timestamp";
            type: "i64";
          },
        ];
      };
    },
    {
      name: "course";
      type: {
        kind: "struct";
        fields: [
          {
            name: "courseId";
            type: "string";
          },
          {
            name: "creator";
            docs: [
              "XP recipient for creator rewards (not an authority — all admin goes through Config)",
            ];
            type: "pubkey";
          },
          {
            name: "contentTxId";
            type: {
              array: ["u8", 32];
            };
          },
          {
            name: "version";
            type: "u16";
          },
          {
            name: "activeLessons";
            type: {
              array: ["u64", 4];
            };
          },
          {
            name: "difficulty";
            type: "u8";
          },
          {
            name: "xpPerLesson";
            type: "u32";
          },
          {
            name: "trackId";
            type: "u16";
          },
          {
            name: "trackLevel";
            type: "u8";
          },
          {
            name: "prerequisite";
            type: {
              option: "pubkey";
            };
          },
          {
            name: "creatorRewardXp";
            type: "u32";
          },
          {
            name: "totalCompletions";
            type: "u32";
          },
          {
            name: "totalEnrollments";
            type: "u32";
          },
          {
            name: "isActive";
            type: "bool";
          },
          {
            name: "createdAt";
            type: "i64";
          },
          {
            name: "updatedAt";
            type: "i64";
          },
          {
            name: "collection";
            docs: [
              "Metaplex Core collection this course's credentials are minted into.",
              "`Pubkey::default()` until set via `create_course`/`update_course`.",
            ];
            type: "pubkey";
          },
          {
            name: "reserved";
            type: {
              array: ["u8", 8];
            };
          },
          {
            name: "bump";
            type: "u8";
          },
        ];
      };
    },
    {
      name: "courseClosed";
      type: {
        kind: "struct";
        fields: [
          {
            name: "course";
            type: "pubkey";
          },
          {
            name: "courseId";
            type: "string";
          },
          {
            name: "timestamp";
            type: "i64";
          },
        ];
      };
    },
    {
      name: "courseCreated";
      type: {
        kind: "struct";
        fields: [
          {
            name: "course";
            type: "pubkey";
          },
          {
            name: "courseId";
            type: "string";
          },
          {
            name: "creator";
            type: "pubkey";
          },
          {
            name: "trackId";
            type: "u16";
          },
          {
            name: "trackLevel";
            type: "u8";
          },
          {
            name: "collection";
            type: "pubkey";
          },
          {
            name: "timestamp";
            type: "i64";
          },
        ];
      };
    },
    {
      name: "courseFinalized";
      type: {
        kind: "struct";
        fields: [
          {
            name: "learner";
            type: "pubkey";
          },
          {
            name: "course";
            type: "pubkey";
          },
          {
            name: "totalXp";
            type: "u32";
          },
          {
            name: "bonusXp";
            type: "u64";
          },
          {
            name: "creator";
            type: "pubkey";
          },
          {
            name: "creatorXp";
            type: "u32";
          },
          {
            name: "timestamp";
            type: "i64";
          },
        ];
      };
    },
    {
      name: "courseUpdated";
      type: {
        kind: "struct";
        fields: [
          {
            name: "course";
            type: "pubkey";
          },
          {
            name: "version";
            type: "u16";
          },
          {
            name: "collection";
            type: "pubkey";
          },
          {
            name: "timestamp";
            type: "i64";
          },
        ];
      };
    },
    {
      name: "createAchievementTypeParams";
      type: {
        kind: "struct";
        fields: [
          {
            name: "achievementId";
            type: "string";
          },
          {
            name: "name";
            type: "string";
          },
          {
            name: "metadataUri";
            type: "string";
          },
          {
            name: "maxSupply";
            type: "u32";
          },
          {
            name: "xpReward";
            type: "u32";
          },
        ];
      };
    },
    {
      name: "createCourseParams";
      type: {
        kind: "struct";
        fields: [
          {
            name: "courseId";
            type: "string";
          },
          {
            name: "creator";
            type: "pubkey";
          },
          {
            name: "contentTxId";
            type: {
              array: ["u8", 32];
            };
          },
          {
            name: "lessonCount";
            type: "u8";
          },
          {
            name: "difficulty";
            type: "u8";
          },
          {
            name: "xpPerLesson";
            type: "u32";
          },
          {
            name: "trackId";
            type: "u16";
          },
          {
            name: "trackLevel";
            type: "u8";
          },
          {
            name: "prerequisite";
            type: {
              option: "pubkey";
            };
          },
          {
            name: "creatorRewardXp";
            type: "u32";
          },
          {
            name: "collection";
            docs: [
              "Metaplex Core collection for credential NFTs. `None` defers to a later",
              "`update_course` (the per-course collection is created after the PDA).",
            ];
            type: {
              option: "pubkey";
            };
          },
        ];
      };
    },
    {
      name: "credentialIssued";
      type: {
        kind: "struct";
        fields: [
          {
            name: "learner";
            type: "pubkey";
          },
          {
            name: "trackId";
            type: "u16";
          },
          {
            name: "credentialAsset";
            type: "pubkey";
          },
          {
            name: "currentLevel";
            type: "u8";
          },
          {
            name: "timestamp";
            type: "i64";
          },
        ];
      };
    },
    {
      name: "credentialUpgraded";
      type: {
        kind: "struct";
        fields: [
          {
            name: "learner";
            type: "pubkey";
          },
          {
            name: "trackId";
            type: "u16";
          },
          {
            name: "credentialAsset";
            type: "pubkey";
          },
          {
            name: "currentLevel";
            type: "u8";
          },
          {
            name: "timestamp";
            type: "i64";
          },
        ];
      };
    },
    {
      name: "enrolled";
      type: {
        kind: "struct";
        fields: [
          {
            name: "learner";
            type: "pubkey";
          },
          {
            name: "course";
            type: "pubkey";
          },
          {
            name: "courseVersion";
            type: "u16";
          },
          {
            name: "timestamp";
            type: "i64";
          },
        ];
      };
    },
    {
      name: "enrollment";
      type: {
        kind: "struct";
        fields: [
          {
            name: "course";
            docs: ["The Course PDA this enrollment belongs to"];
            type: "pubkey";
          },
          {
            name: "enrolledAt";
            docs: ["When learner enrolled"];
            type: "i64";
          },
          {
            name: "completedAt";
            docs: ["When course was completed (None if in progress)"];
            type: {
              option: "i64";
            };
          },
          {
            name: "lessonFlags";
            docs: [
              "Lesson completion bitmap: 4 × u64 = 256 bits.",
              "lesson_count is u8 (max 255), so all valid indices fit within this bitmap.",
            ];
            type: {
              array: ["u64", 4];
            };
          },
          {
            name: "credentialAsset";
            docs: [
              "Credential NFT address for this track (set by issue_credential)",
            ];
            type: {
              option: "pubkey";
            };
          },
          {
            name: "reserved";
            docs: [
              "Forward-compat padding (4 bytes — differs from the 8 reserved on other",
              "accounts). A future field is carved from this in place, the same way",
              "`Config.paused` and `MinterRole.max_total_xp` were: replace some of these",
              "bytes with a real field declared immediately before `bump` so the field's",
              "Borsh offset is unchanged, and shrink `_reserved` by the field's width so",
              "`SIZE` stays constant. Because Borsh lays fields out in declaration order",
              "and these bytes are already zero on every existing account, legacy",
              "enrollments deserialize the new field as all-zeros (`0` / `false` /",
              "`None`) — pick a type whose zero value preserves prior behavior. Widening",
              "past these 4 bytes (or reordering fields) changes the layout/account size",
              "and is a migration (realloc + backfill), not an in-place change.",
            ];
            type: {
              array: ["u8", 4];
            };
          },
          {
            name: "bump";
            docs: ["PDA bump"];
            type: "u8";
          },
        ];
      };
    },
    {
      name: "enrollmentClosed";
      type: {
        kind: "struct";
        fields: [
          {
            name: "learner";
            type: "pubkey";
          },
          {
            name: "course";
            type: "pubkey";
          },
          {
            name: "completed";
            type: "bool";
          },
          {
            name: "rentReclaimed";
            type: "u64";
          },
          {
            name: "timestamp";
            type: "i64";
          },
        ];
      };
    },
    {
      name: "lessonCompleted";
      type: {
        kind: "struct";
        fields: [
          {
            name: "learner";
            type: "pubkey";
          },
          {
            name: "course";
            type: "pubkey";
          },
          {
            name: "lessonIndex";
            type: "u8";
          },
          {
            name: "xpEarned";
            type: "u32";
          },
          {
            name: "timestamp";
            type: "i64";
          },
        ];
      };
    },
    {
      name: "minterRegistered";
      type: {
        kind: "struct";
        fields: [
          {
            name: "minter";
            type: "pubkey";
          },
          {
            name: "label";
            type: "string";
          },
          {
            name: "maxXpPerCall";
            type: "u64";
          },
          {
            name: "maxTotalXp";
            type: "u64";
          },
          {
            name: "timestamp";
            type: "i64";
          },
        ];
      };
    },
    {
      name: "minterRevoked";
      type: {
        kind: "struct";
        fields: [
          {
            name: "minter";
            type: "pubkey";
          },
          {
            name: "totalXpMinted";
            type: "u64";
          },
          {
            name: "timestamp";
            type: "i64";
          },
        ];
      };
    },
    {
      name: "minterRole";
      type: {
        kind: "struct";
        fields: [
          {
            name: "minter";
            docs: ["Wallet or program PDA authorized to mint XP"];
            type: "pubkey";
          },
          {
            name: "label";
            docs: [
              'Human-readable label ("streak-program", "irl-events", etc.)',
            ];
            type: "string";
          },
          {
            name: "maxXpPerCall";
            docs: ["Per-call XP cap. 0 = unlimited."];
            type: "u64";
          },
          {
            name: "totalXpMinted";
            docs: ["Lifetime XP minted through this role"];
            type: "u64";
          },
          {
            name: "isActive";
            type: "bool";
          },
          {
            name: "createdAt";
            type: "i64";
          },
          {
            name: "maxTotalXp";
            docs: [
              "Cumulative XP ceiling for this role. 0 = unlimited.",
              "Occupies the 8 bytes formerly reserved, so the account size is",
              "unchanged and pre-existing roles deserialize with this field = 0",
              "(unlimited), preserving prior behavior until an admin sets a cap.",
            ];
            type: "u64";
          },
          {
            name: "bump";
            type: "u8";
          },
        ];
      };
    },
    {
      name: "minterUpdated";
      type: {
        kind: "struct";
        fields: [
          {
            name: "minter";
            type: "pubkey";
          },
          {
            name: "maxXpPerCall";
            type: "u64";
          },
          {
            name: "maxTotalXp";
            type: "u64";
          },
          {
            name: "timestamp";
            type: "i64";
          },
        ];
      };
    },
    {
      name: "mintingPauseSet";
      type: {
        kind: "struct";
        fields: [
          {
            name: "paused";
            type: "bool";
          },
          {
            name: "timestamp";
            type: "i64";
          },
        ];
      };
    },
    {
      name: "registerMinterParams";
      type: {
        kind: "struct";
        fields: [
          {
            name: "minter";
            type: "pubkey";
          },
          {
            name: "label";
            type: "string";
          },
          {
            name: "maxXpPerCall";
            type: "u64";
          },
          {
            name: "maxTotalXp";
            docs: ["Cumulative XP ceiling for this role. 0 = unlimited."];
            type: "u64";
          },
        ];
      };
    },
    {
      name: "updateConfigParams";
      type: {
        kind: "struct";
        fields: [
          {
            name: "newBackendSigner";
            type: {
              option: "pubkey";
            };
          },
          {
            name: "paused";
            docs: [
              "Minting kill-switch toggle. `Some(true)` pauses all minting,",
              "`Some(false)` resumes, `None` leaves it unchanged.",
            ];
            type: {
              option: "bool";
            };
          },
          {
            name: "newAuthority";
            docs: [
              "Rotate the platform authority (governance handover). `Some(a)` sets",
              "`Config.authority = a`, `None` leaves it unchanged. The struct's",
              "`has_one = authority` gate means the CURRENT authority co-signs the",
              "rotation, so this cannot be used to seize control — only to hand it off",
              "(e.g. to a Squads multisig) without a program upgrade.",
            ];
            type: {
              option: "pubkey";
            };
          },
        ];
      };
    },
    {
      name: "updateCourseParams";
      type: {
        kind: "struct";
        fields: [
          {
            name: "newContentTxId";
            type: {
              option: {
                array: ["u8", 32];
              };
            };
          },
          {
            name: "newIsActive";
            type: {
              option: "bool";
            };
          },
          {
            name: "newXpPerLesson";
            type: {
              option: "u32";
            };
          },
          {
            name: "newCreatorRewardXp";
            type: {
              option: "u32";
            };
          },
          {
            name: "newCollection";
            docs: [
              "Set/backfill the Metaplex Core credential collection for this course.",
            ];
            type: {
              option: "pubkey";
            };
          },
          {
            name: "newActiveLessons";
            docs: [
              "Retire/rewrite the live lesson slots (256-bit mask). Replaces v1 newLessonCount.",
            ];
            type: {
              option: {
                array: ["u64", 4];
              };
            };
          },
        ];
      };
    },
    {
      name: "updateMinterParams";
      type: {
        kind: "struct";
        fields: [
          {
            name: "maxXpPerCall";
            docs: ["New per-call XP cap. 0 = unlimited."];
            type: "u64";
          },
          {
            name: "maxTotalXp";
            docs: [
              "New cumulative XP ceiling. 0 = unlimited. Setting this at or below the",
              "role's existing total_xp_minted freezes the role from further minting,",
              "which is a valid way to retire a minter without closing its PDA.",
            ];
            type: "u64";
          },
        ];
      };
    },
    {
      name: "xpRewarded";
      type: {
        kind: "struct";
        fields: [
          {
            name: "minter";
            type: "pubkey";
          },
          {
            name: "recipient";
            type: "pubkey";
          },
          {
            name: "amount";
            type: "u64";
          },
          {
            name: "memo";
            type: "string";
          },
          {
            name: "timestamp";
            type: "i64";
          },
        ];
      };
    },
  ];
};
