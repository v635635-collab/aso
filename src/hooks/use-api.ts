"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseApiOptions {
  revalidateOnFocus?: boolean;
  refreshInterval?: number;
}

interface UseApiResult<T> {
  data: T | null;
  error: Error | null;
  loading: boolean;
  mutate: () => Promise<void>;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<unknown>>();
const CACHE_TTL = 30_000;

async function apiFetch<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error?.message ?? `Request failed (${res.status})`);
  }
  const json = await res.json();
  if (json.success === false) {
    throw new Error(json.error?.message ?? "Request failed");
  }
  return json.data as T;
}

export function useApi<T>(
  url: string | null,
  options: UseApiOptions = {}
): UseApiResult<T> {
  const { revalidateOnFocus = true, refreshInterval } = options;
  const [data, setData] = useState<T | null>(() => {
    if (!url) return null;
    const cached = cache.get(url);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data as T;
    }
    return null;
  });
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(!data && !!url);
  const mountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    if (!url) return;
    try {
      setLoading(true);
      setError(null);
      const result = await apiFetch<T>(url);
      cache.set(url, { data: result, timestamp: Date.now() });
      if (mountedRef.current) {
        setData(result);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [url]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (url) fetchData();
  }, [url, fetchData]);

  useEffect(() => {
    if (!revalidateOnFocus || !url) return;
    const handleFocus = () => fetchData();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [revalidateOnFocus, url, fetchData]);

  useEffect(() => {
    if (!refreshInterval || !url) return;
    const id = setInterval(fetchData, refreshInterval);
    return () => clearInterval(id);
  }, [refreshInterval, url, fetchData]);

  return { data, error, loading, mutate: fetchData };
}

export function useApiMutation<TInput, TOutput>(
  url: string,
  method: "POST" | "PATCH" | "DELETE" = "POST"
): {
  trigger: (data?: TInput) => Promise<TOutput>;
  loading: boolean;
  error: Error | null;
} {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const trigger = useCallback(
    async (data?: TInput): Promise<TOutput> => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(url, {
          method,
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: data !== undefined ? JSON.stringify(data) : undefined,
        });
        const json = await res.json();
        if (!res.ok || json.success === false) {
          throw new Error(
            json.error?.message ?? `Request failed (${res.status})`
          );
        }
        return json.data as TOutput;
      } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [url, method]
  );

  return { trigger, loading, error };
}
