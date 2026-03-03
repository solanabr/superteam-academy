import type { Metadata } from "next";
import PublicProfileClient, {
  MOCK_PUBLIC_PROFILES,
} from "@/components/profile/public-profile-client";

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  // Pre-render demo profiles; real user profiles are rendered on-demand
  return Object.keys(MOCK_PUBLIC_PROFILES).map((username) => ({ username }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const mock = MOCK_PUBLIC_PROFILES[username];

  if (mock) {
    return {
      title: `${mock.displayName}'s Profile`,
      description:
        mock.bio ||
        `View ${mock.displayName}'s learning profile on Superteam Academy.`,
      openGraph: {
        title: `${mock.displayName} | Superteam Academy`,
        description: `${mock.displayName} has earned ${mock.xp} XP and completed ${mock.coursesCompleted.length} courses.`,
      },
    };
  }

  return {
    title: `${username}'s Profile | Superteam Academy`,
    description: `View ${username}'s learning profile on Superteam Academy.`,
  };
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  return <PublicProfileClient username={username} />;
}
