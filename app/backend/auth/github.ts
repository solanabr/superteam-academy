import { prisma } from '@/backend/prisma';

interface GitHubUser {
    id: number;
    login: string;
    email: string;
    name: string;
    avatar_url: string;
}

export async function findUserByGitHubId(githubId: string) {
    const link = await prisma.linked_accounts.findFirst({
        where: { provider: 'github', provider_id: githubId },
        select: { user_id: true },
    });

    if (!link) return null;

    const profile = await prisma.profiles.findUnique({
        where: { id: link.user_id },
    });

    return profile;
}

export async function createUserWithGitHub(githubUser: GitHubUser) {
    const user = await prisma.profiles.create({
        data: {
            email: githubUser.email,
            name: githubUser.name || githubUser.login,
            avatar_url: githubUser.avatar_url,
            username: githubUser.login,
        },
    });

    await prisma.linked_accounts.create({
        data: {
            user_id: user.id,
            provider: 'github',
            provider_id: String(githubUser.id),
            provider_data: {
                login: githubUser.login,
                email: githubUser.email,
                name: githubUser.name,
                avatar_url: githubUser.avatar_url,
            },
        },
    });

    return user;
}

export async function linkGitHubToUser(userId: string, githubUser: GitHubUser) {
    const existing = await findUserByGitHubId(String(githubUser.id));

    if (existing && existing.id !== userId) {
        throw new Error('GitHub account already linked to another user');
    }

    if (existing) {
        throw new Error('GitHub account already linked to this user');
    }

    await prisma.linked_accounts.create({
        data: {
            user_id: userId,
            provider: 'github',
            provider_id: String(githubUser.id),
            provider_data: {
                login: githubUser.login,
                email: githubUser.email,
                name: githubUser.name,
                avatar_url: githubUser.avatar_url,
            },
        },
    });
}
