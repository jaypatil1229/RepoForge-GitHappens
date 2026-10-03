'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { TransportError } from '@/lib/data';
import type { AsyncState } from '@/lib/demo/use-async';
import type { ApiResponse } from '@/lib/types';

/**
 * The same contract as `useAsync`, but re-runs when the serialised dependency list
 * changes. Portal screens drive filters and pagination through `deps`, so a filter is
 * always a real query against the scoped data client rather than a client-side guess.
 */
export function useQuery<T>(run: () => Promise<ApiResponse<T>>, deps: readonly unknown[]) {
  const [state, setState] = useState<AsyncState<T>>({ status: 'loading' });
  const [nonce, setNonce] = useState(0);
  const runRef = useRef(run);
  runRef.current = run;
  const key = JSON.stringify(deps);

  useEffect(() => {
    let active = true;
    setState({ status: 'loading' });
    runRef
      .current()
      .then((response) => {
        if (!active) return;
        if (response.success && response.data !== undefined) {
          setState({ status: 'ready', data: response.data });
        } else {
          setState({
            status: 'error',
            error: response.error ?? 'The request could not be completed.',
            details: response.details,
            transport: false,
          });
        }
      })
      .catch((error: unknown) => {
        if (!active) return;
        setState({
          status: 'error',
          error:
            error instanceof TransportError
              ? error.message
              : 'Something went wrong while contacting the service.',
          transport: true,
        });
      });
    return () => {
      active = false;
    };
    // `key` captures every dependency that should trigger a refetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, nonce]);

  const reload = useCallback(() => setNonce((value) => value + 1), []);
  return { state, reload };
}