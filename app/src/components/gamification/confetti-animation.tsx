'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ConfettiAnimationProps {
  trigger: boolean;
}

interface Particle {
  id: number;
  x: number;
  delay: number;
  duration: number;
  color: string;
  size: number;
  rotation: number;
  shape: 'square' | 'circle' | 'strip';
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PARTICLE_COUNT = 50;
const ANIMATION_DURATION_MS = 3000;

const COLORS = [
  '#FFD700', // gold
  '#FF6B6B', // coral
  '#4ECDC4', // teal
  '#45B7D1', // sky
  '#96CEB4', // mint
  '#FFEAA7', // cream
  '#DDA0DD', // plum
  '#98D8C8', // seafoam
  '#FF8A5C', // peach
  '#A8E6CF', // sage
];

const SHAPES: Particle['shape'][] = ['square', 'circle', 'strip'];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateParticles(): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.8,
    duration: 1.5 + Math.random() * 1.5,
    color: COLORS[Math.floor(Math.random() * COLORS.length)]!,
    size: 4 + Math.random() * 8,
    rotation: Math.random() * 360,
    shape: SHAPES[Math.floor(Math.random() * SHAPES.length)]!,
  }));
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ConfettiAnimation({ trigger }: ConfettiAnimationProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!trigger) return;

    setParticles(generateParticles());
    setVisible(true);

    const timer = setTimeout(() => {
      setVisible(false);
      setParticles([]);
    }, ANIMATION_DURATION_MS);

    return () => clearTimeout(timer);
  }, [trigger]);

  if (!visible || particles.length === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden"
    >
      {particles.map((p) => (
        <span
          key={p.id}
          className={cn(
            'absolute top-0 animate-confetti-fall',
            p.shape === 'circle' && 'rounded-full',
            p.shape === 'strip' && 'rounded-sm',
          )}
          style={{
            left: `${p.x}%`,
            width: p.shape === 'strip' ? p.size * 0.4 : p.size,
            height: p.shape === 'strip' ? p.size * 1.8 : p.size,
            backgroundColor: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            transform: `rotate(${p.rotation}deg)`,
          }}
        />
      ))}

      {/* Inline keyframes — avoids needing tailwind config changes */}
      <style>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(-10vh) rotate(0deg) scale(1);
            opacity: 1;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translateY(110vh) rotate(720deg) scale(0.3);
            opacity: 0;
          }
        }
        .animate-confetti-fall {
          animation-name: confetti-fall;
          animation-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94);
          animation-fill-mode: forwards;
        }
      `}</style>
    </div>
  );
}
