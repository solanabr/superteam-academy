"use client";

import { cn } from "@/lib/utils";
import React from "react";
import Image from "next/image";

export type MarqueeImage = {
  src: string;
  caption?: string;
};

export function ThreeDMarquee({
  images,
  className,
}: {
  images: MarqueeImage[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex h-[600px] w-full flex-col items-center justify-center overflow-hidden",
        className
      )}
      style={{ perspective: "1000px" }}
    >
      <div
        className="flex w-[200vw] flex-col gap-6"
        style={{
          transform: "rotateX(25deg) rotateZ(-10deg) rotateY(15deg) scale(1.3)",
          transformStyle: "preserve-3d",
        }}
      >
        {/* Track 1 */}
        <div className="flex w-max animate-marquee-fast gap-6 hover:[animation-play-state:paused]">
          {images.concat(images, images).map((img, idx) => (
            <div
              key={`row1-${idx}`}
              className="group relative h-[240px] w-[360px] shrink-0 overflow-hidden rounded-[24px] bg-white/5 border border-white/10 backdrop-blur-md transition-all duration-500 hover:scale-[1.03] hover:z-10 shadow-2xl"
            >
              <Image
                src={img.src}
                alt={img.caption || `marquee-image-${idx}`}
                fill
                className="object-cover opacity-70 group-hover:opacity-100 transition-opacity duration-500"
              />
              {img.caption && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-5 pt-12 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                  <p className="text-white text-[14px] font-medium leading-snug">
                    {img.caption}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
        {/* Track 2 */}
        <div className="flex w-max animate-marquee-reverse gap-6 -ml-[200px] hover:[animation-play-state:paused]">
          {images.concat(images, images).reverse().map((img, idx) => (
            <div
              key={`row2-${idx}`}
              className="group relative h-[240px] w-[360px] shrink-0 overflow-hidden rounded-[24px] bg-white/5 border border-white/10 backdrop-blur-md transition-all duration-500 hover:scale-[1.03] hover:z-10 shadow-2xl"
            >
              <Image
                src={img.src}
                alt={img.caption || `marquee-image-rev-${idx}`}
                fill
                className="object-cover opacity-70 group-hover:opacity-100 transition-opacity duration-500"
              />
              {img.caption && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-5 pt-12 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                  <p className="text-white text-[14px] font-medium leading-snug">
                    {img.caption}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Gradients to fade out edges */}
      <div className="absolute inset-y-0 left-0 w-[20%] bg-gradient-to-r from-black to-transparent pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-[20%] bg-gradient-to-l from-black to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-[20%] bg-gradient-to-b from-black to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-[20%] bg-gradient-to-t from-black to-transparent pointer-events-none" />
    </div>
  );
}
