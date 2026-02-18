"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Trash2,
  GripVertical,
  Save,
  Loader2,
  Link as LinkIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  RoadmapDef,
  RoadmapSection,
  BranchItem,
  ResourceLink,
} from "@/lib/roadmaps/types";
import { toast } from "sonner";

type PageProps = { params: Promise<{ slug: string }> };

export default function RoadmapEditorPage({ params }: PageProps) {
  const { slug } = use(params);
  const router = useRouter();
  const [roadmap, setRoadmap] = useState<RoadmapDef | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/roadmaps/${slug}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((d: RoadmapDef) => setRoadmap(d))
      .catch(() => router.replace("/admin/roadmaps"))
      .finally(() => setLoading(false));
  }, [slug, router]);

  async function handleSave() {
    if (!roadmap) return;
    setSaving(true);
    await fetch(`/api/admin/roadmaps/${slug}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(roadmap),
    });
    setSaving(false);
    toast.success("Roadmap saved");
  }

  function updateSection(idx: number, updates: Partial<RoadmapSection>) {
    setRoadmap((prev) => {
      if (!prev) return prev;
      const sections = prev.sections.map((s, i) =>
        i === idx ? { ...s, ...updates } : s,
      );
      return { ...prev, sections };
    });
  }

  function addSection() {
    setRoadmap((prev) => {
      if (!prev) return prev;
      const id = `section-${prev.sections.length + 1}`;
      return {
        ...prev,
        sections: [
          ...prev.sections,
          { id, title: "New Section", left: [], right: [] },
        ],
      };
    });
  }

  function removeSection(idx: number) {
    setRoadmap((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        sections: prev.sections.filter((_, i) => i !== idx),
      };
    });
  }

  function addBranchItem(sectionIdx: number, side: "left" | "right") {
    setRoadmap((prev) => {
      if (!prev) return prev;
      const sections = prev.sections.map((s, i) => {
        if (i !== sectionIdx) return s;
        const items = [...(s[side] ?? [])];
        const id = `${s.id}-${side}-${items.length + 1}`;
        items.push({ id, label: "New Topic", resources: [] });
        return { ...s, [side]: items };
      });
      return { ...prev, sections };
    });
  }

  function updateBranchItem(
    sectionIdx: number,
    side: "left" | "right",
    itemIdx: number,
    updates: Partial<BranchItem>,
  ) {
    setRoadmap((prev) => {
      if (!prev) return prev;
      const sections = prev.sections.map((s, i) => {
        if (i !== sectionIdx) return s;
        const items = (s[side] ?? []).map((item, j) =>
          j === itemIdx ? { ...item, ...updates } : item,
        );
        return { ...s, [side]: items };
      });
      return { ...prev, sections };
    });
  }

  function removeBranchItem(
    sectionIdx: number,
    side: "left" | "right",
    itemIdx: number,
  ) {
    setRoadmap((prev) => {
      if (!prev) return prev;
      const sections = prev.sections.map((s, i) => {
        if (i !== sectionIdx) return s;
        return {
          ...s,
          [side]: (s[side] ?? []).filter((_, j) => j !== itemIdx),
        };
      });
      return { ...prev, sections };
    });
  }

  function addResource(
    sectionIdx: number,
    side: "left" | "right",
    itemIdx: number,
  ) {
    setRoadmap((prev) => {
      if (!prev) return prev;
      const sections = prev.sections.map((s, i) => {
        if (i !== sectionIdx) return s;
        const items = (s[side] ?? []).map((item, j) => {
          if (j !== itemIdx) return item;
          return {
            ...item,
            resources: [
              ...(item.resources ?? []),
              { type: "docs" as const, title: "", url: "" },
            ],
          };
        });
        return { ...s, [side]: items };
      });
      return { ...prev, sections };
    });
  }

  function updateResource(
    sectionIdx: number,
    side: "left" | "right",
    itemIdx: number,
    resIdx: number,
    updates: Partial<ResourceLink>,
  ) {
    setRoadmap((prev) => {
      if (!prev) return prev;
      const sections = prev.sections.map((s, i) => {
        if (i !== sectionIdx) return s;
        const items = (s[side] ?? []).map((item, j) => {
          if (j !== itemIdx) return item;
          const resources = (item.resources ?? []).map((r, k) =>
            k === resIdx ? { ...r, ...updates } : r,
          );
          return { ...item, resources };
        });
        return { ...s, [side]: items };
      });
      return { ...prev, sections };
    });
  }

  function removeResource(
    sectionIdx: number,
    side: "left" | "right",
    itemIdx: number,
    resIdx: number,
  ) {
    setRoadmap((prev) => {
      if (!prev) return prev;
      const sections = prev.sections.map((s, i) => {
        if (i !== sectionIdx) return s;
        const items = (s[side] ?? []).map((item, j) => {
          if (j !== itemIdx) return item;
          return {
            ...item,
            resources: (item.resources ?? []).filter((_, k) => k !== resIdx),
          };
        });
        return { ...s, [side]: items };
      });
      return { ...prev, sections };
    });
  }

  if (loading || !roadmap) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/admin/roadmaps")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{roadmap.title}</h1>
            <p className="text-sm text-muted-foreground">{roadmap.slug}</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Changes
        </Button>
      </div>

      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Roadmap Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={roadmap.title}
                onChange={(e) =>
                  setRoadmap((prev) =>
                    prev ? { ...prev, title: e.target.value } : prev,
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input value={roadmap.slug} disabled />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={roadmap.description}
              onChange={(e) =>
                setRoadmap((prev) =>
                  prev ? { ...prev, description: e.target.value } : prev,
                )
              }
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Sections */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              Sections
              <Badge variant="secondary" className="ml-2">
                {roadmap.sections.length}
              </Badge>
            </CardTitle>
            <Button variant="outline" size="sm" onClick={addSection}>
              <Plus className="mr-2 h-3.5 w-3.5" />
              Add Section
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="space-y-2">
            {roadmap.sections.map((section, si) => (
              <AccordionItem
                key={si}
                value={`section-${si}`}
                className="rounded-lg border px-4"
              >
                <AccordionTrigger className="py-3 hover:no-underline">
                  <div className="flex items-center gap-3">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{section.title}</span>
                    <Badge variant="secondary" className="text-xs">
                      {(section.left?.length ?? 0) +
                        (section.right?.length ?? 0)}{" "}
                      topics
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pb-4">
                  {/* Section title */}
                  <div className="flex items-center gap-2">
                    <Input
                      value={section.title}
                      onChange={(e) =>
                        updateSection(si, { title: e.target.value })
                      }
                      className="flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-destructive"
                      onClick={() => removeSection(si)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Section Description</Label>
                    <Textarea
                      value={section.description ?? ""}
                      onChange={(e) =>
                        updateSection(si, { description: e.target.value })
                      }
                      rows={2}
                      className="text-sm"
                    />
                  </div>

                  {/* Left & Right Branches */}
                  <div className="grid gap-4 lg:grid-cols-2">
                    {(["left", "right"] as const).map((side) => (
                      <div key={side} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs capitalize">
                            {side} Branch
                          </Label>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => addBranchItem(si, side)}
                          >
                            <Plus className="mr-1 h-3 w-3" />
                            Add
                          </Button>
                        </div>
                        {(section[side] ?? []).map((item, ii) => (
                          <div
                            key={ii}
                            className="space-y-2 rounded-md border bg-muted/30 p-2"
                          >
                            <div className="flex items-center gap-2">
                              <GripVertical className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                              <Input
                                value={item.label}
                                onChange={(e) =>
                                  updateBranchItem(si, side, ii, {
                                    label: e.target.value,
                                  })
                                }
                                className="h-8 flex-1 text-sm"
                                placeholder="Topic label"
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 shrink-0 text-destructive"
                                onClick={() => removeBranchItem(si, side, ii)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                            <Textarea
                              value={item.description ?? ""}
                              onChange={(e) =>
                                updateBranchItem(si, side, ii, {
                                  description: e.target.value,
                                })
                              }
                              rows={1}
                              className="text-xs"
                              placeholder="Description"
                            />
                            {/* Resources */}
                            {(item.resources ?? []).map((res, ri) => (
                              <div key={ri} className="flex items-center gap-1">
                                <LinkIcon className="h-3 w-3 shrink-0 text-muted-foreground" />
                                <Select
                                  value={res.type}
                                  onValueChange={(v) =>
                                    updateResource(si, side, ii, ri, {
                                      type: v as ResourceLink["type"],
                                    })
                                  }
                                >
                                  <SelectTrigger className="h-7 w-20 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="docs">Docs</SelectItem>
                                    <SelectItem value="article">
                                      Article
                                    </SelectItem>
                                    <SelectItem value="video">Video</SelectItem>
                                    <SelectItem value="course">
                                      Course
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                                <Input
                                  value={res.title}
                                  onChange={(e) =>
                                    updateResource(si, side, ii, ri, {
                                      title: e.target.value,
                                    })
                                  }
                                  className="h-7 flex-1 text-xs"
                                  placeholder="Title"
                                />
                                <Input
                                  value={res.url}
                                  onChange={(e) =>
                                    updateResource(si, side, ii, ri, {
                                      url: e.target.value,
                                    })
                                  }
                                  className="h-7 flex-1 text-xs"
                                  placeholder="URL"
                                />
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 shrink-0 text-destructive"
                                  onClick={() =>
                                    removeResource(si, side, ii, ri)
                                  }
                                >
                                  <Trash2 className="h-2.5 w-2.5" />
                                </Button>
                              </div>
                            ))}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-full text-xs"
                              onClick={() => addResource(si, side, ii)}
                            >
                              <Plus className="mr-1 h-3 w-3" />
                              Add Resource
                            </Button>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
