import React, { useState } from "react";

interface SapphireLogoProps {
  className?: string;
  size?: number;
  variant?: "badge" | "plain";
}

/**
 * Sapphire Official Logo from https://i.ibb.co/cSJdk808/icon.png
 */
export const SapphireLogo: React.FC<SapphireLogoProps> = ({
  className = "",
  size = 36,
  variant = "badge",
}) => {
  const [imgError, setImgError] = useState(false);
  const logoUrl = "https://i.ibb.co/cSJdk808/icon.png";
  const localFallbackUrl = "/sapphire_logo.png";

  if (!imgError) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`inline-flex items-center justify-center shrink-0 overflow-hidden ${
          variant === "badge" ? "rounded-xl bg-white shadow-xs border border-stone-200/80 p-0.5" : ""
        } ${className}`}
      >
        <img
          src={logoUrl}
          alt="Sapphire Logo"
          style={{ width: "100%", height: "100%" }}
          className="object-contain"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            if (target.src !== window.location.origin + localFallbackUrl) {
              target.src = localFallbackUrl;
            } else {
              setImgError(true);
            }
          }}
        />
      </div>
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
    >
      {variant === "badge" && (
        <rect width="100" height="100" rx="24" fill="#FFFFFF" className="drop-shadow-xs" />
      )}
      <g transform={variant === "badge" ? "translate(12, 12) scale(0.76)" : ""}>
        <polygon points="20,10 40,32 15,38" fill="#111113" />
        <polygon points="80,10 85,38 60,32" fill="#111113" />
        <polygon points="50,22 62,35 50,48 38,35" fill="#111113" />
        <polygon points="40,32 50,22 38,35" fill="#1A1A1D" />
        <polygon points="60,32 62,35 50,22" fill="#1A1A1D" />
        <polygon points="15,38 38,35 48,50 25,62" fill="#111113" />
        <polygon points="85,38 75,62 52,50 62,35" fill="#111113" />
        <polygon points="10,50 25,62 14,68" fill="#111113" />
        <polygon points="90,50 86,68 75,62" fill="#111113" />
        <polygon points="38,35 50,48 48,50" fill="#2A2A2E" />
        <polygon points="62,35 52,50 50,48" fill="#2A2A2E" />
        <polygon points="50,52 65,66 50,86 35,66" fill="#111113" />
        <polygon points="25,62 35,66 50,86 32,78" fill="#1A1A1D" />
        <polygon points="75,62 68,78 50,86 65,66" fill="#1A1A1D" />
        <polygon points="50,88 56,95 44,95" fill="#111113" />
      </g>
    </svg>
  );
};
