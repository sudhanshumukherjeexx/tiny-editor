import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { useIsMobile } from '../../hooks/useMediaQuery';

type Anchor = RefObject<HTMLElement | null> | (() => DOMRect | null);

interface PopoverProps {
  open: boolean;
  onClose: () => void;
  anchor: Anchor;
  label: string;
  children: ReactNode;
  align?: 'start' | 'center' | 'end';
  className?: string;
  /** Render as a bottom sheet on phones (default true). */
  sheetOnMobile?: boolean;
  /** Move focus into the panel when it opens (default true). */
  autoFocus?: boolean;
  role?: 'dialog' | 'menu';
}

const MARGIN = 8;

function anchorRect(anchor: Anchor): DOMRect | null {
  return typeof anchor === 'function' ? anchor() : (anchor.current?.getBoundingClientRect() ?? null);
}

/**
 * A small positioned panel rendered in a portal so it is never clipped by
 * scrolling toolbars. Closes on outside pointer-down and Escape.
 */
export function Popover({
  open,
  onClose,
  anchor,
  label,
  children,
  align = 'start',
  className = '',
  sheetOnMobile = true,
  autoFocus = true,
  role = 'dialog',
}: PopoverProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const asSheet = sheetOnMobile && isMobile;
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const latest = useRef({ anchor, onClose });
  latest.current = { anchor, onClose };

  useLayoutEffect(() => {
    if (!open || asSheet) return;
    let frame = 0;
    const place = () => {
      const rect = anchorRect(latest.current.anchor);
      const panel = panelRef.current;
      if (!rect || !panel) return;
      const { offsetWidth: w, offsetHeight: h } = panel;
      let left = align === 'start' ? rect.left : align === 'end' ? rect.right - w : rect.left + rect.width / 2 - w / 2;
      left = Math.min(Math.max(MARGIN, left), window.innerWidth - w - MARGIN);
      let top = rect.bottom + 6;
      if (top + h > window.innerHeight - MARGIN && rect.top - h - 6 > MARGIN) top = rect.top - h - 6;
      setPos((p) => (p && p.top === top && p.left === left ? p : { top, left }));
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(place);
    };
    place();
    const observer = new ResizeObserver(schedule);
    if (panelRef.current) observer.observe(panelRef.current);
    window.addEventListener('resize', schedule);
    window.addEventListener('scroll', schedule, true);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('resize', schedule);
      window.removeEventListener('scroll', schedule, true);
    };
  }, [open, align, asSheet]);

  useEffect(() => {
    if (!open) {
      setPos(null);
      return;
    }
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      const { anchor: a, onClose: close } = latest.current;
      if (panelRef.current?.contains(target)) return;
      if (typeof a !== 'function' && a.current?.contains(target)) return;
      close();
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    const frame = autoFocus ? requestAnimationFrame(() => panelRef.current?.focus({ preventScroll: true })) : 0;
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('pointerdown', onPointerDown, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      onClose();
      if (typeof anchor !== 'function') anchor.current?.focus();
    }
  };

  return createPortal(
    <>
      {asSheet && <div className="sheet-backdrop" onPointerDown={onClose} aria-hidden="true" />}
      <div
        ref={panelRef}
        role={role}
        aria-label={label}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        className={`popover ${asSheet ? 'is-sheet' : ''} ${className}`}
        style={asSheet ? undefined : { top: pos?.top ?? -9999, left: pos?.left ?? -9999, visibility: pos ? 'visible' : 'hidden' }}
      >
        {asSheet && <div className="sheet-grip" aria-hidden="true" />}
        {children}
      </div>
    </>,
    document.body,
  );
}
