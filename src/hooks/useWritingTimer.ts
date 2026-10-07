import { useCallback, useEffect, useRef, useState } from 'react';

export type TimerStatus = 'off' | 'running' | 'paused' | 'done';

export interface WritingTimer {
  status: TimerStatus;
  remainingMs: number;
  durationMs: number;
  start: (minutes: number) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
}

/** A tab-local countdown. Uses an absolute end time so it never drifts. */
export function useWritingTimer(): WritingTimer {
  const [status, setStatus] = useState<TimerStatus>('off');
  const [durationMs, setDurationMs] = useState(0);
  const [remainingMs, setRemainingMs] = useState(0);
  const endAt = useRef(0);
  const pausedLeft = useRef(0);

  useEffect(() => {
    if (status !== 'running') return;
    const tick = () => {
      const left = Math.max(0, endAt.current - Date.now());
      setRemainingMs(left);
      if (left === 0) setStatus('done');
    };
    tick();
    const id = window.setInterval(tick, 500);
    return () => window.clearInterval(id);
  }, [status]);

  const start = useCallback((minutes: number) => {
    const ms = Math.round(Math.min(Math.max(minutes, 1), 240) * 60_000);
    endAt.current = Date.now() + ms;
    setDurationMs(ms);
    setRemainingMs(ms);
    setStatus('running');
  }, []);

  const pause = useCallback(() => {
    pausedLeft.current = Math.max(0, endAt.current - Date.now());
    setRemainingMs(pausedLeft.current);
    setStatus('paused');
  }, []);

  const resume = useCallback(() => {
    endAt.current = Date.now() + pausedLeft.current;
    setStatus('running');
  }, []);

  const stop = useCallback(() => setStatus('off'), []);

  return { status, remainingMs, durationMs, start, pause, resume, stop };
}

export function formatClock(ms: number): string {
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
