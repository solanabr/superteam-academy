"use client";

import { useEffect, useState } from "react";
import { onchainIdentityService } from "@/services/onchain-identity-service";
import { Credential } from "@/domain/models";
import Image from "next/image";

type Props = {
  wallet: string;
};

export function CredentialsCard({ wallet }: Props) {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [verification, setVerification] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function load() {
      const creds = await onchainIdentityService.getCredentials(wallet);
      setCredentials(creds);
      setLoading(false);
    }
    load();
  }, [wallet]);

  if (loading) {
    return <div className="animate-pulse h-[200px] bg-[#f5f5f7] rounded-[24px]" />;
  }

  if (credentials.length === 0) {
    return (
      <div className="py-16 text-center bg-[#f5f5f7] rounded-[24px]">
        <p className="text-[17px] text-muted font-medium">No credentials found.</p>
        <p className="text-[15px] text-[#86868b] mt-2">Complete a track to earn your first on-chain proof.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {credentials.map((cred) => (
        <div key={cred.id} className="flex items-center gap-6 bg-[#f5f5f7] rounded-[24px] p-6 hover:bg-[#e8e8ed] transition-colors">
          <div className="relative w-20 h-20 rounded-full overflow-hidden bg-white shrink-0 border border-line/20 shadow-sm">
            {cred.imageUrl ? (
              <Image src={cred.imageUrl} alt={cred.track} fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-brand">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-[19px] font-bold tracking-tight text-foreground">{cred.track} Track</h3>
            <p className="text-[15px] text-muted mb-3 font-medium">Level {cred.level} Certificate</p>
            <div className="flex items-center gap-4">
              <a href={cred.explorerUrl} target="_blank" rel="noreferrer" className="text-[13px] font-semibold text-brand hover:underline">
                View on Explorer
              </a>
              <button 
                className="text-[13px] font-semibold text-foreground hover:underline"
                onClick={async () => {
                  const isValid = await onchainIdentityService.verifyCredential(cred.id);
                  setVerification(prev => ({ ...prev, [cred.id]: isValid }));
                }}
              >
                Verify
              </button>
            </div>
            {verification[cred.id] !== undefined && (
              <p className={`text-[12px] font-medium mt-2 ${verification[cred.id] ? "text-[#34c759]" : "text-[#ff3b30]"}`}>
                {verification[cred.id] ? "✓ Cryptographically Verified" : "✕ Verification Failed"}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
