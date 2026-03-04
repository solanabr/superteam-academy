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
    // Внешний контейнер строго по размеру
    <div className="relative w-full aspect-[3/4]" ref={cardRef} onMouseMove={onMouseMove} onMouseLeave={onMouseLeave}>
        <motion.div
          style={{
            perspective: "1000px",
            width: "100%",
            height: "100%"
          }}
        >
          <motion.div
            style={{
              transformStyle: "preserve-3d",
              transform: `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`,
              width: "100%",
              height: "100%"
            }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            // Убрали onClick отсюда
            className="rounded-xl shadow-xl" 
          >
            <Card className="w-full h-full overflow-hidden bg-gradient-to-br from-purple-900/50 to-pink-900/50 relative border-0">
              <motion.img 
                src={imageUrl} 
                alt={name} 
                className="w-full h-full object-cover pointer-events-none" // pointer-events-none чтобы картинка не мешала
                style={{ transform: "translateZ(50px)" }} 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" style={{ transform: "translateZ(51px)" }} />
              <CardContent className="absolute bottom-0 left-0 p-6 text-white pointer-events-none" style={{ transform: "translateZ(52px)" }}>
                <h3 className="text-xl font-bold leading-tight mb-1">{name}</h3>
                <p className="text-sm text-purple-200">Level {level}</p>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
    </div>
  );
}