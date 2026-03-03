/**
 * AchievementUnlock — animated overlay when an achievement is unlocked.
 * Uses CSS animations instead of framer-motion to avoid extra dependency.
 */
'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import type { Achievement } from '@/context/types/achievement';

interface AchievementUnlockProps {
    achievement: Achievement;
    show: boolean;
    onClose: () => void;
}

export function AchievementUnlock({ achievement, show, onClose }: AchievementUnlockProps) {
    useEffect(() => {
        if (show) {
            const timer = setTimeout(onClose, 5000);
            return () => clearTimeout(timer);
        }
    }, [show, onClose]);

    if (!show) return null;

    return (
        <div className="ach-unlock-overlay" onClick={onClose}>
            <div className="ach-unlock-card" onClick={(e) => e.stopPropagation()}>
                {/* Confetti particles */}
                <div className="ach-confetti">
                    {Array.from({ length: 12 }).map((_, i) => (
                        <span key={i} className="ach-confetti-piece" style={{
                            left: `${10 + Math.random() * 80}%`,
                            animationDelay: `${Math.random() * 0.5}s`,
                            background: ['#7c3aed', '#a78bfa', '#fbbf24', '#34d399', '#f472b6'][i % 5],
                        }} />
                    ))}
                </div>

                <div className="ach-unlock-header">
                    ✨ Achievement Unlocked!
                </div>

                <div className="ach-unlock-icon">
                    {achievement.badge ? (
                        <Image
                            src={achievement.badge}
                            alt={achievement.name}
                            width={96}
                            height={96}
                        />
                    ) : (
                        achievement.icon
                    )}
                </div>

                <div className="ach-unlock-details">
                    <h3>{achievement.name}</h3>
                    <p>{achievement.description}</p>
                </div>

                <div className="ach-unlock-reward">
                    +{achievement.xpReward} XP
                </div>

                {achievement.txSignature && (
                    <a
                        href={`https://explorer.solana.com/tx/${achievement.txSignature}?cluster=devnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ach-unlock-tx"
                    >
                        ↗ View on Solana Explorer
                    </a>
                )}

                <button className="ach-unlock-btn" onClick={onClose}>
                    Awesome!
                </button>
            </div>

            <style jsx>{`
                .ach-unlock-overlay {
                    position: fixed;
                    inset: 0;
                    z-index: 9999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(0, 0, 0, 0.7);
                    backdrop-filter: blur(4px);
                    animation: fadeIn 0.3s ease;
                }
                .ach-unlock-card {
                    position: relative;
                    background: linear-gradient(135deg, #1e1b4b, #312e81);
                    border: 1px solid #4c1d95;
                    border-radius: 1.5rem;
                    padding: 2.5rem 2rem;
                    text-align: center;
                    max-width: 340px;
                    width: 90%;
                    overflow: hidden;
                    animation: popIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
                    box-shadow: 0 0 60px rgba(124, 58, 237, 0.3);
                }
                .ach-confetti {
                    position: absolute;
                    inset: 0;
                    pointer-events: none;
                    overflow: hidden;
                }
                .ach-confetti-piece {
                    position: absolute;
                    top: -10px;
                    width: 8px;
                    height: 8px;
                    border-radius: 2px;
                    animation: confettiFall 1.5s ease forwards;
                }
                .ach-unlock-header {
                    font-size: 0.85rem;
                    color: #a78bfa;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    margin-bottom: 1rem;
                }
                .ach-unlock-icon {
                    font-size: 4rem;
                    margin-bottom: 1rem;
                    animation: iconBounce 0.6s ease 0.3s both;
                }
                .ach-unlock-details h3 {
                    font-size: 1.4rem;
                    font-weight: 800;
                    color: #e2e8f0;
                    margin: 0 0 0.25rem;
                }
                .ach-unlock-details p {
                    font-size: 0.9rem;
                    color: #94a3b8;
                    margin: 0 0 1rem;
                }
                .ach-unlock-reward {
                    font-size: 1.1rem;
                    font-weight: 700;
                    color: #fbbf24;
                    margin-bottom: 1.25rem;
                }
                .ach-unlock-btn {
                    background: linear-gradient(135deg, #7c3aed, #6d28d9);
                    color: #fff;
                    border: none;
                    border-radius: 9999px;
                    padding: 0.6rem 2rem;
                    font-size: 0.95rem;
                    font-weight: 700;
                    cursor: pointer;
                    transition: transform 0.2s;
                }
                .ach-unlock-btn:hover {
                    transform: scale(1.05);
                }
                .ach-unlock-tx {
                    display: block;
                    font-size: 0.75rem;
                    color: #14f195;
                    text-decoration: none;
                    margin-bottom: 1rem;
                    transition: color 0.15s;
                }
                .ach-unlock-tx:hover {
                    color: #6ee7b7;
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes popIn {
                    from { transform: scale(0) rotate(-10deg); opacity: 0; }
                    to { transform: scale(1) rotate(0deg); opacity: 1; }
                }
                @keyframes iconBounce {
                    0% { transform: scale(0); }
                    60% { transform: scale(1.2); }
                    100% { transform: scale(1); }
                }
                @keyframes confettiFall {
                    0% { transform: translateY(0) rotate(0deg); opacity: 1; }
                    100% { transform: translateY(350px) rotate(720deg); opacity: 0; }
                }
            `}</style>
        </div>
    );
}
