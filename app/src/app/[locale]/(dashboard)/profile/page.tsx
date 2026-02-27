// app/src/app/(dashboard)/profile/page.tsx
"use client";

import { useUser } from "@/hooks/useUser";
import { ProfileView } from "@/components/profile-view"; // Наш новый компонент
import { Skeleton } from "@/components/ui/skeleton";

export default function MyProfilePage() {
  const { userDb, loading: userLoading } = useUser();

  if (userLoading) {
    // Показываем красивый скелетон, пока грузятся данные
    return (
        <div className="container max-w-6xl py-8 space-y-8">
            <div className="flex gap-8 items-start">
                <Skeleton className="h-32 w-32 rounded-full" />
                <div className="flex-1 space-y-4">
                    <Skeleton className="h-8 w-1/2" />
                    <Skeleton className="h-4 w-1/3" />
                </div>
            </div>
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-60 w-full" />
        </div>
    );
  }

  if (!userDb) {
    return <div className="p-8 text-center">Please sign in to view your profile.</div>;
  }

  return <ProfileView user={userDb} isPublic={false} />;
}