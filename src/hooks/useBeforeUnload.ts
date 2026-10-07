import { useEffect } from 'react';

/** Asks the browser to confirm before leaving while `when` is true. */
export function useBeforeUnload(when: boolean): void {
  useEffect(() => {
    if (!when) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // Required by some browsers to show the native prompt.
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [when]);
}
