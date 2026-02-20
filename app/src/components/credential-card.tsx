// app/src/components/credential-card.tsx
"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";

interface CredentialCardProps {
  name: string;
  imageUrl: string;
  level: number;
}

export function CredentialCard({ name, imageUrl, level }: CredentialCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const { left, top, width, height } = cardRef.current.getBoundingClientRect();
    const x = e.clientX - left - width / 2;
    const y = e.clientY - top - height / 2;

    const rotateX = -(y / height) * 20; // Угол наклона
    const rotateY = (x / width) * 20;

    setRotate({ x: rotateX, y: rotateY });
  };

  const onMouseLeave = () => {
    setRotate({ x: 0, y: 0 });
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={{
        perspective: "1000px",
      }}
      className="w-full h-full"
    >
      <motion.div
        style={{
          transformStyle: "preserve-3d",
          transform: `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="w-full h-full"
      >
        <Card className="w-full h-full overflow-hidden bg-gradient-to-br from-purple-900/50 to-pink-900/50 relative">
          <motion.img 
            src={imageUrl} 
            alt={name} 
            className="w-full h-full object-cover"
            style={{ transform: "translateZ(50px)" }} // Эффект глубины
          />
          <div 
            className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" 
            style={{ transform: "translateZ(51px)" }} 
          />
          <CardContent 
            className="absolute bottom-0 left-0 p-4 text-white"
            style={{ transform: "translateZ(52px)" }}
          >
            <h3 className="text-xl font-bold">{name}</h3>
            <p className="text-sm">Level {level}</p>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}