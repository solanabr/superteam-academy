"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CodeEditor } from "@/components/code-editor";
import type { Lesson } from "@/lib/services/types";
import { LessonSidebar } from "@/components/lesson/lesson-sidebar";
import { LessonContent } from "@/components/lesson/lesson-content";
import { LessonConsole } from "@/components/lesson/lesson-console";
import { LessonEditorToolbar } from "@/components/lesson/lesson-editor-toolbar";
import { LessonReadingContent } from "@/components/lesson/lesson-reading-content";
import { LessonAiMentor } from "@/components/lesson/lesson-ai-mentor";
import { useLessonTests } from "@/components/lesson/use-lesson-tests";
import { useAiChat } from "@/components/lesson/use-ai-chat";

interface LessonWithMeta extends Lesson {
  lessonNumber: number;
}

interface LessonClientProps {
  lesson: Lesson;
  courseSlug: string;
  allLessons: LessonWithMeta[];
  prevLesson?: { id: string; title: string };
  nextLesson?: { id: string; title: string };
  locale?: 'en' | 'pt-BR' | 'es';
}

interface FileTab {
  name: string;
  language: string;
  content: string;
}

export function LessonClient({ lesson, courseSlug, allLessons, prevLesson, nextLesson, locale = 'en' }: LessonClientProps) {
  const t = useTranslations("lesson");
  const localeHook = useLocale();
  const currentLocale = locale || localeHook;

  const [code, setCode] = useState(lesson.starterCode || "");
  const [files, setFiles] = useState<FileTab[]>([
    { name: "solution.ts", language: "typescript", content: lesson.starterCode || "" }
  ]);
  const [activeFile, setActiveFile] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [bottomPanelHeight, setBottomPanelHeight] = useState(200);
  const [leftPanelWidth, setLeftPanelWidth] = useState(30);
  const [isResizingH, setIsResizingH] = useState(false);
  const [isResizingV, setIsResizingV] = useState(false);
  const [isResizingAI, setIsResizingAI] = useState(false);
  const [aiSidebarOpen, setAiSidebarOpen] = useState(false);
  const [aiSidebarWidth, setAiSidebarWidth] = useState(380);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const currentIndex = allLessons.findIndex((l) => l.id === lesson.id);
  const progress = ((currentIndex + 1) / allLessons.length) * 100;

  const { isRunning, testResults, consoleOutput, runTests } = useLessonTests(
    lesson.testCases,
    currentIndex,
    t
  );

  const { chatMessages, chatInput, setChatInput, isAiLoading, sendChatMessage, handleChatSubmit, retryLastMessage } = useAiChat(
    lesson.title,
    currentLocale,
    t
  );

  const allPassed = testResults.length > 0 && testResults.every(r => r.passed);

  const handleCodeChange = useCallback((value: string | undefined) => {
    if (value !== undefined) {
      setCode(value);
      setFiles(files.map((f, i) => i === activeFile ? { ...f, content: value } : f));
    }
  }, [files, activeFile]);

  const handleRunTests = useCallback(async () => {
    const results = await runTests(code);
    if (results && results.length > 0 && results.every(r => r.passed)) {
      setIsCompleted(true);
    }
  }, [code, runTests]);

  const handleSendChatMessage = useCallback((message: string) => {
    sendChatMessage(message, code);
  }, [code, sendChatMessage]);

  const handleChatSubmitWithCode = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    handleSendChatMessage(chatInput);
  }, [chatInput, handleSendChatMessage]);

  const handleMarkComplete = () => {
    setIsCompleted(true);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleMouseMoveH = useCallback((e: React.MouseEvent) => {
    if (!isResizingH || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const newWidth = ((e.clientX - rect.left) / rect.width) * 100;
    setLeftPanelWidth(Math.min(Math.max(newWidth, 20), 50));
  }, [isResizingH]);

  const handleMouseMoveV = useCallback((e: React.MouseEvent) => {
    if (!isResizingV || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const newHeight = rect.bottom - e.clientY;
    setBottomPanelHeight(Math.min(Math.max(newHeight, 100), 400));
  }, [isResizingV]);

  const handleMouseMoveAI = useCallback((e: React.MouseEvent) => {
    if (!isResizingAI || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const newWidth = rect.right - e.clientX;
    setAiSidebarWidth(Math.min(Math.max(newWidth, 320), 500));
  }, [isResizingAI]);

  const handleMouseUp = useCallback(() => {
    setIsResizingH(false);
    setIsResizingV(false);
    setIsResizingAI(false);
  }, []);

  useEffect(() => {
    if (isResizingH || isResizingV || isResizingAI) {
      document.addEventListener("mouseup", handleMouseUp);
      return () => document.removeEventListener("mouseup", handleMouseUp);
    }
  }, [isResizingH, isResizingV, isResizingAI, handleMouseUp]);

  if (lesson.type === "reading") {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden bg-background">
        <LessonSidebar
          courseSlug={courseSlug}
          currentLocale={currentLocale}
          allLessons={allLessons}
          lesson={lesson}
          currentIndex={currentIndex}
          progress={progress}
          prevLesson={prevLesson}
          nextLesson={nextLesson}
          isSidebarCollapsed={isSidebarCollapsed}
          setIsSidebarCollapsed={setIsSidebarCollapsed}
          t={t}
        />
        <LessonReadingContent
          lesson={lesson}
          courseSlug={courseSlug}
          currentLocale={currentLocale}
          currentIndex={currentIndex}
          allLessonsLength={allLessons.length}
          prevLesson={prevLesson}
          nextLesson={nextLesson}
          t={t}
        />
      </div>
    );
  }

  return (
    <div 
      className={`flex h-[calc(100vh-3.5rem)] overflow-hidden bg-background ${isResizingH || isResizingV || isResizingAI ? 'select-none' : ''}`}
      ref={containerRef}
      onMouseMove={isResizingH ? handleMouseMoveH : isResizingV ? handleMouseMoveV : isResizingAI ? handleMouseMoveAI : undefined}
    >
      <LessonSidebar
        courseSlug={courseSlug}
        currentLocale={currentLocale}
        allLessons={allLessons}
        lesson={lesson}
        currentIndex={currentIndex}
        progress={progress}
        prevLesson={prevLesson}
        nextLesson={nextLesson}
        isSidebarCollapsed={isSidebarCollapsed}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
        t={t}
      />

      <div className="flex-1 flex flex-row overflow-hidden">
        <LessonContent
          lesson={lesson}
          isCompleted={isCompleted}
          leftPanelWidth={leftPanelWidth}
          t={t}
        />

        <div className="w-1 bg-border/50 hover:bg-primary/50 cursor-col-resize flex-shrink-0 transition-colors relative z-10" onMouseDown={() => setIsResizingH(true)} />

        <div className="flex-1 flex flex-col overflow-hidden">
          <LessonEditorToolbar
            files={files}
            activeFile={activeFile}
            setActiveFile={setActiveFile}
            isRunning={isRunning}
            isCompleted={isCompleted}
            allPassed={allPassed}
            aiSidebarOpen={aiSidebarOpen}
            runTests={handleRunTests}
            handleMarkComplete={handleMarkComplete}
            setAiSidebarOpen={setAiSidebarOpen}
            t={t}
          />

          <div className="flex-1 overflow-hidden">
            <CodeEditor
              value={files[activeFile].content}
              onChange={handleCodeChange}
              language="typescript"
            />
          </div>

          <div className="h-1 bg-border/50 hover:bg-primary/50 cursor-row-resize flex-shrink-0 transition-colors relative z-10" onMouseDown={() => setIsResizingV(true)} />

          <LessonConsole
            bottomPanelHeight={bottomPanelHeight}
            testResults={testResults}
            consoleOutput={consoleOutput}
            allPassed={allPassed}
            t={t}
          />
        </div>

        <LessonAiMentor
          aiSidebarOpen={aiSidebarOpen}
          setAiSidebarOpen={setAiSidebarOpen}
          aiSidebarWidth={aiSidebarWidth}
          setIsResizingAI={setIsResizingAI}
          chatMessages={chatMessages}
          chatInput={chatInput}
          setChatInput={setChatInput}
          handleChatSubmit={handleChatSubmitWithCode}
          code={code}
          isAiLoading={isAiLoading}
          retryLastMessage={retryLastMessage}
          chatEndRef={chatEndRef}
          t={t}
        />
      </div>
    </div>
  );
}
