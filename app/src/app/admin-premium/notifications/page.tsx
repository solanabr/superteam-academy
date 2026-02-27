'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
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
  Bell,
  Send,
  Search,
  Plus,
  Trash2,
  Archive,
  Eye,
  Users,
  Clock,
  AlertCircle,
  CheckCircle,
  Loader2,
  MessageSquare,
  BookMarked,
  Target,
  Check,
  User,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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

interface Notification {
  _id: string;
  title: string;
  message: string;
  description?: string;
  type: 'announcement' | 'alert' | 'update' | 'achievement' | 'maintenance' | 'community';
  priority: 'low' | 'medium' | 'high' | 'critical';
  targetRoles?: ('user' | 'instructor' | 'moderator' | 'admin' | 'super_admin')[];
  targetLanguages?: ('en' | 'pt-br' | 'es')[];
  link?: string;
  linkText?: string;
  imageUrl?: string;
  icon?: string;
  expiresAt?: string;
  recipientCount: number;
  readCount: number;
  sentAt: string;
  sentByName: string;
  status: 'draft' | 'scheduled' | 'sent' | 'archived';
  isDismissible: boolean;
}

const typeColors = {
  announcement: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  alert: 'bg-red-500/10 text-red-500 border-red-500/20',
  update: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  achievement: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  maintenance: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  community: 'bg-green-500/10 text-green-500 border-green-500/20',
};

const priorityColors = {
  low: 'bg-gray-500/10 text-gray-500',
  medium: 'bg-blue-500/10 text-blue-500',
  high: 'bg-orange-500/10 text-orange-500',
  critical: 'bg-red-500/10 text-red-500',
};

const statusColors = {
  draft: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
  scheduled: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  sent: 'bg-green-500/10 text-green-500 border-green-500/20',
  archived: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
};

interface NotificationFormData {
  title: string;
  message: string;
  description?: string;
  type: 'announcement' | 'alert' | 'update' | 'achievement' | 'maintenance' | 'community';
  priority: 'low' | 'medium' | 'high' | 'critical';
  targetRoles: ('user' | 'instructor' | 'moderator' | 'admin' | 'super_admin')[];
  targetLanguages: ('en' | 'pt-br' | 'es')[];
  link?: string;
  linkText?: string;
  imageUrl?: string;
  icon?: string;
  isDismissible: boolean;
  expiresAt?: string;
}

export default function NotificationsPage() {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [openDialog, setOpenDialog] = useState(false);
  const [sending, setSending] = useState(false);
  const [editingNotification, setEditingNotification] = useState<Notification | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState<Notification | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [archiving, setArchiving] = useState<string | null>(null);
  const [formData, setFormData] = useState<NotificationFormData>({
    title: '',
    message: '',
    description: '',
    type: 'announcement',
    priority: 'medium',
    targetRoles: ['user'],
    targetLanguages: [],
    isDismissible: true,
  });

  const resetNotificationForm = () => {
    setFormData({
      title: '',
      message: '',
      description: '',
      type: 'announcement',
      priority: 'medium',
      targetRoles: ['user'],
      targetLanguages: [],
      isDismissible: true,
      link: '',
      linkText: '',
      imageUrl: '',
      icon: '',
      expiresAt: '',
    });
    setEditingNotification(null);
  };

  // Fetch notifications
  const fetchNotifications = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set('page', page.toString());
        params.set('limit', '10');
        if (search) params.set('search', search);
        if (statusFilter !== 'all') params.set('status', statusFilter);
        if (typeFilter !== 'all') params.set('type', typeFilter);

        const res = await fetch(`/api/admin/notifications?${params.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch');

        const data = await res.json();
        setNotifications(data.notifications);
        setCurrentPage(page);
        setTotalPages(data.pagination.totalPages);
      } catch (error) {
        toast.error('Failed to fetch notifications');
        console.error(error);
      } finally {
        setLoading(false);
      }
    },
    [search, statusFilter, typeFilter]
  );

  useEffect(() => {
    fetchNotifications(1);
  }, [fetchNotifications]);

  // Send notification
  const handleSendNotification = async () => {
    if (!formData.title.trim() || !formData.message.trim()) {
      toast.error('Please fill in title and message');
      return;
    }

    setSending(true);
    try {
      const isEditing = Boolean(editingNotification);
      const res = await fetch('/api/admin/notifications', {
        method: isEditing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          isEditing
            ? {
                notificationId: editingNotification?._id,
                ...formData,
              }
            : formData
        ),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to send notification');
      }

      const data = await res.json();
      if (isEditing) {
        toast.success('Notification updated successfully');
      } else {
        toast.success(`Notification sent to ${data.recipientCount} users`);
      }
      setOpenDialog(false);
      resetNotificationForm();
      fetchNotifications(1);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setSending(false);
    }
  };

  const handleEditNotification = (notification: Notification) => {
    setEditingNotification(notification);
    setFormData({
      title: notification.title,
      message: notification.message,
      description: notification.description || '',
      type: notification.type,
      priority: notification.priority,
      targetRoles: notification.targetRoles?.length ? notification.targetRoles : ['user'],
      targetLanguages: notification.targetLanguages || [],
      link: notification.link || '',
      linkText: notification.linkText || '',
      imageUrl: notification.imageUrl || '',
      icon: notification.icon || '',
      isDismissible: notification.isDismissible,
      expiresAt: notification.expiresAt
        ? new Date(notification.expiresAt).toISOString().slice(0, 16)
        : '',
    });
    setOpenDialog(true);
  };

  // Delete notification
  const handleDeleteClick = (notification: Notification) => {
    setNotificationToDelete(notification);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!notificationToDelete) return;

    try {
      setDeleting(true);
      const res = await fetch(`/api/admin/notifications?id=${notificationToDelete._id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete');
      toast.success('Notification deleted successfully');
      setDeleteDialogOpen(false);
      setNotificationToDelete(null);
      fetchNotifications(currentPage);
    } catch (error) {
      toast.error('Failed to delete notification');
    } finally {
      setDeleting(false);
    }
  };

  // Archive notification
  const handleArchiveNotification = async (id: string) => {
    try {
      setArchiving(id);
      const res = await fetch('/api/admin/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: id, status: 'archived' }),
      });

      if (!res.ok) throw new Error('Failed to archive');
      toast.success('Notification archived successfully');
      fetchNotifications(currentPage);
    } catch (error) {
      toast.error('Failed to archive notification');
    } finally {
      setArchiving(null);
    }
  };

  const readPercentage = (notification: Notification) => {
    if (notification.recipientCount === 0) return 0;
    return Math.round((notification.readCount / notification.recipientCount) * 100);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
            <Bell className="h-8 w-8" />
            Platform Notifications
          </h1>
          <p className="mt-1 text-gray-400">Send messages to all platform users</p>
        </div>
        <Dialog
          open={openDialog}
          onOpenChange={(open) => {
            setOpenDialog(open);
            if (!open) {
              resetNotificationForm();
            }
          }}
        >
          <DialogTrigger asChild>
            <Button
              className="gap-2"
              size="lg"
              disabled={sending || deleting || archiving !== null}
              onClick={() => resetNotificationForm()}
            >
              <Plus className="h-4 w-4" />
              Send Notification
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingNotification ? 'Edit Notification' : 'Send Notification to Users'}
              </DialogTitle>
              <DialogDescription>
                {editingNotification
                  ? 'Update notification content and targeting'
                  : 'Compose and send a message to all platform users matching specified criteria'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Notification title (max 200 characters)"
                  maxLength={200}
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
                <p className="text-xs text-gray-400">{formData.title.length}/200</p>
              </div>

              {/* Message */}
              <div className="space-y-2">
                <Label htmlFor="message">Message *</Label>
                <Textarea
                  id="message"
                  placeholder="Notification message (max 1000 characters)"
                  maxLength={1000}
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                />
                <p className="text-xs text-gray-400">{formData.message.length}/1000</p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Additional details"
                  maxLength={500}
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              {/* Type & Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="announcement">Announcement</SelectItem>
                      <SelectItem value="alert">Alert</SelectItem>
                      <SelectItem value="update">Update</SelectItem>
                      <SelectItem value="achievement">Achievement</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="community">Community</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value: any) => setFormData({ ...formData, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Target Roles */}
              <div className="space-y-2">
                <Label>Target Roles</Label>
                <div className="space-y-2">
                  {['user', 'instructor', 'moderator', 'admin', 'super_admin'].map((role) => (
                    <div key={role} className="flex items-center space-x-2">
                      <Checkbox
                        id={`role-${role}`}
                        checked={formData.targetRoles.includes(role as any)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormData({
                              ...formData,
                              targetRoles: [...formData.targetRoles, role as any],
                            });
                          } else {
                            setFormData({
                              ...formData,
                              targetRoles: formData.targetRoles.filter((r) => r !== role),
                            });
                          }
                        }}
                      />
                      <label
                        htmlFor={`role-${role}`}
                        className="cursor-pointer text-sm font-medium capitalize"
                      >
                        {role}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Target Languages */}
              <div className="space-y-2">
                <Label>Target Languages (Optional - leave empty for all)</Label>
                <div className="space-y-2">
                  {['en', 'pt-br', 'es'].map((lang) => (
                    <div key={lang} className="flex items-center space-x-2">
                      <Checkbox
                        id={`lang-${lang}`}
                        checked={formData.targetLanguages.includes(lang as any)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormData({
                              ...formData,
                              targetLanguages: [...formData.targetLanguages, lang as any],
                            });
                          } else {
                            setFormData({
                              ...formData,
                              targetLanguages: formData.targetLanguages.filter((l) => l !== lang),
                            });
                          }
                        }}
                      />
                      <label
                        htmlFor={`lang-${lang}`}
                        className="cursor-pointer text-sm font-medium uppercase"
                      >
                        {lang}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA Link */}
              <div className="space-y-2">
                <Label htmlFor="link">CTA Link (Optional)</Label>
                <Input
                  id="link"
                  placeholder="https://example.com"
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                />
              </div>

              {/* CTA Text */}
              <div className="space-y-2">
                <Label htmlFor="linkText">CTA Button Text (Optional)</Label>
                <Input
                  id="linkText"
                  placeholder="Learn More"
                  maxLength={50}
                  value={formData.linkText}
                  onChange={(e) => setFormData({ ...formData, linkText: e.target.value })}
                />
              </div>

              {/* Dismissible */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="dismissible"
                  checked={formData.isDismissible}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isDismissible: checked as boolean })
                  }
                />
                <label htmlFor="dismissible" className="cursor-pointer text-sm font-medium">
                  Allow users to dismiss this notification
                </label>
              </div>

              {/* Send Button */}
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleSendNotification}
                  disabled={sending || !formData.title.trim() || !formData.message.trim()}
                  className="flex-1 gap-2"
                >
                  {sending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {sending
                    ? editingNotification
                      ? 'Saving...'
                      : 'Sending...'
                    : editingNotification
                      ? 'Save Changes'
                      : 'Send Notification'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setOpenDialog(false);
                    resetNotificationForm();
                  }}
                  disabled={sending}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 opacity-50" />
          <Input
            placeholder="Search notifications..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="announcement">Announcement</SelectItem>
            <SelectItem value="alert">Alert</SelectItem>
            <SelectItem value="update">Update</SelectItem>
            <SelectItem value="achievement">Achievement</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
            <SelectItem value="community">Community</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Bell className="h-4 w-4 text-blue-500" />
              Total Sent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {notifications.filter((n) => n.status === 'sent').length}
            </p>
            <p className="text-xs text-gray-400">Notifications sent</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Users className="h-4 w-4 text-green-500" />
              Total Recipients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {notifications.reduce((sum, n) => sum + n.recipientCount, 0).toLocaleString()}
            </p>
            <p className="text-xs text-gray-400">Unique users targeted</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Eye className="h-4 w-4 text-purple-500" />
              Total Reads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {notifications.reduce((sum, n) => sum + n.readCount, 0).toLocaleString()}
            </p>
            <p className="text-xs text-gray-400">Total reads across all</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <MessageSquare className="h-4 w-4 text-orange-500" />
              Avg Read Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {notifications.length > 0
                ? Math.round(
                    notifications.reduce((sum, n) => sum + readPercentage(n), 0) /
                      notifications.length || 0
                  )
                : 0}
              %
            </p>
            <p className="text-xs text-gray-400">Average across all</p>
          </CardContent>
        </Card>
      </div>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle>Notifications History</CardTitle>
          <CardDescription>Recent notifications sent to users</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-8 text-center">
              <Bell className="mx-auto mb-3 h-12 w-12 opacity-20" />
              <p className="text-gray-400">No notifications found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  className="rounded-lg border border-gray-700 p-4 transition-colors hover:bg-gray-900/50"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="mb-2 flex items-start gap-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-white">{notification.title}</h3>
                          <p className="mt-1 line-clamp-2 text-sm text-gray-300">
                            {notification.message}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <Badge className={`${typeColors[notification.type]}`}>
                          {notification.type}
                        </Badge>
                        <Badge className={`${priorityColors[notification.priority]}`}>
                          {notification.priority}
                        </Badge>
                        <Badge className={`${statusColors[notification.status]} border`}>
                          {notification.status}
                        </Badge>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-400">
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {notification.recipientCount.toLocaleString()} recipients
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {notification.readCount.toLocaleString()} reads (
                          {readPercentage(notification)}%)
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(notification.sentAt).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          by {notification.sentByName}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditNotification(notification)}
                        disabled={sending || deleting || archiving !== null}
                        title="Edit notification"
                      >
                        <BookMarked className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleArchiveNotification(notification._id)}
                        disabled={archiving === notification._id || sending || deleting}
                        title="Archive notification"
                      >
                        {archiving === notification._id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Archive className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300"
                        onClick={() => handleDeleteClick(notification)}
                        disabled={deleting || sending || archiving !== null}
                        title="Delete notification"
                      >
                        {deleting && notificationToDelete?._id === notification._id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => fetchNotifications(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <div className="flex items-center gap-1">
            <p className="text-sm text-gray-400">
              Page {currentPage} of {totalPages}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => fetchNotifications(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Notification</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{notificationToDelete?.title}&quot;? This action cannot be
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
