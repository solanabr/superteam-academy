'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useWallet } from '@solana/wallet-adapter-react';
import { 
  Clock, Users, Star, BookOpen, Play, CheckCircle, Lock, 
  Award, User, ChevronDown, ChevronUp 
} from 'lucide-react';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import toast from 'react-hot-toast';

export default function CourseDetailPage() {
  const params = useParams();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'pt';
  const courseId = params.id as string;
  const t = useTranslations('course');
  const { connected } = useWallet();
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedModule, setExpandedModule] = useState<number | null>(0);

  // Mock course data - in real app, fetch from API/blockchain
  const course = {
    id: courseId,
    title: 'Advanced Smart Contracts on Solana',
    description: 'Master advanced smart contract development on Solana. Learn complex patterns, security best practices, and build production-ready dApps.',
    longDescription: `This comprehensive course takes you deep into Solana smart contract development. You'll learn advanced Rust programming patterns, understand Solana's unique architecture, and build complex decentralized applications.

Throughout the course, you'll work on real-world projects including a DEX, NFT marketplace, and governance protocol. Each module builds upon previous concepts, ensuring you develop both theoretical understanding and practical skills.

By the end of this course, you'll be able to architect and implement sophisticated Solana programs, handle edge cases, optimize for performance, and follow security best practices.`,
    level: 'Advanced',
    duration: '8 weeks',
    students: 856,
    rating: 4.9,
    reviews: 124,
    lessons: 32,
    instructor: {
      name: 'João Santos',
      bio: 'Senior Blockchain Developer with 5+ years experience in Solana ecosystem',
      avatar: '/api/placeholder/100/100'
    },
    price: 'Premium',
    enrolled: true,
    progress: 65,
    completedLessons: 21,
    category: 'Development',
    prerequisites: [
      'Basic Rust programming knowledge',
      'Understanding of blockchain concepts',
      'Completed Solana Fundamentals course'
    ],
    whatYouLearn: [
      'Advanced Rust patterns for Solana development',
      'Complex program architecture and design patterns',
      'Cross-program invocation (CPI) techniques',
      'Program security and common vulnerabilities',
      'Testing and debugging strategies',
      'Performance optimization techniques',
      'Integration with frontend applications',
      'Deployment and monitoring best practices'
    ],
    curriculum: [
      {
        id: 1,
        title: 'Advanced Program Architecture',
        duration: '45 mins',
        lessons: [
          { id: 1, title: 'Program Structure and Organization', duration: '12 mins', completed: true },
          { id: 2, title: 'Advanced Account Management', duration: '15 mins', completed: true },
          { id: 3, title: 'State Management Patterns', duration: '18 mins', completed: true }
        ]
      },
      {
        id: 2,
        title: 'Cross-Program Invocation',
        duration: '60 mins',
        lessons: [
          { id: 4, title: 'Understanding CPI', duration: '20 mins', completed: true },
          { id: 5, title: 'Implementing CPI Calls', duration: '25 mins', completed: true },
          { id: 6, title: 'CPI Security Considerations', duration: '15 mins', completed: false }
        ]
      },
      {
        id: 3,
        title: 'Security & Auditing',
        duration: '75 mins',
        lessons: [
          { id: 7, title: 'Common Vulnerabilities', duration: '25 mins', completed: false },
          { id: 8, title: 'Security Best Practices', duration: '30 mins', completed: false },
          { id: 9, title: 'Code Review and Auditing', duration: '20 mins', completed: false }
        ]
      },
      {
        id: 4,
        title: 'Testing & Deployment',
        duration: '90 mins',
        lessons: [
          { id: 10, title: 'Unit Testing Strategies', duration: '30 mins', completed: false },
          { id: 11, title: 'Integration Testing', duration: '35 mins', completed: false },
          { id: 12, title: 'Deployment Pipeline', duration: '25 mins', completed: false }
        ]
      }
    ]
  };

  const handleEnroll = async () => {
    if (!connected) {
      toast.error('Please connect your wallet first');
      return;
    }
    
    // Mock enrollment logic
    toast.success('Successfully enrolled in course!');
  };

  const tabs = [
    { id: 'overview', name: t('overview') },
    { id: 'curriculum', name: t('curriculum') },
    { id: 'instructor', name: t('instructor') },
    { id: 'reviews', name: t('reviews') }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="mb-4">
                <span className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm font-medium">
                  {course.level}
                </span>
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold mb-4">
                {course.title}
              </h1>
              <p className="text-xl text-primary-100 mb-6">
                {course.description}
              </p>
              
              <div className="flex items-center space-x-6 text-sm">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span>{course.duration}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <BookOpen className="w-4 h-4" />
                  <span>{course.lessons} lessons</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span>{course.students.toLocaleString()} students</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span>{course.rating} ({course.reviews} reviews)</span>
                </div>
              </div>
            </div>

            {/* Course Card */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-xl p-6 text-gray-900">
                <div className="aspect-video bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg mb-6 flex items-center justify-center">
                  <Play className="w-16 h-16 text-white opacity-80" />
                </div>
                
                <div className="mb-6">
                  <div className="text-2xl font-bold mb-2">
                    {course.price === 'Free' ? 'Free' : '$99'}
                  </div>
                  <div className="text-gray-600">
                    Full lifetime access
                  </div>
                </div>

                {course.enrolled ? (
                  <div className="space-y-3">
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Progress</span>
                        <span>{course.completedLessons}/{course.lessons} lessons</span>
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
                    
                    <Link
                      href={`/${locale}/courses/${courseId}/learn`}
                      className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-primary-700 transition-colors text-center block"
                    >
                      Continue Learning
                    </Link>
                    
                    {course.progress === 100 && (
                      <Link
                        href={`/${locale}/courses/${courseId}/certificate`}
                        className="w-full bg-secondary-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-secondary-600 transition-colors text-center block flex items-center justify-center"
                      >
                        <Award className="w-4 h-4 mr-2" />
                        Get Certificate
                      </Link>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={handleEnroll}
                    className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
                  >
                    {t('enroll')}
                  </button>
                )}

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    Includes:
                  </div>
                  <ul className="mt-2 space-y-2 text-sm">
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>32 video lessons</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Hands-on projects</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Code templates</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>NFT Certificate</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Community access</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {/* Tabs */}
            <div className="border-b border-gray-200 mb-8">
              <nav className="flex space-x-8">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.name}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    {t('description')}
                  </h3>
                  <div className="prose prose-lg text-gray-600">
                    {course.longDescription.split('\n\n').map((paragraph, index) => (
                      <p key={index} className="mb-4">{paragraph}</p>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    {t('whatYouLearn')}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {course.whatYouLearn.map((item, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-600">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    {t('requirements')}
                  </h3>
                  <ul className="space-y-2">
                    {course.prerequisites.map((req, index) => (
                      <li key={index} className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-gray-400 rounded-full flex-shrink-0 mt-2"></div>
                        <span className="text-gray-600">{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {activeTab === 'curriculum' && (
              <div className="space-y-4">
                {course.curriculum.map((module) => (
                  <div key={module.id} className="border border-gray-200 rounded-lg">
                    <button
                      onClick={() => setExpandedModule(expandedModule === module.id ? null : module.id)}
                      className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50"
                    >
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">
                          Module {module.id}: {module.title}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {module.lessons.length} lessons • {module.duration}
                        </p>
                      </div>
                      {expandedModule === module.id ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                    
                    {expandedModule === module.id && (
                      <div className="px-6 pb-4 border-t border-gray-100">
                        {module.lessons.map((lesson) => (
                          <div key={lesson.id} className="flex items-center justify-between py-3">
                            <div className="flex items-center space-x-3">
                              {lesson.completed ? (
                                <CheckCircle className="w-5 h-5 text-green-500" />
                              ) : course.enrolled ? (
                                <Play className="w-5 h-5 text-primary-500" />
                              ) : (
                                <Lock className="w-5 h-5 text-gray-400" />
                              )}
                              <span className={lesson.completed ? 'text-gray-900' : 'text-gray-600'}>
                                {lesson.title}
                              </span>
                            </div>
                            <span className="text-sm text-gray-500">
                              {lesson.duration}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'instructor' && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {course.instructor.name}
                    </h3>
                    <p className="text-gray-600">
                      {course.instructor.bio}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 pt-6 border-t border-gray-200">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">5+</div>
                    <div className="text-gray-600 text-sm">Years Experience</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">10k+</div>
                    <div className="text-gray-600 text-sm">Students Taught</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">4.9</div>
                    <div className="text-gray-600 text-sm">Rating</div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="text-3xl font-bold text-gray-900">4.9</div>
                    <div>
                      <div className="flex items-center space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                      <div className="text-gray-600 text-sm">Based on {course.reviews} reviews</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Mock reviews */}
                  {[1, 2, 3].map((review) => (
                    <div key={review} className="bg-white rounded-lg shadow-md p-6">
                      <div className="flex items-start space-x-4">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-primary-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="font-semibold text-gray-900">Student #{review}</span>
                            <div className="flex items-center space-x-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star key={star} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              ))}
                            </div>
                            <span className="text-gray-500 text-sm">2 days ago</span>
                          </div>
                          <p className="text-gray-600">
                            Excellent course! The instructor explains complex concepts clearly and the hands-on projects really helped solidify my understanding of Solana development.
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Instructor Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  About the Instructor
                </h3>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">
                      {course.instructor.name}
                    </div>
                    <div className="text-gray-600 text-sm">
                      Blockchain Developer
                    </div>
                  </div>
                </div>
                <p className="text-gray-600 text-sm">
                  {course.instructor.bio}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}