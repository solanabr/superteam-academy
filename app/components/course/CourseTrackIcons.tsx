/**
 * CourseTrackIcons — Custom SVG icon components for each learning track.
 * Reusable across the courses page. Each icon accepts standard SVG props.
 */
'use client';

interface TrackIconProps {
    className?: string;
    size?: number;
}

export function AnchorIcon({ className = '', size = 32 }: TrackIconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
            {/* Solana-style 3 parallelogram bars */}
            <path d="M6 10H22L26 6H10L6 10Z" fill="currentColor" opacity="0.25" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M6 18.5H22L26 14.5H10L6 18.5Z" fill="currentColor" opacity="0.45" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M6 27H22L26 23H10L6 27Z" fill="currentColor" opacity="0.7" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
    );
}

export function DefiIcon({ className = '', size = 32 }: TrackIconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
            <path d="M16 4L28 10V22L16 28L4 22V10L16 4Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <path d="M16 4V16" stroke="currentColor" strokeWidth="2" />
            <path d="M16 16L28 10" stroke="currentColor" strokeWidth="2" />
            <path d="M16 16L4 10" stroke="currentColor" strokeWidth="2" />
            <circle cx="16" cy="16" r="3" fill="currentColor" opacity="0.3" />
        </svg>
    );
}

export function MobileIcon({ className = '', size = 32 }: TrackIconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
            <rect x="9" y="3" width="14" height="26" rx="3" stroke="currentColor" strokeWidth="2" />
            <path d="M9 7H23" stroke="currentColor" strokeWidth="2" />
            <path d="M9 25H23" stroke="currentColor" strokeWidth="2" />
            <circle cx="16" cy="27.5" r="1" fill="currentColor" />
            <rect x="13" y="11" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
            <path d="M16 19V21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
        </svg>
    );
}

export function NftIcon({ className = '', size = 32 }: TrackIconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
            <rect x="4" y="4" width="24" height="24" rx="4" stroke="currentColor" strokeWidth="2" />
            <path d="M4 22L10 16L14 20L20 12L28 20" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
            <circle cx="11" cy="11" r="2.5" stroke="currentColor" strokeWidth="1.5" />
        </svg>
    );
}

export function GamingIcon({ className = '', size = 32 }: TrackIconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
            <path d="M6 12C6 9.79086 7.79086 8 10 8H22C24.2091 8 26 9.79086 26 12V18C26 22.4183 22.4183 26 18 26H14C9.58172 26 6 22.4183 6 18V12Z" stroke="currentColor" strokeWidth="2" />
            <path d="M10 14H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M12 12V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <circle cx="20" cy="13" r="1.5" fill="currentColor" />
            <circle cx="22" cy="16" r="1.5" fill="currentColor" />
        </svg>
    );
}

export function SecurityIcon({ className = '', size = 32 }: TrackIconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
            <path d="M16 3L27 8V15C27 21.6274 22.1274 27.2 16 29C9.87258 27.2 5 21.6274 5 15V8L16 3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <path d="M12 16L15 19L21 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

export function FullStackIcon({ className = '', size = 32 }: TrackIconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
            <path d="M6 8L16 4L26 8" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <path d="M6 12L16 16L26 12" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <path d="M6 8V12" stroke="currentColor" strokeWidth="2" />
            <path d="M26 8V12" stroke="currentColor" strokeWidth="2" />
            <path d="M6 16L16 20L26 16" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <path d="M6 12V16" stroke="currentColor" strokeWidth="2" />
            <path d="M26 12V16" stroke="currentColor" strokeWidth="2" />
            <path d="M6 20L16 24L26 20" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <path d="M6 16V20" stroke="currentColor" strokeWidth="2" />
            <path d="M26 16V20" stroke="currentColor" strokeWidth="2" />
            <path d="M16 16V24" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
        </svg>
    );
}

export function TokenIcon({ className = '', size = 32 }: TrackIconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
            <circle cx="16" cy="16" r="11" stroke="currentColor" strokeWidth="2" />
            <circle cx="16" cy="16" r="7" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
            <path d="M16 10V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M12.5 13.5H18C19.1046 13.5 20 14.3954 20 15.5C20 16.6046 19.1046 17.5 18 17.5H13C11.8954 17.5 11 18.3954 11 19.5C11 20.6046 11.8954 21.5 13 21.5H19.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    );
}

export function BlinksIcon({ className = '', size = 32 }: TrackIconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
            <path d="M18 4L8 18H16L14 28L24 14H16L18 4Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <path d="M13 18H16L14 28L24 14H16" fill="currentColor" opacity="0.15" />
        </svg>
    );
}

export function InfraIcon({ className = '', size = 32 }: TrackIconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
            <rect x="6" y="5" width="20" height="8" rx="2" stroke="currentColor" strokeWidth="2" />
            <rect x="6" y="19" width="20" height="8" rx="2" stroke="currentColor" strokeWidth="2" />
            <circle cx="10" cy="9" r="1.5" fill="currentColor" />
            <circle cx="10" cy="23" r="1.5" fill="currentColor" />
            <path d="M22 8H22.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M22 22H22.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M16 13V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}

/** Default fallback icon for unknown tracks */
export function DefaultTrackIcon({ className = '', size = 32 }: TrackIconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
            <circle cx="16" cy="16" r="11" stroke="currentColor" strokeWidth="2" />
            <path d="M13 13C13 11.3431 14.3431 10 16 10C17.6569 10 19 11.3431 19 13C19 14.6569 17.6569 16 16 16V18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <circle cx="16" cy="22" r="1" fill="currentColor" />
        </svg>
    );
}

/** Map track ID to its SVG icon component */
const TRACK_ICON_MAP: Record<number, React.ComponentType<TrackIconProps>> = {
    1: AnchorIcon,
    2: DefiIcon,
    3: MobileIcon,
    4: NftIcon,
    5: GamingIcon,
    6: SecurityIcon,
    7: FullStackIcon,
    8: TokenIcon,
    9: BlinksIcon,
    10: InfraIcon,
};

export function getTrackIconComponent(trackId: number): React.ComponentType<TrackIconProps> {
    return TRACK_ICON_MAP[trackId] ?? DefaultTrackIcon;
}
