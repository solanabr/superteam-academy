import type { AvatarService } from "./interfaces";
import { getAdminClient } from "@/lib/supabase/admin";

// --- Mock Implementation ---

class MockAvatarService implements AvatarService {
    async uploadAvatar(
        _userId: string,
        _file: File,
    ): Promise<{ avatarUrl: string }> {
        // Simulate upload delay
        await new Promise((r) => setTimeout(r, 500));
        return {
            avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${_userId}`,
        };
    }

    async deleteAvatar(_userId: string): Promise<void> {
        // No-op for mock
    }
}

// --- Supabase Implementation ---

class SupabaseAvatarService implements AvatarService {
    private get db() {
        const client = getAdminClient();
        if (!client) throw new Error("Supabase admin client not configured");
        return client;
    }

    async uploadAvatar(
        userId: string,
        file: File,
    ): Promise<{ avatarUrl: string }> {
        const ext =
            file.type.split("/")[1] === "jpeg" ? "jpg" : file.type.split("/")[1];
        const filePath = `${userId}.${ext}`;

        const buffer = Buffer.from(await file.arrayBuffer());

        const { error: uploadError } = await this.db.storage
            .from("avatars")
            .upload(filePath, buffer, {
                contentType: file.type,
                upsert: true,
            });

        if (uploadError) {
            throw new Error(`Avatar upload failed: ${uploadError.message}`);
        }

        const { data: publicUrlData } = this.db.storage
            .from("avatars")
            .getPublicUrl(filePath);

        const avatarUrl = publicUrlData.publicUrl;

        const { error: dbError } = await this.db
            .from("profiles")
            .update({ avatar_url: avatarUrl })
            .eq("id", userId);

        if (dbError) {
            throw new Error(`Profile update failed: ${dbError.message}`);
        }

        return { avatarUrl };
    }

    async deleteAvatar(userId: string): Promise<void> {
        // Remove all avatar files for this user (any extension)
        const { data: files } = await this.db.storage.from("avatars").list("", {
            search: userId,
        });

        if (files && files.length > 0) {
            await this.db.storage
                .from("avatars")
                .remove(files.map((f) => f.name));
        }

        await this.db
            .from("profiles")
            .update({ avatar_url: "" })
            .eq("id", userId);
    }
}

// --- Singleton with fallback ---

function createAvatarService(): AvatarService {
    if (
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
        return new SupabaseAvatarService();
    }
    return new MockAvatarService();
}

export const avatarService: AvatarService = createAvatarService();
