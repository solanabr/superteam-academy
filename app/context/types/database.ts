export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string;
                    wallet_address: string | null;
                    email: string | null;
                    name: string | null;
                    username: string | null;
                    avatar_url: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    wallet_address?: string | null;
                    email?: string | null;
                    name?: string | null;
                    username?: string | null;
                    avatar_url?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    wallet_address?: string | null;
                    email?: string | null;
                    name?: string | null;
                    username?: string | null;
                    avatar_url?: string | null;
                    updated_at?: string;
                };
            };
            linked_accounts: {
                Row: {
                    id: string;
                    user_id: string;
                    provider: string;
                    provider_id: string;
                    provider_data: Json | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    provider: string;
                    provider_id: string;
                    provider_data?: Json | null;
                    created_at?: string;
                };
                Update: {
                    provider_data?: Json | null;
                };
            };
        };
    };
}
