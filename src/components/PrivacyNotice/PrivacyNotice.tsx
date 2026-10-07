import { X } from 'lucide-react';
import { COPY } from '../../app/copy';

/** First-visit note. Dismissal is kept in memory only, on purpose. */
export function PrivacyNotice({ onDismiss }: { onDismiss: () => void }) {
  return (
    <aside className="privacy-notice" aria-label="About this document">
      <span className="notice-stamp" aria-hidden="true">
        ✿
      </span>
      <p>
        <strong>{COPY.noticeTitle}</strong> <span>{COPY.noticeBody}</span>
      </p>
      <button type="button" className="notice-close" onClick={onDismiss} aria-label="Dismiss notice" data-tip="Got it">
        <X size={14} strokeWidth={2} />
      </button>
    </aside>
  );
}
