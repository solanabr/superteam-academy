"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Mic,
    MicOff,
    Video as VideoIcon,
    VideoOff,
    PhoneOff,
    Monitor,
    Settings,
    Signal,
    ShieldCheck,
    Maximize2,
    Zap,
    Users
} from "lucide-react";

interface VideoCallModalProps {
    isOpen: boolean;
    onClose: () => void;
    courseTitle: string;
    instructorName: string;
}

export default function VideoCallModal({ isOpen, onClose, courseTitle, instructorName }: VideoCallModalProps) {
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [callTime, setCallTime] = useState(0);
    const [signalStrength, setSignalStrength] = useState(4);

    // Call timer simulation
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (isOpen) {
            timer = setInterval(() => {
                setCallTime(prev => prev + 1);
            }, 1000);

            // Random signal fluctuation
            const signalTimer = setInterval(() => {
                setSignalStrength(Math.floor(Math.random() * 2) + 3); // 3 or 4
            }, 5000);

            return () => {
                clearInterval(timer);
                clearInterval(signalTimer);
            };
        }
    }, [isOpen]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] bg-[#050810] flex flex-col font-mono"
            >
                {/* ── Main Feed ── */}
                <div className="flex-1 relative bg-black/40 overflow-hidden">
                    {/* Simulated Background (Abstract Grid/Particles) */}
                    <div className="absolute inset-0 opacity-20">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,255,163,0.1)_0%,transparent_70%)]" />
                        <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                    </div>

                    {/* Instructor Feed Placeholder */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="relative group">
                            <motion.div
                                animate={{ scale: [1, 1.02, 1] }}
                                transition={{ duration: 4, repeat: Infinity }}
                                className="w-48 h-48 border border-neon-green/20 bg-neon-green/5 flex items-center justify-center"
                            >
                                <Zap className="w-16 h-16 text-neon-green/30" />
                            </motion.div>
                            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-center">
                                <span className="text-xs font-black text-white uppercase tracking-[0.2em]">{instructorName}</span>
                                <span className="block text-[8px] text-neon-green/60 uppercase mt-1">STREAM_ACTIVE_ENCRYPTED</span>
                            </div>
                        </div>
                    </div>

                    {/* ── HUD Overlays ── */}
                    <div className="absolute inset-6 pointer-events-none flex flex-col justify-between">
                        {/* Top HUD */}
                        <div className="flex items-start justify-between">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 bg-black/60 border border-white/10 px-4 py-2">
                                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                    <span className="text-xs font-black text-white">{formatTime(callTime)}</span>
                                    <div className="w-px h-3 bg-white/20" />
                                    <span className="text-[10px] text-zinc-500 uppercase tracking-widest">{courseTitle}</span>
                                </div>
                                <div className="flex items-center gap-2 text-neon-cyan/60 text-[9px] uppercase font-bold px-1">
                                    <ShieldCheck className="w-3 h-3" /> P2P_ENCRYPTION_BYPASS_VERIFIED
                                </div>
                            </div>

                            <div className="flex flex-col items-end gap-3">
                                <div className="flex items-center gap-2 bg-black/60 border border-white/10 px-3 py-1.5">
                                    <Signal className={`w-3.5 h-3.5 ${signalStrength > 2 ? 'text-neon-green' : 'text-amber-500'}`} />
                                    <span className="text-[10px] text-white">LATENCY: 24MS</span>
                                </div>
                                <button className="pointer-events-auto w-8 h-8 flex items-center justify-center bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:border-neon-cyan transition-all">
                                    <Maximize2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Bottom Left HUD (Self View) */}
                        <div className="flex items-end justify-between">
                            <div className="w-48 h-32 border border-white/20 bg-black/80 relative overflow-hidden pointer-events-auto">
                                {isVideoOff ? (
                                    <div className="absolute inset-0 flex items-center justify-center bg-[#0a0f1a]">
                                        <div className="text-center">
                                            <VideoOff className="w-6 h-6 text-zinc-700 mx-auto" />
                                            <span className="text-[8px] text-zinc-600 block mt-2 uppercase tracking-widest">CAMERA_OFF</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="absolute inset-0 bg-neon-cyan/5">
                                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(0,183,255,0.1)_0%,transparent_70%)]" />
                                        <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
                                            <Users className="w-3 h-3 text-neon-cyan" />
                                            <span className="text-[8px] font-bold text-white uppercase tracking-widest">SQUAD_MEMBER (YOU)</span>
                                        </div>
                                    </div>
                                )}
                                <div className="absolute top-2 right-2 flex items-center gap-1">
                                    {isMuted && <MicOff className="w-3 h-3 text-red-500" />}
                                </div>
                                {/* Corner brackets */}
                                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/40" />
                                <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/40" />
                            </div>

                            <div className="flex flex-col items-end gap-2 text-[8px] text-zinc-500 font-bold uppercase tracking-[0.2em]">
                                <div>RESOLUTION: 2560 X 1440</div>
                                <div>BITRATE: 4.8 MBPS</div>
                                <div>CODEC: H.265 / SOLANA_LINK</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Controls Bar ── */}
                <div className="h-24 bg-[#0a0f1a] border-t border-white/5 flex items-center justify-center relative">
                    {/* Decorative elements */}
                    <div className="absolute left-0 top-0 w-full h-px bg-gradient-to-r from-transparent via-neon-cyan/20 to-transparent" />

                    <div className="flex items-center gap-6 px-10">
                        <div className="flex items-center gap-4">
                            <ControlBtn
                                active={!isMuted}
                                onClick={() => setIsMuted(!isMuted)}
                                icon={isMuted ? MicOff : Mic}
                                label={isMuted ? "UNMUTE" : "MUTE"}
                            />
                            <ControlBtn
                                active={!isVideoOff}
                                onClick={() => setIsVideoOff(!isVideoOff)}
                                icon={isVideoOff ? VideoOff : VideoIcon}
                                label={isVideoOff ? "START_VIDEO" : "STOP_VIDEO"}
                            />
                        </div>

                        <div className="w-px h-10 bg-white/5" />

                        <div className="flex items-center gap-4">
                            <ControlBtn
                                active={false}
                                onClick={() => { }}
                                icon={Monitor}
                                label="SHARE_SCREEN"
                            />
                            <ControlBtn
                                active={false}
                                onClick={() => { }}
                                icon={Settings}
                                label="PROTOCOL"
                            />
                        </div>

                        <div className="w-px h-10 bg-white/5" />

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onClose}
                            className="w-14 h-14 rounded-full bg-red-500 flex items-center justify-center text-white hover:bg-red-600 shadow-[0_0_20px_rgba(239,68,68,0.3)] transition-all"
                        >
                            <PhoneOff className="w-6 h-6" />
                        </motion.button>
                    </div>

                    <div className="absolute right-8 flex items-center gap-3">
                        <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest">Connection Stable</span>
                        <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className={`w-1 h-3 rounded-full ${i <= signalStrength ? 'bg-neon-green' : 'bg-white/5'}`} />
                            ))}
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

function ControlBtn({ active, onClick, icon: Icon, label }: any) {
    return (
        <div className="flex flex-col items-center gap-1.5">
            <button
                onClick={onClick}
                className={`w-12 h-12 flex items-center justify-center border transition-all ${active
                        ? "bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/30"
                        : "bg-red-500/10 border-red-500/30 text-red-500 hover:bg-red-500/20"
                    }`}
            >
                <Icon className="w-5 h-5" />
            </button>
            <span className={`text-[8px] font-black tracking-widest ${active ? "text-zinc-500" : "text-red-500/70"}`}>{label}</span>
        </div>
    );
}
