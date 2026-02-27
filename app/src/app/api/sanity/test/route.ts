import { NextResponse } from 'next/server';
import { sanityClient } from '@/lib/sanity/client';

/**
 * Test Sanity connectivity and schema
 * GET /api/sanity/test
 */
export async function GET() {
  try {
    // Test 1: Check connection
    const connectionTest = await sanityClient.fetch(`*[_type == "sanity.imageAsset"][0]._id`);

    // Test 2: Count documents by type
    const counts = await sanityClient.fetch(`{
      "tracks": count(*[_type == "track"]),
      "instructors": count(*[_type == "instructor"]),
      "courses": count(*[_type == "course"]),
      "lessons": count(*[_type == "lesson"]),
      "achievements": count(*[_type == "achievement"])
    }`);

    // Test 3: Get sample data
    const sampleData = await sanityClient.fetch(`{
      "tracks": *[_type == "track"][0...3] { _id, title, slug },
      "courses": *[_type == "course"][0...3] { _id, title, slug, published },
      "instructors": *[_type == "instructor"][0...3] { _id, name, slug }
    }`);

    return NextResponse.json({
      success: true,
      message: 'Sanity CMS is connected and working!',
      connection: {
        projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
        dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
        apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION,
        connected: !!connectionTest || true,
      },
      documentCounts: counts,
      sampleData,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Sanity test error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        connection: {
          projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
          dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
          apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION,
        },
      },
      { status: 500 }
    );
  }
}
