"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminCreateCourse, adminUploadAsset } from "@/lib/admin";
import { ArrowLeft, Plus, Trash2, Upload } from "lucide-react";
import Link from "next/link";

const DIFFICULTIES = ["beginner", "intermediate", "advanced"];
const TOPICS = ["solana-basics", "smart-contracts", "defi", "nfts", "tokens", "web3-frontend", "security", "tooling"];

interface Question { text: string; options: { label: string; text: string }[]; correctLabel: string; }
interface Test { title: string; type: "quiz" | "code_challenge"; passThreshold: number; questions: Question[]; codeChallenge?: { prompt: string; starterCode: string; testCases: { input: string; expectedOutput: string }[] }; }
interface Lesson { title: string; type: "video" | "markdown"; content: string; duration: number; }
interface Milestone { title: string; description: string; xpReward: number; lessons: Lesson[]; tests: Test[]; }

function mkLesson(): Lesson { return { title: "", type: "markdown", content: "", duration: 5 }; }
function mkTest(): Test { return { title: "", type: "quiz", passThreshold: 80, questions: [{ text: "", options: [{ label: "A", text: "" }, { label: "B", text: "" }], correctLabel: "A" }], }; }
function mkMilestone(): Milestone { return { title: "", description: "", xpReward: 100, lessons: [mkLesson()], tests: [mkTest()] }; }

export default function NewCoursePage() {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [uploading, setUploading] = useState(false);

    const [form, setForm] = useState({
        title: "", slug: "", description: "", shortDescription: "",
        thumbnail: "", tags: "", difficulty: "beginner", topic: "solana-basics",
        authorName: "", authorTitle: "", authorAvatar: "",
    });
    const [milestones, setMilestones] = useState<Milestone[]>([mkMilestone()]);

    function setF(k: keyof typeof form, v: string) { setForm(f => ({ ...f, [k]: v })); }

    // ── Milestone helpers ──
    function addMilestone() { setMilestones(m => [...m, mkMilestone()]); }
    function removeMilestone(i: number) { setMilestones(m => m.filter((_, idx) => idx !== i)); }
    function setMil(i: number, key: keyof Milestone, val: unknown) {
        setMilestones(m => m.map((x, idx) => idx === i ? { ...x, [key]: val } : x));
    }

    // ── Lesson helpers ──
    function addLesson(mi: number) { setMil(mi, "lessons", [...milestones[mi].lessons, mkLesson()]); }
    function removeLesson(mi: number, li: number) { setMil(mi, "lessons", milestones[mi].lessons.filter((_, i) => i !== li)); }
    function setLesson(mi: number, li: number, key: keyof Lesson, val: unknown) {
        const ls = milestones[mi].lessons.map((l, i) => i === li ? { ...l, [key]: val } : l);
        setMil(mi, "lessons", ls);
    }

    // ── Test helpers ──
    function addTest(mi: number) { setMil(mi, "tests", [...milestones[mi].tests, mkTest()]); }
    function removeTest(mi: number, ti: number) { setMil(mi, "tests", milestones[mi].tests.filter((_, i) => i !== ti)); }
    function setTest(mi: number, ti: number, key: keyof Test, val: unknown) {
        const ts = milestones[mi].tests.map((t, i) => i === ti ? { ...t, [key]: val } : t);
        setMil(mi, "tests", ts);
    }

    async function handleThumbnailUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]; if (!file) return;
        setUploading(true);
        try { const r = await adminUploadAsset(file); setF("thumbnail", r.url); }
        catch { setError("Image upload failed."); }
        finally { setUploading(false); }
    }

    async function handleSubmit() {
        setSaving(true); setError("");
        try {
            const payload = {
                title: form.title, slug: form.slug,
                description: form.description, shortDescription: form.shortDescription,
                thumbnail: form.thumbnail || undefined,
                tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
                difficulty: form.difficulty, topic: form.topic,
                author: { name: form.authorName, title: form.authorTitle || undefined, avatar: form.authorAvatar || undefined },
                milestones,
            };
            await adminCreateCourse(payload);
            router.push("/osadmin/admin/courses");
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Failed to create course.");
        } finally { setSaving(false); }
    }

    return (
        <div style={{ maxWidth: 860 }}>
            <div style={{ marginBottom: 20 }}>
                <Link href="/osadmin/admin/courses" className="abtn abtn-outline abtn-sm">
                    <ArrowLeft size={13} /> Back to Courses
                </Link>
            </div>

            <div className="page-header">
                <h1 className="page-title">New Course</h1>
                <p className="page-sub">Create a new draft course. You can publish it after it&apos;s ready.</p>
            </div>

            {error && <div className="aalert aalert-error" style={{ marginBottom: 16 }}>{error}</div>}

            {/* Basic Info */}
            <div className="acard" style={{ marginBottom: 16 }}>
                <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Basic Information</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div className="aform-row">
                        <div className="aform-group">
                            <label className="aform-label">Title *</label>
                            <input className="ainput" placeholder="Introduction to Solana" value={form.title} onChange={e => setF("title", e.target.value)} />
                        </div>
                        <div className="aform-group">
                            <label className="aform-label">Slug * (URL-safe)</label>
                            <input className="ainput" placeholder="intro-to-solana" value={form.slug} onChange={e => setF("slug", e.target.value.toLowerCase().replace(/\s+/g, "-"))} />
                        </div>
                    </div>
                    <div className="aform-group">
                        <label className="aform-label">Description *</label>
                        <textarea className="atextarea" rows={3} placeholder="Full course description…" value={form.description} onChange={e => setF("description", e.target.value)} />
                    </div>
                    <div className="aform-group">
                        <label className="aform-label">Short Description * (max 160 chars)</label>
                        <input className="ainput" maxLength={160} placeholder="One-liner preview" value={form.shortDescription} onChange={e => setF("shortDescription", e.target.value)} />
                    </div>
                    <div className="aform-row">
                        <div className="aform-group">
                            <label className="aform-label">Difficulty *</label>
                            <select className="aselect" style={{ width: "100%" }} value={form.difficulty} onChange={e => setF("difficulty", e.target.value)}>
                                {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                        <div className="aform-group">
                            <label className="aform-label">Topic *</label>
                            <select className="aselect" style={{ width: "100%" }} value={form.topic} onChange={e => setF("topic", e.target.value)}>
                                {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="aform-group">
                        <label className="aform-label">Tags (comma-separated)</label>
                        <input className="ainput" placeholder="solana, web3, blockchain" value={form.tags} onChange={e => setF("tags", e.target.value)} />
                    </div>
                    <div className="aform-group">
                        <label className="aform-label">Thumbnail Image</label>
                        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                            <input className="ainput" placeholder="https://…" value={form.thumbnail} onChange={e => setF("thumbnail", e.target.value)} />
                            <label className="abtn abtn-outline abtn-sm" style={{ cursor: "pointer", whiteSpace: "nowrap" }}>
                                <Upload size={12} /> {uploading ? "Uploading…" : "Upload"}
                                <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleThumbnailUpload} />
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            {/* Author */}
            <div className="acard" style={{ marginBottom: 16 }}>
                <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Author *</h2>
                <div className="aform-row">
                    <div className="aform-group">
                        <label className="aform-label">Name *</label>
                        <input className="ainput" placeholder="Jane Doe" value={form.authorName} onChange={e => setF("authorName", e.target.value)} />
                    </div>
                    <div className="aform-group">
                        <label className="aform-label">Title</label>
                        <input className="ainput" placeholder="Solana Developer" value={form.authorTitle} onChange={e => setF("authorTitle", e.target.value)} />
                    </div>
                    <div className="aform-group">
                        <label className="aform-label">Avatar URL</label>
                        <input className="ainput" placeholder="https://…" value={form.authorAvatar} onChange={e => setF("authorAvatar", e.target.value)} />
                    </div>
                </div>
            </div>

            {/* Milestones */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 16 }}>
                {milestones.map((mil, mi) => (
                    <div key={mi} className="acard">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                            <h2 style={{ fontSize: 14, fontWeight: 700 }}>Milestone {mi + 1}</h2>
                            {milestones.length > 1 && (
                                <button className="abtn abtn-danger abtn-sm" onClick={() => removeMilestone(mi)}><Trash2 size={12} /></button>
                            )}
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            <div className="aform-row">
                                <div className="aform-group">
                                    <label className="aform-label">Title *</label>
                                    <input className="ainput" placeholder="Getting Started" value={mil.title} onChange={e => setMil(mi, "title", e.target.value)} />
                                </div>
                                <div className="aform-group" style={{ maxWidth: 130, flex: "0 0 auto" }}>
                                    <label className="aform-label">XP Reward *</label>
                                    <input className="ainput" type="number" min={0} value={mil.xpReward} onChange={e => setMil(mi, "xpReward", Number(e.target.value))} />
                                </div>
                            </div>
                            <div className="aform-group">
                                <label className="aform-label">Description</label>
                                <input className="ainput" placeholder="What learners will accomplish…" value={mil.description} onChange={e => setMil(mi, "description", e.target.value)} />
                            </div>

                            {/* Lessons */}
                            <div style={{ marginTop: 4 }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--admin-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Lessons</div>
                                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                    {mil.lessons.map((ls, li) => (
                                        <div key={li} style={{ background: "var(--admin-surface2)", borderRadius: 8, padding: "10px 12px", display: "flex", gap: 8, alignItems: "flex-start" }}>
                                            <div style={{ flex: 3 }}>
                                                <input className="ainput" placeholder={`Lesson ${li + 1} title`} value={ls.title} onChange={e => setLesson(mi, li, "title", e.target.value)} />
                                            </div>
                                            <select className="aselect" value={ls.type} onChange={e => setLesson(mi, li, "type", e.target.value)}>
                                                <option value="markdown">Markdown</option>
                                                <option value="video">Video</option>
                                            </select>
                                            <input className="ainput" type="number" min={1} style={{ width: 70 }} placeholder="min" value={ls.duration} onChange={e => setLesson(mi, li, "duration", Number(e.target.value))} />
                                            {mil.lessons.length > 1 && (
                                                <button className="abtn abtn-danger abtn-sm" onClick={() => removeLesson(mi, li)}><Trash2 size={11} /></button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <button className="abtn abtn-outline abtn-sm" style={{ marginTop: 8 }} onClick={() => addLesson(mi)}>
                                    <Plus size={12} /> Add Lesson
                                </button>
                            </div>

                            {/* Tests */}
                            <div style={{ marginTop: 4 }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--admin-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Tests</div>
                                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                    {mil.tests.map((ts, ti) => (
                                        <div key={ti} style={{ background: "var(--admin-surface2)", borderRadius: 8, padding: "10px 12px" }}>
                                            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                                                <input className="ainput" placeholder={`Test ${ti + 1} title`} value={ts.title} onChange={e => setTest(mi, ti, "title", e.target.value)} style={{ flex: 1 }} />
                                                <select className="aselect" value={ts.type} onChange={e => setTest(mi, ti, "type", e.target.value as "quiz" | "code_challenge")}>
                                                    <option value="quiz">Quiz</option>
                                                    <option value="code_challenge">Code Challenge</option>
                                                </select>
                                                <input className="ainput" type="number" min={0} max={100} style={{ width: 80 }} placeholder="Pass%" value={ts.passThreshold} onChange={e => setTest(mi, ti, "passThreshold", Number(e.target.value))} />
                                                {mil.tests.length > 1 && (
                                                    <button className="abtn abtn-danger abtn-sm" onClick={() => removeTest(mi, ti)}><Trash2 size={11} /></button>
                                                )}
                                            </div>
                                            {ts.type === "quiz" && (
                                                <div style={{ fontSize: 11, color: "var(--admin-muted)" }}>
                                                    Quiz questions can be added here (simplified view — full quiz builder available in course edit page).
                                                </div>
                                            )}
                                            {ts.type === "code_challenge" && (
                                                <div style={{ fontSize: 11, color: "var(--admin-muted)" }}>
                                                    Code challenge details configured in course edit page.
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <button className="abtn abtn-outline abtn-sm" style={{ marginTop: 8 }} onClick={() => addTest(mi)}>
                                    <Plus size={12} /> Add Test
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <button className="abtn abtn-outline" style={{ marginBottom: 16 }} onClick={addMilestone}>
                <Plus size={14} /> Add Milestone
            </button>

            {/* Submit */}
            <div className="acard">
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <button className="abtn abtn-primary" disabled={saving} onClick={handleSubmit} style={{ minWidth: 160 }}>
                        {saving ? <span className="aspinner" /> : null}
                        {saving ? "Saving…" : "Save as Draft"}
                    </button>
                    <span style={{ fontSize: 12, color: "var(--admin-muted)" }}>
                        Draft will be visible in Courses. Publish separately when ready.
                    </span>
                </div>
            </div>
        </div>
    );
}
