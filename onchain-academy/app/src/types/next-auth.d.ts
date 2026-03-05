import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    backendToken?: string;
    oauthProvider?: string;
    oauthProviderAccountId?: string;
    user: {
      id: string;
      walletAddress?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }

  interface User {
    backendToken?: string;
    walletAddress?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    backendToken?: string;
    walletAddress?: string;
    oauthProvider?: string;
    oauthProviderAccountId?: string;
  }
}
