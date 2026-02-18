'use client';

import { useTranslations } from 'next-intl';
import { Clock, Users, Star, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function PopularCourses() {
  const t = useTranslations('courses');
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'pt';

  const courses = [
    {
      id: 1,
      title: 'Solana Development Fundamentals',
      description: 'Master the basics of Solana blockchain development from scratch',
      level: 'Beginner',
      duration: '6 weeks',
      students: 1234,
      rating: 4.8,
      image: '/api/placeholder/400/250',
      instructor: 'Maria Silva',
      price: 'Free',
      category: 'Development'
    },
    {
      id: 2,
      title: 'Advanced Smart Contracts',
      description: 'Build complex smart contracts and dApps on Solana',
      level: 'Advanced',
      duration: '8 weeks',
      students: 856,
      rating: 4.9,
      image: '/api/placeholder/400/250',
      instructor: 'João Santos',
      price: 'Premium',
      category: 'Development'
    },
    {
      id: 3,
      title: 'DeFi Protocol Development',
      description: 'Create decentralized finance protocols on Solana',
      level: 'Intermediate',
      duration: '10 weeks',
      students: 642,
      rating: 4.7,
      image: '/api/placeholder/400/250',
      instructor: 'Ana Costa',
      price: 'Premium',
      category: 'DeFi'
    }
  ];

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Beginner': return 'bg-green-100 text-green-800';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'Advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-16">
          <div>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Popular Courses
            </h2>
            <p className="text-xl text-gray-600">
              Start your journey with our most loved courses
            </p>
          </div>
          <Link
            href={`/${locale}/courses`}
            className="hidden md:inline-flex items-center px-6 py-3 rounded-lg bg-primary-600 text-white font-semibold hover:bg-primary-700 transition-colors"
          >
            View All Courses
            <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {courses.map((course) => (
            <div key={course.id} className="course-card group">
              <div className="relative mb-6 overflow-hidden rounded-lg">
                <div className="w-full h-48 bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                  <div className="text-white text-6xl font-bold opacity-20">
                    {course.category.charAt(0)}
                  </div>
                </div>
                <div className="absolute top-4 left-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getLevelColor(course.level)}`}>
                    {course.level}
                  </span>
                </div>
                <div className="absolute top-4 right-4">
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-white text-gray-800">
                    {course.price}
                  </span>
                </div>
              </div>

              <div className="mb-4">
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                  {course.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {course.description}
                </p>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{course.duration}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4" />
                  <span>{course.students.toLocaleString()}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span>{course.rating}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  by {course.instructor}
                </div>
                <Link
                  href={`/${locale}/courses/${course.id}`}
                  className="inline-flex items-center text-primary-600 hover:text-primary-800 font-medium text-sm"
                >
                  View Course
                  <ArrowRight className="ml-1 w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12 md:hidden">
          <Link
            href={`/${locale}/courses`}
            className="inline-flex items-center px-6 py-3 rounded-lg bg-primary-600 text-white font-semibold hover:bg-primary-700 transition-colors"
          >
            View All Courses
            <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}