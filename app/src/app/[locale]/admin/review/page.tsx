"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CheckCircle, XCircle, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";

export default function AdminReviewPage() {
  const [pendingCourses, setPendingCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null); // Хранит ID курса, который сейчас обрабатывается
  const [rejectComment, setRejectComment] = useState("");
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  const fetchPending = async () => {
    setLoading(true);
    try {
        // Мы используем существующий API, но фильтруем на клиенте (для хакатона ок, но лучше сделать роут)
        const res = await fetch('/api/admin/courses');
        const data = await res.json();
        if (!data.error) {
            // Оставляем только те, что ждут проверки
            setPendingCourses(data.filter((c: any) => c.status === "PENDING"));
        }
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
          const res = await fetch('/api/admin/review', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ courseId, action: "APPROVE" })
          });
          const data = await res.json();
          if (res.ok) {
              toast.success("Course published to Solana!");
              fetchPending(); // Обновляем список
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
          const res = await fetch('/api/admin/review', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ courseId: selectedCourseId, action: "REJECT", comment: rejectComment })
          });
          if (res.ok) {
              toast.success("Course rejected.");
              setRejectModalOpen(false);
              setRejectComment("");
              fetchPending();
          } else {
              throw new Error("Failed to reject");
          }
      } catch (e: any) {
          toast.error(e.message);
      } finally {
          setActionLoading(null);
      }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Review Submissions</h1>
        <p className="text-muted-foreground">Approve or reject courses submitted by community creators.</p>
      </div>

      {loading ? (
          <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" /></div>
      ) : pendingCourses.length === 0 ? (
          <Card className="border-dashed bg-muted/10">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <CheckCircle className="h-12 w-12 text-green-500 mb-4 opacity-50" />
                  <h3 className="text-xl font-bold mb-2">All Caught Up!</h3>
                  <p className="text-muted-foreground">There are no courses waiting for your review.</p>
              </CardContent>
          </Card>
      ) : (
          <div className="grid gap-6">
              {pendingCourses.map(course => (
                  <Card key={course.id} className="overflow-hidden">
                      <div className="flex flex-col md:flex-row">
                          <div className="flex-1 p-6 space-y-4">
                              <div className="flex justify-between items-start">
                                  <div>
                                      <h3 className="text-2xl font-bold">{course.title}</h3>
                                      <p className="text-sm font-mono text-muted-foreground">{course.slug}</p>
                                  </div>
                                  <Badge className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20">Pending Review</Badge>
                              </div>
                              <p className="text-muted-foreground">{course.description}</p>
                              <div className="flex gap-4 text-sm">
                                  <span className="font-semibold text-primary">{course.xpPerLesson} XP / Lesson</span>
                                  <span className="text-muted-foreground">•</span>
                                  <span>{course.difficulty}</span>
                              </div>
                              {/* Ссылка на просмотр контента перед апрувом */}
                              <Link href={`/admin/courses/${course.slug}`}>
                                  <Button variant="link" className="p-0 h-auto">View Content Details <ExternalLink className="h-3 w-3 ml-1" /></Button>
                              </Link>
                          </div>
                          
                          <div className="bg-muted/30 p-6 border-t md:border-t-0 md:border-l flex flex-col justify-center gap-3 md:w-64 shrink-0">
                              <Button 
                                  className="w-full bg-green-600 hover:bg-green-700" 
                                  onClick={() => handleApprove(course.id)}
                                  disabled={actionLoading === course.id}
                              >
                                  {actionLoading === course.id ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                                  Approve & Deploy
                              </Button>
                              
                              <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="destructive" className="w-full" onClick={() => setSelectedCourseId(course.id)} disabled={actionLoading === course.id}>
                                        <XCircle className="mr-2 h-4 w-4" /> Reject
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Reject Course</DialogTitle>
                                        <DialogDescription>
                                            Provide feedback to the creator so they can improve their submission.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <Textarea 
                                        placeholder="E.g., Your code validation rules are broken in Lesson 2..." 
                                        value={rejectComment}
                                        onChange={e => setRejectComment(e.target.value)}
                                        className="mt-4"
                                    />
                                    <DialogFooter className="mt-4">
                                        <Button variant="outline" onClick={() => setRejectModalOpen(false)}>Cancel</Button>
                                        <Button variant="destructive" onClick={handleReject} disabled={!rejectComment.trim()}>Confirm Rejection</Button>
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