import { type JWT } from 'next-auth/jwt';
import { isAdminFromToken } from './auth';

type Role = 'student' | 'admin';

// Using array of tuples (not Record) to guarantee evaluation order.
// More specific patterns MUST come before less specific ones.
//
// /admin/ and /api/admin/ are catch-all deny. Any new route under these
// paths is automatically protected without adding a new entry here.
const ROUTE_PERMISSIONS: [string, Role][] = [
    ['/api/admin/', 'admin'],
    ['/admin/', 'admin'],
    ['/admin', 'admin'],       // exact /admin path (no trailing slash)
];

/**
 * Check if a JWT token has access to the given path.
 * Synchronous — no DB hit. Uses JWT-cached role/admin status.
 */
export function canAccessRoute(token: JWT, pathname: string): boolean {
    for (const [pattern, requiredRole] of ROUTE_PERMISSIONS) {
        if (pathname.startsWith(pattern)) {
            if (requiredRole === 'admin') return isAdminFromToken(token);
        }
    }
    return true; // no restriction — route is public or student-accessible
}
