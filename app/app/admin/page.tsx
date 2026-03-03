"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  getAllCourses, 
  createCourse, 
  updateCourse, 
  deleteCourse,
  getAllLessons,
  createLesson,
  updateLesson,
  deleteLesson,
  getAnalytics,
  testConnection,
  AdminCourse,
  AdminLesson
} from "@/lib/sanity/admin";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
  BookOpenIcon, 
  File02Icon, 
  ChartIcon,
  Add01Icon,
  Edit01Icon,
  Delete02Icon
} from "@hugeicons/core-free-icons";

type Tab = "courses" | "lessons" | "analytics";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>("courses");
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [lessons, setLessons] = useState<AdminLesson[]>([]);
  const [analytics, setAnalytics] = useState<{ totalCourses: number; totalLessons: number; totalEnrollments: number; courses: { title: string; lessonCount: number }[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<{ success: boolean; message: string } | null>(null);

  const handleTestConnection = async () => {
    const result = await testConnection();
    setConnectionStatus(result);
  };
  
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState<AdminCourse | null>(null);
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [editingLesson, setEditingLesson] = useState<AdminLesson | null>(null);
  
  const [courseForm, setCourseForm] = useState({
    title: "",
    slug: "",
    description: "",
    level: "Beginner",
    totalXp: 0,
    creator: "",
    order: 0,
  });
  
  const [lessonForm, setLessonForm] = useState({
    title: "",
    slug: "",
    type: "reading" as "reading" | "coding" | "quiz",
    xpReward: 0,
    order: 0,
    starterCode: "",
    solution: "",
    testCases: "",
  });

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === "courses") {
        const data = await getAllCourses();
        setCourses(data);
      } else if (activeTab === "lessons") {
        const lessonsData = await getAllLessons();
        setLessons(lessonsData);
      } else if (activeTab === "analytics") {
        const data = await getAnalytics();
        setAnalytics(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = async (tab: Tab) => {
    setActiveTab(tab);
    setShowCourseForm(false);
    setShowLessonForm(false);
    setEditingCourse(null);
    setEditingLesson(null);
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const handleCreateCourse = async () => {
    try {
      await createCourse({
        title: courseForm.title,
        slug: { current: courseForm.slug },
        description: courseForm.description,
        level: courseForm.level as "Beginner" | "Intermediate" | "Advanced",
        totalXp: courseForm.totalXp,
        creator: courseForm.creator,
        order: courseForm.order,
      });
      setShowCourseForm(false);
      setCourseForm({ title: "", slug: "", description: "", level: "Beginner", totalXp: 0, creator: "", order: 0 });
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create course");
    }
  };

  const handleUpdateCourse = async () => {
    if (!editingCourse?._id) return;
    try {
      await updateCourse(editingCourse._id, {
        title: courseForm.title,
        slug: { current: courseForm.slug },
        description: courseForm.description,
        level: courseForm.level as "Beginner" | "Intermediate" | "Advanced",
        totalXp: courseForm.totalXp,
        creator: courseForm.creator,
        order: courseForm.order,
      });
      setShowCourseForm(false);
      setEditingCourse(null);
      setCourseForm({ title: "", slug: "", description: "", level: "Beginner", totalXp: 0, creator: "", order: 0 });
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update course");
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (!confirm("Are you sure you want to delete this course?")) return;
    try {
      await deleteCourse(id);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete course");
    }
  };

  const handleCreateLesson = async () => {
    try {
      await createLesson({
        title: lessonForm.title,
        slug: { current: lessonForm.slug },
        type: lessonForm.type,
        xpReward: lessonForm.xpReward,
        order: lessonForm.order,
        starterCode: lessonForm.starterCode,
        solution: lessonForm.solution,
        testCases: lessonForm.testCases ? JSON.parse(lessonForm.testCases) : [],
      });
      setShowLessonForm(false);
      setLessonForm({ title: "", slug: "", type: "reading", xpReward: 0, order: 0, starterCode: "", solution: "", testCases: "" });
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create lesson");
    }
  };

  const handleUpdateLesson = async () => {
    if (!editingLesson?._id) return;
    try {
      await updateLesson(editingLesson._id, {
        title: lessonForm.title,
        slug: { current: lessonForm.slug },
        type: lessonForm.type,
        xpReward: lessonForm.xpReward,
        order: lessonForm.order,
        starterCode: lessonForm.starterCode,
        solution: lessonForm.solution,
        testCases: lessonForm.testCases ? JSON.parse(lessonForm.testCases) : [],
      });
      setShowLessonForm(false);
      setEditingLesson(null);
      setLessonForm({ title: "", slug: "", type: "reading", xpReward: 0, order: 0, starterCode: "", solution: "", testCases: "" });
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update lesson");
    }
  };

  const handleDeleteLesson = async (id: string) => {
    if (!confirm("Are you sure you want to delete this lesson?")) return;
    try {
      await deleteLesson(id);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete lesson");
    }
  };

  const openEditCourse = (course: AdminCourse) => {
    setEditingCourse(course);
    setCourseForm({
      title: course.title,
      slug: course.slug.current,
      description: course.description,
      level: course.level,
      totalXp: course.totalXp,
      creator: course.creator,
      order: course.order,
    });
    setShowCourseForm(true);
  };

  const openEditLesson = (lesson: AdminLesson) => {
    setEditingLesson(lesson);
    setLessonForm({
      title: lesson.title,
      slug: lesson.slug.current,
      type: lesson.type,
      xpReward: lesson.xpReward,
      order: lesson.order,
      starterCode: lesson.starterCode || "",
      solution: lesson.solution || "",
      testCases: lesson.testCases ? JSON.stringify(lesson.testCases, null, 2) : "",
    });
    setShowLessonForm(true);
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
        
        <div className="flex gap-4 mb-4">
          <Button onClick={handleTestConnection} variant="outline">
            Test Connection
          </Button>
          {connectionStatus && (
            <div className={`px-3 py-1 rounded text-sm ${
              connectionStatus.success 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {connectionStatus.message}
            </div>
          )}
        </div>
        
        <div className="flex gap-4 mb-8">
          <Button
            variant={activeTab === "courses" ? "default" : "outline"}
            onClick={() => handleTabChange("courses")}
          >
            <HugeiconsIcon icon={BookOpenIcon} size={18} className="mr-2" />
            Courses
          </Button>
          <Button
            variant={activeTab === "lessons" ? "default" : "outline"}
            onClick={() => handleTabChange("lessons")}
          >
            <HugeiconsIcon icon={File02Icon} size={18} className="mr-2" />
            Lessons
          </Button>
          <Button
            variant={activeTab === "analytics" ? "default" : "outline"}
            onClick={() => handleTabChange("analytics")}
          >
            <HugeiconsIcon icon={ChartIcon} size={18} className="mr-2" />
            Analytics
          </Button>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-2 rounded mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <>
            {activeTab === "courses" && (
              <div>
                {!showCourseForm ? (
                  <div>
                    <Button onClick={() => setShowCourseForm(true)} className="mb-4">
                        <HugeiconsIcon icon={Add01Icon} size={18} className="mr-2" />
                      Add Course
                    </Button>
                    <div className="grid gap-4">
                      {courses.map((course) => (
                        <Card key={course._id}>
                          <CardContent className="p-4 flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold">{course.title}</h3>
                              <p className="text-sm text-muted-foreground">{course.slug.current}</p>
                              <div className="flex gap-2 mt-2">
                                <Badge variant="secondary">{course.level}</Badge>
                                <Badge>{course.totalXp} XP</Badge>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" onClick={() => openEditCourse(course)}>
                                <HugeiconsIcon icon={Edit01Icon} size={16} />
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handleDeleteCourse(course._id!)}>
                                <HugeiconsIcon icon={Delete02Icon} size={16} />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      {courses.length === 0 && (
                        <p className="text-center text-muted-foreground py-8">No courses found</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>{editingCourse ? "Edit Course" : "Create Course"}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Title</Label>
                        <Input 
                          value={courseForm.title} 
                          onChange={(e) => setCourseForm({...courseForm, title: e.target.value})}
                          placeholder="Course title"
                        />
                      </div>
                      <div>
                        <Label>Slug</Label>
                        <Input 
                          value={courseForm.slug} 
                          onChange={(e) => setCourseForm({...courseForm, slug: e.target.value})}
                          placeholder="course-slug"
                        />
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Textarea 
                          value={courseForm.description} 
                          onChange={(e) => setCourseForm({...courseForm, description: e.target.value})}
                          placeholder="Course description"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Level</Label>
                          <Select value={courseForm.level} onValueChange={(v) => v && setCourseForm({...courseForm, level: v})}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Beginner">Beginner</SelectItem>
                              <SelectItem value="Intermediate">Intermediate</SelectItem>
                              <SelectItem value="Advanced">Advanced</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Total XP</Label>
                          <Input 
                            type="number"
                            value={courseForm.totalXp} 
                            onChange={(e) => setCourseForm({...courseForm, totalXp: parseInt(e.target.value) || 0})}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Creator</Label>
                          <Input 
                            value={courseForm.creator} 
                            onChange={(e) => setCourseForm({...courseForm, creator: e.target.value})}
                            placeholder="Creator name"
                          />
                        </div>
                        <div>
                          <Label>Order</Label>
                          <Input 
                            type="number"
                            value={courseForm.order} 
                            onChange={(e) => setCourseForm({...courseForm, order: parseInt(e.target.value) || 0})}
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={editingCourse ? handleUpdateCourse : handleCreateCourse}>
                          {editingCourse ? "Update" : "Create"}
                        </Button>
                        <Button variant="outline" onClick={() => { setShowCourseForm(false); setEditingCourse(null); }}>
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {activeTab === "lessons" && (
              <div>
                {!showLessonForm ? (
                  <div>
                    <Button onClick={() => setShowLessonForm(true)} className="mb-4">
                      <HugeiconsIcon icon={Add01Icon} size={18} className="mr-2" />
                      Add Lesson
                    </Button>
                    <div className="grid gap-4">
                      {lessons.map((lesson) => (
                        <Card key={lesson._id}>
                          <CardContent className="p-4 flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold">{lesson.title}</h3>
                              <p className="text-sm text-muted-foreground">{lesson.slug.current}</p>
                              <div className="flex gap-2 mt-2">
                                <Badge variant="secondary">{lesson.type}</Badge>
                                <Badge>{lesson.xpReward} XP</Badge>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" onClick={() => openEditLesson(lesson)}>
                                <HugeiconsIcon icon={Edit01Icon} size={16} />
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handleDeleteLesson(lesson._id!)}>
                                <HugeiconsIcon icon={Delete02Icon} size={16} />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      {lessons.length === 0 && (
                        <p className="text-center text-muted-foreground py-8">No lessons found</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>{editingLesson ? "Edit Lesson" : "Create Lesson"}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Title</Label>
                        <Input 
                          value={lessonForm.title} 
                          onChange={(e) => setLessonForm({...lessonForm, title: e.target.value})}
                          placeholder="Lesson title"
                        />
                      </div>
                      <div>
                        <Label>Slug</Label>
                        <Input 
                          value={lessonForm.slug} 
                          onChange={(e) => setLessonForm({...lessonForm, slug: e.target.value})}
                          placeholder="lesson-slug"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label>Type</Label>
                          <Select value={lessonForm.type} onValueChange={(v) => v && setLessonForm({...lessonForm, type: v as "reading" | "coding" | "quiz"})}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="reading">Reading</SelectItem>
                              <SelectItem value="coding">Coding</SelectItem>
                              <SelectItem value="quiz">Quiz</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>XP Reward</Label>
                          <Input 
                            type="number"
                            value={lessonForm.xpReward} 
                            onChange={(e) => setLessonForm({...lessonForm, xpReward: parseInt(e.target.value) || 0})}
                          />
                        </div>
                        <div>
                          <Label>Order</Label>
                          <Input 
                            type="number"
                            value={lessonForm.order} 
                            onChange={(e) => setLessonForm({...lessonForm, order: parseInt(e.target.value) || 0})}
                          />
                        </div>
                      </div>
                      {lessonForm.type === "coding" && (
                        <>
                          <div>
                            <Label>Starter Code</Label>
                            <Textarea 
                              value={lessonForm.starterCode} 
                              onChange={(e) => setLessonForm({...lessonForm, starterCode: e.target.value})}
                              placeholder="// Starter code for the challenge"
                              className="font-mono text-sm"
                              rows={6}
                            />
                          </div>
                          <div>
                            <Label>Solution Code</Label>
                            <Textarea 
                              value={lessonForm.solution} 
                              onChange={(e) => setLessonForm({...lessonForm, solution: e.target.value})}
                              placeholder="// Solution code"
                              className="font-mono text-sm"
                              rows={6}
                            />
                          </div>
                          <div>
                            <Label>Test Cases (JSON)</Label>
                            <Textarea 
                              value={lessonForm.testCases} 
                              onChange={(e) => setLessonForm({...lessonForm, testCases: e.target.value})}
                              placeholder='[{"input": "1,2", "expected": "3", "description": "Add two numbers"}]'
                              className="font-mono text-sm"
                              rows={4}
                            />
                          </div>
                        </>
                      )}
                      <div className="flex gap-2">
                        <Button onClick={editingLesson ? handleUpdateLesson : handleCreateLesson}>
                          {editingLesson ? "Update" : "Create"}
                        </Button>
                        <Button variant="outline" onClick={() => { setShowLessonForm(false); setEditingLesson(null); }}>
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {activeTab === "analytics" && analytics && (
              <div>
                <div className="grid grid-cols-3 gap-4 mb-8">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold">{analytics.totalCourses}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">Total Lessons</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold">{analytics.totalLessons}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">Total Enrollments</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold">{analytics.totalEnrollments}</p>
                    </CardContent>
                  </Card>
                </div>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Courses Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analytics.courses.map((course, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <span>{course.title}</span>
                          <Badge>{course.lessonCount} lessons</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
