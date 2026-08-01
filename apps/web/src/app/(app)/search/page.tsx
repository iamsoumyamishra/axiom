'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { apiGet } from '../../../lib/api';
import { useCursorFeed } from '../../../lib/useCursorFeed';
import { InfiniteScroll } from '../../../components/InfiniteScroll';
import { SearchBar } from '../../../features/search/SearchBar';
import { SearchResults } from '../../../features/search/SearchResults';
import {
  SearchFilters,
  type SearchFiltersValue,
} from '../../../features/search/SearchFilters';
import type { SearchMeta, SearchResult } from '../../../features/search/types';

function SearchContent() {
  const searchParams = useSearchParams();
  const [input, setInput] = useState('');
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFiltersValue>({});

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setQuery(q);
      setInput(q);
    }
  }, [searchParams]);

  const params = { q: query, ...filters };
  const enabled = query.trim().length > 0;

  const { items: results, meta, loading, loadingMore, error, loadMore } =
    useCursorFeed<SearchResult, SearchMeta>({
      scopeKey: JSON.stringify({ path: 'search', params }),
      pageSize: 20,
      enabled,
      fetcher: async (cursor, pageSize) => {
        const res = await apiGet<{ data: SearchResult[]; meta: SearchMeta }>('search', {
          q: params.q,
          cursor,
          pageSize: String(pageSize),
          category: params.category,
          tag: params.tag,
          projectId: params.projectId,
        });
        if (!res.success || !res.data) {
          throw new Error(res.error?.message ?? 'Search failed');
        }
        return res.data;
      },
    });

  const handleFiltersChange = (patch: SearchFiltersValue) => {
    setFilters((f) => ({ ...f, ...patch }));
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Search</h2>
      <SearchBar
        value={input}
        onChange={setInput}
        onSearch={setQuery}
        loading={loading}
      />
      <SearchFilters value={filters} onChange={handleFiltersChange} />
      {enabled && error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}
      {enabled && !meta && loading && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg">Searching…</p>
        </div>
      )}
      {enabled && meta && (
        <InfiniteScroll
          hasMore={meta.hasMore}
          loading={loading || loadingMore}
          onLoadMore={loadMore}
          endMessage=""
        >
          <SearchResults results={results} query={meta.query} tookMs={meta.tookMs} />
        </InfiniteScroll>
      )}
      {!enabled && !loading && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg mb-1">Ask anything</p>
          <p className="text-sm">
            Search across everything you&apos;ve saved using natural language.
          </p>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchContent />
    </Suspense>
  );
}
