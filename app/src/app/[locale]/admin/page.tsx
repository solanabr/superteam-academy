'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, BookOpen, Award, TrendingUp, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getAdminStats, getRecentUsers } from '@/actions/admin';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeLearners: 0,
    totalCourses: 0,
    totalEnrollments: 0
  });
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsData, usersData] = await Promise.all([
            getAdminStats(),
            getRecentUsers()
        ]);
        setStats(statsData);
        setRecentUsers(usersData);
      } catch (error) {
        console.error("Failed to fetch admin stats:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
      return (
          <div className="flex items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#9945FF]" />
          </div>
      );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-white">Dashboard Overview</h2>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-[#13131a] border-[#2E2E36]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Users</CardTitle>
            <Users className="h-4 w-4 text-[#9945FF]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalUsers}</div>
            <p className="text-xs text-gray-500">Registered learners</p>
          </CardContent>
        </Card>

        <Card className="bg-[#13131a] border-[#2E2E36]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Active Learners</CardTitle>
            <TrendingUp className="h-4 w-4 text-[#14F195]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.activeLearners}</div>
            <p className="text-xs text-gray-500">Active in last 7 days</p>
          </CardContent>
        </Card>

        <Card className="bg-[#13131a] border-[#2E2E36]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Enrollments</CardTitle>
            <Award className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalEnrollments}</div>
            <p className="text-xs text-gray-500">Course signups</p>
          </CardContent>
        </Card>

        <Card className="bg-[#13131a] border-[#2E2E36]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalCourses}</div>
            <p className="text-xs text-gray-500">Available tracks</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Signups */}
          <Card className="bg-[#13131a] border-[#2E2E36]">
              <CardHeader>
                  <CardTitle className="text-white">Recent Signups</CardTitle>
              </CardHeader>
              <CardContent>
                  <div className="space-y-4">
                      {recentUsers.length === 0 ? (
                          <div className="text-gray-500 text-sm">No users found.</div>
                      ) : (
                          recentUsers.map(user => (
                              <div key={user._id} className="flex items-center justify-between border-b border-[#2E2E36] pb-2 last:border-0 last:pb-0">
                                  <div>
                                      <p className="text-white font-medium">{user.username || 'Anonymous'}</p>
                                      <p className="text-xs text-gray-500 font-mono">{user.walletAddress.slice(0, 4)}...{user.walletAddress.slice(-4)}</p>
                                  </div>
                                  <div className="text-right">
                                      <div className="text-xs text-[#9945FF]">{user.xp} XP</div>
                                      <div className="text-xs text-gray-600">{new Date(user.createdAt).toLocaleDateString()}</div>
                                  </div>
                              </div>
                          ))
                      )}
                  </div>
              </CardContent>
          </Card>
      </div>
    </div>
  );
}
