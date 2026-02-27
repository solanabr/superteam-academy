import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ProfileView } from "@/components/profile-view";

export default async function PublicProfilePage({ params }: { params: { username: string } }) {
  const user = await prisma.user.findUnique({
    where: { username: params.username },
    include: { 
        enrollments: true,
        accounts: true,
        // ИСПРАВЛЕНИЕ: Включаем ачивки и их метаданные
        achievements: {
            include: {
                achievement: true // Подгружаем связанную модель Achievement
            }
        }
    }
  });

  if (!user) {
    return notFound();
  }

  // Приводим данные к типу, который ожидает ProfileView
  const userProfile = {
      id: user.id.toString(),
      image: user.image,
      username: user.username,
      walletAddress: user.walletAddress,
      bio: user.bio,
      twitterHandle: user.twitterHandle,
      githubHandle: user.githubHandle,
      xp: user.xp,
      enrollments: user.enrollments.map(e => ({
          courseId: e.courseId,
          enrolledAt: e.enrolledAt.toISOString(),
      })),
      // ИСПРАВЛЕНИЕ: Добавляем ачивки в профиль
      achievements: user.achievements,
  };

  return (
    <div className="min-h-screen pt-12 md:pt-20 bg-background">
       <ProfileView user={userProfile} isPublic={true} />
    </div>
  );
}