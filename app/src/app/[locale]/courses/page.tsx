'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Search, Filter, Clock, Users, Star, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function CoursesPage() {
  const t = useTranslations('courses');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'pt';

  const categories = [
    { id: 'all', name: t('allCategories') },
    { id: 'development', name: 'Development' },
    { id: 'defi', name: 'DeFi' },
    { id: 'nft', name: 'NFTs' },
    { id: 'trading', name: 'Trading' },
    { id: 'security', name: 'Security' }
  ];

  const courses = [
    {
      id: 1,
      title: 'Solana Development Fundamentals',
      description: 'Master the basics of Solana blockchain development from scratch. Learn Rust programming, understand Solana\'s architecture, and build your first dApp.',
      level: 'Beginner',
      duration: '6 weeks',
      students: 1234,
      rating: 4.8,
      lessons: 24,
      instructor: 'Maria Silva',
      price: 'Free',
      category: 'development',
      enrolled: false
    },
    {
      id: 2,
      title: 'Advanced Smart Contracts on Solana',
      description: 'Build complex smart contracts and dApps on Solana. Learn advanced Rust patterns, program security, and optimization techniques.',
      level: 'Advanced',
      duration: '8 weeks',
      students: 856,
      rating: 4.9,
      lessons: 32,
      instructor: 'João Santos',
      price: 'Premium',
      category: 'development',
      enrolled: true
    },
    {
      id: 3,
      title: 'DeFi Protocol Development',
      description: 'Create decentralized finance protocols on Solana. Learn about AMMs, lending protocols, and yield farming mechanisms.',
      level: 'Intermediate',
      duration: '10 weeks',
      students: 642,
      rating: 4.7,
      lessons: 40,
      instructor: 'Ana Costa',
      price: 'Premium',
      category: 'defi',
      enrolled: false
    },
    {
      id: 4,
      title: 'NFT Marketplace Development',
      description: 'Build a complete NFT marketplace from scratch. Learn Metaplex SDK, auction mechanisms, and marketplace smart contracts.',
      level: 'Intermediate',
      duration: '7 weeks',
      students: 523,
      rating: 4.6,
      lessons: 28,
      instructor: 'Carlos Lima',
      price: 'Premium',
      category: 'nft',
      enrolled: false
    },
    {
      id: 5,
      title: 'Solana Security & Auditing',
      description: 'Learn security best practices and auditing techniques for Solana programs. Prevent common vulnerabilities and secure your dApps.',
      level: 'Advanced',
      duration: '6 weeks',
      students: 387,
      rating: 4.9,
      lessons: 24,
      instructor: 'Laura Mendes',
      price: 'Premium',
      category: 'security',
      enrolled: false
    },
    {
      id: 6,
      title: 'Algorithmic Trading on Solana',
      description: 'Build automated trading bots and strategies for Solana DEXes. Learn market making, arbitrage, and risk management.',
      level: 'Advanced',
      duration: '9 weeks',
      students: 298,
      rating: 4.5,
      lessons: 36,
      instructor: 'Pedro Rocha',
      price: 'Premium',
      category: 'trading',
      enrolled: false
    }
  ];

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || course.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Beginner': return 'bg-green-100 text-green-800';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'Advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            {t('title')}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover our comprehensive collection of Solana blockchain courses designed for all skill levels.
          </p>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder={t('search')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Filter className="text-gray-400 w-5 h-5" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCourses.map((course) => (
            <div key={course.id} className="course-card group">
              <div className="relative mb-6 overflow-hidden rounded-lg">
                <div className="w-full h-48 bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                  <div className="text-white text-6xl font-bold opacity-20">
                    {course.category.charAt(0).toUpperCase()}
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
                {course.enrolled && (
                  <div className="absolute bottom-4 left-4">
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-500 text-white">
                      {t('enrolled')}
                    </span>
                  </div>
                )}
              </div>

              <div className="mb-4">
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                  {course.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-3">
                  {course.description}
                </p>
                <div className="text-sm text-gray-500 mb-2">
                  by {course.instructor}
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-500 mb-6">
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{course.duration}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span>{course.lessons} {t('lessons')}</span>
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

              <div className="flex gap-3">
                <Link
                  href={`/${locale}/courses/${course.id}`}
                  className="flex-1 text-center px-4 py-2 border border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 transition-colors"
                >
                  View Details
                </Link>
                {course.enrolled ? (
                  <Link
                    href={`/${locale}/courses/${course.id}/learn`}
                    className="flex-1 text-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    {t('continue')}
                  </Link>
                ) : (
                  <button className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                    {t('enroll')}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredCourses.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">No courses found matching your criteria.</div>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
              }}
              className="mt-4 text-primary-600 hover:text-primary-800 font-medium"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}