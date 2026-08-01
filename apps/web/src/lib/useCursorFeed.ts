'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { CursorMeta } from './cursor';

export interface CursorFeedConfig<T, M extends CursorMeta = CursorMeta> {
  fetcher: (
    cursor: string | undefined,
    pageSize: number,
  ) => Promise<{ data: T[]; meta: M }>;
  scopeKey: string;
  pageSize?: number;
  enabled?: boolean;
}

export function useCursorFeed<T extends { id: string }, M extends CursorMeta = CursorMeta>(
  config: CursorFeedConfig<T, M>,
) {
  const { fetcher, scopeKey, pageSize = 20, enabled = true } = config;

  const [items, setItems] = useState<T[]>([]);
  const [meta, setMeta] = useState<M | null>(null);
  const [loading, setLoading] = useState(() => enabled);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const cursorRef = useRef<string | null>(null);
  const loadingMoreRef = useRef(false);

  useEffect(() => {
    if (!enabled) {
      setItems([]);
      setMeta(null);
      setLoading(false);
      setLoadingMore(false);
      setError('');
      return;
    }

    let cancelled = false;
    cursorRef.current = null;
    setLoading(true);
    setError('');

    fetcherRef
      .current(undefined, pageSize)
      .then((res) => {
        if (cancelled) return;
        setItems(res.data);
        setMeta(res.meta);
        cursorRef.current = res.meta.nextCursor;
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load');
        setMeta(null);
        setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [scopeKey, pageSize, enabled, refreshKey]);

  const loadMore = useCallback(async () => {
    if (loadingMoreRef.current) return;
    if (!cursorRef.current) return;

    loadingMoreRef.current = true;
    setLoadingMore(true);
    setError('');
    try {
      const res = await fetcherRef.current(cursorRef.current, pageSize);
      setItems((prev) => {
        const seen = new Set(prev.map((x) => x.id));
        return [...prev, ...res.data.filter((x) => !seen.has(x.id))];
      });
      setMeta(res.meta);
      cursorRef.current = res.meta.nextCursor;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more');
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [pageSize]);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((x) => x.id !== id));
    setMeta((m) => {
      if (!m) return m;
      const total = m.total !== undefined && m.total > 0 ? m.total - 1 : undefined;
      return { ...m, total };
    });
  }, []);

  return { items, meta, loading, loadingMore, error, loadMore, refresh, removeItem };
}
