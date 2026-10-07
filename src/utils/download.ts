/** Triggers a client-side download. Nothing leaves the browser. */
export function downloadFile(content: string | Blob, fileName: string, mimeType?: string): void {
  const blob = typeof content === 'string' ? new Blob([content], { type: `${mimeType ?? 'text/plain'};charset=utf-8` }) : content;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.rel = 'noopener';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Give the browser a moment to start the download before revoking.
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}
