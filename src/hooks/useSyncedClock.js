import { useCallback, useEffect, useState } from 'react';
import { fetchTimeAnchor } from '../lib/timeApi.js';

function browserAnchor(status = 'fallback') {
  return {
    epochMs: Date.now(),
    receivedAtMs: Date.now(),
    source: 'browser clock',
    status,
    error: '',
  };
}

export function useSyncedClock(timeZone, showMilliseconds) {
  const [anchor, setAnchor] = useState(() => browserAnchor('loading'));
  const [nowMs, setNowMs] = useState(Date.now());

  const sync = useCallback(
    async (signal) => {
      setAnchor((current) => ({ ...current, status: 'loading', error: '' }));

      try {
        const nextAnchor = await fetchTimeAnchor(timeZone, signal);
        setAnchor({ ...nextAnchor, status: 'synced', error: '' });
      } catch (error) {
        if (signal?.aborted) {
          return;
        }

        setAnchor({
          ...browserAnchor('fallback'),
          error: error instanceof Error ? error.message : 'Unable to sync',
        });
      }
    },
    [timeZone],
  );

  useEffect(() => {
    const controller = new AbortController();
    sync(controller.signal);
    const resync = window.setInterval(() => sync(controller.signal), 5 * 60 * 1000);

    return () => {
      controller.abort();
      window.clearInterval(resync);
    };
  }, [sync]);

  useEffect(() => {
    const cadence = showMilliseconds ? 32 : 250;
    const tick = () => {
      setNowMs(anchor.epochMs + (Date.now() - anchor.receivedAtMs));
    };

    tick();
    const interval = window.setInterval(tick, cadence);
    return () => window.clearInterval(interval);
  }, [anchor, showMilliseconds]);

  return { nowMs, anchor, sync };
}
