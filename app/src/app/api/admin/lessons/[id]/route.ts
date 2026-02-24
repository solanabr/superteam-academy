import { NextResponse } from "next/server";
import { getSanityWriteClient } from "@/lib/sanity/write-client";
import { isAdminRequest } from "@/lib/auth/admin";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!(await isAdminRequest(req))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const {
      title,
      type,
      markdownContent,
      xpReward,
      estimatedMinutes,
      order,
      challenge,
    } = body as {
      title?: string;
      type?: string;
      markdownContent?: string;
      xpReward?: number;
      estimatedMinutes?: number;
      order?: number;
      challenge?: {
        instructions?: string;
        starterCode?: string;
        solution?: string;
        language?: string;
      };
    };

    const sanity = getSanityWriteClient();
    const updates: Record<string, unknown> = {};

    if (title !== undefined) {
      updates.title = title;
      updates.slug = {
        _type: "slug",
        current: title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, ""),
      };
    }
    if (type !== undefined) updates.type = type;
    if (markdownContent !== undefined) updates.markdownContent = markdownContent;
    if (xpReward !== undefined) updates.xpReward = xpReward;
    if (estimatedMinutes !== undefined)
      updates.estimatedMinutes = estimatedMinutes;
    if (order !== undefined) updates.order = order;
    if (challenge !== undefined) updates.challenge = challenge;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 },
      );
    }

    const result = await sanity.patch(id).set(updates).commit();

    return NextResponse.json({
      success: true,
      lesson: {
        _id: result._id,
        title: result.title,
        type: result.type,
      },
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to update lesson";
    console.error("update-lesson error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    if (!(await isAdminRequest(req))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const sanity = getSanityWriteClient();

    // Remove lesson reference from any module that references it
    const modules = await sanity.fetch<{ _id: string }[]>(
      `*[_type == "module" && references($id)]{ _id }`,
      { id },
    );
    for (const mod of modules) {
      await sanity
        .patch(mod._id)
        .unset([`lessons[_ref == "${id}"]`])
        .commit();
    }

    await sanity.delete(id);

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to delete lesson";
    console.error("delete-lesson error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
