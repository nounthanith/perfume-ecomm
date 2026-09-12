"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface UseFetchOptions extends Omit<RequestInit, "body" | "cache"> {
  body?: Record<string, unknown> | FormData | string | null;
  params?: Record<string, string | number | boolean | undefined | null>;
  autoFetch?: boolean;
  cache?: boolean;
  staleTime?: number;
}

export interface UseFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  status: number | null;
  refetch: (nextUrl?: string, nextOptions?: UseFetchOptions) => Promise<T | null>;
}

interface CacheEntry {
  data: unknown;
  timestamp: number;
}

interface RunFetchContext {
  isCurrent: () => boolean;
  onLoadingChange: (loading: boolean) => void;
  onError: (error: string | null) => void;
  onStatus: (status: number | null) => void;
  onSuccess: (data: unknown) => void;
}

const requestCache = new Map<string, CacheEntry>();
const DEFAULT_STALE_TIME = 60_000;

async function runFetch(
  ctx: RunFetchContext,
  url: string,
  init: RequestInit,
  showLoader: boolean
): Promise<unknown | null> {
  if (showLoader) {
    ctx.onLoadingChange(true);
    ctx.onError(null);
  }

  try {
    const response = await fetch(url, init);

    if (!ctx.isCurrent()) return null;

    const result: unknown = await response.json().catch(() => null);

    if (!ctx.isCurrent()) return null;

    ctx.onStatus(response.status);

    if (!response.ok) {
      const message =
        result && typeof result === "object" && "error" in result
          ? String((result as { error: unknown }).error)
          : `Request failed with status ${response.status}`;
      ctx.onError(message);
      return null;
    }

    ctx.onSuccess(result);
    ctx.onError(null);
    return result;
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return null;
    }
    if (!ctx.isCurrent()) return null;
    ctx.onError(err instanceof Error ? err.message : "Something went wrong");
    return null;
  } finally {
    if (ctx.isCurrent()) ctx.onLoadingChange(false);
  }
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
  const cacheEnabled = options.cache !== false;
  const staleTime = options.staleTime ?? DEFAULT_STALE_TIME;
  const cacheKey = buildUrl(url, options.params);
  const cachedEntry = cacheEnabled ? requestCache.get(cacheKey) : undefined;

  const [data, setData] = useState<T | null>(
    cachedEntry !== undefined ? (cachedEntry.data as T) : null
  );
  const [loading, setLoading] = useState(
    cachedEntry === undefined && options.autoFetch !== false
  );
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<number | null>(null);

  const optionsKey = JSON.stringify(options);
  const urlRef = useRef(url);
  const optionsRef = useRef(options);
  const loadedKeyRef = useRef(cacheKey);
  const cacheEnabledRef = useRef(cacheEnabled);
  const cacheKeyRef = useRef(cacheKey);
  const abortRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    cacheEnabledRef.current = cacheEnabled;
    cacheKeyRef.current = cacheKey;
  });

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      requestIdRef.current += 1;
      abortRef.current?.abort();
    };
  }, []);

  const fetchData = useCallback(async (showLoader = true): Promise<T | null> => {
    const requestId = ++requestIdRef.current;
    const targetUrl = urlRef.current;
    const targetOptions = optionsRef.current;
    const {
      params,
      body,
      cache: cacheOption,
      staleTime: staleTimeOption,
      ...rest
    } = targetOptions;
    void cacheOption;
    void staleTimeOption;
    const { body: requestBody, json } = parseBody(body);

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const init: RequestInit = {
      ...rest,
      ...(requestBody !== undefined ? { body: requestBody } : {}),
      headers: {
        ...(json ? { "Content-Type": "application/json" } : {}),
        ...(rest.headers ?? {}),
      },
      signal: controller.signal,
    };

    const result = await runFetch(
      {
        isCurrent: () =>
          requestId === requestIdRef.current && mountedRef.current,
        onLoadingChange: setLoading,
        onError: setError,
        onStatus: setStatus,
        onSuccess: (result) => {
          if (cacheEnabledRef.current) {
            requestCache.set(cacheKeyRef.current, {
              data: result,
              timestamp: Date.now(),
            });
          }
          loadedKeyRef.current = cacheKeyRef.current;
          setData(result as T);
        },
      },
      buildUrl(targetUrl, params),
      init,
      showLoader
    );

    return result as T | null;
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

    const cachedEntry = cacheEnabled ? requestCache.get(cacheKey) : undefined;
    const showingThisKey = loadedKeyRef.current === cacheKey;

    if (showingThisKey && cachedEntry !== undefined) {
      if (Date.now() - cachedEntry.timestamp < staleTime) return;
      fetchData(false);
    } else {
      fetchData(true);
    }

    return () => {
      abortRef.current?.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheEnabled, cacheKey, fetchData, optionsKey, staleTime, url]);

  return { data, loading, error, status, refetch };
}