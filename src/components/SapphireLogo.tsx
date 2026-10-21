import React from "react";

interface SapphireLogoProps {
  className?: string;
  size?: number;
  variant?: "badge" | "plain";
}

/**
 * Sapphire Origami Emblem matching the exact geometric mark
 * from the user's Sapphire AI screenshots.
 */
export const SapphireLogo: React.FC<SapphireLogoProps> = ({
  className = "",
  size = 36,
  variant = "badge",
}) => {
  const icon = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
    >
      {/* Outer squircle if badge */}
      {variant === "badge" && (
        <rect
          width="100"
          height="100"
          rx="24"
          fill="#FFFFFF"
          className="drop-shadow-xs"
        />
      )}

      {/* Stylized Origami Fox / Geometric Crystal Head */}
      <g transform={variant === "badge" ? "translate(12, 12) scale(0.76)" : ""}>
        {/* Left Ear */}
        <polygon
          points="20,10 40,32 15,38"
          fill="#111113"
        />
        {/* Right Ear */}
        <polygon
          points="80,10 85,38 60,32"
          fill="#111113"
        />

        {/* Center Forehead Diamond */}
        <polygon
          points="50,22 62,35 50,48 38,35"
          fill="#111113"
        />

        {/* Top Brow Connectors */}
        <polygon
          points="40,32 50,22 38,35"
          fill="#1A1A1D"
        />
        <polygon
          points="60,32 62,35 50,22"
          fill="#1A1A1D"
        />

        {/* Left Cheek / Temple */}
        <polygon
          points="15,38 38,35 48,50 25,62"
          fill="#111113"
        />
        {/* Right Cheek / Temple */}
        <polygon
          points="85,38 75,62 52,50 62,35"
          fill="#111113"
        />

        {/* Outer Left Jaw Flange */}
        <polygon
          points="10,50 25,62 14,68"
          fill="#111113"
        />
        {/* Outer Right Jaw Flange */}
        <polygon
          points="90,50 86,68 75,62"
          fill="#111113"
        />

        {/* Mid Face / Eye Bridge Facets */}
        <polygon
          points="38,35 50,48 48,50"
          fill="#2A2A2E"
        />
        <polygon
          points="62,35 52,50 50,48"
          fill="#2A2A2E"
        />

        {/* Lower Snout / Muzzle */}
        <polygon
          points="50,52 65,66 50,86 35,66"
          fill="#111113"
        />

        {/* Left Chin Flange */}
        <polygon
          points="25,62 35,66 50,86 32,78"
          fill="#1A1A1D"
        />
        {/* Right Chin Flange */}
        <polygon
          points="75,62 68,78 50,86 65,66"
          fill="#1A1A1D"
        />

        {/* Bottom Point Accent */}
        <polygon
          points="50,88 56,95 44,95"
          fill="#111113"
        />
      </g>
    </svg>
  );

  return <span className={`inline-flex items-center justify-center ${className}`}>{icon}</span>;
};
