'use client';

import { ContentService, Course } from '@/lib/content';
import { CourseCard } from '@/components/course/CourseCard';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/routing';
import { Input } from '@/components/ui/input';
import { Search, Filter, BookOpen } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/ui/empty-states';
import { motion, AnimatePresence } from 'framer-motion';

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/courses')
      .then(res => res.json())
      .then(data => {
          setCourses(data.courses);
          setFilteredCourses(data.courses);
          setLoading(false);
      })
      .catch(err => {
          console.error(err);
          setLoading(false);
      });
  }, []);

  useEffect(() => {
    let result = courses;

    // Filter by Search
    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        result = result.filter(c => 
            c.title.toLowerCase().includes(query) || 
            c.description.toLowerCase().includes(query) ||
            c.tags?.some(tag => tag.toLowerCase().includes(query))
        );
    }

    // Filter by Difficulty
    if (selectedDifficulty !== 'all') {
        result = result.filter(c => c.difficulty && c.difficulty.toLowerCase() === selectedDifficulty.toLowerCase());
    }

    setFilteredCourses(result);
  }, [searchQuery, selectedDifficulty, courses]);

  return (
    <div className="container mx-auto py-12 px-4 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
            <h1 className="text-4xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-[#9945FF] to-[#14F195]">
                Explore Courses
            </h1>
            <p className="text-gray-400 max-w-xl">
                Master Solana development with our curated learning paths. Earn XP and credentials as you build real projects.
            </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <div className="relative w-full sm:w-[300px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input 
                    placeholder="Search courses..." 
                    className="pl-10 bg-[#0A0A0F] border-[#2E2E36] focus:border-[#9945FF] transition-colors"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <Tabs defaultValue="all" className="mb-8" onValueChange={setSelectedDifficulty}>
        <TabsList className="bg-[#1E1E24] border border-[#2E2E36]">
            <TabsTrigger value="all">All Levels</TabsTrigger>
            <TabsTrigger value="beginner">Beginner</TabsTrigger>
            <TabsTrigger value="intermediate">Intermediate</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Course Grid */}
      {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                  <div key={i} className="h-[350px] rounded-xl bg-[#1E1E24]/50 animate-pulse" />
              ))}
          </div>
      ) : filteredCourses.length > 0 ? (
          <motion.div 
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence>
                {filteredCourses.map((course, index) => (
                <motion.div
                    layout
                    key={course.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                >
                    <CourseCard course={course} priority={index < 2} />
                </motion.div>
                ))}
            </AnimatePresence>
          </motion.div>
      ) : (
          <EmptyState 
            icon={Search}
            title="No courses found"
            description={`We couldn't find any courses matching "${searchQuery}" or the selected filters.`}
            actionLabel="Clear Filters"
            action={() => { setSearchQuery(''); setSelectedDifficulty('all'); }}
          />
      )}
    </div>
  );
}
