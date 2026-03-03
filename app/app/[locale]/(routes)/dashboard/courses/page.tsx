/**
 * Instructor Courses page — view courses assigned to your wallet.
 *
 * Shows both on-chain course data (stats, enrollments) and Sanity CMS data
 * (title, description, modules). Read-only — on-chain CRUD is admin-only.
 * Prompts to connect/link wallet if not available.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';

interface CourseItem {
    _id?: string;
    title?: string;
    slug?: { current: string } | null;
    onChainCourseId?: string;
    description?: string;
    difficulty?: string;
    xpPerLesson?: number;
    isPublished?: boolean;
    tags?: string[] | null;
    track?: { name: string } | null;
    modules?: Array<{
        title: string;
        lessons?: Array<{ title: string }> | null;
    }> | null;
    // On-chain fields
    courseId?: string;
    lessonCount?: number;
    totalEnrollments?: number;
    totalCompletions?: number;
    isActive?: boolean;
    createdAt?: number;
}

export default function InstructorCoursesPage() {
    const { connected } = useWallet();
    const { setVisible } = useWalletModal();
    const [courses, setCourses] = useState<CourseItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [noWallet, setNoWallet] = useState(false);

    const fetchCourses = useCallback(async () => {
        setLoading(true);
        setError(null);
        setNoWallet(false);
        try {
            const res = await fetch('/api/instructor/courses');
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'Failed to load');
                return;
            }
            if (data.message && data.count === 0) {
                setNoWallet(true);
                setError(data.message);
            }
            setCourses(data.courses || []);
        } catch {
            setError('Network error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchCourses(); }, [fetchCourses]);

    const difficultyColor: Record<string, string> = {
        easy: '#22c55e', medium: '#eab308', hard: '#ef4444',
        '0': '#22c55e', '1': '#eab308', '2': '#ef4444',
    };

    const cardStyle: React.CSSProperties = {
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '12px',
        padding: '20px',
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 4px', letterSpacing: '-0.02em' }}>
                        My Courses
                    </h1>
                    <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>
                        Courses assigned to your wallet · Content editing via Sanity Studio
                    </p>
                </div>
                <Link href="/en/dashboard/studio" style={{
                    padding: '10px 20px', borderRadius: '8px',
                    background: 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(139,92,246,0.2))',
                    border: '1px solid rgba(99,102,241,0.3)',
                    color: '#fff', fontSize: '14px', textDecoration: 'none', fontWeight: 500,
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                }}>✏️ Open Studio</Link>
            </div>

            {/* Info banner */}
            <div style={{
                padding: '14px 18px', borderRadius: '10px',
                background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)',
                marginBottom: '24px', fontSize: '13px', color: 'rgba(255,255,255,0.7)',
            }}>
                💡 Courses are created on-chain by admins. You can edit course content (lessons, quizzes, modules) using <strong>Sanity Studio</strong>.
                On-chain parameters (XP, status) are managed by admins.
            </div>

            {/* Wallet prompt */}
            {noWallet && (
                <div style={{
                    textAlign: 'center', padding: '40px 20px', marginBottom: '24px',
                    background: 'rgba(234,179,8,0.06)', border: '1px solid rgba(234,179,8,0.15)',
                    borderRadius: '12px',
                }}>
                    <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔗</div>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 8px' }}>Wallet Not Linked</h3>
                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', margin: '0 0 16px', maxWidth: '400px', marginInline: 'auto' }}>
                        Link your wallet to your profile to see courses assigned to you.
                        Courses are matched by the <strong>creator wallet address</strong> on-chain.
                    </p>
                    {!connected && (
                        <button onClick={() => setVisible(true)} style={{
                            padding: '10px 24px', borderRadius: '8px',
                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            border: 'none', color: '#fff', fontSize: '14px',
                            fontWeight: 600, cursor: 'pointer',
                        }}>Connect Wallet</button>
                    )}
                </div>
            )}

            {/* Error */}
            {error && !noWallet && (
                <div style={{
                    padding: '12px 16px', borderRadius: '8px',
                    background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)',
                    marginBottom: '16px', fontSize: '13px', color: '#f87171',
                }}>{error}</div>
            )}

            {/* Content */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.4)' }}>
                    Loading your courses…
                </div>
            ) : courses.length === 0 && !noWallet ? (
                <div style={{
                    textAlign: 'center', padding: '60px 20px',
                    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '12px',
                }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📚</div>
                    <h3 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 8px' }}>No courses assigned</h3>
                    <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', margin: 0, maxWidth: '400px', marginInline: 'auto' }}>
                        Ask an admin to create a course with your wallet as the creator,
                        or assign you as instructor in Sanity Studio.
                    </p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
                    {courses.map((course) => {
                        const title = course.title || course.courseId || course.onChainCourseId || 'Untitled';
                        const moduleCount = course.modules?.length || 0;
                        const lessonCount = course.modules?.reduce((s, m) => s + (m.lessons?.length || 0), 0) || course.lessonCount || 0;
                        const diff = String(course.difficulty || '0');
                        const dc = difficultyColor[diff] || '#888';
                        const diffName = { easy: 'Beginner', medium: 'Intermediate', hard: 'Advanced', '0': 'Beginner', '1': 'Intermediate', '2': 'Advanced' }[diff] || diff;

                        return (
                            <div key={course._id || course.courseId} style={cardStyle}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#fff', flex: 1 }}>{title}</h3>
                                    <span style={{
                                        padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, marginLeft: '8px', flexShrink: 0,
                                        background: (course.isPublished || course.isActive) ? 'rgba(34,197,94,0.15)' : 'rgba(234,179,8,0.15)',
                                        color: (course.isPublished || course.isActive) ? '#22c55e' : '#eab308',
                                        border: `1px solid ${(course.isPublished || course.isActive) ? 'rgba(34,197,94,0.3)' : 'rgba(234,179,8,0.3)'}`,
                                    }}>
                                        {course.isPublished ? 'Published' : course.isActive ? 'Active' : 'Draft'}
                                    </span>
                                </div>

                                {course.description && (
                                    <p style={{
                                        margin: '0 0 12px', fontSize: '13px', color: 'rgba(255,255,255,0.5)',
                                        lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical', overflow: 'hidden',
                                    }}>{course.description}</p>
                                )}

                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
                                    <span style={{
                                        padding: '2px 8px', borderRadius: '4px', fontSize: '11px',
                                        fontWeight: 500, background: `${dc}20`, color: dc,
                                    }}>{diffName}</span>
                                    {course.track && (
                                        <span style={{
                                            padding: '2px 8px', borderRadius: '4px', fontSize: '11px',
                                            fontWeight: 500, background: 'rgba(99,102,241,0.15)', color: '#818cf8',
                                        }}>{course.track.name}</span>
                                    )}
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                                    <div>
                                        <div style={{ fontSize: '20px', fontWeight: 700, color: '#fff' }}>{moduleCount}</div>
                                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>Modules</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '20px', fontWeight: 700, color: '#fff' }}>{lessonCount}</div>
                                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>Lessons</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '20px', fontWeight: 700, color: '#fff' }}>
                                            {course.totalEnrollments ?? course.xpPerLesson ?? 0}
                                        </div>
                                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                                            {course.totalEnrollments !== undefined ? 'Enrolled' : 'XP/lesson'}
                                        </div>
                                    </div>
                                </div>

                                <div style={{
                                    marginTop: '14px', paddingTop: '12px',
                                    borderTop: '1px solid rgba(255,255,255,0.06)',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                }}>
                                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace' }}>
                                        {course.onChainCourseId || course.courseId}
                                    </span>
                                    {course.tags && course.tags.length > 0 && (
                                        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>
                                            {course.tags.slice(0, 3).join(' · ')}
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
