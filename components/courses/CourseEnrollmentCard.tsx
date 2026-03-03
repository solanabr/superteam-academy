import React from 'react';
import { useAnchorWallet } from '@solana/wallet-adapter-react';
import { useQueryClient } from '@tanstack/react-query';
import { useEnrollCourse, useCloseEnrollment } from '@/lib/hooks/useOnchain';
import { useLearnerEnrollments, useCourse, useCourseProgress } from '@/lib/hooks/useCourses';
import { useXpBalance, useCredentials } from '@/lib/hooks/useXp';
import { useXpMint } from '@/lib/hooks/useConfig';
import { Loading } from '@/components/ui/Loading';
import { Button } from '@/components/ui';

/**
 * Course Enrollment Card Component
 * Shows course info and enrollment actions
 */
export function CourseEnrollmentCard({ courseId }: { courseId: string }) {
  const wallet = useAnchorWallet();
  const queryClient = useQueryClient();
  const { data: course, isLoading: courseLoading } = useCourse(courseId);
  const { data: enrollment } = useCourseProgress(courseId, wallet?.publicKey);
  const { mutate: enroll, isPending: enrolling } = useEnrollCourse();
  const { mutate: closeEnrollment, isPending: closing } = useCloseEnrollment();

  if (courseLoading) {
    return <Loading />;
  }

  if (!course) {
    return <div>Course not found</div>;
  }

  const handleEnroll = () => {
    enroll(
      { courseId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['enrollment', courseId] });
          queryClient.invalidateQueries({ queryKey: ['enrollments'] });
        },
      }
    );
  };

  const handleClose = () => {
    closeEnrollment(
      { courseId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['enrollment', courseId] });
          queryClient.invalidateQueries({ queryKey: ['enrollments'] });
        },
      }
    );
  };

  return (
    <div className="border rounded-lg p-6 space-y-4">
      <div>
        <h3 className="text-xl font-bold">{course.courseId}</h3>
        <p className="text-sm text-gray-600">
          {course.lessonCount} lessons • {course.xpPerLesson} XP per lesson
        </p>
      </div>

      <div className="flex gap-2">
        {!enrollment ? (
          <Button
            onClick={handleEnroll}
            disabled={enrolling}
            variant="primary"
          >
            {enrolling ? 'Enrolling...' : 'Enroll Now'}
          </Button>
        ) : (
          <>
            <div className="flex-1">
              <p className="text-sm font-medium mb-1">Progress</p>
              <div className="bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{
                    width: `${Math.round(
                      (enrollment.completedLessons / course.lessonCount) * 100
                    )}%`,
                  }}
                />
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {enrollment?.completedLessons || 0}/{course.lessonCount} lessons
              </p>
            </div>

            <Button
              onClick={handleClose}
              disabled={closing}
              variant="secondary"
            >
              {closing ? 'Closing...' : 'Close'}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}


