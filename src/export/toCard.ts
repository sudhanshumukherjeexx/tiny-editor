import type { ThemeColors } from '../themes/themeTypes';
import type { TodoItem } from '../todo/todos';

/**
 * Draws a to-do list as a small stationery card (PNG) with the Canvas API.
 * Everything happens in the browser; no libraries, no network.
 */
export interface CardOptions {
  title: string;
  dateLabel: string;
  items: TodoItem[];
  colors: ThemeColors;
  /** CSS font-family list for the list text (the document font). */
  fontFamily: string;
  /** CSS font-family list for small labels (the UI font). */
  uiFamily: string;
  brand: string;
  /** Square-cornered "console" styling instead of washi tape. */
  technical?: boolean;
}

const WIDTH = 1080;
const MIN_HEIGHT = 1080; // short lists still make a square, shareable card
const MAX_ITEMS = 40;

const CARD_X = 84;
const CARD_W = WIDTH - CARD_X * 2;
const PAD = 76;
const TEXT_X = CARD_X + PAD;
const TEXT_W = CARD_W - PAD * 2;

const TITLE_SIZE = 64;
const TITLE_LINE = 80;
const ITEM_SIZE = 38;
const ITEM_LINE = 56;
const BOX = 40;
const BOX_GAP = 26;
const ITEM_GAP = 30;

type Measure = (text: string) => number;

/**
 * Greedy line wrapping. Prefers breaking at spaces; falls back to breaking
 * anywhere (needed for long words and for Japanese/Chinese, which has none).
 */
export function wrapText(text: string, maxWidth: number, measure: Measure, maxLines = Infinity): string[] {
  const graphemes =
    typeof Intl !== 'undefined' && 'Segmenter' in Intl
      ? Array.from(new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text), (s) => s.segment)
      : Array.from(text);

  const lines: string[] = [];
  let line = '';
  for (const g of graphemes) {
    const candidate = line + g;
    if (!line || measure(candidate) <= maxWidth) {
      line = candidate;
      continue;
    }
    const space = line.lastIndexOf(' ');
    if (g !== ' ' && space > 0) {
      lines.push(line.slice(0, space));
      line = line.slice(space + 1) + g;
    } else {
      lines.push(line.trimEnd());
      line = g === ' ' ? '' : g;
    }
  }
  if (line.trim()) lines.push(line.trimEnd());

  if (lines.length <= maxLines) return lines;
  const kept = lines.slice(0, maxLines);
  let last = kept[maxLines - 1];
  while (last && measure(`${last}…`) > maxWidth) last = Array.from(last).slice(0, -1).join('');
  kept[maxLines - 1] = `${last.trimEnd()}…`;
  return kept;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function drawWashi(ctx: CanvasRenderingContext2D, colors: ThemeColors, cx: number, y: number) {
  const w = 250;
  const h = 54;
  ctx.save();
  ctx.translate(cx, y);
  ctx.rotate((-2.4 * Math.PI) / 180);
  ctx.beginPath();
  // Torn, zig-zag ends like the on-screen tape.
  const teeth = 6;
  ctx.moveTo(-w / 2, -h / 2);
  ctx.lineTo(w / 2, -h / 2);
  for (let i = 1; i <= teeth; i++) ctx.lineTo(w / 2 - (i % 2 ? 8 : 0), -h / 2 + (h * i) / teeth);
  ctx.lineTo(-w / 2, h / 2);
  for (let i = 1; i <= teeth; i++) ctx.lineTo(-w / 2 + (i % 2 ? 8 : 0), h / 2 - (h * i) / teeth);
  ctx.closePath();
  ctx.clip();
  ctx.fillStyle = colors.accent;
  ctx.globalAlpha = 0.16;
  ctx.fillRect(-w / 2, -h / 2, w, h);
  ctx.globalAlpha = 0.14;
  for (let x = -w; x < w; x += 30) {
    ctx.beginPath();
    ctx.moveTo(x, h / 2);
    ctx.lineTo(x + 15, h / 2);
    ctx.lineTo(x + 15 + h, -h / 2);
    ctx.lineTo(x + h, -h / 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawCheckbox(ctx: CanvasRenderingContext2D, colors: ThemeColors, x: number, y: number, done: boolean, technical: boolean) {
  const r = technical ? 4 : 12;
  roundRect(ctx, x, y, BOX, BOX, r);
  if (done) {
    ctx.fillStyle = colors.accent;
    ctx.fill();
    ctx.strokeStyle = colors.accentContrast;
    ctx.lineWidth = 4.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x + 10, y + 21);
    ctx.lineTo(x + 17, y + 28);
    ctx.lineTo(x + 30, y + 13);
    ctx.stroke();
  } else {
    ctx.fillStyle = colors.paper;
    ctx.fill();
    ctx.strokeStyle = colors.accent;
    ctx.lineWidth = 3;
    ctx.stroke();
  }
}

/** Renders the card and resolves with a PNG blob. */
export async function renderTodoCard(opts: CardOptions): Promise<Blob> {
  const { colors, technical = false } = opts;
  const titleFont = `${TITLE_SIZE}px ${opts.fontFamily}`;
  const itemFont = `${ITEM_SIZE}px ${opts.fontFamily}`;
  const labelFont = `500 24px ${opts.uiFamily}`;

  const allText = opts.title + opts.items.map((t) => t.text).join('');
  if (document.fonts?.load) {
    await Promise.all([document.fonts.load(titleFont, allText), document.fonts.load(labelFont, opts.dateLabel)]).catch(() => undefined);
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable');

  // Measure first so the card grows with the list.
  ctx.font = titleFont;
  const titleLines = wrapText(opts.title.trim() || 'To-do', TEXT_W, (s) => ctx.measureText(s).width, 3);
  ctx.font = itemFont;
  const shown = opts.items.slice(0, MAX_ITEMS);
  const hidden = opts.items.length - shown.length;
  const itemLines = shown.map((t) => wrapText(t.text.trim(), TEXT_W - BOX - BOX_GAP, (s) => ctx.measureText(s).width, 4));

  const headerH = (opts.dateLabel ? 52 : 0) + titleLines.length * TITLE_LINE + 64;
  const listH = itemLines.reduce((h, lines) => h + lines.length * ITEM_LINE + ITEM_GAP, 0) + (hidden ? ITEM_LINE : 0);
  const footerH = 120;
  const cardTop = 120;
  const cardH = Math.max(MIN_HEIGHT - cardTop * 2, PAD + headerH + listH + footerH);
  const height = cardTop * 2 + cardH;

  canvas.width = WIDTH;
  canvas.height = height;

  // Desk background with a faint dot grid.
  ctx.fillStyle = colors.background;
  ctx.fillRect(0, 0, WIDTH, height);
  ctx.fillStyle = colors.paperLine;
  for (let y = 18; y < height; y += 36) for (let x = 18; x < WIDTH; x += 36) ctx.fillRect(x, y, 3, 3);

  // The card.
  ctx.save();
  ctx.shadowColor = colors.shadow;
  ctx.shadowBlur = 70;
  ctx.shadowOffsetY = 26;
  roundRect(ctx, CARD_X, cardTop, CARD_W, cardH, technical ? 6 : 26);
  ctx.fillStyle = colors.paper;
  ctx.fill();
  ctx.restore();
  roundRect(ctx, CARD_X, cardTop, CARD_W, cardH, technical ? 6 : 26);
  ctx.strokeStyle = colors.paperBorder;
  ctx.lineWidth = 2;
  ctx.stroke();

  if (technical) {
    ctx.fillStyle = colors.accent;
    ctx.fillRect(WIDTH / 2 - 120, cardTop - 1, 240, 4);
  } else {
    drawWashi(ctx, colors, WIDTH / 2, cardTop);
  }

  ctx.textBaseline = 'alphabetic';
  let y = cardTop + PAD;

  if (opts.dateLabel) {
    ctx.font = labelFont;
    ctx.fillStyle = colors.textFaint;
    ctx.letterSpacing = '4px';
    ctx.fillText(opts.dateLabel.toUpperCase(), TEXT_X, y + 24);
    ctx.letterSpacing = '0px';
    y += 52;
  }

  ctx.font = titleFont;
  ctx.fillStyle = colors.text;
  for (const line of titleLines) {
    ctx.fillText(line, TEXT_X, y + TITLE_SIZE);
    y += TITLE_LINE;
  }

  // A small flower divider.
  y += 22;
  ctx.strokeStyle = colors.border;
  ctx.lineWidth = 2;
  ctx.setLineDash([2, 10]);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(TEXT_X, y);
  ctx.lineTo(TEXT_X + TEXT_W, y);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.font = `28px ${opts.uiFamily}`;
  ctx.textAlign = 'center';
  ctx.fillStyle = colors.paper;
  ctx.fillRect(WIDTH / 2 - 30, y - 18, 60, 36);
  ctx.fillStyle = colors.accent;
  ctx.fillText(technical ? '◇' : '✿', WIDTH / 2, y + 10);
  ctx.textAlign = 'left';
  y += 42;

  // Tasks.
  ctx.font = itemFont;
  shown.forEach((item, i) => {
    const lines = itemLines[i];
    drawCheckbox(ctx, colors, TEXT_X, y + (ITEM_LINE - BOX) / 2, item.done, technical);
    ctx.fillStyle = item.done ? colors.textFaint : colors.text;
    lines.forEach((line, li) => {
      const baseline = y + li * ITEM_LINE + ITEM_LINE / 2 + ITEM_SIZE * 0.34;
      const x = TEXT_X + BOX + BOX_GAP;
      ctx.fillText(line, x, baseline);
      if (item.done) {
        ctx.fillRect(x, baseline - ITEM_SIZE * 0.3, ctx.measureText(line).width, 2.5);
      }
    });
    y += lines.length * ITEM_LINE + ITEM_GAP;
  });
  if (hidden) {
    ctx.font = labelFont;
    ctx.fillStyle = colors.textMuted;
    ctx.fillText(`+ ${hidden} more`, TEXT_X + BOX + BOX_GAP, y + 30);
  }

  // Footer: progress and a tiny wordmark.
  const done = opts.items.filter((t) => t.done).length;
  const footY = cardTop + cardH - 70;
  const barW = 220;
  roundRect(ctx, TEXT_X, footY - 6, barW, 12, 6);
  ctx.fillStyle = colors.accentSoft;
  ctx.fill();
  if (done) {
    roundRect(ctx, TEXT_X, footY - 6, Math.max(12, (barW * done) / opts.items.length), 12, 6);
    ctx.fillStyle = colors.accent;
    ctx.fill();
  }
  ctx.font = labelFont;
  ctx.fillStyle = colors.textMuted;
  ctx.fillText(done === opts.items.length ? `all ${done} done ✿` : `${done} of ${opts.items.length} done`, TEXT_X + barW + 24, footY + 9);
  ctx.textAlign = 'right';
  ctx.fillStyle = colors.textFaint;
  ctx.fillText(`✿ ${opts.brand}`, TEXT_X + TEXT_W, footY + 9);
  ctx.textAlign = 'left';

  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('PNG encoding failed'))), 'image/png'));
}
