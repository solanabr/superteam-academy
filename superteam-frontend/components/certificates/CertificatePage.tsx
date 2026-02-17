import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export interface Certificate {
  id: string;
  recipient: {
    name: string;
    username: string;
  };
  course: {
    title: string;
  };
  date: string;
  nft: {
    mintAddress: string;
    metadata: string;
    ownershipProof: string;
  };
}

export function CertificatePage({ certificate }: { certificate: Certificate }) {
  if (!certificate) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-3xl">
              Certificate Not Found
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p>The certificate you are looking for does not exist.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle className="text-center text-3xl">
            Certificate of Completion
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-xl">This certifies that</p>
          <h2 className="text-4xl font-bold my-4">
            {certificate.recipient.name}
          </h2>
          <p className="text-xl">has successfully completed the course</p>
          <h3 className="text-2xl font-semibold my-2">
            {certificate.course.title}
          </h3>
          <p className="text-gray-500">
            on {new Date(certificate.date).toLocaleDateString()}
          </p>

          <div className="my-8">
            <Button asChild>
              <a
                href={`https://explorer.solana.com/address/${certificate.nft.mintAddress}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Verify on Solana Explorer
              </a>
            </Button>
          </div>

          <Separator />

          <div className="mt-8">
            <h4 className="text-xl font-bold">NFT Details</h4>
            <div className="text-left mt-4 max-w-md mx-auto">
              <p>
                <strong>Mint Address:</strong> {certificate.nft.mintAddress}
              </p>
              <p>
                <strong>Metadata:</strong>{" "}
                <a
                  href={certificate.nft.metadata}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View Metadata
                </a>
              </p>
              <p>
                <strong>Ownership Proof:</strong>{" "}
                <a
                  href={certificate.nft.ownershipProof}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View Proof
                </a>
              </p>
            </div>
          </div>

          <div className="mt-8 flex justify-center space-x-4">
            <Button asChild>
              <a
                href={`https://twitter.com/intent/tweet?text=I just earned a certificate for completing the ${certificate.course.title} course on Solana Academy!&url=https://solana.academy/certificates/${certificate.id}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Share on Twitter
              </a>
            </Button>
            <Button asChild>
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=https://solana.academy/certificates/${certificate.id}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Share on LinkedIn
              </a>
            </Button>
            <Button>Download Image</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
