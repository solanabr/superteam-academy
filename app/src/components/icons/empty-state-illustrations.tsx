/**
 * Lightweight SVG illustrations for empty states.
 * Each illustration uses currentColor with opacity variants
 * so they adapt to light/dark themes automatically.
 */

interface IllustrationProps {
  className?: string;
}

/** Empty bookshelf — used when no courses are found or enrolled. */
export function EmptyCoursesIllustration({ className }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 120 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Bookshelf */}
      <rect
        x="20"
        y="75"
        width="80"
        height="3"
        rx="1.5"
        fill="currentColor"
        opacity="0.15"
      />
      <rect
        x="20"
        y="50"
        width="80"
        height="3"
        rx="1.5"
        fill="currentColor"
        opacity="0.15"
      />
      {/* Shelf legs */}
      <rect
        x="22"
        y="50"
        width="3"
        height="28"
        rx="1"
        fill="currentColor"
        opacity="0.1"
      />
      <rect
        x="95"
        y="50"
        width="3"
        height="28"
        rx="1"
        fill="currentColor"
        opacity="0.1"
      />
      {/* Books on top shelf — tilted/sparse */}
      <rect
        x="30"
        y="35"
        width="8"
        height="15"
        rx="1"
        fill="currentColor"
        opacity="0.12"
        transform="rotate(-5 30 35)"
      />
      <rect
        x="42"
        y="37"
        width="7"
        height="13"
        rx="1"
        fill="currentColor"
        opacity="0.08"
        transform="rotate(3 42 37)"
      />
      {/* Empty shelf indicator — dotted line */}
      <line
        x1="35"
        y1="63"
        x2="85"
        y2="63"
        stroke="currentColor"
        strokeOpacity="0.12"
        strokeWidth="1.5"
        strokeDasharray="4 4"
      />
      {/* Magnifying glass */}
      <circle
        cx="72"
        cy="28"
        r="10"
        stroke="currentColor"
        strokeOpacity="0.2"
        strokeWidth="2"
        fill="none"
      />
      <line
        x1="79"
        y1="35"
        x2="86"
        y2="42"
        stroke="currentColor"
        strokeOpacity="0.2"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Question mark inside magnifying glass */}
      <text
        x="72"
        y="33"
        textAnchor="middle"
        fill="currentColor"
        opacity="0.15"
        fontSize="12"
        fontWeight="bold"
      >
        ?
      </text>
    </svg>
  );
}

/** Empty trophy case — used when no achievements/badges earned. */
export function EmptyAchievementsIllustration({
  className,
}: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 120 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Pedestal */}
      <rect
        x="35"
        y="72"
        width="50"
        height="6"
        rx="2"
        fill="currentColor"
        opacity="0.1"
      />
      <rect
        x="40"
        y="78"
        width="40"
        height="4"
        rx="1"
        fill="currentColor"
        opacity="0.08"
      />
      {/* Trophy outline (dashed) */}
      <path
        d="M48 40 C48 40 45 30 50 22 C52 19 56 17 60 17 C64 17 68 19 70 22 C75 30 72 40 72 40"
        stroke="currentColor"
        strokeOpacity="0.15"
        strokeWidth="2"
        strokeDasharray="3 3"
        fill="none"
      />
      {/* Trophy handles */}
      <path
        d="M48 30 C42 30 40 35 42 40 C44 44 48 42 48 40"
        stroke="currentColor"
        strokeOpacity="0.12"
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M72 30 C78 30 80 35 78 40 C76 44 72 42 72 40"
        stroke="currentColor"
        strokeOpacity="0.12"
        strokeWidth="1.5"
        fill="none"
      />
      {/* Trophy stem */}
      <rect
        x="57"
        y="40"
        width="6"
        height="14"
        rx="1"
        fill="currentColor"
        opacity="0.1"
      />
      <rect
        x="50"
        y="54"
        width="20"
        height="4"
        rx="2"
        fill="currentColor"
        opacity="0.1"
      />
      {/* Base */}
      <rect
        x="46"
        y="58"
        width="28"
        height="14"
        rx="3"
        fill="currentColor"
        opacity="0.08"
      />
      {/* Star outline */}
      <path
        d="M60 46 L61.5 49.5 L65 50 L62.5 52.5 L63 56 L60 54.5 L57 56 L57.5 52.5 L55 50 L58.5 49.5 Z"
        stroke="currentColor"
        strokeOpacity="0.15"
        strokeWidth="1"
        fill="none"
      />
    </svg>
  );
}

/** Empty radar/spider chart — used when no skills data. */
export function EmptySkillsIllustration({ className }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 120 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Outer hexagon (dashed) */}
      <polygon
        points="60,15 93,32.5 93,67.5 60,85 27,67.5 27,32.5"
        stroke="currentColor"
        strokeOpacity="0.12"
        strokeWidth="1.5"
        strokeDasharray="4 3"
        fill="none"
      />
      {/* Inner hexagon */}
      <polygon
        points="60,35 76.5,43.75 76.5,61.25 60,70 43.5,61.25 43.5,43.75"
        stroke="currentColor"
        strokeOpacity="0.08"
        strokeWidth="1"
        fill="none"
      />
      {/* Center dot */}
      <circle cx="60" cy="50" r="2.5" fill="currentColor" opacity="0.15" />
      {/* Axis lines */}
      <line
        x1="60"
        y1="50"
        x2="60"
        y2="15"
        stroke="currentColor"
        strokeOpacity="0.08"
        strokeWidth="1"
      />
      <line
        x1="60"
        y1="50"
        x2="93"
        y2="32.5"
        stroke="currentColor"
        strokeOpacity="0.08"
        strokeWidth="1"
      />
      <line
        x1="60"
        y1="50"
        x2="93"
        y2="67.5"
        stroke="currentColor"
        strokeOpacity="0.08"
        strokeWidth="1"
      />
      <line
        x1="60"
        y1="50"
        x2="60"
        y2="85"
        stroke="currentColor"
        strokeOpacity="0.08"
        strokeWidth="1"
      />
      <line
        x1="60"
        y1="50"
        x2="27"
        y2="67.5"
        stroke="currentColor"
        strokeOpacity="0.08"
        strokeWidth="1"
      />
      <line
        x1="60"
        y1="50"
        x2="27"
        y2="32.5"
        stroke="currentColor"
        strokeOpacity="0.08"
        strokeWidth="1"
      />
      {/* Axis label dots */}
      <circle cx="60" cy="13" r="2" fill="currentColor" opacity="0.1" />
      <circle cx="95" cy="32.5" r="2" fill="currentColor" opacity="0.1" />
      <circle cx="95" cy="67.5" r="2" fill="currentColor" opacity="0.1" />
      <circle cx="60" cy="87" r="2" fill="currentColor" opacity="0.1" />
      <circle cx="25" cy="67.5" r="2" fill="currentColor" opacity="0.1" />
      <circle cx="25" cy="32.5" r="2" fill="currentColor" opacity="0.1" />
    </svg>
  );
}

/** Empty shield/certificate — used when no credentials earned. */
export function EmptyCredentialsIllustration({ className }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 120 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Shield outline (dashed) */}
      <path
        d="M60 12 L88 24 L88 52 C88 68 76 80 60 88 C44 80 32 68 32 52 L32 24 Z"
        stroke="currentColor"
        strokeOpacity="0.15"
        strokeWidth="2"
        strokeDasharray="4 3"
        fill="currentColor"
        fillOpacity="0.03"
      />
      {/* Inner shield */}
      <path
        d="M60 26 L78 34 L78 52 C78 63 71 72 60 78 C49 72 42 63 42 52 L42 34 Z"
        stroke="currentColor"
        strokeOpacity="0.08"
        strokeWidth="1"
        fill="none"
      />
      {/* Chain link icons (on-chain indicator) */}
      <ellipse
        cx="55"
        cy="50"
        rx="6"
        ry="4"
        stroke="currentColor"
        strokeOpacity="0.12"
        strokeWidth="1.5"
        fill="none"
        transform="rotate(-30 55 50)"
      />
      <ellipse
        cx="65"
        cy="50"
        rx="6"
        ry="4"
        stroke="currentColor"
        strokeOpacity="0.12"
        strokeWidth="1.5"
        fill="none"
        transform="rotate(-30 65 50)"
      />
      {/* Lock icon */}
      <rect
        x="55"
        y="60"
        width="10"
        height="8"
        rx="2"
        fill="currentColor"
        opacity="0.1"
      />
      <path
        d="M57 60 L57 56 C57 53.5 58.5 52 60 52 C61.5 52 63 53.5 63 56 L63 60"
        stroke="currentColor"
        strokeOpacity="0.12"
        strokeWidth="1.5"
        fill="none"
      />
    </svg>
  );
}

/** Empty completion list — used when no courses completed yet. */
export function EmptyHistoryIllustration({ className }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 120 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Checklist paper */}
      <rect
        x="30"
        y="12"
        width="60"
        height="76"
        rx="4"
        fill="currentColor"
        opacity="0.05"
        stroke="currentColor"
        strokeOpacity="0.12"
        strokeWidth="1.5"
      />
      {/* Header line */}
      <rect
        x="40"
        y="22"
        width="40"
        height="4"
        rx="1"
        fill="currentColor"
        opacity="0.1"
      />
      {/* Checklist items (unchecked) */}
      <rect
        x="40"
        y="36"
        width="6"
        height="6"
        rx="1"
        stroke="currentColor"
        strokeOpacity="0.15"
        strokeWidth="1.5"
        fill="none"
      />
      <rect
        x="52"
        y="37"
        width="28"
        height="3"
        rx="1"
        fill="currentColor"
        opacity="0.08"
      />
      <rect
        x="40"
        y="50"
        width="6"
        height="6"
        rx="1"
        stroke="currentColor"
        strokeOpacity="0.15"
        strokeWidth="1.5"
        fill="none"
      />
      <rect
        x="52"
        y="51"
        width="22"
        height="3"
        rx="1"
        fill="currentColor"
        opacity="0.08"
      />
      <rect
        x="40"
        y="64"
        width="6"
        height="6"
        rx="1"
        stroke="currentColor"
        strokeOpacity="0.15"
        strokeWidth="1.5"
        fill="none"
      />
      <rect
        x="52"
        y="65"
        width="26"
        height="3"
        rx="1"
        fill="currentColor"
        opacity="0.08"
      />
      {/* Pencil */}
      <line
        x1="92"
        y1="70"
        x2="80"
        y2="82"
        stroke="currentColor"
        strokeOpacity="0.15"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <polygon points="80,82 78,88 84,86" fill="currentColor" opacity="0.12" />
    </svg>
  );
}

/** Empty podium — used when leaderboard has no data. */
export function EmptyLeaderboardIllustration({ className }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 120 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Podium blocks */}
      <rect
        x="15"
        y="55"
        width="28"
        height="30"
        rx="2"
        fill="currentColor"
        opacity="0.08"
      />
      <rect
        x="46"
        y="40"
        width="28"
        height="45"
        rx="2"
        fill="currentColor"
        opacity="0.1"
      />
      <rect
        x="77"
        y="62"
        width="28"
        height="23"
        rx="2"
        fill="currentColor"
        opacity="0.06"
      />
      {/* Rank numbers */}
      <text
        x="29"
        y="73"
        textAnchor="middle"
        fill="currentColor"
        opacity="0.12"
        fontSize="14"
        fontWeight="bold"
      >
        2
      </text>
      <text
        x="60"
        y="60"
        textAnchor="middle"
        fill="currentColor"
        opacity="0.15"
        fontSize="14"
        fontWeight="bold"
      >
        1
      </text>
      <text
        x="91"
        y="77"
        textAnchor="middle"
        fill="currentColor"
        opacity="0.1"
        fontSize="14"
        fontWeight="bold"
      >
        3
      </text>
      {/* Absent person indicators (dashed circles) */}
      <circle
        cx="29"
        cy="42"
        r="8"
        stroke="currentColor"
        strokeOpacity="0.12"
        strokeWidth="1.5"
        strokeDasharray="3 2"
        fill="none"
      />
      <circle
        cx="60"
        cy="27"
        r="8"
        stroke="currentColor"
        strokeOpacity="0.15"
        strokeWidth="1.5"
        strokeDasharray="3 2"
        fill="none"
      />
      <circle
        cx="91"
        cy="49"
        r="8"
        stroke="currentColor"
        strokeOpacity="0.1"
        strokeWidth="1.5"
        strokeDasharray="3 2"
        fill="none"
      />
      {/* Question marks in circles */}
      <text
        x="29"
        y="46"
        textAnchor="middle"
        fill="currentColor"
        opacity="0.1"
        fontSize="10"
      >
        ?
      </text>
      <text
        x="60"
        y="31"
        textAnchor="middle"
        fill="currentColor"
        opacity="0.12"
        fontSize="10"
      >
        ?
      </text>
      <text
        x="91"
        y="53"
        textAnchor="middle"
        fill="currentColor"
        opacity="0.08"
        fontSize="10"
      >
        ?
      </text>
      {/* Floor line */}
      <rect
        x="10"
        y="85"
        width="100"
        height="2"
        rx="1"
        fill="currentColor"
        opacity="0.1"
      />
    </svg>
  );
}

/** Empty quest scroll — used when no daily quests available. */
export function EmptyQuestsIllustration({ className }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 120 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Scroll body */}
      <rect
        x="30"
        y="20"
        width="60"
        height="60"
        rx="3"
        fill="currentColor"
        opacity="0.05"
        stroke="currentColor"
        strokeOpacity="0.12"
        strokeWidth="1.5"
      />
      {/* Scroll top roll */}
      <ellipse
        cx="60"
        cy="20"
        rx="32"
        ry="5"
        fill="currentColor"
        opacity="0.08"
        stroke="currentColor"
        strokeOpacity="0.1"
        strokeWidth="1"
      />
      {/* Scroll bottom roll */}
      <ellipse
        cx="60"
        cy="80"
        rx="32"
        ry="5"
        fill="currentColor"
        opacity="0.08"
        stroke="currentColor"
        strokeOpacity="0.1"
        strokeWidth="1"
      />
      {/* Empty content lines (faded) */}
      <rect
        x="42"
        y="35"
        width="36"
        height="2"
        rx="1"
        fill="currentColor"
        opacity="0.06"
      />
      <rect
        x="42"
        y="43"
        width="28"
        height="2"
        rx="1"
        fill="currentColor"
        opacity="0.06"
      />
      <rect
        x="42"
        y="51"
        width="32"
        height="2"
        rx="1"
        fill="currentColor"
        opacity="0.06"
      />
      {/* Zzz (sleeping/rest) */}
      <text
        x="80"
        y="35"
        fill="currentColor"
        opacity="0.15"
        fontSize="10"
        fontWeight="bold"
      >
        z
      </text>
      <text
        x="86"
        y="28"
        fill="currentColor"
        opacity="0.12"
        fontSize="12"
        fontWeight="bold"
      >
        z
      </text>
      <text
        x="93"
        y="20"
        fill="currentColor"
        opacity="0.1"
        fontSize="14"
        fontWeight="bold"
      >
        z
      </text>
    </svg>
  );
}
