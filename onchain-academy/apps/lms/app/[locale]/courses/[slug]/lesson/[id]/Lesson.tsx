'use client'

import type {
  CodeChallenge,
  ContentBlock,
  LessonContent,
  Quiz,
  QuizQuestion,
} from '@/libs/constants/lesson.constants'
import {
  getLessonNav,
  lessonContents,
  lessonOrder,
} from '@/libs/constants/lesson.constants'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronLeft,
  Code,
  Eye,
  EyeOff,
  FileText,
  Info,
  Lightbulb,
  Loader2,
  Menu,
  Play,
  Sparkles,
  Trophy,
  Video,
  X,
  Zap,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

// ─── CodeMirror (lazy) ─────────────────────────────────────────

import { StandardLayout } from '@/components/layout/StandardLayout'
import { defaultKeymap } from '@codemirror/commands'
import { javascript } from '@codemirror/lang-javascript'
import { json } from '@codemirror/lang-json'
import { rust } from '@codemirror/lang-rust'
import { EditorState } from '@codemirror/state'
import { oneDark } from '@codemirror/theme-one-dark'
import { EditorView, keymap, lineNumbers } from '@codemirror/view'

// ─── Helpers ───────────────────────────────────────────────────

function getLangExtension(lang: string) {
  switch (lang) {
    case 'rust':
      return rust()
    case 'typescript':
    case 'javascript':
      return javascript({ typescript: lang === 'typescript' })
    case 'json':
      return json()
    default:
      return javascript({ typescript: true })
  }
}

const lessonTypeIcon = (type: string) => {
  switch (type) {
    case 'video':
      return <Video size={14} strokeWidth={1.5} />
    case 'reading':
      return <FileText size={14} strokeWidth={1.5} />
    case 'code_challenge':
      return <Code size={14} strokeWidth={1.5} />
    case 'quiz':
      return <BookOpen size={14} strokeWidth={1.5} />
    case 'hybrid':
      return <Play size={14} strokeWidth={1.5} />
    default:
      return <FileText size={14} strokeWidth={1.5} />
  }
}

// ─── Markdown Renderer ─────────────────────────────────────────
// Simple but effective — handles headers, code blocks, bold, links,
// tables, lists, and blockquotes. No external deps.

function MarkdownRenderer({ content }: { content: string }) {
  const html = useMemo(() => {
    let result = content

    // Code blocks (fenced)
    result = result.replace(
      /```(\w*)\n([\s\S]*?)```/g,
      (_, lang, code) =>
        `<pre class="code-block" data-lang="${lang}"><code>${code
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')}</code></pre>`,
    )

    // Inline code
    result = result.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')

    // Tables
    result = result.replace(
      /\|(.+)\|\n\|[-| ]+\|\n((?:\|.+\|\n?)*)/g,
      (_, header, body) => {
        const ths = header
          .split('|')
          .filter((s: string) => s.trim())
          .map((h: string) => `<th>${h.trim()}</th>`)
          .join('')
        const rows = body
          .trim()
          .split('\n')
          .map((row: string) => {
            const tds = row
              .split('|')
              .filter((s: string) => s.trim())
              .map((c: string) => `<td>${c.trim()}</td>`)
              .join('')
            return `<tr>${tds}</tr>`
          })
          .join('')
        return `<table class="md-table"><thead><tr>${ths}</tr></thead><tbody>${rows}</tbody></table>`
      },
    )

    // Headers
    result = result.replace(/^### (.+)$/gm, '<h3 class="md-h3">$1</h3>')
    result = result.replace(/^## (.+)$/gm, '<h2 class="md-h2">$1</h2>')
    result = result.replace(/^# (.+)$/gm, '<h1 class="md-h1">$1</h1>')

    // Bold + italic
    result = result.replace(
      /\*\*\*(.+?)\*\*\*/g,
      '<strong><em>$1</em></strong>',
    )
    result = result.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    result = result.replace(/\*(.+?)\*/g, '<em>$1</em>')

    // Links
    result = result.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener" class="md-link">$1</a>',
    )

    // Lists
    result = result.replace(/^- (.+)$/gm, '<li class="md-li">$1</li>')
    result = result.replace(
      /^(\d+)\. (.+)$/gm,
      '<li class="md-li md-ol">$2</li>',
    )

    // Blockquotes
    result = result.replace(
      /^> (.+)$/gm,
      '<blockquote class="md-bq">$1</blockquote>',
    )

    // Paragraphs — wrap remaining non-HTML lines
    result = result.replace(
      /^(?!<[huplbtd]|<\/|<li|<pre|<code|<table|<block)(.+)$/gm,
      '<p class="md-p">$1</p>',
    )

    return result
  }, [content])

  return (
    <div className='markdown-body' dangerouslySetInnerHTML={{ __html: html }} />
  )
}

// ─── Code Editor ───────────────────────────────────────────────

function CodeEditor({
  code,
  language,
  onChange,
  readOnly = false,
}: {
  code: string
  language: string
  onChange?: (value: string) => void
  readOnly?: boolean
}) {
  const editorRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)

  useEffect(() => {
    if (!editorRef.current) return

    const state = EditorState.create({
      doc: code,
      extensions: [
        lineNumbers(),
        getLangExtension(language),
        oneDark,
        keymap.of(defaultKeymap),
        EditorView.theme({
          '&': {
            fontSize: '13px',
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          },
          '.cm-content': { padding: '16px 0' },
          '.cm-gutters': {
            background: 'hsl(137 41% 9%)',
            border: 'none',
          },
          '.cm-activeLineGutter': {
            background: 'rgba(82,221,160,0.08)',
          },
          '.cm-activeLine': {
            background: 'rgba(82,221,160,0.04)',
          },
        }),
        EditorView.updateListener.of((update) => {
          if (update.docChanged && onChange) {
            onChange(update.state.doc.toString())
          }
        }),
        ...(readOnly ? [EditorState.readOnly.of(true)] : []),
      ],
    })

    const view = new EditorView({ state, parent: editorRef.current })
    viewRef.current = view

    return () => {
      view.destroy()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language])

  return (
    <div
      ref={editorRef}
      className='w-full h-full overflow-auto rounded-lg'
      style={{ background: 'hsl(137 41% 9%)' }}
    />
  )
}

// ─── Content Block Renderer ────────────────────────────────────

function BlockRenderer({ block }: { block: ContentBlock }) {
  if (block.type === 'markdown') {
    return <MarkdownRenderer content={block.content} />
  }

  if (block.type === 'video') {
    return (
      <div className='my-4'>
        {block.title && (
          <p className='font-ui text-[0.7rem] text-text-tertiary mb-2 flex items-center gap-1.5'>
            <Video size={12} strokeWidth={1.5} />
            {block.title}
          </p>
        )}
        <div
          className='relative w-full rounded-xl overflow-hidden border border-border-warm'
          style={{ paddingBottom: '56.25%' }}
        >
          <iframe
            src={block.url}
            title={block.title || 'Video'}
            allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
            allowFullScreen
            className='absolute inset-0 w-full h-full'
          />
        </div>
      </div>
    )
  }

  if (block.type === 'callout') {
    const styles = {
      info: {
        bg: 'hsl(var(--green-primary) / 0.06)',
        border: 'hsl(var(--green-primary) / 0.2)',
        icon: (
          <Info size={16} strokeWidth={1.5} className='text-green-primary' />
        ),
        color: 'text-green-primary',
      },
      warning: {
        bg: 'hsl(var(--amber) / 0.08)',
        border: 'hsl(var(--amber) / 0.25)',
        icon: (
          <AlertTriangle
            size={16}
            strokeWidth={1.5}
            className='text-amber-dark'
          />
        ),
        color: 'text-amber-dark',
      },
      tip: {
        bg: 'hsl(var(--green-mint) / 0.06)',
        border: 'hsl(var(--green-mint) / 0.2)',
        icon: (
          <Lightbulb size={16} strokeWidth={1.5} className='text-green-mint' />
        ),
        color: 'text-green-mint',
      },
    }
    const s = styles[block.variant]

    return (
      <div
        className='my-4 p-4 rounded-xl flex items-start gap-3'
        style={{ background: s.bg, border: `1px solid ${s.border}` }}
      >
        <div className='flex-shrink-0 mt-0.5'>{s.icon}</div>
        <div className='font-ui text-[0.8rem] text-text-secondary leading-relaxed'>
          <MarkdownRenderer content={block.content} />
        </div>
      </div>
    )
  }

  return null
}

// ─── Quiz Panel ────────────────────────────────────────────────

function QuizPanel({
  quiz,
  onComplete,
}: {
  quiz: Quiz
  onComplete: () => void
}) {
  const [answers, setAnswers] = useState<
    Record<string, number | number[] | string>
  >({})
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)

  const handleRadio = (qId: string, idx: number) => {
    if (submitted) return
    setAnswers((a) => ({ ...a, [qId]: idx }))
  }

  const handleCheckbox = (qId: string, idx: number) => {
    if (submitted) return
    setAnswers((a) => {
      const current = (a[qId] as number[]) || []
      return {
        ...a,
        [qId]: current.includes(idx)
          ? current.filter((i) => i !== idx)
          : [...current, idx],
      }
    })
  }

  const handleSubmit = () => {
    let correct = 0
    for (const q of quiz.questions) {
      if (q.type === 'radio' && answers[q.id] === q.correctIndex) correct++
      if (q.type === 'checkbox') {
        const ans = (answers[q.id] as number[]) || []
        const expected = q.correctIndices || []
        if (
          ans.length === expected.length &&
          ans.every((a) => expected.includes(a))
        )
          correct++
      }
      if (q.type === 'code') {
        const ans = (answers[q.id] as string) || ''
        if (ans.trim().includes((q.expected || '').trim())) correct++
      }
    }
    setScore(correct)
    setSubmitted(true)
    if (correct === quiz.questions.length) {
      setTimeout(onComplete, 1500)
    }
  }

  return (
    <div className='flex flex-col gap-5'>
      {quiz.questions.map((q, qi) => (
        <QuizQuestionCard
          key={q.id}
          question={q}
          index={qi}
          answer={answers[q.id]}
          submitted={submitted}
          onRadio={handleRadio}
          onCheckbox={handleCheckbox}
          onCode={(val) => setAnswers((a) => ({ ...a, [q.id]: val }))}
        />
      ))}

      {!submitted ? (
        <button
          onClick={handleSubmit}
          disabled={Object.keys(answers).length < quiz.questions.length}
          className='w-full font-ui text-[0.85rem] font-semibold px-4 py-3 rounded-xl bg-green-primary text-cream hover:bg-green-dark transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer'
        >
          Submit Answers
        </button>
      ) : (
        <div
          className='p-5 rounded-xl text-center'
          style={{
            background:
              score === quiz.questions.length
                ? 'hsl(var(--green-primary) / 0.08)'
                : 'hsl(var(--amber) / 0.08)',
            border: `1px solid ${
              score === quiz.questions.length
                ? 'hsl(var(--green-primary) / 0.25)'
                : 'hsl(var(--amber) / 0.25)'
            }`,
          }}
        >
          <div className='text-[2rem] mb-2'>
            {score === quiz.questions.length ? '🎉' : '📝'}
          </div>
          <div className='font-display text-[1.2rem] font-bold text-charcoal'>
            {score}/{quiz.questions.length} Correct
          </div>
          <p className='font-ui text-[0.76rem] text-text-secondary mt-1'>
            {score === quiz.questions.length
              ? 'Perfect score! Lesson completed.'
              : 'Review the incorrect answers and try again.'}
          </p>
          {score < quiz.questions.length && (
            <button
              onClick={() => {
                setSubmitted(false)
                setAnswers({})
                setScore(0)
              }}
              className='mt-3 font-ui text-[0.78rem] font-semibold px-4 py-2 rounded-lg border border-border-warm text-charcoal hover:border-green-primary transition-colors cursor-pointer'
            >
              Try Again
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function QuizQuestionCard({
  question: q,
  index,
  answer,
  submitted,
  onRadio,
  onCheckbox,
  onCode,
}: {
  question: QuizQuestion
  index: number
  answer: number | number[] | string | undefined
  submitted: boolean
  onRadio: (qId: string, idx: number) => void
  onCheckbox: (qId: string, idx: number) => void
  onCode: (val: string) => void
}) {
  const isCorrect = useMemo(() => {
    if (!submitted) return null
    if (q.type === 'radio') return answer === q.correctIndex
    if (q.type === 'checkbox') {
      const ans = (answer as number[]) || []
      const expected = q.correctIndices || []
      return (
        ans.length === expected.length && ans.every((a) => expected.includes(a))
      )
    }
    if (q.type === 'code') {
      return ((answer as string) || '')
        .trim()
        .includes((q.expected || '').trim())
    }
    return false
  }, [submitted, q, answer])

  return (
    <div
      className='p-5 rounded-xl border transition-all'
      style={{
        background: 'hsl(var(--card-warm))',
        borderColor: submitted
          ? isCorrect
            ? 'hsl(var(--green-primary) / 0.35)'
            : 'hsl(var(--amber) / 0.35)'
          : 'hsl(var(--border-warm))',
      }}
    >
      <div className='flex items-start gap-3 mb-3'>
        <span
          className='w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 font-ui text-[0.65rem] font-bold'
          style={{
            background: submitted
              ? isCorrect
                ? 'hsl(var(--green-primary) / 0.12)'
                : 'hsl(var(--amber) / 0.12)'
              : 'rgba(139,109,56,0.08)',
            color: submitted
              ? isCorrect
                ? 'hsl(var(--green-primary))'
                : 'hsl(var(--amber-dark))'
              : 'hsl(var(--text-tertiary))',
          }}
        >
          {submitted ? (
            isCorrect ? (
              <Check size={13} strokeWidth={2.5} />
            ) : (
              <X size={13} strokeWidth={2.5} />
            )
          ) : (
            index + 1
          )}
        </span>
        <div>
          <p className='font-ui text-[0.82rem] font-medium text-charcoal'>
            {q.prompt}
          </p>
          {q.type === 'checkbox' && (
            <p className='font-ui text-[0.6rem] text-text-tertiary mt-0.5'>
              Select all that apply
            </p>
          )}
        </div>
      </div>

      {(q.type === 'radio' || q.type === 'checkbox') && q.options && (
        <div className='flex flex-col gap-1.5 ml-9'>
          {q.options.map((opt, oi) => {
            const selected =
              q.type === 'radio'
                ? answer === oi
                : ((answer as number[]) || []).includes(oi)
            const correctOpt =
              q.type === 'radio'
                ? q.correctIndex === oi
                : (q.correctIndices || []).includes(oi)

            return (
              <button
                key={oi}
                onClick={() =>
                  q.type === 'radio' ? onRadio(q.id, oi) : onCheckbox(q.id, oi)
                }
                disabled={submitted}
                className='flex items-center gap-2.5 p-3 rounded-lg border text-left transition-all cursor-pointer disabled:cursor-default'
                style={{
                  background: submitted
                    ? correctOpt
                      ? 'hsl(var(--green-primary) / 0.06)'
                      : selected && !correctOpt
                        ? 'hsl(var(--amber) / 0.06)'
                        : 'transparent'
                    : selected
                      ? 'hsl(var(--green-primary) / 0.06)'
                      : 'transparent',
                  borderColor: submitted
                    ? correctOpt
                      ? 'hsl(var(--green-primary) / 0.3)'
                      : selected && !correctOpt
                        ? 'hsl(var(--amber) / 0.3)'
                        : 'hsl(var(--border-warm))'
                    : selected
                      ? 'hsl(var(--green-primary) / 0.3)'
                      : 'hsl(var(--border-warm))',
                }}
              >
                <div
                  className='w-4 h-4 flex-shrink-0 border-2 flex items-center justify-center'
                  style={{
                    borderRadius: q.type === 'radio' ? '50%' : '4px',
                    borderColor: selected
                      ? 'hsl(var(--green-primary))'
                      : 'hsl(var(--charcoal) / 0.2)',
                    background: selected
                      ? 'hsl(var(--green-primary))'
                      : 'transparent',
                  }}
                >
                  {selected && (
                    <Check size={10} strokeWidth={3} className='text-cream' />
                  )}
                </div>
                <span className='font-ui text-[0.76rem] text-text-secondary'>
                  {opt}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {q.type === 'code' && (
        <div className='ml-9 mt-2'>
          <div className='h-[140px] rounded-lg overflow-hidden'>
            <CodeEditor
              code={q.starterCode || ''}
              language={q.language || 'rust'}
              onChange={onCode}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Challenge Panel ───────────────────────────────────────────

function ChallengePanel({
  challenge,
  onComplete,
}: {
  challenge: CodeChallenge
  onComplete: () => void
}) {
  const [code, setCode] = useState(challenge.starterCode)
  const [running, setRunning] = useState(false)
  const [output, setOutput] = useState<string | null>(null)
  const [tests, setTests] = useState(challenge.testCases)
  const [allPassed, setAllPassed] = useState(false)

  const handleRun = useCallback(() => {
    setRunning(true)
    setOutput(null)

    // Simulate test execution
    setTimeout(() => {
      const hasContent =
        code.trim().length > challenge.starterCode.trim().length + 20
      const newTests = tests.map((t, i) => ({
        ...t,
        passed: hasContent
          ? i < tests.length - 1
            ? true
            : Math.random() > 0.3
          : false,
      }))
      setTests(newTests)

      const passed = newTests.every((t) => t.passed)
      setAllPassed(passed)
      setOutput(
        passed
          ? challenge.expectedOutput
          : 'Error: Not all test cases passed. Check your implementation.',
      )
      setRunning(false)

      if (passed) {
        setTimeout(onComplete, 1000)
      }
    }, 1800)
  }, [code, challenge, tests, onComplete])

  return (
    <div className='flex flex-col h-full'>
      {/* Editor Header */}
      <div
        className='flex items-center justify-between px-4 py-2.5 border-b'
        style={{
          background: 'hsl(137 41% 7%)',
          borderColor: 'rgba(82,221,160,0.1)',
        }}
      >
        <div className='flex items-center gap-2'>
          <Code size={14} strokeWidth={1.5} className='text-green-mint' />
          <span className='font-ui text-[0.7rem] font-semibold text-cream/60'>
            {challenge.language === 'rust'
              ? 'main.rs'
              : challenge.language === 'typescript'
                ? 'solution.ts'
                : 'solution.json'}
          </span>
        </div>
        <button
          onClick={handleRun}
          disabled={running}
          className='flex items-center gap-1.5 font-ui text-[0.7rem] font-semibold px-3 py-1.5 rounded-lg transition-all cursor-pointer disabled:opacity-60'
          style={{
            background: running
              ? 'rgba(82,221,160,0.1)'
              : 'hsl(var(--green-primary))',
            color: 'hsl(var(--cream))',
          }}
        >
          {running ? (
            <>
              <Loader2 size={12} strokeWidth={2} className='animate-spin' />
              Running...
            </>
          ) : (
            <>
              <Play size={12} strokeWidth={2} />
              Run Code
            </>
          )}
        </button>
      </div>

      {/* Editor Body */}
      <div className='flex-1 min-h-0 overflow-hidden'>
        <CodeEditor
          code={code}
          language={challenge.language}
          onChange={setCode}
        />
      </div>

      {/* Test Results + Output */}
      <div
        className='border-t overflow-y-auto'
        style={{
          background: 'hsl(137 41% 7%)',
          borderColor: 'rgba(82,221,160,0.1)',
          maxHeight: '220px',
        }}
      >
        {/* Tests */}
        <div className='p-3'>
          <p className='font-ui text-[0.6rem] font-bold uppercase tracking-wider text-cream/30 mb-2'>
            Test Cases
          </p>
          <div className='flex flex-col gap-1'>
            {tests.map((t, i) => (
              <div
                key={i}
                className='flex items-center gap-2 px-2.5 py-1.5 rounded-md'
                style={{
                  background: output
                    ? t.passed
                      ? 'rgba(82,221,160,0.08)'
                      : 'rgba(255,100,80,0.08)'
                    : 'transparent',
                }}
              >
                {output ? (
                  t.passed ? (
                    <CheckCircle2
                      size={13}
                      strokeWidth={2}
                      className='text-green-mint flex-shrink-0'
                    />
                  ) : (
                    <X
                      size={13}
                      strokeWidth={2}
                      className='text-red-400 flex-shrink-0'
                    />
                  )
                ) : (
                  <div className='w-3.5 h-3.5 rounded-full border border-cream/20 flex-shrink-0' />
                )}
                <span className='font-ui text-[0.68rem] text-cream/50'>
                  {t.name}
                </span>
                <span className='font-ui text-[0.56rem] text-cream/25 ml-auto'>
                  {t.expected}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Output */}
        {output && (
          <div className='px-3 pb-3'>
            <p className='font-ui text-[0.6rem] font-bold uppercase tracking-wider text-cream/30 mb-1.5'>
              Output
            </p>
            <pre
              className='font-mono text-[0.72rem] p-3 rounded-lg'
              style={{
                background: 'rgba(0,0,0,0.3)',
                color: allPassed ? 'hsl(var(--green-mint))' : '#ff6450',
              }}
            >
              {output}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Hint Drawer ───────────────────────────────────────────────

function HintDrawer({ hints }: { hints: string[] }) {
  const [revealed, setRevealed] = useState(0)

  if (!hints || hints.length === 0) return null

  return (
    <div className='card-warm rounded-xl p-4 border border-border-warm'>
      <div className='flex items-center justify-between mb-3'>
        <h3 className='font-ui text-[0.78rem] font-semibold text-charcoal flex items-center gap-1.5'>
          <Lightbulb size={14} strokeWidth={1.5} className='text-amber' />
          Hints
        </h3>
        <span className='font-ui text-[0.6rem] text-text-secondary'>
          {revealed}/{hints.length} revealed
        </span>
      </div>

      <div className='flex flex-col gap-2'>
        {hints.map((hint, i) => (
          <div key={i}>
            {i < revealed ? (
              <div
                className='p-3 rounded-lg font-ui text-[0.76rem] text-charcoal/80'
                style={{ background: 'hsl(var(--amber) / 0.08)' }}
              >
                <span className='font-bold text-charcoal mr-1.5'>
                  Hint {i + 1}:
                </span>
                {hint}
              </div>
            ) : i === revealed ? (
              <button
                onClick={() => setRevealed(revealed + 1)}
                className='w-full p-3 rounded-lg font-ui text-[0.72rem] font-semibold text-amber-dark border border-amber/30 hover:bg-amber/8 transition-colors text-left cursor-pointer'
              >
                💡 Reveal Hint {i + 1}
              </button>
            ) : (
              <div className='p-3 rounded-lg font-ui text-[0.72rem] text-text-secondary/70 border border-border-warm'>
                🔒 Hint {i + 1} — reveal previous hints first
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Solution Toggle ───────────────────────────────────────────

function SolutionToggle({ solution }: { solution: string }) {
  const [visible, setVisible] = useState(false)

  return (
    <div className='card-warm rounded-xl p-4 border border-border-warm'>
      <div className='flex items-center justify-between mb-2'>
        <h3 className='font-ui text-[0.78rem] font-semibold text-charcoal flex items-center gap-1.5'>
          {visible ? (
            <Eye size={14} strokeWidth={1.5} className='text-green-primary' />
          ) : (
            <EyeOff
              size={14}
              strokeWidth={1.5}
              className='text-text-tertiary'
            />
          )}
          Solution
        </h3>
        <button
          onClick={() => setVisible(!visible)}
          className='font-ui text-[0.65rem] font-semibold px-3 py-1 rounded-lg border border-border-warm hover:border-green-primary text-text-secondary transition-colors cursor-pointer'
        >
          {visible ? 'Hide' : 'Reveal'}
        </button>
      </div>

      {visible ? (
        <div className='h-[200px] rounded-lg overflow-hidden'>
          <CodeEditor code={solution} language='typescript' readOnly />
        </div>
      ) : (
        <div
          className='h-[100px] rounded-lg flex items-center justify-center'
          style={{
            background: 'rgba(139,109,56,0.05)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <p className='font-ui text-[0.75rem] text-text-secondary'>
            ⚠️ Try solving it yourself first!
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Completion Celebration ────────────────────────────────────

function CompletionBanner({
  xp,
  onDismiss,
}: {
  xp: number
  onDismiss: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className='mx-4 mt-4 p-5 rounded-2xl text-center'
      style={{
        background:
          'linear-gradient(135deg, hsl(var(--green-primary) / 0.1), hsl(var(--green-mint) / 0.08))',
        border: '1px solid hsl(var(--green-primary) / 0.25)',
      }}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        className='text-[2.5rem] mb-2'
      >
        🎉
      </motion.div>
      <div className='font-display text-[1.15rem] font-bold text-charcoal'>
        Lesson Complete!
      </div>
      <div className='flex items-center justify-center gap-1.5 mt-1.5'>
        <Zap size={14} strokeWidth={1.5} className='text-amber' />
        <span className='font-ui text-[0.82rem] font-bold text-amber-dark'>
          +{xp} XP earned
        </span>
      </div>
      <button
        onClick={onDismiss}
        className='mt-3 font-ui text-[0.72rem] font-semibold px-4 py-1.5 rounded-lg bg-green-primary text-cream hover:bg-green-dark transition-colors cursor-pointer'
      >
        Continue →
      </button>
    </motion.div>
  )
}

// ─── Lesson Page ───────────────────────────────────────────────

interface LessonProps {
  id: string
  slug: string
}

const Lesson = ({ id, slug }: LessonProps) => {
  const lesson = lessonContents[id] as LessonContent | undefined
  const nav = getLessonNav(id)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [completed, setCompleted] = useState(lesson?.completed ?? false)
  const [showCelebration, setShowCelebration] = useState(false)

  // Gather all lessons for sidebar grouped by module
  const modulesMap = useMemo(() => {
    const map = new Map<
      string,
      { moduleTitle: string; lessons: LessonContent[] }
    >()
    for (const lid of lessonOrder) {
      const l = lessonContents[lid]
      if (!l) continue
      if (!map.has(l.moduleId)) {
        map.set(l.moduleId, { moduleTitle: l.moduleTitle, lessons: [] })
      }
      map.get(l.moduleId)!.lessons.push(l)
    }
    return Array.from(map.entries())
  }, [])

  const handleComplete = useCallback(() => {
    if (completed) return
    setCompleted(true)
    setShowCelebration(true)
  }, [completed])

  const hasCodeEditor = lesson?.type === 'code_challenge' || !!lesson?.challenge
  const hasQuiz = lesson?.type === 'quiz' || !!lesson?.quiz

  if (!lesson) {
    return (
      <StandardLayout>
        <div className='min-h-screen flex items-center justify-center'>
          <p className='font-ui text-lg text-text-secondary'>
            Lesson not found.
          </p>
        </div>
      </StandardLayout>
    )
  }

  return (
    <div className='min-h-screen bg-background flex flex-col'>
      {/* ─── HEADER ─────────────────────────────────────────── */}
      <header
        className='sticky top-0 z-50 flex items-center justify-between px-4 h-[52px] border-b'
        style={{
          background: 'hsl(var(--green-secondary))',
          borderColor: 'rgba(247,234,203,0.08)',
        }}
      >
        {/* Left */}
        <div className='flex items-center gap-3'>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className='lg:hidden w-8 h-8 rounded-lg flex items-center justify-center text-cream/50 hover:text-cream/80 transition-colors cursor-pointer'
          >
            <Menu size={18} strokeWidth={1.5} />
          </button>
          <a
            href={`/en/courses/${slug}`}
            className='flex items-center gap-1.5 font-ui text-[0.7rem] text-cream/40 hover:text-cream/70 transition-colors'
          >
            <ChevronLeft size={14} strokeWidth={1.5} />
            Back to Course
          </a>
          <span className='hidden sm:block w-[1px] h-4 bg-cream/12' />
          <span className='hidden sm:block font-ui text-[0.68rem] text-cream/50 truncate max-w-[200px]'>
            {lesson.moduleTitle}
          </span>
        </div>

        {/* Center — Progress */}
        <div className='flex items-center gap-3'>
          <span className='font-ui text-[0.62rem] font-bold text-cream/40'>
            {nav.current}/{nav.total}
          </span>
          <div className='w-24 h-1.5 rounded-full overflow-hidden bg-cream/10'>
            <div
              className='h-full rounded-full gradient-progress transition-all duration-500'
              style={{
                width: `${Math.round((nav.current / nav.total) * 100)}%`,
              }}
            />
          </div>
        </div>

        {/* Right */}
        <div className='flex items-center gap-2'>
          {completed && (
            <span className='flex items-center gap-1 font-ui text-[0.6rem] font-bold text-green-mint'>
              <CheckCircle2 size={12} strokeWidth={2} />
              Complete
            </span>
          )}
          <span className='flex items-center gap-1 font-ui text-[0.6rem] text-cream/40'>
            <Zap size={11} strokeWidth={1.5} />
            {lesson.xpReward} XP
          </span>
        </div>
      </header>

      {/* ─── BODY ───────────────────────────────────────────── */}
      <div className='flex flex-1 min-h-0 overflow-hidden'>
        {/* SIDEBAR */}
        <aside
          className={`
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            lg:translate-x-0
            fixed lg:static z-40 top-[52px] left-0 bottom-0
            w-[280px] flex-shrink-0 border-r overflow-y-auto transition-transform duration-200
          `}
          style={{
            background: 'hsl(var(--card-warm))',
            borderColor: 'hsl(var(--border-warm))',
          }}
        >
          <div className='p-4'>
            <h3 className='font-display text-[0.9rem] font-bold text-charcoal mb-4'>
              Course Content
            </h3>

            {modulesMap.map(([mId, mod]) => (
              <div key={mId} className='mb-4'>
                <p className='font-ui text-[0.6rem] font-bold uppercase tracking-wider text-text-tertiary mb-2'>
                  {mod.moduleTitle}
                </p>
                <div className='flex flex-col gap-0.5'>
                  {mod.lessons.map((l) => (
                    <a
                      key={l.id}
                      href={`/en/courses/${slug}/lesson/${l.id}`}
                      className='flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-colors'
                      style={{
                        background:
                          l.id === id
                            ? 'hsl(var(--green-primary) / 0.08)'
                            : 'transparent',
                        borderLeft:
                          l.id === id
                            ? '2px solid hsl(var(--green-primary))'
                            : '2px solid transparent',
                      }}
                    >
                      <div className='w-4 flex-shrink-0 flex items-center justify-center'>
                        {l.completed || (l.id === id && completed) ? (
                          <CheckCircle2
                            size={14}
                            strokeWidth={2}
                            className='text-green-primary'
                          />
                        ) : l.id === id ? (
                          <div className='w-2.5 h-2.5 rounded-full bg-green-primary' />
                        ) : (
                          <div className='w-2.5 h-2.5 rounded-full border border-charcoal/20' />
                        )}
                      </div>
                      <div className='flex-1 min-w-0'>
                        <p
                          className='font-ui text-[0.72rem] truncate'
                          style={{
                            color:
                              l.id === id
                                ? 'hsl(var(--green-primary))'
                                : 'hsl(var(--text-secondary))',
                            fontWeight: l.id === id ? 600 : 400,
                          }}
                        >
                          {l.title}
                        </p>
                        <span className='font-ui text-[0.55rem] text-text-tertiary'>
                          {l.duration}
                        </span>
                      </div>
                      <span className='text-text-tertiary'>
                        {lessonTypeIcon(l.type)}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Sidebar overlay on mobile */}
        {sidebarOpen && (
          <div
            className='fixed inset-0 z-30 bg-charcoal/40 lg:hidden'
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* MAIN CONTENT */}
        <main className='flex-1 min-w-0 flex flex-col lg:flex-row'>
          {/* Content pane */}
          <div
            className='flex-1 min-w-0 overflow-y-auto'
            style={{ minWidth: hasCodeEditor ? '40%' : '100%' }}
          >
            {/* Celebration */}
            {showCelebration && (
              <CompletionBanner
                xp={lesson.xpReward}
                onDismiss={() => {
                  setShowCelebration(false)
                  if (nav.next) {
                    window.location.href = `/en/courses/${slug}/lesson/${nav.next}`
                  }
                }}
              />
            )}

            {/* Lesson title bar */}
            <div className='px-6 lg:px-8 pt-6 pb-4'>
              <div className='flex items-center gap-2 mb-2'>
                <span
                  className='font-ui text-[0.58rem] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full'
                  style={{
                    background:
                      lesson.type === 'code_challenge'
                        ? 'hsl(var(--amber) / 0.12)'
                        : lesson.type === 'quiz'
                          ? 'hsl(var(--green-mint) / 0.1)'
                          : lesson.type === 'video'
                            ? 'hsl(var(--green-primary) / 0.1)'
                            : 'rgba(139,109,56,0.08)',
                    color:
                      lesson.type === 'code_challenge'
                        ? 'hsl(var(--amber-dark))'
                        : lesson.type === 'quiz'
                          ? 'hsl(var(--green-primary))'
                          : lesson.type === 'video'
                            ? 'hsl(var(--green-primary))'
                            : 'hsl(var(--text-secondary))',
                  }}
                >
                  {lesson.type.replace('_', ' ')}
                </span>
                <span className='font-ui text-[0.6rem] text-text-tertiary'>
                  {lesson.duration}
                </span>
              </div>
              <h1 className='font-display text-[1.5rem] lg:text-[1.75rem] font-black tracking-tight text-charcoal'>
                {lesson.title}
              </h1>
            </div>

            {/* Content blocks */}
            <div className='px-6 lg:px-8 pb-6 lesson-content'>
              <style
                dangerouslySetInnerHTML={{
                  __html: `
                .lesson-content .md-h1 { font-family: var(--font-playfair), serif; font-size: 1.4rem; font-weight: 800; color: hsl(var(--charcoal)); margin: 1.5rem 0 0.75rem; }
                .lesson-content .md-h2 { font-family: var(--font-playfair), serif; font-size: 1.15rem; font-weight: 700; color: hsl(var(--charcoal)); margin: 1.5rem 0 0.5rem; }
                .lesson-content .md-h3 { font-family: var(--font-playfair), serif; font-size: 0.95rem; font-weight: 700; color: hsl(var(--charcoal)); margin: 1.25rem 0 0.4rem; }
                .lesson-content .md-p { font-family: var(--font-dm-sans), sans-serif; font-size: 0.86rem; line-height: 1.75; color: hsl(var(--text-secondary)); margin: 0.5rem 0; }
                .lesson-content .md-li { font-family: var(--font-dm-sans), sans-serif; font-size: 0.84rem; line-height: 1.6; color: hsl(var(--text-secondary)); margin: 0.25rem 0 0.25rem 1.25rem; list-style: disc; }
                .lesson-content .md-ol { list-style: decimal; }
                .lesson-content .md-bq { border-left: 3px solid hsl(var(--green-primary) / 0.3); padding: 0.5rem 1rem; margin: 0.75rem 0; background: hsl(var(--green-primary) / 0.04); border-radius: 0 0.5rem 0.5rem 0; font-size: 0.84rem; color: hsl(var(--text-secondary)); }
                .lesson-content .md-link { color: hsl(var(--green-primary)); text-decoration: underline; text-underline-offset: 2px; }
                .lesson-content .md-link:hover { color: hsl(var(--green-dark)); }
                .lesson-content .inline-code { font-family: 'JetBrains Mono', 'Fira Code', monospace; font-size: 0.8em; background: rgba(139,109,56,0.08); padding: 0.15em 0.4em; border-radius: 4px; color: hsl(var(--green-dark)); }
                .lesson-content .code-block { background: hsl(137 41% 9%); color: #abb2bf; padding: 1rem 1.25rem; border-radius: 0.75rem; overflow-x: auto; margin: 0.75rem 0; font-family: 'JetBrains Mono', 'Fira Code', monospace; font-size: 0.78rem; line-height: 1.65; border: 1px solid rgba(82,221,160,0.1); }
                .lesson-content .code-block code, .lesson-content .code-block * { color: #abb2bf !important; background: transparent !important; }
                .lesson-content .md-table { width: 100%; border-collapse: collapse; margin: 0.75rem 0; font-family: var(--font-dm-sans), sans-serif; font-size: 0.8rem; }
                .lesson-content .md-table th { text-align: left; padding: 0.6rem 1rem; background: rgba(139,109,56,0.06); border: 1px solid hsl(var(--border-warm)); font-weight: 600; color: hsl(var(--charcoal)); }
                .lesson-content .md-table td { padding: 0.5rem 1rem; border: 1px solid hsl(var(--border-warm)); color: hsl(var(--text-secondary)); }
                .lesson-content strong { color: hsl(var(--charcoal)); }
              `,
                }}
              />

              {lesson.blocks.map((block, i) => (
                <BlockRenderer key={i} block={block} />
              ))}

              {/* Quiz (rendered inline if quiz type) */}
              {hasQuiz && lesson.quiz && (
                <div className='mt-6'>
                  <h2 className='font-display text-[1.1rem] font-bold text-charcoal mb-4 flex items-center gap-2'>
                    <Trophy
                      size={18}
                      strokeWidth={1.5}
                      className='text-amber'
                    />
                    Knowledge Check
                  </h2>
                  <QuizPanel quiz={lesson.quiz} onComplete={handleComplete} />
                </div>
              )}

              {/* Challenge prompt (for code challenges, shown with objectives) */}
              {hasCodeEditor && lesson.challenge && (
                <div className='mt-6'>
                  <div
                    className='p-5 rounded-xl'
                    style={{
                      background: 'hsl(var(--amber) / 0.06)',
                      border: '1px solid hsl(var(--amber) / 0.2)',
                    }}
                  >
                    <h3 className='font-display text-[0.95rem] font-bold text-charcoal mb-2 flex items-center gap-2'>
                      <Code
                        size={16}
                        strokeWidth={1.5}
                        className='text-amber-dark'
                      />
                      Challenge
                    </h3>
                    <p className='font-ui text-[0.82rem] text-text-secondary mb-3'>
                      {lesson.challenge.prompt}
                    </p>
                    <div className='flex flex-col gap-1.5'>
                      {lesson.challenge.objectives.map((obj, i) => (
                        <div
                          key={i}
                          className='flex items-start gap-2 font-ui text-[0.76rem] text-text-secondary'
                        >
                          <span className='w-4 h-4 rounded-full bg-amber/12 text-amber-dark flex items-center justify-center flex-shrink-0 mt-0.5 font-ui text-[0.55rem] font-bold'>
                            {i + 1}
                          </span>
                          {obj}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Hints & Solution */}
              {lesson.hints && lesson.hints.length > 0 && (
                <div className='mt-6'>
                  <HintDrawer hints={lesson.hints} />
                </div>
              )}

              {lesson.solution && (
                <div className='mt-4'>
                  <SolutionToggle solution={lesson.solution} />
                </div>
              )}

              {/* Mark Complete (for non-challenge, non-quiz lessons) */}
              {!hasCodeEditor && !hasQuiz && !completed && (
                <div className='mt-8 flex justify-center'>
                  <button
                    onClick={handleComplete}
                    className='flex items-center gap-2 font-ui text-[0.85rem] font-semibold px-6 py-3 rounded-xl bg-green-primary text-cream hover:bg-green-dark transition-all shadow-[0_2px_14px_rgba(0,140,76,0.38)] hover:shadow-[0_6px_22px_rgba(0,140,76,0.48)] hover:-translate-y-0.5 cursor-pointer'
                  >
                    <Sparkles size={16} strokeWidth={1.5} />
                    Mark as Complete · +{lesson.xpReward} XP
                  </button>
                </div>
              )}
            </div>

            {/* BOTTOM NAV */}
            <div
              className='sticky bottom-0 flex items-center justify-between gap-4 px-6 py-4 border-t'
              style={{
                background: 'hsl(var(--cream))',
                borderColor: 'hsl(var(--border-warm))',
                boxShadow: '0 -4px 20px rgba(0,0,0,0.04)',
              }}
            >
              {nav.prev ? (
                <a
                  href={`/en/courses/${slug}/lesson/${nav.prev}`}
                  className='flex items-center gap-3 flex-1 px-4 py-3 rounded-xl border border-border-warm hover:border-green-primary/40 hover:bg-green-primary/4 transition-all group cursor-pointer'
                  style={{ background: 'hsl(var(--card-warm))' }}
                >
                  <div
                    className='w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-green-primary/12 transition-colors'
                    style={{ background: 'rgba(139,109,56,0.06)' }}
                  >
                    <ArrowLeft
                      size={16}
                      strokeWidth={2}
                      className='text-text-secondary group-hover:text-green-primary group-hover:-translate-x-0.5 transition-all'
                    />
                  </div>
                  <div className='text-left min-w-0'>
                    <span className='block font-ui text-[0.6rem] font-semibold uppercase tracking-wider text-text-tertiary'>
                      Previous
                    </span>
                    <span className='block font-ui text-[0.78rem] font-semibold text-charcoal truncate group-hover:text-green-primary transition-colors'>
                      {nav.prevTitle}
                    </span>
                  </div>
                </a>
              ) : (
                <div className='flex-1' />
              )}

              {nav.next ? (
                <a
                  href={`/en/courses/${slug}/lesson/${nav.next}`}
                  className='flex items-center gap-3 flex-1 px-4 py-3 rounded-xl border border-green-primary/25 hover:border-green-primary/50 transition-all group cursor-pointer justify-end'
                  style={{ background: 'hsl(var(--green-primary) / 0.04)' }}
                >
                  <div className='text-right min-w-0'>
                    <span className='block font-ui text-[0.6rem] font-semibold uppercase tracking-wider text-green-primary/60'>
                      Next
                    </span>
                    <span className='block font-ui text-[0.78rem] font-semibold text-charcoal truncate group-hover:text-green-primary transition-colors'>
                      {nav.nextTitle}
                    </span>
                  </div>
                  <div className='w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-green-primary/10 group-hover:bg-green-primary/18 transition-colors'>
                    <ArrowRight
                      size={16}
                      strokeWidth={2}
                      className='text-green-primary group-hover:translate-x-0.5 transition-transform'
                    />
                  </div>
                </a>
              ) : (
                <a
                  href={`/en/courses/${slug}`}
                  className='flex items-center gap-2.5 flex-1 justify-end px-5 py-3 rounded-xl bg-green-primary text-cream font-ui text-[0.82rem] font-semibold hover:bg-green-dark transition-colors shadow-[0_2px_12px_rgba(0,140,76,0.3)]'
                >
                  <Trophy size={15} strokeWidth={1.5} />
                  Back to Course
                </a>
              )}
            </div>
          </div>

          {/* CODE EDITOR PANE (right side) */}
          {hasCodeEditor && lesson.challenge && (
            <div
              className='hidden lg:flex flex-col border-l'
              style={{
                width: '50%',
                minWidth: '380px',
                maxWidth: '60%',
                background: 'hsl(137 41% 9%)',
                borderColor: 'rgba(82,221,160,0.1)',
              }}
            >
              <ChallengePanel
                challenge={lesson.challenge}
                onComplete={handleComplete}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default Lesson
