'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Zap, Plus, Search, Edit2, Trash2, Loader2, Code, Eye, EyeOff } from 'lucide-react';

interface Challenge {
  _id: string;
  id: string;
  title: string;
  description: string;
  prompt: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  xp_reward: number;
  time_estimate: number;
  language: 'typescript' | 'javascript' | 'rust';
  starter_code: string;
  solution_code: string;
  test_cases: any[];
  function_name?: string;
  hints?: string[];
  tags?: string[];
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

interface FormData {
  title: string;
  description: string;
  prompt: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  xpReward: number;
  timeEstimate: number;
  language: 'typescript' | 'javascript' | 'rust';
  starterCode: string;
  solutionCode: string;
  functionName: string;
  hints: string;
  tags: string;
}

export default function ChallengesAdminPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [difficulty, setDifficulty] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState<any>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null);
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [challengeToDelete, setChallengeToDelete] = useState<Challenge | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    prompt: '',
    difficulty: 'easy',
    category: '',
    xpReward: 50,
    timeEstimate: 15,
    language: 'typescript',
    starterCode: '',
    solutionCode: '',
    functionName: '',
    hints: '',
    tags: '',
  });

  const fetchChallenges = useCallback(
    async (pageNum = 1) => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          page: pageNum.toString(),
          limit: '10',
          search: searchQuery,
          difficulty: difficulty !== 'all' ? difficulty : '',
          category: categoryFilter !== 'all' ? categoryFilter : '',
        });

        const response = await fetch(`/api/admin/challenges?${params}`);
        const data = await response.json();

        if (!response.ok) throw new Error(data.error);

        setChallenges(data.challenges || []);
        setCategories(data.filters.categories || []);
        setStats(data.stats);
        setTotalPages(data.pagination.pages);
        setPage(pageNum);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to load challenges');
      } finally {
        setLoading(false);
      }
    },
    [searchQuery, difficulty, categoryFilter]
  );

  useEffect(() => {
    fetchChallenges(1);
  }, [fetchChallenges]);

  const handleOpenDialog = (challenge?: Challenge) => {
    if (challenge) {
      setEditingChallenge(challenge);
      setFormData({
        title: challenge.title,
        description: challenge.description,
        prompt: challenge.prompt,
        difficulty: challenge.difficulty,
        category: challenge.category,
        xpReward: challenge.xp_reward,
        timeEstimate: challenge.time_estimate,
        language: challenge.language,
        starterCode: challenge.starter_code,
        solutionCode: challenge.solution_code,
        functionName: challenge.function_name || '',
        hints: challenge.hints?.join('\n') || '',
        tags: challenge.tags?.join(', ') || '',
      });
    } else {
      setEditingChallenge(null);
      setFormData({
        title: '',
        description: '',
        prompt: '',
        difficulty: 'easy',
        category: '',
        xpReward: 50,
        timeEstimate: 15,
        language: 'typescript',
        starterCode: '',
        solutionCode: '',
        functionName: '',
        hints: '',
        tags: '',
      });
    }
    setOpenDialog(true);
  };

  const handleSubmit = async () => {
    try {
      if (!formData.title || !formData.description || !formData.prompt || !formData.category) {
        toast.error('Please fill in all required fields');
        return;
      }

      setIsSubmitting(true);

      const payload = {
        title: formData.title,
        description: formData.description,
        prompt: formData.prompt,
        difficulty: formData.difficulty,
        category: formData.category,
        xpReward: formData.xpReward,
        timeEstimate: formData.timeEstimate,
        language: formData.language,
        starterCode: formData.starterCode,
        solutionCode: formData.solutionCode,
        functionName: formData.functionName || undefined,
        hints: formData.hints ? formData.hints.split('\n').filter((h) => h.trim()) : [],
        tags: formData.tags ? formData.tags.split(',').map((t) => t.trim()) : [],
      };

      const method = editingChallenge ? 'PUT' : 'POST';
      const url = editingChallenge ? '/api/admin/challenges' : '/api/admin/challenges';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingChallenge ? { id: editingChallenge._id, ...payload } : payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save challenge');
      }

      toast.success(editingChallenge ? 'Challenge updated' : 'Challenge created');
      setOpenDialog(false);
      fetchChallenges(page);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save challenge');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (challenge: Challenge) => {
    setChallengeToDelete(challenge);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!challengeToDelete) return;

    try {
      setDeleting(true);
      const response = await fetch(`/api/admin/challenges?id=${challengeToDelete._id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete challenge');

      toast.success('Challenge deleted successfully');
      setDeleteDialogOpen(false);
      setChallengeToDelete(null);
      fetchChallenges(page);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete challenge');
    } finally {
      setDeleting(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'hard':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Challenges</h1>
            <p className="text-muted-foreground">Manage coding challenges for the platform</p>
          </div>
          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()} className="gap-2" disabled={isSubmitting}>
                <Plus className="h-4 w-4" />
                New Challenge
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingChallenge ? 'Edit Challenge' : 'Create Challenge'}
                </DialogTitle>
                <DialogDescription>
                  {editingChallenge ? 'Update challenge details' : 'Create a new coding challenge'}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                      placeholder="Challenge title"
                      maxLength={200}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="difficulty">Difficulty *</Label>
                    <Select
                      value={formData.difficulty}
                      onValueChange={(value: any) =>
                        setFormData((prev) => ({ ...prev, difficulty: value }))
                      }
                    >
                      <SelectTrigger id="difficulty">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, category: e.target.value }))
                      }
                      placeholder="e.g., Variables, Functions"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <Select
                      value={formData.language}
                      onValueChange={(value: any) =>
                        setFormData((prev) => ({ ...prev, language: value }))
                      }
                    >
                      <SelectTrigger id="language">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="typescript">TypeScript</SelectItem>
                        <SelectItem value="javascript">JavaScript</SelectItem>
                        <SelectItem value="rust">Rust</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="xpReward">XP Reward</Label>
                    <Input
                      id="xpReward"
                      type="number"
                      value={formData.xpReward}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          xpReward: parseInt(e.target.value) || 50,
                        }))
                      }
                      min="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timeEstimate">Time Estimate (minutes)</Label>
                    <Input
                      id="timeEstimate"
                      type="number"
                      value={formData.timeEstimate}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          timeEstimate: parseInt(e.target.value) || 15,
                        }))
                      }
                      min="1"
                    />
                  </div>
                </div>

                <div className="col-span-2 space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, description: e.target.value }))
                    }
                    placeholder="Brief description of the challenge"
                    rows={3}
                  />
                </div>

                <div className="col-span-2 space-y-2">
                  <Label htmlFor="prompt">Prompt *</Label>
                  <Textarea
                    id="prompt"
                    value={formData.prompt}
                    onChange={(e) => setFormData((prev) => ({ ...prev, prompt: e.target.value }))}
                    placeholder="Detailed challenge prompt"
                    rows={4}
                  />
                </div>

                {/* Code Editor Toggle */}
                <Button
                  variant="outline"
                  onClick={() => setShowCodeEditor(!showCodeEditor)}
                  className="w-full gap-2"
                  disabled={isSubmitting}
                >
                  <Code className="h-4 w-4" />
                  {showCodeEditor ? 'Hide' : 'Show'} Code Editor
                </Button>

                {showCodeEditor && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="starterCode">Starter Code</Label>
                      <Textarea
                        id="starterCode"
                        value={formData.starterCode}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, starterCode: e.target.value }))
                        }
                        placeholder="Starting code template"
                        rows={4}
                        className="font-mono text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="solutionCode">Solution Code</Label>
                      <Textarea
                        id="solutionCode"
                        value={formData.solutionCode}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, solutionCode: e.target.value }))
                        }
                        placeholder="Reference solution"
                        rows={4}
                        className="font-mono text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="functionName">Function Name</Label>
                      <Input
                        id="functionName"
                        value={formData.functionName}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, functionName: e.target.value }))
                        }
                        placeholder="Function name to implement"
                      />
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label htmlFor="hints">Hints (one per line)</Label>
                  <Textarea
                    id="hints"
                    value={formData.hints}
                    onChange={(e) => setFormData((prev) => ({ ...prev, hints: e.target.value }))}
                    placeholder="Hint 1&#10;Hint 2&#10;Hint 3"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Input
                    id="tags"
                    value={formData.tags}
                    onChange={(e) => setFormData((prev) => ({ ...prev, tags: e.target.value }))}
                    placeholder="loops, functions, recursion"
                  />
                </div>

                <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full gap-2">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>{editingChallenge ? 'Updating...' : 'Creating...'}</span>
                    </>
                  ) : (
                    <span>{editingChallenge ? 'Update Challenge' : 'Create Challenge'}</span>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-muted-foreground text-sm font-medium">
                  Total Challenges
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-muted-foreground text-sm font-medium">Active</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.active}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-muted-foreground text-sm font-medium">
                  Inactive
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{stats.inactive}</div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1">
              <Label htmlFor="search" className="mb-2 block text-sm">
                Search
              </Label>
              <div className="relative">
                <Input
                  id="search"
                  placeholder="Search by title or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search className="text-muted-foreground absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2" />
              </div>
            </div>
            <div className="w-full sm:w-40">
              <Label htmlFor="difficulty-filter" className="mb-2 block text-sm">
                Difficulty
              </Label>
              <Select value={difficulty} onValueChange={(v: any) => setDifficulty(v)}>
                <SelectTrigger id="difficulty-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-40">
              <Label htmlFor="category-filter" className="mb-2 block text-sm">
                Category
              </Label>
              <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v)}>
                <SelectTrigger id="category-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Challenges List */}
      <Card>
        <CardHeader>
          <CardTitle>Challenges ({challenges.length})</CardTitle>
          <CardDescription>
            Page {page} of {totalPages}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
            </div>
          ) : challenges.length === 0 ? (
            <div className="text-muted-foreground py-8 text-center">
              No challenges found. Create your first challenge!
            </div>
          ) : (
            <div className="space-y-4">
              {challenges.map((challenge) => (
                <div
                  key={challenge._id}
                  className="hover:bg-muted/50 flex flex-col gap-3 rounded-lg border p-4 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-semibold">{challenge.title}</h3>
                      <p className="text-muted-foreground line-clamp-2 text-sm">
                        {challenge.description}
                      </p>
                    </div>
                    <div className="flex flex-shrink-0 gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(challenge)}
                        disabled={isSubmitting || deleting}
                        title="Edit challenge"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(challenge)}
                        disabled={deleting || isSubmitting}
                        className="text-destructive hover:text-destructive"
                        title="Delete challenge"
                      >
                        {deleting && challengeToDelete?._id === challenge._id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{challenge.category}</Badge>
                    <Badge className={getDifficultyColor(challenge.difficulty)}>
                      {challenge.difficulty}
                    </Badge>
                    <Badge variant="outline" className="gap-1">
                      <Zap className="h-3 w-3" />
                      {challenge.xp_reward} XP
                    </Badge>
                    <Badge variant="outline">{challenge.language || 'typescript'}</Badge>
                    <Badge
                      variant={challenge.is_active ? 'default' : 'secondary'}
                      className={challenge.is_active ? 'bg-green-600' : 'bg-gray-600'}
                    >
                      {challenge.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between border-t pt-6">
              <Button
                variant="outline"
                onClick={() => fetchChallenges(page - 1)}
                disabled={page === 1 || loading || isSubmitting || deleting}
                className="gap-2"
              >
                Previous
              </Button>
              <span className="text-muted-foreground text-sm">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => fetchChallenges(page + 1)}
                disabled={page === totalPages || loading || isSubmitting || deleting}
                className="gap-2"
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Challenge</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{challengeToDelete?.title}&quot;? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
