const RESERVED = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])$/i;

/**
 * Turns a document title into a safe file name (without extension).
 * Keeps Unicode letters (日本語, 한국어 …) but strips characters that are
 * illegal on common file systems, control characters and leading dots.
 */
export function sanitizeFileName(title: string, fallback = 'Untitled'): string {
  let name = (title ?? '')
    .normalize('NFC')
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/[<>:"/\\|?*]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^[.\s]+/, '')
    .replace(/[.\s]+$/, '');

  if (RESERVED.test(name)) name = `${name}_`;

  // Keep names comfortably below the 255-byte limit.
  const chars = Array.from(name);
  if (chars.length > 80) name = chars.slice(0, 80).join('').trim();

  return name || fallback;
}

export function fileNameWithExtension(title: string, extension: string): string {
  const ext = extension.replace(/^\.+/, '');
  return `${sanitizeFileName(title)}.${ext}`;
}
