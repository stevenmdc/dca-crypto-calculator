'use client';

export function Logo() {
  return (
    <div className="flex items-center mb-4 ml-auto">
      <svg
        width="48"
        height="48"
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-white"
      >
        <rect
          x="6"
          y="6"
          width="36"
          height="36"
          rx="4"
          stroke="currentColor"
          strokeWidth="3"
          fill="none"
        />
        <text
          x="50%"
          y="50%"
          dominantBaseline="middle"
          textAnchor="middle"
          fontSize="12"
          fontWeight="bold"
          fill="currentColor"
        >
          DCA
        </text>
      </svg>
    </div>
  );
}