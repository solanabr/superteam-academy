// app/src/app/(dashboard)/courses/[courseId]/lessons/[lessonIndex]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import ReactMarkdown from "react-markdown";
import Confetti from 'react-confetti';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

import { CodeEditor } from "@/components/code-editor";
import { Button } from "@/components/ui/button";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, CheckCircle, ArrowRight, Play, Terminal, ArrowLeft } from "lucide-react";

import { getLessonContent, LessonContent, COURSE_CONTENT } from "@/lib/course-content";

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const { publicKey } = useWallet();

  const courseId = params.courseId as string;
  const lessonIndex = parseInt(params.lessonIndex as string);
  const totalLessons = COURSE_CONTENT[courseId]?.lessons.length || 0;

  const [content, setContent] = useState<LessonContent | null>(null);
  const [code, setCode] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [certificateId, setCertificateId] = useState<string | null>(null);

  // 1. Загрузка контента и статуса
  useEffect(() => {
    const lessonData = getLessonContent(courseId, lessonIndex);
    if (lessonData) {
      setContent(lessonData);
      setCode(lessonData.initialCode);
      setLogs([]); // Очистка логов при смене урока
      setIsCompleted(false);

      if (publicKey) {
          fetch(`/api/lesson/status?wallet=${publicKey.toString()}&courseId=${courseId}&lessonIndex=${lessonIndex}`)
            .then(res => res.json())
            .then(data => {
                if (data.status === "completed") {
                    setIsCompleted(true);
                    if (data.codeSnippet) {
                        setCode(data.codeSnippet);
                    }
                    setLogs(["[System] Lesson previously completed. Code loaded."]);
                }
            });
      }
    } else {
        toast.error("Lesson not found");
        router.push(`/courses/${courseId}`);
    }
  }, [courseId, lessonIndex, publicKey, router]);

  const handleCheckCode = async () => {
    if (!publicKey) {
      toast.error("Wallet not connected");
      return;
    }
    if (!content) return;

    setIsChecking(true);
    setLogs(["Running tests...", "Compiling program..."]);

    try {
      const response = await fetch("/api/verify-lesson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: publicKey.toString(),
          courseId,
          lessonIndex,
          codeAnswer: code,
          lessonId: content.id 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Verification failed");
      }

      setIsCompleted(true);
      setLogs(prev => [...prev, "✅ Build successful", "✅ Tests passed", `Transaction confirmed: ${data.txSignature.slice(0, 8)}...`]);
      toast.success("Lesson completed!");
      if (data.certificateMint) {
        setCertificateId(data.certificateMint);
        setShowCertificateModal(true);
      }

    } catch (error: any) {
      console.error("Check failed:", error);
      setLogs(prev => [...prev, `❌ Error: ${error.message}`]);
      toast.error("Verification failed");
    } finally {
      setIsChecking(false);
    }
  };

  if (!content) {
      return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden"> 
    {showCertificateModal && <Confetti recycle={false} numberOfPieces={500} />}
      {/* Header */}
      <div className="h-14 border-b bg-background px-4 flex justify-between items-center shrink-0 z-10">
        <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.push(`/courses/${courseId}`)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Course
            </Button>
            <h2 className="font-medium text-sm">
                {lessonIndex + 1}. {content.title}
            </h2>
        </div>
        
        <div className="flex gap-2">
            {lessonIndex > 0 && (
                <Button variant="outline" size="sm" onClick={() => router.push(`/courses/${courseId}/lessons/${lessonIndex - 1}`)}>
                    Prev
                </Button>
            )}
            {/* Если урок пройден, показываем кнопку Next */}
            {(isCompleted && lessonIndex < totalLessons - 1) && (
                <Button size="sm" onClick={() => router.push(`/courses/${courseId}/lessons/${lessonIndex + 1}`)}>
                    Next Lesson <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            )}
        </div>
      </div>

      {/* DESKTOP VIEW */}
      {/* Main Workspace */}
      <div className="flex-1 overflow-hidden relative">
          
          {/* DESKTOP VIEW */}
          <div className="hidden md:block h-full w-full">
              <ResizablePanelGroup className="h-full w-full border-t">
                
                {/* Left: Content (Markdown) */}
                <ResizablePanel defaultSize={40} minSize={20} className="bg-background">
                  <ScrollArea className="h-full">
                    <div className="p-8 prose dark:prose-invert max-w-none">
                        <ReactMarkdown>{content.markdown}</ReactMarkdown>
                    </div>
                  </ScrollArea>
                </ResizablePanel>

                <ResizableHandle withHandle />

                {/* Right: Code & Terminal */}
                <ResizablePanel defaultSize={60} minSize={30}>
                    <ResizablePanelGroup>
                        
                        {/* Editor */}
                        <ResizablePanel defaultSize={70} minSize={30}>
                            <div className="h-full relative flex flex-col">
                                {isCompleted && (
                                    <div className="absolute top-2 right-4 z-20 bg-green-500/10 text-green-500 px-3 py-1 rounded-full text-xs font-medium border border-green-500/20 flex items-center gap-1 backdrop-blur">
                                        <CheckCircle className="h-3 w-3" /> Completed
                                    </div>
                                )}
                                <CodeEditor 
                                    initialValue={content.initialCode}
                                    language="rust"
                                    onChange={(val) => !isCompleted && setCode(val || "")}
                                    courseId={courseId}
                                    lessonIndex={lessonIndex}
                                    readOnly={isCompleted}
                                />
                            </div>
                        </ResizablePanel>

                        <ResizableHandle withHandle />

                        {/* Terminal */}
                        <ResizablePanel defaultSize={30} minSize={10} className="bg-[#1e1e1e] border-t border-white/10">
                            <div className="flex flex-col h-full">
                                <div className="flex justify-between items-center px-4 py-1.5 bg-[#252526] border-b border-white/5 shrink-0">
                                    <span className="text-[11px] font-mono text-muted-foreground uppercase flex items-center gap-2">
                                        <Terminal className="h-3 w-3" /> Console
                                    </span>
                                    <Button 
                                        size="sm" 
                                        className="h-6 text-[10px] px-3 bg-green-600 hover:bg-green-700 text-white"
                                        onClick={handleCheckCode}
                                        disabled={isChecking || isCompleted}
                                    >
                                        {isChecking ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3 mr-1" />}
                                        {isCompleted ? "DONE" : "RUN"}
                                    </Button>
                                </div>
                                <div className="flex-1 p-3 font-mono text-xs overflow-auto text-gray-300">
                                    {logs.map((log, i) => (
                                        <div key={i} className="mb-1">{log}</div>
                                    ))}
                                    {logs.length === 0 && <span className="text-gray-600 italic">Ready...</span>}
                                </div>
                            </div>
                        </ResizablePanel>

                    </ResizablePanelGroup>
                </ResizablePanel>

              </ResizablePanelGroup>
          </div>
        </div>

      {/* MOBILE VIEW (Tabs) */}
      <div className="md:hidden flex-1 flex flex-col overflow-hidden">
        <Tabs defaultValue="task" className="flex-1 flex flex-col">
            <div className="border-b px-4 bg-background">
                <TabsList className="w-full grid grid-cols-2">
                    <TabsTrigger value="task">Task</TabsTrigger>
                    <TabsTrigger value="code">Editor & Terminal</TabsTrigger>
                </TabsList>
            </div>
            
            <TabsContent value="task" className="flex-1 overflow-auto p-4 m-0">
                <div className="prose dark:prose-invert max-w-none pb-20">
                    <ReactMarkdown>{content.markdown}</ReactMarkdown>
                </div>
            </TabsContent>
            
            <TabsContent value="code" className="flex-1 flex flex-col h-full overflow-hidden m-0">
                <div className="flex-1 relative">
                    <CodeEditor 
                        initialValue={content.initialCode}
                        language="rust"
                        onChange={(val) => !isCompleted && setCode(val || "")}
                        courseId={courseId}
                        lessonIndex={lessonIndex}
                        readOnly={isCompleted}
                    />
                </div>
                {/* Mobile Terminal Panel */}
                <div className="h-1/3 bg-[#1e1e1e] border-t flex flex-col">
                     <div className="flex justify-between items-center p-2 bg-[#252526]">
                        <span className="text-xs text-muted-foreground">TERMINAL</span>
                        <Button size="sm" className="h-6 text-xs" onClick={handleCheckCode} disabled={isChecking || isCompleted}>
                            {isChecking ? "Running..." : "Run"}
                        </Button>
                     </div>
                     <div className="flex-1 p-2 font-mono text-[10px] overflow-auto text-gray-300">
                        {logs.map((l, i) => <div key={i}>{l}</div>)}
                     </div>
                </div>
            </TabsContent>
        </Tabs>
      </div>

      <Dialog open={showCertificateModal} onOpenChange={setShowCertificateModal}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle className="text-center text-2xl">🎉 Course Completed!</DialogTitle>
                <DialogDescription className="text-center">
                    You have mastered the basics of Anchor and earned a verifiable on-chain credential.
                </DialogDescription>
            </DialogHeader>
            <div className="flex justify-center py-4">
                {/* Здесь можно показать превью сертификата */}
                <div className="h-40 w-40 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-2xl flex items-center justify-center text-white font-bold text-4xl">
                    🏆
                </div>
            </div>
            <DialogFooter className="sm:justify-center gap-2">
                <Button variant="outline" onClick={() => setShowCertificateModal(false)}>
                    Close
                </Button>
                <Button className="bg-green-600 hover:bg-green-700" onClick={() => window.open(`/certificates/${certificateId}`, '_blank')}>
                    View Certificate
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}