/**
 * Admin Courses page — client component.
 *
 * Displays on-chain courses with create/edit/deactivate actions.
 * Uses wallet adapter for signing on-chain transactions.
 * Also shows Sanity CMS course count and Studio link.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { goeyToast } from 'goey-toast';
import { CreateCourseForm } from '@/components/admin/CreateCourseForm';
import { UpdateCourseForm } from '@/components/admin/UpdateCourseForm';

interface OnChainCourse {
    courseId: string;
    coursePda: string;
    creator: string;
    lessonCount: number;
    difficulty: number;
    xpPerLesson: number;
    trackId: number;
    trackLevel: number;
    totalCompletions: number;
    totalEnrollments: number;
    isActive: boolean;
    createdAt: number;
    updatedAt: number;
    creatorRewardXp: number;
    minCompletionsForReward: number;
}

interface ApiResponse {
    courses: OnChainCourse[];
    stats: {
        totalCourses: number;
        activeCourses: number;
        totalEnrollments: number;
        totalCompletions: number;
    };
    sanityCourseCount: number;
}

export default function AdminCoursesPage() {
    const [data, setData] = useState<ApiResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [editingCourse, setEditingCourse] = useState<OnChainCourse | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/courses');
            if (res.ok) {
                setData(await res.json());
            } else {
                goeyToast.error('Failed to load course data');
            }
        } catch (err) {
            console.error('[AdminCourses]', err);
            goeyToast.error('Network error loading courses');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const diffLabel = (d: number) => ['Beginner', 'Intermediate', 'Advanced'][d] || `${d}`;

    const cellStyle: React.CSSProperties = {
        padding: '12px 16px', fontSize: '13px',
        color: 'rgba(255,255,255,0.7)',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
    };

    const courses = data?.courses ?? [];

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 4px', letterSpacing: '-0.02em' }}>
                        Courses
                    </h1>
                    <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>
                        On-chain course management · {courses.length} courses · {data?.sanityCourseCount ?? 0} in CMS
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <a href="/admin/studio" style={{
                        padding: '8px 16px', borderRadius: '6px',
                        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                        color: 'rgba(255,255,255,0.7)', fontSize: '13px', textDecoration: 'none', fontWeight: 500,
                    }}>
                        Sanity Studio
                    </a>
                    <button onClick={() => setShowCreate(true)} style={{
                        padding: '8px 16px', borderRadius: '6px',
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        border: 'none', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                    }}>
                        + Create Course
                    </button>
                </div>
            </div>

            {/* Stats */}
            {data && (
                <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px',
                }}>
                    {[
                        { label: 'Total', value: data.stats.totalCourses },
                        { label: 'Active', value: data.stats.activeCourses },
                        { label: 'Enrollments', value: data.stats.totalEnrollments },
                        { label: 'Completions', value: data.stats.totalCompletions },
                    ].map((s) => (
                        <div key={s.label} style={{
                            padding: '14px 16px', borderRadius: '10px',
                            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                        }}>
                            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>
                                {s.label}
                            </div>
                            <div style={{ fontSize: '22px', fontWeight: 700 }}>{s.value}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Courses Table */}
            <div style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '12px', overflow: 'hidden',
            }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>
                        On-Chain Courses ({courses.length})
                    </h2>
                </div>

                {loading ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                        Loading…
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    {['Course ID', 'Track', 'Difficulty', 'Lessons', 'Enrolled', 'Completed', 'XP', 'Status', 'Actions'].map((h) => (
                                        <th key={h} style={{
                                            padding: '10px 16px', fontSize: '11px', fontWeight: 600,
                                            color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase',
                                            letterSpacing: '0.05em', textAlign: 'left',
                                            borderBottom: '1px solid rgba(255,255,255,0.04)',
                                        }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {courses.map((c) => (
                                    <tr key={c.courseId} style={{ transition: 'background 0.15s' }}
                                        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                                        <td style={{ ...cellStyle, fontFamily: 'var(--font-geist-mono)', fontWeight: 500, color: '#fff' }}>
                                            {c.courseId}
                                        </td>
                                        <td style={cellStyle}>Track {c.trackId}</td>
                                        <td style={cellStyle}>{diffLabel(c.difficulty)}</td>
                                        <td style={cellStyle}>{c.lessonCount}</td>
                                        <td style={cellStyle}>{c.totalEnrollments}</td>
                                        <td style={cellStyle}>{c.totalCompletions}</td>
                                        <td style={cellStyle}>{c.xpPerLesson}</td>
                                        <td style={cellStyle}>
                                            <span style={{
                                                padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600,
                                                background: c.isActive ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)',
                                                color: c.isActive ? '#4ade80' : '#f87171',
                                            }}>
                                                {c.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td style={cellStyle}>
                                            <button
                                                onClick={() => setEditingCourse(c)}
                                                style={{
                                                    padding: '4px 10px', borderRadius: '4px', fontSize: '11px',
                                                    background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
                                                    color: '#818cf8', cursor: 'pointer', fontWeight: 600,
                                                }}
                                            >
                                                Edit
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {courses.length === 0 && (
                                    <tr>
                                        <td colSpan={9} style={{
                                            padding: '32px 16px', textAlign: 'center',
                                            color: 'rgba(255,255,255,0.3)', fontSize: '13px',
                                        }}>
                                            No on-chain courses found · Click &quot;Create Course&quot; to add one
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modals */}
            {showCreate && (
                <CreateCourseForm
                    onClose={() => setShowCreate(false)}
                    onSuccess={fetchData}
                />
            )}
            {editingCourse && (
                <UpdateCourseForm
                    course={editingCourse}
                    onClose={() => setEditingCourse(null)}
                    onSuccess={fetchData}
                />
            )}
        </div>
    );
}
