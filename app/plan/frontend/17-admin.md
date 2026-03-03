# Admin Dashboard

## Overview

The Admin Dashboard provides platform management capabilities including course management, user analytics, and configuration.

## Features

- Course management (CRUD)
- User management
- Analytics dashboard
- Achievement management
- Platform configuration
- Minter management

## Implementation

### 1. Admin Layout

```typescript
// app/(admin)/admin/layout.tsx
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  
  // Check if user is admin
  // In production, check against admin list or role
  const isAdmin = session?.user?.email?.endsWith('@superteam.fun');
  
  if (!isAdmin) {
    redirect('/dashboard');
  }
  
  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-main">
        {children}
      </main>
    </div>
  );
}
```

### 2. Admin Sidebar

```typescript
// components/admin/AdminSidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: '📊' },
  { href: '/admin/courses', label: 'Courses', icon: '📚' },
  { href: '/admin/users', label: 'Users', icon: '👥' },
  { href: '/admin/achievements', label: 'Achievements', icon: '🏆' },
  { href: '/admin/minters', label: 'Minters', icon: '🔑' },
  { href: '/admin/config', label: 'Config', icon: '⚙️' },
];

export function AdminSidebar() {
  const pathname = usePathname();
  
  return (
    <aside className="admin-sidebar">
      <div className="sidebar-header">
        <h2>Admin</h2>
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-item ${pathname === item.href ? 'active' : ''}`}
          >
            <span className="icon">{item.icon}</span>
            <span className="label">{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
```

### 3. Admin Dashboard Page

```typescript
// app/(admin)/admin/page.tsx
import { prisma } from '@/lib/prisma';
import { AdminStatsCard } from '@/components/admin/AdminStatsCard';

export default async function AdminDashboard() {
  const [
    totalUsers,
    totalCourses,
    totalEnrollments,
    totalCompletions,
    totalXpMinted,
    activeUsersToday,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.course.count(),
    prisma.enrollment.count(),
    prisma.enrollment.count({ where: { completedAt: { not: null } } }),
    prisma.xpHistory.aggregate({ _sum: { amount: true } }),
    prisma.user.count({
      where: {
        enrollments: {
          some: {
            updatedAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
            },
          },
        },
      },
    }),
  ]);
  
  return (
    <div className="admin-dashboard">
      <h1>Dashboard</h1>
      
      <div className="stats-grid">
        <AdminStatsCard
          title="Total Users"
          value={totalUsers}
          icon="👥"
          change="+12%"
        />
        <AdminStatsCard
          title="Active Today"
          value={activeUsersToday}
          icon="🔥"
          change="+5%"
        />
        <AdminStatsCard
          title="Total Courses"
          value={totalCourses}
          icon="📚"
        />
        <AdminStatsCard
          title="Enrollments"
          value={totalEnrollments}
          icon="📝"
          change="+8%"
        />
        <AdminStatsCard
          title="Completions"
          value={totalCompletions}
          icon="✅"
          change="+15%"
        />
        <AdminStatsCard
          title="Total XP Minted"
          value={totalXpMinted._sum.amount || 0}
          icon="⚡"
        />
      </div>
      
      <div className="dashboard-charts">
        <div className="chart-card">
          <h3>User Growth</h3>
          <UserGrowthChart />
        </div>
        <div className="chart-card">
          <h3>Course Popularity</h3>
          <CoursePopularityChart />
        </div>
      </div>
      
      <div className="recent-activity">
        <h3>Recent Activity</h3>
        <ActivityFeed />
      </div>
    </div>
  );
}
```

### 4. Course Management

```typescript
// app/(admin)/admin/courses/page.tsx
import { prisma } from '@/lib/prisma';
import { CourseTable } from '@/components/admin/CourseTable';

export default async function AdminCoursesPage() {
  const courses = await prisma.course.findMany({
    include: {
      _count: {
        select: { enrollments: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  
  return (
    <div className="admin-courses">
      <div className="page-header">
        <h1>Courses</h1>
        <a href="/admin/courses/create" className="btn-primary">
          Create Course
        </a>
      </div>
      
      <CourseTable courses={courses} />
    </div>
  );
}
```

```typescript
// app/(admin)/admin/courses/create/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CourseForm } from '@/components/admin/CourseForm';

export default function CreateCoursePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (response.ok) {
        router.push('/admin/courses');
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="create-course">
      <h1>Create Course</h1>
      <CourseForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </div>
  );
}
```

### 5. User Management

```typescript
// app/(admin)/admin/users/page.tsx
import { prisma } from '@/lib/prisma';
import { UserTable } from '@/components/admin/UserTable';

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: { page?: string; search?: string };
}) {
  const page = parseInt(searchParams.page || '1');
  const pageSize = 20;
  const search = searchParams.search || '';
  
  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { wallet_address: { contains: search, mode: 'insensitive' } },
        ],
      }
    : {};
  
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: {
        _count: { select: { enrollments: true } },
        linked_accounts: true,
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ]);
  
  return (
    <div className="admin-users">
      <h1>Users</h1>
      
      <div className="filters">
        <input
          type="search"
          placeholder="Search users..."
          defaultValue={search}
        />
      </div>
      
      <UserTable users={users} />
      
      <Pagination
        current={page}
        total={Math.ceil(total / pageSize)}
      />
    </div>
  );
}
```

### 6. Achievement Management

```typescript
// app/(admin)/admin/achievements/page.tsx
import { AchievementTable } from '@/components/admin/AchievementTable';

export default async function AdminAchievementsPage() {
  // Fetch from on-chain or cache
  const achievements = await fetchAchievements();
  
  return (
    <div className="admin-achievements">
      <div className="page-header">
        <h1>Achievements</h1>
        <a href="/admin/achievements/create" className="btn-primary">
          Create Achievement
        </a>
      </div>
      
      <AchievementTable achievements={achievements} />
    </div>
  );
}
```

### 7. Configuration Page

```typescript
// app/(admin)/admin/config/page.tsx
'use client';

import { useState } from 'react';
import { ConfigForm } from '@/components/admin/ConfigForm';

export default function AdminConfigPage() {
  const [config, setConfig] = useState(null);
  
  return (
    <div className="admin-config">
      <h1>Platform Configuration</h1>
      
      <div className="config-sections">
        <section className="config-section">
          <h2>Backend Signer</h2>
          <p>Manage the backend signer keypair for transaction signing.</p>
          <ConfigForm
            fields={[
              { name: 'currentSigner', label: 'Current Signer', type: 'text', readOnly: true },
              { name: 'newSigner', label: 'New Signer', type: 'text' },
            ]}
            onSubmit={(data) => rotateSigner(data.newSigner)}
          />
        </section>
        
        <section className="config-section">
          <h2>XP Configuration</h2>
          <ConfigForm
            fields={[
              { name: 'xpPerLesson', label: 'Default XP Per Lesson', type: 'number' },
              { name: 'completionBonus', label: 'Completion Bonus (%)', type: 'number' },
              { name: 'streakBonus', label: 'Daily Streak Bonus', type: 'number' },
            ]}
            onSubmit={(data) => updateXpConfig(data)}
          />
        </section>
        
        <section className="config-section">
          <h2>Feature Flags</h2>
          <ConfigForm
            fields={[
              { name: 'enableAchievements', label: 'Enable Achievements', type: 'checkbox' },
              { name: 'enableLeaderboard', label: 'Enable Leaderboard', type: 'checkbox' },
              { name: 'enableStreaks', label: 'Enable Streaks', type: 'checkbox' },
            ]}
            onSubmit={(data) => updateFeatureFlags(data)}
          />
        </section>
      </div>
    </div>
  );
}
```

## Admin API Endpoints

```
# Courses
POST   /api/admin/courses              # Create course
PUT    /api/admin/courses/:id          # Update course
DELETE /api/admin/courses/:id          # Delete/deactivate course

# Users
GET    /api/admin/users                # List users
GET    /api/admin/users/:id            # Get user details
PUT    /api/admin/users/:id            # Update user
DELETE /api/admin/users/:id            # Ban/delete user

# Achievements
POST   /api/admin/achievements         # Create achievement type
PUT    /api/admin/achievements/:id     # Update achievement
DELETE /api/admin/achievements/:id     # Deactivate achievement

# Minters
POST   /api/admin/minters              # Register minter
DELETE /api/admin/minters/:id          # Revoke minter

# Config
POST   /api/admin/config/signer        # Rotate backend signer
PUT    /api/admin/config/xp            # Update XP config
PUT    /api/admin/config/features      # Update feature flags

# Stats
GET    /api/admin/stats                # Platform statistics
GET    /api/admin/stats/users          # User statistics
GET    /api/admin/stats/courses        # Course statistics
```

## Access Control

Admin access should be restricted to:
- Specific email domains
- Wallet addresses on allowlist
- Role-based permissions (future)
