import { Link, redirect } from '@/i18n/routing';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getTranslations } from 'next-intl/server';
import { Users, Layers, Activity, BookOpen, BarChart2, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

type AdminCourseAnalytics = {
  id: string;
  title: string;
  slug: string;
  enrollments: number;
  completions: number;
  completionRate: number;
};

export default async function AdminPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect({ href: '/auth/login', locale });
    return null;
  }

  const t = await getTranslations('Admin');

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const [
    profilesCountRes,
    coursesRes,
    enrollmentsRes,
    completionsRes,
    active7Res,
    active30Res,
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('courses').select('*').order('created_at', { ascending: false }),
    supabase
      .from('enrollments')
      .select('id, course_id, enrolled_at, completed_at, progress_percentage'),
    supabase.from('lesson_completions').select('*', { count: 'exact', head: true }),
    supabase
      .from('user_progress')
      .select('*', { count: 'exact', head: true })
      .gte('last_activity_date', sevenDaysAgo),
    supabase
      .from('user_progress')
      .select('*', { count: 'exact', head: true })
      .gte('last_activity_date', thirtyDaysAgo),
  ]);

  const totalUsers = profilesCountRes.count || 0;
  const courses = coursesRes.data || [];
  const enrollments = enrollmentsRes.data || [];
  const totalEnrollments = enrollments.length;
  const totalCompletions = completionsRes.count || 0;
  const activeUsers7d = active7Res.count || 0;
  const activeUsers30d = active30Res.count || 0;

  const completedEnrollmentsCount = enrollments.filter(
    (enrollment: any) =>
      enrollment.progress_percentage === 100 || Boolean(enrollment.completed_at),
  ).length;

  const avgCompletionRate =
    totalEnrollments > 0
      ? Math.round((completedEnrollmentsCount / totalEnrollments) * 100)
      : 0;

  const courseAnalytics: AdminCourseAnalytics[] = courses.map((course: any) => {
    const courseEnrollments = enrollments.filter(
      (enrollment: any) => enrollment.course_id === course.id,
    );
    const courseCompleted = courseEnrollments.filter(
      (enrollment: any) =>
        enrollment.progress_percentage === 100 || Boolean(enrollment.completed_at),
    );

    const enrollmentsCount = courseEnrollments.length;
    const completionsCount = courseCompleted.length;
    const completionRate =
      enrollmentsCount > 0
        ? Math.round((completionsCount / enrollmentsCount) * 100)
        : 0;

    return {
      id: course.id,
      title: course.title,
      slug: course.slug,
      enrollments: enrollmentsCount,
      completions: completionsCount,
      completionRate,
    };
  });

  const topCourses = courseAnalytics
    .slice()
    .sort((a, b) => b.enrollments - a.enrollments)
    .slice(0, 8);

  const stats = [
    {
      label: t('statsTotalUsers'),
      value: totalUsers.toLocaleString(),
      icon: Users,
    },
    {
      label: t('statsTotalCourses'),
      value: courses.length.toString(),
      icon: Layers,
    },
    {
      label: t('statsTotalEnrollments'),
      value: totalEnrollments.toString(),
      icon: BookOpen,
    },
    {
      label: t('statsTotalCompletions'),
      value: totalCompletions.toString(),
      icon: Activity,
    },
    {
      label: t('statsActive7d'),
      value: activeUsers7d.toString(),
      icon: Activity,
    },
    {
      label: t('statsActive30d'),
      value: activeUsers30d.toString(),
      icon: Activity,
    },
    {
      label: t('statsAvgCompletionRate'),
      value: `${avgCompletionRate}%`,
      icon: BarChart2,
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="container py-20 space-y-12">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10">
          <div className="space-y-6 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-black tracking-[0.2em] text-primary uppercase">
              <Shield className="h-3.5 w-3.5" />
              {t('badge')}
            </div>
            <h1 className="text-5xl md:text-6xl font-black tracking-tighter uppercase leading-[0.9]">
              {t('title')}
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground font-medium leading-relaxed">
              {t('subtitle')}
            </p>
          </div>
          <div className="flex flex-col items-end gap-3">
            <Button asChild variant="outline" className="rounded-2xl text-xs font-black uppercase tracking-widest">
              <Link href="/courses">
                {t('goToCourses')}
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat, index) => (
            <Card
              key={stat.label}
              className={cn(
                'relative overflow-hidden border-white/10 bg-white/[0.02] hover:bg-white/[0.05] transition-colors rounded-[2rem] p-6',
                index === 0 && 'md:col-span-2',
              )}
            >
              <div className="absolute top-6 right-6 p-3 rounded-2xl bg-white/5 border border-white/5">
                <stat.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-4">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                  {stat.label}
                </span>
                <div className="text-3xl md:text-4xl font-black tracking-tight">
                  {stat.value}
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
                <div className="h-8 w-1.5 bg-primary rounded-full" />
                {t('coursesSectionTitle')}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {t('coursesSectionSubtitle')}
              </p>
            </div>
          </div>

          {topCourses.length > 0 ? (
            <Card className="border-white/10 bg-white/[0.02] rounded-[2rem] overflow-hidden">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/[0.02] text-[11px] uppercase tracking-widest text-muted-foreground">
                        <th className="px-6 py-3 text-left font-semibold">
                          {t('coursesTableCourse')}
                        </th>
                        <th className="px-6 py-3 text-right font-semibold">
                          {t('coursesTableEnrollments')}
                        </th>
                        <th className="px-6 py-3 text-right font-semibold">
                          {t('coursesTableCompletions')}
                        </th>
                        <th className="px-6 py-3 text-right font-semibold">
                          {t('coursesTableCompletionRate')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {topCourses.map((course) => (
                        <tr
                          key={course.id}
                          className="border-b border-white/5 hover:bg-white/[0.03] transition-colors"
                        >
                          <td className="px-6 py-3">
                            <div className="flex flex-col">
                              <span className="font-semibold truncate">
                                {course.title}
                              </span>
                              <span className="text-[11px] text-muted-foreground">
                                {course.slug}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-3 text-right">
                            {course.enrollments}
                          </td>
                          <td className="px-6 py-3 text-right">
                            {course.completions}
                          </td>
                          <td className="px-6 py-3 text-right">
                            {course.completionRate}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed border-2 border-white/10 bg-white/[0.01] rounded-[2rem]">
              <CardContent className="py-12 text-center space-y-3">
                <p className="text-sm font-semibold">
                  {t('coursesEmpty')}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

