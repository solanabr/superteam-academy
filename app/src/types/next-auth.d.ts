import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    walletAddress?: string;
  }
  interface Session {
    user: {
      walletAddress?: string;
    } & import("next-auth").DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    walletAddress?: string;
  }
}
