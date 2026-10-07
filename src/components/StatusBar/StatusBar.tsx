import type { ReactNode } from 'react';
import { Lock, X } from 'lucide-react';
import { COPY } from '../../app/copy';
import { formatNumber, type TextStats } from '../../utils/textStats';

interface StatusBarProps {
  stats: TextStats;
  /** Show the gentle "export before you go" reminder. */
  showNudge: boolean;
  onNudgeExport: () => void;
  onNudgeDismiss: () => void;
  goal: ReactNode;
  timer: ReactNode;
  flower: boolean;
  /** Shown instead of word statistics (e.g. task counts for a to-do list). */
  summary?: string;
}

export function StatusBar({ stats, showNudge, onNudgeExport, onNudgeDismiss, goal, timer, flower, summary }: StatusBarProps) {
  const words = `${formatNumber(stats.words)} ${stats.words === 1 ? 'word' : 'words'}`;
  return (
    <footer className="status-bar">
      <div className="status-left">
        {summary ? (
          <span className="stat">{summary}</span>
        ) : (
          <>
            <span className="stat" aria-live="off">
              {words}
            </span>
            <span className="stat-sep hide-sm" aria-hidden="true">
              ·
            </span>
            <span className="stat hide-sm">{formatNumber(stats.characters)} characters</span>
            <span className="stat-sep hide-md" aria-hidden="true">
              ·
            </span>
            <span className="stat hide-md">{stats.readingMinutes} min read</span>
          </>
        )}

        {showNudge && (
          <span className="nudge" role="status">
            <span className="hide-sm">You have {formatNumber(stats.words)} temporary words.</span>
            <button type="button" className="nudge-btn" onClick={onNudgeExport}>
              Export
            </button>
            <button type="button" className="status-x" aria-label="Dismiss reminder" onClick={onNudgeDismiss}>
              <X size={11} strokeWidth={2} />
            </button>
          </span>
        )}
      </div>

      <div className="status-right">
        {goal}
        {timer}
        {flower && (
          <span className="kawaii-flower" aria-hidden="true">
            ✿
          </span>
        )}
        <span className="temp-indicator" tabIndex={0} data-tip={COPY.temporaryTip} aria-label={`Temporary document. ${COPY.temporaryTip}`}>
          <span className="temp-dot" aria-hidden="true" />
          <span>
            <span className="hide-sm">{COPY.temporary} document</span>
            <span className="show-sm">{COPY.temporary}</span>
          </span>
        </span>
        <span className="private-badge hide-md" tabIndex={0} data-tip={COPY.privateTip} aria-label={`${COPY.privateByDesign}. ${COPY.privateTip}`}>
          <Lock size={11} strokeWidth={2} aria-hidden="true" />
          {COPY.privateByDesign}
        </span>
      </div>
    </footer>
  );
}
