'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Plus,
  Trash2,
  GripVertical,
  Save,
  Loader2,
  FileText,
  Video,
  Code2,
  ChevronUp,
  ChevronDown,
  Copy,
  BookOpen,
  Settings,
  List,
  Eye,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';

// Types
interface TestCase {
  id: string;
  description: string;
  input?: string;
  expectedOutput: string;
  hidden?: boolean;
}

interface ChallengeConfig {
  prompt: string;
  starterCode: string;
  solution: string;
  language: 'typescript' | 'javascript' | 'rust' | 'json';
  testCases: TestCase[];
  functionName?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  timeEstimate?: number;
}

interface Lesson {
  id: string;
  slug: string;
  title: string;
  type: 'content' | 'challenge' | 'video' | 'reading' | 'quiz';
  order: number;
  moduleId: string;
  xpReward: number;
  duration: number;
  videoDurationSeconds?: number;
  content: string;
  videoUrl?: string | null;
  videoProvider?: string | null;
  challenge?: ChallengeConfig | null;
  hints?: string[];
}

interface Module {
  id: string;
  title: string;
  description: string;
  order: number;
  lessons: Lesson[];
}

interface CourseData {
  title: string;
  slug: string;
  description: string;
  thumbnail: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number;
  xpReward: number;
  track: string;
  tags: string[];
  prerequisites: string[];
  learningObjectives: string[];
  modules: Module[];
  published: boolean;
}

interface TrackOption {
  slug: string;
  title: string;
}

const NO_TRACK_VALUE = '__none__';

// Initial state
const initialCourse: CourseData = {
  title: '',
  slug: '',
  description: '',
  thumbnail: '',
  difficulty: 'beginner',
  duration: 0,
  xpReward: 500,
  track: '',
  tags: [],
  prerequisites: [],
  learningObjectives: [],
  modules: [],
  published: false,
};

// Helper to generate slug
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Helper to generate unique ID
function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Detect video provider from URL
function detectVideoProvider(url: string): string {
  if (!url) return 'direct';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('vimeo.com')) return 'vimeo';
  if (url.includes('facebook.com') || url.includes('fb.watch')) return 'facebook';
  return 'direct';
}

export default function NewCoursePage() {
  const router = useRouter();
  const [course, setCourse] = useState<CourseData>(initialCourse);
  const [trackOptions, setTrackOptions] = useState<TrackOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [openModules, setOpenModules] = useState<string[]>([]);
  const [lessonDialogOpen, setLessonDialogOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<{
    moduleId: string;
    lesson: Lesson | null;
  } | null>(null);
  const [thumbnailUploading, setThumbnailUploading] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [objectiveInput, setObjectiveInput] = useState('');
  const [prerequisiteInput, setPrerequisiteInput] = useState('');

  // Auto-generate slug from title
  useEffect(() => {
    if (!course.slug && course.title) {
      setCourse((prev) => ({ ...prev, slug: generateSlug(prev.title) }));
    }
  }, [course.title, course.slug]);

  // Update course duration based on lessons
  useEffect(() => {
    const totalDuration = course.modules.reduce((acc, module) => {
      return (
        acc + module.lessons.reduce((lessonAcc, lesson) => lessonAcc + (lesson.duration || 0), 0)
      );
    }, 0);
    setCourse((prev) => ({ ...prev, duration: totalDuration }));
  }, [course.modules]);

  useEffect(() => {
    const fetchTrackOptions = async () => {
      try {
        const response = await fetch('/api/admin/tracks');
        const data = await response.json();

        if (response.ok) {
          setTrackOptions((data.tracks || []).map((track: any) => ({
            slug: track.slug,
            title: track.title,
          })));
        }
      } catch (error) {
        console.error('Error fetching track options:', error);
      }
    };

    fetchTrackOptions();
  }, []);

  const handleSave = async () => {
    // Validation
    if (!course.title.trim()) {
      toast.error('Course title is required');
      setActiveTab('details');
      return;
    }
    if (!course.slug.trim()) {
      toast.error('Course slug is required');
      setActiveTab('details');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(course),
      });
      const data = await res.json();

      if (res.ok) {
        toast.success('Course created successfully');
        router.push('/admin-premium/courses');
      } else {
        toast.error(data.error || 'Failed to create course');
      }
    } catch (error) {
      toast.error('Failed to create course');
      console.error('Error creating course:', error);
    } finally {
      setSaving(false);
    }
  };

  // Module operations
  const addModule = () => {
    const newModule: Module = {
      id: generateId('module'),
      title: `Module ${course.modules.length + 1}`,
      description: '',
      order: course.modules.length + 1,
      lessons: [],
    };
    setCourse((prev) => ({
      ...prev,
      modules: [...prev.modules, newModule],
    }));
    setOpenModules((prev) => [...prev, newModule.id]);
  };

  const updateModule = (moduleId: string, updates: Partial<Module>) => {
    setCourse((prev) => ({
      ...prev,
      modules: prev.modules.map((m) => (m.id === moduleId ? { ...m, ...updates } : m)),
    }));
  };

  const deleteModule = (moduleId: string) => {
    setCourse((prev) => ({
      ...prev,
      modules: prev.modules
        .filter((m) => m.id !== moduleId)
        .map((m, idx) => ({ ...m, order: idx + 1 })),
    }));
  };

  const moveModule = (moduleId: string, direction: 'up' | 'down') => {
    setCourse((prev) => {
      const idx = prev.modules.findIndex((m) => m.id === moduleId);
      if (
        (direction === 'up' && idx === 0) ||
        (direction === 'down' && idx === prev.modules.length - 1)
      ) {
        return prev;
      }

      const newModules = [...prev.modules];
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
      [newModules[idx], newModules[swapIdx]] = [newModules[swapIdx], newModules[idx]];

      return {
        ...prev,
        modules: newModules.map((m, i) => ({ ...m, order: i + 1 })),
      };
    });
  };

  // Lesson operations
  const openLessonDialog = (moduleId: string, lesson?: Lesson) => {
    setEditingLesson({
      moduleId,
      lesson: lesson || null,
    });
    setLessonDialogOpen(true);
  };

  const saveLesson = (lessonData: Partial<Lesson>) => {
    if (!editingLesson) return;

    const { moduleId, lesson } = editingLesson;

    setCourse((prev) => ({
      ...prev,
      modules: prev.modules.map((m) => {
        if (m.id !== moduleId) return m;

        if (lesson) {
          // Update existing lesson
          return {
            ...m,
            lessons: m.lessons.map((l) => (l.id === lesson.id ? { ...l, ...lessonData } : l)),
          };
        } else {
          // Add new lesson
          const newLesson: Lesson = {
            id: generateId('lesson'),
            slug: generateSlug(lessonData.title || ''),
            title: lessonData.title || '',
            type: lessonData.type || 'reading',
            order: m.lessons.length + 1,
            moduleId: m.id,
            xpReward: lessonData.xpReward || 50,
            duration: lessonData.duration || 10,
            content: lessonData.content || '',
            videoUrl: lessonData.videoUrl || null,
            videoProvider: lessonData.videoProvider || null,
            hints: lessonData.hints || [],
          };
          return {
            ...m,
            lessons: [...m.lessons, newLesson],
          };
        }
      }),
    }));

    setLessonDialogOpen(false);
    setEditingLesson(null);
  };

  const deleteLesson = (moduleId: string, lessonId: string) => {
    setCourse((prev) => ({
      ...prev,
      modules: prev.modules.map((m) => {
        if (m.id !== moduleId) return m;
        return {
          ...m,
          lessons: m.lessons
            .filter((l) => l.id !== lessonId)
            .map((l, idx) => ({ ...l, order: idx + 1 })),
        };
      }),
    }));
  };

  const moveLesson = (moduleId: string, lessonId: string, direction: 'up' | 'down') => {
    setCourse((prev) => ({
      ...prev,
      modules: prev.modules.map((m) => {
        if (m.id !== moduleId) return m;

        const idx = m.lessons.findIndex((l) => l.id === lessonId);
        if (
          (direction === 'up' && idx === 0) ||
          (direction === 'down' && idx === m.lessons.length - 1)
        ) {
          return m;
        }

        const newLessons = [...m.lessons];
        const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
        [newLessons[idx], newLessons[swapIdx]] = [newLessons[swapIdx], newLessons[idx]];

        return {
          ...m,
          lessons: newLessons.map((l, i) => ({ ...l, order: i + 1 })),
        };
      }),
    }));
  };

  // Tag/objective/prerequisite operations
  const addTag = () => {
    if (tagInput.trim() && !course.tags.includes(tagInput.trim())) {
      setCourse((prev) => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setCourse((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }));
  };

  const addObjective = () => {
    if (objectiveInput.trim() && !course.learningObjectives.includes(objectiveInput.trim())) {
      setCourse((prev) => ({
        ...prev,
        learningObjectives: [...prev.learningObjectives, objectiveInput.trim()],
      }));
      setObjectiveInput('');
    }
  };

  const removeObjective = (obj: string) => {
    setCourse((prev) => ({
      ...prev,
      learningObjectives: prev.learningObjectives.filter((o) => o !== obj),
    }));
  };

  const addPrerequisite = () => {
    if (prerequisiteInput.trim() && !course.prerequisites.includes(prerequisiteInput.trim())) {
      setCourse((prev) => ({
        ...prev,
        prerequisites: [...prev.prerequisites, prerequisiteInput.trim()],
      }));
      setPrerequisiteInput('');
    }
  };

  const removePrerequisite = (prereq: string) => {
    setCourse((prev) => ({
      ...prev,
      prerequisites: prev.prerequisites.filter((p) => p !== prereq),
    }));
  };

  const handleThumbnailUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setThumbnailUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`/api/newupload?filename=${encodeURIComponent(file.name)}`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || result?.message || 'Failed to upload thumbnail');
      }

      setCourse((prev) => ({ ...prev, thumbnail: result.link }));
      toast.success('Thumbnail uploaded successfully');
    } catch (error) {
      console.error('Error uploading thumbnail:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload thumbnail');
    } finally {
      setThumbnailUploading(false);
      event.target.value = '';
    }
  };

  const getLessonTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="h-4 w-4 text-purple-500" />;
      case 'challenge':
      case 'quiz':
        return <Code2 className="h-4 w-4 text-orange-500" />;
      default:
        return <FileText className="h-4 w-4 text-blue-500" />;
    }
  };

  const totalLessons = course.modules.reduce((acc, m) => acc + m.lessons.length, 0);

  return (
    <div className="container max-w-5xl py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin-premium/courses">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Create Course</h1>
            <p className="text-muted-foreground mt-1">
              Build a new course with modules and lessons.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Switch
              id="published"
              checked={course.published}
              onCheckedChange={(checked) => setCourse((prev) => ({ ...prev, published: checked }))}
            />
            <Label htmlFor="published">Published</Label>
          </div>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Course
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="py-4">
            <div className="text-muted-foreground text-sm">Modules</div>
            <div className="text-2xl font-bold">{course.modules.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="text-muted-foreground text-sm">Lessons</div>
            <div className="text-2xl font-bold">{totalLessons}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="text-muted-foreground text-sm">Duration</div>
            <div className="text-2xl font-bold">{course.duration} min</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="text-muted-foreground text-sm">XP Reward</div>
            <div className="text-2xl font-bold">{course.xpReward}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="details" className="gap-2">
            <Settings className="h-4 w-4" />
            Details
          </TabsTrigger>
          <TabsTrigger value="modules" className="gap-2">
            <List className="h-4 w-4" />
            Modules & Lessons
          </TabsTrigger>
          <TabsTrigger value="preview" className="gap-2">
            <Eye className="h-4 w-4" />
            Preview
          </TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Set the core details for your course.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    placeholder="Introduction to Solana"
                    value={course.title}
                    onChange={(e) => setCourse((prev) => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug *</Label>
                  <Input
                    id="slug"
                    placeholder="introduction-to-solana"
                    value={course.slug}
                    onChange={(e) => setCourse((prev) => ({ ...prev, slug: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="A comprehensive introduction to Solana blockchain development..."
                  value={course.description}
                  rows={4}
                  onChange={(e) => setCourse((prev) => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="thumbnailUpload">Thumbnail Image</Label>
                  <div className="space-y-2">
                    <Input
                      id="thumbnailUpload"
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                      onChange={handleThumbnailUpload}
                      disabled={thumbnailUploading}
                    />
                    <p className="text-muted-foreground text-xs">
                      Upload a course cover image (PNG, JPG, WEBP, or GIF).
                    </p>
                    {thumbnailUploading && (
                      <div className="text-muted-foreground flex items-center gap-2 text-sm">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Uploading thumbnail...
                      </div>
                    )}
                    {course.thumbnail && (
                      <div className="space-y-2 rounded-md border p-3">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Upload className="h-4 w-4" />
                          Uploaded Thumbnail
                        </div>
                        <div className="relative h-28 w-full">
                          <Image
                            src={course.thumbnail}
                            alt="Course thumbnail preview"
                            fill
                            className="rounded-md object-cover"
                            unoptimized
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="track">Learning Track</Label>
                  <Select
                    value={course.track || NO_TRACK_VALUE}
                    onValueChange={(value) =>
                      setCourse((prev) => ({
                        ...prev,
                        track: value === NO_TRACK_VALUE ? '' : value,
                      }))
                    }
                  >
                    <SelectTrigger id="track">
                      <SelectValue placeholder="Select a track" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_TRACK_VALUE}>No track (standalone)</SelectItem>
                      {trackOptions.map((track) => (
                        <SelectItem key={track.slug} value={track.slug}>
                          {track.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="difficulty">Difficulty</Label>
                  <Select
                    value={course.difficulty}
                    onValueChange={(value: 'beginner' | 'intermediate' | 'advanced') =>
                      setCourse((prev) => ({ ...prev, difficulty: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="xpReward">XP Reward</Label>
                  <Input
                    id="xpReward"
                    type="number"
                    value={course.xpReward}
                    onChange={(e) =>
                      setCourse((prev) => ({
                        ...prev,
                        xpReward: parseInt(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Duration (auto)</Label>
                  <Input value={`${course.duration} minutes`} disabled />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
              <CardDescription>Add tags to help categorize this course.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-2 flex flex-wrap gap-2">
                {course.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button onClick={() => removeTag(tag)} className="hover:text-destructive">
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a tag..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <Button type="button" variant="secondary" onClick={addTag}>
                  Add
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Learning Objectives</CardTitle>
              <CardDescription>What will students learn from this course?</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-2 space-y-2">
                {course.learningObjectives.map((obj, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="bg-primary text-primary-foreground flex h-6 w-6 items-center justify-center rounded-full text-xs">
                      {idx + 1}
                    </span>
                    <span className="flex-1">{obj}</span>
                    <Button variant="ghost" size="icon" onClick={() => removeObjective(obj)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a learning objective..."
                  value={objectiveInput}
                  onChange={(e) => setObjectiveInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addObjective())}
                />
                <Button type="button" variant="secondary" onClick={addObjective}>
                  Add
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Prerequisites</CardTitle>
              <CardDescription>
                What should students know before taking this course?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-2 space-y-2">
                {course.prerequisites.map((prereq, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-muted-foreground">•</span>
                    <span className="flex-1">{prereq}</span>
                    <Button variant="ghost" size="icon" onClick={() => removePrerequisite(prereq)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a prerequisite..."
                  value={prerequisiteInput}
                  onChange={(e) => setPrerequisiteInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addPrerequisite())}
                />
                <Button type="button" variant="secondary" onClick={addPrerequisite}>
                  Add
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Modules Tab */}
        <TabsContent value="modules" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={addModule} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Module
            </Button>
          </div>

          {course.modules.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BookOpen className="text-muted-foreground mb-4 h-12 w-12 opacity-50" />
                <p className="text-lg font-medium">No modules yet</p>
                <p className="text-muted-foreground text-sm">
                  Add your first module to start building your course.
                </p>
                <Button onClick={addModule} className="mt-4 gap-2">
                  <Plus className="h-4 w-4" />
                  Add Module
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Accordion
              type="multiple"
              value={openModules}
              onValueChange={setOpenModules}
              className="space-y-4"
            >
              {course.modules.map((module, moduleIdx) => (
                <AccordionItem key={module.id} value={module.id} className="rounded-lg border">
                  <AccordionTrigger className="px-4 hover:no-underline">
                    <div className="flex flex-1 items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span
                          role="button"
                          tabIndex={moduleIdx === 0 ? -1 : 0}
                          aria-disabled={moduleIdx === 0}
                          className={`inline-flex h-6 w-6 items-center justify-center rounded-sm ${
                            moduleIdx === 0
                              ? 'cursor-not-allowed opacity-50'
                              : 'hover:bg-accent cursor-pointer'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (moduleIdx === 0) return;
                            moveModule(module.id, 'up');
                          }}
                          onKeyDown={(e) => {
                            if (moduleIdx === 0) return;
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              e.stopPropagation();
                              moveModule(module.id, 'up');
                            }
                          }}
                        >
                          <ChevronUp className="h-4 w-4" />
                        </span>
                        <span
                          role="button"
                          tabIndex={moduleIdx === course.modules.length - 1 ? -1 : 0}
                          aria-disabled={moduleIdx === course.modules.length - 1}
                          className={`inline-flex h-6 w-6 items-center justify-center rounded-sm ${
                            moduleIdx === course.modules.length - 1
                              ? 'cursor-not-allowed opacity-50'
                              : 'hover:bg-accent cursor-pointer'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (moduleIdx === course.modules.length - 1) return;
                            moveModule(module.id, 'down');
                          }}
                          onKeyDown={(e) => {
                            if (moduleIdx === course.modules.length - 1) return;
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              e.stopPropagation();
                              moveModule(module.id, 'down');
                            }
                          }}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </span>
                      </div>
                      <Badge variant="outline">Module {module.order}</Badge>
                      <span className="font-medium">{module.title}</span>
                      <Badge variant="secondary" className="ml-auto">
                        {module.lessons.length} lessons
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Module Title</Label>
                          <Input
                            value={module.title}
                            onChange={(e) => updateModule(module.id, { title: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Description</Label>
                          <Input
                            value={module.description}
                            onChange={(e) =>
                              updateModule(module.id, { description: e.target.value })
                            }
                          />
                        </div>
                      </div>

                      <Separator />

                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Lessons</h4>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openLessonDialog(module.id)}
                          className="gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Add Lesson
                        </Button>
                      </div>

                      {module.lessons.length === 0 ? (
                        <div className="text-muted-foreground rounded-lg border border-dashed p-4 text-center text-sm">
                          No lessons yet. Add your first lesson to this module.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {module.lessons.map((lesson, lessonIdx) => (
                            <div
                              key={lesson.id}
                              className="flex items-center gap-3 rounded-lg border p-3"
                            >
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => moveLesson(module.id, lesson.id, 'up')}
                                  disabled={lessonIdx === 0}
                                >
                                  <ChevronUp className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => moveLesson(module.id, lesson.id, 'down')}
                                  disabled={lessonIdx === module.lessons.length - 1}
                                >
                                  <ChevronDown className="h-3 w-3" />
                                </Button>
                              </div>
                              {getLessonTypeIcon(lesson.type)}
                              <span className="flex-1 font-medium">{lesson.title}</span>
                              <Badge variant="outline" className="text-xs">
                                {lesson.duration} min
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {lesson.xpReward} XP
                              </Badge>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => openLessonDialog(module.id, lesson)}
                              >
                                <Settings className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => deleteLesson(module.id, lesson.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}

                      <Separator />

                      <div className="flex justify-end">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteModule(module.id)}
                          className="gap-2"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete Module
                        </Button>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">{course.title || 'Untitled Course'}</CardTitle>
                  <CardDescription className="mt-2">
                    {course.description || 'No description'}
                  </CardDescription>
                </div>
                <Badge
                  variant="outline"
                  className={
                    course.difficulty === 'beginner'
                      ? 'border-green-500 text-green-600'
                      : course.difficulty === 'intermediate'
                        ? 'border-yellow-500 text-yellow-600'
                        : 'border-red-500 text-red-600'
                  }
                >
                  {course.difficulty}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-wrap gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Duration:</span>{' '}
                  <strong>{course.duration} min</strong>
                </div>
                <div>
                  <span className="text-muted-foreground">Modules:</span>{' '}
                  <strong>{course.modules.length}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground">Lessons:</span>{' '}
                  <strong>{totalLessons}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground">XP:</span>{' '}
                  <strong>{course.xpReward}</strong>
                </div>
              </div>

              {course.tags.length > 0 && (
                <div>
                  <h4 className="mb-2 font-medium">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {course.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {course.learningObjectives.length > 0 && (
                <div>
                  <h4 className="mb-2 font-medium">What you&apos;ll learn</h4>
                  <ul className="list-inside list-disc space-y-1">
                    {course.learningObjectives.map((obj, idx) => (
                      <li key={idx}>{obj}</li>
                    ))}
                  </ul>
                </div>
              )}

              {course.modules.length > 0 && (
                <div>
                  <h4 className="mb-2 font-medium">Course Content</h4>
                  <div className="space-y-2">
                    {course.modules.map((module) => (
                      <div key={module.id} className="rounded-lg border p-3">
                        <div className="flex items-center justify-between">
                          <div className="font-medium">
                            Module {module.order}: {module.title}
                          </div>
                          <Badge variant="outline">{module.lessons.length} lessons</Badge>
                        </div>
                        {module.lessons.length > 0 && (
                          <div className="mt-2 space-y-1 pl-4">
                            {module.lessons.map((lesson) => (
                              <div
                                key={lesson.id}
                                className="text-muted-foreground flex items-center gap-2 text-sm"
                              >
                                {getLessonTypeIcon(lesson.type)}
                                {lesson.title}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Lesson Editor Dialog */}
      <LessonEditorDialog
        open={lessonDialogOpen}
        onOpenChange={setLessonDialogOpen}
        lesson={editingLesson?.lesson ?? null}
        onSave={saveLesson}
      />
    </div>
  );
}

// Lesson Editor Dialog Component
interface LessonEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lesson: Lesson | null;
  onSave: (data: Partial<Lesson>) => void;
}

function LessonEditorDialog({ open, onOpenChange, lesson, onSave }: LessonEditorDialogProps) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<Lesson['type']>('reading');
  const [duration, setDuration] = useState(10);
  const [videoDurationSeconds, setVideoDurationSeconds] = useState(0);
  const [xpReward, setXpReward] = useState(50);
  const [content, setContent] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoProvider, setVideoProvider] = useState('');

  // Challenge state
  const [challengePrompt, setChallengePrompt] = useState('');
  const [challengeStarterCode, setChallengeStarterCode] = useState('');
  const [challengeSolution, setChallengeSolution] = useState('');
  const [challengeLanguage, setChallengeLanguage] =
    useState<ChallengeConfig['language']>('typescript');
  const [challengeFunctionName, setChallengeFunctionName] = useState('');
  const [challengeDifficulty, setChallengeDifficulty] = useState<
    'beginner' | 'intermediate' | 'advanced'
  >('intermediate');
  const [challengeTimeEstimate, setChallengeTimeEstimate] = useState(15);
  const [testCases, setTestCases] = useState<TestCase[]>([]);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open && lesson) {
      setTitle(lesson.title);
      setType(lesson.type);
      setDuration(lesson.duration);
      setVideoDurationSeconds(lesson.videoDurationSeconds || 0);
      setXpReward(lesson.xpReward);
      setContent(lesson.content || '');
      setVideoUrl(lesson.videoUrl || '');
      setVideoProvider(lesson.videoProvider || '');
      // Challenge fields
      if (lesson.challenge) {
        setChallengePrompt(lesson.challenge.prompt || '');
        setChallengeStarterCode(lesson.challenge.starterCode || '');
        setChallengeSolution(lesson.challenge.solution || '');
        setChallengeLanguage(lesson.challenge.language || 'typescript');
        setChallengeFunctionName(lesson.challenge.functionName || '');
        setChallengeDifficulty(lesson.challenge.difficulty || 'intermediate');
        setChallengeTimeEstimate(lesson.challenge.timeEstimate || 15);
        setTestCases(lesson.challenge.testCases || []);
      } else {
        resetChallengeFields();
      }
    } else if (open) {
      setTitle('');
      setType('reading');
      setDuration(10);
      setVideoDurationSeconds(0);
      setXpReward(50);
      setContent('');
      setVideoUrl('');
      setVideoProvider('');
      resetChallengeFields();
    }
  }, [open, lesson]);

  const resetChallengeFields = () => {
    setChallengePrompt('');
    setChallengeStarterCode('// Write your code here\n');
    setChallengeSolution('');
    setChallengeLanguage('typescript');
    setChallengeFunctionName('');
    setChallengeDifficulty('intermediate');
    setChallengeTimeEstimate(15);
    setTestCases([]);
  };

  const addTestCase = () => {
    setTestCases([
      ...testCases,
      {
        id: `test-${Date.now()}`,
        description: '',
        input: '',
        expectedOutput: '',
        hidden: false,
      },
    ]);
  };

  const updateTestCase = (index: number, updates: Partial<TestCase>) => {
    const updated = [...testCases];
    updated[index] = { ...updated[index], ...updates };
    setTestCases(updated);
  };

  const removeTestCase = (index: number) => {
    setTestCases(testCases.filter((_, i) => i !== index));
  };

  // Auto-detect video provider
  useEffect(() => {
    if (type === 'video' && videoUrl) {
      setVideoProvider(detectVideoProvider(videoUrl));
    }
  }, [videoUrl, type]);

  const handleSave = () => {
    if (!title.trim()) {
      toast.error('Lesson title is required');
      return;
    }

    if (type === 'challenge') {
      if (!challengePrompt.trim()) {
        toast.error('Challenge prompt is required');
        return;
      }
      if (!challengeStarterCode.trim()) {
        toast.error('Starter code is required');
        return;
      }
      if (!challengeSolution.trim()) {
        toast.error('Solution code is required');
        return;
      }
      if (testCases.length === 0) {
        toast.error('At least one test case is required');
        return;
      }
    }

    onSave({
      title,
      type,
      duration,
      videoDurationSeconds: type === 'video' ? videoDurationSeconds : undefined,
      xpReward,
      content,
      videoUrl: type === 'video' ? videoUrl : null,
      videoProvider: type === 'video' ? videoProvider : null,
      challenge:
        type === 'challenge'
          ? {
              prompt: challengePrompt,
              starterCode: challengeStarterCode,
              solution: challengeSolution,
              language: challengeLanguage,
              testCases: testCases,
              functionName: challengeFunctionName || undefined,
              difficulty: challengeDifficulty,
              timeEstimate: challengeTimeEstimate,
            }
          : null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{lesson ? 'Edit Lesson' : 'Add Lesson'}</DialogTitle>
          <DialogDescription>Configure the lesson details and content.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Introduction to Wallets"
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as Lesson['type'])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reading">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Reading
                    </div>
                  </SelectItem>
                  <SelectItem value="video">
                    <div className="flex items-center gap-2">
                      <Video className="h-4 w-4" />
                      Video
                    </div>
                  </SelectItem>
                  <SelectItem value="challenge">
                    <div className="flex items-center gap-2">
                      <Code2 className="h-4 w-4" />
                      Challenge
                    </div>
                  </SelectItem>
                  <SelectItem value="quiz">
                    <div className="flex items-center gap-2">
                      <Code2 className="h-4 w-4" />
                      Quiz
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Duration (minutes)</Label>
              <Input
                type="number"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label>XP Reward</Label>
              <Input
                type="number"
                value={xpReward}
                onChange={(e) => setXpReward(parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          {type === 'video' && (
            <div className="space-y-4 rounded-lg border p-4">
              <h4 className="font-medium">Video Configuration</h4>
              <div className="space-y-2">
                <Label>Video URL *</Label>
                <Input
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
                />
                <p className="text-muted-foreground text-xs">
                  Supports YouTube, Vimeo, Facebook, or direct video URLs.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Video Duration (seconds) *</Label>
                <Input
                  type="number"
                  value={videoDurationSeconds}
                  onChange={(e) => setVideoDurationSeconds(parseInt(e.target.value) || 0)}
                  placeholder="300"
                />
                <p className="text-muted-foreground text-xs">
                  Enter the video duration in seconds. Students must spend this time on the lesson
                  before it auto-completes. Example: 5 min = 300 seconds.
                </p>
              </div>
              {videoProvider && <Badge variant="secondary">Provider: {videoProvider}</Badge>}
            </div>
          )}

          {type === 'challenge' && (
            <div className="space-y-4 rounded-lg border p-4">
              <h4 className="font-medium">Challenge/Activity Configuration</h4>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Programming Language *</Label>
                  <Select
                    value={challengeLanguage}
                    onValueChange={(v) => setChallengeLanguage(v as ChallengeConfig['language'])}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="typescript">TypeScript</SelectItem>
                      <SelectItem value="javascript">JavaScript</SelectItem>
                      <SelectItem value="rust">Rust</SelectItem>
                      <SelectItem value="json">JSON</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Difficulty</Label>
                  <Select
                    value={challengeDifficulty}
                    onValueChange={(v) =>
                      setChallengeDifficulty(v as 'beginner' | 'intermediate' | 'advanced')
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Function Name (optional)</Label>
                  <Input
                    value={challengeFunctionName}
                    onChange={(e) => setChallengeFunctionName(e.target.value)}
                    placeholder="e.g., calculateSum"
                  />
                  <p className="text-muted-foreground text-xs">
                    The function name to test (if applicable).
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Time Estimate (minutes)</Label>
                  <Input
                    type="number"
                    value={challengeTimeEstimate}
                    onChange={(e) => setChallengeTimeEstimate(parseInt(e.target.value) || 15)}
                    placeholder="15"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Challenge Prompt *</Label>
                <Textarea
                  value={challengePrompt}
                  onChange={(e) => setChallengePrompt(e.target.value)}
                  placeholder="Describe the challenge. What should the student accomplish? What are the requirements?"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>Starter Code *</Label>
                <Textarea
                  value={challengeStarterCode}
                  onChange={(e) => setChallengeStarterCode(e.target.value)}
                  placeholder="// Initial code that students will see and modify..."
                  rows={8}
                  className="font-mono text-sm"
                />
                <p className="text-muted-foreground text-xs">
                  The initial code students will start with in the code editor.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Solution Code *</Label>
                <Textarea
                  value={challengeSolution}
                  onChange={(e) => setChallengeSolution(e.target.value)}
                  placeholder="// The correct solution code..."
                  rows={8}
                  className="font-mono text-sm"
                />
                <p className="text-muted-foreground text-xs">
                  The correct solution (hidden from students, shown as hint if they get stuck).
                </p>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Test Cases *</Label>
                    <p className="text-muted-foreground text-xs">
                      Define test cases to validate student submissions.
                    </p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addTestCase}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Test Case
                  </Button>
                </div>

                {testCases.length === 0 && (
                  <p className="text-muted-foreground rounded-lg border py-4 text-center text-sm">
                    No test cases yet. Add at least one test case.
                  </p>
                )}

                {testCases.map((tc, index) => (
                  <div key={tc.id} className="space-y-3 rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Test Case {index + 1}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTestCase(index)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Description *</Label>
                      <Input
                        value={tc.description}
                        onChange={(e) => updateTestCase(index, { description: e.target.value })}
                        placeholder="What this test case validates..."
                      />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-xs">Input (optional)</Label>
                        <Textarea
                          value={tc.input || ''}
                          onChange={(e) => updateTestCase(index, { input: e.target.value })}
                          placeholder="Test input..."
                          rows={2}
                          className="font-mono text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Expected Output *</Label>
                        <Textarea
                          value={tc.expectedOutput}
                          onChange={(e) =>
                            updateTestCase(index, { expectedOutput: e.target.value })
                          }
                          placeholder="Expected result..."
                          rows={2}
                          className="font-mono text-sm"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={tc.hidden || false}
                        onCheckedChange={(checked) => updateTestCase(index, { hidden: checked })}
                      />
                      <Label className="text-xs">Hidden test (not shown to students)</Label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Content (Markdown)</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
                type === 'video'
                  ? 'Add supplementary text content, notes, or transcripts here...'
                  : type === 'challenge'
                    ? 'Add instructions, background information, or additional context here...'
                    : '# Lesson Title\n\nWrite your lesson content here using Markdown...\n\n## Section 1\n\nContent goes here...'
              }
              rows={type === 'challenge' ? 6 : 12}
              className="font-mono text-sm"
            />
            <p className="text-muted-foreground text-xs">
              Use Markdown formatting: # headings, **bold**, *italic*, `code`, ```code blocks```,
              lists, etc.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>{lesson ? 'Update Lesson' : 'Add Lesson'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
