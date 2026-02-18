'use client';

import { useTranslations } from 'next-intl';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { BookOpen, Award, TrendingUp, Clock, Users, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function DashboardPage() {
  const t = useTranslations('dashboard');
  const { connected, publicKey } = useWallet();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'pt';

  if (!connected) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-8 h-8 text-primary-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Connect Your Wallet</h1>
          <p className="text-gray-600 mb-8">
            Please connect your Solana wallet to access your dashboard and start learning.
          </p>
          <WalletMultiButton className="!bg-primary-600 !hover:bg-primary-700" />
        </div>
      </div>
    );
  }

  const enrolledCourses = [
    {
      id: 2,
      title: 'Advanced Smart Contracts on Solana',
      progress: 65,
      totalLessons: 32,
      completedLessons: 21,
      instructor: 'João Santos',
      nextLesson: 'Error Handling in Rust'
    },
    {
      id: 1,
      title: 'Solana Development Fundamentals',
      progress: 100,
      totalLessons: 24,
      completedLessons: 24,
      instructor: 'Maria Silva',
      completed: true
    }
  ];

  const certificates = [
    {
      id: 1,
      courseTitle: 'Solana Development Fundamentals',
      issueDate: '2024-01-15',
      tokenId: 'CERT-001-ABC123',
      instructor: 'Maria Silva'
    }
  ];

  const stats = [
    {
      title: 'Courses Enrolled',
      value: enrolledCourses.length,
      icon: BookOpen,
      color: 'bg-primary-500'
    },
    {
      title: 'Certificates Earned',
      value: certificates.length,
      icon: Award,
      color: 'bg-secondary-500'
    },
    {
      title: 'Hours Learned',
      value: 48,
      icon: Clock,
      color: 'bg-green-500'
    },
    {
      title: 'Rank',
      value: '#142',
      icon: TrendingUp,
      color: 'bg-purple-500'
    }
  ];

  const recentActivity = [
    {
      type: 'course_progress',
      message: 'Completed lesson "Error Handling in Rust"',
      timestamp: '2 hours ago',
      course: 'Advanced Smart Contracts'
    },
    {
      type: 'certificate',
      message: 'Earned NFT certificate for Solana Fundamentals',
      timestamp: '1 day ago',
      course: 'Solana Development Fundamentals'
    },
    {
      type: 'course_enrollment',
      message: 'Enrolled in Advanced Smart Contracts',
      timestamp: '3 days ago',
      course: 'Advanced Smart Contracts'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('title')}
          </h1>
          <p className="text-gray-600">
            {t('welcome')}, {publicKey?.toString().slice(0, 8)}...{publicKey?.toString().slice(-8)}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center">
                  <div className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-gray-600 text-sm">{stat.title}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Enrolled Courses */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {t('enrolledCourses')}
                </h2>
                <Link
                  href={`/${locale}/courses`}
                  className="text-primary-600 hover:text-primary-800 font-medium text-sm"
                >
                  {t('viewAll')}
                </Link>
              </div>

              {enrolledCourses.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600 mb-4">{t('noCourses')}</p>
                  <Link
                    href={`/${locale}/courses`}
                    className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    {t('browseCourses')}
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </div>
              ) : (
                <div className="space-y-6">
                  {enrolledCourses.map((course) => (
                    <div key={course.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-1">
                            {course.title}
                          </h3>
                          <p className="text-sm text-gray-600">by {course.instructor}</p>
                        </div>
                        {course.completed ? (
                          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                            Completed
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                            In Progress
                          </span>
                        )}
                      </div>
                      
                      <div className="mb-3">
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>{t('progress')}</span>
                          <span>{course.completedLessons}/{course.totalLessons} lessons</span>
                        </div>
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{ width: `${course.progress}%` }}
                          ></div>
                        </div>
                        <div className="text-right text-sm text-gray-600 mt-1">
                          {course.progress}%
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        {!course.completed && course.nextLesson && (
                          <div className="text-sm text-gray-600">
                            Next: {course.nextLesson}
                          </div>
                        )}
                        <div className="ml-auto flex gap-2">
                          {course.completed ? (
                            <Link
                              href={`/${locale}/courses/${course.id}/certificate`}
                              className="px-4 py-2 bg-secondary-500 text-white rounded-lg hover:bg-secondary-600 transition-colors text-sm"
                            >
                              View Certificate
                            </Link>
                          ) : (
                            <Link
                              href={`/${locale}/courses/${course.id}/learn`}
                              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
                            >
                              Continue Learning
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* My Certificates */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                {t('certificates')}
              </h3>
              
              {certificates.length === 0 ? (
                <div className="text-center py-4">
                  <Award className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">No certificates yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {certificates.map((cert) => (
                    <div key={cert.id} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-secondary-100 rounded-full flex items-center justify-center">
                          <Award className="w-4 h-4 text-secondary-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm truncate">
                            {cert.courseTitle}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(cert.issueDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-gray-400 font-mono">
                        {cert.tokenId}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                {t('recentActivity')}
              </h3>
              
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex space-x-3">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                      {activity.type === 'certificate' && <Award className="w-4 h-4 text-primary-600" />}
                      {activity.type === 'course_progress' && <BookOpen className="w-4 h-4 text-primary-600" />}
                      {activity.type === 'course_enrollment' && <Users className="w-4 h-4 text-primary-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">{activity.message}</p>
                      <p className="text-xs text-gray-500">{activity.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}