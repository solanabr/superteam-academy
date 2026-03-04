import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    provider?: string;
    providerAccountId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    provider?: string;
    providerAccountId?: string;
  }
}
