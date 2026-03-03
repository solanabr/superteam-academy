import { NextResponse } from 'next/server';

export async function POST() {
    // NextAuth handles sign-out via /api/auth/signout
    // This endpoint exists for backward compatibility
    return NextResponse.json({ success: true });
}
