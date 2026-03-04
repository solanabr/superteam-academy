"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  PlayCircle,
  CheckSquare2,
  XSquare,
  Loader2,
  Menu,
  X,
  BookOpen,
} from "lucide-react"
import { toast } from "sonner"
import dynamic from "next/dynamic"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeHighlight from "rehype-highlight"
import "highlight.js/styles/github-dark.css"

// Dynamically import Monaco to avoid SSR issues
const MonacoEditor = dynamic(
  () => import("@monaco-editor/react").then((m) => m.Editor),
  { ssr: false, loading: () => <div className="flex-1 bg-[#1E1E1E] animate-pulse" /> }
)

// Dynamically import YouTube player (BunnyStream available via youtubeVideoId field)
const ReactPlayer = dynamic(() => import("react-youtube"), {
  ssr: false,
  loading: () => <div className="aspect-video bg-card animate-pulse rounded-lg" />,
})

interface Lesson {
  id: string
  name: string
  description: string | null
  youtubeVideoId: string | null
  status: string
  xpReward: number
}

interface SectionLesson {
  id: string
  name: string
  status: string
  isComplete: boolean
}

interface Section {
  id: string
  name: string
  lessons: SectionLesson[]
}

interface LessonViewClientProps {
  courseSlug: string
  courseName: string
  lesson: Lesson
  sections: Section[]
  isComplete: boolean
  canMarkComplete: boolean
  lessonXp: number
  lessonIndex: number
  prevLessonId: string | null
  nextLessonId: string | null
  markCompleteAction: (lessonId: string, complete: boolean, lessonIndex?: number) => Promise<{ error: boolean; message: string }>
}

export function LessonViewClient({
  courseSlug,
  courseName,
  lesson,
  sections,
  isComplete,
  canMarkComplete,
  lessonXp,
  lessonIndex,
  prevLessonId,
  nextLessonId,
  markCompleteAction,
}: LessonViewClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showEditor, setShowEditor] = useState(false)
  const [editorCode, setEditorCode] = useState("// Start coding here\n")
  const [isPending, startTransition] = useTransition()
  const [localComplete, setLocalComplete] = useState(isComplete)

  function handleMarkComplete() {
    startTransition(async () => {
      const result = await markCompleteAction(lesson.id, !localComplete, lessonIndex)
      if (result.error) {
        toast.error("Failed to update lesson status")
      } else {
        setLocalComplete((prev) => !prev)
        if (!localComplete) {
          toast.success(`Lesson complete! +${lessonXp} XP earned`, {
            icon: "⚡",
          })
        }
      }
    })
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] -mx-4 sm:-mx-6 lg:-mx-8 -my-4 sm:-my-6 lg:-my-8 overflow-hidden">
      {/* ── Sidebar ── */}
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-full w-72 bg-card border-r border-border flex flex-col transition-transform duration-200 lg:static lg:translate-x-0 lg:z-auto",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <Link
            href={`/courses/${courseSlug}`}
            className="flex items-center gap-2 text-sm font-semibold hover:text-primary transition-colors line-clamp-1"
          >
            <BookOpen className="w-4 h-4 shrink-0" />
            {courseName}
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sections + Lessons */}
        <div className="flex-1 overflow-y-auto py-2">
          {sections.map((section) => (
            <div key={section.id} className="mb-1">
              <p className="px-4 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {section.name}
              </p>
              {section.lessons.map((l) => {
                const isCurrent = l.id === lesson.id
                return (
                  <Link
                    key={l.id}
                    href={`/courses/${courseSlug}/lessons/${l.id}`}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-2.5 px-4 py-2 text-sm transition-colors",
                      isCurrent
                        ? "bg-primary/15 text-primary border-r-2 border-primary"
                        : "text-muted-foreground hover:bg-muted/20 hover:text-foreground"
                    )}
                  >
                    <span className="shrink-0">
                      {l.isComplete ? (
                        <CheckCircle className="w-3.5 h-3.5 text-primary" />
                      ) : l.status === "preview" ? (
                        <PlayCircle className="w-3.5 h-3.5" />
                      ) : (
                        <PlayCircle className="w-3.5 h-3.5" />
                      )}
                    </span>
                    <span className="line-clamp-2 flex-1">{l.name}</span>
                    {l.status === "preview" && !isCurrent && (
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1 py-0 border-primary/30 text-primary shrink-0"
                      >
                        Free
                      </Badge>
                    )}
                  </Link>
                )
              })}
            </div>
          ))}
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-background/80 backdrop-blur-sm shrink-0 gap-2">
          <div className="flex items-center gap-2">
            {/* Mobile sidebar toggle */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-muted-foreground hover:text-foreground"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Back */}
            <Link
              href={`/courses/${courseSlug}`}
              className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Course
            </Link>

            <span className="text-sm font-semibold line-clamp-1">{lesson.name}</span>

            {lesson.status === "preview" && (
              <Badge
                variant="outline"
                className="text-xs border-primary/30 text-primary hidden sm:flex"
              >
                Preview
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Toggle editor */}
            <Button
              variant="outline"
              size="sm"
              className="text-xs gap-1 hidden sm:flex"
              onClick={() => setShowEditor((v) => !v)}
            >
              {showEditor ? "Hide Editor" : "Open Editor"}
            </Button>

            {/* Mark complete */}
            {canMarkComplete && (
              <Button
                variant={localComplete ? "default" : "outline"}
                size="sm"
                className={cn(
                  "text-xs gap-1",
                  localComplete && "bg-primary border-0 text-white"
                )}
                onClick={handleMarkComplete}
                disabled={isPending}
              >
                {isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : localComplete ? (
                  <CheckSquare2 className="w-3.5 h-3.5" />
                ) : (
                  <XSquare className="w-3.5 h-3.5" />
                )}
                <span className="hidden sm:inline">
                  {localComplete ? "Completed" : "Mark Complete"}
                </span>
              </Button>
            )}

            {/* Navigation */}
            {prevLessonId && (
              <Link href={`/courses/${courseSlug}/lessons/${prevLessonId}`}>
                <Button variant="outline" size="sm" className="text-xs gap-1">
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Prev</span>
                </Button>
              </Link>
            )}
            {nextLessonId && (
              <Link href={`/courses/${courseSlug}/lessons/${nextLessonId}`}>
                <Button variant="outline" size="sm" className="text-xs gap-1">
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Content + Editor split */}
        <div className="flex-1 flex overflow-hidden">
          {/* Lesson content pane */}
          <div
            className={cn(
              "flex flex-col overflow-y-auto transition-all duration-300",
              showEditor ? "w-1/2" : "w-full"
            )}
          >
            {/* Video */}
            {lesson.youtubeVideoId && (
              <div className="relative w-full aspect-video bg-black shrink-0">
                <ReactPlayer
                  videoId={lesson.youtubeVideoId}
                  opts={{
                    width: "100%",
                    height: "100%",
                    playerVars: { autoplay: 0, modestbranding: 1, rel: 0 },
                  }}
                  className="absolute inset-0 w-full h-full"
                  style={{ width: "100%", height: "100%" }}
                />
              </div>
            )}

            {/* Description */}
            <div className="p-4 sm:p-6 space-y-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold mb-2">{lesson.name}</h1>
                {lesson.description && (
                  <div className="prose prose-neutral dark:prose-invert max-w-none
                    prose-headings:font-bold prose-headings:text-foreground
                    prose-h2:text-xl prose-h3:text-lg prose-h3:text-primary/90
                    prose-p:text-muted-foreground prose-p:leading-relaxed
                    prose-strong:text-foreground prose-strong:font-semibold
                    prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                    prose-li:text-muted-foreground prose-li:leading-relaxed
                    prose-th:text-foreground prose-td:text-muted-foreground
                    prose-table:border prose-table:border-border
                    prose-thead:bg-muted/40
                    prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground
                    prose-code:text-primary prose-code:bg-transparent prose-code:font-mono
                    prose-pre:bg-transparent prose-pre:p-0 prose-pre:m-0
                  ">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeHighlight]}
                      components={{
                        pre({ children }) {
                          return (
                            <div className="my-4 rounded-lg overflow-hidden border border-border/40 shadow-sm not-prose">
                              <div className="flex items-center gap-1.5 px-3 py-2 bg-[#161b22] border-b border-border/30">
                                <span className="w-3 h-3 rounded-full bg-red-500/70" />
                                <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
                                <span className="w-3 h-3 rounded-full bg-green-500/70" />
                              </div>
                              <pre className="bg-[#0d1117] overflow-x-auto m-0 rounded-none p-4 text-sm leading-relaxed">
                                {children}
                              </pre>
                            </div>
                          )
                        },
                        code({ className, children, ...props }) {
                          const isBlock = Boolean(className)
                          if (!isBlock) {
                            return (
                              <code
                                className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-[0.85em] font-mono not-prose"
                                {...props}
                              >
                                {children}
                              </code>
                            )
                          }
                          return (
                            <code className={cn("font-mono text-sm", className)} {...props}>
                              {children}
                            </code>
                          )
                        },
                      }}
                    >
                      {lesson.description}
                    </ReactMarkdown>
                  </div>
                )}
              </div>

              {/* XP reward note */}
              <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
                <span className="text-primary text-sm font-medium">
                  ⚡ Complete this lesson to earn {lessonXp} XP
                </span>
              </div>

              {/* Bottom navigation (mobile-friendly) */}
              <div className="pt-4 border-t border-border">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    {prevLessonId && (
                      <Link href={`/courses/${courseSlug}/lessons/${prevLessonId}`}>
                        <Button variant="outline" size="sm" className="gap-1.5">
                          <ChevronLeft className="w-4 h-4" />
                          Previous
                        </Button>
                      </Link>
                    )}
                  </div>
                  <div>
                    {nextLessonId ? (
                      <Link href={`/courses/${courseSlug}/lessons/${nextLessonId}`}>
                        <Button
                          size="sm"
                          className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                          Next
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    ) : (
                      <Link href={`/courses/${courseSlug}`}>
                        <Button
                          size="sm"
                          className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Finish Course
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Monaco Editor pane */}
          {showEditor && (
            <div className="w-1/2 flex flex-col border-l border-border">
              <div className="flex items-center justify-between px-3 py-2 bg-[#1E1E1E] border-b border-border/50 shrink-0">
                <span className="text-xs text-muted-foreground font-mono">playground.ts</span>
                <div className="flex gap-1">
                  <div className="w-3 h-3 rounded-full bg-red-500/70" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                  <div className="w-3 h-3 rounded-full bg-green-500/70" />
                </div>
              </div>
              <div className="flex-1">
                <MonacoEditor
                  height="100%"
                  defaultLanguage="typescript"
                  value={editorCode}
                  onChange={(val) => setEditorCode(val ?? "")}
                  theme="vs-dark"
                  options={{
                    fontSize: 14,
                    fontFamily: "var(--font-geist-mono), 'Fira Code', monospace",
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    lineNumbers: "on",
                    tabSize: 2,
                    wordWrap: "on",
                    automaticLayout: true,
                    padding: { top: 12 },
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
