"use client";

import { PageHeader } from "@/components/app";
import {
  useAllCourses,
  useIssueCredential,
  useUpgradeCredential,
  useIsAdmin,
  useCreateCredentialCollection,
  useIssueCredentialForCompletion,
} from "@/hooks";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Award } from "lucide-react";
import { uploadCredentialMetadata } from "@/lib/services/backend-api";
import { toast } from "sonner";

type CourseAccount = {
  courseId: string;
  lessonCount: number;
};

type TrackInfo = {
  _id: string;
  trackId: number;
  name: string;
  slug: { current: string };
  trackCollection: string;
};

const PLACEHOLDER_URI = process.env.NEXT_PUBLIC_CREDENTIAL_PLACEHOLDER_URI ?? "";

export default function AdminCredentialsPage() {
  const { role } = useIsAdmin();
  const { data: courses } = useAllCourses();
  const { mutateAsync: issueCredential, isPending: issuing } = useIssueCredential();
  const { mutateAsync: upgradeCredential, isPending: upgrading } = useUpgradeCredential();
  const { mutate: createCollection, isPending: creatingCollection } = useCreateCredentialCollection();
  const { mutate: issueForCompletion, isPending: issuingForCompletion } = useIssueCredentialForCompletion();
  const [tracks, setTracks] = useState<TrackInfo[]>([]);
  const [createCollectionForm, setCreateCollectionForm] = useState({
    name: "",
    description: "",
    imageDataUrl: "",
    imageFilename: "collection-image.png",
  });
  const [issueForCompletionForm, setIssueForCompletionForm] = useState({
    courseId: "",
    learner: "",
    trackCollection: "",
  });

  const { data: backendCollectionsData } = useQuery({
    queryKey: ["credential-collections"],
    queryFn: async () => {
      const r = await fetch("/api/credential-collections", { cache: "no-store" });
      const d = (await r.json()) as {
        collections?: Record<string, string>;
        list?: Array<{
          trackId: number;
          collectionAddress: string;
          name: string | null;
          imageUrl: string | null;
          metadataUri: string | null;
        }>;
      };
      return { collections: d.collections ?? {}, list: d.list ?? [] };
    },
  });
  const backendCollections = backendCollectionsData?.collections;
  const collectionsList = backendCollectionsData?.list ?? [];

  const [issueForm, setIssueForm] = useState({
    courseId: "",
    learner: "",
    trackCollection: "",
    credentialName: "",
    metadataUri: PLACEHOLDER_URI,
    coursesCompleted: 1,
    totalXp: 0,
    imageBase64: "",
    imageFilename: "credential-image.png",
  });
  const [upgradeForm, setUpgradeForm] = useState({
    courseId: "",
    learner: "",
    credentialAsset: "",
    trackCollection: "",
    credentialName: "",
    metadataUri: PLACEHOLDER_URI,
    coursesCompleted: 1,
    totalXp: 0,
    imageBase64: "",
    imageFilename: "credential-image.png",
  });

  useEffect(() => {
    fetch("/api/tracks")
      .then((r) => r.json())
      .then((data: { tracks?: TrackInfo[] }) => setTracks(data.tracks ?? []))
      .catch(() => setTracks([]));
  }, []);

  const courseList = (courses ?? []).map((c) => c.account as CourseAccount);
  const trackOptionsFromSanity = tracks.map((t) => ({
    value: t.trackCollection,
    label: `${t.name} (${t.trackCollection.slice(0, 8)}…)`,
    imageUrl: null as string | null,
  }));
  const trackOptionsFromBackend = collectionsList.map((item) => ({
    value: item.collectionAddress,
    label: item.name
      ? `${item.name} (Track ${item.trackId})`
      : `Track ${item.trackId} ${item.collectionAddress.slice(0, 8)}…`,
    imageUrl: item.imageUrl ?? null,
  }));
  const trackOptions = [...trackOptionsFromSanity];
  trackOptionsFromBackend.forEach((o) => {
    if (!trackOptions.some((t) => t.value === o.value)) trackOptions.push(o);
  });

  const handleUploadMetadata = async (
    name: string,
    attrs: { track_id?: number; level?: number; courses_completed?: number; total_xp?: number; course_id?: string },
    setUri: (uri: string) => void,
    imageBase64?: string,
    imageFilename?: string
  ) => {
    const res = await uploadCredentialMetadata({
      name,
      description: `Superteam Academy credential: ${name}`,
      attributes: attrs,
      ...(imageBase64 && { imageBase64, imageFilename: imageFilename ?? "credential-image.png" }),
    });
    if (res.uri) {
      setUri(res.uri);
      toast.success("Metadata uploaded to Pinata");
    } else {
      toast.error(res.error ?? "Upload failed");
    }
  };

  const readFileAsBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => {
        const dataUrl = r.result as string;
        const base64 = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;
        resolve(base64 ?? "");
      };
      r.onerror = () => reject(r.error);
      r.readAsDataURL(file);
    });

  const readFileAsDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve((r.result as string) ?? "");
      r.onerror = () => reject(r.error);
      r.readAsDataURL(file);
    });

  const canUseCredentials = role === "authority" || role === "backend_signer";
  const canCreateCollection = role === "authority";

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Credentials"
        subtitle="Create collections, issue credentials, and automate without env"
      />

      <p className="font-game text-sm text-muted-foreground">
        Create a track collection below so the backend can auto-issue credentials when learners complete courses.
        No need to set <code className="rounded bg-muted px-1">TRACK_COLLECTIONS</code> or <code className="rounded bg-muted px-1">NEXT_PUBLIC_CREDENTIAL_TRACK_COLLECTIONS</code>.
      </p>

      {courseList.length > 0 && (
        <div className="p-4 sm:p-6 rounded-2xl border-4 border-border bg-card">
          <h2 className="font-game text-xl mb-1">On-chain courses</h2>
          <p className="font-game text-muted-foreground text-sm mb-2">
            Use these course IDs in the forms below.
          </p>
          <div className="flex flex-wrap gap-2">
            {courseList.map((acc) => (
              <Link
                key={acc.courseId}
                href="/test"
                className="font-mono text-sm text-yellow-400 hover:underline"
              >
                {acc.courseId}
              </Link>
            ))}
          </div>
        </div>
      )}

      {canCreateCollection && (
        <div className="p-4 sm:p-6 rounded-2xl border-4 border-border bg-card">
          <h2 className="font-game text-xl mb-1">Create track collection</h2>
          <p className="font-game text-muted-foreground text-sm mb-4">
            Mint a Metaplex Core collection for a new track. Backend assigns the track ID, uploads optional image/metadata to Pinata, and stores it for dropdowns.
          </p>
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-end gap-4">
              <div className="space-y-2 flex-1 min-w-[200px]">
                <Label className="font-game">Name</Label>
                <Input
                  placeholder="e.g. Solana Track"
                  value={createCollectionForm.name}
                  onChange={(e) => setCreateCollectionForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2 flex-1 min-w-[200px]">
                <Label className="font-game">Description (optional)</Label>
                <Input
                  placeholder="Short description"
                  value={createCollectionForm.description}
                  onChange={(e) =>
                    setCreateCollectionForm((f) => ({ ...f, description: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="font-game">Collection image (optional)</Label>
              <div
                className="border-2 border-dashed border-border rounded-xl p-4 flex items-center gap-4 cursor-pointer hover:bg-muted/50 transition-colors max-w-md"
                onClick={() => document.getElementById("collection-image-input")?.click()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files[0];
                  if (file?.type.startsWith("image/")) {
                    readFileAsDataUrl(file).then((dataUrl) =>
                      setCreateCollectionForm((f) => ({
                        ...f,
                        imageDataUrl: dataUrl,
                        imageFilename: file.name || "collection-image.png",
                      }))
                    );
                  }
                }}
                onDragOver={(e) => e.preventDefault()}
              >
                <input
                  id="collection-image-input"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      readFileAsDataUrl(file).then((dataUrl) =>
                        setCreateCollectionForm((f) => ({
                          ...f,
                          imageDataUrl: dataUrl,
                          imageFilename: file.name || "collection-image.png",
                        }))
                      );
                    }
                  }}
                />
                {createCollectionForm.imageDataUrl ? (
                  <>
                    <img
                      src={createCollectionForm.imageDataUrl}
                      alt="Collection preview"
                      className="h-6 w-6 sm:h-8 sm:w-8 rounded object-cover shrink-0 border border-border bg-muted/30"
                    />
                    <div className="flex flex-col gap-0.5">
                      <span className="font-game text-sm text-muted-foreground">
                        {createCollectionForm.imageFilename}
                      </span>
                      <span className="font-game text-xs text-muted-foreground">
                        Click or drop to replace
                      </span>
                    </div>
                  </>
                ) : (
                  <span className="font-game text-sm text-muted-foreground">
                    Drop image or click to select
                  </span>
                )}
              </div>
            </div>
            <Button
              variant="pixel"
              className="font-game w-fit"
              disabled={!createCollectionForm.name.trim() || creatingCollection}
              onClick={() =>
                createCollection({
                  name: createCollectionForm.name.trim(),
                  ...(createCollectionForm.description.trim()
                    ? { description: createCollectionForm.description.trim() }
                    : {}),
                  ...(createCollectionForm.imageDataUrl
                    ? {
                        imageBase64:
                          createCollectionForm.imageDataUrl.includes(",")
                            ? createCollectionForm.imageDataUrl.split(",")[1]
                            : createCollectionForm.imageDataUrl,
                        imageFilename: createCollectionForm.imageFilename,
                      }
                    : {}),
                })
              }
            >
              {creatingCollection ? "Creating…" : "Create collection"}
            </Button>
          </div>
        </div>
      )}

      {canUseCredentials && (
        <div className="p-4 sm:p-6 rounded-2xl border-4 border-border bg-card">
          <h2 className="font-game text-xl mb-1">Issue for completed course</h2>
          <p className="font-game text-muted-foreground text-sm mb-4">
            Run credential automation for a learner who already finalized a course. Pick a track collection (Sanity or backend).
          </p>
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2 min-w-[180px]">
              <Label className="font-game">Course</Label>
              <Select
                value={issueForCompletionForm.courseId}
                onValueChange={(v) =>
                  setIssueForCompletionForm((f) => ({ ...f, courseId: v }))
                }
              >
                <SelectTrigger className="font-game">
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  {courseList.map((acc) => (
                    <SelectItem key={acc.courseId} value={acc.courseId}>
                      {acc.courseId}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 min-w-[180px]">
              <Label className="font-game">Track collection</Label>
              <Select
                value={issueForCompletionForm.trackCollection}
                onValueChange={(v) =>
                  setIssueForCompletionForm((f) => ({ ...f, trackCollection: v }))
                }
              >
                <SelectTrigger className="font-game">
                  <SelectValue placeholder="Select collection" />
                </SelectTrigger>
                <SelectContent>
                  {trackOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      <div className="flex items-center gap-2">
                        {o.imageUrl ? (
                          <img
                            src={o.imageUrl}
                            alt=""
                            className="h-6 w-6 rounded object-cover shrink-0"
                          />
                        ) : (
                          <div className="h-6 w-6 rounded bg-muted flex items-center justify-center shrink-0">
                            <Award className="h-3.5 w-3.5 text-muted-foreground" />
                          </div>
                        )}
                        <span>{o.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Or paste collection pubkey"
                value={issueForCompletionForm.trackCollection}
                onChange={(e) =>
                  setIssueForCompletionForm((f) => ({ ...f, trackCollection: e.target.value }))
                }
                className="mt-1 font-mono text-sm"
              />
            </div>
            <div className="space-y-2 flex-1 min-w-[200px]">
              <Label className="font-game">Learner (pubkey)</Label>
              <Input
                placeholder="Wallet pubkey"
                value={issueForCompletionForm.learner}
                onChange={(e) =>
                  setIssueForCompletionForm((f) => ({ ...f, learner: e.target.value }))
                }
                className="font-mono text-sm"
              />
            </div>
            <Button
              variant="pixel"
              className="font-game"
              disabled={
                !issueForCompletionForm.courseId ||
                !issueForCompletionForm.trackCollection ||
                !issueForCompletionForm.learner.trim() ||
                issuingForCompletion
              }
              onClick={() =>
                issueForCompletion({
                  courseId: issueForCompletionForm.courseId,
                  learner: issueForCompletionForm.learner.trim(),
                  trackCollection: issueForCompletionForm.trackCollection,
                })
              }
            >
              {issuingForCompletion ? "Issuing…" : "Issue credential"}
            </Button>
          </div>
        </div>
      )}

      {canUseCredentials && (
        <>
          <div className="p-4 sm:p-6 rounded-2xl border-4 border-border bg-card">
            <h2 className="font-game text-xl mb-1">Manual issue</h2>
            <p className="font-game text-muted-foreground text-sm mb-4">
              Issue a new credential for a learner (first course in track). Backend signer required.
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label className="font-game">Course</Label>
                <Select
                  value={issueForm.courseId}
                  onValueChange={(v) => setIssueForm((f) => ({ ...f, courseId: v }))}
                >
                  <SelectTrigger className="font-game">
                    <SelectValue placeholder="Select course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courseList.map((acc) => (
                      <SelectItem key={acc.courseId} value={acc.courseId}>
                        {acc.courseId}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="font-game">Learner (pubkey)</Label>
                <Input
                  placeholder="Wallet pubkey"
                  value={issueForm.learner}
                  onChange={(e) => setIssueForm((f) => ({ ...f, learner: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label className="font-game">Track collection</Label>
                <Select
                  value={issueForm.trackCollection}
                  onValueChange={(v) => setIssueForm((f) => ({ ...f, trackCollection: v }))}
                >
                  <SelectTrigger className="font-game">
                    <SelectValue placeholder="Select collection" />
                  </SelectTrigger>
                  <SelectContent>
                    {trackOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        <div className="flex items-center gap-2">
                          {o.imageUrl ? (
                            <img
                              src={o.imageUrl}
                              alt=""
                              className="h-6 w-6 rounded object-cover shrink-0"
                            />
                          ) : (
                            <div className="h-6 w-6 rounded bg-muted flex items-center justify-center shrink-0">
                              <Award className="h-3.5 w-3.5 text-muted-foreground" />
                            </div>
                          )}
                          <span>{o.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Or paste collection pubkey"
                  value={issueForm.trackCollection}
                  onChange={(e) => setIssueForm((f) => ({ ...f, trackCollection: e.target.value }))}
                  className="mt-1 font-mono text-sm"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label className="font-game">Credential image</Label>
                <div
                  className="border-2 border-dashed border-border rounded-xl p-4 flex items-center gap-4 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => document.getElementById("issue-image-input")?.click()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files[0];
                    if (file?.type.startsWith("image/")) {
                      readFileAsBase64(file).then((base64) =>
                        setIssueForm((f) => ({
                          ...f,
                          imageBase64: base64,
                          imageFilename: file.name || "credential-image.png",
                        }))
                      );
                    }
                  }}
                  onDragOver={(e) => e.preventDefault()}
                >
                  <input
                    id="issue-image-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        readFileAsBase64(file).then((base64) =>
                          setIssueForm((f) => ({
                            ...f,
                            imageBase64: base64,
                            imageFilename: file.name || "credential-image.png",
                          }))
                        );
                      }
                    }}
                  />
                  {issueForm.imageBase64 ? (
                    <>
                      <img
                        src={`data:image/png;base64,${issueForm.imageBase64}`}
                        alt="Preview"
                        className="h-16 w-16 object-cover rounded-lg border border-border"
                      />
                      <span className="font-game text-sm text-muted-foreground">
                        {issueForm.imageFilename} · click or drop to replace
                      </span>
                    </>
                  ) : (
                    <span className="font-game text-sm text-muted-foreground">
                      Drop image or click to select
                    </span>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="font-game">Credential name</Label>
                <Input
                  placeholder="e.g. Track 1 Level 1"
                  value={issueForm.credentialName}
                  onChange={(e) => setIssueForm((f) => ({ ...f, credentialName: e.target.value }))}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label className="font-game">Metadata URI</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder={PLACEHOLDER_URI || "https://… (metadata URI)"}
                    value={issueForm.metadataUri}
                    onChange={(e) => setIssueForm((f) => ({ ...f, metadataUri: e.target.value }))}
                    className="font-mono text-sm"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="font-game shrink-0"
                    onClick={() =>
                      handleUploadMetadata(
                        issueForm.credentialName || "Credential",
                        {
                          courses_completed: issueForm.coursesCompleted,
                          total_xp: issueForm.totalXp,
                          course_id: issueForm.courseId,
                        },
                        (uri) => setIssueForm((f) => ({ ...f, metadataUri: uri })),
                        issueForm.imageBase64 || undefined,
                        issueForm.imageFilename
                      )
                    }
                  >
                    Upload Pinata
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="font-game">coursesCompleted</Label>
                <Input
                  type="number"
                  min={0}
                  value={issueForm.coursesCompleted}
                  onChange={(e) =>
                    setIssueForm((f) => ({ ...f, coursesCompleted: +e.target.value || 0 }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label className="font-game">totalXp</Label>
                <Input
                  type="number"
                  min={0}
                  value={issueForm.totalXp}
                  onChange={(e) =>
                    setIssueForm((f) => ({ ...f, totalXp: +e.target.value || 0 }))
                  }
                />
              </div>
            </div>
            <Button
              variant="pixel"
              className="font-game mt-4"
              disabled={
                !issueForm.courseId ||
                !issueForm.learner ||
                !issueForm.trackCollection ||
                !issueForm.credentialName ||
                !issueForm.metadataUri ||
                issuing
              }
              onClick={() =>
                issueCredential({
                  courseId: issueForm.courseId,
                  learner: issueForm.learner,
                  trackCollection: issueForm.trackCollection,
                  credentialName: issueForm.credentialName,
                  metadataUri: issueForm.metadataUri,
                  coursesCompleted: issueForm.coursesCompleted,
                  totalXp: issueForm.totalXp,
                })
              }
            >
              {issuing ? "Issuing…" : "Issue credential"}
            </Button>
          </div>

          <div className="p-4 sm:p-6 rounded-2xl border-4 border-border bg-card">
            <h2 className="font-game text-xl mb-1">Manual upgrade</h2>
            <p className="font-game text-muted-foreground text-sm mb-4">
              Upgrade an existing credential (next course in same track). Use the course ID and
              credential asset from the enrollment that already has the credential.
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label className="font-game">Course (with credential)</Label>
                <Select
                  value={upgradeForm.courseId}
                  onValueChange={(v) => setUpgradeForm((f) => ({ ...f, courseId: v }))}
                >
                  <SelectTrigger className="font-game">
                    <SelectValue placeholder="Select course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courseList.map((acc) => (
                      <SelectItem key={acc.courseId} value={acc.courseId}>
                        {acc.courseId}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="font-game">Learner (pubkey)</Label>
                <Input
                  placeholder="Wallet pubkey"
                  value={upgradeForm.learner}
                  onChange={(e) => setUpgradeForm((f) => ({ ...f, learner: e.target.value }))}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label className="font-game">Credential asset (NFT pubkey)</Label>
                <Input
                  placeholder="Existing credential NFT address"
                  value={upgradeForm.credentialAsset}
                  onChange={(e) =>
                    setUpgradeForm((f) => ({ ...f, credentialAsset: e.target.value }))
                  }
                  className="font-mono text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-game">Track collection</Label>
                <Select
                  value={upgradeForm.trackCollection}
                  onValueChange={(v) => setUpgradeForm((f) => ({ ...f, trackCollection: v }))}
                >
                  <SelectTrigger className="font-game">
                    <SelectValue placeholder="Select collection" />
                  </SelectTrigger>
                  <SelectContent>
                    {trackOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        <div className="flex items-center gap-2">
                          {o.imageUrl ? (
                            <img
                              src={o.imageUrl}
                              alt=""
                              className="h-6 w-6 rounded object-cover shrink-0"
                            />
                          ) : (
                            <div className="h-6 w-6 rounded bg-muted flex items-center justify-center shrink-0">
                              <Award className="h-3.5 w-3.5 text-muted-foreground" />
                            </div>
                          )}
                          <span>{o.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Or paste collection pubkey"
                  value={upgradeForm.trackCollection}
                  onChange={(e) => setUpgradeForm((f) => ({ ...f, trackCollection: e.target.value }))}
                  className="mt-1 font-mono text-sm"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label className="font-game">Credential image</Label>
                <div
                  className="border-2 border-dashed border-border rounded-xl p-4 flex items-center gap-4 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => document.getElementById("upgrade-image-input")?.click()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files[0];
                    if (file?.type.startsWith("image/")) {
                      readFileAsBase64(file).then((base64) =>
                        setUpgradeForm((f) => ({
                          ...f,
                          imageBase64: base64,
                          imageFilename: file.name || "credential-image.png",
                        }))
                      );
                    }
                  }}
                  onDragOver={(e) => e.preventDefault()}
                >
                  <input
                    id="upgrade-image-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        readFileAsBase64(file).then((base64) =>
                          setUpgradeForm((f) => ({
                            ...f,
                            imageBase64: base64,
                            imageFilename: file.name || "credential-image.png",
                          }))
                        );
                      }
                    }}
                  />
                  {upgradeForm.imageBase64 ? (
                    <>
                      <img
                        src={`data:image/png;base64,${upgradeForm.imageBase64}`}
                        alt="Preview"
                        className="h-16 w-16 object-cover rounded-lg border border-border"
                      />
                      <span className="font-game text-sm text-muted-foreground">
                        {upgradeForm.imageFilename} · click or drop to replace
                      </span>
                    </>
                  ) : (
                    <span className="font-game text-sm text-muted-foreground">
                      Drop image or click to select
                    </span>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="font-game">Credential name</Label>
                <Input
                  placeholder="e.g. Track 1 Level 2"
                  value={upgradeForm.credentialName}
                  onChange={(e) => setUpgradeForm((f) => ({ ...f, credentialName: e.target.value }))}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label className="font-game">Metadata URI</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder={PLACEHOLDER_URI || "https://… (metadata URI)"}
                    value={upgradeForm.metadataUri}
                    onChange={(e) => setUpgradeForm((f) => ({ ...f, metadataUri: e.target.value }))}
                    className="font-mono text-sm"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="font-game shrink-0"
                    onClick={() =>
                      handleUploadMetadata(
                        upgradeForm.credentialName || "Credential",
                        {
                          courses_completed: upgradeForm.coursesCompleted,
                          total_xp: upgradeForm.totalXp,
                          course_id: upgradeForm.courseId,
                        },
                        (uri) => setUpgradeForm((f) => ({ ...f, metadataUri: uri })),
                        upgradeForm.imageBase64 || undefined,
                        upgradeForm.imageFilename
                      )
                    }
                  >
                    Upload Pinata
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="font-game">coursesCompleted</Label>
                <Input
                  type="number"
                  min={0}
                  value={upgradeForm.coursesCompleted}
                  onChange={(e) =>
                    setUpgradeForm((f) => ({ ...f, coursesCompleted: +e.target.value || 0 }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label className="font-game">totalXp</Label>
                <Input
                  type="number"
                  min={0}
                  value={upgradeForm.totalXp}
                  onChange={(e) =>
                    setUpgradeForm((f) => ({ ...f, totalXp: +e.target.value || 0 }))
                  }
                />
              </div>
            </div>
            <Button
              variant="pixel"
              className="font-game mt-4"
              disabled={
                !upgradeForm.courseId ||
                !upgradeForm.learner ||
                !upgradeForm.credentialAsset ||
                !upgradeForm.trackCollection ||
                !upgradeForm.credentialName ||
                !upgradeForm.metadataUri ||
                upgrading
              }
              onClick={() =>
                upgradeCredential({
                  courseId: upgradeForm.courseId,
                  learner: upgradeForm.learner,
                  credentialAsset: upgradeForm.credentialAsset,
                  trackCollection: upgradeForm.trackCollection,
                  credentialName: upgradeForm.credentialName,
                  metadataUri: upgradeForm.metadataUri,
                  coursesCompleted: upgradeForm.coursesCompleted,
                  totalXp: upgradeForm.totalXp,
                })
              }
            >
              {upgrading ? "Upgrading…" : "Upgrade credential"}
            </Button>
          </div>
        </>
      )}

      {!canUseCredentials && (
        <div className="p-4 sm:p-6 rounded-2xl border-4 border-border bg-card">
          <p className="font-game text-muted-foreground text-sm">
            Create collection requires authority. Issue credential (manual or for completion) requires backend signer.
          </p>
        </div>
      )}

      <p className="font-game text-sm text-muted-foreground">
        Certificates page uses backend-stored collections when <code className="rounded bg-muted px-1">NEXT_PUBLIC_CREDENTIAL_TRACK_COLLECTIONS</code> is not set.
      </p>
      <p className="font-game text-sm text-muted-foreground">
        Full test playground: <Link href="/test" className="text-yellow-400 hover:underline">/test</Link>
      </p>
    </div>
  );
}
