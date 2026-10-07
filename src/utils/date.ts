export type DateStyle = 'off' | 'english' | 'japanese';

export function formatDate(date: Date, style: DateStyle): string {
  if (style === 'japanese') return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  if (style === 'english') {
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }
  return '';
}
