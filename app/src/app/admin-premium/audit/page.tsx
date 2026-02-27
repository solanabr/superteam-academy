'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Clock, User, Shield, Search, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface AuditLog {
  _id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  action: string;
  description: string;
  resource: string;
  resourceId: string;
  resourceName?: string;
  changes?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
  status: 'success' | 'failure';
  errorMessage?: string;
}

interface AuditData {
  logs: AuditLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  summary: {
    totalActions: number;
    successCount: number;
    failureCount: number;
    uniqueUserCount: number;
    uniqueResourceCount: number;
  };
  actionBreakdown: Array<{
    _id: string;
    count: number;
    successCount: number;
    failureCount: number;
  }>;
  resourceBreakdown: Array<{
    _id: string;
    count: number;
  }>;
}

export default function AuditLogsPage() {
  const [data, setData] = useState<AuditData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('all');
  const [resource, setResource] = useState('all');
  const [status, setStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('timestamp');
  const [sortOrder, setSortOrder] = useState('desc');

  const fetchAuditLogs = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set('page', page.toString());
        params.set('limit', '20');
        if (search) params.set('search', search);
        if (action !== 'all') params.set('action', action);
        if (resource !== 'all') params.set('resource', resource);
        if (status !== 'all') params.set('status', status);
        params.set('sortBy', sortBy);
        params.set('sortOrder', sortOrder);

        const res = await fetch(`/api/admin/audit?${params.toString()}`);
        const result = await res.json();

        if (res.ok) {
          setData(result);
          setCurrentPage(page);
        } else {
          toast.error(result.error || 'Failed to fetch audit logs');
        }
      } catch (error) {
        toast.error('Failed to fetch audit logs');
        console.error('Error fetching audit logs:', error);
      } finally {
        setLoading(false);
      }
    },
    [search, action, resource, status, sortBy, sortOrder]
  );

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  const getActionIcon = (actionType: string) => {
    if (actionType.includes('Login')) return <User className="h-4 w-4" />;
    if (actionType.includes('Created') || actionType.includes('Updated')) {
      return <Shield className="h-4 w-4" />;
    }
    return <Clock className="h-4 w-4" />;
  };

  const logs = data?.logs || [];
  const pagination = data?.pagination;
  const summary = data?.summary;
  const actionBreakdown = data?.actionBreakdown || [];
  const resourceBreakdown = data?.resourceBreakdown || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Audit Logs</h1>
        <p className="text-muted-foreground mt-2">
          Track all administrative actions and system changes
        </p>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-xs">Total Actions</p>
              <p className="text-2xl font-bold">{summary.totalActions}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-xs">Successful</p>
              <p className="text-2xl font-bold text-green-600">{summary.successCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-xs">Failed</p>
              <p className="text-2xl font-bold text-red-600">{summary.failureCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-xs">Unique Users</p>
              <p className="text-2xl font-bold">{summary.uniqueUserCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-xs">Resource Types</p>
              <p className="text-2xl font-bold">{summary.uniqueResourceCount}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Activity Log */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Activity Log
          </CardTitle>
          <CardDescription>Recent administrative activities</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 gap-2">
              <div className="relative flex-1">
                <Search className="text-muted-foreground absolute top-3 left-3 h-4 w-4" />
                <Input
                  placeholder="Search logs..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={action} onValueChange={setAction}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  {actionBreakdown.map((item) => (
                    <SelectItem key={item._id} value={item._id}>
                      {item._id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={resource} onValueChange={setResource}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Resource" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Resources</SelectItem>
                  {resourceBreakdown
                    .filter((item) => Boolean(item._id))
                    .map((item) => (
                      <SelectItem key={item._id} value={item._id}>
                        {item._id}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="failure">Failure</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => fetchAuditLogs(1)} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Refresh
            </Button>
          </div>

          {/* Logs List */}
          <div className="space-y-3">
            {loading && !data ? (
              <>
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </>
            ) : logs.length === 0 ? (
              <div className="text-muted-foreground py-8 text-center">No audit logs found</div>
            ) : (
              logs.map((log) => (
                <div key={log._id} className="rounded-lg border p-4 text-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {getActionIcon(log.action)}
                        <p className="font-medium">{log.action}</p>
                        <Badge variant={log.status === 'success' ? 'default' : 'destructive'}>
                          {log.status === 'success' ? (
                            <CheckCircle className="mr-1 h-3 w-3" />
                          ) : (
                            <AlertCircle className="mr-1 h-3 w-3" />
                          )}
                          {log.status}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground mt-1 text-xs">{log.description}</p>
                      <div className="text-muted-foreground mt-2 flex flex-wrap gap-4 text-xs">
                        {log.userName && <span>User: {log.userName}</span>}
                        {log.resource && (
                          <span>
                            Resource: {log.resource}
                            {log.resourceName ? ` (${log.resourceName})` : ''}
                          </span>
                        )}
                        {log.ipAddress && <span>IP: {log.ipAddress}</span>}
                      </div>
                      {log.errorMessage && (
                        <p className="mt-1 text-xs text-red-600">Error: {log.errorMessage}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-muted-foreground text-xs">
                        {new Date(log.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="text-muted-foreground flex items-center justify-between py-4 text-sm">
              <p>
                Showing {logs.length} of {pagination.total} logs
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => fetchAuditLogs(currentPage - 1)}
                >
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => fetchAuditLogs(page)}
                    >
                      {page}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === pagination.totalPages}
                  onClick={() => fetchAuditLogs(currentPage + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
