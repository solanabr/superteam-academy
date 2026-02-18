import { getAdminClient } from "@/lib/supabase/admin";
import type { NewsletterService } from "./interfaces";

export class SupabaseNewsletterService implements NewsletterService {
    async subscribe(
        email: string,
        locale?: string,
    ): Promise<{ alreadySubscribed: boolean }> {
        const db = getAdminClient();
        if (!db) {
            // Mock mode – pretend it worked
            return { alreadySubscribed: false };
        }

        // Check if already subscribed (and still active)
        const { data: existing } = await db
            .from("newsletter_subscribers")
            .select("id, unsubscribed_at")
            .eq("email", email.toLowerCase().trim())
            .single();

        if (existing) {
            if (existing.unsubscribed_at) {
                // Re-subscribe: clear unsubscribed_at
                await db
                    .from("newsletter_subscribers")
                    .update({ unsubscribed_at: null, locale })
                    .eq("id", existing.id);
                return { alreadySubscribed: false };
            }
            return { alreadySubscribed: true };
        }

        // New subscriber
        const { error } = await db
            .from("newsletter_subscribers")
            .insert({ email: email.toLowerCase().trim(), locale });

        if (error) {
            // Unique constraint race condition – treat as already subscribed
            if (error.code === "23505") {
                return { alreadySubscribed: true };
            }
            throw new Error(`Newsletter subscribe failed: ${error.message}`);
        }

        return { alreadySubscribed: false };
    }
}
