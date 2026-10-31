import React from "react";

interface SapphireLogoProps {
  className?: string;
  size?: number;
  variant?: "badge" | "plain";
  src?: string;
}

/**
  * Sapphire Official Custom Logo (User Provided)
  */
export const SapphireLogo: React.FC<SapphireLogoProps> = ({
  className = "",
  size = 36,
  variant = "badge",
  src = "/sapphire_logo.png",
}) => {
  return (
    <div
      style={{ width: size, height: size }}
      className={`inline-flex items-center justify-center shrink-0 overflow-hidden ${
        variant === "badge"
          ? "rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 shadow-md border border-sky-500/30 p-0.5"
          : ""
      } ${className}`}
    >
      <img
        src={src}
        alt="Sapphire Logo"
        className="w-full h-full object-cover rounded-lg"
        onError={(e) => {
          (e.target as HTMLImageElement).src = "https://i.ibb.co/cSJdk808/icon.png";
        }}
      />
    </div>
  );
};
