import { CertificatePage } from "@/components/certificates/CertificatePage";
import { mockCertificates } from "@/lib/mock-data";
import { Navbar } from "@/components/navbar";
import { requireAuthenticatedUser } from "@/lib/server/auth-adapter";

export default async function Page({ params }: { params: { id: string } }) {
    await requireAuthenticatedUser();

    const certificate = mockCertificates.find(c => c.id === params.id);

    if (!certificate) {
        return <div>Certificate not found</div>;
    }

    return (
        <div>
            <Navbar />
            <CertificatePage certificate={certificate} />
        </div>
    );
}
