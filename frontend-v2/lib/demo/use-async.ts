'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { TransportError } from '@/lib/data';
import type { ApiResponse } from '@/lib/types';

export type AsyncState<T> =
  | { status: 'loading' }
  | { status: 'ready'; data: T }
  | { status: 'error'; error: string; details?: { field: string; message: string }[]; transport: boolean };

/**
 * Runs a scoped data call and exposes loading, ready and error as one state.
 * Transport failures and business failures are kept distinct, matching the two
 * failure channels the API actually has.
 */
export function useAsync<T>(run: () => Promise<ApiResponse<T>>) {
  const [state, setState] = useState<AsyncState<T>>({ status: 'loading' });
  const [nonce, setNonce] = useState(0);
  const runRef = useRef(run);
  runRef.current = run;

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
  }, [nonce]);

  const reload = useCallback(() => setNonce((value) => value + 1), []);
  return { state, reload };
}