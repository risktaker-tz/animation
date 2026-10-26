'use client';

import { useSyncExternalStore } from 'react';

const emptySubscribe = () => () => undefined;

/**
 * true once the component tree is running on the client.
 * Used to avoid hydration mismatches for localStorage-backed state.
 */
export function useMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}
