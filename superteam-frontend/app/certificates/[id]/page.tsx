import { Navbar } from "@/components/navbar";
import { requireAuthenticatedUser } from "@/lib/server/auth-adapter";

export default async function Page({ params }: { params: { id: string } }) {
  await requireAuthenticatedUser();

  return (
    <div>
      <Navbar />
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-foreground mb-3">
          Certificate Not Found
        </h1>
        <p className="text-muted-foreground">
          On-chain credentials are coming soon. Completed courses will issue
          verifiable NFT certificates via the Superteam Academy program.
        </p>
      </div>
    </div>
  );
}
