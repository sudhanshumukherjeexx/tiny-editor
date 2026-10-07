import { useEffect, useRef, useState } from 'react';

interface TipState {
  label: string;
  kbd?: string;
  x: number;
  y: number;
  below: boolean;
}

const HOVER_DELAY = 380;

/**
 * One tooltip for the whole app. Any element with `data-tip` (and optional
 * `data-kbd`) gets a tooltip on hover or keyboard focus. Rendered in a fixed
 * layer so tooltips are never clipped by scrolling containers. The visible
 * tooltip mirrors the element's aria-label, so it is hidden from AT.
 */
export function TooltipLayer() {
  const [tip, setTip] = useState<TipState | null>(null);
  const timer = useRef(0);
  const current = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const show = (el: HTMLElement) => {
      const rect = el.getBoundingClientRect();
      const below = rect.top < 56;
      setTip({
        label: el.dataset.tip ?? '',
        kbd: el.dataset.kbd,
        x: rect.left + rect.width / 2,
        y: below ? rect.bottom + 8 : rect.top - 8,
        below,
      });
    };

    const hide = () => {
      window.clearTimeout(timer.current);
      current.current = null;
      setTip(null);
    };

    const onOver = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return;
      const el = (event.target as HTMLElement).closest<HTMLElement>('[data-tip]');
      if (el === current.current) return;
      hide();
      if (!el || el.getAttribute('aria-expanded') === 'true') return;
      current.current = el;
      timer.current = window.setTimeout(() => show(el), HOVER_DELAY);
    };

    const onFocus = (event: FocusEvent) => {
      const el = (event.target as HTMLElement).closest?.<HTMLElement>('[data-tip]');
      hide();
      if (el && el.matches(':focus-visible')) {
        current.current = el;
        timer.current = window.setTimeout(() => show(el), 150);
      }
    };

    document.addEventListener('pointerover', onOver);
    document.addEventListener('focusin', onFocus);
    document.addEventListener('focusout', hide);
    document.addEventListener('pointerdown', hide, true);
    window.addEventListener('scroll', hide, true);
    window.addEventListener('keydown', hide);
    return () => {
      document.removeEventListener('pointerover', onOver);
      document.removeEventListener('focusin', onFocus);
      document.removeEventListener('focusout', hide);
      document.removeEventListener('pointerdown', hide, true);
      window.removeEventListener('scroll', hide, true);
      window.removeEventListener('keydown', hide);
    };
  }, []);

  if (!tip) return null;
  return (
    <div
      className={`tooltip ${tip.below ? 'is-below' : ''}`}
      style={{ left: Math.min(Math.max(tip.x, 70), window.innerWidth - 70), top: tip.y }}
      aria-hidden="true"
    >
      <span>{tip.label}</span>
      {tip.kbd && <kbd>{tip.kbd}</kbd>}
    </div>
  );
}
