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
    const { title, description, order } = body as {
      title?: string;
      description?: string;
      order?: number;
    };

    const sanity = getSanityWriteClient();
    const patch = sanity.patch(id);

    if (title !== undefined) patch.set({ title });
    if (description !== undefined) patch.set({ description });
    if (order !== undefined) patch.set({ order });

    const result = await patch.commit();

    return NextResponse.json({
      success: true,
      module: {
        _id: result._id,
        title: result.title,
        description: result.description,
        order: result.order,
      },
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to update module";
    console.error("update-module error:", err);
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

    // Remove module reference from any course that references it
    const courses = await sanity.fetch<{ _id: string }[]>(
      `*[_type == "course" && references($id)]{ _id }`,
      { id },
    );

    for (const course of courses) {
      await sanity
        .patch(course._id)
        .unset([`modules[_ref == "${id}"]`])
        .commit();
    }

    // Delete lessons referenced by this module
    const module = await sanity.fetch<{ lessons?: { _ref: string }[] }>(
      `*[_type == "module" && _id == $id][0]{ lessons[]{ _ref } }`,
      { id },
    );
    if (module?.lessons) {
      for (const lesson of module.lessons) {
        if (lesson._ref) {
          await sanity.delete(lesson._ref);
        }
      }
    }

    // Delete the module itself
    await sanity.delete(id);

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to delete module";
    console.error("delete-module error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
