"use client";

import { Logo } from "@/components/Logo";
import { WalletConnectButton } from "@/components/wallet/WalletConnectButton";
import {
  useConfig,
  useAllCourses,
  useEnrollment,
  useXpBalance,
  useEnroll,
  useCloseEnrollment,
  useCreateCourse,
  useCompleteLesson,
  useFinalizeCourse,
  useUpdateConfig,
  useUpdateCourse,
  useIssueCredential,
  useUpgradeCredential,
  useRegisterMinter,
  useRevokeMinter,
  useRewardXp,
  useCreateAchievementType,
  useAwardAchievement,
  useDeactivateAchievementType,
} from "@/hooks";
import { countCompletedLessons } from "@/lib/lesson-bitmap";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useWallet } from "@solana/wallet-adapter-react";
import { useProgram } from "@/hooks/useProgram";
import { useState } from "react";

function CopyablePubkey({ value }: { value: string }) {
  return (
    <code className="block break-all font-mono text-sm">{value}</code>
  );
}

function ConfigSection() {
  const { data: config, isLoading, error } = useConfig();
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Config</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading config…</p>
        </CardContent>
      </Card>
    );
  }
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Config</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Error: {String(error)}</p>
        </CardContent>
      </Card>
    );
  }
  if (!config) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Config</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No config (connect wallet).</p>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>Config</CardTitle>
        <CardDescription>Singleton program config PDA</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <Label className="text-muted-foreground">Authority</Label>
          <CopyablePubkey value={config.authority.toBase58()} />
        </div>
        <Separator />
        <div>
          <Label className="text-muted-foreground">Backend signer</Label>
          <CopyablePubkey value={config.backendSigner.toBase58()} />
        </div>
        <Separator />
        <div>
          <Label className="text-muted-foreground">XP mint</Label>
          <CopyablePubkey value={config.xpMint.toBase58()} />
        </div>
      </CardContent>
    </Card>
  );
}

function CoursesSection() {
  const { data: courses, isLoading, error } = useAllCourses();
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Courses</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading courses…</p>
        </CardContent>
      </Card>
    );
  }
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Courses</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Error: {String(error)}</p>
        </CardContent>
      </Card>
    );
  }
  if (!courses?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Courses</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No courses.</p>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>Courses</CardTitle>
        <CardDescription>
          All courses ({courses.length}). Course PDA and account details.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Course PDA</TableHead>
              <TableHead>Course ID</TableHead>
              <TableHead>Lessons</TableHead>
              <TableHead>XP/lesson</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {courses.map((c) => {
              const acc = c.account as {
                courseId: string;
                lessonCount: number;
                xpPerLesson: number;
                isActive: boolean;
              };
              return (
                <TableRow key={c.publicKey.toBase58()}>
                  <TableCell className="font-mono text-xs break-all">
                    {c.publicKey.toBase58()}
                  </TableCell>
                  <TableCell className="font-mono">{acc.courseId}</TableCell>
                  <TableCell>{acc.lessonCount}</TableCell>
                  <TableCell>{acc.xpPerLesson}</TableCell>
                  <TableCell>
                    {acc.isActive ? (
                      <Badge variant="default">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function EnrollmentRow({
  courseId,
  lessonCount,
}: {
  courseId: string;
  lessonCount: number;
}) {
  const { data: enrollment, isLoading } = useEnrollment(courseId);
  const { mutate: closeEnrollment, isPending: closing } = useCloseEnrollment();
  if (isLoading) {
    return (
      <TableRow>
        <TableCell className="font-mono">{courseId}</TableCell>
        <TableCell colSpan={4}>Loading…</TableCell>
      </TableRow>
    );
  }
  if (!enrollment) {
    return (
      <TableRow>
        <TableCell className="font-mono">{courseId}</TableCell>
        <TableCell colSpan={4}>—</TableCell>
      </TableRow>
    );
  }
  const acc = enrollment as {
    lessonFlags?: unknown[];
    completedAt?: unknown;
    credentialAsset?: unknown;
  };
  const flags = acc.lessonFlags;
  const completed = flags ? countCompletedLessons(flags) : 0;
  const done = acc.completedAt != null;
  return (
    <TableRow>
      <TableCell className="font-mono">{courseId}</TableCell>
      <TableCell>
        {completed}/{lessonCount}
      </TableCell>
      <TableCell>{done ? "Yes" : "No"}</TableCell>
      <TableCell>{acc.credentialAsset ? "Yes" : "—"}</TableCell>
      <TableCell>
        <Button
          size="sm"
          variant="outline"
          disabled={closing}
          onClick={() => closeEnrollment({ courseId })}
        >
          {closing ? "Closing…" : "Close"}
        </Button>
      </TableCell>
    </TableRow>
  );
}

function LearnerSection() {
  const { publicKey } = useWallet();
  const { data: courses } = useAllCourses();
  const { data: xp } = useXpBalance();
  const { mutate: enroll, isPending: enrolling } = useEnroll();
  const [courseId, setCourseId] = useState("");
  const program = useProgram();

  if (!publicKey || !program) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Learner</CardTitle>
          <CardDescription>Wallet-signed actions</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Connect wallet for learner actions.
          </p>
        </CardContent>
      </Card>
    );
  }

  const courseOptions = courses ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Learner</CardTitle>
        <CardDescription>
          Enroll and close enrollment. Your wallet signs transactions.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>XP balance</Label>
          <p className="font-mono text-lg">{xp ?? "…"}</p>
        </div>
        <Separator />
        <div className="space-y-2">
          <p className="text-muted-foreground text-sm">
            Enroll creates an Enrollment PDA for your wallet. Required before the backend can complete lessons for you. Checks prerequisite if course has one.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-2 min-w-[200px]">
            <Label htmlFor="enroll-course">Course to enroll</Label>
            <Select value={courseId} onValueChange={setCourseId}>
              <SelectTrigger id="enroll-course" className="w-full">
                <SelectValue placeholder="Select course" />
              </SelectTrigger>
              <SelectContent>
                {courseOptions.map((c) => {
                  const acc = c.account as { courseId: string };
                  return (
                    <SelectItem key={acc.courseId} value={acc.courseId}>
                      {acc.courseId}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <Button
            disabled={!courseId || enrolling}
            onClick={() => courseId && enroll({ courseId })}
          >
            {enrolling ? "Enrolling…" : "Enroll"}
          </Button>
        </div>
        <Separator />
        <div className="space-y-2">
          <Label>My enrollments</Label>
          <p className="text-muted-foreground text-sm">
            Close reclaims rent from Enrollment PDA. Completed courses close immediately; incomplete courses require 24h cooldown after enroll.
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Course</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Finalized</TableHead>
                <TableHead>Credential</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courseOptions.map((c) => {
                const acc = c.account as {
                  courseId: string;
                  lessonCount: number;
                };
                return (
                  <EnrollmentRow
                    key={acc.courseId}
                    courseId={acc.courseId}
                    lessonCount={acc.lessonCount}
                  />
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function AdminApiSection() {
  const [createRes, setCreateRes] = useState<string | null>(null);
  const [completeRes, setCompleteRes] = useState<string | null>(null);
  const [finalizeRes, setFinalizeRes] = useState<string | null>(null);
  const [updateConfigRes, setUpdateConfigRes] = useState<string | null>(null);
  const [updateCourseRes, setUpdateCourseRes] = useState<string | null>(null);
  const [issueCredRes, setIssueCredRes] = useState<string | null>(null);
  const [upgradeCredRes, setUpgradeCredRes] = useState<string | null>(null);
  const [registerMinterRes, setRegisterMinterRes] = useState<string | null>(null);
  const [revokeMinterRes, setRevokeMinterRes] = useState<string | null>(null);
  const [rewardXpRes, setRewardXpRes] = useState<string | null>(null);
  const [createAchievementRes, setCreateAchievementRes] =
    useState<string | null>(null);
  const [awardAchievementRes, setAwardAchievementRes] =
    useState<string | null>(null);
  const [deactivateAchievementRes, setDeactivateAchievementRes] =
    useState<string | null>(null);
  const [createForm, setCreateForm] = useState({
    courseId: "test-course-1",
    lessonCount: 3,
    xpPerLesson: 100,
  });
  const [completeForm, setCompleteForm] = useState({
    courseId: "test-course-1",
    learner: "",
    lessonIndex: 0,
  });
  const [finalizeForm, setFinalizeForm] = useState({
    courseId: "test-course-1",
    learner: "",
  });
  const [adminForm, setAdminForm] = useState({
    updateConfig: { newBackendSigner: "" },
    updateCourse: {
      courseId: "test-course-1",
      newIsActive: null as boolean | null,
      newXpPerLesson: null as number | null,
    },
    issueCredential: {
      courseId: "test-course-1",
      learner: "",
      credentialName: "Anchor Track Level 1",
      metadataUri: "https://arweave.net/placeholder",
      coursesCompleted: 1,
      totalXp: 0,
      trackCollection: "",
    },
    upgradeCredential: {
      courseId: "test-course-1",
      learner: "",
      credentialAsset: "",
      credentialName: "",
      metadataUri: "",
      coursesCompleted: 1,
      totalXp: 0,
      trackCollection: "",
    },
    registerMinter: { minter: "", label: "custom", maxXpPerCall: 0 },
    revokeMinter: { minter: "" },
    rewardXp: { recipient: "", amount: 100, memo: "" },
    createAchievementType: {
      achievementId: "hackathon-winner",
      name: "Hackathon Winner",
      metadataUri: "https://arweave.net/placeholder",
      maxSupply: 0,
      xpReward: 500,
    },
    awardAchievement: {
      achievementId: "hackathon-winner",
      recipient: "",
      collection: "",
    },
    deactivateAchievementType: { achievementId: "hackathon-winner" },
  });
  const { publicKey } = useWallet();
  const { mutateAsync: createCourse, isPending: creating } = useCreateCourse();
  const { mutateAsync: completeLesson, isPending: completing } =
    useCompleteLesson();
  const { mutateAsync: finalizeCourse, isPending: finalizing } =
    useFinalizeCourse();
  const { mutateAsync: updateConfig, isPending: updatingConfig } =
    useUpdateConfig();
  const { mutateAsync: updateCourse, isPending: updatingCourse } =
    useUpdateCourse();
  const { mutateAsync: issueCredential, isPending: issuingCred } =
    useIssueCredential();
  const { mutateAsync: upgradeCredential, isPending: upgradingCred } =
    useUpgradeCredential();
  const { mutateAsync: registerMinter, isPending: registeringMinter } =
    useRegisterMinter();
  const { mutateAsync: revokeMinter, isPending: revokingMinter } =
    useRevokeMinter();
  const { mutateAsync: rewardXp, isPending: rewardingXp } = useRewardXp();
  const { mutateAsync: createAchievementType, isPending: creatingAchievement } =
    useCreateAchievementType();
  const { mutateAsync: awardAchievement, isPending: awardingAchievement } =
    useAwardAchievement();
  const {
    mutateAsync: deactivateAchievementType,
    isPending: deactivatingAchievement,
  } = useDeactivateAchievementType();

  const handleCreate = async () => {
    setCreateRes(null);
    try {
      const tx = await createCourse(createForm);
      setCreateRes(`OK: ${tx}`);
    } catch (e) {
      setCreateRes(`Error: ${(e as Error).message}`);
    }
  };
  const handleComplete = async () => {
    setCompleteRes(null);
    const learner = (completeForm.learner || publicKey?.toBase58()) ?? "";
    try {
      const tx = await completeLesson({ ...completeForm, learner });
      setCompleteRes(`OK: ${tx}`);
    } catch (e) {
      setCompleteRes(`Error: ${(e as Error).message}`);
    }
  };
  const handleFinalize = async () => {
    setFinalizeRes(null);
    const learner = (finalizeForm.learner || publicKey?.toBase58()) ?? "";
    try {
      const tx = await finalizeCourse({ ...finalizeForm, learner });
      setFinalizeRes(`OK: ${tx}`);
    } catch (e) {
      setFinalizeRes(`Error: ${(e as Error).message}`);
    }
  };
  const handleUpdateConfig = async () => {
    setUpdateConfigRes(null);
    try {
      const tx = await updateConfig(adminForm.updateConfig);
      setUpdateConfigRes(`OK: ${tx}`);
    } catch (e) {
      setUpdateConfigRes(`Error: ${(e as Error).message}`);
    }
  };
  const handleUpdateCourse = async () => {
    setUpdateCourseRes(null);
    const params: Record<string, unknown> = {
      courseId: adminForm.updateCourse.courseId,
    };
    if (adminForm.updateCourse.newIsActive != null)
      params.newIsActive = adminForm.updateCourse.newIsActive;
    const xp = adminForm.updateCourse.newXpPerLesson;
    if (xp != null && !Number.isNaN(xp) && xp >= 0)
      params.newXpPerLesson = xp;
    try {
      const tx = await updateCourse(params);
      setUpdateCourseRes(`OK: ${tx}`);
    } catch (e) {
      setUpdateCourseRes(`Error: ${(e as Error).message}`);
    }
  };
  const handleIssueCredential = async () => {
    setIssueCredRes(null);
    const learner =
      adminForm.issueCredential.learner || publicKey?.toBase58() || "";
    try {
      const result = await issueCredential({
        ...adminForm.issueCredential,
        learner,
      });
      setIssueCredRes(
        `OK: ${result.tx}${result.credentialAsset ? ` | asset: ${result.credentialAsset}` : ""}`
      );
    } catch (e) {
      setIssueCredRes(`Error: ${(e as Error).message}`);
    }
  };
  const handleUpgradeCredential = async () => {
    setUpgradeCredRes(null);
    const learner =
      adminForm.upgradeCredential.learner || publicKey?.toBase58() || "";
    try {
      const tx = await upgradeCredential({
        ...adminForm.upgradeCredential,
        learner,
      });
      setUpgradeCredRes(`OK: ${tx}`);
    } catch (e) {
      setUpgradeCredRes(`Error: ${(e as Error).message}`);
    }
  };
  const handleRegisterMinter = async () => {
    setRegisterMinterRes(null);
    try {
      const tx = await registerMinter(adminForm.registerMinter);
      setRegisterMinterRes(`OK: ${tx}`);
    } catch (e) {
      setRegisterMinterRes(`Error: ${(e as Error).message}`);
    }
  };
  const handleRevokeMinter = async () => {
    setRevokeMinterRes(null);
    try {
      const tx = await revokeMinter(adminForm.revokeMinter);
      setRevokeMinterRes(`OK: ${tx}`);
    } catch (e) {
      setRevokeMinterRes(`Error: ${(e as Error).message}`);
    }
  };
  const handleRewardXp = async () => {
    setRewardXpRes(null);
    try {
      const tx = await rewardXp(adminForm.rewardXp);
      setRewardXpRes(`OK: ${tx}`);
    } catch (e) {
      setRewardXpRes(`Error: ${(e as Error).message}`);
    }
  };
  const handleCreateAchievementType = async () => {
    setCreateAchievementRes(null);
    try {
      const result = await createAchievementType(adminForm.createAchievementType);
      setCreateAchievementRes(
        `OK: ${result.tx}${result.collection ? ` | collection: ${result.collection}` : ""}`
      );
    } catch (e) {
      setCreateAchievementRes(`Error: ${(e as Error).message}`);
    }
  };
  const handleAwardAchievement = async () => {
    setAwardAchievementRes(null);
    try {
      const result = await awardAchievement(adminForm.awardAchievement);
      setAwardAchievementRes(
        `OK: ${result.tx}${result.asset ? ` | asset: ${result.asset}` : ""}`
      );
    } catch (e) {
      setAwardAchievementRes(`Error: ${(e as Error).message}`);
    }
  };
  const handleDeactivateAchievementType = async () => {
    setDeactivateAchievementRes(null);
    try {
      const tx = await deactivateAchievementType(
        adminForm.deactivateAchievementType
      );
      setDeactivateAchievementRes(`OK: ${tx}`);
    } catch (e) {
      setDeactivateAchievementRes(`Error: ${(e as Error).message}`);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Admin / Backend (API)</CardTitle>
        <CardDescription>
          Backend-signed transactions. Requires NEXT_PUBLIC_BACKEND_URL and backend
          with ACADEMY_AUTHORITY_KEYPAIR and ACADEMY_BACKEND_SIGNER_KEYPAIR.
          Use courseId from create-course (e.g. test-course-1).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="space-y-4">
          <div>
            <Label className="text-base font-semibold">Update config (admin)</Label>
            <p className="text-muted-foreground text-sm mt-0.5">
              Rotates the backend signer. Use after deploying a new keypair; the new signer will be used for complete_lesson, finalize_course, issue_credential, upgrade_credential.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2 min-w-[340px]">
              <Label htmlFor="update-config-signer">newBackendSigner (pubkey)</Label>
              <Input
                id="update-config-signer"
                placeholder="new backend signer pubkey"
                value={adminForm.updateConfig.newBackendSigner}
                onChange={(e) =>
                  setAdminForm((f) => ({
                    ...f,
                    updateConfig: {
                      ...f.updateConfig,
                      newBackendSigner: e.target.value,
                    },
                  }))
                }
              />
            </div>
            <Button
              size="sm"
              onClick={handleUpdateConfig}
              disabled={updatingConfig}
            >
              {updatingConfig ? "Updating…" : "Update config"}
            </Button>
          </div>
          {updateConfigRes && (
            <p className="font-mono text-sm break-all">{updateConfigRes}</p>
          )}
        </div>

        <Separator />

        <div className="space-y-4">
          <div>
            <Label className="text-base font-semibold">Create course</Label>
            <p className="text-muted-foreground text-sm mt-0.5">
              Registers a new course PDA on-chain. Sets lesson count, XP per lesson, and creator. Must exist before learners can enroll.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="create-courseId">courseId</Label>
              <Input
                id="create-courseId"
                placeholder="courseId"
                value={createForm.courseId}
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, courseId: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-lessonCount">lessonCount</Label>
              <Input
                id="create-lessonCount"
                type="number"
                placeholder="lessonCount"
                className="w-24"
                value={createForm.lessonCount}
                onChange={(e) =>
                  setCreateForm((f) => ({
                    ...f,
                    lessonCount: +e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-xpPerLesson">xpPerLesson</Label>
              <Input
                id="create-xpPerLesson"
                type="number"
                placeholder="xpPerLesson"
                className="w-24"
                value={createForm.xpPerLesson}
                onChange={(e) =>
                  setCreateForm((f) => ({
                    ...f,
                    xpPerLesson: +e.target.value,
                  }))
                }
              />
            </div>
            <Button size="sm" onClick={handleCreate} disabled={creating}>
              {creating ? "Creating…" : "Create"}
            </Button>
          </div>
          {createRes && (
            <p className="font-mono text-sm break-all">{createRes}</p>
          )}
        </div>

        <Separator />

        <div className="space-y-4">
          <div>
            <Label className="text-base font-semibold">Complete lesson</Label>
            <p className="text-muted-foreground text-sm mt-0.5">
              Marks one lesson complete for a learner and mints XP. Learner must be enrolled first. Backend signer required (anti-cheat).
            </p>
          </div>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="complete-courseId">courseId</Label>
              <Input
                id="complete-courseId"
                placeholder="courseId"
                value={completeForm.courseId}
                onChange={(e) =>
                  setCompleteForm((f) => ({ ...f, courseId: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2 min-w-[280px]">
              <Label htmlFor="complete-learner">learner (or leave blank for connected)</Label>
              <Input
                id="complete-learner"
                placeholder="learner pubkey"
                value={completeForm.learner}
                onChange={(e) =>
                  setCompleteForm((f) => ({ ...f, learner: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="complete-lessonIndex">lessonIndex</Label>
              <Input
                id="complete-lessonIndex"
                type="number"
                placeholder="0"
                className="w-24"
                value={completeForm.lessonIndex}
                onChange={(e) =>
                  setCompleteForm((f) => ({
                    ...f,
                    lessonIndex: +e.target.value,
                  }))
                }
              />
            </div>
            <Button size="sm" onClick={handleComplete} disabled={completing}>
              {completing ? "Completing…" : "Complete"}
            </Button>
          </div>
          {completeRes && (
            <p className="font-mono text-sm break-all">{completeRes}</p>
          )}
        </div>

        <Separator />

        <div className="space-y-4">
          <div>
            <Label className="text-base font-semibold">Finalize course</Label>
            <p className="text-muted-foreground text-sm mt-0.5">
              Call when learner has completed all lessons. Mints 50% bonus XP to learner, creator reward (if threshold met), sets completed_at. Required before issue_credential.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="finalize-courseId">courseId</Label>
              <Input
                id="finalize-courseId"
                placeholder="courseId"
                value={finalizeForm.courseId}
                onChange={(e) =>
                  setFinalizeForm((f) => ({ ...f, courseId: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2 min-w-[280px]">
              <Label htmlFor="finalize-learner">learner (or leave blank for connected)</Label>
              <Input
                id="finalize-learner"
                placeholder="learner pubkey"
                value={finalizeForm.learner}
                onChange={(e) =>
                  setFinalizeForm((f) => ({ ...f, learner: e.target.value }))
                }
              />
            </div>
            <Button size="sm" onClick={handleFinalize} disabled={finalizing}>
              {finalizing ? "Finalizing…" : "Finalize"}
            </Button>
          </div>
          {finalizeRes && (
            <p className="font-mono text-sm break-all">{finalizeRes}</p>
          )}
        </div>

        <Separator />

        <div className="space-y-4">
          <div>
            <Label className="text-base font-semibold">Update course</Label>
            <p className="text-muted-foreground text-sm mt-0.5">
              Changes course fields (isActive, xpPerLesson, etc). Authority only. Leave a field empty to skip updating it.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2">
              <Label>courseId</Label>
              <Input
                placeholder="courseId"
                value={adminForm.updateCourse.courseId}
                onChange={(e) =>
                  setAdminForm((f) => ({
                    ...f,
                    updateCourse: {
                      ...f.updateCourse,
                      courseId: e.target.value,
                    },
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>newIsActive</Label>
              <Select
                value={
                  adminForm.updateCourse.newIsActive == null
                    ? "skip"
                    : String(adminForm.updateCourse.newIsActive)
                }
                onValueChange={(v) =>
                  setAdminForm((f) => ({
                    ...f,
                    updateCourse: {
                      ...f.updateCourse,
                      newIsActive:
                        v === "skip" ? null : v === "true",
                    },
                  }))
                }
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Skip (leave unchanged)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="skip">Skip (leave unchanged)</SelectItem>
                  <SelectItem value="true">true</SelectItem>
                  <SelectItem value="false">false</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>newXpPerLesson</Label>
              <Input
                type="number"
                placeholder="e.g. 150"
                value={
                  adminForm.updateCourse.newXpPerLesson ?? ""
                }
                onChange={(e) => {
                  const v = e.target.value;
                  const n = v === "" ? null : +v;
                  setAdminForm((f) => ({
                    ...f,
                    updateCourse: {
                      ...f.updateCourse,
                      newXpPerLesson:
                        n === null || Number.isNaN(n) || n < 0 ? null : n,
                    },
                  }));
                }}
              />
            </div>
            <Button
              size="sm"
              onClick={handleUpdateCourse}
              disabled={updatingCourse}
            >
              {updatingCourse ? "Updating…" : "Update course"}
            </Button>
          </div>
          {updateCourseRes && (
            <p className="font-mono text-sm break-all">{updateCourseRes}</p>
          )}
        </div>

        <Separator />

        <div className="space-y-4">
          <div>
            <Label className="text-base font-semibold">Issue credential</Label>
            <p className="text-muted-foreground text-sm mt-0.5">
              Creates a soulbound Metaplex Core credential NFT for the learner. Requires finalize_course first. trackCollection = Metaplex Core collection pubkey (from create-mock-track or create_achievement_type).
            </p>
          </div>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2 min-w-[200px]">
              <Label>courseId</Label>
              <Input
                value={adminForm.issueCredential.courseId}
                onChange={(e) =>
                  setAdminForm((f) => ({
                    ...f,
                    issueCredential: {
                      ...f.issueCredential,
                      courseId: e.target.value,
                    },
                  }))
                }
              />
            </div>
            <div className="space-y-2 min-w-[280px]">
              <Label>learner</Label>
              <Input
                placeholder="or leave blank for connected"
                value={adminForm.issueCredential.learner}
                onChange={(e) =>
                  setAdminForm((f) => ({
                    ...f,
                    issueCredential: {
                      ...f.issueCredential,
                      learner: e.target.value,
                    },
                  }))
                }
              />
            </div>
            <div className="space-y-2 min-w-[200px]">
              <Label>credentialName</Label>
              <Input
                value={adminForm.issueCredential.credentialName}
                onChange={(e) =>
                  setAdminForm((f) => ({
                    ...f,
                    issueCredential: {
                      ...f.issueCredential,
                      credentialName: e.target.value,
                    },
                  }))
                }
              />
            </div>
            <div className="space-y-2 min-w-[280px]">
              <Label>metadataUri</Label>
              <Input
                value={adminForm.issueCredential.metadataUri}
                onChange={(e) =>
                  setAdminForm((f) => ({
                    ...f,
                    issueCredential: {
                      ...f.issueCredential,
                      metadataUri: e.target.value,
                    },
                  }))
                }
              />
            </div>
            <div className="space-y-2 min-w-[340px]">
              <Label>trackCollection (pubkey)</Label>
              <Input
                placeholder="track collection pubkey"
                value={adminForm.issueCredential.trackCollection}
                onChange={(e) =>
                  setAdminForm((f) => ({
                    ...f,
                    issueCredential: {
                      ...f.issueCredential,
                      trackCollection: e.target.value,
                    },
                  }))
                }
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2 min-w-[140px] shrink-0">
              <Label>coursesCompleted</Label>
              <Input
                type="number"
                className="w-24"
                value={adminForm.issueCredential.coursesCompleted}
                onChange={(e) =>
                  setAdminForm((f) => ({
                    ...f,
                    issueCredential: {
                      ...f.issueCredential,
                      coursesCompleted: +e.target.value,
                    },
                  }))
                }
              />
            </div>
            <div className="space-y-2 min-w-[80px] shrink-0">
              <Label>totalXp</Label>
              <Input
                type="number"
                className="w-24"
                value={adminForm.issueCredential.totalXp}
                onChange={(e) =>
                  setAdminForm((f) => ({
                    ...f,
                    issueCredential: {
                      ...f.issueCredential,
                      totalXp: +e.target.value,
                    },
                  }))
                }
              />
            </div>
            <Button size="sm" onClick={handleIssueCredential} disabled={issuingCred}>
              {issuingCred ? "Issuing…" : "Issue credential"}
            </Button>
          </div>
          {issueCredRes && (
            <p className="font-mono text-sm break-all">{issueCredRes}</p>
          )}
        </div>

        <Separator />

        <div className="space-y-4">
          <div>
            <Label className="text-base font-semibold">Upgrade credential</Label>
            <p className="text-muted-foreground text-sm mt-0.5">
              Updates an existing credential NFT (name, URI, attributes). Use when learner completes another course in the same track. credentialAsset = existing NFT pubkey.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2 min-w-[200px]">
              <Label>courseId</Label>
              <Input
                value={adminForm.upgradeCredential.courseId}
                onChange={(e) =>
                  setAdminForm((f) => ({
                    ...f,
                    upgradeCredential: {
                      ...f.upgradeCredential,
                      courseId: e.target.value,
                    },
                  }))
                }
              />
            </div>
            <div className="space-y-2 min-w-[280px]">
              <Label>learner</Label>
              <Input
                placeholder="or leave blank"
                value={adminForm.upgradeCredential.learner}
                onChange={(e) =>
                  setAdminForm((f) => ({
                    ...f,
                    upgradeCredential: {
                      ...f.upgradeCredential,
                      learner: e.target.value,
                    },
                  }))
                }
              />
            </div>
            <div className="space-y-2 min-w-[340px]">
              <Label>credentialAsset</Label>
              <Input
                placeholder="existing credential NFT pubkey"
                value={adminForm.upgradeCredential.credentialAsset}
                onChange={(e) =>
                  setAdminForm((f) => ({
                    ...f,
                    upgradeCredential: {
                      ...f.upgradeCredential,
                      credentialAsset: e.target.value,
                    },
                  }))
                }
              />
            </div>
            <div className="space-y-2 min-w-[200px]">
              <Label>credentialName</Label>
              <Input
                value={adminForm.upgradeCredential.credentialName}
                onChange={(e) =>
                  setAdminForm((f) => ({
                    ...f,
                    upgradeCredential: {
                      ...f.upgradeCredential,
                      credentialName: e.target.value,
                    },
                  }))
                }
              />
            </div>
            <div className="space-y-2 min-w-[280px]">
              <Label>metadataUri</Label>
              <Input
                value={adminForm.upgradeCredential.metadataUri}
                onChange={(e) =>
                  setAdminForm((f) => ({
                    ...f,
                    upgradeCredential: {
                      ...f.upgradeCredential,
                      metadataUri: e.target.value,
                    },
                  }))
                }
              />
            </div>
            <div className="space-y-2 min-w-[340px]">
              <Label>trackCollection</Label>
              <Input
                value={adminForm.upgradeCredential.trackCollection}
                onChange={(e) =>
                  setAdminForm((f) => ({
                    ...f,
                    upgradeCredential: {
                      ...f.upgradeCredential,
                      trackCollection: e.target.value,
                    },
                  }))
                }
              />
            </div>
            <Button size="sm" onClick={handleUpgradeCredential} disabled={upgradingCred}>
              {upgradingCred ? "Upgrading…" : "Upgrade credential"}
            </Button>
          </div>
          {upgradeCredRes && (
            <p className="font-mono text-sm break-all">{upgradeCredRes}</p>
          )}
        </div>

        <Separator />

        <div className="space-y-4">
          <div>
            <Label className="text-base font-semibold">Register minter</Label>
            <p className="text-muted-foreground text-sm mt-0.5">
              Registers a wallet as an XP minter. Minters can call reward_xp and award_achievement. maxXpPerCall: 0 = unlimited.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2 min-w-[280px]">
              <Label>minter (pubkey)</Label>
              <Input
                placeholder="minter pubkey"
                value={adminForm.registerMinter.minter}
                onChange={(e) =>
                  setAdminForm((f) => ({
                    ...f,
                    registerMinter: {
                      ...f.registerMinter,
                      minter: e.target.value,
                    },
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>label</Label>
              <Input
                value={adminForm.registerMinter.label}
                onChange={(e) =>
                  setAdminForm((f) => ({
                    ...f,
                    registerMinter: {
                      ...f.registerMinter,
                      label: e.target.value,
                    },
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>maxXpPerCall (0=unlimited)</Label>
              <Input
                type="number"
                className="w-32"
                value={adminForm.registerMinter.maxXpPerCall}
                onChange={(e) =>
                  setAdminForm((f) => ({
                    ...f,
                    registerMinter: {
                      ...f.registerMinter,
                      maxXpPerCall: +e.target.value,
                    },
                  }))
                }
              />
            </div>
            <Button
              size="sm"
              onClick={handleRegisterMinter}
              disabled={registeringMinter}
            >
              {registeringMinter ? "Registering…" : "Register minter"}
            </Button>
          </div>
          {registerMinterRes && (
            <p className="font-mono text-sm break-all">{registerMinterRes}</p>
          )}
        </div>

        <Separator />

        <div className="space-y-4">
          <div>
            <Label className="text-base font-semibold">Revoke minter</Label>
            <p className="text-muted-foreground text-sm mt-0.5">
              Closes the MinterRole PDA and reclaims rent to authority. Revoked minter can no longer call reward_xp or award_achievement.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2 min-w-[280px]">
              <Label>minter (pubkey)</Label>
              <Input
                placeholder="minter pubkey"
                value={adminForm.revokeMinter.minter}
                onChange={(e) =>
                  setAdminForm((f) => ({
                    ...f,
                    revokeMinter: { ...f.revokeMinter, minter: e.target.value },
                  }))
                }
              />
            </div>
            <Button
              size="sm"
              onClick={handleRevokeMinter}
              disabled={revokingMinter}
            >
              {revokingMinter ? "Revoking…" : "Revoke minter"}
            </Button>
          </div>
          {revokeMinterRes && (
            <p className="font-mono text-sm break-all">{revokeMinterRes}</p>
          )}
        </div>

        <Separator />

        <div className="space-y-4">
          <div>
            <Label className="text-base font-semibold">Reward XP</Label>
            <p className="text-muted-foreground text-sm mt-0.5">
              Mints arbitrary XP to a recipient. Requires backend signer to be a registered minter (auto-registered at initialize). Used for community events, etc.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2 min-w-[280px]">
              <Label>recipient (pubkey)</Label>
              <Input
                placeholder="recipient pubkey"
                value={adminForm.rewardXp.recipient}
                onChange={(e) =>
                  setAdminForm((f) => ({
                    ...f,
                    rewardXp: { ...f.rewardXp, recipient: e.target.value },
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>amount</Label>
              <Input
                type="number"
                className="w-24"
                value={adminForm.rewardXp.amount}
                onChange={(e) =>
                  setAdminForm((f) => ({
                    ...f,
                    rewardXp: { ...f.rewardXp, amount: +e.target.value },
                  }))
                }
              />
            </div>
            <div className="space-y-2 min-w-[200px]">
              <Label>memo</Label>
              <Input
                placeholder="optional memo"
                value={adminForm.rewardXp.memo}
                onChange={(e) =>
                  setAdminForm((f) => ({
                    ...f,
                    rewardXp: { ...f.rewardXp, memo: e.target.value },
                  }))
                }
              />
            </div>
            <Button size="sm" onClick={handleRewardXp} disabled={rewardingXp}>
              {rewardingXp ? "Rewarding…" : "Reward XP"}
            </Button>
          </div>
          {rewardXpRes && (
            <p className="font-mono text-sm break-all">{rewardXpRes}</p>
          )}
        </div>

        <Separator />

        <div className="space-y-4">
          <div>
            <Label className="text-base font-semibold">Create achievement type</Label>
            <p className="text-muted-foreground text-sm mt-0.5">
              Defines an achievement badge (e.g. hackathon-winner). Creates Metaplex Core collection. maxSupply: 0 = unlimited. xpReward &gt; 0 required.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2 min-w-[200px]">
              <Label>achievementId</Label>
              <Input
                value={adminForm.createAchievementType.achievementId}
                onChange={(e) =>
                  setAdminForm((f) => ({
                    ...f,
                    createAchievementType: {
                      ...f.createAchievementType,
                      achievementId: e.target.value,
                    },
                  }))
                }
              />
            </div>
            <div className="space-y-2 min-w-[200px]">
              <Label>name</Label>
              <Input
                value={adminForm.createAchievementType.name}
                onChange={(e) =>
                  setAdminForm((f) => ({
                    ...f,
                    createAchievementType: {
                      ...f.createAchievementType,
                      name: e.target.value,
                    },
                  }))
                }
              />
            </div>
            <div className="space-y-2 min-w-[280px]">
              <Label>metadataUri</Label>
              <Input
                value={adminForm.createAchievementType.metadataUri}
                onChange={(e) =>
                  setAdminForm((f) => ({
                    ...f,
                    createAchievementType: {
                      ...f.createAchievementType,
                      metadataUri: e.target.value,
                    },
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>maxSupply (0=unlimited)</Label>
              <Input
                type="number"
                className="w-24"
                value={adminForm.createAchievementType.maxSupply}
                onChange={(e) =>
                  setAdminForm((f) => ({
                    ...f,
                    createAchievementType: {
                      ...f.createAchievementType,
                      maxSupply: +e.target.value,
                    },
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>xpReward</Label>
              <Input
                type="number"
                className="w-24"
                value={adminForm.createAchievementType.xpReward}
                onChange={(e) =>
                  setAdminForm((f) => ({
                    ...f,
                    createAchievementType: {
                      ...f.createAchievementType,
                      xpReward: +e.target.value,
                    },
                  }))
                }
              />
            </div>
            <Button
              size="sm"
              onClick={handleCreateAchievementType}
              disabled={creatingAchievement}
            >
              {creatingAchievement ? "Creating…" : "Create achievement type"}
            </Button>
          </div>
          {createAchievementRes && (
            <p className="font-mono text-sm break-all">{createAchievementRes}</p>
          )}
        </div>

        <Separator />

        <div className="space-y-4">
          <div>
            <Label className="text-base font-semibold">Award achievement</Label>
            <p className="text-muted-foreground text-sm mt-0.5">
              Mints achievement NFT + XP reward to recipient. Requires registered minter (backend signer is auto-registered). collection = achievement type collection pubkey.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2 min-w-[200px]">
              <Label>achievementId</Label>
              <Input
                value={adminForm.awardAchievement.achievementId}
                onChange={(e) =>
                  setAdminForm((f) => ({
                    ...f,
                    awardAchievement: {
                      ...f.awardAchievement,
                      achievementId: e.target.value,
                    },
                  }))
                }
              />
            </div>
            <div className="space-y-2 min-w-[280px]">
              <Label>recipient (pubkey)</Label>
              <Input
                placeholder="recipient pubkey"
                value={adminForm.awardAchievement.recipient}
                onChange={(e) =>
                  setAdminForm((f) => ({
                    ...f,
                    awardAchievement: {
                      ...f.awardAchievement,
                      recipient: e.target.value,
                    },
                  }))
                }
              />
            </div>
            <div className="space-y-2 min-w-[340px]">
              <Label>collection (pubkey)</Label>
              <Input
                placeholder="achievement type collection pubkey"
                value={adminForm.awardAchievement.collection}
                onChange={(e) =>
                  setAdminForm((f) => ({
                    ...f,
                    awardAchievement: {
                      ...f.awardAchievement,
                      collection: e.target.value,
                    },
                  }))
                }
              />
            </div>
            <Button
              size="sm"
              onClick={handleAwardAchievement}
              disabled={awardingAchievement}
            >
              {awardingAchievement ? "Awarding…" : "Award achievement"}
            </Button>
          </div>
          {awardAchievementRes && (
            <p className="font-mono text-sm break-all">{awardAchievementRes}</p>
          )}
        </div>

        <Separator />

        <div className="space-y-4">
          <div>
            <Label className="text-base font-semibold">
              Deactivate achievement type
            </Label>
            <p className="text-muted-foreground text-sm mt-0.5">
              Disables future awards for this achievement. Existing recipients keep their NFTs. Authority only.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2 min-w-[200px]">
              <Label>achievementId</Label>
              <Input
                value={adminForm.deactivateAchievementType.achievementId}
                onChange={(e) =>
                  setAdminForm((f) => ({
                    ...f,
                    deactivateAchievementType: {
                      ...f.deactivateAchievementType,
                      achievementId: e.target.value,
                    },
                  }))
                }
              />
            </div>
            <Button
              size="sm"
              onClick={handleDeactivateAchievementType}
              disabled={deactivatingAchievement}
            >
              {deactivatingAchievement ? "Deactivating…" : "Deactivate"}
            </Button>
          </div>
          {deactivateAchievementRes && (
            <p className="font-mono text-sm break-all">
              {deactivateAchievementRes}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function TestPage() {
  const { connected, publicKey } = useWallet();
  const program = useProgram();
  const programId = program?.programId ?? null;

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-6">
          <Logo />
          <Badge variant="outline">/test</Badge>
        </div>
        <WalletConnectButton />
      </header>
      <main className="mx-auto max-w-5xl space-y-8 p-6">
        <Card>
          <CardHeader>
            <CardTitle>Academy Test</CardTitle>
            <CardDescription>
              Devnet test page. All instructions and data.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-muted-foreground">Program ID</Label>
              <CopyablePubkey
                value={programId?.toBase58() ?? "—"}
              />
            </div>
            <Separator />
            <div>
              <Label className="text-muted-foreground">Wallet</Label>
              <p className="font-mono text-sm">
                {connected && publicKey
                  ? publicKey.toBase58()
                  : "Disconnected"}
              </p>
            </div>
          </CardContent>
        </Card>

        <ConfigSection />
        <CoursesSection />
        <LearnerSection />
        <AdminApiSection />
      </main>
    </div>
  );
}
