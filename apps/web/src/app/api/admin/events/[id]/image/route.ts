import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  EVENT_IMAGE_BUCKET,
  EVENT_IMAGE_TYPES,
  MAX_EVENT_IMAGE_BYTES,
  isEventStorageUrl,
} from "@/lib/events/images";
import { adminGuard, badRequest } from "@/lib/events/admin";

export const dynamic = "force-dynamic";

const DATA_URL = /^data:(image\/[a-z]+);base64,([A-Za-z0-9+/=]+)$/;

/** The bucket path of an uploaded image, from its public URL. */
function objectPath(url: string): string {
  const marker = `/object/public/${EVENT_IMAGE_BUCKET}/`;
  return url.slice(url.indexOf(marker) + marker.length);
}

async function removeObject(url: string | null): Promise<void> {
  if (!isEventStorageUrl(url)) return;
  await createAdminClient()
    .storage.from(EVENT_IMAGE_BUCKET)
    .remove([objectPath(url)]);
}

/**
 * POST /api/admin/events/:id/image — upload the event's artwork. Body:
 * `{ dataUrl }`, a base64 PNG, JPEG or WebP data URL up to 1 MB, since admin
 * mutations are JSON-only. Each upload gets a new path so wallets and CDNs
 * never serve the old picture under the new one's URL.
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const auth = await adminGuard(req);
  if ("denied" in auth) return auth.denied;
  const { id } = await context.params;

  let dataUrl: unknown;
  try {
    ({ dataUrl } = (await req.json()) as { dataUrl?: unknown });
  } catch {
    return badRequest("Invalid JSON body");
  }
  const match = typeof dataUrl === "string" ? dataUrl.match(DATA_URL) : null;
  const ext = match ? EVENT_IMAGE_TYPES[match[1]!] : undefined;
  if (!match || !ext) return badRequest("invalidImage");
  const bytes = Buffer.from(match[2]!, "base64");
  if (bytes.length === 0 || bytes.length > MAX_EVENT_IMAGE_BYTES) {
    return badRequest("imageTooLarge");
  }

  const admin = createAdminClient();
  const { data: event } = await admin
    .from("events")
    .select("id, image_url")
    .eq("id", id)
    .maybeSingle();
  if (!event) {
    return NextResponse.json({ error: "notFound" }, { status: 404 });
  }

  const path = `${id}/${crypto.randomUUID()}.${ext}`;
  const { error: uploadError } = await admin.storage
    .from(EVENT_IMAGE_BUCKET)
    .upload(path, bytes, { contentType: match[1], upsert: false });
  if (uploadError) {
    return NextResponse.json({ error: "uploadFailed" }, { status: 500 });
  }
  const {
    data: { publicUrl },
  } = admin.storage.from(EVENT_IMAGE_BUCKET).getPublicUrl(path);

  const { error } = await admin
    .from("events")
    .update({ image_url: publicUrl })
    .eq("id", id);
  if (error) {
    return NextResponse.json({ error: "uploadFailed" }, { status: 500 });
  }
  await removeObject(event.image_url);
  return NextResponse.json({ imageUrl: publicUrl });
}

/** DELETE /api/admin/events/:id/image — back to the generated badge. */
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const auth = await adminGuard(req);
  if ("denied" in auth) return auth.denied;
  const { id } = await context.params;

  const admin = createAdminClient();
  const { data: event } = await admin
    .from("events")
    .select("id, image_url")
    .eq("id", id)
    .maybeSingle();
  if (!event) {
    return NextResponse.json({ error: "notFound" }, { status: 404 });
  }
  const { error } = await admin
    .from("events")
    .update({ image_url: null })
    .eq("id", id);
  if (error) {
    return NextResponse.json({ error: "removeFailed" }, { status: 500 });
  }
  await removeObject(event.image_url);
  return NextResponse.json({ imageUrl: null });
}
