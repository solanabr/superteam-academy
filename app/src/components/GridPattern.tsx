"use client";

import { useEffect, useRef } from "react";

export function GridPattern() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let mouseX = -1000;
    let mouseY = -1000;
    let targetMouseX = -1000;
    let targetMouseY = -1000;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener("resize", resize);

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = e.clientX;
      targetMouseY = e.clientY;
    };

    window.addEventListener("mousemove", handleMouseMove);

    let animationId: number;
    const gridSize = 60;
    const maxDistance = 240; // Only draw when mouse is close

    const draw = () => {
      // Smooth mouse following
      const dx = targetMouseX - mouseX;
      const dy = targetMouseY - mouseY;

      // Stop animation loop if mouse isn't moving and is far away
      if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1 && (mouseX < -100 || mouseX > canvas.width + 100)) {
        animationId = requestAnimationFrame(draw);
        return;
      }

      mouseX += dx * 0.1;
      mouseY += dy * 0.1;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Determine the grid area to render based on mouse position
      // We only loop through points near the mouse
      const startX = Math.floor((mouseX - maxDistance) / gridSize) * gridSize;
      const endX = Math.ceil((mouseX + maxDistance) / gridSize) * gridSize;
      const startY = Math.floor((mouseY - maxDistance) / gridSize) * gridSize;
      const endY = Math.ceil((mouseY + maxDistance) / gridSize) * gridSize;

      for (let x = startX; x <= endX; x += gridSize) {
        for (let y = startY; y <= endY; y += gridSize) {
          // Off-screen check
          if (x < 0 || x > canvas.width || y < 0 || y > canvas.height) continue;

          const distX = x - mouseX;
          const distY = y - mouseY;
          const distance = Math.sqrt(distX * distX + distY * distY);

          if (distance < maxDistance) {
            const factor = 1 - distance / maxDistance;
            // Easing for smoother falloff
            const ease = factor * factor;

            const opacity = 0.1 + ease * 0.3; // Highlight opacity
            const size = 1 + ease * 1.5;

            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
            ctx.fill();
          }
        }
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[1]">
      {/* Static grid background using CSS for performance */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.05) 1px, transparent 0)`,
          backgroundSize: '60px 60px',
          backgroundPosition: '0 0'
        }}
      />
      {/* Dynamic heavy glow only near mouse */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
      />
    </div>
  );
}
