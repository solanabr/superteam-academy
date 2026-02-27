'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from '@/hooks/use-translation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Textarea } from '@/components/ui/textarea';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import {
  Megaphone,
  Plus,
  Trash2,
  Pin,
  PinOff,
  Eye,
  Users,
  Clock,
  Search,
  Edit,
  Loader2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

const Checkbox = ({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>) => (
  <CheckboxPrimitive.Root
    className={cn(
      'peer border-primary ring-offset-background focus-visible:ring-ring h-4 w-4 shrink-0 border focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator className={cn('flex items-center justify-center text-current')}>
      <Check className="h-4 w-4" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
);

Checkbox.displayName = CheckboxPrimitive.Root.displayName;

interface Announcement {
  _id: string;
  title: string;
  content: string;
  author: {
    display_name: string;
    avatar_url?: string;
  };
  is_pinned: boolean;
  views_count: number;
  replies_count: number;
  created_at: string;
  updated_at: string;
}

interface AnnouncementStats {
  totalAnnouncements: number;
  activeAnnouncements: number;
  pinnedAnnouncements: number;
  totalViews: number;
}

export default function AnnouncementsPage() {
  const { t } = useTranslation();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [stats, setStats] = useState<AnnouncementStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [announcementToDelete, setAnnouncementToDelete] = useState<Announcement | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingPin, setTogglingPin] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    isPinned: false,
  });

  const fetchAnnouncements = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        search: searchQuery,
      });

      const response = await fetch(`/api/admin/announcements?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch announcements: ${response.statusText}`);
      }

      const data = await response.json();
      setAnnouncements(data.announcements);
      setStats(data.stats);
      setTotalPages(data.pagination.pages);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      toast.error('Failed to fetch announcements');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Title and content are required');
      return;
    }

    try {
      setIsSubmitting(true);

      if (isEditing && editingId) {
        // Update announcement
        const response = await fetch('/api/admin/announcements', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: editingId,
            title: formData.title,
            content: formData.content,
            isPinned: formData.isPinned,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to update announcement');
        }

        toast.success('Announcement updated successfully');
        setIsEditing(false);
        setEditingId(null);
      } else {
        // Create new announcement
        const response = await fetch('/api/admin/announcements', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: formData.title,
            content: formData.content,
            isPinned: formData.isPinned,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to create announcement');
        }

        toast.success('Announcement created successfully');
      }

      setFormData({ title: '', content: '', isPinned: false });
      setIsDialogOpen(false);
      await fetchAnnouncements();
    } catch (error) {
      console.error('Error creating/updating announcement:', error);
      toast.error(isEditing ? 'Failed to update announcement' : 'Failed to create announcement');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditAnnouncement = (announcement: Announcement) => {
    setIsEditing(true);
    setEditingId(announcement._id);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      isPinned: announcement.is_pinned,
    });
    setIsDialogOpen(true);
  };

  const handleTogglePin = async (id: string, currentPinStatus: boolean) => {
    try {
      setTogglingPin(id);
      const response = await fetch('/api/admin/announcements', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          isPinned: !currentPinStatus,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to toggle pin status');
      }

      toast.success(currentPinStatus ? 'Announcement unpinned' : 'Announcement pinned');
      await fetchAnnouncements();
    } catch (error) {
      console.error('Error toggling pin status:', error);
      toast.error('Failed to toggle pin status');
    } finally {
      setTogglingPin(null);
    }
  };

  const handleDeleteClick = (announcement: Announcement) => {
    setAnnouncementToDelete(announcement);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!announcementToDelete) return;

    try {
      setDeleting(true);
      const response = await fetch(`/api/admin/announcements?id=${announcementToDelete._id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete announcement');
      }

      toast.success('Announcement deleted successfully');
      setDeleteDialogOpen(false);
      setAnnouncementToDelete(null);
      await fetchAnnouncements();
    } catch (error) {
      console.error('Error deleting announcement:', error);
      toast.error('Failed to delete announcement');
    } finally {
      setDeleting(false);
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setIsEditing(false);
    setEditingId(null);
    setFormData({ title: '', content: '', isPinned: false });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
            <Megaphone className="h-8 w-8 text-blue-500" />
            Community Announcements
          </h1>
          <p className="text-muted-foreground mt-1">
            Create and manage platform-wide announcements for the community
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" disabled={isSubmitting || deleting || togglingPin !== null}>
              <Plus className="h-4 w-4" />
              New Announcement
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {isEditing ? 'Edit Announcement' : 'Create New Announcement'}
              </DialogTitle>
              <DialogDescription>
                {isEditing
                  ? 'Update the announcement details'
                  : 'Create a new announcement to share with the community'}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateAnnouncement} className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Announcement title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  maxLength={200}
                  className="mt-1"
                />
                <p className="text-muted-foreground mt-1 text-xs">
                  {formData.title.length}/200 characters
                </p>
              </div>

              <div>
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  placeholder="Announcement content (supports markdown)"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  maxLength={5000}
                  rows={6}
                  className="mt-1"
                />
                <p className="text-muted-foreground mt-1 text-xs">
                  {formData.content.length}/5000 characters
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="isPinned"
                  checked={formData.isPinned}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      isPinned: checked as boolean,
                    })
                  }
                />
                <Label htmlFor="isPinned" className="cursor-pointer">
                  Pin this announcement to the top
                </Label>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseDialog}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="gap-2">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>{isEditing ? 'Updating...' : 'Creating...'}</span>
                    </>
                  ) : (
                    <span>{isEditing ? 'Update Announcement' : 'Create Announcement'}</span>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Announcements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAnnouncements}</div>
              <p className="text-muted-foreground text-xs">{stats.pinnedAnnouncements} pinned</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</div>
              <p className="text-muted-foreground text-xs">Community engagement</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeAnnouncements}</div>
              <p className="text-muted-foreground text-xs">Unpinned announcements</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pinned</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pinnedAnnouncements}</div>
              <p className="text-muted-foreground text-xs">Featured announcements</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Search announcements..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-8"
          />
        </div>
      </div>

      {/* Announcements Table */}
      <Card>
        <CardHeader>
          <CardTitle>Announcements</CardTitle>
          <CardDescription>Manage community announcements and featured posts</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : announcements.length === 0 ? (
            <div className="py-8 text-center">
              <Megaphone className="text-muted-foreground mx-auto mb-2 h-12 w-12" />
              <p className="text-muted-foreground">No announcements yet</p>
              <p className="text-muted-foreground text-sm">
                Create your first announcement to get started
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {announcements.map((announcement) => (
                <div
                  key={announcement._id}
                  className="hover:bg-accent flex items-start justify-between rounded-lg border p-4 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{announcement.title}</h3>
                      {announcement.is_pinned && (
                        <Badge variant="secondary" className="gap-1">
                          <Pin className="h-3 w-3" />
                          Pinned
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
                      {announcement.content}
                    </p>
                    <div className="text-muted-foreground mt-2 flex items-center gap-4 text-xs">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {announcement.views_count} views
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {announcement.replies_count} replies
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(announcement.created_at), 'MMM dd, yyyy')}
                      </span>
                    </div>
                  </div>

                  <div className="ml-4 flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleTogglePin(announcement._id, announcement.is_pinned)}
                      disabled={togglingPin === announcement._id || isSubmitting || deleting}
                      title={announcement.is_pinned ? 'Unpin announcement' : 'Pin announcement'}
                    >
                      {togglingPin === announcement._id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : announcement.is_pinned ? (
                        <PinOff className="h-4 w-4" />
                      ) : (
                        <Pin className="h-4 w-4" />
                      )}
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditAnnouncement(announcement)}
                      disabled={isSubmitting || deleting || togglingPin !== null}
                      title="Edit announcement"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>

                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteClick(announcement)}
                      disabled={deleting || isSubmitting || togglingPin !== null}
                      title="Delete announcement"
                    >
                      {deleting && announcementToDelete?._id === announcement._id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between border-t pt-6">
              <div className="text-muted-foreground text-sm">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={
                    currentPage === 1 || loading || isSubmitting || deleting || togglingPin !== null
                  }
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={
                    currentPage === totalPages ||
                    loading ||
                    isSubmitting ||
                    deleting ||
                    togglingPin !== null
                  }
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Announcement</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{announcementToDelete?.title}&quot;? This action cannot be
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
