'use client';

import dynamic from 'next/dynamic';

const EnrollButton = dynamic(() => import('@/components/EnrollButton'), { ssr: false });

interface EnrollButtonWrapperProps {
  courseId: string;
  lessonPath: string;
  startText: string;
  enrollingText: string;
  enrolledText: string;
  connectText: string;
  viewTxText: string;
}

export default function EnrollButtonWrapper(props: EnrollButtonWrapperProps) {
  return <EnrollButton {...props} />;
}
