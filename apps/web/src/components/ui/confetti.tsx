'use client';

import { useState, useEffect } from 'react';
import ReactConfetti from 'react-confetti';

interface ConfettiCelebrationProps {
  show: boolean;
}

export function ConfettiCelebration({ show }: ConfettiCelebrationProps) {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    setDimensions({ width: window.innerWidth, height: window.innerHeight });
  }, []);

  if (!show) return null;

  return (
    <ReactConfetti
      width={dimensions.width}
      height={dimensions.height}
      recycle={false}
      numberOfPieces={300}
      gravity={0.3}
      colors={['#9945FF', '#14F195', '#FFD700', '#00D4FF', '#FF6B6B']}
      style={{ position: 'fixed', top: 0, left: 0, zIndex: 100 }}
    />
  );
}
