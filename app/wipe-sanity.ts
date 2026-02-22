import { createClient } from 'next-sanity';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
    apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-01-01',
    token: process.env.SANITY_API_TOKEN,
    useCdn: false,
});

async function main() {
    console.log("Fetching all user-created documents...");
    // Fetch all documents that are not system documents (starting with _)
    const query = '*[!(_id in path("_.**")) && _type in ["course", "module", "lesson", "author", "track"]] { _id }';
    const docs = await client.fetch(query);

    if (docs.length === 0) {
        console.log("No documents found to delete.");
        return;
    }

    console.log(`Found ${docs.length} documents. Deleting...`);

    // Batch delete
    const transaction = client.transaction();
    docs.forEach((doc: any) => {
        transaction.delete(doc._id);
    });

    try {
        await transaction.commit();
        console.log(`Successfully deleted ${docs.length} documents.`);
    } catch (err) {
        console.error("Error deleting documents:", err);
    }
}

main().catch(console.error);
