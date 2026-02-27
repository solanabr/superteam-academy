export default async function PublicProfilePage({
  params
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params;
  return (
    <div className="container mx-auto py-12">
      <h1 className="text-3xl font-bold mb-8">Profile: {username}</h1>
      <p className="text-gray-400">Public profile details.</p>
    </div>
  );
}
