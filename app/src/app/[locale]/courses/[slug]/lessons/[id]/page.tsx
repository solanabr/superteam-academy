"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useRouter, Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { LessonWorkspace } from '@/components/lesson/LessonWorkspace';
import { QuizWorkspace } from '@/components/lesson/QuizWorkspace';
import { ChevronLeft, CheckCircle, Loader2, Menu, X, PlayCircle, Lock } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useGamification } from '@/context/GamificationContext';
import { useWallet } from '@solana/wallet-adapter-react';
import { ProgressService } from '@/services/progress';
import { SolanaService } from '@/services/solana';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { VideoPlayer } from '@/components/lesson/VideoPlayer';
import { LessonSidebar } from '@/components/lesson/LessonSidebar';
import { MarkdownRenderer } from '@/components/lesson/MarkdownRenderer';

// Define minimal types for component props (Client Component needs this)
interface LessonData {
  id: string;
  title: string;
  slug: string;
  type: 'video' | 'text' | 'challenge' | 'quiz';
  content: string;
  videoUrl?: string; // YouTube/Arweave/etc
  xp: number;
  initialCode?: string;
  testCode?: string;
  questions?: {
    question: string;
    options: string[];
    correctAnswer: number;
  }[];
}

interface CourseData {
  title: string;
  slug: string;
  isPublished?: boolean; // Added control flag
  modules: {
      title: string;
      lessons: LessonData[]
  }[];
}

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const { addXP, completedLessons, refreshUser } = useGamification(); 
  const { connected, publicKey: walletPublicKey } = useWallet(); 

  const [course, setCourse] = useState<CourseData | null>(null);
  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Check completion status against global state
  useEffect(() => {
    if (lesson && completedLessons.includes(lesson.id)) {
        setIsCompleted(true);
    }
  }, [lesson, completedLessons]);

  useEffect(() => {
    if (!params.slug || !params.id) return;

    setLoading(true);
    fetch(`/api/courses/${params.slug}/lessons/${params.id}`)
      .then(res => {
          if (!res.ok) throw new Error("Failed to fetch lesson");
          return res.json();
      })
      .then(data => {
          setCourse(data.course);
          setLesson(data.lesson);
      })
      .catch(err => {
          console.error(err);
          toast.error("Failed to load lesson content");
      })
      .finally(() => setLoading(false));
  }, [params.slug, params.id]);

  const getNavigation = () => {
      if (!course || !lesson) return { prev: null, next: null };
      
      const allLessons: LessonData[] = course.modules.flatMap(m => m.lessons);
      const currentIndex = allLessons.findIndex(l => l.id === lesson.id);
      
      return {
          prev: currentIndex > 0 ? allLessons[currentIndex - 1] : null,
          next: currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null
      };
  };

  const { prev, next } = getNavigation();

  // Basic completion (no minting)
  const handleComplete = async () => {
    if (!lesson || !walletPublicKey || isCompleted) return;
    
    setCompleting(true);
    try {
        const result = await ProgressService.completeLesson(walletPublicKey.toString(), lesson.id, lesson.xp);
        addXP(lesson.xp); 
        await refreshUser(); 
        setIsCompleted(true);
        
        // Show on-chain XP feedback
        if (result.mintSuccess) {
            toast.success(`+${lesson.xp} XP minted on-chain! 🎉`, { 
                description: `TX: ${result.mintTx?.slice(0, 20)}...` 
            });
        } else {
            toast.success(`Lesson completed! +${lesson.xp} XP (DB)`, {
                description: "⚠️ On-chain mint failed — XP saved to database only."
            });
        }
        
        if (next && course) {
            setTimeout(() => {
                router.push(`/courses/${course.slug}/lessons/${next.id}`);
            }, 1500);
        }
    } catch (error) {
        console.error(error);
        toast.error("Failed to complete lesson");
    } finally {
        setCompleting(false);
    }
  };

  // Complete AND Mint (Final Step)
  const handleCompleteAndMint = async () => {
    if (!lesson || !walletPublicKey) return;

    setCompleting(true);
    try {
        // 1. Complete Lesson First
        if (!isCompleted) {
             await ProgressService.completeLesson(walletPublicKey.toString(), lesson.id, lesson.xp);
             addXP(lesson.xp);
             await refreshUser();
             setIsCompleted(true);
             toast.success(`Lesson completed! +${lesson.xp} XP`);
        }

        // 2. Mint Credential
        toast.success("Minting Course Credential...");
        const sig = await SolanaService.mintCredential(walletPublicKey.toString(), course!.title, course!.slug);
        
        if (sig) {
            toast.success("Credential Minted on Solana!", { description: "Check your wallet for the cNFT" });
            setTimeout(() => {
                router.push(`/courses`); 
            }, 2500);
        } else {
            toast.error("Minting failed", { description: "Please try again" });
        }

    } catch (error) {
        console.error(error);
        toast.error("Failed to complete & mint");
    } finally {
        setCompleting(false);
    }
  };

  // Redundant mint helper
  const handleMintOnly = async () => {
       if (!course || !walletPublicKey) return;
       toast.loading("Minting...");
       const sig = await SolanaService.mintCredential(walletPublicKey.toString(), course.title, course.slug);
       if (sig) toast.success("Credential Sent!");
  };

  if (loading) {
      return (
          <div className="h-screen w-full flex items-center justify-center bg-[#0A0A0F]">
              <Loader2 className="h-8 w-8 animate-spin text-[#9945FF]" />
          </div>
      );
  }

  if (!lesson || !course) {
      return (
          <div className="h-screen w-full flex flex-col items-center justify-center bg-[#0A0A0F] text-white">
              <h1 className="text-2xl font-bold mb-4">Lesson not found</h1>
              <Button asChild>
                  <Link href="/courses">Back to Courses</Link>
              </Button>
          </div>
      );
  }

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-[#0A0A0F]">
        {/* Left Sidebar (Desktop) */}
        <LessonSidebar 
            courseTitle={course.title}
            slug={course.slug}
            modules={course.modules}
            currentLessonId={lesson.id}
            completedLessons={completedLessons}
        />

        {/* Main Content Area */}
        <div className="flex-grow flex flex-col md:flex-row overflow-hidden relative">
            
            {/* Reading/Content Panel */}
            <div className={cn(
                "flex-1 overflow-y-auto bg-[#0A0A0F] custom-scrollbar relative",
                (lesson.type === 'challenge' || lesson.type === 'quiz') ? "w-full md:w-1/2 lg:w-[40%] border-r border-[#2E2E36]" : "w-full"
            )}>
                <div className="max-w-3xl mx-auto p-8 pb-32">
                     {/* Mobile Header (Title + Sheet Trigger) */}
                     <div className="lg:hidden flex items-center justify-between mb-6">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="outline" size="sm" className="gap-2 border-[#2E2E36] bg-[#1E1E24] text-gray-300">
                                    <Menu className="h-4 w-4" /> Menu
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="bg-[#0A0A0F] border-r border-[#2E2E36] p-0 w-[300px]">
                                <LessonSidebar 
                                    courseTitle={course.title}
                                    slug={course.slug}
                                    modules={course.modules}
                                    currentLessonId={lesson.id}
                                    completedLessons={completedLessons}
                                />
                            </SheetContent>
                        </Sheet>
                     </div>

                    {/* Lesson Header */}
                    <div className="mb-8 border-b border-[#2E2E36] pb-8">
                        <h1 className="text-3xl md:text-4xl font-black text-white mb-4 leading-tight">
                            {lesson.title}
                        </h1>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                           <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#1E1E24] border border-[#2E2E36] text-[#14F195] font-bold">
                              <span>+{lesson.xp} XP</span>
                           </div>
                           <div className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-600" />
                              <span>10 min read</span>
                           </div>
                        </div>
                    </div>
                    
                    {/* Video Player */}
                    {lesson.type === 'video' && lesson.videoUrl && (
                        <div className="mb-8 rounded-2xl overflow-hidden border border-[#2E2E36] shadow-2xl">
                            <VideoPlayer url={lesson.videoUrl} onEnded={() => !isCompleted && handleComplete()} />
                        </div>
                    )}

                    {/* Content */}
                    <MarkdownRenderer content={lesson.content} />

                    {/* Bottom Navigation */}
                    <div className="mt-20 pt-8 border-t border-[#2E2E36] flex items-center justify-between">
                        {prev ? (
                            <Button variant="ghost" asChild className="text-gray-400 hover:text-white">
                                <Link href={`/courses/${course.slug}/lessons/${prev.id}`}>
                                    <ChevronLeft className="h-4 w-4 mr-2" /> Previous
                                </Link>
                            </Button>
                        ) : <div />}

                        {/* Completion Button */}
                        <div className="flex items-center gap-4">
                             {['text', 'video'].includes(lesson.type) && (
                                !isCompleted ? (
                                    <Button 
                                        size="lg"
                                        onClick={next || !course?.isPublished ? handleComplete : handleCompleteAndMint} 
                                        disabled={completing}
                                        className={cn(
                                            "min-w-[160px] font-bold shadow-lg shadow-green-900/20",
                                            !next && course.isPublished 
                                                ? "bg-[#9945FF] hover:bg-[#7a37cc] text-white" 
                                                : "bg-[#14F195] hover:bg-[#10c479] text-black"
                                        )}
                                    >
                                        {completing ? <Loader2 className="h-4 w-4 animate-spin" /> : 
                                            (!next && course.isPublished ? "Complete & Mint 🏆" : "Mark Complete")
                                        }
                                    </Button>
                                ) : (
                                    <div className="flex items-center gap-2 text-[#14F195] font-bold bg-[#14F195]/10 px-4 py-2 rounded-lg border border-[#14F195]/20">
                                        <CheckCircle className="h-5 w-5" /> Completed
                                    </div>
                                )
                             )}
                        </div>

                        {next ? (
                            <Button variant="ghost" asChild className="text-gray-400 hover:text-white">
                                <Link href={`/courses/${course.slug}/lessons/${next.id}`}>
                                    Next <ChevronLeft className="h-4 w-4 ml-2 rotate-180" />
                                </Link>
                            </Button>
                        ) : <div />}
                    </div>
                </div>
            </div>

            {/* Right Panel - Workspace (Challenge/Quiz only) */}
            {(lesson.type === 'challenge' || lesson.type === 'quiz') && (
                <div className="hidden md:flex flex-col w-1/2 lg:w-[60%] bg-[#0A0A0F] h-full">
                     {lesson.type === 'challenge' ? (
                        <LessonWorkspace 
                            initialCode={lesson.initialCode || ''} 
                            testCode={lesson.testCode || ''}
                            onSuccess={handleComplete}
                            lessonTitle={lesson.title}
                            lessonContent={lesson.content}
                            xpReward={lesson.xp}
                        />
                    ) : lesson.type === 'quiz' ? (
                        <div className="hidden md:block h-full border-l border-[#2E2E36]">
                            <QuizWorkspace 
                                questions={lesson.questions || []}
                                onComplete={() => handleComplete()}
                            />
                        </div>
                    ) : null}
                </div>
            )}
        </div>
    </div>
  );
}


