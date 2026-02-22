import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { profileService } from "@/services/profile";
import { skillsService } from "@/services/skills";
import { redirect } from "@/i18n/routing";
import ProfileView from "./profile-view";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ locale: string; username: string }>;
}) {
  const { locale, username } = await params;
  const session = await auth();

  // "me" → own profile, requires auth
  if (username === "me") {
    if (!session?.user?.id) {
      redirect({ href: "/auth/signin", locale });
      return null;
    }

    const profile = await profileService.getProfileById(session.user.id);
    if (!profile) notFound();

    const [stats, completedCourses, skills] = await Promise.all([
      profileService.getProfileStats(session.user.id),
      profileService.getCompletedCourses(session.user.id),
      skillsService.getSkills(session.user.id),
    ]);

    return (
      <ProfileView
        profile={profile}
        stats={stats}
        completedCourses={completedCourses}
        skills={skills}
        isOwner={true}
      />
    );
  }

  // Public profile by username
  const profile = await profileService.getProfileByUsername(username);
  if (!profile) notFound();

  // Privacy check
  if (!profile.isPublic) {
    const isOwner = session?.user?.id === profile.id;
    if (!isOwner) notFound();
  }

  const isOwner = session?.user?.id === profile.id;
  const [stats, completedCourses, skills] = await Promise.all([
    profileService.getProfileStats(profile.id),
    profileService.getCompletedCourses(profile.id),
    skillsService.getSkills(profile.id),
  ]);

  return (
    <ProfileView
      profile={profile}
      stats={stats}
      completedCourses={completedCourses}
      skills={skills}
      isOwner={isOwner}
    />
  );
}
