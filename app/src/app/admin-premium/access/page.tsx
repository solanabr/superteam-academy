'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Lock, MoreHorizontal, Search, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface User {
  _id: string;
  id: string;
  username: string;
  email: string;
  display_name?: string;
  role: 'super_admin' | 'admin' | 'instructor' | 'moderator' | 'user';
  is_active: boolean;
  created_at: string;
  last_login?: string;
}

interface AccessData {
  stats: {
    admin: number;
    super_admin: number;
    instructor: number;
    moderator: number;
    user: number;
  };
  users?: User[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

type RoleStats = AccessData['stats'];

export default function AccessControlPage() {
  const [data, setData] = useState<AccessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchAccessData = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set('page', page.toString());
        params.set('limit', '20');
        if (search) params.set('search', search);
        if (roleFilter !== 'all') params.set('role', roleFilter);
        if (statusFilter === 'active') params.set('active', 'true');
        if (statusFilter === 'inactive') params.set('active', 'false');

        const res = await fetch(`/api/admin/access?${params.toString()}`);
        const result = await res.json();

        if (res.ok) {
          setData(result);
          setCurrentPage(page);
        } else {
          toast.error(result.error || 'Failed to fetch access data');
        }
      } catch (error) {
        toast.error('Failed to fetch access data');
        console.error('Error fetching access data:', error);
      } finally {
        setLoading(false);
      }
    },
    [search, roleFilter, statusFilter]
  );

  useEffect(() => {
    fetchAccessData();
  }, [fetchAccessData]);

  const changeUserRole = async (userId: string, newRole: string) => {
    setUpdating(userId);
    try {
      const res = await fetch(`/api/admin/access/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });

      const result = await res.json();

      if (res.ok) {
        toast.success('User role updated');
        await fetchAccessData(currentPage);
      } else {
        toast.error(result.error || 'Failed to update user role');
      }
    } catch (error) {
      toast.error('Failed to update user role');
      console.error('Error updating role:', error);
    } finally {
      setUpdating(null);
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    setUpdating(userId);
    try {
      const res = await fetch(`/api/admin/access/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus }),
      });

      const result = await res.json();

      if (res.ok) {
        toast.success(currentStatus ? 'User disabled' : 'User enabled');
        await fetchAccessData(currentPage);
      } else {
        toast.error(result.error || 'Failed to update user status');
      }
    } catch (error) {
      toast.error('Failed to update user status');
      console.error('Error updating status:', error);
    } finally {
      setUpdating(null);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      super_admin: 'bg-red-500/20 text-red-700 dark:text-red-400',
      admin: 'bg-orange-500/20 text-orange-700 dark:text-orange-400',
      instructor: 'bg-blue-500/20 text-blue-700 dark:text-blue-400',
      moderator: 'bg-purple-500/20 text-purple-700 dark:text-purple-400',
      user: 'bg-gray-500/20 text-gray-700 dark:text-gray-400',
    };
    return colors[role] || colors.user;
  };

  const roleStats = data?.stats;
  const users = data?.users || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Access Control</h1>
        <p className="text-muted-foreground mt-2">
          Manage user roles, permissions, and access levels
        </p>
      </div>

      {/* Stats Cards */}
      {loading && !data ? (
        <div className="grid gap-4 md:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : roleStats ? (
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-xs">Super Admin</p>
              <p className="text-2xl font-bold">{roleStats.super_admin}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-xs">Admin</p>
              <p className="text-2xl font-bold">{roleStats.admin}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-xs">Instructors</p>
              <p className="text-2xl font-bold">{roleStats.instructor}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-xs">Moderators</p>
              <p className="text-2xl font-bold">{roleStats.moderator}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-xs">Users</p>
              <p className="text-2xl font-bold">{roleStats.user}</p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* User Management Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            User Management
          </CardTitle>
          <CardDescription>View and manage user roles and access</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 gap-2">
              <div className="relative flex-1">
                <Search className="text-muted-foreground absolute top-3 left-3 h-4 w-4" />
                <Input
                  placeholder="Search users..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="instructor">Instructor</SelectItem>
                  <SelectItem value="moderator">Moderator</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => fetchAccessData(1)} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Refresh
            </Button>
          </div>

          {/* Table */}
          {loading && !data ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="text-muted-foreground py-8 text-center">No users found</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user._id}>
                        <TableCell className="font-medium">
                          <div>
                            <p>{user.display_name || user.username}</p>
                            <p className="text-muted-foreground text-xs">@{user.username}</p>
                          </div>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge className={getRoleBadgeColor(user.role)}>
                            {user.role.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.is_active ? 'default' : 'secondary'}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {user.last_login
                            ? new Date(user.last_login).toLocaleDateString()
                            : 'Never'}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" disabled={updating === user._id}>
                                {updating === user._id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <MoreHorizontal className="h-4 w-4" />
                                )}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <div className="px-2 py-1.5 text-sm font-medium">Change Role</div>
                              <DropdownMenuItem
                                onClick={() => changeUserRole(user._id, 'super_admin')}
                                disabled={updating === user._id}
                              >
                                Super Admin
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => changeUserRole(user._id, 'admin')}
                                disabled={updating === user._id}
                              >
                                Admin
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => changeUserRole(user._id, 'instructor')}
                                disabled={updating === user._id}
                              >
                                Instructor
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => changeUserRole(user._id, 'moderator')}
                                disabled={updating === user._id}
                              >
                                Moderator
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => changeUserRole(user._id, 'user')}
                                disabled={updating === user._id}
                              >
                                User
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => toggleUserStatus(user._id, user.is_active)}
                                disabled={updating === user._id}
                              >
                                {user.is_active ? 'Disable User' : 'Enable User'}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="text-muted-foreground flex items-center justify-between py-4 text-sm">
                  <p>
                    Showing {users.length} of {pagination.total} users
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={() => fetchAccessData(currentPage - 1)}
                    >
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(
                        (page) => (
                          <Button
                            key={page}
                            variant={currentPage === page ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => fetchAccessData(page)}
                          >
                            {page}
                          </Button>
                        )
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === pagination.totalPages}
                      onClick={() => fetchAccessData(currentPage + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
