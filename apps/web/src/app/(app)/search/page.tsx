'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { apiGet } from '../../../lib/api';
import { SearchBar } from '../../../features/search/SearchBar';
import { SearchResults } from '../../../features/search/SearchResults';

interface SearchResult {
  id: string;
  title: string | null;
  url: string | null;
  savedAt: string;
  distance: number | null;
}

function SearchContent() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [meta, setMeta] = useState<{ query: string; tookMs: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setQuery(q);
      void handleSearch(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleSearch = async (q: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await apiGet<{ data: SearchResult[]; meta: { query: string; tookMs: number } }>(
        'search',
        { q, limit: '20' },
      );
      if (res.success && res.data) {
        setResults(res.data.data);
        setMeta(res.data.meta);
      } else {
        setError(res.error?.message ?? 'Search failed');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Search</h2>
      <SearchBar
        value={query}
        onChange={setQuery}
        onSearch={handleSearch}
        loading={loading}
      />
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}
      {meta && (
        <SearchResults results={results} query={meta.query} tookMs={meta.tookMs} />
      )}
      {!meta && !loading && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg mb-1">Ask anything</p>
          <p className="text-sm">Search across everything you&apos;ve saved using natural language.</p>
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
