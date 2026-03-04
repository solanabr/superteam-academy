// lib/bunny.ts
// Bunny.net Stream API client for video uploads

import crypto from "crypto";

const BUNNY_API_KEY = process.env.BUNNY_API_KEY!;
const BUNNY_LIBRARY_ID = process.env.BUNNY_LIBRARY_ID!;
const BUNNY_API_BASE = "https://video.bunnycdn.com/library";

/**
 * Generates SHA256 signature for Bunny.net TUS upload authentication
 * Format: SHA256(library_id + api_key + expiration_time + video_id)
 */
function generateTusSignature(videoId: string, expirationTime: number): string {
  const signatureString = `${BUNNY_LIBRARY_ID}${BUNNY_API_KEY}${expirationTime}${videoId}`;
  return crypto.createHash("sha256").update(signatureString).digest("hex");
}

export interface CreateVideoResponse {
  videoLibraryId: number;
  guid: string;
  title: string;
  dateUploaded: string;
  views: number;
  isPublic: boolean;
  length: number;
  status: number;
  framerate: number;
  rotation: number;
  width: number;
  height: number;
  availableResolutions: string | null;
  thumbnailCount: number;
  encodeProgress: number;
  storageSize: number;
  captions: any[];
  hasMP4Fallback: boolean;
  collectionId: string;
  thumbnailFileName: string;
  averageWatchTime: number;
  totalWatchTime: number;
  category: string;
  chapters: any[];
  moments: any[];
  metaTags: any[];
  transcodingMessages: any[];
}

export interface BunnyVideoUploadCredentials {
  videoId: string;
  libraryId: string;
  uploadUrl: string;
  authorizationSignature: string;
  authorizationExpiration: number;
}

/**
 * Creates a new video entry in Bunny.net Stream library
 * Returns the video GUID and upload credentials
 */
export async function createBunnyVideo(title: string): Promise<BunnyVideoUploadCredentials> {
  // Step 1: Create the video entry
  const createResponse = await fetch(
    `${BUNNY_API_BASE}/${BUNNY_LIBRARY_ID}/videos`,
    {
      method: "POST",
      headers: {
        "AccessKey": BUNNY_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title }),
    }
  );

  if (!createResponse.ok) {
    const error = await createResponse.text();
    throw new Error(`Failed to create video: ${error}`);
  }

  const video: CreateVideoResponse = await createResponse.json();

  // Step 2: Generate the TUS upload URL with authentication
  // Bunny.net TUS endpoint format: https://video.bunnycdn.com/tusupload
  const expirationTime = Math.floor(Date.now() / 1000) + 86400; // 24 hours from now

  // Generate SHA256 signature for TUS authentication
  const authorizationSignature = generateTusSignature(video.guid, expirationTime);

  return {
    videoId: video.guid,
    libraryId: BUNNY_LIBRARY_ID,
    uploadUrl: `https://video.bunnycdn.com/tusupload`,
    authorizationSignature,
    authorizationExpiration: expirationTime,
  };
}

/**
 * Gets video details from Bunny.net
 */
export async function getBunnyVideo(videoId: string): Promise<CreateVideoResponse> {
  const response = await fetch(
    `${BUNNY_API_BASE}/${BUNNY_LIBRARY_ID}/videos/${videoId}`,
    {
      headers: {
        "AccessKey": BUNNY_API_KEY,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get video: ${error}`);
  }

  return response.json();
}

/**
 * Deletes a video from Bunny.net
 */
export async function deleteBunnyVideo(videoId: string): Promise<void> {
  const response = await fetch(
    `${BUNNY_API_BASE}/${BUNNY_LIBRARY_ID}/videos/${videoId}`,
    {
      method: "DELETE",
      headers: {
        "AccessKey": BUNNY_API_KEY,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to delete video: ${error}`);
  }
}

/**
 * Gets the library ID from environment
 */
export function getBunnyLibraryId(): string {
  return BUNNY_LIBRARY_ID;
}
