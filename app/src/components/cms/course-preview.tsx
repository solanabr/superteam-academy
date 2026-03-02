'use client'

import React from 'react'
import { useLivePreview } from '@payloadcms/live-preview-react'
import { RichText } from '@payloadcms/richtext-lexical/react'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LexicalData = any

interface PayloadLesson {
  title: string
  description?: string
  type?: 'content' | 'challenge'
  order?: number
  xpReward?: number
  duration?: string
  videoUrl?: string
  content?: LexicalData
  challenge?: {
    prompt?: LexicalData
    starterCode?: string
    language?: string
    hints?: Array<{ hint: string }>
    solution?: string
    testCases?: Array<{ name: string; input?: string; expectedOutput: string }>
  }
}

interface PayloadModule {
  title: string
  description?: string
  order?: number
  lessons?: PayloadLesson[]
}

interface PayloadCourseDoc {
  id: string
  title: string
  slug: string
  description?: string
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
  duration?: string
  xpTotal?: number
  isActive?: boolean
  creator?: string
  tags?: Array<{ tag: string }>
  modules?: PayloadModule[]
  [key: string]: unknown
}

const difficultyColors: Record<string, string> = {
  beginner: '#22c55e',
  intermediate: '#eab308',
  advanced: '#ef4444',
}

export function CoursePreview({
  initialData,
  serverURL,
}: {
  initialData: PayloadCourseDoc
  serverURL: string
}) {
  const { data, isLoading } = useLivePreview<PayloadCourseDoc>({
    initialData,
    serverURL,
    depth: 2,
  })

  if (isLoading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--foreground, #ccc)' }}>
        Loading preview...
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1.5rem' }}>
      {/* Header */}
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          {data.title}
        </h1>
        {data.description && (
          <p style={{ fontSize: '1.1rem', opacity: 0.8, marginBottom: '1rem' }}>
            {data.description}
          </p>
        )}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {data.difficulty && (
            <span
              style={{
                padding: '0.25rem 0.75rem',
                borderRadius: 9999,
                fontSize: '0.8rem',
                fontWeight: 600,
                backgroundColor: difficultyColors[data.difficulty] || '#666',
                color: '#fff',
              }}
            >
              {data.difficulty.charAt(0).toUpperCase() + data.difficulty.slice(1)}
            </span>
          )}
          {data.duration && (
            <span style={{ fontSize: '0.9rem', opacity: 0.7 }}>
              {data.duration}
            </span>
          )}
          {typeof data.xpTotal === 'number' && data.xpTotal > 0 && (
            <span style={{ fontSize: '0.9rem', opacity: 0.7 }}>
              {data.xpTotal} XP
            </span>
          )}
          {data.creator && (
            <span style={{ fontSize: '0.9rem', opacity: 0.7 }}>
              by {data.creator}
            </span>
          )}
        </div>
        {data.tags && data.tags.length > 0 && (
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
            {data.tags.map((t, i) => (
              <span
                key={i}
                style={{
                  padding: '0.2rem 0.6rem',
                  borderRadius: 4,
                  fontSize: '0.75rem',
                  backgroundColor: 'var(--muted, #333)',
                  color: 'var(--muted-foreground, #aaa)',
                }}
              >
                {t.tag}
              </span>
            ))}
          </div>
        )}
      </header>

      {/* Modules */}
      {data.modules?.map((mod, mi) => (
        <section key={mi} style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            Module {(mod.order ?? mi) + 1}: {mod.title}
          </h2>
          {mod.description && (
            <p style={{ opacity: 0.7, marginBottom: '1rem' }}>{mod.description}</p>
          )}

          {mod.lessons?.map((lesson, li) => (
            <div
              key={li}
              style={{
                border: '1px solid var(--border, #333)',
                borderRadius: 8,
                padding: '1.25rem',
                marginBottom: '1rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{lesson.title}</h3>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  {lesson.type === 'challenge' && (
                    <span
                      style={{
                        padding: '0.15rem 0.5rem',
                        borderRadius: 4,
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        backgroundColor: '#7c3aed',
                        color: '#fff',
                      }}
                    >
                      Challenge
                    </span>
                  )}
                  {typeof lesson.xpReward === 'number' && lesson.xpReward > 0 && (
                    <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>{lesson.xpReward} XP</span>
                  )}
                </div>
              </div>

              {lesson.description && (
                <p style={{ fontSize: '0.9rem', opacity: 0.7, marginBottom: '0.75rem' }}>
                  {lesson.description}
                </p>
              )}

              {/* Content lesson — render rich text */}
              {lesson.type === 'content' && lesson.content && (
                <div className="prose">
                  <RichText data={lesson.content} />
                </div>
              )}

              {/* Challenge lesson */}
              {lesson.type === 'challenge' && lesson.challenge && (
                <div>
                  {lesson.challenge.prompt && (
                    <div style={{ marginBottom: '1rem' }}>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                        Prompt
                      </h4>
                      <div className="prose">
                        <RichText data={lesson.challenge.prompt} />
                      </div>
                    </div>
                  )}
                  {lesson.challenge.starterCode && (
                    <div>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                        Starter Code
                        {lesson.challenge.language && (
                          <span style={{ fontWeight: 400, opacity: 0.6, marginLeft: '0.5rem' }}>
                            ({lesson.challenge.language})
                          </span>
                        )}
                      </h4>
                      <pre
                        style={{
                          backgroundColor: 'var(--muted, #1a1a2e)',
                          padding: '1rem',
                          borderRadius: 6,
                          overflow: 'auto',
                          fontSize: '0.85rem',
                          lineHeight: 1.5,
                        }}
                      >
                        <code>{lesson.challenge.starterCode}</code>
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </section>
      ))}
    </div>
  )
}
