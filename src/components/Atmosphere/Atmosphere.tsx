import { memo, type CSSProperties } from 'react';

/** Deterministic pseudo-random values so petals don't reshuffle on render. */
function seeded(i: number, salt: number) {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

const PETALS = Array.from({ length: 11 }, (_, i) => ({
  left: `${Math.round(seeded(i, 1) * 100)}%`,
  duration: `${16 + Math.round(seeded(i, 2) * 14)}s`,
  delay: `-${Math.round(seeded(i, 3) * 30)}s`,
  size: `${8 + Math.round(seeded(i, 4) * 6)}px`,
  sway: `${18 + Math.round(seeded(i, 5) * 40)}px`,
}));

// Sparkles stay in the outer margins, well away from the text column.
const SPARKLES = Array.from({ length: 8 }, (_, i) => ({
  left: i % 2 ? `${4 + Math.round(seeded(i, 6) * 12)}%` : `${84 + Math.round(seeded(i, 7) * 12)}%`,
  top: `${12 + Math.round(seeded(i, 8) * 76)}%`,
  delay: `${Math.round(seeded(i, 9) * 9)}s`,
  duration: `${7 + Math.round(seeded(i, 10) * 6)}s`,
  glyph: i % 3 === 0 ? '✧' : '✦',
}));

/**
 * Decorative background layer: CSS-only animation, behind the paper,
 * pointer-events disabled, and hidden entirely under reduced motion.
 */
export const Atmosphere = memo(function Atmosphere({ petals, sparkles }: { petals: boolean; sparkles: boolean }) {
  if (!petals && !sparkles) return null;
  return (
    <div className="atmosphere" aria-hidden="true">
      {petals &&
        PETALS.map((p, i) => (
          <span
            key={`p${i}`}
            className="petal"
            style={{ left: p.left, animationDuration: p.duration, animationDelay: p.delay, '--sway': p.sway, '--size': p.size } as CSSProperties}
          >
            <span className="petal-shape" style={{ animationDuration: `calc(${p.duration} / 4)` }} />
          </span>
        ))}
      {sparkles &&
        SPARKLES.map((s, i) => (
          <span key={`s${i}`} className="sparkle" style={{ left: s.left, top: s.top, animationDelay: s.delay, animationDuration: s.duration }}>
            {s.glyph}
          </span>
        ))}
    </div>
  );
});
