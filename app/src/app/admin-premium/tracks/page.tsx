'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Switch } from '@/components/ui/switch';
import {
  Route,
  Plus,
  ArrowLeft,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  RefreshCw,
  BookOpen,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';

interface Track {
  _id: string;
  id: string;
  slug: string;
  title: string;
  description?: string;
  thumbnail?: string;
  courseIds?: string[];
  courseCount?: number;
  published?: boolean;
  created_at?: string;
}

export default function AdminTracksPage() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [trackToDelete, setTrackToDelete] = useState<Track | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [thumbnailUploading, setThumbnailUploading] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [published, setPublished] = useState(false);

  const fetchTracks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/tracks');
      const data = await res.json();

      if (res.ok) {
        setTracks(data.tracks || []);
      } else {
        toast.error(data.error || 'Failed to fetch tracks');
      }
    } catch (error) {
      toast.error('Failed to fetch tracks');
      console.error('Error fetching tracks:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTracks();
  }, [fetchTracks]);

  const openDialog = (track?: Track) => {
    if (track) {
      setEditingTrack(track);
      setTitle(track.title);
      setSlug(track.slug);
      setDescription(track.description || '');
      setThumbnail(track.thumbnail || '');
      setPublished(track.published || false);
    } else {
      setEditingTrack(null);
      setTitle('');
      setSlug('');
      setDescription('');
      setThumbnail('');
      setPublished(false);
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Track title is required');
      return;
    }
    if (!slug.trim()) {
      toast.error('Track slug is required');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title,
        slug,
        description,
        thumbnail,
        published,
      };

      const res = await fetch(
        editingTrack ? `/api/admin/tracks/${editingTrack.slug}` : '/api/admin/tracks',
        {
          method: editingTrack ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();

      if (res.ok) {
        toast.success(editingTrack ? 'Track updated' : 'Track created');
        setDialogOpen(false);
        fetchTracks();
      } else {
        toast.error(data.error || 'Failed to save track');
      }
    } catch (error) {
      toast.error('Failed to save track');
      console.error('Error saving track:', error);
    } finally {
      setSaving(false);
    }
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

      setThumbnail(result.link);
      toast.success('Thumbnail uploaded successfully');
    } catch (error) {
      console.error('Error uploading thumbnail:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload thumbnail');
    } finally {
      setThumbnailUploading(false);
      event.target.value = '';
    }
  };

  const handleDelete = async () => {
    if (!trackToDelete) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/tracks/${trackToDelete.slug}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (res.ok) {
        toast.success('Track deleted');
        fetchTracks();
      } else {
        toast.error(data.error || 'Failed to delete track');
      }
    } catch (error) {
      toast.error('Failed to delete track');
      console.error('Error deleting track:', error);
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setTrackToDelete(null);
    }
  };

  const togglePublish = async (track: Track) => {
    try {
      const res = await fetch(`/api/admin/tracks/${track.slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: !track.published }),
      });
      const data = await res.json();

      if (res.ok) {
        toast.success(data.track.published ? 'Track published' : 'Track unpublished');
        fetchTracks();
      } else {
        toast.error(data.error || 'Failed to update track');
      }
    } catch (error) {
      toast.error('Failed to update track');
      console.error('Error updating track:', error);
    }
  };

  // Auto-generate slug from title
  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!editingTrack && !slug) {
      setSlug(
        value
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')
      );
    }
  };

  return (
    <div className="container max-w-6xl py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="flex items-center gap-2 text-3xl font-bold">
              <Route className="text-primary h-7 w-7" />
              Learning Tracks
            </h1>
            <p className="text-muted-foreground mt-1">
              Organize courses into learning paths and tracks.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => fetchTracks()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={() => openDialog()} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Track
          </Button>
        </div>
      </div>

      {/* Tracks Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tracks</CardTitle>
          <CardDescription>
            {tracks.length} learning track{tracks.length !== 1 ? 's' : ''} available
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : tracks.length === 0 ? (
            <div className="text-muted-foreground flex flex-col items-center justify-center py-12">
              <Route className="mb-4 h-12 w-12 opacity-50" />
              <p className="text-lg font-medium">No learning tracks</p>
              <p className="text-sm">Create your first track to organize courses.</p>
              <Button onClick={() => openDialog()} className="mt-4 gap-2">
                <Plus className="h-4 w-4" />
                Create Track
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Track</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Courses</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tracks.map((track) => (
                  <TableRow key={track._id || track.slug}>
                    <TableCell>
                      <div className="max-w-[240px]">
                        <p className="truncate font-medium">{track.title}</p>
                        {track.description && (
                          <p className="text-muted-foreground truncate text-xs">
                            {track.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-muted-foreground text-sm">{track.slug}</code>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        {track.courseCount || 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      {track.published ? (
                        <Badge className="bg-green-500/20 text-green-600">Published</Badge>
                      ) : (
                        <Badge variant="outline">Draft</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openDialog(track)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => togglePublish(track)}>
                            {track.published ? (
                              <>
                                <EyeOff className="mr-2 h-4 w-4" />
                                Unpublish
                              </>
                            ) : (
                              <>
                                <Eye className="mr-2 h-4 w-4" />
                                Publish
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => {
                              setTrackToDelete(track);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingTrack ? 'Edit Track' : 'Create Track'}</DialogTitle>
            <DialogDescription>
              {editingTrack
                ? 'Update the learning track details.'
                : 'Create a new learning track to organize courses.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Solana Fundamentals"
                />
              </div>
              <div className="space-y-2">
                <Label>Slug *</Label>
                <Input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="solana-fundamentals"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Learn the fundamentals of Solana blockchain development..."
                rows={3}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="track-thumbnail-upload">Thumbnail Image</Label>
                <div className="space-y-2">
                  <Input
                    id="track-thumbnail-upload"
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                    onChange={handleThumbnailUpload}
                    disabled={thumbnailUploading}
                  />
                  <p className="text-muted-foreground text-xs">
                    Upload a thumbnail image (PNG, JPG, WEBP, or GIF).
                  </p>
                  {thumbnailUploading && (
                    <div className="text-muted-foreground flex items-center gap-2 text-sm">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Uploading thumbnail...
                    </div>
                  )}
                  {thumbnail && (
                    <div className="space-y-2 rounded-md border p-3">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Upload className="h-4 w-4" />
                        Uploaded Thumbnail
                      </div>
                      <div className="relative h-24 w-full">
                        <Image
                          src={thumbnail}
                          alt="Track thumbnail preview"
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
                <Label>Slug Preview</Label>
                <Input value={slug} disabled className="bg-muted/40" />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch id="track-published" checked={published} onCheckedChange={setPublished} />
              <Label htmlFor="track-published">Published</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : editingTrack ? (
                'Update Track'
              ) : (
                'Create Track'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Track</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{trackToDelete?.title}&quot;? This will remove
              the track but not the associated courses.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
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
