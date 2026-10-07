import { Pause, Play, X } from 'lucide-react';
import { formatClock, type WritingTimer as Timer } from '../../hooks/useWritingTimer';

/** Small status-bar countdown; hidden until a timer is started. */
export function WritingTimer({ timer }: { timer: Timer }) {
  if (timer.status === 'off') return null;
  const done = timer.status === 'done';
  const progress = timer.durationMs ? 1 - timer.remainingMs / timer.durationMs : 0;

  return (
    <span className={`timer ${done ? 'is-done' : ''}`}>
      <svg className="timer-ring" viewBox="0 0 16 16" aria-hidden="true">
        <circle cx="8" cy="8" r="6.5" className="timer-track" />
        <circle cx="8" cy="8" r="6.5" className="timer-progress" style={{ strokeDashoffset: 40.84 * (1 - progress) }} />
      </svg>
      <span className="timer-text" role="timer" aria-live={done ? 'polite' : 'off'}>
        {done ? 'time ✿' : formatClock(timer.remainingMs)}
      </span>
      {!done && (
        <button
          type="button"
          className="status-x"
          aria-label={timer.status === 'running' ? 'Pause timer' : 'Resume timer'}
          data-tip={timer.status === 'running' ? 'Pause' : 'Resume'}
          onClick={timer.status === 'running' ? timer.pause : timer.resume}
        >
          {timer.status === 'running' ? <Pause size={10} strokeWidth={2.5} /> : <Play size={10} strokeWidth={2.5} />}
        </button>
      )}
      <button type="button" className="status-x" aria-label="Stop timer" data-tip="Stop" onClick={timer.stop}>
        <X size={11} strokeWidth={2} />
      </button>
    </span>
  );
}
