// Universal, iframe-safe download helper for Windows EXE and Android APK

export function downloadFileBlob(blob: Blob, fileName: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.style.display = "none";
  a.href = url;
  a.download = fileName;
  a.rel = "noopener noreferrer";
  document.body.appendChild(a);
  a.click();

  // Keep the blob URL alive for 60 seconds so the browser's download manager
  // has plenty of time to finish writing the file to disk (prevents "Download failed" errors).
  setTimeout(() => {
    try {
      if (document.body.contains(a)) {
        document.body.removeChild(a);
      }
      window.URL.revokeObjectURL(url);
    } catch {}
  }, 60000);
}

export function triggerDirectDownload(url: string, fileName?: string) {
  // Method A: create a link element and trigger click
  const a = document.createElement("a");
  a.style.display = "none";
  a.href = url;
  if (fileName) {
    a.download = fileName;
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
  }, 5000);
}
