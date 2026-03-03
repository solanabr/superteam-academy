/**
 * Resizable split layout for lesson view.
 * Left pane: lesson content. Right pane: code editor.
 */
'use client';

import { useState, useRef, useCallback, type ReactNode } from 'react';

interface SplitLayoutProps {
    left: ReactNode;
    right: ReactNode;
    defaultLeftWidth?: number;
    minLeftWidth?: number;
    maxLeftWidth?: number;
}

export function SplitLayout({
    left,
    right,
    defaultLeftWidth = 50,
    minLeftWidth = 30,
    maxLeftWidth = 70,
}: SplitLayoutProps) {
    const [leftWidth, setLeftWidth] = useState(defaultLeftWidth);
    const isDragging = useRef(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleMouseDown = useCallback(() => {
        isDragging.current = true;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    }, []);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!isDragging.current || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const pct = ((e.clientX - rect.left) / rect.width) * 100;
        setLeftWidth(Math.min(maxLeftWidth, Math.max(minLeftWidth, pct)));
    }, [minLeftWidth, maxLeftWidth]);

    const handleMouseUp = useCallback(() => {
        isDragging.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    }, []);

    return (
        <div
            ref={containerRef}
            className="split-layout"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            <div className="split-left" style={{ width: `${leftWidth}%` }}>
                {left}
            </div>

            <div
                className="split-divider"
                onMouseDown={handleMouseDown}
                role="separator"
                aria-orientation="vertical"
                tabIndex={0}
            />

            <div className="split-right" style={{ width: `${100 - leftWidth}%` }}>
                {right}
            </div>

            <style jsx>{`
                .split-layout {
                    display: flex;
                    height: 100%;
                    overflow: hidden;
                }
                .split-left {
                    overflow-y: auto;
                    overflow-x: hidden;
                }
                .split-right {
                    overflow-y: auto;
                    overflow-x: hidden;
                }
                .split-divider {
                    width: 6px;
                    flex-shrink: 0;
                    cursor: col-resize;
                    background: rgba(255, 255, 255, 0.04);
                    border-left: 1px solid rgba(255, 255, 255, 0.06);
                    border-right: 1px solid rgba(255, 255, 255, 0.06);
                    transition: background 0.15s;
                }
                .split-divider:hover {
                    background: rgba(153, 69, 255, 0.2);
                }
            `}</style>
        </div>
    );
}
