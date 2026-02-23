export default {
  openapi: "3.0.3",
  info: {
    title: "Superteam Academy Backend API",
    version: "1.0.0",
    description:
      "API for the Superteam Academy decentralized learning platform. All `/v1/academy/*` endpoints require `Authorization: Bearer <token>` or `X-API-Key: <token>`.",
  },
  servers: [
    { url: "http://localhost:3001", description: "Local development" },
  ],
  tags: [
    { name: "Health", description: "Health check endpoints" },
    { name: "Admin", description: "Admin auth and API key generation" },
    { name: "Config", description: "Platform configuration" },
    { name: "Courses", description: "Course creation and completion" },
    { name: "Credentials", description: "Credential issuance and upgrades" },
    { name: "Minters", description: "XP minter management" },
    { name: "Achievements", description: "Achievement types and awards" },
  ],
  security: [{ apiKey: [] }, { bearerAuth: [] }],
  paths: {
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Health check (unversioned)",
        security: [],
        responses: {
          "200": {
            description: "Service healthy",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/HealthResponse" },
                example: { ok: true, service: "academy-backend" },
              },
            },
          },
        },
      },
    },
    "/v1/health": {
      get: {
        tags: ["Health"],
        summary: "Liveness (versioned)",
        security: [],
        responses: {
          "200": {
            description: "Process alive",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/HealthResponse" },
                example: { ok: true, service: "academy-backend", version: "1" },
              },
            },
          },
        },
      },
    },
    "/ready": {
      get: {
        tags: ["Health"],
        summary: "Readiness (keypairs + RPC)",
        security: [],
        responses: {
          "200": {
            description: "Ready to accept traffic",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ReadinessResponse" },
                example: {
                  ok: true,
                  service: "academy-backend",
                  checks: { keypairs: "ok", rpc: "ok" },
                },
              },
            },
          },
          "503": {
            description: "Not ready",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ReadinessResponse" },
                example: {
                  ok: false,
                  service: "academy-backend",
                  checks: { keypairs: "ok", rpc: "error" },
                  error: "fetch failed",
                },
              },
            },
          },
        },
      },
    },
    "/v1/ready": {
      get: {
        tags: ["Health"],
        summary: "Readiness (versioned)",
        security: [],
        responses: {
          "200": {
            description: "Ready to accept traffic",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ReadinessResponse" },
                example: {
                  ok: true,
                  service: "academy-backend",
                  version: "1",
                  checks: { keypairs: "ok", rpc: "ok" },
                },
              },
            },
          },
          "503": {
            description: "Not ready",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ReadinessResponse" },
              },
            },
          },
        },
      },
    },
    "/v1/admin/login": {
      post: {
        tags: ["Admin"],
        summary: "Admin login",
        description: "Exchange ADMIN_PASSWORD for a JWT. JWT required for generate-api-key.",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["password"],
                properties: { password: { type: "string" } },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "JWT token",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { token: { type: "string" } },
                },
                example: { token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/v1/admin/generate-api-key": {
      post: {
        tags: ["Admin"],
        summary: "Generate API key",
        description: "Create a new API key. Requires admin JWT (from login).",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["role"],
                properties: {
                  role: { type: "string", enum: ["admin", "client"] },
                  label: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "New API key (show once)",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    apiKey: { type: "string" },
                    role: { type: "string" },
                    label: { type: "string" },
                  },
                },
                example: {
                  apiKey: "sk_abc123...",
                  role: "client",
                  label: "BFF prod",
                },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/v1/academy/create-course": {
      post: {
        tags: ["Courses"],
        summary: "Create course",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateCourseRequest" },
              example: {
                courseId: "test-course-1",
                lessonCount: 3,
                xpPerLesson: 100,
                creator: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Transaction signature",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/TxResponse" },
                example: { tx: "5VERv8NMvzbJMEkV8xnrLkEaWRtSz9CosKDYjCJjBRnb..." },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "500": { $ref: "#/components/responses/InternalError" },
        },
      },
    },
    "/v1/academy/update-config": {
      post: {
        tags: ["Config"],
        summary: "Update config (backend signer)",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateConfigRequest" },
              example: { newBackendSigner: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU" },
            },
          },
        },
        responses: {
          "200": {
            description: "Transaction signature",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/TxResponse" },
                example: { tx: "5VERv8NMvzbJMEkV8xnrLkEaWRtSz9CosKDYjCJjBRnb..." },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "500": { $ref: "#/components/responses/InternalError" },
        },
      },
    },
    "/v1/academy/update-course": {
      post: {
        tags: ["Courses"],
        summary: "Update course",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateCourseRequest" },
              example: {
                courseId: "test-course-1",
                newContentTxId: new Array(32).fill(0),
                newIsActive: true,
                newXpPerLesson: 150,
                newCreatorRewardXp: 75,
                newMinCompletionsForReward: 3,
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Transaction signature",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/TxResponse" },
                example: { tx: "5VERv8NMvzbJMEkV8xnrLkEaWRtSz9CosKDYjCJjBRnb..." },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "500": { $ref: "#/components/responses/InternalError" },
        },
      },
    },
    "/v1/academy/complete-lesson": {
      post: {
        tags: ["Courses"],
        summary: "Complete lesson",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CompleteLessonRequest" },
              example: {
                courseId: "test-course-1",
                learner: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
                lessonIndex: 0,
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Transaction signature",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/TxResponse" },
                example: { tx: "5VERv8NMvzbJMEkV8xnrLkEaWRtSz9CosKDYjCJjBRnb..." },
              },
            },
          },
          "400": {
            description: "Course not found or invalid input",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: {
                  error:
                    'Course "test-course-1" not found. Create it first via POST /v1/academy/create-course.',
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "500": { $ref: "#/components/responses/InternalError" },
        },
      },
    },
    "/v1/academy/finalize-course": {
      post: {
        tags: ["Courses"],
        summary: "Finalize course",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/FinalizeCourseRequest" },
              example: {
                courseId: "test-course-1",
                learner: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Transaction signature",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/TxResponse" },
                example: { tx: "5VERv8NMvzbJMEkV8xnrLkEaWRtSz9CosKDYjCJjBRnb..." },
              },
            },
          },
          "400": {
            description: "Course not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: {
                  error:
                    'Course "test-course-1" not found. Create it first via POST /v1/academy/create-course.',
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "500": { $ref: "#/components/responses/InternalError" },
        },
      },
    },
    "/v1/academy/issue-credential": {
      post: {
        tags: ["Credentials"],
        summary: "Issue credential",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/IssueCredentialRequest" },
              example: {
                courseId: "test-course-1",
                learner: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
                credentialName: "Solana Fundamentals Credential",
                metadataUri: "https://arweave.net/<metadata>",
                coursesCompleted: 1,
                totalXp: 350,
                trackCollection: "4DEr3nNqW5YkYqYKWP9yRqajrXDY76LjfbKUCBqvQWQa",
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Transaction and new asset pubkey",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/IssueCredentialResponse" },
                example: {
                  tx: "5VERv8NMvzbJMEkV8xnrLkEaWRtSz9CosKDYjCJjBRnb...",
                  credentialAsset: "4DEr3nNqW5YkYqYKWP9yRqajrXDY76LjfbKUCBqvQWQa",
                },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "500": { $ref: "#/components/responses/InternalError" },
        },
      },
    },
    "/v1/academy/upgrade-credential": {
      post: {
        tags: ["Credentials"],
        summary: "Upgrade credential",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpgradeCredentialRequest" },
              example: {
                courseId: "test-course-1",
                learner: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
                credentialAsset: "4DEr3nNqW5YkYqYKWP9yRqajrXDY76LjfbKUCBqvQWQa",
                credentialName: "Solana Fundamentals Credential",
                metadataUri: "https://arweave.net/<new-metadata>",
                coursesCompleted: 2,
                totalXp: 800,
                trackCollection: "4DEr3nNqW5YkYqYKWP9yRqajrXDY76LjfbKUCBqvQWQa",
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Transaction signature",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/TxResponse" },
                example: { tx: "5VERv8NMvzbJMEkV8xnrLkEaWRtSz9CosKDYjCJjBRnb..." },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "500": { $ref: "#/components/responses/InternalError" },
        },
      },
    },
    "/v1/academy/register-minter": {
      post: {
        tags: ["Minters"],
        summary: "Register minter",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RegisterMinterRequest" },
              example: {
                minter: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
                label: "custom",
                maxXpPerCall: 1000,
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Transaction signature",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/TxResponse" },
                example: { tx: "5VERv8NMvzbJMEkV8xnrLkEaWRtSz9CosKDYjCJjBRnb..." },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "500": { $ref: "#/components/responses/InternalError" },
        },
      },
    },
    "/v1/academy/revoke-minter": {
      post: {
        tags: ["Minters"],
        summary: "Revoke minter",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RevokeMinterRequest" },
              example: {
                minter: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Transaction signature",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/TxResponse" },
                example: { tx: "5VERv8NMvzbJMEkV8xnrLkEaWRtSz9CosKDYjCJjBRnb..." },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "500": { $ref: "#/components/responses/InternalError" },
        },
      },
    },
    "/v1/academy/reward-xp": {
      post: {
        tags: ["Minters"],
        summary: "Reward XP",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RewardXpRequest" },
              example: {
                recipient: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
                amount: 100,
                memo: "bonus",
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Transaction signature",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/TxResponse" },
                example: { tx: "5VERv8NMvzbJMEkV8xnrLkEaWRtSz9CosKDYjCJjBRnb..." },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "500": { $ref: "#/components/responses/InternalError" },
        },
      },
    },
    "/v1/academy/create-achievement-type": {
      post: {
        tags: ["Achievements"],
        summary: "Create achievement type",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateAchievementTypeRequest" },
              example: {
                achievementId: "first-course-complete",
                name: "First Course Complete",
                metadataUri: "https://arweave.net/<achievement-metadata>",
                maxSupply: 0,
                xpReward: 100,
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Transaction and collection pubkey",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CreateAchievementTypeResponse" },
                example: {
                  tx: "5VERv8NMvzbJMEkV8xnrLkEaWRtSz9CosKDYjCJjBRnb...",
                  collection: "4DEr3nNqW5YkYqYKWP9yRqajrXDY76LjfbKUCBqvQWQa",
                },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "500": { $ref: "#/components/responses/InternalError" },
        },
      },
    },
    "/v1/academy/award-achievement": {
      post: {
        tags: ["Achievements"],
        summary: "Award achievement",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AwardAchievementRequest" },
              example: {
                achievementId: "first-course-complete",
                recipient: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
                collection: "4DEr3nNqW5YkYqYKWP9yRqajrXDY76LjfbKUCBqvQWQa",
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Transaction and new asset pubkey",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AwardAchievementResponse" },
                example: {
                  tx: "5VERv8NMvzbJMEkV8xnrLkEaWRtSz9CosKDYjCJjBRnb...",
                  asset: "4DEr3nNqW5YkYqYKWP9yRqajrXDY76LjfbKUCBqvQWQa",
                },
              },
            },
          },
          "400": {
            description: "Collection mismatch or invalid input",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: {
                  error:
                    "collection does not match the on-chain achievement type collection",
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "500": { $ref: "#/components/responses/InternalError" },
        },
      },
    },
    "/v1/contract": {
      get: {
        tags: ["Health"],
        summary: "OpenAPI contract",
        description: "Returns this OpenAPI 3.0 specification. No auth required.",
        security: [],
        responses: {
          "200": {
            description: "OpenAPI 3.0 JSON document",
            content: {
              "application/json": {
                schema: { type: "object", description: "OpenAPI 3.0 spec" },
              },
            },
          },
        },
      },
    },
    "/v1/academy/deactivate-achievement-type": {
      post: {
        tags: ["Achievements"],
        summary: "Deactivate achievement type",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/DeactivateAchievementTypeRequest" },
              example: { achievementId: "first-course-complete" },
            },
          },
        },
        responses: {
          "200": {
            description: "Transaction signature",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/TxResponse" },
                example: { tx: "5VERv8NMvzbJMEkV8xnrLkEaWRtSz9CosKDYjCJjBRnb..." },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "500": { $ref: "#/components/responses/InternalError" },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      apiKey: {
        type: "apiKey",
        in: "header",
        name: "X-API-Key",
        description: "Backend API token",
      },
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "custom",
        description: "Backend API token via Authorization header",
      },
    },
    responses: {
      PayloadTooLarge: {
        description: "Request body exceeds max size",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
            example: { error: "Request body too large (max 65536 bytes)" },
          },
        },
      },
      RateLimited: {
        description: "Rate limit exceeded",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
            example: { error: "Too many requests" },
          },
        },
      },
      BadRequest: {
        description: "Validation or business input error",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
            example: { error: "Invalid request" },
          },
        },
      },
      Unauthorized: {
        description: "Missing or invalid API token",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
            example: { error: "Unauthorized" },
          },
        },
      },
      InternalError: {
        description: "Internal/runtime/chain error",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
            example: { error: "Internal server error" },
          },
        },
      },
    },
    schemas: {
      HealthResponse: {
        type: "object",
        properties: {
          ok: { type: "boolean" },
          service: { type: "string" },
          version: { type: "string", description: "API version (only on /v1/*)" },
        },
      },
      ReadinessResponse: {
        type: "object",
        properties: {
          ok: { type: "boolean" },
          service: { type: "string" },
          version: { type: "string" },
          checks: {
            type: "object",
            properties: {
              keypairs: { type: "string", enum: ["ok", "missing"] },
              rpc: { type: "string", enum: ["ok", "error"] },
            },
          },
          error: { type: "string" },
        },
      },
      TxResponse: {
        type: "object",
        properties: { tx: { type: "string", description: "Solana transaction signature" } },
      },
      ErrorResponse: {
        type: "object",
        properties: {
          error: { type: "string" },
          retriable: { type: "boolean", description: "Whether client should retry" },
        },
      },
      CreateCourseRequest: {
        type: "object",
        properties: {
          courseId: { type: "string", default: "test-course-1" },
          lessonCount: { type: "integer", minimum: 1, default: 3 },
          xpPerLesson: { type: "integer", minimum: 0, default: 100 },
          creator: { type: "string", format: "pubkey", description: "Optional; defaults to authority" },
        },
      },
      UpdateConfigRequest: {
        type: "object",
        required: ["newBackendSigner"],
        properties: {
          newBackendSigner: { type: "string", description: "New backend signer pubkey" },
        },
      },
      UpdateCourseRequest: {
        type: "object",
        properties: {
          courseId: { type: "string", default: "test-course-1" },
          newContentTxId: { type: "array", items: { type: "integer" }, maxItems: 32, minItems: 32 },
          newIsActive: { type: "boolean", nullable: true },
          newXpPerLesson: { type: "integer", minimum: 0, nullable: true },
          newCreatorRewardXp: { type: "integer", minimum: 0, nullable: true },
          newMinCompletionsForReward: { type: "integer", minimum: 0, nullable: true },
        },
      },
      CompleteLessonRequest: {
        type: "object",
        required: ["learner"],
        properties: {
          courseId: { type: "string", default: "test-course-1" },
          learner: { type: "string", format: "pubkey" },
          lessonIndex: { type: "integer", minimum: 0, default: 0 },
        },
      },
      FinalizeCourseRequest: {
        type: "object",
        required: ["learner"],
        properties: {
          courseId: { type: "string", default: "test-course-1" },
          learner: { type: "string", format: "pubkey" },
        },
      },
      IssueCredentialRequest: {
        type: "object",
        required: ["learner", "credentialName", "metadataUri", "trackCollection"],
        properties: {
          courseId: { type: "string", default: "test-course-1" },
          learner: { type: "string", format: "pubkey" },
          credentialName: { type: "string" },
          metadataUri: { type: "string" },
          coursesCompleted: { type: "integer", minimum: 0, default: 1 },
          totalXp: { type: "integer", minimum: 0, default: 0 },
          trackCollection: { type: "string", format: "pubkey" },
        },
      },
      IssueCredentialResponse: {
        type: "object",
        properties: {
          tx: { type: "string" },
          credentialAsset: { type: "string", description: "New credential asset pubkey" },
        },
      },
      UpgradeCredentialRequest: {
        type: "object",
        required: ["learner", "credentialAsset", "credentialName", "metadataUri", "trackCollection"],
        properties: {
          courseId: { type: "string", default: "test-course-1" },
          learner: { type: "string", format: "pubkey" },
          credentialAsset: { type: "string", format: "pubkey" },
          credentialName: { type: "string" },
          metadataUri: { type: "string" },
          coursesCompleted: { type: "integer", minimum: 0, default: 1 },
          totalXp: { type: "integer", minimum: 0, default: 0 },
          trackCollection: { type: "string", format: "pubkey" },
        },
      },
      RegisterMinterRequest: {
        type: "object",
        required: ["minter"],
        properties: {
          minter: { type: "string", format: "pubkey" },
          label: { type: "string", default: "custom" },
          maxXpPerCall: { type: "integer", minimum: 0, default: 0, description: "0 = unlimited" },
        },
      },
      RevokeMinterRequest: {
        type: "object",
        required: ["minter"],
        properties: { minter: { type: "string", format: "pubkey" } },
      },
      RewardXpRequest: {
        type: "object",
        required: ["recipient", "amount"],
        properties: {
          recipient: { type: "string", format: "pubkey" },
          amount: { type: "integer", minimum: 1 },
          memo: { type: "string", default: "" },
        },
      },
      CreateAchievementTypeRequest: {
        type: "object",
        required: ["achievementId", "name", "metadataUri"],
        properties: {
          achievementId: { type: "string" },
          name: { type: "string" },
          metadataUri: { type: "string" },
          maxSupply: { type: "integer", minimum: 0, default: 0, description: "0 = unlimited" },
          xpReward: { type: "integer", minimum: 0, default: 100 },
        },
      },
      CreateAchievementTypeResponse: {
        type: "object",
        properties: {
          tx: { type: "string" },
          collection: { type: "string", description: "Achievement type collection pubkey" },
        },
      },
      AwardAchievementRequest: {
        type: "object",
        required: ["achievementId", "recipient", "collection"],
        properties: {
          achievementId: { type: "string" },
          recipient: { type: "string", format: "pubkey" },
          collection: { type: "string", format: "pubkey", description: "Must match on-chain AchievementType.collection" },
        },
      },
      AwardAchievementResponse: {
        type: "object",
        properties: {
          tx: { type: "string" },
          asset: { type: "string", description: "New achievement asset pubkey" },
        },
      },
      DeactivateAchievementTypeRequest: {
        type: "object",
        required: ["achievementId"],
        properties: { achievementId: { type: "string" } },
      },
    },
  },
} as const;
