export const CacheTags = {
  COURSES: "courses",
  ROADMAPS: "roadmaps",
  PLATFORM_CONFIG: "platform-config",
  userSettings: (wallet: string) => `user-settings:${wallet}`,
  credentialNfts: (wallet: string) => `credential-nfts:${wallet}`,
} as const;
