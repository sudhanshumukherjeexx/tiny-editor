const SAFE_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:']);

/**
 * Normalises user-typed link input. Returns null for anything unsafe
 * (javascript:, data:, …) or obviously not a URL.
 */
export function normalizeUrl(input: string): string | null {
  const raw = input.trim();
  if (!raw || /\s/.test(raw)) return null;

  // Allow in-page anchors.
  if (/^#[\w-]+$/.test(raw)) return raw;

  let candidate = raw;
  if (/^[\w.+-]+@[\w-]+\.[\w.-]+$/.test(raw)) candidate = `mailto:${raw}`;
  else if (!/^[a-z][a-z0-9+.-]*:/i.test(raw)) candidate = `https://${raw}`;

  try {
    const url = new URL(candidate);
    if (!SAFE_PROTOCOLS.has(url.protocol)) return null;
    if ((url.protocol === 'http:' || url.protocol === 'https:') && !url.hostname.includes('.') && url.hostname !== 'localhost') {
      return null;
    }
    return url.href;
  } catch {
    return null;
  }
}

export function isSafeHref(href: unknown): href is string {
  if (typeof href !== 'string') return false;
  if (/^#[\w-]+$/.test(href)) return true;
  try {
    return SAFE_PROTOCOLS.has(new URL(href).protocol);
  } catch {
    return false;
  }
}
