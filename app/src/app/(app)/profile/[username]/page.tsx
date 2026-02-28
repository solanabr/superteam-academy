import type { Metadata } from "next";
import PublicProfileClient, {
  MOCK_PUBLIC_PROFILES,
} from "@/components/profile/public-profile-client";

export async function generateStaticParams() {
  return Object.keys(MOCK_PUBLIC_PROFILES).map((username) => ({ username }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const profile = MOCK_PUBLIC_PROFILES[username];

  if (!profile) {
    return { title: "Profile Not Found" };
  }

  return {
    title: `${profile.displayName}'s Profile`,
    description: profile.bio || `View ${profile.displayName}'s learning profile on Superteam Academy.`,
    openGraph: {
      title: `${profile.displayName} | Superteam Academy`,
      description: `${profile.displayName} has earned ${profile.xp} XP and completed ${profile.coursesCompleted.length} courses.`,
    },
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
