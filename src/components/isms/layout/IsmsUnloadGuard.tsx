'use client';

import { useEffect } from 'react';
import { useIsmsStore } from '@/store/ismsStore';

function flushWithKeepalive() {
  const state = useIsmsStore.getState();
  if (!state.isDirty) {
    return;
  }

  void state.flushWorkspace({ keepalive: true }).catch((error) => {
    console.error('Final ISMS workspace flush failed:', error);
  });
}

export default function IsmsUnloadGuard() {
  useEffect(() => {
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      const state = useIsmsStore.getState();
      if (!state.isDirty) {
        return;
      }

      flushWithKeepalive();
      event.preventDefault();
      event.returnValue = '';
    }

    function handlePageHide() {
      flushWithKeepalive();
    }

    function handleVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        flushWithKeepalive();
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handlePageHide);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return null;
}
