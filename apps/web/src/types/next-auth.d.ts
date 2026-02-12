import type { UserRole } from '@/types';
import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name: string | null;
      email: string | null;
      image: string | null;
      role: UserRole;
      walletAddress: string | null;
    };
  }

  interface User {
    role: UserRole;
    walletAddress: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: UserRole;
    walletAddress: string | null;
  }
}
