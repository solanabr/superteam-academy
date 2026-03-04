"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

const TITLE_WORDS = ["Code.", "Learn.", "Ship."] as const;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
};

export function Hero() {
  const [displayText, setDisplayText] = useState("");
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  }, []);

  useEffect(() => {
    const currentWord = TITLE_WORDS[currentWordIndex];
    let timeout: NodeJS.Timeout;

    if (!isDeleting) {
      timeout = setTimeout(() => {
        if (displayText.length < currentWord.length) {
          setDisplayText(currentWord.slice(0, displayText.length + 1));
        } else {
          setTimeout(() => setIsDeleting(true), 1500);
        }
      }, 120);
    } else {
      timeout = setTimeout(() => {
        if (displayText.length > 0) {
          setDisplayText(displayText.slice(0, -1));
        } else {
          setIsDeleting(false);
          setCurrentWordIndex((prev) => (prev + 1) % TITLE_WORDS.length);
        }
      }, 60);
    }

    return () => clearTimeout(timeout);
  }, [displayText, currentWordIndex, isDeleting]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const toggleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      video.requestFullscreen();
    }
  };

  return (
    <section className="relative min-h-[90vh] flex flex-col justify-center pt-20 pb-16 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-neutral-50/50 via-transparent to-transparent dark:from-neutral-900/50 pointer-events-none" />

      {/* Animated background shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -top-40 -right-40 w-96 h-96 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"
        />
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 max-w-[1800px] mx-auto px-6 md:px-12 w-full"
      >
        {/* Main Title with Typing Effect */}
        <div className="mb-8">
          <motion.div
            variants={containerVariants}
            className="flex flex-wrap gap-x-4 md:gap-x-8 justify-center md:justify-start"
          >
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold tracking-tighter text-neutral-900 dark:text-white"
            >
              {displayText}
              <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
                className="inline-block w-1 h-[0.8em] ml-1 bg-neutral-900 dark:bg-white align-middle"
              />
            </motion.span>
          </motion.div>
        </div>

        {/* Subtitle */}
        <motion.p
          variants={itemVariants}
          className="text-lg md:text-xl text-neutral-600 dark:text-neutral-400 max-w-xl mb-10 font-medium"
        >
          Master Solana development with hands-on courses, earn on-chain credentials, and join a global community of builders.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div variants={itemVariants} className="flex flex-wrap gap-4 mb-20">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Link
              href="/auth/sign-up"
              className="inline-flex items-center px-8 py-4 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-full text-sm font-semibold hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all duration-300 shadow-xl shadow-neutral-900/10"
            >
              Start Building
              <svg
                className="ml-2 w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </Link>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Link
              href="/courses"
              className="inline-flex items-center px-8 py-4 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white rounded-full text-sm font-semibold hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all duration-300"
            >
              Explore Courses
            </Link>
          </motion.div>
        </motion.div>

        {/* Demo Video */}
        <motion.div
          variants={itemVariants}
          className="relative"
        >
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full rounded-2xl overflow-hidden shadow-2xl border border-neutral-200 dark:border-neutral-800 bg-black group"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <video
              ref={videoRef}
              className="w-full h-auto"
              autoPlay
              loop
              muted={isMuted}
              playsInline
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              poster={process.env.NEXT_PUBLIC_DEMO_POSTER_URL ?? "/demovideo-Cover.png"}
            >
              <source
                src={process.env.NEXT_PUBLIC_DEMO_VIDEO_URL ?? "/demo.mp4"}
                type="video/mp4"
              />
            </video>

            {/* Controls overlay */}
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/70 to-transparent flex items-end px-4 pb-4"
                >
                  <div className="flex items-center justify-between w-full">
                    {/* Left: Play + Mute */}
                    <div className="flex items-center gap-2">
                      {/* Play / Pause */}
                      <button
                        onClick={togglePlay}
                        className="w-9 h-9 flex items-center justify-center rounded-full bg-white/15 backdrop-blur-sm hover:bg-white/25 transition-colors text-white"
                        aria-label={isPlaying ? "Pause" : "Play"}
                      >
                        {isPlaying ? (
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7L8 5z" />
                          </svg>
                        )}
                      </button>

                      {/* Mute / Unmute */}
                      <button
                        onClick={toggleMute}
                        className="w-9 h-9 flex items-center justify-center rounded-full bg-white/15 backdrop-blur-sm hover:bg-white/25 transition-colors text-white"
                        aria-label={isMuted ? "Unmute" : "Mute"}
                      >
                        {isMuted ? (
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M16.5 12A4.5 4.5 0 0014 7.97v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0021 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06A8.99 8.99 0 0017.73 18L19 19.27 20.27 18 5.27 3 4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0014 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                          </svg>
                        )}
                      </button>
                    </div>

                    {/* Right: Fullscreen */}
                    <button
                      onClick={toggleFullscreen}
                      className="w-9 h-9 flex items-center justify-center rounded-full bg-white/15 backdrop-blur-sm hover:bg-white/25 transition-colors text-white"
                      aria-label="Fullscreen"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
                      </svg>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Glow effect */}
          <div className="absolute bg-black rounded-2xl blur-xl -z-10" />
        </motion.div>
      </motion.div>
    </section>
  );
}
