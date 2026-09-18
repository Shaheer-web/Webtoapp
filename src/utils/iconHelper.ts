// Utility to extract website brand names, domains, and auto-detect website pictures/favicons

const KNOWN_BRANDS: Record<string, string> = {
  "youtube.com": "YouTube",
  "youtu.be": "YouTube",
  "music.youtube.com": "YouTube Music",
  "discord.com": "Discord",
  "discord.gg": "Discord",
  "github.com": "GitHub",
  "whatsapp.com": "WhatsApp",
  "web.whatsapp.com": "WhatsApp Web",
  "reddit.com": "Reddit",
  "twitter.com": "X (Twitter)",
  "x.com": "X",
  "twitch.tv": "Twitch",
  "spotify.com": "Spotify",
  "open.spotify.com": "Spotify",
  "netflix.com": "Netflix",
  "instagram.com": "Instagram",
  "facebook.com": "Facebook",
  "tiktok.com": "TikTok",
  "linkedin.com": "LinkedIn",
  "chatgpt.com": "ChatGPT",
  "chat.openai.com": "ChatGPT",
  "claude.ai": "Claude",
  "figma.com": "Figma",
  "notion.so": "Notion",
  "slack.com": "Slack",
  "telegram.org": "Telegram",
  "web.telegram.org": "Telegram Web",
  "pinterest.com": "Pinterest",
  "amazon.com": "Amazon",
  "wikipedia.org": "Wikipedia",
  "medium.com": "Medium",
  "trello.com": "Trello",
  "canva.com": "Canva",
  "soundcloud.com": "SoundCloud",
};

export function cleanHostname(urlOrDomain: string): string {
  try {
    let clean = urlOrDomain.trim();
    if (!clean) return "";
    if (!/^https?:\/\//i.test(clean)) {
      clean = "https://" + clean.replace(/^\/\//, "");
    }
    const url = new URL(clean);
    return url.hostname.toLowerCase().replace(/^www\./i, "");
  } catch {
    const stripped = urlOrDomain
      .trim()
      .replace(/^https?:\/\//i, "")
      .replace(/^www\./i, "")
      .split("/")[0]
      .split("?")[0]
      .split("#")[0]
      .toLowerCase();
    return stripped;
  }
}

export function getWebsiteFaviconUrl(urlOrDomain: string, sz = 256): string {
  const host = cleanHostname(urlOrDomain);
  if (!host || host.length < 3 || !host.includes(".")) {
    return "";
  }
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=${sz}`;
}

export function getWebsiteFallbackIcon(urlOrDomain: string): string {
  const host = cleanHostname(urlOrDomain);
  if (!host || host.length < 3 || !host.includes(".")) {
    return "";
  }
  return `https://icons.duckduckgo.com/ip3/${encodeURIComponent(host)}.ico`;
}

export function detectWebsiteBrand(input: string): {
  name: string;
  host: string;
  faviconUrl: string;
  fallbackFaviconUrl: string;
} | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const host = cleanHostname(trimmed);
  if (!host || !host.includes(".")) return null;

  // Check known brands table
  let brandName = KNOWN_BRANDS[host];

  // Try root domain if subdomain
  if (!brandName) {
    const parts = host.split(".");
    if (parts.length > 2) {
      const rootDomain = parts.slice(-2).join(".");
      brandName = KNOWN_BRANDS[rootDomain];
    }
  }

  // Fallback to capitalizing host
  if (!brandName) {
    const primaryPart = host.split(".")[0];
    brandName = primaryPart.charAt(0).toUpperCase() + primaryPart.slice(1);
  }

  return {
    name: brandName,
    host,
    faviconUrl: getWebsiteFaviconUrl(host, 256),
    fallbackFaviconUrl: getWebsiteFallbackIcon(host),
  };
}
