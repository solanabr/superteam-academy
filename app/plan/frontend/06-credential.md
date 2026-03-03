# Credential Service

**Status**: Frontend implementation. Integrates with deployed devnet program.

## Devnet Program

| | Address |
|---|---|
| **Program ID** | `ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf` |

---

## Overview

The Credential Service fetches and displays Metaplex Core credential NFTs.

## Data Types

```typescript
interface Credential {
  asset: string;
  name: string;
  uri: string;
  attributes: CredentialAttributes;
  collection: string;
  owner: string;
  frozen: boolean;
}

interface CredentialAttributes {
  track_id: number;
  level: number;
  courses_completed: number;
  total_xp: number;
}
```

## Functions

### Fetch User Credentials (Helius DAS)

```typescript
// hooks/useCredentials.ts
import { useQuery } from '@tanstack/react-query';
import { PublicKey } from '@solana/web3.js';

const HELIUS_RPC = process.env.NEXT_PUBLIC_HELIUS_RPC;

export function useCredentials(wallet: PublicKey | null, trackCollection?: PublicKey) {
  return useQuery({
    queryKey: ['credentials', wallet?.toBase58(), trackCollection?.toBase58()],
    queryFn: async () => {
      if (!wallet) return [];
      
      const response = await fetch(HELIUS_RPC, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: '1',
          method: 'getAssetsByOwner',
          params: {
            ownerAddress: wallet.toBase58(),
            page: 1,
            limit: 100,
          },
        }),
      });
      
      const data = await response.json();
      let credentials = data.result.items;
      
      // Filter by track collection if provided
      if (trackCollection) {
        credentials = credentials.filter(
          (item: any) => item.grouping?.find(
            (g: any) => g.group_key === 'collection' && g.group_value === trackCollection.toBase58()
          )
        );
      }
      
      return credentials.map((item: any) => parseCredential(item));
    },
    enabled: !!wallet,
  });
}

function parseCredential(item: any): Credential {
  const attrs: Record<string, any> = {};
  item.content?.metadata?.attributes?.forEach((attr: any) => {
    attrs[attr.trait_type] = attr.value;
  });
  
  return {
    asset: item.id,
    name: item.content?.metadata?.name || '',
    uri: item.content?.json_uri || '',
    attributes: {
      track_id: attrs.track_id || 0,
      level: attrs.level || 1,
      courses_completed: attrs.courses_completed || 0,
      total_xp: attrs.total_xp || 0,
    },
    collection: item.grouping?.find((g: any) => g.group_key === 'collection')?.group_value || '',
    owner: item.ownership?.owner || '',
    frozen: item.frozen || false,
  };
}
```

### Check Credential Status

```typescript
// hooks/useCredentialStatus.ts
export function useCredentialStatus(courseId: string, learner: PublicKey | null) {
  const { program } = useProgram();
  
  return useQuery({
    queryKey: ['credentialStatus', courseId, learner?.toBase58()],
    queryFn: async () => {
      if (!learner) return { hasCredential: false };
      
      const enrollmentPda = deriveEnrollmentPda(courseId, learner, PROGRAM_ID);
      const enrollment = await program.account.enrollment.fetchNullable(enrollmentPda);
      
      if (!enrollment) return { hasCredential: false };
      
      return {
        hasCredential: !!enrollment.credentialAsset,
        credentialAsset: enrollment.credentialAsset?.toBase58() || null,
        finalized: !!enrollment.completedAt,
      };
    },
    enabled: !!courseId && !!learner,
  });
}
```

## Credential Display Components

### Credential Card

```typescript
// components/credential/CredentialCard.tsx
interface CredentialCardProps {
  credential: Credential;
}

export function CredentialCard({ credential }: CredentialCardProps) {
  const trackNames: Record<number, string> = {
    1: 'Anchor Developer',
    2: 'DeFi Specialist',
    3: 'Mobile Developer',
  };
  
  return (
    <div className="credential-card">
      <div className="credential-image">
        <img src={credential.attributes.image} alt={credential.name} />
      </div>
      <div className="credential-info">
        <h3>{credential.name}</h3>
        <p className="track">{trackNames[credential.attributes.track_id]}</p>
        <div className="attributes">
          <span className="level">Level {credential.attributes.level}</span>
          <span className="courses">{credential.attributes.courses_completed} courses</span>
          <span className="xp">{credential.attributes.total_xp} XP</span>
        </div>
        {credential.frozen && (
          <div className="soulbound-badge">Soulbound</div>
        )}
      </div>
    </div>
  );
}
```

### Credential Display

```typescript
// components/credential/CredentialDisplay.tsx
export function CredentialDisplay({ credentials }: { credentials: Credential[] }) {
  if (credentials.length === 0) {
    return (
      <div className="empty-credentials">
        <p>Complete courses to earn credentials</p>
      </div>
    );
  }
  
  return (
    <div className="credentials-grid">
      {credentials.map(cred => (
        <CredentialCard key={cred.asset} credential={cred} />
      ))}
    </div>
  );
}
```

## Track Collections

```typescript
export const TRACK_COLLECTIONS: Record<number, string> = {
  1: 'AnchorCollectionAddress...',
  2: 'DeFiCollectionAddress...',
  3: 'MobileCollectionAddress...',
  // ...
};
```
