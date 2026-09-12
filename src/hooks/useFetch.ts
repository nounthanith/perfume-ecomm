"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface UseFetchOptions extends Omit<RequestInit, "body"> {
  body?: Record<string, unknown> | FormData | string | null;
  params?: Record<string, string | number | boolean | undefined | null>;
  autoFetch?: boolean;
}

export interface UseFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  status: number | null;
  refetch: (nextUrl?: string, nextOptions?: UseFetchOptions) => Promise<T | null>;
}

function buildUrl(url: string, params?: UseFetchOptions["params"]): string {
  if (!params) return url;

  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  }

  const qs = search.toString();
  if (!qs) return url;

  return url.includes("?") ? `${url}&${qs}` : `${url}?${qs}`;
}

function parseBody(body: UseFetchOptions["body"]): {
  body?: BodyInit;
  json: boolean;
} {
  if (body instanceof FormData) return { body, json: false };
  if (typeof body === "string") return { body, json: false };
  if (body != null) return { body: JSON.stringify(body), json: true };
  return { json: false };
}

export function useFetch<T = unknown>(
  url: string,
  options: UseFetchOptions = {}
): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(options.autoFetch !== false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<number | null>(null);

  const optionsKey = JSON.stringify(options);
  const urlRef = useRef(url);
  const optionsRef = useRef(options);
  const abortRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      requestIdRef.current += 1;
      abortRef.current?.abort();
    };
  }, []);

  const fetchData = useCallback(async (): Promise<T | null> => {
    const requestId = ++requestIdRef.current;
    const targetUrl = urlRef.current;
    const targetOptions = optionsRef.current;
    const { params, body, ...rest } = targetOptions;
    const { body: requestBody, json } = parseBody(body);

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(buildUrl(targetUrl, params), {
        ...rest,
        ...(requestBody !== undefined ? { body: requestBody } : {}),
        headers: {
          ...(json ? { "Content-Type": "application/json" } : {}),
          ...(rest.headers ?? {}),
        },
        signal: controller.signal,
      });

      if (requestId !== requestIdRef.current || !mountedRef.current) {
        return null;
      }

      const result: unknown = await response.json().catch(() => null);

      if (requestId !== requestIdRef.current || !mountedRef.current) {
        return null;
      }

      setStatus(response.status);

      if (!response.ok) {
        const message =
          result && typeof result === "object" && "error" in result
            ? String((result as { error: unknown }).error)
            : `Request failed with status ${response.status}`;
        setError(message);
        return null;
      }

      setData(result as T);
      setError(null);
      return result as T;
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return null;
      }
      if (requestId !== requestIdRef.current || !mountedRef.current) {
        return null;
      }
      setError(err instanceof Error ? err.message : "Something went wrong");
      return null;
    } finally {
      if (requestId === requestIdRef.current && mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  const refetch = useCallback(
    async (nextUrl?: string, nextOptions?: UseFetchOptions) => {
      if (nextUrl !== undefined) {
        urlRef.current = nextUrl;
        if (nextOptions) optionsRef.current = nextOptions;
      }
      return fetchData();
    },
    [fetchData]
  );

  useEffect(() => {
    urlRef.current = url;
    optionsRef.current = options;
    if (optionsRef.current.autoFetch === false) return;

    fetchData();

    return () => {
      abortRef.current?.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchData, url, optionsKey]);

  return { data, loading, error, status, refetch };
}