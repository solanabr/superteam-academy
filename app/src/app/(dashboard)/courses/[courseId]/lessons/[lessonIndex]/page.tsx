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
import { toast } from "sonner";
import { Loader2, CheckCircle, ArrowRight, AlertTriangle } from "lucide-react";

// Импортируем наш контент
import { getLessonContent, LessonContent } from "@/lib/course-content";

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const { publicKey } = useWallet();

  const courseId = params.courseId as string;
  const lessonIndex = parseInt(params.lessonIndex as string);

  // Состояние контента
  const [content, setContent] = useState<LessonContent | null>(null);
  const [code, setCode] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // 1. Загрузка данных урока
  useEffect(() => {
    const lessonData = getLessonContent(courseId, lessonIndex);
    if (lessonData) {
      setContent(lessonData);
      setCode(lessonData.initialCode);
    } else {
      toast.error("Lesson not found");
      // Можно редиректнуть обратно к курсам
      // router.push("/courses");
    }
  }, [courseId, lessonIndex]);

  const handleCheckCode = async () => {
    if (!publicKey) {
      toast.error("Wallet not connected", {
        description: "Please connect your Solana wallet first",
      });
      return;
    }

    if (!content) return;

    setIsChecking(true);

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

      setIsSuccess(true);
      toast.success("Lesson completed!", {
        description: `Transaction: ${data.txSignature.slice(0, 8)}...`,
        action: {
          label: "Explorer",
          onClick: () => window.open(`https://explorer.solana.com/tx/${data.txSignature}?cluster=devnet`, "_blank"),
        },
      });

    } catch (error: any) {
      console.error("Check failed:", error);
      toast.error("Verification failed", {
        description: error.message || "Something went wrong.",
      });
    } finally {
      setIsChecking(false);
    }
  };

  if (!content) {
      return (
          <div className="flex h-screen items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
      );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      <div className="border-b bg-background p-4 flex justify-between items-center">
        <h2 className="font-semibold flex items-center gap-2">
            <span className="text-muted-foreground">Lesson {lessonIndex + 1}:</span> 
            {content.title}
        </h2>
        <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push("/dashboard")}>
                Exit
            </Button>
            {isSuccess && (
                <Button size="sm" onClick={() => router.push(`/courses/${courseId}/lessons/${lessonIndex + 1}`)}>
                    Next Lesson <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            )}
        </div>
      </div>

      <ResizablePanelGroup className="flex-1">
        
        <ResizablePanel defaultSize={40} minSize={30}>
          <ScrollArea className="h-full p-6 prose dark:prose-invert max-w-none">
            <ReactMarkdown>{content.markdown}</ReactMarkdown>
          </ScrollArea>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={60}>
            <div className="h-full flex flex-col">
                <div className="flex-1">
                    <CodeEditor 
                        initialValue={content.initialCode}
                        language="rust"
                        onChange={(val) => setCode(val || "")}
                        courseId={courseId}
                        lessonIndex={lessonIndex}
                    />
                </div>
                
                <div className="border-t bg-background p-4 flex justify-end gap-4">
                    <Button 
                        onClick={handleCheckCode} 
                        disabled={isChecking || isSuccess}
                        className={isSuccess ? "bg-green-600 hover:bg-green-700" : ""}
                    >
                        {isChecking ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Verifying...
                            </>
                        ) : isSuccess ? (
                            <>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Completed!
                            </>
                        ) : (
                            "Check Answer"
                        )}
                    </Button>
                </div>
            </div>
        </ResizablePanel>

      </ResizablePanelGroup>
    </div>
  );
}