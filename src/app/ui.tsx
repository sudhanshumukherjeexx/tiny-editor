import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';

export type PanelId =
  | 'mood'
  | 'theme'
  | 'settings'
  | 'export'
  | 'heading'
  | 'align'
  | 'highlight'
  | 'font'
  | 'more'
  | 'stamps'
  | 'link'
  | 'palette';

export interface Toast {
  id: number;
  message: string;
  tone: 'info' | 'success' | 'error';
}

interface UIContextValue {
  openPanel: PanelId | null;
  setOpenPanel: (id: PanelId | null) => void;
  togglePanel: (id: PanelId) => void;
  closePanel: () => void;
  toasts: Toast[];
  notify: (message: string, tone?: Toast['tone']) => void;
}

const UIContext = createContext<UIContextValue | null>(null);

/** Ephemeral UI state: which popover is open, and transient toasts. */
export function UIProvider({ children }: { children: ReactNode }) {
  const [openPanel, setOpenPanel] = useState<PanelId | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const togglePanel = useCallback((id: PanelId) => setOpenPanel((cur) => (cur === id ? null : id)), []);
  const closePanel = useCallback(() => setOpenPanel(null), []);

  const notify = useCallback((message: string, tone: Toast['tone'] = 'info') => {
    const id = nextId.current++;
    setToasts((list) => [...list.slice(-2), { id, message, tone }]);
    window.setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 2600);
  }, []);

  const value = useMemo(
    () => ({ openPanel, setOpenPanel, togglePanel, closePanel, toasts, notify }),
    [openPanel, togglePanel, closePanel, toasts, notify],
  );
  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI(): UIContextValue {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI must be used inside UIProvider');
  return ctx;
}
