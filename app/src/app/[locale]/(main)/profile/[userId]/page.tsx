import { PublicProfileClient } from "./public-profile-client";

type Props = { params: Promise<{ userId: string }> };

export default async function PublicProfilePage({ params }: Props) {
  const { userId } = await params;
  return <PublicProfileClient userId={userId} />;
}
