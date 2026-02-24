import "next-auth";

declare module "next-auth" {
  interface Session {
    walletAddress?: string;
    linkedAccounts: string[];
    provider: string;
    switchedProfileName?: string;
  }
}
