'use client';

import { useState, useMemo } from 'react';
import {
  ArrowUpDown,
  MoreHorizontal,
  Eye,
  Pencil,
  XCircle,
  Search,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface Course {
  id: string;
  title: string;
  creator: string;
  lessons: number;
  enrollments: number;
  status: 'active' | 'inactive' | 'draft';
}

const MOCK_COURSES: Course[] = [
  {
    id: 'SOL-101',
    title: 'Solana Fundamentals',
    creator: 'ACAd...gqYn',
    lessons: 12,
    enrollments: 847,
    status: 'active',
  },
  {
    id: 'ANC-201',
    title: 'Intro to Anchor',
    creator: 'ACAd...gqYn',
    lessons: 8,
    enrollments: 632,
    status: 'active',
  },
  {
    id: 'TOK-301',
    title: 'Token Extensions Deep Dive',
    creator: '7nYK...Je93',
    lessons: 15,
    enrollments: 421,
    status: 'active',
  },
  {
    id: 'NFT-102',
    title: 'NFT Minting Workshop',
    creator: 'Bx3M...gqYn',
    lessons: 6,
    enrollments: 389,
    status: 'active',
  },
  {
    id: 'DEF-401',
    title: 'DeFi Protocol Design',
    creator: 'C4tF...hgq',
    lessons: 18,
    enrollments: 276,
    status: 'active',
  },
  {
    id: 'BLK-201',
    title: 'Blinks & Actions',
    creator: 'ACAd...gqYn',
    lessons: 10,
    enrollments: 198,
    status: 'active',
  },
  {
    id: 'SEC-301',
    title: 'Web3 Security Essentials',
    creator: 'DRwP...gqYn',
    lessons: 14,
    enrollments: 164,
    status: 'inactive',
  },
  {
    id: 'CPI-401',
    title: 'Cross-Program Invocations',
    creator: 'E5sQ...gqYn',
    lessons: 9,
    enrollments: 112,
    status: 'active',
  },
  {
    id: 'CNF-201',
    title: 'cNFT Compression Guide',
    creator: 'F8tR...gqYn',
    lessons: 7,
    enrollments: 87,
    status: 'draft',
  },
  {
    id: 'RST-101',
    title: 'Rust for Solana Developers',
    creator: 'G2uS...gqYn',
    lessons: 20,
    enrollments: 54,
    status: 'draft',
  },
];

type SortKey = keyof Pick<Course, 'title' | 'lessons' | 'enrollments'>;
type SortDirection = 'asc' | 'desc';

const STATUS_STYLES: Record<
  Course['status'],
  { variant: 'default' | 'secondary' | 'outline'; label: string }
> = {
  active: { variant: 'default', label: 'Active' },
  inactive: { variant: 'secondary', label: 'Inactive' },
  draft: { variant: 'outline', label: 'Draft' },
};

export function CourseTable() {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('enrollments');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    let result = MOCK_COURSES.filter(
      (c) =>
        c.title.toLowerCase().includes(term) ||
        c.id.toLowerCase().includes(term) ||
        c.creator.toLowerCase().includes(term),
    );

    result.sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDir === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });

    return result;
  }, [search, sortKey, sortDir]);

  function SortableHead({
    label,
    columnKey,
  }: {
    label: string;
    columnKey: SortKey;
  }) {
    return (
      <TableHead>
        <button
          type="button"
          onClick={() => handleSort(columnKey)}
          className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
        >
          {label}
          <ArrowUpDown
            className={cn(
              'size-3.5',
              sortKey === columnKey
                ? 'text-foreground'
                : 'text-muted-foreground/50',
            )}
          />
        </button>
      </TableHead>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search courses..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Course ID</TableHead>
              <SortableHead label="Title" columnKey="title" />
              <TableHead>Creator</TableHead>
              <SortableHead label="Lessons" columnKey="lessons" />
              <SortableHead label="Enrollments" columnKey="enrollments" />
              <TableHead>Status</TableHead>
              <TableHead className="w-[60px]">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-24 text-center text-muted-foreground"
                >
                  No courses found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((course) => {
                const statusConfig = STATUS_STYLES[course.status];
                return (
                  <TableRow key={course.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {course.id}
                    </TableCell>
                    <TableCell className="font-medium">
                      {course.title}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {course.creator}
                    </TableCell>
                    <TableCell>{course.lessons}</TableCell>
                    <TableCell>
                      {course.enrollments.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusConfig.variant}>
                        {statusConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-xs">
                            <MoreHorizontal className="size-4" />
                            <span className="sr-only">
                              Actions for {course.title}
                            </span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="size-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Pencil className="size-4" />
                            Edit in CMS
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem variant="destructive">
                            <XCircle className="size-4" />
                            Deactivate
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground">
        Showing {filtered.length} of {MOCK_COURSES.length} courses
      </p>
    </div>
  );
}
