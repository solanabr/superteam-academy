import NextAuth from 'next-auth';
import { authOptions } from '@/backend/auth/auth-options';

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
