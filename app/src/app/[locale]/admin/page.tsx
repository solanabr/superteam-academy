"use client";

import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from "recharts";
import {
  Users,
  BookOpen,
  TrendingUp,
  BarChart3,
  Shield,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Check,
  X,
  Archive,
  Flame,
  Copy,
  Pencil,
  Eye,
  Loader2,
} from "lucide-react";
import { SUBMISSION_STATUS, COURSE_ACTIONS } from "@/types/course";
import { Link } from "@/i18n/routing";
import { toast } from "sonner";

// ── Types ───────────────────────────────────────────────────────────────────

interface Stats {
  totalUsers: number;
  activeLast7d: number;
  newUsersLast7d: number;
  totalXpDistributed: number;
  totalCourses: number;
}

interface AdminUser {
  id: string;
  display_name: string | null;
  username: string | null;
  email: string | null;
  avatar_url: string | null;
  wallet_address: string | null;
  is_admin: boolean;
  created_at: string;
  totalXp: number;
  level: number;
  streak: number;
  hasGoogle: boolean;
  hasGithub: boolean;
}

interface AdminCourse {
  _id: string;
  title: string;
  courseId: string;
  description: string;
  difficulty: string;
  published: boolean;
  submissionStatus: string | null;
  reviewComment: string | null;
  xpPerLesson: number | null;
  lessonCount: number | null;
  totalLessons: number | null;
  trackId: number | null;
  trackLevel: number | null;
  creator: string | null;
  creatorRewardXp: number | null;
  minCompletionsForReward: number | null;
  prerequisiteCourseId: string | null;
  trackTitle: string | null;
  instructorName: string | null;
  _createdAt: string;
}

interface AnalyticsData {
  xp7d: Record<string, number>;
  xp30d: Record<string, number>;
  signups7d: Record<string, number>;
  signups30d: Record<string, number>;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function submissionLabel(s: string | null): string {
  if (!s || s === SUBMISSION_STATUS.WAITING) return "Waiting For Approval";
  if (s === SUBMISSION_STATUS.APPROVED) return "Approved & Published";
  if (s === SUBMISSION_STATUS.REJECTED) return "Rejected";
  if (s === SUBMISSION_STATUS.DEACTIVATED) return "Deactivated";
  return s;
}

function submissionVariant(s: string | null): "default" | "secondary" | "destructive" | "outline" {
  if (!s || s === SUBMISSION_STATUS.WAITING) return "secondary";
  if (s === SUBMISSION_STATUS.APPROVED) return "default";
  if (s === SUBMISSION_STATUS.REJECTED) return "destructive";
  return "outline";
}

function StatusBadge({ status }: { status: string | null }) {
  return <Badge variant={submissionVariant(status)}>{submissionLabel(status)}</Badge>;
}

type SortDir = "asc" | "desc";

function toChartData(data: Record<string, number>, days: number): { date: string; value: number }[] {
  const result: { date: string; value: number }[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const label = key.slice(5); // MM-DD
    result.push({ date: label, value: data[key] ?? 0 });
  }
  return result;
}

// ── Main Component ──────────────────────────────────────────────────────────

export default function AdminPage() {
  const t = useTranslations("admin");
  const tc = useTranslations("common");
  const { data: session } = useSession();

  const [stats, setStats] = useState<Stats | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [userTotal, setUserTotal] = useState(0);
  const [userPage, setUserPage] = useState(1);
  const [userSearch, setUserSearch] = useState("");
  const [userSortBy, setUserSortBy] = useState("created_at");
  const [userSortOrder, setUserSortOrder] = useState<SortDir>("desc");
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [courseFilter, setCourseFilter] = useState("all");
  const [rejectDialog, setRejectDialog] = useState<{ course: AdminCourse } | null>(null);
  const [rejectComment, setRejectComment] = useState("");
  const [approveDialog, setApproveDialog] = useState<{ course: AdminCourse } | null>(null);
  const [approveFields, setApproveFields] = useState({ xpPerLesson: 0, creatorRewardXp: 0, minCompletionsForReward: 0 });
  const [updateDialog, setUpdateDialog] = useState<{ course: AdminCourse } | null>(null);
  const [updateFields, setUpdateFields] = useState({ xpPerLesson: 0, creatorRewardXp: 0, minCompletionsForReward: 0 });
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [copiedWallet, setCopiedWallet] = useState<string | null>(null);
  const [togglingAdmin, setTogglingAdmin] = useState<string | null>(null);

  // Track management state
  interface AdminTrack {
    _id: string;
    name: string;
    slug: string;
    description: string;
    color: string;
    trackId: number;
    collectionAddress?: string;
    courseCount: number;
  }
  const [tracks, setTracks] = useState<AdminTrack[]>([]);
  const [trackDialog, setTrackDialog] = useState<{ mode: "create" | "edit"; track?: AdminTrack } | null>(null);
  const [trackForm, setTrackForm] = useState({ name: "", slug: "", description: "", color: "#D4A843", trackId: 0 });
  const [trackLoading, setTrackLoading] = useState<string | null>(null);

  // Testimonials state
  interface AdminTestimonial {
    id: string;
    name: string;
    avatarUrl: string | null;
    role: string | null;
    quote: string;
    featured: boolean;
    featuredOrder: number;
    createdAt: string;
  }
  const [adminTestimonials, setAdminTestimonials] = useState<AdminTestimonial[]>([]);
  const [loadingTestimonials, setLoadingTestimonials] = useState(true);
  const [featuringId, setFeaturingId] = useState<string | null>(null);

  // ── Data Fetching ───────────────────────────────────────────────────────

  const fetchStats = useCallback(async () => {
    const res = await fetch("/api/admin/stats");
    if (res.ok) setStats(await res.json());
  }, []);

  const fetchAnalytics = useCallback(async () => {
    const res = await fetch("/api/admin/analytics");
    if (res.ok) setAnalytics(await res.json());
  }, []);

  const fetchUsers = useCallback(async () => {
    const params = new URLSearchParams({
      page: String(userPage),
      limit: "20",
      sortBy: userSortBy,
      sortOrder: userSortOrder,
      ...(userSearch && { search: userSearch }),
      ...(userRoleFilter !== "all" && { role: userRoleFilter }),
    });
    const res = await fetch(`/api/admin/users?${params}`);
    if (res.ok) {
      const data = await res.json();
      setUsers(data.users);
      setUserTotal(data.total);
    }
  }, [userPage, userSearch, userSortBy, userSortOrder, userRoleFilter]);

  const fetchCourses = useCallback(async () => {
    const res = await fetch("/api/admin/courses");
    if (res.ok) {
      const data = await res.json();
      setCourses(data.courses);
    }
  }, []);

  const fetchTracks = useCallback(async () => {
    const res = await fetch("/api/admin/tracks");
    if (res.ok) setTracks(await res.json());
  }, []);

  const fetchTestimonials = useCallback(async () => {
    setLoadingTestimonials(true);
    const res = await fetch("/api/testimonials?all=true");
    if (res.ok) setAdminTestimonials(await res.json());
    setLoadingTestimonials(false);
  }, []);

  useEffect(() => {
    fetchStats();
    fetchAnalytics();
    fetchCourses();
    fetchTracks();
    fetchTestimonials();
  }, [fetchStats, fetchAnalytics, fetchCourses, fetchTracks, fetchTestimonials]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // ── Column Sorting ────────────────────────────────────────────────────

  function toggleSort(col: string) {
    if (userSortBy === col) {
      setUserSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setUserSortBy(col);
      setUserSortOrder("desc");
    }
    setUserPage(1);
  }

  function SortIcon({ col }: { col: string }) {
    if (userSortBy !== col) return <ArrowUpDown className="ml-1 inline h-3 w-3 opacity-30" />;
    return userSortOrder === "asc" ? (
      <ArrowUp className="ml-1 inline h-3 w-3" />
    ) : (
      <ArrowDown className="ml-1 inline h-3 w-3" />
    );
  }

  // ── Actions ─────────────────────────────────────────────────────────────

  async function toggleAdmin(userId: string, currentValue: boolean) {
    setTogglingAdmin(userId);
    await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_admin: !currentValue }),
    });
    await fetchUsers();
    setTogglingAdmin(null);
  }

  async function courseAction(courseId: string, action: string, extra?: Record<string, unknown>) {
    setActionLoading(courseId);
    try {
      const res = await fetch(`/api/admin/courses/${courseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Unknown error" }));
        toast.error(data.error ?? `Action failed (${res.status})`);
      } else {
        toast.success(`Course ${action}d successfully`);
      }
    } catch (err) {
      toast.error(`Network error: ${err instanceof Error ? err.message : "unknown"}`);
    }
    setActionLoading(null);
    fetchCourses();
  }

  if (session && !session.isAdmin) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 text-center">
        <p className="text-muted-foreground">{t("accessDenied")}</p>
      </div>
    );
  }

  const filteredCourses =
    courseFilter === "all"
      ? courses
      : courseFilter === SUBMISSION_STATUS.WAITING
        ? courses.filter((c) => !c.submissionStatus || c.submissionStatus === SUBMISSION_STATUS.WAITING)
        : courses.filter((c) => c.submissionStatus === courseFilter);

  const totalUserPages = Math.ceil(userTotal / 20);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 flex items-center gap-3">
        <Shield className="h-6 w-6 text-primary" />
        <h1 className="text-3xl font-bold">{t("title")}</h1>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats ? (
          <>
            <StatCard icon={Users} label={t("totalUsers")} value={stats.totalUsers.toLocaleString()} />
            <StatCard icon={TrendingUp} label={t("activeLast7d")} value={stats.activeLast7d.toLocaleString()} />
            <StatCard icon={BarChart3} label={t("totalXpDistributed")} value={stats.totalXpDistributed.toLocaleString()} />
            <StatCard icon={BookOpen} label={t("totalCourses")} value={stats.totalCourses.toLocaleString()} />
          </>
        ) : (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6"><Skeleton className="h-16 w-full" /></CardContent>
            </Card>
          ))
        )}
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">{t("overview")}</TabsTrigger>
          <TabsTrigger value="users">{t("userManagement")}</TabsTrigger>
          <TabsTrigger value="courses">{t("courseManagement")}</TabsTrigger>
          <TabsTrigger value="tracks">{t("tracks")}</TabsTrigger>
          <TabsTrigger value="testimonials">{t("testimonials")}</TabsTrigger>
        </TabsList>

        {/* ── Overview / Analytics ──────────────────────────────────────── */}
        <TabsContent value="overview">
          {analytics ? (
            <div className="space-y-6">
              <Card>
                <CardHeader><CardTitle>{t("xpDistributed")}</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid gap-6 lg:grid-cols-2">
                    <AnalyticsChart title={t("last7Days")} data={toChartData(analytics.xp7d, 7)} colorVar="--chart-1" gradientId="grad-xp7d" />
                    <AnalyticsChart title={t("last30Days")} data={toChartData(analytics.xp30d, 30)} colorVar="--chart-1" gradientId="grad-xp30d" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>{t("newUsers")}</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid gap-6 lg:grid-cols-2">
                    <AnalyticsChart title={t("last7Days")} data={toChartData(analytics.signups7d, 7)} colorVar="--chart-2" gradientId="grad-signups7d" />
                    <AnalyticsChart title={t("last30Days")} data={toChartData(analytics.signups30d, 30)} colorVar="--chart-2" gradientId="grad-signups30d" />
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card><CardContent className="p-6"><Skeleton className="h-48 w-full" /></CardContent></Card>
          )}
        </TabsContent>

        {/* ── User Management ──────────────────────────────────────────── */}
        <TabsContent value="users" forceMount className="data-[state=inactive]:hidden">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle>{t("userManagement")}</CardTitle>
                <div className="flex items-center gap-2">
                  <Select value={userRoleFilter} onValueChange={(v) => { setUserRoleFilter(v); setUserPage(1); }}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{tc("all")}</SelectItem>
                      <SelectItem value="admin">{t("adminBadge")}</SelectItem>
                      <SelectItem value="user">{t("userBadge")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="relative w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={tc("search")}
                      className="pl-8"
                      value={userSearch}
                      onChange={(e) => { setUserSearch(e.target.value); setUserPage(1); }}
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="min-w-0 overflow-x-auto">
              <TooltipProvider>
                <Table className="text-sm">
                  <TableHeader>
                    <TableRow>
                      <SortableHead col="display_name" label={t("user")} />
                      <SortableHead col="username" label={t("username")} />
                      <SortableHead col="email" label={t("email")} />
                      <TableHead>{t("wallet")}</TableHead>
                      <TableHead className="text-center px-2">{t("google")}</TableHead>
                      <TableHead className="text-center px-2">{t("github")}</TableHead>
                      <SortableHead col="totalXp" label={tc("xp")} />
                      <SortableHead col="level" label={tc("level")} />
                      <SortableHead col="streak" label={tc("streak")} />
                      <SortableHead col="created_at" label={t("joined")} />
                      <TableHead className="px-2">{t("role")}</TableHead>
                      <TableHead>{t("actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.avatar_url ?? undefined} />
                              <AvatarFallback className="text-xs">
                                {(user.display_name ?? "U")[0].toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium whitespace-nowrap">
                              {user.display_name ?? t("unnamed")}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {user.username ? `@${user.username}` : "—"}
                        </TableCell>
                        <TableCell className="max-w-[160px] truncate text-sm text-muted-foreground" title={user.email ?? undefined}>
                          {user.email ?? "—"}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {user.wallet_address ? (
                            <span className="flex items-center gap-1">
                              {`${user.wallet_address.slice(0, 4)}...${user.wallet_address.slice(-4)}`}
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(user.wallet_address!);
                                  setCopiedWallet(user.id);
                                  setTimeout(() => setCopiedWallet(null), 1500);
                                }}
                                className="text-muted-foreground/50 hover:text-foreground transition-colors"
                                title="Copy wallet address"
                              >
                                {copiedWallet === user.id ? (
                                  <Check className="h-3 w-3 text-green-500" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </button>
                            </span>
                          ) : "—"}
                        </TableCell>
                        <TableCell className="text-center px-2">
                          <ProviderDot connected={user.hasGoogle} label="Google" />
                        </TableCell>
                        <TableCell className="text-center px-2">
                          <ProviderDot connected={user.hasGithub} label="GitHub" />
                        </TableCell>
                        <TableCell className="font-medium">{user.totalXp.toLocaleString()}</TableCell>
                        <TableCell>{user.level}</TableCell>
                        <TableCell>
                          <span className="flex items-center gap-1">
                            <Flame className="h-3 w-3 text-orange-500" />
                            {user.streak}d
                          </span>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {new Date(user.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="px-2">
                          <Badge variant={user.is_admin ? "default" : "secondary"}>
                            {user.is_admin ? t("adminBadge") : t("userBadge")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="-ml-3 text-xs"
                            disabled={togglingAdmin === user.id}
                            onClick={() => toggleAdmin(user.id, user.is_admin)}
                          >
                            {togglingAdmin === user.id ? tc("loading") : user.is_admin ? t("removeAdmin") : t("makeAdmin")}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TooltipProvider>
              {totalUserPages > 1 && (
                <div className="mt-4 flex items-center justify-center gap-2">
                  <Button variant="outline" size="sm" disabled={userPage <= 1} onClick={() => setUserPage((p) => p - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">{userPage} / {totalUserPages}</span>
                  <Button variant="outline" size="sm" disabled={userPage >= totalUserPages} onClick={() => setUserPage((p) => p + 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Course Management ────────────────────────────────────────── */}
        <TabsContent value="courses">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t("courseManagement")}</CardTitle>
                <Select value={courseFilter} onValueChange={setCourseFilter}>
                  <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{tc("all")}</SelectItem>
                    <SelectItem value="waiting">{t("statusWaiting")}</SelectItem>
                    <SelectItem value="approved">{t("statusApproved")}</SelectItem>
                    <SelectItem value="rejected">{t("statusRejected")}</SelectItem>
                    <SelectItem value="deactivated">{t("statusDeactivated")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <TooltipProvider>
                <Table className="text-xs">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[140px]">{t("courseTitle")}</TableHead>
                      <TableHead>{t("status")}</TableHead>
                      <TableHead>{t("courseIdCol")}</TableHead>
                      <TableHead>{t("track")}</TableHead>
                      <TableHead className="text-center px-1">{tc("lessons")}</TableHead>
                      <TableHead className="text-center px-1"><span className="block leading-tight">XP/<br/>Lesson</span></TableHead>
                      <TableHead className="text-center px-1"><span className="block leading-tight">Creator<br/>Reward</span></TableHead>
                      <TableHead className="text-center px-1"><span className="block leading-tight">Min<br/>Comp.</span></TableHead>
                      <TableHead className="text-center px-1"><Tooltip><TooltipTrigger asChild><span className="cursor-help">Creator</span></TooltipTrigger><TooltipContent>Creator Wallet</TooltipContent></Tooltip></TableHead>
                      <TableHead className="text-center">{t("actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCourses.map((course) => {
                      const ss = course.submissionStatus;
                      return (
                        <TableRow key={course._id}>
                          <TableCell>
                            <div>
                              <span className="font-medium text-sm">{course.title}</span>
                              {course.instructorName && (
                                <p className="text-[10px] text-muted-foreground">{course.instructorName}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell><StatusBadge status={ss} /></TableCell>
                          <TableCell className="font-mono">{course.courseId}</TableCell>
                          <TableCell className="whitespace-nowrap">{course.trackTitle ?? "—"}</TableCell>
                          <TableCell className="text-center px-1">{course.totalLessons ?? course.lessonCount ?? "—"}</TableCell>
                          <TableCell className="text-center px-1">{course.xpPerLesson ?? "—"}</TableCell>
                          <TableCell className="text-center px-1">{course.creatorRewardXp ?? "—"}</TableCell>
                          <TableCell className="text-center px-1">{course.minCompletionsForReward ?? "—"}</TableCell>
                          <TableCell className="text-center px-1">
                            {course.creator ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(course.creator!);
                                      setCopiedWallet(course._id);
                                      setTimeout(() => setCopiedWallet(null), 1500);
                                    }}
                                    className="inline-flex items-center justify-center text-muted-foreground/50 hover:text-foreground transition-colors"
                                  >
                                    {copiedWallet === course._id ? (
                                      <Check className="h-3.5 w-3.5 text-green-500" />
                                    ) : (
                                      <Copy className="h-3.5 w-3.5" />
                                    )}
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent className="font-mono text-xs">{course.creator}</TooltipContent>
                              </Tooltip>
                            ) : "—"}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-0.5">
                              {/* Waiting: Approve + Reject */}
                              {(!ss || ss === SUBMISSION_STATUS.WAITING) && (
                                <>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="default"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={() => {
                                          setApproveDialog({ course });
                                          setApproveFields({
                                            xpPerLesson: course.xpPerLesson ?? 0,
                                            creatorRewardXp: course.creatorRewardXp ?? 0,
                                            minCompletionsForReward: course.minCompletionsForReward ?? 0,
                                          });
                                        }}
                                      >
                                        <Check className="h-3.5 w-3.5" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>{t("approve")}</TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="destructive"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={() => { setRejectDialog({ course }); setRejectComment(""); }}
                                      >
                                        <X className="h-3.5 w-3.5" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>{t("reject")}</TooltipContent>
                                  </Tooltip>
                                </>
                              )}
                              {/* Approved: Update + Deactivate */}
                              {ss === SUBMISSION_STATUS.APPROVED && (
                                <>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={() => {
                                          setUpdateDialog({ course });
                                          setUpdateFields({
                                            xpPerLesson: course.xpPerLesson ?? 0,
                                            creatorRewardXp: course.creatorRewardXp ?? 0,
                                            minCompletionsForReward: course.minCompletionsForReward ?? 0,
                                          });
                                        }}
                                      >
                                        <Pencil className="h-3.5 w-3.5" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>{t("updateParams")}</TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-7 w-7"
                                        disabled={actionLoading === course.courseId}
                                        onClick={() => courseAction(course.courseId, COURSE_ACTIONS.DEACTIVATE)}
                                      >
                                        <Archive className="h-3.5 w-3.5" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>{t("deactivate")}</TooltipContent>
                                  </Tooltip>
                                </>
                              )}
                              {/* Rejected: Re-approve */}
                              {ss === SUBMISSION_STATUS.REJECTED && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="default"
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={() => {
                                        setApproveDialog({ course });
                                        setApproveFields({
                                          xpPerLesson: course.xpPerLesson ?? 0,
                                          creatorRewardXp: course.creatorRewardXp ?? 0,
                                          minCompletionsForReward: course.minCompletionsForReward ?? 0,
                                        });
                                      }}
                                    >
                                      <Check className="h-3.5 w-3.5" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>{t("approve")}</TooltipContent>
                                </Tooltip>
                              )}
                              {/* Preview for all */}
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                                    <Link href={`/courses/preview/${course.courseId}`} target="_blank">
                                      <Eye className="h-3.5 w-3.5" />
                                    </Link>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>{t("preview")}</TooltipContent>
                              </Tooltip>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {filteredCourses.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                          {t("noCourses")}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TooltipProvider>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tracks ───────────────────────────────────────────────────── */}
        <TabsContent value="tracks">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{t("trackManagement")}</CardTitle>
              <Button
                size="sm"
                onClick={() => {
                  const nextId = tracks.length > 0 ? Math.max(...tracks.map((t) => t.trackId)) + 1 : 1;
                  setTrackForm({ name: "", slug: "", description: "", color: "#D4A843", trackId: nextId });
                  setTrackDialog({ mode: "create" });
                }}
              >
                {t("createTrack")}
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("id")}</TableHead>
                    <TableHead>{t("name")}</TableHead>
                    <TableHead>{t("slug")}</TableHead>
                    <TableHead>{t("courses")}</TableHead>
                    <TableHead>{t("collection")}</TableHead>
                    <TableHead>{t("actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tracks.map((track) => (
                    <TableRow key={track._id}>
                      <TableCell className="font-mono text-xs">{track.trackId}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: track.color }} />
                          {track.name}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{track.slug}</TableCell>
                      <TableCell>{track.courseCount}</TableCell>
                      <TableCell>
                        {track.collectionAddress ? (
                          <div className="flex items-center gap-1">
                            <Badge variant="default" className="gap-1 text-xs">
                              <Check className="h-3 w-3" />
                              {track.collectionAddress.slice(0, 8)}...
                            </Badge>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(track.collectionAddress!);
                                setCopiedWallet(`col-${track._id}`);
                                setTimeout(() => setCopiedWallet(null), 1500);
                              }}
                              className="text-muted-foreground/50 hover:text-foreground transition-colors"
                            >
                              {copiedWallet === `col-${track._id}` ? (
                                <Check className="h-3 w-3 text-green-500" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <Badge variant="destructive" className="text-xs">{t("missing")}</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs"
                            onClick={() => {
                              setTrackForm({
                                name: track.name,
                                slug: track.slug,
                                description: track.description,
                                color: track.color,
                                trackId: track.trackId,
                              });
                              setTrackDialog({ mode: "edit", track });
                            }}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          {!track.collectionAddress && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              disabled={trackLoading === `col-${track.slug}`}
                              onClick={async () => {
                                setTrackLoading(`col-${track.slug}`);
                                try {
                                  const res = await fetch(`/api/admin/tracks/${track.slug}/collection`, { method: "POST" });
                                  const data = await res.json();
                                  if (res.ok || data.collectionPublicKey) {
                                    toast.success(`Collection created: ${data.collectionPublicKey || "OK"}`);
                                    fetchTracks();
                                  } else {
                                    toast.error(data.error || "Failed");
                                  }
                                } catch {
                                  toast.error("Failed to create collection");
                                } finally {
                                  setTrackLoading(null);
                                }
                              }}
                            >
                              {t("createCollection")}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {tracks.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        {t("noTracks")}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Testimonials ──────────────────────────────────────────── */}
        <TabsContent value="testimonials">
          {loadingTestimonials ? (
            <div className="space-y-6">
              <Card><CardContent className="p-6 space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</CardContent></Card>
              <Card><CardContent className="p-6 space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</CardContent></Card>
            </div>
          ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t("featuredTestimonials")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {adminTestimonials.filter((t) => t.featured).sort((a, b) => a.featuredOrder - b.featuredOrder).map((item) => (
                    <div key={item.id} className="flex items-start gap-3 rounded-lg border p-3">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.role}</p>
                        <p className="mt-1 text-sm italic">&ldquo;{item.quote}&rdquo;</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Input
                          type="number"
                          className="w-16 h-8 text-xs"
                          value={item.featuredOrder}
                          onChange={async (e) => {
                            const order = parseInt(e.target.value, 10) || 0;
                            await fetch(`/api/admin/testimonials/${item.id}`, {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ featured: true, featuredOrder: order }),
                            });
                            fetchTestimonials();
                          }}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            await fetch(`/api/admin/testimonials/${item.id}`, {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ featured: false }),
                            });
                            fetchTestimonials();
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {adminTestimonials.filter((t) => t.featured).length === 0 && (
                    <p className="text-sm text-muted-foreground py-4 text-center">No featured testimonials yet.</p>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{t("newTestimonials")}</CardTitle>
                  <span className="text-xs text-muted-foreground">Newest first</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {adminTestimonials.filter((t) => !t.featured).map((item) => (
                    <div key={item.id} className="flex items-start gap-3 rounded-lg border p-3">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.role}</p>
                        <p className="mt-1 text-sm italic">&ldquo;{item.quote}&rdquo;</p>
                        <p className="mt-1 text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleDateString()}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={featuringId === item.id || adminTestimonials.filter((t) => t.featured).length >= 10}
                        onClick={async () => {
                          setFeaturingId(item.id);
                          await fetch(`/api/admin/testimonials/${item.id}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ featured: true, featuredOrder: adminTestimonials.filter((t) => t.featured).length }),
                          });
                          await fetchTestimonials();
                          setFeaturingId(null);
                        }}
                      >
                        {featuringId === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : t("featured")}
                      </Button>
                    </div>
                  ))}
                  {adminTestimonials.filter((t) => !t.featured).length === 0 && (
                    <p className="text-sm text-muted-foreground py-4 text-center">No new testimonials.</p>
                  )}
                </div>
                {adminTestimonials.filter((t) => t.featured).length >= 10 && (
                  <p className="mt-3 text-xs text-amber-500">{t("maxFeatured")}</p>
                )}
              </CardContent>
            </Card>
          </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ── Track Create/Edit Dialog ────────────────────────────────── */}
      <Dialog open={!!trackDialog} onOpenChange={(open) => !open && setTrackDialog(null)}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>{trackDialog?.mode === "create" ? t("createTrack") : t("editTrack")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Name — full width */}
            <div>
              <label className="text-sm font-medium">{t("name")}</label>
              <Input value={trackForm.name} onChange={(e) => setTrackForm({ ...trackForm, name: e.target.value, ...(trackDialog?.mode === "create" ? { slug: e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") } : {}) })} />
            </div>
            {/* Slug + Color — side by side */}
            <div className="grid grid-cols-[1fr_auto] gap-4 items-end">
              <div>
                <label className="text-sm font-medium">{t("slug")}</label>
                <Input value={trackForm.slug} onChange={(e) => trackDialog?.mode === "create" && setTrackForm({ ...trackForm, slug: e.target.value })} readOnly={trackDialog?.mode === "edit"} className={trackDialog?.mode === "edit" ? "opacity-60 cursor-not-allowed" : ""} />
              </div>
              <div>
                <label className="text-sm font-medium">{t("color")}</label>
                <div className="flex items-center gap-2 mt-1">
                  <input type="color" value={trackForm.color} onChange={(e) => setTrackForm({ ...trackForm, color: e.target.value })} className="h-9 w-9 rounded cursor-pointer border border-border bg-transparent p-0.5" />
                  <span className="text-xs text-muted-foreground font-mono">{trackForm.color}</span>
                </div>
              </div>
            </div>
            {/* Description + Image — side by side */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label className="text-sm font-medium mb-1">{t("description")}</label>
                <Textarea value={trackForm.description} onChange={(e) => setTrackForm({ ...trackForm, description: e.target.value })} className="flex-1 min-h-[140px] resize-none" />
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-medium mb-1">{t("credentialImage")}</label>
                <div className="flex-1 rounded-lg border border-border flex items-center justify-center p-3">
                  <img src="/images/credentials/sample.png" alt="Default credential" className="h-32 w-32 rounded-lg object-cover" />
                </div>
              </div>
            </div>
            {/* Note */}
            <p className="text-xs text-muted-foreground">
              {t("credentialImageNote")}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTrackDialog(null)}>{tc("cancel")}</Button>
            <Button
              disabled={trackLoading === "save"}
              onClick={async () => {
                setTrackLoading("save");
                try {
                  if (trackDialog?.mode === "create") {
                    const res = await fetch("/api/admin/tracks", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ name: trackForm.name, slug: trackForm.slug, description: trackForm.description, color: trackForm.color }),
                    });
                    if (res.ok) {
                      toast.success(t("trackCreated"));
                      // Auto-create collection for the new track
                      const slug = trackForm.slug;
                      toast.info(t("creatingCollection"));
                      try {
                        const colRes = await fetch(`/api/admin/tracks/${slug}/collection`, { method: "POST" });
                        const colData = await colRes.json();
                        if (colRes.ok || colData.collectionPublicKey) {
                          toast.success(`Collection created: ${colData.collectionPublicKey || "OK"}`);
                        } else {
                          toast.error(colData.error || "Collection creation failed");
                        }
                      } catch {
                        toast.error("Collection creation failed");
                      }
                      fetchTracks();
                      setTrackDialog(null);
                    } else {
                      const data = await res.json();
                      toast.error(data.error || "Failed");
                    }
                  } else if (trackDialog?.track) {
                    const res = await fetch(`/api/admin/tracks/${trackDialog.track.slug}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ name: trackForm.name, description: trackForm.description, color: trackForm.color }),
                    });
                    if (res.ok) {
                      toast.success(t("trackUpdated"));
                      fetchTracks();
                      setTrackDialog(null);
                    } else {
                      toast.error("Update failed");
                    }
                  }
                } catch {
                  toast.error("Operation failed");
                } finally {
                  setTrackLoading(null);
                }
              }}
            >
              {trackDialog?.mode === "create" ? t("create") : tc("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Approve Dialog (with editable params) ─────────────────────── */}
      <Dialog open={!!approveDialog} onOpenChange={(open) => !open && setApproveDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("approveCourse")}: {approveDialog?.course.title}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{t("approveDescription")}</p>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">{t("xpPerLesson")}</label>
              <Input
                type="number"
                value={approveFields.xpPerLesson}
                onChange={(e) => setApproveFields((f) => ({ ...f, xpPerLesson: Number(e.target.value) }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">{t("creatorReward")}</label>
              <Input
                type="number"
                value={approveFields.creatorRewardXp}
                onChange={(e) => setApproveFields((f) => ({ ...f, creatorRewardXp: Number(e.target.value) }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">{t("minCompletions")}</label>
              <Input
                type="number"
                value={approveFields.minCompletionsForReward}
                onChange={(e) => setApproveFields((f) => ({ ...f, minCompletionsForReward: Number(e.target.value) }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialog(null)}>{tc("cancel")}</Button>
            <Button
              disabled={actionLoading === approveDialog?.course.courseId}
              onClick={async () => {
                if (approveDialog) {
                  await courseAction(approveDialog.course.courseId, COURSE_ACTIONS.APPROVE, approveFields);
                  setApproveDialog(null);
                }
              }}
            >
              {actionLoading === approveDialog?.course.courseId ? tc("loading") : t("confirmApprove")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Reject Dialog ─────────────────────────────────────────────── */}
      <Dialog open={!!rejectDialog} onOpenChange={(open) => !open && setRejectDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("rejectCourse")}: {rejectDialog?.course.title}</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder={t("rejectCommentPlaceholder")}
            value={rejectComment}
            onChange={(e) => setRejectComment(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog(null)}>{tc("cancel")}</Button>
            <Button
              variant="destructive"
              disabled={actionLoading === rejectDialog?.course.courseId}
              onClick={async () => {
                if (rejectDialog) {
                  await courseAction(rejectDialog.course.courseId, COURSE_ACTIONS.REJECT, { reviewComment: rejectComment });
                  setRejectDialog(null);
                }
              }}
            >
              {actionLoading === rejectDialog?.course.courseId ? tc("loading") : t("confirmReject")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Update Params Dialog (for approved courses) ───────────────── */}
      <Dialog open={!!updateDialog} onOpenChange={(open) => !open && setUpdateDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("updateParams")}: {updateDialog?.course.title}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{t("updateDescription")}</p>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">{t("xpPerLesson")}</label>
              <Input
                type="number"
                value={updateFields.xpPerLesson}
                onChange={(e) => setUpdateFields((f) => ({ ...f, xpPerLesson: Number(e.target.value) }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">{t("creatorReward")}</label>
              <Input
                type="number"
                value={updateFields.creatorRewardXp}
                onChange={(e) => setUpdateFields((f) => ({ ...f, creatorRewardXp: Number(e.target.value) }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">{t("minCompletions")}</label>
              <Input
                type="number"
                value={updateFields.minCompletionsForReward}
                onChange={(e) => setUpdateFields((f) => ({ ...f, minCompletionsForReward: Number(e.target.value) }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpdateDialog(null)}>{tc("cancel")}</Button>
            <Button
              disabled={actionLoading === updateDialog?.course.courseId}
              onClick={async () => {
                if (updateDialog) {
                  await courseAction(updateDialog.course.courseId, COURSE_ACTIONS.UPDATE, updateFields);
                  setUpdateDialog(null);
                }
              }}
            >
              {actionLoading === updateDialog?.course.courseId ? tc("loading") : tc("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  // ── Sortable Header (defined inside component to access toggleSort/SortIcon) ──

  function SortableHead({ col, label }: { col: string; label: string }) {
    return (
      <TableHead className="cursor-pointer select-none whitespace-nowrap" onClick={() => toggleSort(col)}>
        {label}
        <SortIcon col={col} />
      </TableHead>
    );
  }
}

// ── Sub-components ────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function ProviderDot({ connected, label }: { connected: boolean; label: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={`inline-block h-2.5 w-2.5 rounded-full ${connected ? "bg-green-500" : "bg-muted-foreground/20"}`}
        />
      </TooltipTrigger>
      <TooltipContent>
        <p>{label}: {connected ? "Connected" : "Not connected"}</p>
      </TooltipContent>
    </Tooltip>
  );
}

function useCssVar(varName: string, fallback: string): string {
  const [value, setValue] = useState(fallback);
  useEffect(() => {
    const resolved = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    if (resolved) setValue(resolved);
  }, [varName]);
  return value;
}

function AnalyticsChart({
  title,
  data,
  colorVar,
  gradientId,
}: {
  title: string;
  data: { date: string; value: number }[];
  colorVar: string;
  gradientId: string;
}) {
  const color = useCssVar(colorVar, "#fbbf24");
  const borderColor = useCssVar("--border", "#35573e");
  const mutedFg = useCssVar("--muted-foreground", "#888");
  const cardBg = useCssVar("--card", "#243529");
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="mb-4 flex items-baseline justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        <span className="text-2xl font-bold">{total.toLocaleString()}</span>
      </div>
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.25} />
                <stop offset="100%" stopColor={color} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={borderColor} strokeOpacity={0.5} />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: mutedFg }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: mutedFg }}
              allowDecimals={false}
            />
            <RechartsTooltip
              contentStyle={{
                backgroundColor: cardBg,
                border: `1px solid ${borderColor}`,
                borderRadius: "8px",
                fontSize: "12px",
              }}
              labelStyle={{ color: mutedFg }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              dot={false}
              activeDot={{ r: 4, fill: color, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
          No data
        </div>
      )}
    </div>
  );
}
