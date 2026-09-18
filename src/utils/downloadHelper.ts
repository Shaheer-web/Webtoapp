// Robust, single-action download helper for Windows (.exe) and Android (.apk)

/**
 * Triggers a clean, single-action download for an application file.
 * Avoids multiple competing triggers (e.g. parallel fetch + iframe + anchor) which cause
 * modern browsers (Chrome/Edge/Android) to show "Download canceled" or "Failed - Network error".
 */
export function triggerAppDownload(downloadUrl: string, fileName: string) {
  // If running inside an iframe (like AI Studio preview environment),
  // using target="_blank" allows the browser to open the download in top context,
  // where Content-Disposition: attachment immediately triggers the native browser download bar.
  const inIframe = window.self !== window.top;

  const a = document.createElement("a");
  a.href = downloadUrl;
  a.download = fileName;
  if (inIframe) {
    a.target = "_blank";
  }
  a.rel = "noopener noreferrer";
  document.body.appendChild(a);
  a.click();

  setTimeout(() => {
    try {
      if (document.body.contains(a)) {
        document.body.removeChild(a);
      }
    } catch {}
  }, 2000);
}

/**
 * Fallback direct trigger (used for direct clicks)
 */
export function triggerDirectDownload(url: string, fileName?: string) {
  triggerAppDownload(url, fileName || "download");
}

/**
 * Download a file from an existing Blob cleanly with proper revocation
 */
export function downloadFileBlob(blob: Blob, fileName: string, fallbackDirectUrl?: string) {
  try {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = fileName;
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      try {
        if (document.body.contains(a)) {
          document.body.removeChild(a);
        }
        window.URL.revokeObjectURL(url);
      } catch {}
    }, 45000);
  } catch (err) {
    console.warn("Blob download failed, using direct download URL:", err);
    if (fallbackDirectUrl) {
      triggerAppDownload(fallbackDirectUrl, fileName);
    }
  }
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand("copy");
    document.body.removeChild(textArea);
    return successful;
  } catch {
    return false;
  }
}
