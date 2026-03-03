import { Request, Response } from "express";
import { syncAllCoursesFromSanity } from "../services/sanitySync";

/**
 * POST /api/v1/admin/sync-sanity
 * Admin-only endpoint to sync all courses from Sanity CMS into MongoDB.
 * Fetches all courses from Sanity, transforms them, and upserts into the database.
 */
export const syncFromSanity = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        console.log("🔄 Starting Sanity → MongoDB sync...");

        const result = await syncAllCoursesFromSanity();

        console.log(
            `✅ Sync complete: ${result.created.length} created, ${result.updated.length} updated, ${result.errors.length} errors`
        );

        if (result.errors.length > 0) {
            console.warn("⚠️  Sync errors:", result.errors);
        }

        res.status(200).json({
            success: true,
            message: "Sanity sync completed",
            data: {
                created: result.created,
                updated: result.updated,
                errors: result.errors,
                summary: {
                    totalCreated: result.created.length,
                    totalUpdated: result.updated.length,
                    totalErrors: result.errors.length,
                },
            },
        });
    } catch (error: any) {
        console.error("❌ Sanity sync failed:", error);
        res.status(500).json({
            success: false,
            message: "Sanity sync failed",
            error: error.message || "Unknown error",
        });
    }
};
