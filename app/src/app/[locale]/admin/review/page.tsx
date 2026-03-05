"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CheckCircle, XCircle, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { useTranslations } from "next-intl";

export default function AdminReviewPage() {
  const [pendingCourses, setPendingCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectComment, setRejectComment] = useState("");
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const t = useTranslations("AdminReview");

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/courses");
      const data = await res.json();
      if (!data.error) setPendingCourses(data.filter((c: any) => c.status === "PENDING"));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleApprove = async (courseId: string) => {
    setActionLoading(courseId);
    try {
      const res = await fetch("/api/admin/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, action: "APPROVE" }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(t("approved"));
        fetchPending();
      } else {
        throw new Error(data.error);
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!selectedCourseId) return;
    setActionLoading(selectedCourseId);
    try {
      const res = await fetch("/api/admin/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId: selectedCourseId, action: "REJECT", comment: rejectComment }),
      });
      if (res.ok) {
        toast.success(t("rejected"));
        setRejectModalOpen(false);
        setRejectComment("");
        fetchPending();
      } else {
        throw new Error(t("rejectError"));
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" /></div>
      ) : pendingCourses.length === 0 ? (
        <Card className="border-dashed border-white/15 bg-black/25">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <CheckCircle className="mb-4 h-12 w-12 text-green-500 opacity-50" />
            <h3 className="mb-2 text-xl font-bold">{t("caughtUp")}</h3>
            <p className="text-muted-foreground">{t("empty")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {pendingCourses.map((course) => (
            <Card key={course.id} className="overflow-hidden border-white/10 bg-black/25 backdrop-blur-md">
              <div className="flex flex-col md:flex-row">
                <div className="flex-1 space-y-4 p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-2xl font-bold">{course.title}</h3>
                      <p className="text-sm font-mono text-muted-foreground">{course.slug}</p>
                    </div>
                    <Badge className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20">{t("pending")}</Badge>
                  </div>
                  <p className="text-muted-foreground">{course.description}</p>
                  <div className="flex gap-4 text-sm">
                    <span className="font-semibold text-primary">{course.xpPerLesson} {t("xpPerLesson")}</span>
                    <span className="text-muted-foreground">•</span>
                    <span>{course.difficulty}</span>
                  </div>
                  <Link href={`/admin/courses/${course.slug}`}>
                    <Button variant="link" className="h-auto p-0">{t("viewDetails")} <ExternalLink className="ml-1 h-3 w-3" /></Button>
                  </Link>
                </div>

                <div className="flex shrink-0 flex-col justify-center gap-3 border-t bg-muted/20 p-6 md:w-64 md:border-l md:border-t-0">
                  <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => handleApprove(course.id)} disabled={actionLoading === course.id}>
                    {actionLoading === course.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                    {t("approveDeploy")}
                  </Button>

                  <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
                    <DialogTrigger asChild>
                      <Button variant="destructive" className="w-full" onClick={() => setSelectedCourseId(course.id)} disabled={actionLoading === course.id}>
                        <XCircle className="mr-2 h-4 w-4" /> {t("reject")}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{t("rejectCourse")}</DialogTitle>
                        <DialogDescription>{t("rejectDescription")}</DialogDescription>
                      </DialogHeader>
                      <Textarea
                        placeholder={t("rejectPlaceholder")}
                        value={rejectComment}
                        onChange={(e) => setRejectComment(e.target.value)}
                        className="mt-4"
                      />
                      <DialogFooter className="mt-4">
                        <Button variant="outline" onClick={() => setRejectModalOpen(false)}>{t("cancel")}</Button>
                        <Button variant="destructive" onClick={handleReject} disabled={!rejectComment.trim()}>{t("confirmReject")}</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
