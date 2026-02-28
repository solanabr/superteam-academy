export function FlagUS({ className = "h-4 w-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 640 480"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g fillRule="evenodd">
        <g strokeWidth="1pt">
          <path
            fill="#bd3d44"
            d="M0 0h640v37H0zm0 73.9h640v37H0zm0 73.8h640v37H0zm0 73.8h640v37H0zm0 74h640v36.8H0zm0 73.7h640v37H0zm0 73.9h640v37H0z"
          />
          <path
            fill="#fff"
            d="M0 37h640v36.9H0zm0 73.8h640v36.9H0zm0 73.8h640v37H0zm0 73.9h640v37H0zm0 73.8h640v37H0zm0 73.8h640v37H0z"
          />
        </g>
        <path fill="#192f5d" d="M0 0h364.8v258.5H0z" />
        <path
          fill="#fff"
          d="m30.4 11 3.4 10.3h10.6l-8.6 6.3 3.3 10.3-8.7-6.4-8.6 6.3 3.3-10.2-8.6-6.3h10.7zm60.8 0 3.3 10.3h10.6l-8.6 6.3 3.3 10.3-8.6-6.4-8.7 6.3 3.3-10.2-8.5-6.3H88zm60.8 0 3.3 10.3H166l-8.6 6.3 3.3 10.3-8.7-6.4-8.6 6.3 3.3-10.2-8.6-6.3h10.7zm60.8 0 3.3 10.3h10.7l-8.7 6.3 3.3 10.3-8.6-6.4-8.7 6.3 3.4-10.2-8.7-6.3h10.6zm60.8 0 3.3 10.3h10.6l-8.6 6.3 3.3 10.3-8.7-6.4-8.6 6.3 3.3-10.2-8.6-6.3h10.7zM60.8 37l3.3 10.2H74.7l-8.6 6.3 3.2 10.3-8.6-6.4-8.6 6.4 3.3-10.3-8.6-6.3h10.6zm60.8 0 3.3 10.2h10.6l-8.6 6.3 3.3 10.3-8.7-6.4-8.6 6.4 3.3-10.3-8.6-6.3h10.6zm60.8 0 3.3 10.2h10.6l-8.6 6.3 3.3 10.3-8.7-6.4-8.6 6.4 3.3-10.3-8.6-6.3H179zm60.8 0 3.4 10.2h10.6l-8.7 6.3 3.3 10.3-8.6-6.4-8.7 6.4 3.3-10.3-8.5-6.3h10.5zm60.8 0 3.3 10.2h10.6l-8.6 6.3 3.3 10.3-8.7-6.4-8.6 6.4 3.3-10.3-8.6-6.3h10.6z"
        />
      </g>
    </svg>
  );
}

export function FlagBR({ className = "h-4 w-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 640 480"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g strokeWidth="1pt">
        <rect width="640" height="480" fill="#229e45" rx="0" ry="0" />
        <path fill="#f8e509" d="M323.4 42 583.9 240 323.4 438 63 240z" />
        <circle cx="323.4" cy="240" r="112" fill="#2b49a3" />
        <path
          fill="#ffffef"
          d="M195.3 225.7a112 112 0 0 0-3 14.3c57.6-8.8 117.5 3.2 172.2 34.6a112 112 0 0 0 8.2-12.1c-55.6-30.8-116.7-43.2-177.4-36.8z"
        />
      </g>
    </svg>
  );
}

export function FlagES({ className = "h-4 w-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 640 480"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="640" height="480" fill="#c60b1e" />
      <rect width="640" height="240" y="120" fill="#ffc400" />
    </svg>
  );
}

export function FlagIN({ className = "h-4 w-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 640 480"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="640" height="160" fill="#f93" />
      <rect width="640" height="160" y="160" fill="#fff" />
      <rect width="640" height="160" y="320" fill="#128807" />
      <circle
        cx="320"
        cy="240"
        r="46"
        fill="none"
        stroke="#008"
        strokeWidth="5"
      />
      <circle cx="320" cy="240" r="6" fill="#008" />
      {[...Array(24)].map((_, i) => (
        <line
          key={i}
          x1="320"
          y1="240"
          x2={320 + 42 * Math.cos((i * 15 * Math.PI) / 180)}
          y2={240 + 42 * Math.sin((i * 15 * Math.PI) / 180)}
          stroke="#008"
          strokeWidth="1.5"
        />
      ))}
    </svg>
  );
}
