import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { formatNumber } from '../../utils/textStats';

interface WritingGoalProps {
  words: number;
  goal: number;
  onClear: () => void;
  celebrate: boolean;
}

/** `327 / 500` with a thin pastel bar; a tiny petal burst on completion. */
export function WritingGoal({ words, goal, onClear, celebrate }: WritingGoalProps) {
  const reached = words >= goal;
  const pct = Math.min(100, Math.round((words / goal) * 100));
  const [burst, setBurst] = useState(false);
  const wasReached = useRef(reached);

  useEffect(() => {
    if (reached && !wasReached.current && celebrate) {
      setBurst(true);
      const id = window.setTimeout(() => setBurst(false), 1600);
      wasReached.current = reached;
      return () => window.clearTimeout(id);
    }
    wasReached.current = reached;
  }, [reached, celebrate]);

  return (
    <span className={`goal ${reached ? 'is-reached' : ''}`}>
      <span
        className="goal-meter"
        role="progressbar"
        aria-label="Word goal"
        aria-valuemin={0}
        aria-valuemax={goal}
        aria-valuenow={Math.min(words, goal)}
        aria-valuetext={`${words} of ${goal} words`}
      >
        <span className="goal-fill" style={{ width: `${pct}%` }} />
      </span>
      <span className="goal-text">
        {reached && <span aria-hidden="true">✓ </span>}
        {formatNumber(words)} / {formatNumber(goal)}
      </span>
      <button type="button" className="status-x" aria-label="Clear word goal" data-tip="Clear goal" onClick={onClear}>
        <X size={11} strokeWidth={2} />
      </button>
      {burst && (
        <span className="goal-burst" aria-hidden="true">
          {Array.from({ length: 10 }, (_, i) => (
            <span key={i} style={{ '--i': i } as React.CSSProperties}>
              {i % 2 ? '✿' : '❀'}
            </span>
          ))}
        </span>
      )}
    </span>
  );
}
