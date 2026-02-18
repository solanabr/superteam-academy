"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Map, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type { RoadmapDef } from "@/lib/roadmaps/types";

export default function AdminRoadmapsPage() {
  const router = useRouter();
  const [roadmaps, setRoadmaps] = useState<RoadmapDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteSlug, setDeleteSlug] = useState<string | null>(null);

  const fetchRoadmaps = useCallback(() => {
    fetch("/api/admin/roadmaps")
      .then((r) => r.json())
      .then((d: RoadmapDef[]) => setRoadmaps(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchRoadmaps();
  }, [fetchRoadmaps]);

  async function handleDelete() {
    if (!deleteSlug) return;
    await fetch(`/api/admin/roadmaps/${deleteSlug}`, { method: "DELETE" });
    setDeleteSlug(null);
    fetchRoadmaps();
  }

  async function handleCreate(data: {
    title: string;
    slug: string;
    description: string;
  }) {
    await fetch("/api/admin/roadmaps", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, sections: [] }),
    });
    setCreateOpen(false);
    fetchRoadmaps();
  }

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Roadmap Management</h1>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Roadmap
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {roadmaps.map((rm) => {
          const totalItems = rm.sections.reduce(
            (s, sec) => s + (sec.left?.length ?? 0) + (sec.right?.length ?? 0),
            0,
          );
          return (
            <Card key={rm.slug}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                      <Map className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-sm">{rm.title}</CardTitle>
                      <p className="text-xs text-muted-foreground">{rm.slug}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => router.push(`/admin/roadmaps/${rm.slug}`)}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => setDeleteSlug(rm.slug)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="mb-3 line-clamp-2 text-xs text-muted-foreground">
                  {rm.description}
                </p>
                <div className="flex gap-2">
                  <Badge variant="secondary">
                    {rm.sections.length} sections
                  </Badge>
                  <Badge variant="secondary">{totalItems} topics</Badge>
                </div>
                <Link
                  href={`/admin/roadmaps/${rm.slug}`}
                  className="mt-3 block text-xs text-primary hover:underline"
                >
                  Edit roadmap →
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Create Dialog */}
      <CreateRoadmapDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreate={handleCreate}
      />

      {/* Delete Confirmation */}
      <Dialog
        open={!!deleteSlug}
        onOpenChange={(open) => !open && setDeleteSlug(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Roadmap</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete <strong>{deleteSlug}</strong>?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteSlug(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CreateRoadmapDialog({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (data: {
    title: string;
    slug: string;
    description: string;
  }) => void;
}) {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onCreate({ title, slug, description });
    setTitle("");
    setSlug("");
    setDescription("");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Roadmap</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setSlug(
                  e.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/^-|-$/g, ""),
                );
              }}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Slug</Label>
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!title || !slug}>
              Create Roadmap
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
