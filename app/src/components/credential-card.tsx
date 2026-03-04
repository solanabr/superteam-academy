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

    setRotate({
      x: -(y / height) * 16,
      y: (x / width) * 16,
    });
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={onMouseMove}
      onMouseLeave={() => setRotate({ x: 0, y: 0 })}
      whileHover={{ scale: 1.02 }}
      className="relative aspect-[3/4] w-full"
      style={{ perspective: "1200px" }}
    >
      <motion.div
        animate={{ rotateX: rotate.x, rotateY: rotate.y }}
        transition={{ type: "spring", stiffness: 280, damping: 22 }}
        className="h-full w-full rounded-xl"
        style={{ transformStyle: "preserve-3d" }}
      >
        <Card className="relative h-full w-full overflow-hidden rounded-xl border border-white/20 bg-gradient-to-br from-purple-900/60 via-fuchsia-900/40 to-cyan-900/50 shadow-[0_15px_50px_rgba(168,85,247,0.35)]">
          <motion.img src={imageUrl} alt={name} className="h-full w-full object-cover" style={{ transform: "translateZ(40px) scale(1.02)" }} />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" style={{ transform: "translateZ(45px)" }} />
          <CardContent className="pointer-events-none absolute bottom-0 left-0 p-6 text-white" style={{ transform: "translateZ(50px)" }}>
            <h3 className="mb-1 text-xl font-bold leading-tight">{name}</h3>
            <p className="text-sm text-purple-200">Level {level}</p>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
