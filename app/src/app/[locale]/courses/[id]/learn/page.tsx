'use client';

import { useState } from 'react';
import { useParams, usePathname } from 'next/navigation';
import { 
  Play, CheckCircle, Circle, Clock, FileText, ArrowLeft, ArrowRight, 
  CheckSquare, MessageSquare, ChevronLeft 
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function CourseLearningPage() {
  const params = useParams();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'pt';
  const courseId = params.id as string;
  const [currentLesson, setCurrentLesson] = useState(1);
  const [expandedModule, setExpandedModule] = useState(1);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);

  const course = {
    id: courseId,
    title: 'Advanced Smart Contracts on Solana',
    currentModule: 1,
    progress: 65,
    modules: [
      {
        id: 1,
        title: 'Advanced Program Architecture',
        duration: '45 mins',
        completed: true,
        lessons: [
          { id: 1, title: 'Program Structure and Organization', duration: '12 mins', type: 'video', completed: true },
          { id: 2, title: 'Advanced Account Management', duration: '15 mins', type: 'video', completed: true },
          { id: 3, title: 'State Management Patterns', duration: '18 mins', type: 'video', completed: true },
        ]
      },
      {
        id: 2,
        title: 'Cross-Program Invocation',
        duration: '60 mins',
        completed: false,
        lessons: [
          { id: 4, title: 'Understanding CPI', duration: '20 mins', type: 'video', completed: true },
          { id: 5, title: 'Implementing CPI Calls', duration: '25 mins', type: 'video', completed: true },
          { id: 6, title: 'CPI Security Considerations', duration: '15 mins', type: 'video', completed: false },
          { id: 7, title: 'Module Quiz', duration: '10 mins', type: 'quiz', completed: false },
        ]
      },
      {
        id: 3,
        title: 'Security & Auditing',
        duration: '75 mins',
        completed: false,
        lessons: [
          { id: 8, title: 'Common Vulnerabilities', duration: '25 mins', type: 'video', completed: false },
          { id: 9, title: 'Security Best Practices', duration: '30 mins', type: 'video', completed: false },
          { id: 10, title: 'Code Review and Auditing', duration: '20 mins', type: 'video', completed: false },
        ]
      },
      {
        id: 4,
        title: 'Testing & Deployment',
        duration: '90 mins',
        completed: false,
        lessons: [
          { id: 11, title: 'Unit Testing Strategies', duration: '30 mins', type: 'video', completed: false },
          { id: 12, title: 'Integration Testing', duration: '35 mins', type: 'video', completed: false },
          { id: 13, title: 'Deployment Pipeline', duration: '25 mins', type: 'video', completed: false },
        ]
      }
    ]
  };

  const currentLessonData = course.modules
    .flatMap(m => m.lessons)
    .find(l => l.id === currentLesson);

  const allLessons = course.modules.flatMap(m => m.lessons);
  const currentIndex = allLessons.findIndex(l => l.id === currentLesson);
  const hasNext = currentIndex < allLessons.length - 1;
  const hasPrevious = currentIndex > 0;

  const handleNext = () => {
    if (hasNext) {
      setCurrentLesson(allLessons[currentIndex + 1].id);
    }
  };

  const handlePrevious = () => {
    if (hasPrevious) {
      setCurrentLesson(allLessons[currentIndex - 1].id);
    }
  };

  const handleComplete = () => {
    toast.success('Lesson completed! 🎉');
    if (hasNext) {
      handleNext();
    }
  };

  const handleQuizSubmit = () => {
    setQuizCompleted(true);
    toast.success('Quiz submitted successfully!');
    setShowQuiz(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <Link 
                href={`/${locale}/courses/${courseId}`}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ChevronLeft className="w-5 h-5" />
                <span className="hidden sm:inline">Back to Course</span>
              </Link>
              <div className="h-6 w-px bg-gray-300 hidden sm:block"></div>
              <h1 className="text-lg font-semibold text-gray-900 truncate max-w-md">
                {course.title}
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Progress: {course.progress}%
              </div>
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary-600 rounded-full h-2 transition-all duration-300"
                  style={{ width: `${course.progress}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* Video Player */}
              <div className="aspect-video bg-gray-900 flex items-center justify-center">
                {currentLessonData?.type === 'video' ? (
                  <div className="text-center text-white">
                    <Play className="w-16 h-16 mx-auto mb-4 opacity-80" />
                    <p className="text-lg">Video Player</p>
                    <p className="text-gray-400 mt-2">{currentLessonData.duration}</p>
                  </div>
                ) : (
                  <div className="text-center text-white">
                    <CheckSquare className="w-16 h-16 mx-auto mb-4 opacity-80" />
                    <p className="text-lg">Quiz</p>
                  </div>
                )}
              </div>

              {/* Lesson Info */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-sm text-primary-600 font-medium">
                      Lesson {currentLesson}
                    </span>
                    <h2 className="text-xl font-bold text-gray-900 mt-1">
                      {currentLessonData?.title}
                    </h2>
                  </div>
                  <div className="text-sm text-gray-500 flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {currentLessonData?.duration}
                  </div>
                </div>

                {currentLessonData?.type === 'quiz' ? (
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="font-semibold mb-4">Quiz Questions</h3>
                    <div className="space-y-4">
                      <div>
                        <p className="font-medium mb-2">1. What is CPI in Solana?</p>
                        <div className="space-y-2">
                          {['Cross-Program Invocation', 'Centralized Program Interface', 'Compiled Program Index'].map((option, i) => (
                            <label key={i} className="flex items-center space-x-3 p-3 bg-white rounded-lg border cursor-pointer hover:bg-gray-50">
                              <input type="radio" name="q1" className="text-primary-600" />
                              <span>{option}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={handleQuizSubmit}
                      className="mt-6 w-full bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors"
                    >
                      Submit Quiz
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="prose prose-lg text-gray-600 mb-6">
                      <p>
                        In this lesson, we'll explore the fundamental concepts of {currentLessonData?.title.toLowerCase()}. 
                        Understanding these principles is crucial for building robust Solana programs.
                      </p>
                      <p>
                        By the end of this lesson, you'll be able to:
                      </p>
                      <ul>
                        <li>Understand the core concepts</li>
                        <li>Apply best practices</li>
                        <li>Implement in your own projects</li>
                      </ul>
                    </div>

                    <div className="flex items-center justify-between pt-6 border-t">
                      <button
                        onClick={handlePrevious}
                        disabled={!hasPrevious}
                        className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Previous
                      </button>

                      <button
                        onClick={handleComplete}
                        className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                      >
                        Mark as Complete
                      </button>

                      <button
                        onClick={handleNext}
                        disabled={!hasNext}
                        className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Comments/Discussion */}
            <div className="mt-6 bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <MessageSquare className="w-5 h-5 mr-2" />
                Discussion
              </h3>
              <div className="text-gray-600 text-center py-8">
                Join the discussion to ask questions and connect with other learners.
              </div>
            </div>
          </div>

          {/* Course Curriculum */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md sticky top-36">
              <div className="p-4 border-b">
                <h3 className="font-semibold text-gray-900">Course Curriculum</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {course.modules.reduce((acc, m) => acc + m.lessons.length, 0)} lessons • {course.modules.reduce((acc, m) => acc + parseInt(m.duration), 0)} mins
                </p>
              </div>

              <div className="max-h-[calc(100vh-250px)] overflow-y-auto">
                {course.modules.map((module) => (
                  <div key={module.id} className="border-b last:border-b-0">
                    <button
                      onClick={() => setExpandedModule(expandedModule === module.id ? null : module.id)}
                      className="w-full p-4 text-left hover:bg-gray-50 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-medium text-gray-900 text-sm">
                          Module {module.id}: {module.title}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {module.lessons.length} lessons • {module.duration}
                        </div>
                      </div>
                      {module.completed ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <Circle className="w-5 h-5 text-gray-300" />
                      )}
                    </button>

                    {expandedModule === module.id && (
                      <div className="bg-gray-50">
                        {module.lessons.map((lesson) => (
                          <button
                            key={lesson.id}
                            onClick={() => setCurrentLesson(lesson.id)}
                            className={`w-full p-3 pl-8 text-left flex items-center space-x-3 hover:bg-gray-100 transition-colors ${
                              currentLesson === lesson.id ? 'bg-primary-50' : ''
                            }`}
                          >
                            {lesson.completed ? (
                              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                            ) : (
                              <Circle className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className={`text-sm truncate ${
                                currentLesson === lesson.id ? 'text-primary-600 font-medium' : 'text-gray-700'
                              }`}>
                                {lesson.type === 'quiz' ? '📝 ' : '📹 '}{lesson.title}
                              </div>
                              <div className="text-xs text-gray-500">
                                {lesson.duration}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
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