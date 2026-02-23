// app/src/app/(dashboard)/courses/[courseId]/lessons/[lessonIndex]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import ReactMarkdown from "react-markdown";

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
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="border-b bg-background p-3 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.push(`/courses/${courseId}`)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Course
            </Button>
            <h2 className="font-semibold text-sm md:text-base hidden sm:block">
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
      <div className="hidden md:flex flex-1 overflow-hidden">
          <ResizablePanelGroup>
            
            {/* Left: Content */}
            <ResizablePanel defaultSize={40} minSize={25} maxSize={60}>
              <ScrollArea className="h-full p-6 prose dark:prose-invert max-w-none">
                <ReactMarkdown>{content.markdown}</ReactMarkdown>
              </ScrollArea>
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Right: Editor & Terminal */}
            <ResizablePanel defaultSize={60}>
                <ResizablePanelGroup>
                    
                    {/* Code Editor */}
                    <ResizablePanel defaultSize={75}>
                        <div className="h-full relative">
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

                    <ResizableHandle />

                    {/* Terminal & Actions */}
                    <ResizablePanel defaultSize={25} minSize={10}>
                        <div className="h-full flex flex-col bg-[#1e1e1e] border-t border-white/10">
                            {/* Toolbar */}
                            <div className="flex justify-between items-center px-4 py-2 bg-[#252526] border-b border-white/5">
                                <span className="text-xs font-mono text-muted-foreground flex items-center gap-2">
                                    <Terminal className="h-3 w-3" /> TERMINAL
                                </span>
                                <div className="flex gap-2">
                                    <Button 
                                        size="sm" 
                                        className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white"
                                        onClick={handleCheckCode}
                                        disabled={isChecking || isCompleted}
                                    >
                                        {isChecking ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3 mr-1" />}
                                        {isCompleted ? "Completed" : "Run Tests"}
                                    </Button>
                                </div>
                            </div>
                            
                            {/* Logs Output */}
                            <div className="flex-1 p-4 font-mono text-xs overflow-auto text-gray-300">
                                {logs.length === 0 ? (
                                    <span className="text-gray-600">Click "Run Tests" to verify your solution...</span>
                                ) : (
                                    logs.map((log, i) => (
                                        <div key={i} className="mb-1 break-words">
                                            {log.startsWith("✅") ? <span className="text-green-400">{log}</span> :
                                             log.startsWith("❌") ? <span className="text-red-400">{log}</span> :
                                             log}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </ResizablePanel>

                </ResizablePanelGroup>
            </ResizablePanel>

          </ResizablePanelGroup>
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
    </div>
  );
}