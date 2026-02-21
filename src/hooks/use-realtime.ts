"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseSSEResult<T> {
  data: T[];
  lastEvent: T | null;
  connected: boolean;
  error: Error | null;
}

export function useSSE<T>(url: string | null): UseSSEResult<T> {
  const [data, setData] = useState<T[]>([]);
  const [lastEvent, setLastEvent] = useState<T | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const sourceRef = useRef<EventSource | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const retriesRef = useRef(0);

  const connect = useCallback(() => {
    if (!url) return;

    try {
      const es = new EventSource(url, { withCredentials: true });
      sourceRef.current = es;

      es.onopen = () => {
        setConnected(true);
        setError(null);
        retriesRef.current = 0;
      };

      es.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data) as T;
          setData((prev) => [...prev, parsed]);
          setLastEvent(parsed);
        } catch {
          // non-JSON event, skip
        }
      };

      es.onerror = () => {
        es.close();
        setConnected(false);

        const backoff = Math.min(1000 * 2 ** retriesRef.current, 30_000);
        retriesRef.current++;
        setError(new Error("Connection lost. Reconnecting…"));

        reconnectTimerRef.current = setTimeout(connect, backoff);
      };
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  }, [url]);

  useEffect(() => {
    connect();

    return () => {
      sourceRef.current?.close();
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    };
  }, [connect]);

  return { data, lastEvent, connected, error };
}
