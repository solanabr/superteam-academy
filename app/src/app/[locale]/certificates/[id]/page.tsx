export default async function CertificatePage({
    params
  }: {
    params: Promise<{ id: string }>
  }) {
    const { id } = await params;
    return (
      <div className="container mx-auto py-12">
        <h1 className="text-3xl font-bold mb-8">Certificate</h1>
        <p className="text-gray-400">ID: {id}</p>
      </div>
    );
  }
