'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, Clock, Zap } from 'lucide-react';

interface LearningPath {
  id: string;
  name: string;
  description: string;
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  courses: string[];
  duration: string;
  difficulty: string;
}

interface LearningPathRecommendationProps {
  learningPath: LearningPath;
  skillLevel: string;
  interests: string[];
}

const skillLevelColors = {
  beginner: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
  intermediate: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
  advanced: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100',
};

export function LearningPathRecommendation({
  learningPath,
  skillLevel,
  interests,
}: LearningPathRecommendationProps) {
  const colorClass =
    skillLevelColors[skillLevel as keyof typeof skillLevelColors] || skillLevelColors.beginner;

  return (
    <Card className="mx-auto w-full max-w-2xl">
      <CardHeader>
        <div className="mb-4 flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              Your Personalized Learning Path
            </CardTitle>
            <CardDescription>Based on your skill level and interests</CardDescription>
          </div>
          <Badge className={colorClass}>
            {skillLevel.charAt(0).toUpperCase() + skillLevel.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Path Info */}
        <div className="from-primary/10 to-primary/5 border-primary/20 rounded-lg border bg-gradient-to-r p-6">
          <h3 className="mb-2 text-xl font-semibold">{learningPath.name}</h3>
          <p className="text-muted-foreground mb-4">{learningPath.description}</p>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <div className="flex items-center gap-2">
              <Clock className="text-primary h-4 w-4" />
              <div>
                <p className="text-muted-foreground text-xs">Duration</p>
                <p className="text-sm font-semibold">{learningPath.duration}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="text-primary h-4 w-4" />
              <div>
                <p className="text-muted-foreground text-xs">Modules</p>
                <p className="text-sm font-semibold">{learningPath.courses.length}</p>
              </div>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Difficulty</p>
              <p className="text-sm font-semibold">{learningPath.difficulty}</p>
            </div>
          </div>
        </div>

        {/* Courses */}
        <div>
          <h4 className="mb-3 font-semibold">Courses Included:</h4>
          <div className="space-y-2">
            {learningPath.courses.map((course, idx) => (
              <div key={idx} className="flex items-start gap-3 rounded-lg border p-3">
                <div className="bg-primary/20 text-primary flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium capitalize">{course.replace(/-/g, ' ')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Interests */}
        {interests.length > 0 && (
          <div>
            <h4 className="mb-2 font-semibold">Your Interests</h4>
            <div className="flex flex-wrap gap-2">
              {interests.map((interest) => (
                <Badge key={interest} variant="secondary" className="capitalize">
                  {interest.replace(/_/g, ' ')}
                </Badge>
              ))}
            </div>
          </div>
        )}

      </CardContent>
    </Card>
  );
}
