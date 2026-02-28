declare namespace NodeJS {
  interface ProcessEnv {
    // Solana
    NEXT_PUBLIC_SOLANA_RPC_URL?: string;
    NEXT_PUBLIC_SOLANA_NETWORK?: string;

    // Sanity CMS
    NEXT_PUBLIC_SANITY_PROJECT_ID?: string;
    NEXT_PUBLIC_SANITY_DATASET?: string;
    SANITY_API_TOKEN?: string;

    // Supabase
    NEXT_PUBLIC_SUPABASE_URL?: string;
    NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;

    // Analytics
    NEXT_PUBLIC_GA4_ID?: string;
    NEXT_PUBLIC_POSTHOG_KEY?: string;
    NEXT_PUBLIC_POSTHOG_HOST?: string;
    NEXT_PUBLIC_SENTRY_DSN?: string;

    // Helius
    NEXT_PUBLIC_HELIUS_API_KEY?: string;
  }
}
