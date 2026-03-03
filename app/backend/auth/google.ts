import { prisma } from '@/backend/prisma';

interface GoogleUser {
    id: string;
    email: string;
    name: string;
    picture: string;
}

export async function findUserByGoogleId(googleId: string) {
    const link = await prisma.linked_accounts.findFirst({
        where: { provider: 'google', provider_id: googleId },
        select: { user_id: true },
    });

    if (!link) return null;

    const profile = await prisma.profiles.findUnique({
        where: { id: link.user_id },
    });

    return profile;
}

export async function createUserWithGoogle(googleUser: GoogleUser) {
    const user = await prisma.profiles.create({
        data: {
            email: googleUser.email,
            name: googleUser.name,
            avatar_url: googleUser.picture,
        },
    });

    await prisma.linked_accounts.create({
        data: {
            user_id: user.id,
            provider: 'google',
            provider_id: googleUser.id,
            provider_data: {
                email: googleUser.email,
                name: googleUser.name,
                picture: googleUser.picture,
            },
        },
    });

    return user;
}

export async function linkGoogleToUser(userId: string, googleUser: GoogleUser) {
    const existing = await findUserByGoogleId(googleUser.id);

    if (existing && existing.id !== userId) {
        throw new Error('Google account already linked to another user');
    }

    if (existing) {
        throw new Error('Google account already linked to this user');
    }

    await prisma.linked_accounts.create({
        data: {
            user_id: userId,
            provider: 'google',
            provider_id: googleUser.id,
            provider_data: {
                email: googleUser.email,
                name: googleUser.name,
                picture: googleUser.picture,
            },
        },
    });

    // Update profile email if not set
    await prisma.profiles.updateMany({
        where: { id: userId, email: null },
        data: { email: googleUser.email },
    });
}
