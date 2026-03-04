"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ChallengeEditor } from "@/components/lesson/challenge-editor";
import { LessonExamCard } from "@/components/lesson/lesson-exam-card";

type Props = {
  lessonId: string;
  lessonTitle: string;
  lessonType: "content" | "challenge";
  lessonMarkdown: string;
  starterCode: string;
  testCases: string[];
  exam?: {
    question: string;
    options: string[];
    correctOptionIndex: number;
  };
};

function extractYouTubeEmbed(markdown: string) {
  const watchMatch = markdown.match(/https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([A-Za-z0-9_-]{11})(?:&t=([0-9]+)s?)?/);
  const shortMatch = markdown.match(/https?:\/\/(?:www\.)?youtu\.be\/([A-Za-z0-9_-]{11})(?:\?t=([0-9]+)s?)?/);

  const videoId = watchMatch?.[1] ?? shortMatch?.[1] ?? null;
  const startTime = watchMatch?.[2] ?? shortMatch?.[2] ?? null;

  if (!videoId) return null;
  return startTime ? `https://www.youtube.com/embed/${videoId}?start=${startTime}` : `https://www.youtube.com/embed/${videoId}`;
}

export function LessonWorkspace(props: Props) {
  const { lessonId, lessonTitle, lessonType, lessonMarkdown, starterCode, testCases, exam } = props;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [leftWidthPct, setLeftWidthPct] = useState(58);
  const [dragging, setDragging] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const hasInteractivePane = lessonType === "challenge" || Boolean(exam);

  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 1024);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!dragging) return;
    const onMove = (event: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const rawPct = ((event.clientX - rect.left) / rect.width) * 100;
      const clamped = Math.max(38, Math.min(72, rawPct));
      setLeftWidthPct(clamped);
    };
    const onUp = () => setDragging(false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [dragging]);

  const videoEmbedUrl = useMemo(() => extractYouTubeEmbed(lessonMarkdown), [lessonMarkdown]);
  const lessonBody = useMemo(
    () => lessonMarkdown.replace(/^Video:\s*https?:\/\/[^\s]+\s*/i, "").trim(),
    [lessonMarkdown],
  );
  const challengeHints = useMemo(() => {
    if (lessonType !== "challenge") return [];
    if (testCases.length > 0) {
      return testCases.slice(0, 3).map((test, index) => `Hint ${index + 1}: satisfy test -> ${test}`);
    }
    return [
      "Read the prompt carefully and map inputs to expected output first.",
      "Start with a minimal working function, then add edge-case handling.",
      "Run tests frequently after each small change.",
    ];
  }, [lessonType, testCases]);
  const solutionPreview = useMemo(() => {
    if (lessonType !== "challenge") return "";
    if (!starterCode.trim()) return "// No starter code available for this lesson.";
    return starterCode
      .split("\n")
      .slice(0, 18)
      .join("\n");
  }, [lessonType, starterCode]);

  if (!hasInteractivePane || !isDesktop) {
    return (
      <div className="flex flex-col mx-auto p-4 md:p-8 max-w-[1200px] w-full">
        <div className="w-full aspect-video shrink-0 rounded-[16px] md:rounded-[24px] overflow-hidden bg-black border border-white/10 shadow-2xl mb-8 relative">
          {videoEmbedUrl ? (
            <iframe
              src={videoEmbedUrl}
              title={`${lessonTitle} video`}
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-white/30">No video available</div>
          )}
        </div>

        {lessonBody && (
          <div className="bg-surface shrink-0 border border-white/5 rounded-[24px] p-6 md:p-8 mb-8">
            <h3 className="text-[18px] font-semibold tracking-tight text-white mb-4">Instructor Notes</h3>
            <div className="prose prose-invert prose-lg max-w-none text-white/70 prose-p:leading-relaxed prose-pre:bg-white/5 prose-pre:border prose-pre:border-white/10 prose-headings:text-white prose-a:text-blue-400">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{lessonBody}</ReactMarkdown>
            </div>
          </div>
        )}

        {lessonType === "challenge" ? (
          <div className="flex flex-col w-full shrink-0">
            <h3 className="text-[20px] font-semibold tracking-tight text-white mb-4">Interactive Challenge</h3>
            <ChallengeEditor key={lessonId} lessonId={lessonId} starterCode={starterCode} tests={testCases} />
            <div className="mt-5 rounded-[16px] border border-white/10 bg-surface p-4">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setShowHints((prev) => !prev)}
                  className="rounded-full border border-white/15 px-3 py-1 text-[12px] font-semibold text-white/80 hover:bg-white/5"
                >
                  {showHints ? "Hide hints" : "Show hints"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowSolution((prev) => !prev)}
                  className="rounded-full border border-white/15 px-3 py-1 text-[12px] font-semibold text-white/80 hover:bg-white/5"
                >
                  {showSolution ? "Hide solution" : "Show solution"}
                </button>
              </div>
              {showHints ? (
                <ul className="mt-3 space-y-2 text-[13px] text-white/75">
                  {challengeHints.map((hint) => (
                    <li key={hint}>{hint}</li>
                  ))}
                </ul>
              ) : null}
              {showSolution ? (
                <pre className="mt-3 overflow-x-auto rounded-[12px] border border-white/10 bg-black/40 p-3 text-[12px] text-white/80">
                  <code>{solutionPreview}</code>
                </pre>
              ) : null}
            </div>
          </div>
        ) : exam ? (
          <div className="shrink-0 mb-8">
            <LessonExamCard
              lessonId={lessonId}
              question={exam.question}
              options={exam.options}
              correctOptionIndex={exam.correctOptionIndex}
            />
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="h-full w-full flex overflow-hidden">
      <div style={{ width: `${leftWidthPct}%` }} className="h-full min-w-0 overflow-y-auto p-6 lg:p-8">
        <div className="w-full aspect-video rounded-[20px] overflow-hidden bg-black border border-white/10 shadow-2xl mb-8 relative">
          {videoEmbedUrl ? (
            <iframe
              src={videoEmbedUrl}
              title={`${lessonTitle} video`}
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-white/30">No video available</div>
          )}
        </div>
        {lessonBody && (
          <div className="bg-surface border border-white/10 rounded-[20px] p-6">
            <h3 className="text-[18px] font-semibold tracking-tight text-white mb-4">Instructor Notes</h3>
            <div className="prose prose-invert prose-lg max-w-none text-white/70 prose-p:leading-relaxed prose-pre:bg-white/5 prose-pre:border prose-pre:border-white/10 prose-headings:text-white prose-a:text-blue-400">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{lessonBody}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>

      <div
        role="separator"
        aria-orientation="vertical"
        className={`w-2 shrink-0 cursor-col-resize bg-white/5 hover:bg-white/20 transition-colors ${dragging ? "bg-white/30" : ""}`}
        onMouseDown={() => setDragging(true)}
      />

      <div style={{ width: `${100 - leftWidthPct}%` }} className="h-full min-w-[360px] overflow-y-auto p-6 lg:p-8">
        {lessonType === "challenge" ? (
          <>
            <h3 className="text-[18px] font-semibold tracking-tight text-white mb-4">Interactive Challenge</h3>
            <ChallengeEditor key={lessonId} lessonId={lessonId} starterCode={starterCode} tests={testCases} />
            <div className="mt-5 rounded-[16px] border border-white/10 bg-surface p-4 text-[14px] text-white/70">
              Drag the divider to resize panes. Pass all tests to unlock <span className="text-white font-semibold">Mark as complete</span>.
            </div>
            <div className="mt-3 rounded-[16px] border border-white/10 bg-surface p-4">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setShowHints((prev) => !prev)}
                  className="rounded-full border border-white/15 px-3 py-1 text-[12px] font-semibold text-white/80 hover:bg-white/5"
                >
                  {showHints ? "Hide hints" : "Show hints"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowSolution((prev) => !prev)}
                  className="rounded-full border border-white/15 px-3 py-1 text-[12px] font-semibold text-white/80 hover:bg-white/5"
                >
                  {showSolution ? "Hide solution" : "Show solution"}
                </button>
              </div>
              {showHints ? (
                <ul className="mt-3 space-y-2 text-[13px] text-white/75">
                  {challengeHints.map((hint) => (
                    <li key={hint}>{hint}</li>
                  ))}
                </ul>
              ) : null}
              {showSolution ? (
                <pre className="mt-3 overflow-x-auto rounded-[12px] border border-white/10 bg-black/40 p-3 text-[12px] text-white/80">
                  <code>{solutionPreview}</code>
                </pre>
              ) : null}
            </div>
          </>
        ) : exam ? (
          <>
            <h3 className="text-[18px] font-semibold tracking-tight text-white mb-4">Lesson Exam</h3>
            <LessonExamCard
              lessonId={lessonId}
              question={exam.question}
              options={exam.options}
              correctOptionIndex={exam.correctOptionIndex}
            />
          </>
        ) : null}
      </div>
    </div>
  );
}

