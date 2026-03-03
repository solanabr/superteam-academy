# Auth & Account Linking Service (Backend)

**Version:** 1.0  
**Scope:** User authentication layer for Superteam Academy  
**Related Docs:** [SPEC.md](../../docs/SPEC.md) (Authority roles), [INTEGRATION.md](../../docs/INTEGRATION.md) (Frontend integration), [00-architecture.md](./00-architecture.md) (Backend overview), [frontend/03-auth.md](../frontend/03-auth.md) (Frontend implementation)

## Overview

Hybrid authentication system supporting Wallet, Google, and GitHub OAuth. Uses NextAuth.js for session management with Supabase as the database for user data.

**Architecture**: 
- **NextAuth.js**: Handles session management (JWT strategy)
- **OAuth Providers**: Google, GitHub via NextAuth.js
- **Wallet Auth**: CredentialsProvider with custom wallet verification
- **Supabase**: Stores user profiles, linked accounts, and application data
- **Session**: NextAuth.js JWT sessions stored in cookies

**Note:** This is the *user authentication* layer. For on-chain transaction signing (backend signer), see [00-architecture.md](./00-architecture.md#backend-signer).

**Frontend Implementation:** See [frontend/03-auth.md](../frontend/03-auth.md) for React hooks and components that consume these APIs.

## Auth Flow

### Two-Step Wallet Authentication

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    WALLET AUTH FLOW (Two-Step)                           │
│                                                                          │
│  Step 1: Get Message                                                     │
│  ┌──────────┐     POST /api/auth/wallet/sign-message                    │
│  │ Frontend │──────────────────────────────────────▶                     │
│  │          │     { walletAddress: "abc..." }                            │
│  └──────────┘                                                            │
│       │                                                                  │
│       │     { message: "Sign this...\nWallet: abc...\nNonce: xyz..." }   │
│       │                                                                  │
│       ▼                                                                  │
│  ┌──────────┐                                                            │
│  │  Store   │     Backend stores message in Redis (TTL: 5min)           │
│  │  Redis   │     Key: wallet:auth:${walletAddress}                      │
│  └──────────┘                                                            │
│                                                                          │
│  Step 2: Sign & Verify                                                   │
│  ┌──────────┐     Sign message with wallet                               │
│  │  Wallet  │◀───────────────────                                       │
│  └────┬─────┘                                                            │
│       │                                                                  │
│       │     POST /api/auth/wallet/verify                                 │
│       │     { walletAddress, message, signature }                        │
│       ▼                                                                  │
│  ┌──────────┐     1. Retrieve stored message from Redis                  │
│  │ Backend  │     2. Verify signature matches                            │
│  │          │     3. Find or create user in Supabase                     │
│  │          │     4. Return user to NextAuth CredentialsProvider         │
│  └────┬─────┘                                                            │
│       │                                                                  │
│       │     NextAuth creates JWT session                                 │
│       ▼                                                                  │
│  ┌──────────┐                                                            │
│  │ Frontend │     NextAuth manages session via cookies                   │
│  │          │     useSession() hook provides user data                   │
│  └──────────┘                                                            │
└─────────────────────────────────────────────────────────────────────────┘
```

### OAuth Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      OAUTH FLOW                                          │
│                                                                          │
│  ┌──────────┐     POST /api/auth/link/google (or /github)                │
│  │ Frontend │──────────────────────────────────────────▶                 │
│  │          │     { mode: "login" | "link" }                             │
│  └──────────┘                                                            │
│       │                                                                  │
│       │     { url: "https://accounts.google.com/o/oauth2/v2/auth..." }  │
│       ▼                                                                  │
│  ┌──────────┐                                                            │
│  │ Redirect │     User authorizes app                                    │
│  │  User    │                                                            │
│  └────┬─────┘                                                            │
│       │                                                                  │
│       ▼                                                                  │
│  ┌──────────┐     GET /api/auth/google/callback                         │
│  │  Google  │──────────────────────────────────────────▶                 │
│  │          │     ?code=xxx&state=xxx                                    │
│  └──────────┘                                                            │
│       │                                                                  │
│       │     1. NextAuth exchanges code for tokens                        │
│       │     2. Get user info from provider                               │
│       │     3. Find or create user in Supabase                           │
│       │     4. NextAuth creates JWT session                              │
│       ▼                                                                  │
│  ┌──────────┐     302 to /auth/callback                                   │
│  │ Redirect │     (NextAuth callback URL)                                │
│  │  to App  │                                                            │
│  └──────────┘                                                            │
│                                                                          │
│  ┌──────────┐     Frontend sets session and redirects to dashboard       │
│  │ Frontend │                                                            │
│  └──────────┘                                                            │
└─────────────────────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        HYBRID AUTH FLOW                                  │
│                                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                     │
│  │   WALLET    │  │   GOOGLE    │  │   GITHUB    │                     │
│  │   SIGN IN   │  │   OAUTH     │  │   OAUTH     │                     │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘                     │
│         │                │                │                             │
│         ▼                ▼                ▼                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                     │
│  │ Sign Message│  │ OAuth Flow  │  │ OAuth Flow  │                     │
│  │   + Verify  │  │   + Callback│  │   + Callback│                     │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘                     │
│         │                │                │                             │
│         └────────────────┼────────────────┘                             │
│                          │                                              │
│                          ▼                                              │
│                  ┌───────────────┐                                      │
│                  │  Check if     │                                      │
│                  │  user exists  │                                      │
│                  └───────┬───────┘                                      │
│                          │                                              │
│              ┌───────────┴───────────┐                                  │
│              │                       │                                  │
│              ▼                       ▼                                  │
│      ┌───────────────┐       ┌───────────────┐                          │
│      │  Create User  │       │  Get User    │                          │
│      │  + Link Acct  │       │  + Session   │                          │
│      └───────────────┘       └───────────────┘                          │
│                          │                                              │
│                          ▼                                              │
│                  ┌───────────────┐                                      │
│                  │ Return Session│                                      │
│                  │   + JWT Token │                                      │
│                  └───────────────┘                                      │
└─────────────────────────────────────────────────────────────────────────┘
```

## Account Linking Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      ACCOUNT LINKING FLOW                                │
│                                                                          │
│  User logged in with Google                                             │
│          │                                                               │
│          ▼                                                               │
│  ┌───────────────────┐                                                   │
│  │ Settings Page     │                                                   │
│  │ "Link Wallet"     │                                                   │
│  └─────────┬─────────┘                                                   │
│            │                                                             │
│            ▼                                                             │
│  ┌───────────────────┐                                                   │
│  │ Connect Wallet    │                                                   │
│  │ (Phantom/Backpack)│                                                   │
│  └─────────┬─────────┘                                                   │
│            │                                                             │
│            ▼                                                             │
│  ┌───────────────────┐                                                   │
│  │ Sign Message      │                                                   │
│  │ (prove ownership) │                                                   │
│  └─────────┬─────────┘                                                   │
│            │                                                             │
│            ▼                                                             │
│  ┌───────────────────┐                                                   │
│  │ Verify Signature  │                                                   │
│  └─────────┬─────────┘                                                   │
│            │                                                             │
│   ┌────────┴────────┐                                                    │
│   │                 │                                                    │
│   ▼                 ▼                                                    │
│ [Not Linked]     [Already Linked]                                        │
│   │                 │                                                    │
│   ▼                 ▼                                                    │
│ Link to user    Show error:                                              │
│ account         "Wallet linked to another account"                       │
└─────────────────────────────────────────────────────────────────────────┘
```

## Implementation

### 1. Supabase Client Setup

```typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/database'

export async function createClient() {
  const cookieStore = await cookies()
  
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}

// lib/supabase/admin.ts
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)
```

### 2. Wallet Authentication

```typescript
// lib/auth/wallet.ts
import { PublicKey } from '@solana/web3.js';
import nacl from 'tweetnacl';
import bs58 from 'bs58';

const AUTH_MESSAGE = 'Sign this message to authenticate with Superteam Academy';

export function generateAuthMessage(walletAddress: string): string {
  const nonce = crypto.randomUUID();
  const timestamp = Date.now();
  return `${AUTH_MESSAGE}\n\nWallet: ${walletAddress}\nNonce: ${nonce}\nTimestamp: ${timestamp}`;
}

export function verifyWalletSignature(
  walletAddress: string,
  message: string,
  signature: string
): boolean {
  try {
    const publicKey = new PublicKey(walletAddress);
    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = bs58.decode(signature);
    
    return nacl.sign.detached.verify(
      messageBytes,
      signatureBytes,
      publicKey.toBytes()
    );
  } catch {
    return false;
  }
}

export async function findUserByWallet(walletAddress: string) {
  const { data } = await supabaseAdmin
    .from('linked_accounts')
    .select('user_id, profiles!inner(*)')
    .eq('provider', 'wallet')
    .eq('provider_id', walletAddress)
    .single();
  
  return data;
}

export async function createUserWithWallet(walletAddress: string) {
  const { data: user, error: userError } = await supabaseAdmin
    .from('profiles')
    .insert({
      wallet_address: walletAddress,
      name: `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`,
    })
    .select()
    .single();
  
  if (userError) throw userError;
  
  const { error: linkError } = await supabaseAdmin
    .from('linked_accounts')
    .insert({
      user_id: user.id,
      provider: 'wallet',
      provider_id: walletAddress,
    });
  
  if (linkError) throw linkError;
  
  return user;
}
```

### 3. Wallet Auth API Route

#### Step 1: Generate Auth Message

```typescript
// app/api/auth/wallet/sign-message/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { generateAuthMessage } from '@/lib/auth/wallet';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function POST(request: NextRequest) {
  const { walletAddress } = await request.json();
  
  if (!walletAddress) {
    return NextResponse.json(
      { error: 'Wallet address required' }, 
      { status: 400 }
    );
  }
  
  // Validate Solana address format
  try {
    new PublicKey(walletAddress);
  } catch {
    return NextResponse.json(
      { error: 'Invalid wallet address' },
      { status: 400 }
    );
  }
  
  // Generate message with nonce for replay protection
  const message = generateAuthMessage(walletAddress);
  
  // Store message in Redis with 5-minute TTL
  await redis.setex(
    `wallet:auth:${walletAddress}`,
    300, // 5 minutes
    message
  );
  
  return NextResponse.json({ message });
}
```

**API Contract:**

| | Value |
|---|---|
| **Endpoint** | `POST /api/auth/wallet/sign-message` |
| **Content-Type** | `application/json` |

**Request Body:**
```json
{
  "walletAddress": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU"
}
```

**Response (200):**
```json
{
  "message": "Sign this message to authenticate with Superteam Academy\n\nWallet: 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU\nNonce: 550e8400-e29b-41d4-a716-446655440000\nTimestamp: 1708300800000"
}
```

**Response (400):**
```json
{
  "error": "Wallet address required"
}
```

---

#### Step 2: Verify Signature

```typescript
// app/api/auth/wallet/verify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyWalletSignature, findUserByWallet, createUserWithWallet } from '@/lib/auth/wallet';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function POST(request: NextRequest) {
  try {
    const { walletAddress, message, signature } = await request.json();
    
    // Validate inputs
    if (!walletAddress || !message || !signature) {
      return NextResponse.json(
        { error: 'Missing required fields', code: 'MISSING_FIELDS' },
        { status: 400 }
      );
    }
    
    // Retrieve stored message from Redis
    const storedMessage = await redis.get<string>(`wallet:auth:${walletAddress}`);
    
    if (!storedMessage) {
      return NextResponse.json(
        { error: 'Auth message expired or not found', code: 'MESSAGE_EXPIRED' },
        { status: 400 }
      );
    }
    
    // Verify the message matches what we sent
    if (message !== storedMessage) {
      return NextResponse.json(
        { error: 'Invalid message', code: 'INVALID_MESSAGE' },
        { status: 400 }
      );
    }
    
    // Verify signature
    const isValid = verifyWalletSignature(walletAddress, message, signature);
    
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid signature', code: 'INVALID_SIGNATURE' },
        { status: 401 }
      );
    }
    
    // Clean up Redis
    await redis.del(`wallet:auth:${walletAddress}`);
    
    // Find or create user
    let user = await findUserByWallet(walletAddress);
    let isNewUser = false;
    
    if (!user) {
      user = await createUserWithWallet(walletAddress);
      isNewUser = true;
    }
    
    // Create Supabase session
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: `${user.id}@wallet.academy.local`,
      email_confirm: true,
      user_metadata: {
        user_id: user.id,
        wallet_address: walletAddress,
      },
    });
    
    if (authError) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        { error: 'Failed to create session', code: 'SESSION_ERROR' },
        { status: 500 }
      );
    }
    
    // Generate session
    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.signInWithEmail({
      email: `${user.id}@wallet.academy.local`,
      password: crypto.randomUUID(), // This won't be used directly
    });
    
    if (sessionError || !sessionData.session) {
      console.error('Session error:', sessionError);
      return NextResponse.json(
        { error: 'Failed to create session', code: 'SESSION_ERROR' },
        { status: 500 }
      );
    }
    
    // Get linked accounts for response
    const { data: linkedAccounts } = await supabaseAdmin
      .from('linked_accounts')
      .select('provider, provider_id')
      .eq('user_id', user.id);
    
    return NextResponse.json({
      user: {
        id: user.id,
        wallet_address: user.wallet_address,
        name: user.name,
        avatar_url: user.avatar_url,
        email: user.email,
        linked_accounts: linkedAccounts || [],
      },
      session: {
        access_token: sessionData.session.access_token,
        refresh_token: sessionData.session.refresh_token,
        expires_at: sessionData.session.expires_at,
      },
      is_new_user: isNewUser,
    });
    
  } catch (error) {
    console.error('Wallet verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
```

**API Contract:**

| | Value |
|---|---|
| **Endpoint** | `POST /api/auth/wallet/verify` |
| **Content-Type** | `application/json` |

**Request Body:**
```json
{
  "walletAddress": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
  "message": "Sign this message to authenticate with Superteam Academy\n\nWallet: 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU\nNonce: 550e8400-e29b-41d4-a716-446655440000\nTimestamp: 1708300800000",
  "signature": "4vZ1H5Fz9JzvP..."
}
```

**Response (200) - Existing User:**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "wallet_address": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
    "name": "7xKX...gAsU",
    "avatar_url": null,
    "email": null,
    "linked_accounts": [
      { "provider": "wallet", "provider_id": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU" }
    ]
  },
  "session": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
    "expires_at": 1708304400
  },
  "is_new_user": false
}
```

**Response (200) - New User:**
```json
{
  "user": { ... },
  "session": { ... },
  "is_new_user": true
}
```

**Response (400 - Expired Message):**
```json
{
  "error": "Auth message expired or not found",
  "code": "MESSAGE_EXPIRED"
}
```

**Response (401 - Invalid Signature):**
```json
{
  "error": "Invalid signature",
  "code": "INVALID_SIGNATURE"
}
```
```

### 4. Google OAuth

```typescript
// lib/auth/google.ts
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function findUserByGoogleId(googleId: string) {
  const { data } = await supabaseAdmin
    .from('linked_accounts')
    .select('user_id, profiles!inner(*)')
    .eq('provider', 'google')
    .eq('provider_id', googleId)
    .single();
  
  return data;
}

export async function createUserWithGoogle(googleUser: {
  id: string;
  email: string;
  name: string;
  picture: string;
}) {
  const { data: user, error: userError } = await supabaseAdmin
    .from('profiles')
    .insert({
      email: googleUser.email,
      name: googleUser.name,
      avatar_url: googleUser.picture,
    })
    .select()
    .single();
  
  if (userError) throw userError;
  
  const { error: linkError } = await supabaseAdmin
    .from('linked_accounts')
    .insert({
      user_id: user.id,
      provider: 'google',
      provider_id: googleUser.id,
      provider_data: {
        email: googleUser.email,
        name: googleUser.name,
        picture: googleUser.picture,
      },
    });
  
  if (linkError) throw linkError;
  
  return user;
}

export async function linkGoogleToUser(
  userId: string,
  googleUser: { id: string; email: string; name: string; picture: string }
) {
  // Check if already linked to another account
  const existing = await findUserByGoogleId(googleUser.id);
  
  if (existing && existing.user_id !== userId) {
    throw new Error('Google account already linked to another user');
  }
  
  if (existing) {
    throw new Error('Google account already linked to this user');
  }
  
  const { error } = await supabaseAdmin
    .from('linked_accounts')
    .insert({
      user_id: userId,
      provider: 'google',
      provider_id: googleUser.id,
      provider_data: {
        email: googleUser.email,
        name: googleUser.name,
        picture: googleUser.picture,
      },
    });
  
  if (error) throw error;
  
  // Update profile email if not set
  await supabaseAdmin
    .from('profiles')
    .update({ email: googleUser.email })
    .is('email', null)
    .eq('id', userId);
}
```

### 5. Google OAuth Callback

```typescript
// app/api/auth/google/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { findUserByGoogleId, createUserWithGoogle } from '@/lib/auth/google';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  
  if (!code) {
    return NextResponse.redirect(new URL('/login?error=no_code', request.url));
  }
  
  // Exchange code for tokens
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/google/callback`,
      grant_type: 'authorization_code',
    }),
  });
  
  const tokens = await tokenResponse.json();
  
  // Get user info
  const userResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  
  const googleUser = await userResponse.json();
  
  // Find or create user
  let user = await findUserByGoogleId(googleUser.sub);
  
  if (!user) {
    user = await createUserWithGoogle({
      id: googleUser.sub,
      email: googleUser.email,
      name: googleUser.name,
      picture: googleUser.picture,
    });
  }
  
  // Create Supabase session
  const { data: session, error } = await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email: user.email || `${user.id}@google.academy`,
  });
  
  // Redirect to frontend with session
  const redirectUrl = new URL('/auth/callback', request.url);
  redirectUrl.searchParams.set('access_token', session.properties?.hashed_token || '');
  
  return NextResponse.redirect(redirectUrl);
}
```

### 6. GitHub OAuth

```typescript
// lib/auth/github.ts
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function findUserByGitHubId(githubId: string) {
  const { data } = await supabaseAdmin
    .from('linked_accounts')
    .select('user_id, profiles!inner(*)')
    .eq('provider', 'github')
    .eq('provider_id', githubId)
    .single();
  
  return data;
}

export async function createUserWithGitHub(githubUser: {
  id: number;
  login: string;
  email: string;
  name: string;
  avatar_url: string;
}) {
  const { data: user, error: userError } = await supabaseAdmin
    .from('profiles')
    .insert({
      email: githubUser.email,
      name: githubUser.name || githubUser.login,
      avatar_url: githubUser.avatar_url,
      username: githubUser.login,
    })
    .select()
    .single();
  
  if (userError) throw userError;
  
  const { error: linkError } = await supabaseAdmin
    .from('linked_accounts')
    .insert({
      user_id: user.id,
      provider: 'github',
      provider_id: String(githubUser.id),
      provider_data: {
        login: githubUser.login,
        email: githubUser.email,
        name: githubUser.name,
        avatar_url: githubUser.avatar_url,
      },
    });
  
  if (linkError) throw linkError;
  
  return user;
}

export async function linkGitHubToUser(
  userId: string,
  githubUser: { id: number; login: string; email: string; name: string; avatar_url: string }
) {
  const existing = await findUserByGitHubId(String(githubUser.id));
  
  if (existing && existing.user_id !== userId) {
    throw new Error('GitHub account already linked to another user');
  }
  
  if (existing) {
    throw new Error('GitHub account already linked to this user');
  }
  
  const { error } = await supabaseAdmin
    .from('linked_accounts')
    .insert({
      user_id: userId,
      provider: 'github',
      provider_id: String(githubUser.id),
      provider_data: {
        login: githubUser.login,
        email: githubUser.email,
        name: githubUser.name,
        avatar_url: githubUser.avatar_url,
      },
    });
  
  if (error) throw error;
}
```

### 7. GitHub OAuth Callback

```typescript
// app/api/auth/github/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { findUserByGitHubId, createUserWithGitHub } from '@/lib/auth/github';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  
  if (!code) {
    return NextResponse.redirect(new URL('/login?error=no_code', request.url));
  }
  
  // Exchange code for token
  const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID!,
      client_secret: process.env.GITHUB_CLIENT_SECRET!,
      code,
      redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/github/callback`,
    }),
  });
  
  const tokens = await tokenResponse.json();
  
  // Get user info
  const userResponse = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${tokens.access_token}`,
      'User-Agent': 'Superteam-Academy',
    },
  });
  
  const githubUser = await userResponse.json();
  
  // Get email (might be private)
  const emailResponse = await fetch('https://api.github.com/user/emails', {
    headers: {
      Authorization: `Bearer ${tokens.access_token}`,
      'User-Agent': 'Superteam-Academy',
    },
  });
  
  const emails = await emailResponse.json();
  const primaryEmail = emails.find((e: any) => e.primary)?.email || githubUser.email;
  
  // Find or create user
  let user = await findUserByGitHubId(String(githubUser.id));
  
  if (!user) {
    user = await createUserWithGitHub({
      id: githubUser.id,
      login: githubUser.login,
      email: primaryEmail,
      name: githubUser.name,
      avatar_url: githubUser.avatar_url,
    });
  }
  
  // Create session and redirect
  const redirectUrl = new URL('/auth/callback', request.url);
  redirectUrl.searchParams.set('user_id', user.id);
  
  return NextResponse.redirect(redirectUrl);
}
```

### 8. Account Linking API

```typescript
// app/api/auth/link/wallet/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyWalletSignature } from '@/lib/auth/wallet';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getSession } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  const session = await getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { walletAddress, message, signature } = await request.json();
  
  // Verify signature
  const isValid = verifyWalletSignature(walletAddress, message, signature);
  
  if (!isValid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }
  
  // Check if wallet already linked
  const { data: existing } = await supabaseAdmin
    .from('linked_accounts')
    .select('user_id')
    .eq('provider', 'wallet')
    .eq('provider_id', walletAddress)
    .single();
  
  if (existing) {
    return NextResponse.json(
      { error: 'Wallet already linked to another account' },
      { status: 400 }
    );
  }
  
  // Link wallet to user
  const { error } = await supabaseAdmin
    .from('linked_accounts')
    .insert({
      user_id: session.user.id,
      provider: 'wallet',
      provider_id: walletAddress,
    });
  
  if (error) {
    return NextResponse.json({ error: 'Failed to link wallet' }, { status: 500 });
  }
  
  // Update profile wallet_address if not set
  await supabaseAdmin
    .from('profiles')
    .update({ wallet_address: walletAddress })
    .is('wallet_address', null)
    .eq('id', session.user.id);
  
  return NextResponse.json({ success: true });
}

// app/api/auth/link/google/route.ts
export async function POST(request: NextRequest) {
  const session = await getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Return OAuth URL for linking
  const state = Buffer.from(JSON.stringify({
    userId: session.user.id,
    action: 'link',
  })).toString('base64');
  
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', process.env.GOOGLE_CLIENT_ID!);
  authUrl.searchParams.set('redirect_uri', `${process.env.NEXTAUTH_URL}/api/auth/google/callback`);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'openid email profile');
  authUrl.searchParams.set('state', state);
  
  return NextResponse.json({ url: authUrl.toString() });
}

// app/api/auth/link/github/route.ts
export async function POST(request: NextRequest) {
  const session = await getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const state = Buffer.from(JSON.stringify({
    userId: session.user.id,
    action: 'link',
  })).toString('base64');
  
  const authUrl = new URL('https://github.com/login/oauth/authorize');
  authUrl.searchParams.set('client_id', process.env.GITHUB_CLIENT_ID!);
  authUrl.searchParams.set('redirect_uri', `${process.env.NEXTAUTH_URL}/api/auth/github/callback`);
  authUrl.searchParams.set('scope', 'read:user user:email');
  authUrl.searchParams.set('state', state);
  
  return NextResponse.json({ url: authUrl.toString() });
}
```

### 9. Unlink Account

```typescript
// app/api/auth/unlink/[provider]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { provider: string } }
) {
  const session = await getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { provider } = params;
  
  // Count linked accounts
  const { data: accounts } = await supabaseAdmin
    .from('linked_accounts')
    .select('id')
    .eq('user_id', session.user.id);
  
  if (!accounts || accounts.length <= 1) {
    return NextResponse.json(
      { error: 'Cannot unlink the only authentication method' },
      { status: 400 }
    );
  }
  
  // Delete the link
  const { error } = await supabaseAdmin
    .from('linked_accounts')
    .delete()
    .eq('user_id', session.user.id)
    .eq('provider', provider);
  
  if (error) {
    return NextResponse.json({ error: 'Failed to unlink' }, { status: 500 });
  }
  
  // Clear wallet_address if unlinking wallet
  if (provider === 'wallet') {
    await supabaseAdmin
      .from('profiles')
      .update({ wallet_address: null })
      .eq('id', session.user.id);
  }
  
  return NextResponse.json({ success: true });
}
```

### 10. Session Management

```typescript
// app/api/auth/session/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return NextResponse.json({ user: null, session: null });
  }
  
  // Get profile with linked accounts
  const { data: profile } = await supabase
    .from('profiles')
    .select('*, linked_accounts(provider, provider_id)')
    .eq('id', session.user.id)
    .single();
  
  return NextResponse.json({
    user: profile,
    session: {
      access_token: session.access_token,
      expires_at: session.expires_at,
    },
  });
}

// app/api/auth/logout/route.ts
export async function POST() {
  const supabase = await createClient();
  
  await supabase.auth.signOut();
  
  return NextResponse.json({ success: true });
}
```

### 11. Get Linked Accounts

```typescript
// app/api/auth/linked-accounts/route.ts
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET() {
  const session = await getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { data: accounts } = await supabaseAdmin
    .from('linked_accounts')
    .select('*')
    .eq('user_id', session.user.id);
  
  const linkedProviders = accounts?.map(a => a.provider) || [];
  
  return NextResponse.json({
    accounts: accounts,
    hasWallet: linkedProviders.includes('wallet'),
    hasGoogle: linkedProviders.includes('google'),
    hasGitHub: linkedProviders.includes('github'),
  });
}
```

## Integration with On-Chain Program

### User Wallet vs Backend Signer

| Aspect | User Wallet Auth | Backend Signer |
|--------|------------------|----------------|
| **Purpose** | Identify user, manage sessions | Sign on-chain transactions |
| **Key Location** | User's wallet (Phantom, etc.) | Secure env var / AWS KMS |
| **Stored In** | `linked_accounts` table | `config.backend_signer` PDA |
| **Signs TXs** | `enroll`, `close_enrollment` | `complete_lesson`, `finalize_course`, `issue_credential` |
| **Rotation** | User can link new wallet | Admin calls `update_config` |

### Program Authority Roles (from SPEC)

Per [SPEC.md](../../docs/SPEC.md):

| Role | Key | Instructions Used |
|------|-----|-------------------|
| **Authority** | Squads multisig | `create_course`, `register_minter` |
| **Backend Signer** | Rotatable keypair | `complete_lesson`, `finalize_course` |
| **Learner** | Wallet signature | `enroll`, `close_enrollment` |
| **Minter** | Registered keypair | `reward_xp`, `award_achievement` |

The auth service handles **Learner** authentication. The backend signer (separate keypair) is used for transaction co-signing.

### Linking Wallet to On-Chain Identity

When a user links a wallet:

```typescript
// 1. Verify wallet signature (auth layer)
const isValid = verifyWalletSignature(walletAddress, message, signature);

// 2. Store in Supabase (user identity)
await supabase.from('linked_accounts').insert({
  user_id: user.id,
  provider: 'wallet',
  provider_id: walletAddress,
});

// 3. Update profile
await supabase.from('profiles')
  .update({ wallet_address: walletAddress })
  .eq('id', user.id);

// 4. Frontend can now derive PDAs for this wallet
// const enrollmentPda = deriveEnrollmentPda(courseId, walletAddress);
```

### Session → Wallet Mapping

```typescript
// Get wallet from session
export async function getSessionWallet(): Promise<string | null> {
  const session = await getSession();
  if (!session) return null;
  
  const { data: account } = await supabase
    .from('linked_accounts')
    .select('provider_id')
    .eq('user_id', session.user.id)
    .eq('provider', 'wallet')
    .single();
  
  return account?.provider_id || null;
}
```

## Monorepo Structure

This auth service is implemented as Next.js API routes:

```
app/
├── api/
│   ├── auth/
│   │   ├── wallet/
│   │   │   ├── sign-message/route.ts    # GET nonce message
│   │   │   └── verify/route.ts          # POST verify signature
│   │   ├── google/
│   │   │   └── callback/route.ts        # OAuth callback
│   │   ├── github/
│   │   │   └── callback/route.ts        # OAuth callback
│   │   ├── link/
│   │   │   ├── wallet/route.ts          # POST link wallet
│   │   │   ├── google/route.ts          # POST link Google
│   │   │   └── github/route.ts          # POST link GitHub
│   │   ├── unlink/
│   │   │   └── [provider]/route.ts      # DELETE unlink
│   │   ├── session/route.ts             # GET current session
│   │   └── logout/route.ts              # POST sign out
│   └── ...
├── layout.tsx
└── ...
```

## API Contract Summary

### Endpoints Overview

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| `POST` | `/api/auth/wallet/sign-message` | No | Get nonce message to sign |
| `POST` | `/api/auth/wallet/verify` | No | Verify signature and create session |
| `GET` | `/api/auth/google/callback` | No | Google OAuth callback |
| `GET` | `/api/auth/github/callback` | No | GitHub OAuth callback |
| `POST` | `/api/auth/link/wallet` | Yes | Link wallet to existing account |
| `POST` | `/api/auth/link/google` | Yes | Get Google OAuth URL for linking |
| `POST` | `/api/auth/link/github` | Yes | Get GitHub OAuth URL for linking |
| `DELETE` | `/api/auth/unlink/[provider]` | Yes | Unlink provider |
| `GET` | `/api/auth/session` | Cookie | Get current session |
| `POST` | `/api/auth/logout` | Cookie | Sign out |
| `GET` | `/api/auth/linked-accounts` | Yes | Get linked accounts |

### Account Linking Endpoints

#### Link Wallet

| | Value |
|---|---|
| **Endpoint** | `POST /api/auth/link/wallet` |
| **Auth** | Session cookie required |
| **Content-Type** | `application/json` |

**Request Body:**
```json
{
  "walletAddress": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
  "message": "Sign this message to authenticate with Superteam Academy\n\nWallet: 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU\nNonce: 550e8400-e29b-41d4-a716-446655440000\nTimestamp: 1708300800000",
  "signature": "4vZ1H5Fz9JzvP..."
}
```

**Response (200):**
```json
{
  "success": true
}
```

**Response (400 - Already Linked):**
```json
{
  "error": "Wallet already linked to another account"
}
```

**Response (401):**
```json
{
  "error": "Unauthorized"
}
```

#### Get OAuth Link URL

| | Value |
|---|---|
| **Endpoint** | `POST /api/auth/link/google` or `POST /api/auth/link/github` |
| **Auth** | Session cookie required |
| **Content-Type** | `application/json` |

**Request Body:**
```json
{
  "mode": "link"
}
```

**Response (200):**
```json
{
  "url": "https://accounts.google.com/o/oauth2/v2/auth?client_id=...&redirect_uri=..."
}
```

#### Unlink Provider

| | Value |
|---|---|
| **Endpoint** | `DELETE /api/auth/unlink/[provider]` |
| **Auth** | Session cookie required |
| **Provider** | `wallet`, `google`, or `github` |

**Response (200):**
```json
{
  "success": true
}
```

**Response (400 - Last Provider):**
```json
{
  "error": "Cannot unlink the only authentication method"
}
```

## Error Codes

| Code | HTTP | Description | Frontend Action |
|------|------|-------------|-----------------|
| `MISSING_FIELDS` | 400 | Required fields missing | Show validation error |
| `INVALID_WALLET` | 400 | Invalid Solana address | Prompt for valid address |
| `MESSAGE_EXPIRED` | 400 | Auth message expired | Retry from step 1 |
| `INVALID_MESSAGE` | 400 | Message doesn't match stored | Retry from step 1 |
| `INVALID_SIGNATURE` | 401 | Signature verification failed | Prompt to retry signing |
| `WALLET_LINKED` | 400 | Wallet linked to other account | Show error, can't link |
| `OAUTH_LINKED` | 400 | OAuth account linked to other | Show error, can't link |
| `UNAUTHORIZED` | 401 | No valid session | Redirect to login |
| `SESSION_ERROR` | 500 | Failed to create session | Show generic error, retry |
| `LAST_PROVIDER` | 400 | Cannot unlink only method | Prevent action |
| `INTERNAL_ERROR` | 500 | Server error | Show generic error |

## Frontend Integration

### React Hooks (Frontend)

See [frontend/03-auth.md](../frontend/03-auth.md) for complete frontend implementation including:

- `useWalletAuth()` - Wallet authentication hook
- `useOAuth()` - OAuth initiation hook
- `useAccountLinking()` - Account linking management
- `AuthProvider` - Root authentication context
- `ProtectedRoute` - Route protection component
- `AccountLinking` - Account linking UI component

### Integration Example

```typescript
// Frontend usage with backend APIs
import { useWalletAuth } from '@/hooks/useWalletAuth';
import { useAccountLinking } from '@/hooks/useAccountLinking';

function LoginButton() {
  const { authenticate } = useWalletAuth();
  
  const handleLogin = async () => {
    // This calls:
    // 1. POST /api/auth/wallet/sign-message
    // 2. Wallet sign
    // 3. POST /api/auth/wallet/verify
    const result = await authenticate();
    
    if (result.success) {
      // Session automatically set by AuthProvider
      router.push('/dashboard');
    }
  };
  
  return <button onClick={handleLogin}>Connect Wallet</button>;
}

function LinkWalletButton() {
  const { linkWallet } = useAccountLinking();
  
  const handleLink = async () => {
    // This calls:
    // 1. POST /api/auth/wallet/sign-message
    // 2. Wallet sign
    // 3. POST /api/auth/link/wallet
    const result = await linkWallet();
    
    if (result.success) {
      toast.success('Wallet linked!');
    }
  };
  
  return <button onClick={handleLink}>Link Wallet</button>;
}
```

## Testing

### API Testing Checklist

- [ ] `POST /api/auth/wallet/sign-message` - Returns message with nonce
- [ ] `POST /api/auth/wallet/verify` - Creates session with valid signature
- [ ] `POST /api/auth/wallet/verify` - Rejects expired message
- [ ] `POST /api/auth/wallet/verify` - Rejects invalid signature
- [ ] `GET /api/auth/google/callback` - Creates/returns user session
- [ ] `GET /api/auth/github/callback` - Creates/returns user session
- [ ] `POST /api/auth/link/wallet` - Links wallet to existing OAuth user
- [ ] `POST /api/auth/link/google` - Returns OAuth URL for linking
- [ ] `DELETE /api/auth/unlink/[provider]` - Unlinks provider
- [ ] `DELETE /api/auth/unlink/[provider]` - Prevents unlinking last provider
- [ ] `GET /api/auth/session` - Returns current session
- [ ] `POST /api/auth/logout` - Clears session

### Integration Testing

```bash
# Test wallet auth flow
curl -X POST http://localhost:3000/api/auth/wallet/sign-message \
  -H "Content-Type: application/json" \
  -d '{"walletAddress": "7xKX..."}'

# Sign message with wallet, then verify
curl -X POST http://localhost:3000/api/auth/wallet/verify \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "7xKX...",
    "message": "Sign this message...",
    "signature": "4vZ1..."
  }'
```

## Security Considerations

1. **Wallet Auth**
   - Always verify signature on server using `tweetnacl`
   - Include nonce and timestamp in message for replay protection
   - Rate limit auth attempts (Redis/cookie-based)
   - Store pending messages in Redis with 5-min TTL

2. **OAuth**
   - Use state parameter for CSRF protection
   - Verify id_token signatures when applicable
   - Store minimal user data (no tokens in DB)
   - Handle token refresh via Supabase Auth

3. **Session Management**
   - Use Supabase's built-in session management
   - Short-lived access tokens (1 hour)
   - Refresh token rotation
   - Secure httpOnly cookies

4. **Account Linking**
   - Prevent linking same provider to multiple accounts
   - Require active session for linking
   - Maintain at least one auth method (cannot unlink last)
   - Audit log all linking operations to `event_logs` table

5. **On-Chain Security**
   - Never store backend signer private key in database
   - Use AWS KMS or similar for production
   - Verify `backend_signer` matches Config PDA before signing TXs
   - Rotate signer via `update_config` if compromised
