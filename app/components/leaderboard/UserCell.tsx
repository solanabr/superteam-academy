/**
 * UserCell — Avatar + name/username/wallet display for leaderboard rows.
 * Shows @username below the display name.
 * Tailwind-only styling with design-system fonts.
 */
import type { LeaderboardEntry } from '@/context/types/leaderboard';

function formatWalletAddress(address: string): string {
    if (address.length <= 8) return address;
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

interface UserCellProps {
    entry: LeaderboardEntry;
    /** Show larger avatar for podium display */
    large?: boolean;
    /** Force dark text for pastel podium cards (ignores dark mode) */
    podium?: boolean;
}

export function UserCell({ entry, large = false, podium = false }: UserCellProps) {
    const hasWallet = entry.wallet && entry.wallet.length > 0;
    const displayName = entry.name || (hasWallet ? formatWalletAddress(entry.wallet) : 'Anonymous');
    const initials = displayName.slice(0, 2).toUpperCase();

    const avatarSize = large ? 'w-12 h-12' : 'w-9 h-9';
    const nameSize = large ? 'text-sm sm:text-base' : 'text-sm';

    const nameColor = podium ? 'style="color:#1b231d"' : '';
    const subColor = podium ? '#3a4a3e' : undefined;
    const borderClass = podium
        ? `${avatarSize} rounded-full object-cover border-2 border-white shadow-sm`
        : `${avatarSize} rounded-full object-cover border-2 border-white dark:border-zinc-700 shadow-sm`;
    const fallbackBorderClass = podium
        ? `${avatarSize} rounded-full flex items-center justify-center text-xs font-bold border-2 border-white shadow-sm`
        : `${avatarSize} rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-secondary-foreground border-2 border-white dark:border-zinc-700 shadow-sm`;

    return (
        <div className="flex items-center gap-3 min-w-0">
            {/* Avatar */}
            <div className="shrink-0" aria-hidden="true">
                {entry.avatar ? (
                    <img
                        src={entry.avatar}
                        alt=""
                        width={large ? 48 : 36}
                        height={large ? 48 : 36}
                        className={borderClass}
                    />
                ) : (
                    <div
                        className={fallbackBorderClass}
                        style={podium ? { backgroundColor: '#c0b0e0', color: '#1b231d' } : undefined}
                    >
                        {initials}
                    </div>
                )}
            </div>

            {/* Name + @username + wallet */}
            <div className="flex flex-col min-w-0">
                <span
                    className={`${nameSize} font-semibold font-supreme truncate ${podium ? '' : 'text-foreground'}`}
                    style={podium ? { color: '#1b231d' } : undefined}
                >
                    {displayName}
                </span>
                {entry.username && (
                    <span
                        className={`text-[11px] font-supreme truncate ${podium ? '' : 'text-muted-foreground'}`}
                        style={podium ? { color: '#3a4a3e' } : undefined}
                    >
                        @{entry.username}
                    </span>
                )}
                {entry.name && hasWallet && (
                    <span
                        className={`text-[11px] font-mono truncate ${podium ? '' : 'text-muted-foreground'}`}
                        style={podium ? { color: '#3a4a3e' } : undefined}
                    >
                        {formatWalletAddress(entry.wallet)}
                    </span>
                )}
            </div>
        </div>
    );
}
