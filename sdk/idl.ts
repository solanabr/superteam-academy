export type SuperteamAcademy = {
  "version": "0.1.0",
  "name": "superteam_academy",
  "instructions": [
    {
      "name": "initialize",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "config",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "maxDailyXp",
          "type": "u32"
        },
        {
          "name": "maxAchievementXp",
          "type": "u32"
        }
      ]
    },
    {
      "name": "createSeason",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "config",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "season",
          "type": "u16"
        }
      ]
    },
    {
      "name": "closeSeason",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "config",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "updateConfig",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "config",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": "UpdateConfigParams"
          }
        }
      ]
    },
    {
      "name": "initLearner",
      "accounts": [
        {
          "name": "learner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "learnerProfile",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "createCourse",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "config",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "course",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": "CreateCourseParams"
          }
        }
      ]
    },
    {
      "name": "updateCourse",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "course",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": "UpdateCourseParams"
          }
        }
      ]
    },
    {
      "name": "enroll",
      "accounts": [
        {
          "name": "learner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "config",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "course",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "learnerProfile",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "prerequisiteEnrollment",
          "isMut": false,
          "isSigner": false,
          "isOptional": true
        },
        {
          "name": "enrollment",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "unenroll",
      "accounts": [
        {
          "name": "learner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "enrollment",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "course",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "completeLesson",
      "accounts": [
        {
          "name": "backendSigner",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "config",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "learner",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "learnerProfile",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "course",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "enrollment",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "xpMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "learnerTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "lessonIndex",
          "type": "u8"
        },
        {
          "name": "xpAmount",
          "type": "u32"
        }
      ]
    },
    {
      "name": "finalizeCourse",
      "accounts": [
        {
          "name": "backendSigner",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "config",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "learner",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "learnerProfile",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "creator",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "course",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "enrollment",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "xpMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "learnerTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "creatorTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "issueCredential",
      "accounts": [
        {
          "name": "backendSigner",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "config",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "learner",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "course",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "enrollment",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "existingCredential",
          "isMut": false,
          "isSigner": false,
          "isOptional": true
        },
        {
          "name": "credential",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": "IssueCredentialParams"
          }
        }
      ]
    },
    {
      "name": "claimAchievement",
      "accounts": [
        {
          "name": "backendSigner",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "config",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "learner",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "learnerProfile",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "xpMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "learnerTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "achievementIndex",
          "type": "u8"
        },
        {
          "name": "xpReward",
          "type": "u32"
        }
      ]
    },
    {
      "name": "awardStreakFreeze",
      "accounts": [
        {
          "name": "backendSigner",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "config",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "learner",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "learnerProfile",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "registerReferral",
      "accounts": [
        {
          "name": "referee",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "referrer",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "refereeProfile",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "referrerProfile",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "closeEnrollment",
      "accounts": [
        {
          "name": "learner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "enrollment",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "course",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "Config",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "backendSigner",
            "type": "publicKey"
          },
          {
            "name": "currentSeason",
            "type": "u16"
          },
          {
            "name": "currentMint",
            "type": "publicKey"
          },
          {
            "name": "seasonClosed",
            "type": "bool"
          },
          {
            "name": "seasonStartedAt",
            "type": "i64"
          },
          {
            "name": "maxDailyXp",
            "type": "u32"
          },
          {
            "name": "maxAchievementXp",
            "type": "u32"
          },
          {
            "name": "reserved",
            "type": {
              "array": ["u8", 32]
            }
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "Course",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "courseId",
            "type": "string"
          },
          {
            "name": "creator",
            "type": "publicKey"
          },
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "contentTxId",
            "type": {
              "array": ["u8", 32]
            }
          },
          {
            "name": "version",
            "type": "u16"
          },
          {
            "name": "contentType",
            "type": "u8"
          },
          {
            "name": "lessonCount",
            "type": "u8"
          },
          {
            "name": "challengeCount",
            "type": "u8"
          },
          {
            "name": "difficulty",
            "type": "u8"
          },
          {
            "name": "xpTotal",
            "type": "u32"
          },
          {
            "name": "trackId",
            "type": "u16"
          },
          {
            "name": "trackLevel",
            "type": "u8"
          },
          {
            "name": "prerequisite",
            "type": {
              "option": "publicKey"
            }
          },
          {
            "name": "completionRewardXp",
            "type": "u32"
          },
          {
            "name": "minCompletionsForReward",
            "type": "u16"
          },
          {
            "name": "pad",
            "type": "u16"
          },
          {
            "name": "totalCompletions",
            "type": "u32"
          },
          {
            "name": "totalEnrollments",
            "type": "u32"
          },
          {
            "name": "isActive",
            "type": "bool"
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "updatedAt",
            "type": "i64"
          },
          {
            "name": "reserved",
            "type": {
              "array": ["u8", 16]
            }
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "Enrollment",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "course",
            "type": "publicKey"
          },
          {
            "name": "enrolledVersion",
            "type": "u16"
          },
          {
            "name": "enrolledAt",
            "type": "i64"
          },
          {
            "name": "completedAt",
            "type": {
              "option": "i64"
            }
          },
          {
            "name": "lessonFlags",
            "type": {
              "array": ["u64", 4]
            }
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "LearnerProfile",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "currentStreak",
            "type": "u16"
          },
          {
            "name": "longestStreak",
            "type": "u16"
          },
          {
            "name": "lastActivityDate",
            "type": "i64"
          },
          {
            "name": "streakFreezes",
            "type": "u8"
          },
          {
            "name": "achievementFlags",
            "type": {
              "array": ["u64", 4]
            }
          },
          {
            "name": "xpEarnedToday",
            "type": "u32"
          },
          {
            "name": "lastXpDay",
            "type": "u16"
          },
          {
            "name": "referralCount",
            "type": "u16"
          },
          {
            "name": "hasReferrer",
            "type": "bool"
          },
          {
            "name": "reserved",
            "type": {
              "array": ["u8", 16]
            }
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "Credential",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "learner",
            "type": "publicKey"
          },
          {
            "name": "trackId",
            "type": "u16"
          },
          {
            "name": "currentLevel",
            "type": "u8"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "UpdateConfigParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "backendSigner",
            "type": {
              "option": "publicKey"
            }
          },
          {
            "name": "maxDailyXp",
            "type": {
              "option": "u32"
            }
          },
          {
            "name": "maxAchievementXp",
            "type": {
              "option": "u32"
            }
          }
        ]
      }
    },
    {
      "name": "CreateCourseParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "courseId",
            "type": "string"
          },
          {
            "name": "creator",
            "type": "publicKey"
          },
          {
            "name": "authority",
            "type": {
              "option": "publicKey"
            }
          },
          {
            "name": "contentTxId",
            "type": {
              "array": ["u8", 32]
            }
          },
          {
            "name": "contentType",
            "type": "u8"
          },
          {
            "name": "lessonCount",
            "type": "u8"
          },
          {
            "name": "challengeCount",
            "type": "u8"
          },
          {
            "name": "difficulty",
            "type": "u8"
          },
          {
            "name": "xpTotal",
            "type": "u32"
          },
          {
            "name": "trackId",
            "type": "u16"
          },
          {
            "name": "trackLevel",
            "type": "u8"
          },
          {
            "name": "prerequisite",
            "type": {
              "option": "publicKey"
            }
          },
          {
            "name": "completionRewardXp",
            "type": "u32"
          },
          {
            "name": "minCompletionsForReward",
            "type": "u16"
          }
        ]
      }
    },
    {
      "name": "UpdateCourseParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "contentTxId",
            "type": {
              "option": {
                "array": ["u8", 32]
              }
            }
          },
          {
            "name": "contentType",
            "type": {
              "option": "u8"
            }
          },
          {
            "name": "isActive",
            "type": {
              "option": "bool"
            }
          },
          {
            "name": "completionRewardXp",
            "type": {
              "option": "u32"
            }
          },
          {
            "name": "minCompletionsForReward",
            "type": {
              "option": "u16"
            }
          }
        ]
      }
    },
    {
      "name": "IssueCredentialParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "metadataHash",
            "type": {
              "array": ["u8", 32]
            }
          },
          {
            "name": "isUpgrade",
            "type": "bool"
          }
        ]
      }
    }
  ],
  "events": [
    {
      "name": "ConfigInitialized",
      "fields": [
        {
          "name": "authority",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "maxDailyXp",
          "type": "u32",
          "index": false
        },
        {
          "name": "maxAchievementXp",
          "type": "u32",
          "index": false
        },
        {
          "name": "timestamp",
          "type": "i64",
          "index": false
        }
      ]
    },
    {
      "name": "SeasonCreated",
      "fields": [
        {
          "name": "season",
          "type": "u16",
          "index": false
        },
        {
          "name": "mint",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "timestamp",
          "type": "i64",
          "index": false
        }
      ]
    },
    {
      "name": "SeasonClosed",
      "fields": [
        {
          "name": "season",
          "type": "u16",
          "index": false
        },
        {
          "name": "timestamp",
          "type": "i64",
          "index": false
        }
      ]
    },
    {
      "name": "LearnerInitialized",
      "fields": [
        {
          "name": "learner",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "timestamp",
          "type": "i64",
          "index": false
        }
      ]
    },
    {
      "name": "CourseCreated",
      "fields": [
        {
          "name": "course",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "courseId",
          "type": "string",
          "index": false
        },
        {
          "name": "creator",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "trackId",
          "type": "u16",
          "index": false
        },
        {
          "name": "trackLevel",
          "type": "u8",
          "index": false
        },
        {
          "name": "timestamp",
          "type": "i64",
          "index": false
        }
      ]
    },
    {
      "name": "CourseUpdated",
      "fields": [
        {
          "name": "course",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "version",
          "type": "u16",
          "index": false
        },
        {
          "name": "timestamp",
          "type": "i64",
          "index": false
        }
      ]
    },
    {
      "name": "Enrolled",
      "fields": [
        {
          "name": "learner",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "course",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "courseVersion",
          "type": "u16",
          "index": false
        },
        {
          "name": "timestamp",
          "type": "i64",
          "index": false
        }
      ]
    },
    {
      "name": "Unenrolled",
      "fields": [
        {
          "name": "learner",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "course",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "timestamp",
          "type": "i64",
          "index": false
        }
      ]
    },
    {
      "name": "LessonCompleted",
      "fields": [
        {
          "name": "learner",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "course",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "lessonIndex",
          "type": "u8",
          "index": false
        },
        {
          "name": "xpEarned",
          "type": "u32",
          "index": false
        },
        {
          "name": "currentStreak",
          "type": "u16",
          "index": false
        },
        {
          "name": "timestamp",
          "type": "i64",
          "index": false
        }
      ]
    },
    {
      "name": "CourseFinalized",
      "fields": [
        {
          "name": "learner",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "course",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "totalXp",
          "type": "u32",
          "index": false
        },
        {
          "name": "creator",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "creatorXp",
          "type": "u32",
          "index": false
        },
        {
          "name": "timestamp",
          "type": "i64",
          "index": false
        }
      ]
    },
    {
      "name": "CredentialIssued",
      "fields": [
        {
          "name": "learner",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "trackId",
          "type": "u16",
          "index": false
        },
        {
          "name": "credentialCreated",
          "type": "bool",
          "index": false
        },
        {
          "name": "credentialUpgraded",
          "type": "bool",
          "index": false
        },
        {
          "name": "currentLevel",
          "type": "u8",
          "index": false
        },
        {
          "name": "timestamp",
          "type": "i64",
          "index": false
        }
      ]
    },
    {
      "name": "AchievementClaimed",
      "fields": [
        {
          "name": "learner",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "achievementIndex",
          "type": "u8",
          "index": false
        },
        {
          "name": "xpReward",
          "type": "u32",
          "index": false
        },
        {
          "name": "timestamp",
          "type": "i64",
          "index": false
        }
      ]
    },
    {
      "name": "StreakMilestone",
      "fields": [
        {
          "name": "learner",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "milestone",
          "type": "u16",
          "index": false
        },
        {
          "name": "timestamp",
          "type": "i64",
          "index": false
        }
      ]
    },
    {
      "name": "StreakBroken",
      "fields": [
        {
          "name": "learner",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "finalStreak",
          "type": "u16",
          "index": false
        },
        {
          "name": "timestamp",
          "type": "i64",
          "index": false
        }
      ]
    },
    {
      "name": "StreakFreezeAwarded",
      "fields": [
        {
          "name": "learner",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "freezesRemaining",
          "type": "u8",
          "index": false
        },
        {
          "name": "timestamp",
          "type": "i64",
          "index": false
        }
      ]
    },
    {
      "name": "EnrollmentClosed",
      "fields": [
        {
          "name": "learner",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "course",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "rentReclaimed",
          "type": "u64",
          "index": false
        },
        {
          "name": "timestamp",
          "type": "i64",
          "index": false
        }
      ]
    },
    {
      "name": "ReferralRegistered",
      "fields": [
        {
          "name": "referrer",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "referee",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "timestamp",
          "type": "i64",
          "index": false
        }
      ]
    },
    {
      "name": "ConfigUpdated",
      "fields": [
        {
          "name": "field",
          "type": "string",
          "index": false
        },
        {
          "name": "timestamp",
          "type": "i64",
          "index": false
        }
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "Unauthorized",
      "msg": "Unauthorized signer"
    },
    {
      "code": 6001,
      "name": "CourseNotActive",
      "msg": "Course not active"
    },
    {
      "code": 6002,
      "name": "AlreadyEnrolled",
      "msg": "Already enrolled"
    },
    {
      "code": 6003,
      "name": "NotEnrolled",
      "msg": "Not enrolled"
    },
    {
      "code": 6004,
      "name": "LessonOutOfBounds",
      "msg": "Lesson index out of bounds"
    },
    {
      "code": 6005,
      "name": "LessonAlreadyCompleted",
      "msg": "Lesson already completed"
    },
    {
      "code": 6006,
      "name": "CourseNotCompleted",
      "msg": "Course not fully completed"
    },
    {
      "code": 6007,
      "name": "CourseAlreadyCompleted",
      "msg": "Course already completed"
    },
    {
      "code": 6008,
      "name": "AchievementAlreadyClaimed",
      "msg": "Achievement already claimed"
    },
    {
      "code": 6009,
      "name": "CourseNotFinalized",
      "msg": "Course not finalized; issue_credential requires finalize_course to succeed first"
    },
    {
      "code": 6010,
      "name": "SeasonClosed",
      "msg": "Season already closed"
    },
    {
      "code": 6011,
      "name": "SelfReferral",
      "msg": "Cannot refer yourself"
    },
    {
      "code": 6012,
      "name": "AlreadyReferred",
      "msg": "Already has a referrer"
    },
    {
      "code": 6013,
      "name": "ReferrerNotFound",
      "msg": "Referrer not found"
    },
    {
      "code": 6014,
      "name": "PrerequisiteNotMet",
      "msg": "Prerequisite not met"
    },
    {
      "code": 6015,
      "name": "DailyXPLimitExceeded",
      "msg": "Daily XP limit exceeded"
    },
    {
      "code": 6016,
      "name": "UnenrollCooldown",
      "msg": "Unenroll cooldown not met (24h)"
    },
    {
      "code": 6017,
      "name": "EnrollmentCourseMismatch",
      "msg": "Enrollment/course mismatch"
    },
    {
      "code": 6018,
      "name": "SeasonNotActive",
      "msg": "Season not active"
    },
    {
      "code": 6019,
      "name": "MathOverflow",
      "msg": "Math overflow"
    }
  ],
  "metadata": {
    "address": "Acad111111111111111111111111111111111111111"
  }
};

export const IDL: SuperteamAcademy = {
  version: "0.1.0",
  name: "superteam_academy",
  // ... same content as above
  metadata: {
    address: "Acad111111111111111111111111111111111111111"
  }
};

export default IDL;
